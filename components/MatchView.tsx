
import React, { useState, useEffect, useRef } from 'react';
import { Team, MatchEvent, MatchStats, Player, PressingIntensity, DefensiveLine, PassingStyle, SquadStatus, Position } from '../types';
import { Play, Pause, FastForward, Activity, Battery, Trophy, AlertTriangle, Ambulance, RectangleVertical, Volume2, VolumeX, Shield, Users, Settings, ArrowRightLeft, UserMinus, UserPlus, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Pitch from './Pitch';

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
  // Engine State
  const [minute, setMinute] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); 
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [ballZone, setBallZone] = useState(0); 
  const [momentum, setMomentum] = useState(50);
  const [possessionCount, setPossessionCount] = useState({ home: 0, away: 0 });
  const [stats, setStats] = useState<MatchStats>({
    homeScore: 0, awayScore: 0, possession: 50, shotsHome: 0, shotsAway: 0, xgHome: 0, xgAway: 0
  });
  const [momentumData, setMomentumData] = useState<{minute: number, value: number}[]>([]);

  // Team Management State
  const [liveMyTeam, setLiveMyTeam] = useState<Team>(JSON.parse(JSON.stringify(myTeam))); // Deep copy for mutation
  const [activeTab, setActiveTab] = useState<'MATCH' | 'TACTICS' | 'SUBS'>('MATCH');
  const [subsMade, setSubsMade] = useState(0);
  const [selectedBenchPlayer, setSelectedBenchPlayer] = useState<string | null>(null);
  
  const commentaryEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- AUDIO ENGINE ---
  useEffect(() => {
    if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) audioCtxRef.current = new AudioContext();
    }
  }, []);

  const playSound = (type: 'GOAL' | 'WHISTLE' | 'KICK') => {
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
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
  };

  useEffect(() => {
    commentaryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  // --- HELPER FUNCTIONS ---
  const getRandomPlayer = (team: Team, positions: Position[]) => {
      const candidates = team.players.filter(p => p.squadStatus === SquadStatus.STARTING && positions.includes(p.position));
      if (candidates.length === 0) return team.players.find(p => p.squadStatus === SquadStatus.STARTING) || team.players[0];
      return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const getConditionDecay = (pressing: PressingIntensity) => {
      switch(pressing) {
          case PressingIntensity.LOW_BLOCK: return 0.05;
          case PressingIntensity.BALANCED: return 0.12;
          case PressingIntensity.HIGH_PRESS: return 0.25;
          case PressingIntensity.GEGENPRESS: return 0.40;
          default: return 0.12;
      }
  };

  // --- MATCH SIMULATION ENGINE ---
  const simulateMinute = () => {
      if (minute >= 90) {
          setIsPlaying(false);
          playSound('WHISTLE');
          handleMatchFinish();
          return;
      }

      // 1. Apply Fatigue
      const decay = getConditionDecay(liveMyTeam.tactics.pressing);
      const updatedPlayers = liveMyTeam.players.map(p => {
          if (p.squadStatus === SquadStatus.STARTING && p.condition > 0) {
              return { ...p, condition: Math.max(0, p.condition - (Math.random() * 0.5 + decay)) };
          }
          return p;
      });
      setLiveMyTeam(prev => ({ ...prev, players: updatedPlayers }));

      // 2. Calculate Tactical Power
      const myAvgCondition = updatedPlayers.filter(p => p.squadStatus === SquadStatus.STARTING).reduce((a,b) => a + b.condition, 0) / 11;
      const fatiguePenalty = (100 - myAvgCondition) / 2; // Up to -50 rating penalty if exhausted

      let homePower = (liveMyTeam.rating || 75) - (fatiguePenalty * 0.1); // Reduced penalty impact
      let awayPower = opponent.rating || 72;

      // Tactical Boosts
      if (liveMyTeam.tactics.pressing === PressingIntensity.GEGENPRESS && ballZone === ZONES.ATTACK) homePower += 5;
      if (liveMyTeam.tactics.defensiveLine === DefensiveLine.DEEP && ballZone === ZONES.DEFENSE) homePower += 5;
      if (liveMyTeam.tactics.passing === PassingStyle.DIRECT && ballZone === ZONES.MIDFIELD) homePower += 3;

      // 3. Engine Logic
      let nextZone = ballZone;
      let event: MatchEvent | null = null;
      let newMomentum = momentum + (homePower > awayPower ? 0.5 : -0.5);
      if (newMomentum > 100) newMomentum = 100; if (newMomentum < 0) newMomentum = 0;

      const roll = Math.random() * 100;
      
      // Possession Tracking
      if (ballZone > 0 || (ballZone === 0 && roll > 50)) setPossessionCount(p => ({ ...p, home: p.home + 1 }));
      else setPossessionCount(p => ({ ...p, away: p.away + 1 }));

      if (ballZone === ZONES.MIDFIELD) {
          // MIDFIELD BATTLE
          const myMid = getRandomPlayer(liveMyTeam, [Position.MID]);
          const oppMid = getRandomPlayer(opponent, [Position.MID]); // Simulated
          
          const myRoll = myMid.passing + (myMid.dribbling/2) + (momentum/10);
          const oppRoll = 75 + ((100-momentum)/10); // Generic opponent stat

          if (Math.random() * 200 < myRoll) {
              nextZone = ZONES.ATTACK;
              if (Math.random() > 0.7) {
                  setEvents(prev => [...prev, { minute: minute + 1, type: 'NORMAL', description: `${String(myMid.name)} finds space and drives forward!`, teamName: liveMyTeam.name }]);
              }
          } else {
              nextZone = ZONES.DEFENSE;
              setEvents(prev => [...prev, { minute: minute + 1, type: 'NORMAL', description: `${String(opponent.name)} wins the midfield battle.`, teamName: opponent.name }]);
          }
      } 
      else if (ballZone === ZONES.ATTACK) {
          // ATTACKING PHASE
          const myAtt = getRandomPlayer(liveMyTeam, [Position.FWD, Position.MID]);
          const chanceCreation = myAtt.dribbling + myAtt.passing + (liveMyTeam.tactics.passing === PassingStyle.DIRECT ? 10 : 0);
          
          if (Math.random() * 200 < chanceCreation) {
              // SHOT CREATED
              const shooter = getRandomPlayer(liveMyTeam, [Position.FWD]);
              const xg = 0.1 + (Math.random() * 0.5);
              setStats(s => ({ ...s, shotsHome: s.shotsHome + 1, xgHome: (s.xgHome || 0) + xg }));
              
              const shotQuality = shooter.shooting + (shooter.condition / 10) + (momentum / 10);
              const saveDifficulty = 70 + (Math.random() * 30); // Opponent GK

              if (shotQuality > saveDifficulty) {
                  // GOAL
                  event = { minute: minute + 1, type: 'GOAL', description: `GOAL!!! ${String(shooter.name)} fires it home!`, teamName: liveMyTeam.name };
                  setScore(s => ({ ...s, home: s.home + 1 }));
                  nextZone = ZONES.MIDFIELD;
                  newMomentum = 80;
                  playSound('GOAL');
              } else {
                  // MISS/SAVE
                  setEvents(prev => [...prev, { minute: minute + 1, type: 'CHANCE', description: `Close! ${String(shooter.name)} shoots but the keeper saves it.`, teamName: liveMyTeam.name }]);
                  nextZone = ZONES.DEFENSE; // Counter attack risk
                  newMomentum -= 10;
                  playSound('KICK');
              }
          } else {
              // Lost possession
              nextZone = ZONES.MIDFIELD;
              if (Math.random() > 0.8) setEvents(prev => [...prev, { minute: minute + 1, type: 'NORMAL', description: `Attack breaks down for ${String(liveMyTeam.name)}.`, teamName: liveMyTeam.name }]);
          }
      } 
      else if (ballZone === ZONES.DEFENSE) {
          // DEFENDING PHASE
          const myDef = getRandomPlayer(liveMyTeam, [Position.DEF, Position.GK]);
          const defRoll = myDef.defending + (myDef.physical/2) + (liveMyTeam.tactics.defensiveLine === DefensiveLine.DEEP ? 10 : 0);
          
          if (Math.random() * 180 < defRoll) {
              // TACKLE / INTERCEPTION
              nextZone = ZONES.MIDFIELD;
              setEvents(prev => [...prev, { minute: minute + 1, type: 'NORMAL', description: `Brilliant tackle by ${String(myDef.name)} to win the ball back.`, teamName: liveMyTeam.name }]);
              newMomentum += 5;
          } else {
              // OPPONENT CHANCE
              const xg = 0.1 + (Math.random() * 0.4);
              setStats(s => ({ ...s, shotsAway: s.shotsAway + 1, xgAway: (s.xgAway || 0) + xg }));
              
              if (Math.random() > 0.6) { // 40% goal chance if defense broken
                   event = { minute: minute + 1, type: 'GOAL', description: `GOAL! ${String(opponent.name)} scores!`, teamName: opponent.name };
                   setScore(s => ({ ...s, away: s.away + 1 }));
                   nextZone = ZONES.MIDFIELD;
                   newMomentum = 30;
                   playSound('GOAL');
              } else {
                   setEvents(prev => [...prev, { minute: minute + 1, type: 'CHANCE', description: `${String(opponent.name)} shoots wide! A let off for ${String(liveMyTeam.name)}.`, teamName: opponent.name }]);
                   nextZone = ZONES.MIDFIELD; // Goal kick
              }
          }
      }

      setMinute(m => m + 1);
      setBallZone(nextZone);
      setMomentum(newMomentum);
      setMomentumData(prev => [...prev, { minute: minute + 1, value: newMomentum }]);
      
      if (event) {
          setEvents(prev => [...prev, event]);
      }
  };

  useEffect(() => {
      let interval: any;
      if (isPlaying) {
          interval = setInterval(simulateMinute, speed === 1 ? 1000 : 100);
      }
      return () => clearInterval(interval);
  }, [isPlaying, minute, ballZone, momentum, speed, liveMyTeam]); // Dependencies updated

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
      onMatchEnd(finalStats, liveMyTeam.players);
  };

  // --- ACTIONS ---
  const handleSubstitution = (benchPlayerId: string, pitchPlayerId: string) => {
      if (subsMade >= 5) {
          alert("No substitutions remaining!");
          return;
      }

      const newPlayers = [...liveMyTeam.players];
      const benchIdx = newPlayers.findIndex(p => p.id === benchPlayerId);
      const pitchIdx = newPlayers.findIndex(p => p.id === pitchPlayerId);

      if (benchIdx !== -1 && pitchIdx !== -1) {
          // Swap status
          newPlayers[benchIdx].squadStatus = SquadStatus.STARTING;
          newPlayers[pitchIdx].squadStatus = SquadStatus.SUB;
          
          setLiveMyTeam(prev => ({ ...prev, players: newPlayers }));
          setSubsMade(prev => prev + 1);
          setEvents(prev => [...prev, { 
              minute, 
              type: 'SUBSTITUTION', 
              description: `SUB: ${String(newPlayers[benchIdx].name)} ON, ${String(newPlayers[pitchIdx].name)} OFF`, 
              teamName: liveMyTeam.name 
          }]);
          setSelectedBenchPlayer(null);
      }
  };

  const handleTacticChange = (key: keyof typeof liveMyTeam.tactics, value: string) => {
      setLiveMyTeam(prev => ({
          ...prev,
          tactics: { ...prev.tactics, [key]: value }
      }));
      setEvents(prev => [...prev, { minute, type: 'NORMAL', description: `Tactical Change: ${String(key)} set to ${String(value)}`, teamName: liveMyTeam.name }]);
  };

  const handleFormationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setLiveMyTeam(prev => ({ ...prev, formation: e.target.value }));
      setEvents(prev => [...prev, { minute, type: 'NORMAL', description: `Formation changed to ${String(e.target.value)}`, teamName: liveMyTeam.name }]);
  };

  const handlePitchPlayerClick = (player: Player) => {
      if (activeTab === 'SUBS' && selectedBenchPlayer) {
          handleSubstitution(selectedBenchPlayer, player.id);
      }
  };

  // --- RENDER ---
  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
        {/* TOP: Scoreboard */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 flex items-center justify-between shadow-md z-20">
            <div className="flex items-center gap-4 flex-1">
                <div className="text-right flex-1 hidden md:block">
                    <div className="font-bold text-white text-2xl">{myTeam.name}</div>
                    <div className="text-xs text-emerald-400 font-bold">{liveMyTeam.formation} • {liveMyTeam.tactics.playStyle}</div>
                </div>
                <div className="bg-slate-950 px-6 py-2 rounded-xl border border-slate-800 flex flex-col items-center min-w-[140px] shadow-inner">
                    <div className="text-4xl font-display font-bold text-white tracking-widest">{score.home} - {score.away}</div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></span>
                        <div className="text-sm font-mono text-emerald-400 font-bold">{minute}'</div>
                    </div>
                </div>
                <div className="text-left flex-1 hidden md:block">
                    <div className="font-bold text-white text-2xl">{opponent.name}</div>
                    <div className="text-xs text-red-400 font-bold">{opponent.formation} • Balanced</div>
                </div>
            </div>
        </div>

        {/* MIDDLE: Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
             
             {/* LEFT: Pitch & Stats */}
             <div className="flex-1 flex flex-col relative bg-slate-950 p-2 md:p-4 overflow-y-auto">
                 {activeTab === 'MATCH' && (
                     <>
                        <div className="w-full max-w-2xl mx-auto mb-4 relative">
                            {/* Pitch Container */}
                            <Pitch 
                                players={liveMyTeam.players} 
                                formation={liveMyTeam.formation} 
                                onPlayerClick={() => {}} 
                            />
                            {/* Ball Position Indicator */}
                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs font-bold text-white border border-white/10">
                                Ball: {ballZone === ZONES.ATTACK ? 'Attacking' : ballZone === ZONES.DEFENSE ? 'Defending' : 'Midfield'}
                            </div>
                        </div>

                        {/* Momentum & Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto w-full">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-40">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Match Momentum</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={momentumData}>
                                        <defs>
                                            <linearGradient id="colorMom" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <YAxis domain={[0, 100]} hide />
                                        <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorMom)" isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-center flex flex-col justify-center">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold">Possession</div>
                                    <div className="text-xl font-bold text-white">
                                        {Math.round((possessionCount.home / (possessionCount.home + possessionCount.away || 1)) * 100)}%
                                    </div>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-center flex flex-col justify-center">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold">Shots</div>
                                    <div className="text-xl font-bold text-white">{stats.shotsHome} ({stats.shotsAway})</div>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-center flex flex-col justify-center">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold">xG</div>
                                    <div className="text-xl font-bold text-white">{stats.xgHome.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                     </>
                 )}

                 {activeTab === 'TACTICS' && (
                     <div className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4">
                         <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                             <Settings className="text-emerald-500" /> Tactical Board
                         </h3>
                         
                         <div className="space-y-6">
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Formation</label>
                                 <select 
                                    value={liveMyTeam.formation} 
                                    onChange={handleFormationChange}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                 >
                                     {['4-4-2', '4-3-3', '3-5-2', '5-3-2', '4-2-3-1'].map(f => <option key={f} value={f}>{f}</option>)}
                                 </select>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                                     <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Pressing Intensity</label>
                                     <select 
                                        value={liveMyTeam.tactics.pressing}
                                        onChange={(e) => handleTacticChange('pressing', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                     >
                                         {Object.values(PressingIntensity).map(v => <option key={v} value={v}>{v.replace('_', ' ')}</option>)}
                                     </select>
                                     <p className="text-[10px] text-slate-500 mt-1">Higher intensity drains stamina faster.</p>
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Passing Style</label>
                                     <select 
                                        value={liveMyTeam.tactics.passing}
                                        onChange={(e) => handleTacticChange('passing', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                     >
                                         {Object.values(PassingStyle).map(v => <option key={v} value={v}>{v}</option>)}
                                     </select>
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Defensive Line</label>
                                     <select 
                                        value={liveMyTeam.tactics.defensiveLine}
                                        onChange={(e) => handleTacticChange('defensiveLine', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                     >
                                         {Object.values(DefensiveLine).map(v => <option key={v} value={v}>{v}</option>)}
                                     </select>
                                 </div>
                             </div>
                         </div>
                     </div>
                 )}

                 {activeTab === 'SUBS' && (
                     <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6 h-full animate-in fade-in slide-in-from-bottom-4">
                         {/* Bench List */}
                         <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto">
                             <div className="flex justify-between items-center mb-4">
                                 <h3 className="text-sm font-bold text-white uppercase">Bench</h3>
                                 <span className="text-xs font-bold text-emerald-400">{5 - subsMade} Subs Left</span>
                             </div>
                             <div className="space-y-2">
                                 {liveMyTeam.players.filter(p => p.squadStatus === SquadStatus.SUB).map(p => (
                                     <div 
                                        key={p.id}
                                        onClick={() => subsMade < 5 && setSelectedBenchPlayer(selectedBenchPlayer === p.id ? null : p.id)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${selectedBenchPlayer === p.id ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'}`}
                                     >
                                         <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs border border-white/10">{p.position}</div>
                                             <div>
                                                 <div className="font-bold text-sm">{p.name}</div>
                                                 <div className="text-[10px] opacity-70">OVR: {p.rating}</div>
                                             </div>
                                         </div>
                                         <div className="flex items-center gap-1">
                                             <Battery size={12} className={p.condition > 80 ? 'text-emerald-400' : 'text-yellow-400'} />
                                             <span className="text-xs font-mono">{Math.round(p.condition)}%</span>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>

                         {/* Pitch Selection View */}
                         <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                             <h3 className="text-sm font-bold text-white uppercase mb-4 text-center">
                                 {selectedBenchPlayer ? "Tap Player on Pitch to Swap" : "Select a Bench Player"}
                             </h3>
                             <div className="flex-1 relative">
                                 <Pitch 
                                    players={liveMyTeam.players} 
                                    formation={liveMyTeam.formation} 
                                    onPlayerClick={handlePitchPlayerClick}
                                    highlightedPlayerId={null} // We could highlight swap targets here
                                 />
                             </div>
                         </div>
                     </div>
                 )}
             </div>

             {/* RIGHT: Live Commentary (Desktop) or Bottom Sheet (Mobile) */}
             <div className="w-full md:w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 h-64 md:h-auto">
                 <div className="p-3 border-b border-slate-800 flex justify-between items-center shrink-0 bg-slate-950">
                     <h3 className="text-xs font-bold text-slate-400 uppercase">Live Feed</h3>
                     <div className="flex gap-2">
                         <button onClick={() => setSpeed(speed === 1 ? 0.1 : 1)} className="p-1.5 rounded hover:bg-slate-800 text-slate-400">
                             <FastForward size={16} className={speed < 1 ? 'text-emerald-400' : ''} />
                         </button>
                     </div>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-900">
                     {events.length === 0 && <div className="text-center text-slate-500 italic text-sm mt-10">Match starting...</div>}
                     {events.map((event, idx) => (
                         <div key={idx} className={`text-sm p-3 rounded-lg border animate-in fade-in slide-in-from-right-2 ${
                             event.type === 'GOAL' ? 'bg-emerald-500/10 border-emerald-500/30' : 
                             event.type === 'SUBSTITUTION' ? 'bg-blue-500/10 border-blue-500/30' :
                             'bg-slate-950 border-slate-800'
                         }`}>
                             <div className="flex items-center gap-2 mb-1">
                                 <span className="font-mono font-bold text-emerald-400">{event.minute}'</span>
                                 {event.type === 'GOAL' && <Trophy size={14} className="text-yellow-400" />}
                                 {event.type === 'SUBSTITUTION' && <ArrowRightLeft size={14} className="text-blue-400" />}
                                 {event.type === 'YELLOW_CARD' && <RectangleVertical size={14} className="text-yellow-500 fill-yellow-500" />}
                             </div>
                             <p className="text-slate-300 leading-relaxed text-xs">{event.description}</p>
                         </div>
                     ))}
                     <div ref={commentaryEndRef}></div>
                 </div>
             </div>
        </div>

        {/* BOTTOM: Controls & Tabs */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 shrink-0 z-30">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between max-w-6xl mx-auto w-full">
                
                {/* Tab Switcher */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 w-full md:w-auto">
                    <button 
                        onClick={() => { setActiveTab('MATCH'); setSelectedBenchPlayer(null); }}
                        className={`flex-1 px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${activeTab === 'MATCH' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Match
                    </button>
                    <button 
                        onClick={() => { setActiveTab('TACTICS'); setSelectedBenchPlayer(null); }}
                        className={`flex-1 px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${activeTab === 'TACTICS' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Tactics
                    </button>
                    <button 
                        onClick={() => { setActiveTab('SUBS'); }}
                        className={`flex-1 px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${activeTab === 'SUBS' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Subs
                    </button>
                </div>

                {/* Play Controls */}
                <div className="w-full md:w-auto flex justify-center">
                     {!isPlaying && minute < 90 ? (
                         <button onClick={() => setIsPlaying(true)} className="w-full md:w-48 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20">
                             <Play size={20} fill="currentColor" /> Resume
                         </button>
                     ) : isPlaying ? (
                         <button onClick={() => setIsPlaying(false)} className="w-full md:w-48 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                             <Pause size={20} fill="currentColor" /> Pause
                         </button>
                     ) : (
                         <button onClick={() => onMatchEnd(stats, liveMyTeam.players)} className="w-full md:w-48 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20">
                             Full Time <ChevronRight size={20} />
                         </button>
                     )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default MatchView;
