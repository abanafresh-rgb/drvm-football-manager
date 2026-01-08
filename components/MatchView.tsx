
import React, { useState, useEffect, useRef } from 'react';
import { Team, MatchEvent, MatchStats, Player, PressingIntensity, DefensiveLine } from '../types';
import { generateMatchCommentary } from '../services/geminiService';
import { Play, Pause, FastForward, Activity, Battery, BatteryWarning, Trophy, AlertTriangle, Ambulance, RectangleVertical, CircleDot, Volume2, VolumeX, Flag, Eye, ChevronsRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MatchViewProps {
  myTeam: Team;
  opponent: Team;
  onMatchEnd: (stats: MatchStats, updatedPlayers: Player[]) => void;
  soundEnabled?: boolean;
}

const ZONES = {
    DEFENSE: -1,
    MIDFIELD: 0,
    ATTACK: 1
};

const MatchView: React.FC<MatchViewProps> = ({ myTeam, opponent, onMatchEnd, soundEnabled = true }) => {
  const [minute, setMinute] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1 = normal (1sec/min), 0.2 = fast (200ms/min)
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [stats, setStats] = useState<MatchStats>({
    homeScore: 0,
    awayScore: 0,
    possession: 50,
    shotsHome: 0,
    shotsAway: 0,
    xgHome: 0,
    xgAway: 0
  });

  // Engine State
  const [ballZone, setBallZone] = useState(0); // -1 (Home Def), 0 (Mid), 1 (Home Att)
  const [momentum, setMomentum] = useState(50); // 0 (Away Dominance) to 100 (Home Dominance)
  const [possessionCount, setPossessionCount] = useState({ home: 0, away: 0 });

  // Live team state to track condition
  const [liveMyTeam, setLiveMyTeam] = useState<Team>(myTeam);
  
  const commentaryEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [momentumData, setMomentumData] = useState<{minute: number, value: number}[]>([]);

  useEffect(() => {
    if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            audioCtxRef.current = new AudioContext();
        }
    }
  }, []);

  const playSound = (type: 'GOAL' | 'WHISTLE' | 'ALERT' | 'KICK' | 'CROWD') => {
    if (!soundEnabled) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'GOAL') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
        osc.start(now);
        osc.stop(now + 1.5);
    } else if (type === 'WHISTLE') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.linearRampToValueAtTime(2500, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'KICK') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
  };

  useEffect(() => {
    commentaryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const getDecayFactor = (pressing: PressingIntensity) => {
      switch(pressing) {
          case PressingIntensity.LOW_BLOCK: return 0.05;
          case PressingIntensity.BALANCED: return 0.10;
          case PressingIntensity.HIGH_PRESS: return 0.15;
          case PressingIntensity.GEGENPRESS: return 0.22;
          default: return 0.10;
      }
  };

  const getTacticalBonus = (tactics: any, isAttacking: boolean) => {
      let bonus = 0;
      if (isAttacking) {
          if (tactics.passing === 'DIRECT') bonus += 5; 
          if (tactics.defensiveLine === 'HIGH') bonus += 5; // Sustain pressure
      } else {
          if (tactics.defensiveLine === 'DEEP') bonus += 5;
          if (tactics.pressing === 'GEGENPRESS') bonus += 5;
      }
      return bonus;
  }

  // --- THE MATCH ENGINE CORE ---
  const simulateMinute = () => {
      if (minute >= 90) {
          setIsPlaying(false);
          playSound('WHISTLE');
          handleMatchFinish();
          return;
      }

      // 1. Determine relative strengths based on ratings & tactics
      const homeRating = liveMyTeam.rating || 75;
      const awayRating = opponent.rating || 72;
      
      const homeAtt = homeRating + getTacticalBonus(liveMyTeam.tactics, true);
      const homeDef = homeRating + getTacticalBonus(liveMyTeam.tactics, false);
      const awayAtt = awayRating + (Math.random() * 10); // Simple CPU variance
      const awayDef = awayRating + (Math.random() * 5);

      // 2. Ball Movement Logic
      let nextZone = ballZone;
      let event: MatchEvent | null = null;
      let newMomentum = momentum;

      // Factors: Current Zone, Ratings, Momentum
      const roll = Math.random() * 100;
      
      // Momentum Decay towards 50
      if (newMomentum > 50) newMomentum -= 0.5;
      if (newMomentum < 50) newMomentum += 0.5;

      // Possession Tracking
      if (ballZone > 0 || (ballZone === 0 && roll > 50)) setPossessionCount(p => ({ ...p, home: p.home + 1 }));
      else setPossessionCount(p => ({ ...p, away: p.away + 1 }));

      if (ballZone === ZONES.MIDFIELD) {
          // Midfield Battle
          const homeMid = homeRating + (momentum / 10);
          const awayMid = awayRating + ((100-momentum) / 10);
          
          if (roll < (50 + (homeMid - awayMid))) {
              // Home advances
              nextZone = ZONES.ATTACK;
              setEvents(prev => [...prev, { minute: minute + 1, type: 'NORMAL', description: `${liveMyTeam.name} advances into the final third.`, teamName: liveMyTeam.name }]);
          } else {
              // Away advances
              nextZone = ZONES.DEFENSE;
              setEvents(prev => [...prev, { minute: minute + 1, type: 'NORMAL', description: `${opponent.name} breaks through midfield.`, teamName: opponent.name }]);
          }
      } 
      else if (ballZone === ZONES.ATTACK) {
          // Home Attacking
          const attackRoll = Math.random() * 100;
          const finishing = liveMyTeam.players.find(p => p.position === 'FWD')?.shooting || 70;
          
          if (attackRoll < 15) { // GOAL CHANCE
              const xg = 0.3 + (Math.random() * 0.4);
              setStats(s => ({ ...s, shotsHome: s.shotsHome + 1, xgHome: (s.xgHome || 0) + xg }));
              
              if (Math.random() * 100 < finishing / 2) {
                  // GOAL
                  event = { minute: minute + 1, type: 'GOAL', description: `GOAL! ${liveMyTeam.name} scores a fantastic goal!`, teamName: liveMyTeam.name };
                  setScore(s => ({ ...s, home: s.home + 1 }));
                  nextZone = ZONES.MIDFIELD; // Reset
                  newMomentum = 70;
              } else {
                   // MISS
                   setEvents(prev => [...prev, { minute: minute + 1, type: 'CHANCE', description: `Chance for ${liveMyTeam.name}! The shot goes wide.`, teamName: liveMyTeam.name }]);
                   nextZone = ZONES.DEFENSE; // Goal kick usually goes to other team or midfield
                   newMomentum -= 5;
              }
          } else if (attackRoll > 70) {
              // Lost possession
              nextZone = ZONES.MIDFIELD;
              setEvents(prev => [...prev, { minute: minute + 1, type: 'NORMAL', description: `${opponent.name} clears the danger.`, teamName: opponent.name }]);
          }
      } else if (ballZone === ZONES.DEFENSE) {
          // Away Attacking (Home Defending)
          const attackRoll = Math.random() * 100;
          if (attackRoll < 15) {
              const xg = 0.3 + (Math.random() * 0.4);
              setStats(s => ({ ...s, shotsAway: s.shotsAway + 1, xgAway: (s.xgAway || 0) + xg }));
              
              if (Math.random() * 100 < 40) { // CPU finishing
                  // GOAL
                   event = { minute: minute + 1, type: 'GOAL', description: `GOAL! ${opponent.name} finds the back of the net!`, teamName: opponent.name };
                   setScore(s => ({ ...s, away: s.away + 1 }));
                   nextZone = ZONES.MIDFIELD;
                   newMomentum = 30;
              } else {
                   setEvents(prev => [...prev, { minute: minute + 1, type: 'CHANCE', description: `Close call! ${opponent.name} nearly scores.`, teamName: opponent.name }]);
                   nextZone = ZONES.MIDFIELD;
                   newMomentum += 5;
              }
          } else if (attackRoll > 70) {
               // Home wins ball back
               nextZone = ZONES.MIDFIELD;
               setEvents(prev => [...prev, { minute: minute + 1, type: 'NORMAL', description: `${liveMyTeam.name} regains possession in defense.`, teamName: liveMyTeam.name }]);
          }
      }

      setMinute(m => m + 1);
      setBallZone(nextZone);
      setMomentum(newMomentum);
      setMomentumData(prev => [...prev, { minute: minute + 1, value: newMomentum }]);
      
      if (event) {
          setEvents(prev => [...prev, event]);
          playSound('GOAL');
      }
  };

  useEffect(() => {
      let interval: any;
      if (isPlaying) {
          interval = setInterval(simulateMinute, speed === 1 ? 1000 : 200);
      }
      return () => clearInterval(interval);
  }, [isPlaying, minute, ballZone, momentum, speed]);

  const handleMatchFinish = () => {
      const finalStats: MatchStats = {
          homeScore: score.home,
          awayScore: score.away,
          possession: Math.round((possessionCount.home / (possessionCount.home + possessionCount.away || 1)) * 100),
          shotsHome: stats.shotsHome,
          shotsAway: stats.shotsAway,
          xgHome: stats.xgHome,
          xgAway: stats.xgAway
      };
      
      // Update player conditions
      const decay = getDecayFactor(liveMyTeam.tactics.pressing);
      const updatedPlayers = liveMyTeam.players.map(p => {
          if (p.squadStatus === 'STARTING') {
              return { ...p, condition: Math.max(0, p.condition - (Math.random() * 5 + (decay * 100))) };
          }
          return p;
      });

      onMatchEnd(finalStats, updatedPlayers);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
        {/* Scoreboard Header */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
                <div className="text-right flex-1">
                    <div className="font-bold text-white text-lg md:text-2xl">{myTeam.name}</div>
                    <div className="flex gap-1 justify-end">
                        {Array.from({length: score.home}).map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-emerald-500"></div>)}
                    </div>
                </div>
                <div className="bg-slate-950 px-6 py-2 rounded-lg border border-slate-800 flex flex-col items-center min-w-[120px]">
                    <div className="text-3xl font-display font-bold text-white tracking-widest">{score.home} - {score.away}</div>
                    <div className="text-xs font-mono text-emerald-400 font-bold">{minute}'</div>
                </div>
                <div className="text-left flex-1">
                    <div className="font-bold text-white text-lg md:text-2xl">{opponent.name}</div>
                    <div className="flex gap-1 justify-start">
                        {Array.from({length: score.away}).map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-red-500"></div>)}
                    </div>
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
             {/* Left: Stats & Visuals */}
             <div className="w-2/3 p-6 flex flex-col gap-6 overflow-y-auto">
                 {/* Pitch Visualizer (Simplified Zone Based) */}
                 <div className="bg-pitch aspect-[2/1] rounded-xl border-4 border-slate-800 relative shadow-inner flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-black/20"></div>
                      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/30"></div>
                      <div className="absolute w-24 h-24 rounded-full border-2 border-white/30"></div>
                      
                      {/* Ball */}
                      <div className={`absolute w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)] transition-all duration-1000 ease-in-out z-10`}
                           style={{ 
                               left: ballZone === ZONES.DEFENSE ? '20%' : ballZone === ZONES.ATTACK ? '80%' : '50%',
                               top: Math.random() * 60 + 20 + '%'
                           }}
                      ></div>
                      
                      <div className="absolute bottom-4 left-4 text-xs font-bold text-white bg-black/50 px-2 py-1 rounded">
                          {ballZone === ZONES.ATTACK ? "Attacking" : ballZone === ZONES.DEFENSE ? "Defending" : "Midfield Battle"}
                      </div>
                 </div>

                 {/* Momentum Chart */}
                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-48">
                     <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Match Momentum</h4>
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={momentumData}>
                            <defs>
                                <linearGradient id="colorMom" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="minute" hide />
                            <YAxis domain={[0, 100]} hide />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                                itemStyle={{ color: '#10b981' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorMom)" />
                        </AreaChart>
                     </ResponsiveContainer>
                 </div>
                 
                 {/* Key Stats */}
                 <div className="grid grid-cols-3 gap-4">
                     <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                         <div className="text-xs text-slate-500 uppercase font-bold">Possession</div>
                         <div className="text-xl font-bold text-white">
                             {Math.round((possessionCount.home / (possessionCount.home + possessionCount.away || 1)) * 100)}%
                         </div>
                     </div>
                     <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                         <div className="text-xs text-slate-500 uppercase font-bold">Shots</div>
                         <div className="text-xl font-bold text-white">{stats.shotsHome} - {stats.shotsAway}</div>
                     </div>
                     <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                         <div className="text-xs text-slate-500 uppercase font-bold">xG</div>
                         <div className="text-xl font-bold text-white">{stats.xgHome.toFixed(2)} - {stats.xgAway.toFixed(2)}</div>
                     </div>
                 </div>
             </div>

             {/* Right: Commentary */}
             <div className="w-1/3 border-l border-slate-800 bg-slate-900/50 flex flex-col">
                 <div className="p-3 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0">
                     <h3 className="text-xs font-bold text-slate-400 uppercase">Live Feed</h3>
                     <div className="flex gap-2">
                         <button 
                            onClick={() => setSpeed(speed === 1 ? 0.2 : 1)} 
                            className={`p-1.5 rounded hover:bg-slate-800 ${speed !== 1 ? 'text-emerald-400' : 'text-slate-400'}`}
                         >
                             <FastForward size={16} />
                         </button>
                     </div>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                     {events.length === 0 && <div className="text-center text-slate-500 italic text-sm mt-10">Match starting...</div>}
                     {events.map((event, idx) => (
                         <div key={idx} className={`text-sm p-3 rounded-lg border ${event.type === 'GOAL' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800'} animate-in fade-in slide-in-from-right-2`}>
                             <div className="flex items-center gap-2 mb-1">
                                 <span className="font-mono font-bold text-emerald-400">{event.minute}'</span>
                                 {event.type === 'GOAL' && <Trophy size={14} className="text-yellow-400" />}
                                 {event.type === 'YELLOW_CARD' && <RectangleVertical size={14} className="text-yellow-500 fill-yellow-500" />}
                                 {event.type === 'RED_CARD' && <RectangleVertical size={14} className="text-red-500 fill-red-500" />}
                                 {event.type === 'INJURY' && <Ambulance size={14} className="text-red-400" />}
                             </div>
                             <p className="text-slate-300 leading-relaxed">{event.description}</p>
                         </div>
                     ))}
                     <div ref={commentaryEndRef}></div>
                 </div>
                 
                 {/* Controls */}
                 <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
                     {!isPlaying && minute < 90 ? (
                         <button onClick={() => setIsPlaying(true)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all">
                             <Play size={20} fill="currentColor" /> Resume Match
                         </button>
                     ) : isPlaying ? (
                         <button onClick={() => setIsPlaying(false)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all">
                             <Pause size={20} fill="currentColor" /> Pause
                         </button>
                     ) : (
                         <button onClick={() => onMatchEnd(stats, [])} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all">
                             Full Time - Continue <ChevronsRight size={20} />
                         </button>
                     )}
                 </div>
             </div>
        </div>
    </div>
  );
};

export default MatchView;
