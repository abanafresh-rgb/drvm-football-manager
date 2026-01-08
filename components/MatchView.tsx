
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

// Zone Logic: -1 (My Defense / Opp Attack), 0 (Midfield), 1 (My Attack / Opp Defense)
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
  const [possessionSide, setPossessionSide] = useState<'HOME' | 'AWAY'>('HOME');
  const [momentum, setMomentum] = useState(50);
  const [possessionCount, setPossessionCount] = useState({ home: 0, away: 0 });
  const [stats, setStats] = useState<MatchStats>({
    homeScore: 0, awayScore: 0, possession: 50, shotsHome: 0, shotsAway: 0, xgHome: 0, xgAway: 0
  });
  const [momentumData, setMomentumData] = useState<{minute: number, value: number}[]>([]);

  // Team Management State
  const [liveMyTeam, setLiveMyTeam] = useState<Team>(JSON.parse(JSON.stringify(myTeam))); 
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

  const playSound = (type: 'GOAL' | 'WHISTLE' | 'KICK' | 'CROWD') => {
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
  
  // Select player based on position strictness
  const getPlayersByPosition = (team: Team, positions: Position[]) => {
      return team.players.filter(p => p.squadStatus === SquadStatus.STARTING && positions.includes(p.position));
  };

  const getBestPlayerForAction = (team: Team, positions: Position[], stat: keyof Player) => {
      const candidates = getPlayersByPosition(team, positions);
      if (candidates.length === 0) return team.players[0]; // Fallback
      
      // Sort by relevant stat + random variance for realism
      return candidates.sort((a, b) => {
          const valA = (a[stat] as number) * (a.condition/100) + Math.random() * 20;
          const valB = (b[stat] as number) * (b.condition/100) + Math.random() * 20;
          return valB - valA;
      })[0];
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

  // Tactical Multipliers
  const getFormationBonus = (formation: string, zone: number) => {
      // Return a small multiplier based on player density in zones
      // Simplified density map
      const map: Record<string, number[]> = {
          '4-4-2': [4, 4, 2], // Def, Mid, Att
          '4-3-3': [4, 3, 3],
          '3-5-2': [3, 5, 2],
          '5-3-2': [5, 3, 2],
          '4-2-3-1': [4, 5, 1]
      };
      const density = map[formation] || [4,4,2];
      
      // Zone 0 = Midfield (index 1)
      if (zone === ZONES.MIDFIELD) return density[1] * 2;
      if (zone === ZONES.DEFENSE) return density[0] * 2;
      if (zone === ZONES.ATTACK) return density[2] * 2;
      return 0;
  };

  // --- MATCH SIMULATION ENGINE ---
  const simulateMinute = () => {
      if (minute >= 90) {
          setIsPlaying(false);
          playSound('WHISTLE');
          handleMatchFinish();
          return;
      }

      // 1. FATIGUE SYSTEM
      const decay = getConditionDecay(liveMyTeam.tactics.pressing);
      const updatedPlayers = liveMyTeam.players.map(p => {
          if (p.squadStatus === SquadStatus.STARTING && p.condition > 0) {
              return { ...p, condition: Math.max(0, p.condition - (Math.random() * 0.5 + decay)) };
          }
          return p;
      });
      setLiveMyTeam(prev => ({ ...prev, players: updatedPlayers }));

      // 2. STATE PREPARATION
      let newMomentum = momentum;
      let nextZone = ballZone;
      let nextPossession = possessionSide;
      let event: MatchEvent | null = null;

      // Stats Update helper
      const updateStats = (updates: Partial<MatchStats>) => setStats(prev => ({ ...prev, ...updates }));

      // Possession Counter
      if (possessionSide === 'HOME') setPossessionCount(p => ({ ...p, home: p.home + 1 }));
      else setPossessionCount(p => ({ ...p, away: p.away + 1 }));

      // --- TACTICAL RESOLUTION ---
      
      // MIDFIELD BATTLE (Zone 0)
      if (ballZone === ZONES.MIDFIELD) {
          const myBonus = getFormationBonus(liveMyTeam.formation, ZONES.MIDFIELD);
          const oppBonus = getFormationBonus(opponent.formation, ZONES.MIDFIELD); // Assume generic Opp formation usually

          const myMid = getBestPlayerForAction(liveMyTeam, [Position.MID], 'passing');
          const oppMid = getBestPlayerForAction(opponent, [Position.MID], 'defending'); // Opponent tries to stop us

          // Tactic: LONG BALL skips midfield contest but reduces control
          if (possessionSide === 'HOME' && liveMyTeam.tactics.passing === PassingStyle.LONG_BALL && Math.random() > 0.5) {
               nextZone = ZONES.ATTACK;
               setEvents(prev => [...prev, { minute: minute + 1, type: 'NORMAL', description: `${String(liveMyTeam.players.find(p=>p.position === Position.DEF)?.name || 'Defender')} launches a long ball forward!`, teamName: liveMyTeam.name }]);
          } 
          // Standard Midfield Play
          else {
              let homeStrength = (myMid.passing * 0.6 + myMid.dribbling * 0.4) + myBonus + (momentum / 10);
              let awayStrength = (oppMid.defending * 0.6 + oppMid.physical * 0.4) + oppBonus + ((100 - momentum) / 10);

              if (liveMyTeam.tactics.passing === PassingStyle.SHORT) homeStrength += 10; // Better retention
              if (liveMyTeam.tactics.pressing === PressingIntensity.HIGH_PRESS) awayStrength += 5; // Harder to pass vs press

              if (possessionSide === 'HOME') {
                  if (Math.random() * (homeStrength + awayStrength) < homeStrength) {
                      nextZone = ZONES.ATTACK; // Advance
                      // Flavor text
                      const action = Math.random() > 0.5 ? 'plays a beautiful through ball' : 'dribbles past his marker';
                      setEvents(prev => [...prev, { minute: minute + 1, type: 'NORMAL', description: `${String(myMid.name)} ${action}.`, teamName: liveMyTeam.name }]);
                  } else {
                      nextPossession = 'AWAY'; // Lost ball
                      setEvents(prev => [...prev, { minute: minute + 1, type: 'NORMAL', description: `${String(oppMid.name)} intercepts the pass.`, teamName: opponent.name }]);
                  }
              } else {
                  // Opponent has ball
                  if (Math.random() * (homeStrength + awayStrength) < awayStrength) {
                      nextZone = ZONES.DEFENSE; // They advance to my defense
                  } else {
                      nextPossession = 'HOME'; // We won it back
                      const myWinner = getBestPlayerForAction(liveMyTeam, [Position.MID, Position.DEF], 'defending');
                      setEvents(prev => [...prev, { minute: minute + 1, type: 'NORMAL', description: `${String(myWinner.name)} wins possession in midfield.`, teamName: liveMyTeam.name }]);
                  }
              }
          }
      }

      // ATTACKING PHASE (Zone 1 - My Attack / Opp Defense)
      else if (ballZone === ZONES.ATTACK) {
          if (possessionSide === 'HOME') {
              // Creating a chance
              const creator = getBestPlayerForAction(liveMyTeam, [Position.MID, Position.FWD], 'passing');
              const finisher = getBestPlayerForAction(liveMyTeam, [Position.FWD], 'shooting');
              const oppDef = getBestPlayerForAction(opponent, [Position.DEF], 'defending');

              let attackRoll = (creator.passing + finisher.dribbling) / 2 + (momentum/5);
              let defenseRoll = oppDef.defending + (oppDef.physical/2);

              if (liveMyTeam.tactics.passing === PassingStyle.DIRECT) attackRoll += 5;

              if (Math.random() * (attackRoll + defenseRoll) < attackRoll) {
                  // SHOT TAKEN
                  updateStats({ shotsHome: stats.shotsHome + 1 });
                  const shotQuality = finisher.shooting + Math.random() * 20;
                  const gkQuality = 75 + Math.random() * 20; // Opponent GK
                  const xG = shotQuality / 200;
                  updateStats({ xgHome: stats.xgHome + xG });

                  if (shotQuality > gkQuality) {
                      // GOAL
                      event = { minute: minute + 1, type: 'GOAL', description: `GOAL!!! ${String(finisher.name)} scores with a brilliant finish!`, teamName: liveMyTeam.name };
                      setScore(s => ({ ...s, home: s.home + 1 }));
                      nextZone = ZONES.MIDFIELD; // Reset
                      nextPossession = 'AWAY';
                      newMomentum = 70;
                      playSound('GOAL');
                  } else {
                      // SAVE/MISS
                      event = { minute: minute + 1, type: 'CHANCE', description: `Saved! The keeper denies ${String(finisher.name)}.`, teamName: liveMyTeam.name };
                      nextZone = ZONES.MIDFIELD; // Cleared
                      nextPossession = 'AWAY'; // GK catches or clears
                      playSound('KICK');
                  }
              } else {
                  // TACKLED
                  nextPossession = 'AWAY';
                  nextZone = ZONES.MIDFIELD;
                  setEvents(prev => [...prev, { minute: minute + 1, type: 'NORMAL', description: `Great tackle by ${String(oppDef.name)} to stop the attack.`, teamName: opponent.name }]);
              }
          } else {
              // Opponent has ball in their attack (shouldn't happen if zones logic holds, but acts as their defense clearing)
              nextZone = ZONES.MIDFIELD;
          }
      }

      // DEFENSIVE PHASE (Zone -1 - My Defense / Opp Attack)
      else if (ballZone === ZONES.DEFENSE) {
          if (possessionSide === 'AWAY') {
              const myDef = getBestPlayerForAction(liveMyTeam, [Position.DEF], 'defending');
              const myGK = getBestPlayerForAction(liveMyTeam, [Position.GK], 'rating'); // Use rating as generic GK stat
              const oppAtt = getBestPlayerForAction(opponent, [Position.FWD], 'shooting');

              let defRoll = myDef.defending + (liveMyTeam.tactics.defensiveLine === DefensiveLine.DEEP ? 10 : 0);
              let attRoll = oppAtt.dribbling + oppAtt.shooting;

              // High press helps avoid getting here, but once here, high press leaves gaps
              if (liveMyTeam.tactics.pressing === PressingIntensity.GEGENPRESS) defRoll -= 10; 

              if (Math.random() * (defRoll + attRoll) < defRoll) {
                  // WE DEFENDED
                  nextPossession = 'HOME';
                  nextZone = ZONES.MIDFIELD;
                  setEvents(prev => [...prev, { minute: minute + 1, type: 'NORMAL', description: `${String(myDef.name)} clears the danger.`, teamName: liveMyTeam.name }]);
              } else {
                  // OPPONENT SHOOTS
                  updateStats({ shotsAway: stats.shotsAway + 1 });
                  const shotQuality = 70 + Math.random() * 20; // Opponent generic shot
                  const gkQuality = myGK.rating + (myGK.condition/10) + Math.random() * 10;
                  const xG = shotQuality / 200;
                  updateStats({ xgAway: stats.xgAway + xG });

                  if (shotQuality > gkQuality) {
                      // GOAL CONCEDED
                      event = { minute: minute + 1, type: 'GOAL', description: `GOAL! ${String(oppAtt.name)} scores for ${String(opponent.name)}.`, teamName: opponent.name };
                      setScore(s => ({ ...s, away: s.away + 1 }));
                      nextZone = ZONES.MIDFIELD;
                      nextPossession = 'HOME';
                      newMomentum = 30;
                      playSound('GOAL');
                  } else {
                      // SAVE BY OUR GK
                      event = { minute: minute + 1, type: 'CHANCE', description: `WHAT A SAVE! ${String(myGK.name)} keeps it out!`, teamName: liveMyTeam.name };
                      nextZone = ZONES.DEFENSE; // Corner or rebound
                      playSound('KICK');
                  }
              }
          } else {
              // We have ball in defense (Build up)
              const myDef = getBestPlayerForAction(liveMyTeam, [Position.DEF], 'passing');
              if (Math.random() > 0.2) {
                  nextZone = ZONES.MIDFIELD; // Successful build up
                  setEvents(prev => [...prev, { minute: minute + 1, type: 'NORMAL', description: `${String(myDef.name)} plays it out from the back.`, teamName: liveMyTeam.name }]);
              } else {
                  nextPossession = 'AWAY'; // Error at back
                  setEvents(prev => [...prev, { minute: minute + 1, type: 'NORMAL', description: `Mistake by ${String(myDef.name)}! Gave the ball away.`, teamName: liveMyTeam.name }]);
              }
          }
      }

      setMinute(m => m + 1);
      setBallZone(nextZone);
      setPossessionSide(nextPossession);
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
  }, [isPlaying, minute, ballZone, possessionSide, momentum, speed, liveMyTeam]);

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
                            <div className={`absolute top-4 right-4 px-3 py-1 rounded text-xs font-bold text-white border transition-colors ${possessionSide === 'HOME' ? 'bg-emerald-600 border-emerald-500' : 'bg-red-600 border-red-500'}`}>
                                Ball: {ballZone === ZONES.ATTACK ? (possessionSide === 'HOME' ? 'Attacking' : 'Opp Counter') : ballZone === ZONES.DEFENSE ? (possessionSide === 'HOME' ? 'Defending' : 'Opp Attack') : 'Midfield Battle'}
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
                                     <p className="text-[10px] text-slate-500 mt-1">High press wins ball higher but drains stamina.</p>
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
                                     <p className="text-[10px] text-slate-500 mt-1">Direct passing is risky but fast.</p>
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
                                    highlightedPlayerId={null} 
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
