
import React, { useState, useEffect } from 'react';
import { Player, Position, TransferType, InjuryStatus } from '../types';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Shield, Zap, Target, Crosshair, Activity, Dumbbell, Banknote, Briefcase, Handshake, ArrowLeft, CheckCircle2, ArrowRightLeft, HeartPulse, Battery, AlertTriangle, CalendarClock, Percent, Coins, History, ArrowRight, MoveRight, Bandage, Stethoscope, Ambulance, FileSignature, Globe, Flag, Trophy, LayoutList, CalendarRange, Medal, Crown, Shirt, Move, ArrowUpDown } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  onClose?: () => void;
  onRoleChange?: (playerId: string, newRole: string) => void;
  onTransfer?: (player: Player, type: TransferType, cost: number, futureFee?: number) => void;
  onContractRenew?: (player: Player, newWage: number, newDuration: number) => void;
  onTrainingChange?: (playerId: string, trainingFocus: string) => void;
  isOwned?: boolean; // True if in my squad, false if in market
  budget?: number; // Needed to check affordability
}

const ROLES = {
    [Position.GK]: [
        'Goalkeeper', 
        'Sweeper Keeper', 
        'Shot Stopper', 
        'Commanding GK'
    ],
    [Position.DEF]: [
        'Central Defender', 
        'Ball Playing Defender', 
        'No-Nonsense CB', 
        'Enforcer', 
        'Libero',
        'Full Back', 
        'Wing Back', 
        'Inverted Full Back'
    ],
    [Position.MID]: [
        'Box To Box', 
        'Deep Lying Playmaker', 
        'Ball Winning Midfielder', 
        'Midfield General', 
        'Attacking Midfielder', 
        'Advanced Playmaker',
        'Mezzala',
        'Carrilero',
        'Anchor Man'
    ],
    [Position.FWD]: [
        'Advanced Forward', 
        'Target Man', 
        'False Nine', 
        'Poacher', 
        'Sniper',
        'Complete Forward',
        'Pressing Forward',
        'Winger',
        'Inside Forward', 
        'Raumdeuter'
    ]
};

const DRILLS = [
    { id: 'GENERAL', label: 'Balanced', icon: <Activity size={18} />, desc: 'Maintain overall fitness', stat: 'ALL' },
    { id: 'PAC', label: 'Sprints', icon: <Zap size={18} />, desc: 'Improve speed & acceleration', stat: 'Pace' },
    { id: 'SHO', label: 'Finishing', icon: <Crosshair size={18} />, desc: 'Shooting accuracy drills', stat: 'Shooting' },
    { id: 'PAS', label: 'Playmaking', icon: <Target size={18} />, desc: 'Passing range & vision', stat: 'Passing' },
    { id: 'DRI', label: 'Technique', icon: <Move size={18} />, desc: 'Ball control & dribbling', stat: 'Dribbling' },
    { id: 'DEF', label: 'Defending', icon: <Shield size={18} />, desc: 'Tackling & positioning', stat: 'Defending' },
    { id: 'PHY', label: 'Strength', icon: <Dumbbell size={18} />, desc: 'Gym & physical conditioning', stat: 'Physical' }
];

type NegotiationMode = 'NONE' | 'TRANSFER' | 'CONTRACT';

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClose, onRoleChange, onTransfer, onContractRenew, onTrainingChange, isOwned = true, budget = 0 }) => {
  const [selectedRole, setSelectedRole] = useState(player.role);
  const [activeTab, setActiveTab] = useState<'STATS' | 'TRAINING' | 'HISTORY' | 'AWARDS'>('STATS');
  const [negotiationMode, setNegotiationMode] = useState<NegotiationMode>('NONE');
  const [trainingFocus, setTrainingFocus] = useState(player.trainingFocus || 'GENERAL');
  const [awardSort, setAwardSort] = useState<'NEWEST' | 'OLDEST' | 'TYPE'>('NEWEST');
  
  // Negotiation State (Transfer)
  const [negotiationType, setNegotiationType] = useState<TransferType>(TransferType.PERMANENT);
  const [offerAmount, setOfferAmount] = useState(player.marketValue);
  const [futureFee, setFutureFee] = useState(0);
  const [wageContribution, setWageContribution] = useState(100); // % of wages paid by us (for loans)

  // Negotiation State (Contract)
  const [proposedWage, setProposedWage] = useState(player.wages);
  const [proposedDuration, setProposedDuration] = useState(3);
  const [contractFeedback, setContractFeedback] = useState<string | null>(null);
  
  // Reset state when player changes
  useEffect(() => {
    setSelectedRole(player.role);
    setNegotiationMode('NONE');
    setActiveTab('STATS');
    setNegotiationType(TransferType.PERMANENT);
    setOfferAmount(player.marketValue);
    setWageContribution(100);
    setFutureFee(0);
    setProposedWage(Math.floor(player.wages * 1.1)); // Auto-suggest 10% raise
    setProposedDuration(3);
    setContractFeedback(null);
    setTrainingFocus(player.trainingFocus || 'GENERAL');
    setAwardSort('NEWEST');
  }, [player]);

  // Update default offer when type changes
  useEffect(() => {
      let newAmount = player.marketValue;
      let newFuture = 0;
      
      switch (negotiationType) {
          case TransferType.PERMANENT:
              newAmount = player.marketValue;
              break;
          case TransferType.LOAN_OPTION:
              newAmount = Math.floor(player.marketValue * 0.05); // Upfront fee (Loan Fee)
              newFuture = Math.floor(player.marketValue * 1.1); // Option Price
              break;
          case TransferType.LOAN_OBLIGATION:
              newAmount = Math.floor(player.marketValue * 0.02); // Lower upfront
              newFuture = player.marketValue; // Mandatory future fee
              break;
          case TransferType.LOAN:
              newAmount = 0; // Standard loan usually has low/no fee, mostly wages
              break;
      }
      setOfferAmount(newAmount);
      setFutureFee(newFuture);
  }, [negotiationType, player.marketValue]);

  // Calculate effective stats based on condition
  const conditionFactor = player.condition / 100;
  const getEffectiveStat = (val: number, isPhysical: boolean) => {
      if (player.injuryStatus === InjuryStatus.INJURED) {
          return Math.floor(val * 0.1); 
      }
      
      if (player.injuryStatus === InjuryStatus.DOUBTFUL) {
          return Math.floor(val * 0.85);
      }

      if (!isOwned) return val; 
      if (player.condition >= 90) return val;
      
      let penalty = 0;
      if (isPhysical) {
          penalty = val * (1 - conditionFactor) * 0.5; 
      } else {
          penalty = val * (1 - conditionFactor) * 0.2;
      }
      return Math.floor(val - penalty);
  };

  const statsData = [
    { subject: 'PAC', A: getEffectiveStat(player.pace, true), original: player.pace, fullMark: 100 },
    { subject: 'SHO', A: getEffectiveStat(player.shooting, false), original: player.shooting, fullMark: 100 },
    { subject: 'PAS', A: getEffectiveStat(player.passing, false), original: player.passing, fullMark: 100 },
    { subject: 'DRI', A: getEffectiveStat(player.dribbling, false), original: player.dribbling, fullMark: 100 },
    { subject: 'DEF', A: getEffectiveStat(player.defending, false), original: player.defending, fullMark: 100 },
    { subject: 'PHY', A: getEffectiveStat(player.physical, true), original: player.physical, fullMark: 100 },
  ];

  const getPosColor = (pos: Position) => {
    switch (pos) {
      case Position.GK: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case Position.DEF: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case Position.MID: return 'text-green-400 bg-green-400/10 border-green-400/20';
      case Position.FWD: return 'text-red-400 bg-red-400/10 border-red-400/20';
    }
  };

  const getConditionColor = (val: number) => {
      if (val > 80) return 'bg-emerald-500';
      if (val > 50) return 'bg-yellow-500';
      return 'bg-red-500';
  };

  const formatMoney = (amount: number) => {
      return new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newRole = e.target.value;
      setSelectedRole(newRole);
      if (onRoleChange) onRoleChange(player.id, newRole);
  }

  const handleTrainingSelect = (drillId: string) => {
      setTrainingFocus(drillId);
      if (onTrainingChange) onTrainingChange(player.id, drillId);
  }

  const getTransferTypes = () => {
    if (isOwned) {
        return [
            { id: TransferType.PERMANENT, label: 'Sell Player' },
            { id: TransferType.LOAN, label: 'Loan Out' }
        ];
    }
    return [
        { id: TransferType.PERMANENT, label: 'Transfer' },
        { id: TransferType.LOAN, label: 'Loan' },
        { id: TransferType.LOAN_OPTION, label: 'Option' },
        { id: TransferType.LOAN_OBLIGATION, label: 'Obligation' }
    ];
  };

  const calculateTotalCost = () => {
      if (negotiationType === TransferType.PERMANENT) {
          return offerAmount;
      } else {
          // Loan cost is upfront fee + wages coverage for the season (approx 40 weeks)
          const seasonWages = player.wages * 40; 
          const wageCost = seasonWages * (wageContribution / 100);
          return offerAmount + wageCost;
      }
  };

  const totalCost = calculateTotalCost();
  const canAfford = budget >= totalCost;

  const handleContractSubmit = () => {
      // 1. Morale Check - Critical Barrier
      if (player.morale < 30) {
          setContractFeedback(`Agent: "${player.name} is too unhappy with the current situation to discuss a renewal. Please address his concerns or improve team performance first."`);
          return;
      }

      let multiplier = 1.1; // Base 10% raise
      let contextNotes: string[] = [];
      
      // Morale Influence
      if (player.morale < 50) {
          multiplier += 0.2; // Unhappy tax
          contextNotes.push("He's unsettled, so it will cost extra to convince him to commit.");
      } else if (player.morale > 90) {
          multiplier -= 0.05; // Happy discount
          contextNotes.push("He loves the club and is willing to be flexible.");
      }

      // Performance Influence (Stats)
      const contributions = (player.seasonStats?.goals || 0) + (player.seasonStats?.assists || 0);
      if (player.position === Position.FWD && contributions > 15) {
          multiplier += 0.25;
          contextNotes.push(`With ${contributions} goal contributions this season, his stock has risen significantly.`);
      } else if (player.position === Position.MID && contributions > 10) {
          multiplier += 0.15;
          contextNotes.push(`His creative output (${contributions} G/A) warrants a better deal.`);
      }

      // Rating Influence
      if (player.rating >= 90) {
          multiplier = Math.max(multiplier, 1.5); // Superstar floor
          contextNotes.push("He is a world-class talent and expects a salary to match.");
      } else if (player.rating >= 85) multiplier += 0.25;
      else if (player.rating <= 70) multiplier = 1.05;

      // Age Influence
      if (player.age < 22) multiplier += 0.2; // Future potential tax
      if (player.age > 33) {
          multiplier = 0.9; // Pay cut for veterans
          contextNotes.push("We understand at this stage of his career, a reduced wage is fair.");
      }

      let targetWage = Math.floor(player.wages * multiplier);
      
      // Duration Influence
      if (proposedDuration > 4) targetWage = Math.floor(targetWage * 1.1); // Charge premium for long lock-in
      if (proposedDuration < 2) targetWage = Math.floor(targetWage * 0.95); // Cheaper for short term

      // Buffer
      const minAcceptable = Math.floor(targetWage * 0.95);

      if (proposedWage >= minAcceptable) {
          if (onContractRenew) onContractRenew(player, proposedWage, proposedDuration);
      } else {
          const difference = minAcceptable - proposedWage;
          const percentageOff = difference / minAcceptable;
          
          let message = "";
          const notesStr = contextNotes.length > 0 ? `${contextNotes.join(' ')}` : "";

          if (percentageOff > 0.3) {
             message = `Agent: "That offer is insulting. ${notesStr} We expect closer to ${formatMoney(targetWage)}."`;
          } else if (percentageOff > 0.1) {
             message = `Agent: "We're not quite there. ${notesStr} Considering his value, we want ${formatMoney(targetWage)}."`;
          } else {
             message = `Agent: "We're very close. Match our valuation of ${formatMoney(minAcceptable)} and we have a deal."`;
          }
          setContractFeedback(message);
      }
  };

  const getInjuryStatusDisplay = () => {
      if (player.isInternationalDuty) {
          return (
              <div className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-3 py-1 rounded border border-blue-500/30">
                  <Globe size={16} />
                  <span className="text-xs font-bold uppercase">On Intl Duty</span>
              </div>
          );
      } else if (player.injuryStatus === InjuryStatus.INJURED) {
          return (
              <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded border border-red-500/30">
                  <Ambulance size={16} />
                  <span className="text-xs font-bold uppercase">Injured</span>
              </div>
          );
      } else if (player.injuryStatus === InjuryStatus.DOUBTFUL) {
          return (
              <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded border border-yellow-500/30">
                  <Bandage size={16} />
                  <span className="text-xs font-bold uppercase">Doubtful</span>
              </div>
          );
      } else {
          return (
              <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded border border-emerald-500/20">
                  <HeartPulse size={16} />
                  <span className="text-xs font-bold uppercase">Fit</span>
              </div>
          );
      }
  };

  const isContractExpiringSoon = player.contractExpiry <= 2026;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl relative max-w-md w-full animate-in fade-in zoom-in duration-300 flex flex-col h-[650px] mx-auto">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-2 shrink-0 relative z-20">
          {(negotiationMode !== 'NONE' || onClose) ? (
            <button 
                onClick={() => {
                    if (negotiationMode !== 'NONE') {
                        setNegotiationMode('NONE');
                    } else if (onClose) {
                        onClose();
                    }
                }}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group py-1"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase">
                    {negotiationMode !== 'NONE' ? 'Back' : 'Return'}
                </span>
            </button>
          ) : <div></div>}
          
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 text-lg leading-none">
                ✕
            </button>
          )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 shrink-0">
        <div>
           <div className={`inline-block px-2 py-1 rounded text-xs font-bold border mb-2 ${getPosColor(player.position)}`}>
            {player.position}
          </div>
          <h2 className="text-3xl font-display font-bold text-white tracking-wide">{player.name}</h2>
          <div className="text-slate-400 text-sm flex gap-3 mt-1 items-center">
            <span>{player.nationality}</span>
            <span>•</span>
            <span>{player.age} Years Old</span>
            {player.contractType && player.contractType !== TransferType.PERMANENT && (
                <span className="text-yellow-400 font-bold uppercase text-[10px] border border-yellow-400/30 px-1 rounded bg-yellow-400/10 self-center">
                    {player.contractType.replace('_', ' ')}
                </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center bg-slate-800 rounded-lg p-3 border border-slate-700 w-20">
          <span className="text-3xl font-bold font-display text-emerald-400">{player.rating}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">OVR</span>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800 shrink-0">
          {getInjuryStatusDisplay()}
          <div className="text-right">
              {player.injuryStatus === InjuryStatus.INJURED && player.injuryDetails ? (
                  <div className="flex flex-col items-end text-xs text-red-300">
                      <span className="font-bold">{player.injuryDetails.type}</span>
                      <span className="opacity-70">Return: {player.injuryDetails.weeksOut} Weeks</span>
                  </div>
              ) : player.injuryStatus === InjuryStatus.DOUBTFUL ? (
                  <div className="text-xs text-yellow-300 font-bold">Late Fitness Test</div>
              ) : (
                  <div className="text-xs text-emerald-400 font-bold">Match Ready</div>
              )}
          </div>
      </div>
      
      {/* Key Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
          {/* Role */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                  <Briefcase size={10} /> Role
              </label>
              {isOwned ? (
                  <select 
                    value={selectedRole} 
                    onChange={handleRoleChange}
                    className="w-full bg-slate-800 border-none text-white text-xs rounded focus:ring-1 focus:ring-emerald-500 py-1 cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                      {ROLES[player.position].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
              ) : (
                  <div className="text-sm font-bold text-slate-300">{player.role}</div>
              )}
          </div>
          
          {/* Value */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                  <Banknote size={10} /> Value
              </label>
              <div className="text-sm font-bold text-emerald-400">{formatMoney(player.marketValue)}</div>
          </div>

          {/* Wage */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
               <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                  <Coins size={10} /> Wage
              </label>
              <div className="text-sm font-bold text-white">{formatMoney(player.wages)}/wk</div>
          </div>

          {/* Contract */}
          <div className={`bg-slate-950 p-2.5 rounded-lg border ${isOwned && isContractExpiringSoon ? 'border-red-500/30 bg-red-900/10' : 'border-slate-800'}`}>
               <label className={`text-[10px] font-bold uppercase flex items-center gap-1 mb-1 ${isOwned && isContractExpiringSoon ? 'text-red-400' : 'text-slate-500'}`}>
                  <CalendarClock size={10} /> Contract
              </label>
              <div className={`text-sm font-bold ${isOwned && isContractExpiringSoon ? 'text-red-300' : 'text-slate-300'}`}>
                  Expires {player.contractExpiry}
              </div>
          </div>
      </div>

      {/* Condition & Morale Bars */}
      <div className="grid grid-cols-2 gap-4 mb-4 shrink-0">
         <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
                 <span className="text-slate-400 flex items-center gap-1"><Battery size={12}/> Condition</span>
                 <span className={`font-bold ${player.condition < 70 ? 'text-red-400' : 'text-emerald-400'}`}>{player.condition}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${getConditionColor(player.condition)}`} style={{width: `${player.condition}%`}}></div>
            </div>
         </div>
         <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
                 <span className="text-slate-400 flex items-center gap-1"><HeartPulse size={12}/> Morale</span>
                 <span className="font-bold text-blue-400">{player.morale}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{width: `${player.morale}%`}}></div>
            </div>
         </div>
      </div>

      {/* Tabs */}
      {negotiationMode === 'NONE' && (
          <div className="flex border-b border-slate-800 mb-4 shrink-0 overflow-x-auto">
              <button 
                  onClick={() => setActiveTab('STATS')}
                  className={`flex-1 pb-2 text-sm font-bold transition-colors border-b-2 whitespace-nowrap px-2 ${activeTab === 'STATS' ? 'text-white border-emerald-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
              >
                  Stats
              </button>
              {isOwned && (
                 <button 
                    onClick={() => setActiveTab('TRAINING')}
                    className={`flex-1 pb-2 text-sm font-bold transition-colors border-b-2 whitespace-nowrap px-2 ${activeTab === 'TRAINING' ? 'text-white border-emerald-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                 >
                    Training
                 </button>
              )}
              <button 
                  onClick={() => setActiveTab('HISTORY')}
                  className={`flex-1 pb-2 text-sm font-bold transition-colors border-b-2 whitespace-nowrap px-2 ${activeTab === 'HISTORY' ? 'text-white border-emerald-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
              >
                  History
              </button>
              <button 
                  onClick={() => setActiveTab('AWARDS')}
                  className={`flex-1 pb-2 text-sm font-bold transition-colors border-b-2 whitespace-nowrap px-2 ${activeTab === 'AWARDS' ? 'text-white border-emerald-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
              >
                  Awards
              </button>
          </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        {negotiationMode === 'NONE' ? (
            activeTab === 'STATS' ? (
                <div className="h-full animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-4">
                    {/* Attributes Chart */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-800 relative">
                            {/* Radar Chart */}
                            <ResponsiveContainer width="100%" height={160}>
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={statsData}>
                                    <PolarGrid stroke="#334155" />
                                    <PolarAngleAxis 
                                        dataKey="subject" 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                                    />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Player"
                                        dataKey="A"
                                        stroke="#10b981"
                                        fill="#10b981"
                                        fillOpacity={0.4}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                            {statsData.map((stat) => (
                                <StatRow 
                                    key={stat.subject}
                                    icon={getStatIcon(stat.subject)} 
                                    label={getStatLabel(stat.subject)} 
                                    value={stat.A} 
                                    original={stat.original}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Season Stats */}
                    {player.seasonStats && (
                        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-400 uppercase">
                                <Trophy size={14} className="text-yellow-500" /> Season 2025/26
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-slate-900 p-2 rounded text-center">
                                    <div className="text-lg font-bold text-white">{player.seasonStats.appearances}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Matches</div>
                                </div>
                                <div className="bg-slate-900 p-2 rounded text-center">
                                    <div className="text-lg font-bold text-emerald-400">{player.seasonStats.goals}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Goals</div>
                                </div>
                                <div className="bg-slate-900 p-2 rounded text-center">
                                    <div className="text-lg font-bold text-blue-400">{player.seasonStats.assists}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Assists</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Career Stats */}
                    {player.careerStats && (
                        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-400 uppercase">
                                <LayoutList size={14} className="text-purple-400" /> Club Career (Total)
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-slate-900 p-2 rounded text-center">
                                    <div className="text-lg font-bold text-white">{player.careerStats.appearances}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Matches</div>
                                </div>
                                <div className="bg-slate-900 p-2 rounded text-center">
                                    <div className="text-lg font-bold text-emerald-400">{player.careerStats.goals}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Goals</div>
                                </div>
                                <div className="bg-slate-900 p-2 rounded text-center">
                                    <div className="text-lg font-bold text-blue-400">{player.careerStats.assists}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Assists</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* National Team Stats */}
                    {player.internationalStats && (
                        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-400 uppercase">
                                <Flag size={14} className="text-blue-400" /> National Team
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-slate-900 p-2 rounded text-center">
                                    <div className="text-lg font-bold text-white">{player.internationalStats.caps}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Caps</div>
                                </div>
                                <div className="bg-slate-900 p-2 rounded text-center">
                                    <div className="text-lg font-bold text-emerald-400">{player.internationalStats.goals}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Goals</div>
                                </div>
                                <div className="bg-slate-900 p-2 rounded text-center">
                                    <div className="text-lg font-bold text-blue-400">{player.internationalStats.assists}</div>
                                    <div className="text-[10px] text-slate-500 uppercase">Assists</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : activeTab === 'TRAINING' ? (
                // Training Tab Content
                <div className="h-full animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                        <Dumbbell size={14} /> Training Focus
                    </h3>
                    
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 mb-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                             {DRILLS.find(d => d.id === trainingFocus)?.icon}
                        </div>
                        <div>
                             <div className="text-[10px] text-slate-500 uppercase font-bold">Active Drill</div>
                             <div className="font-bold text-white text-sm">{DRILLS.find(d => d.id === trainingFocus)?.label}</div>
                             <div className="text-xs text-slate-400">{DRILLS.find(d => d.id === trainingFocus)?.desc}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                         {DRILLS.map(drill => (
                             <button 
                                key={drill.id}
                                onClick={() => handleTrainingSelect(drill.id)}
                                className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden group ${
                                    trainingFocus === drill.id 
                                    ? 'bg-emerald-600 border-emerald-500' 
                                    : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                                }`}
                             >
                                 <div className="flex justify-between items-start mb-2">
                                     <div className={`${trainingFocus === drill.id ? 'text-white' : 'text-slate-400'}`}>{drill.icon}</div>
                                     {trainingFocus === drill.id && <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>}
                                 </div>
                                 <div className={`font-bold text-sm mb-1 ${trainingFocus === drill.id ? 'text-white' : 'text-slate-300'}`}>{drill.label}</div>
                                 <div className={`text-[10px] ${trainingFocus === drill.id ? 'text-emerald-100' : 'text-slate-500'}`}>{drill.stat} Boost</div>
                                 
                                 {/* Hover Effect */}
                                 {trainingFocus !== drill.id && (
                                     <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                 )}
                             </button>
                         ))}
                    </div>
                </div>
            ) : activeTab === 'HISTORY' ? (
                // ... History Tab Content (remains unchanged) ...
                <div className="h-full animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><History size={14} /> Previous Clubs</h3>
                    <div className="flex flex-col gap-3">
                        {player.history && player.history.length > 0 ? (
                            player.history.slice().reverse().map((entry, index) => (
                                <div key={index} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-emerald-500 font-mono mb-1">{entry.season}</span>
                                        <div className="flex items-center gap-2 text-sm text-slate-300">
                                            <span className={entry.fromClub === 'Academy' ? 'text-indigo-400 font-bold' : ''}>{entry.fromClub}</span>
                                            <MoveRight size={12} className="text-slate-500" />
                                            <span className="font-bold text-white">{entry.toClub}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {entry.type === TransferType.FREE || entry.type === TransferType.ACADEMY ? (
                                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 uppercase">Free</span>
                                        ) : entry.type === TransferType.LOAN ? (
                                             <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 uppercase">Loan</span>
                                        ) : (
                                            <div className="flex flex-col items-end">
                                                 <span className="text-sm font-bold text-white font-mono">{formatMoney(entry.fee)}</span>
                                                 <span className="text-[10px] text-slate-500 uppercase">Fee</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                                <History size={32} className="mb-2 opacity-50"/>
                                <p className="text-sm font-bold">No transfer history available.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Awards Tab
                <div className="h-full animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                            <Medal size={14} /> Honours Cabinet
                        </h3>
                        {player.awards && player.awards.length > 0 && (
                            <button 
                                onClick={() => setAwardSort(prev => {
                                    if (prev === 'NEWEST') return 'OLDEST';
                                    if (prev === 'OLDEST') return 'TYPE';
                                    return 'NEWEST';
                                })}
                                className="text-[10px] font-bold text-slate-500 hover:text-white bg-slate-800 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                            >
                                <ArrowUpDown size={10} /> {awardSort === 'NEWEST' ? 'Newest' : awardSort === 'OLDEST' ? 'Oldest' : 'Type'}
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {player.awards && player.awards.length > 0 ? (
                            [...player.awards]
                                .sort((a, b) => {
                                    if (awardSort === 'NEWEST') return b.year - a.year;
                                    if (awardSort === 'OLDEST') return a.year - b.year;
                                    if (awardSort === 'TYPE') {
                                        const typeCompare = a.type.localeCompare(b.type);
                                        if (typeCompare !== 0) return typeCompare;
                                        return b.year - a.year;
                                    }
                                    return 0;
                                })
                                .map((award, index) => {
                                const isTeamOfYear = award.name.includes("Team of the Year");
                                const isBallon = award.name.includes("Ballon");
                                
                                return (
                                <div key={index} className="bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center text-center relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                        {isBallon ? <Crown size={32} className="text-yellow-400" /> : 
                                         isTeamOfYear ? <Shirt size={32} className="text-blue-400" /> :
                                         <Medal size={32} className="text-emerald-400" />}
                                    </div>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                                        isBallon ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                                        isTeamOfYear ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    }`}>
                                        {isBallon ? <Crown size={18} /> : 
                                         isTeamOfYear ? <Shirt size={18} /> :
                                         <Medal size={18} />}
                                    </div>
                                    <div className="font-bold text-white text-sm mb-1 leading-tight">{award.name}</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{award.type} Award</div>
                                    <div className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono border border-slate-700">{award.year}</div>
                                    
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                </div>
                            )})
                        ) : (
                            <div className="col-span-2 flex flex-col items-center justify-center h-48 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                                <Medal size={32} className="mb-2 opacity-20"/>
                                <p className="text-sm font-bold">No individual awards yet.</p>
                                <p className="text-xs">Perform well in matches to earn accolades.</p>
                            </div>
                        )}
                    </div>
                </div>
            )
        ) : negotiationMode === 'TRANSFER' ? (
            // ... Transfer Mode ...
            <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                {onTransfer && (
                    <div className="flex flex-col gap-4">
                        {/* Type Selector */}
                        <div className="grid grid-cols-2 gap-2">
                             {getTransferTypes().map(type => (
                                 <button
                                    key={type.id}
                                    onClick={() => setNegotiationType(type.id as TransferType)}
                                    className={`py-2 px-1 text-xs font-bold rounded border transition-all ${negotiationType === type.id 
                                        ? 'bg-emerald-600 border-emerald-500 text-white' 
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                 >
                                     {type.label}
                                 </button>
                             ))}
                        </div>

                        {/* Contract Details Card */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                    {negotiationType === TransferType.PERMANENT ? 'Offer Price (Fee)' : 'Upfront Loan Fee'}
                                </label>
                                <div className="flex items-center gap-3">
                                    <span className="text-xl text-slate-500 font-bold">€</span>
                                    <input
                                        type="number"
                                        value={offerAmount}
                                        onChange={(e) => setOfferAmount(Number(e.target.value))}
                                        className="bg-transparent border-none text-white text-2xl font-display font-bold w-full focus:ring-0 placeholder-slate-700 p-0"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {(negotiationType === TransferType.LOAN_OPTION || negotiationType === TransferType.LOAN_OBLIGATION) && (
                                <div className="pt-2 border-t border-slate-800">
                                     <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                        Future Buy Clause ({negotiationType === TransferType.LOAN_OBLIGATION ? 'Mandatory' : 'Optional'})
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl text-slate-500 font-bold">€</span>
                                        <input
                                            type="number"
                                            value={futureFee}
                                            onChange={(e) => setFutureFee(Number(e.target.value))}
                                            className="bg-transparent border-none text-emerald-400 text-xl font-display font-bold w-full focus:ring-0 placeholder-emerald-900 p-0"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            )}

                            {negotiationType !== TransferType.PERMANENT && (
                                <div className="pt-2 border-t border-slate-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                            <Percent size={10} /> Wage Contribution
                                        </label>
                                        <span className="text-xs font-bold text-emerald-400">{wageContribution}% Us</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        step="10" 
                                        value={wageContribution}
                                        onChange={(e) => setWageContribution(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Breakdown - UPDATED */}
                        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-800/50 space-y-3">
                             <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                <Briefcase size={10} /> Offer Breakdown
                             </h4>
                             
                             {/* Primary Fee */}
                             <div className="flex justify-between items-center text-xs">
                                 <span className="text-slate-300">
                                     {negotiationType === TransferType.PERMANENT ? 'Upfront Transfer Fee' : 'Initial Loan Fee'}
                                 </span>
                                 <span className="font-mono text-white">{formatMoney(offerAmount)}</span>
                             </div>

                             {/* Future Clause */}
                             {(negotiationType === TransferType.LOAN_OPTION || negotiationType === TransferType.LOAN_OBLIGATION) && (
                                 <div className="flex justify-between items-center text-xs">
                                     <span className="text-slate-300">
                                         {negotiationType === TransferType.LOAN_OBLIGATION ? 'Mandatory Buy Clause' : 'Optional Buy Clause'}
                                     </span>
                                     <span className="font-mono text-emerald-300">{formatMoney(futureFee)}</span>
                                 </div>
                             )}

                             {/* Wage Contrib */}
                             {negotiationType !== TransferType.PERMANENT && (
                                 <div className="flex justify-between items-center text-xs">
                                     <span className="text-slate-300">Wage Contribution</span>
                                     <span className="font-mono text-slate-300">{wageContribution}% ({formatMoney(Math.floor(player.wages * (wageContribution/100)))}/wk)</span>
                                 </div>
                             )}

                             <div className="border-t border-slate-700/50"></div>

                             {/* Total Package */}
                             <div className="flex justify-between items-center">
                                 <div className="flex flex-col">
                                     <span className="text-xs font-bold text-white uppercase">Total Package</span>
                                     <span className="text-[10px] text-slate-500">Excl. Wages</span>
                                 </div>
                                 <span className="font-mono font-bold text-lg text-emerald-400">{formatMoney(offerAmount + futureFee)}</span>
                             </div>
                             
                             {/* Budget Hit Warning */}
                             <div className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center text-[10px]">
                                 <span className="text-slate-500">Immediate Budget Deduction</span>
                                 <span className={canAfford ? "text-white font-mono" : "text-red-400 font-mono"}>{formatMoney(totalCost)}</span>
                             </div>
                        </div>

                        {!canAfford && !isOwned && (
                            <div className="flex items-center gap-2 bg-red-500/10 p-2 rounded text-red-400 text-xs font-bold border border-red-500/20">
                                <AlertTriangle size={12} /> Exceeds current budget
                            </div>
                        )}
                    </div>
                )}
            </div>
        ) : (
            // ... Contract Renewal Mode ...
            <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                        <FileSignature size={20} className="text-indigo-400" /> Contract Renewal
                    </h3>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner space-y-6">
                        {/* New Wage - UPDATED */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                Weekly Wage Offer
                            </label>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-xl text-slate-500 font-bold">€</span>
                                <input
                                    type="number"
                                    value={proposedWage}
                                    onChange={(e) => setProposedWage(Number(e.target.value))}
                                    className="bg-transparent border-none text-white text-2xl font-display font-bold w-full focus:ring-0 placeholder-slate-700 p-0"
                                />
                            </div>
                            
                            {/* Comparison */}
                            <div className="bg-slate-900 rounded-lg p-2 border border-slate-800 flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase block">Current</span>
                                    <span className="font-mono text-slate-400 line-through">{formatMoney(player.wages)}</span>
                                </div>
                                <ArrowRight size={14} className="text-slate-600" />
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-500 uppercase block">Proposed</span>
                                    <span className={`font-mono font-bold ${proposedWage >= player.wages ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatMoney(proposedWage)}
                                    </span>
                                </div>
                            </div>
                            <div className={`text-right text-[10px] font-bold mt-1 ${proposedWage >= player.wages ? 'text-emerald-500' : 'text-red-500'}`}>
                                {proposedWage >= player.wages ? '▲' : '▼'} {Math.abs(Math.round(((proposedWage - player.wages) / player.wages) * 100))}% Change
                            </div>
                        </div>

                        {/* Contract Length */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">
                                Contract Duration
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(yrs => (
                                    <button
                                        key={yrs}
                                        onClick={() => setProposedDuration(yrs)}
                                        className={`flex-1 py-2 rounded text-sm font-bold border transition-all ${
                                            proposedDuration === yrs 
                                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                        }`}
                                    >
                                        {yrs} Yr
                                    </button>
                                ))}
                            </div>
                            <div className="text-right mt-1 text-[10px] text-slate-500">
                                Valid until {2025 + proposedDuration}
                            </div>
                        </div>
                    </div>

                    {/* Feedback Area */}
                    {contractFeedback && (
                        <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-red-200 text-xs italic flex items-start gap-2 animate-in fade-in">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            {contractFeedback}
                        </div>
                    )}

                    {/* Total Value Summary - UPDATED/ADDED */}
                    <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800/50 space-y-2">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase">Contract Valuation</h4>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Signing Bonus (10 weeks)</span>
                            <span className="font-mono text-slate-300">{formatMoney(proposedWage * 10)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Total Salary ({proposedDuration}y)</span>
                            <span className="font-mono text-slate-300">{formatMoney(proposedWage * 52 * proposedDuration)}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-700/50 flex justify-between items-center">
                            <span className="text-xs font-bold text-emerald-400">Total Investment</span>
                            <span className="font-mono font-bold text-white">{formatMoney((proposedWage * 10) + (proposedWage * 52 * proposedDuration))}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-2 border-t border-slate-800 shrink-0 space-y-2">
        {/* VIEW MODE ACTIONS */}
        {negotiationMode === 'NONE' && (
            <div className="flex flex-col gap-2">
                {/* Transfer Actions */}
                {onTransfer && !isOwned && (
                    <button 
                        onClick={() => setNegotiationMode('TRANSFER')}
                        className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition-all"
                    >
                        <Handshake size={18} /> Make Offer
                    </button>
                )}
                
                {onTransfer && isOwned && (
                    <button 
                        onClick={() => setNegotiationMode('TRANSFER')}
                        className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all"
                    >
                        <ArrowRightLeft size={18} /> Transfer Options
                    </button>
                )}

                {/* Contract Renewal Action */}
                {onContractRenew && isOwned && (
                    <button 
                        onClick={() => setNegotiationMode('CONTRACT')}
                        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 border transition-all ${
                            isContractExpiringSoon 
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/20 hover:bg-indigo-500' 
                            : 'bg-slate-800 text-indigo-400 border-slate-700 hover:text-white hover:bg-indigo-600'
                        }`}
                    >
                        <FileSignature size={18} /> 
                        {isContractExpiringSoon ? 'Renew Expiring Contract' : 'Renew Contract'}
                    </button>
                )}
            </div>
        )}
        
        {/* TRANSFER NEGOTIATION ACTIONS */}
        {negotiationMode === 'TRANSFER' && onTransfer && !isOwned && (
             <button 
                onClick={() => onTransfer(player, negotiationType, totalCost, futureFee)}
                disabled={!canAfford}
                className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20 transition-all"
             >
                 <CheckCircle2 size={18} /> Submit {negotiationType === TransferType.PERMANENT ? 'Bid' : 'Offer'}
             </button>
        )}

        {negotiationMode === 'TRANSFER' && onTransfer && isOwned && (
             <button 
                onClick={() => onTransfer(player, negotiationType, offerAmount, futureFee)}
                className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/20 transition-all"
             >
                 <CheckCircle2 size={18} /> Confirm {negotiationType === TransferType.PERMANENT ? 'Sale' : 'Loan'}
             </button>
        )}

        {/* CONTRACT NEGOTIATION ACTIONS */}
        {negotiationMode === 'CONTRACT' && (
            <button 
                onClick={handleContractSubmit}
                className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 transition-all"
            >
                <CheckCircle2 size={18} /> Submit Contract Offer
            </button>
        )}

        {!onTransfer && !onContractRenew && (
            <div className="text-center text-xs text-slate-500">
                Viewing Player Details
            </div>
        )}
      </div>
    </div>
  );
};

// ... Helper functions (getStatIcon, getStatLabel, StatRow) remain unchanged ...
const getStatIcon = (subject: string) => {
    switch(subject) {
        case 'PAC': return <Zap size={14} />;
        case 'SHO': return <Crosshair size={14} />;
        case 'PAS': return <Target size={14} />;
        case 'DRI': return <Activity size={14} />;
        case 'DEF': return <Shield size={14} />;
        case 'PHY': return <Dumbbell size={14} />;
        default: return null;
    }
}

const getStatLabel = (subject: string) => {
    switch(subject) {
        case 'PAC': return 'Pace';
        case 'SHO': return 'Shooting';
        case 'PAS': return 'Passing';
        case 'DRI': return 'Dribbling';
        case 'DEF': return 'Defending';
        case 'PHY': return 'Physical';
        default: return subject;
    }
}

interface StatRowProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    original: number;
}

const StatRow: React.FC<StatRowProps> = ({ icon, label, value, original }) => {
    let color = 'text-slate-400';
    if(value > 80) color = 'text-emerald-400';
    else if (value > 65) color = 'text-yellow-400';
    else if (value < 50) color = 'text-red-400';

    const isPenalized = value < original;

    return (
        <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                <span className="text-slate-500">{icon}</span>
                {label}
            </div>
            <div className="flex items-center gap-2">
                {isPenalized && (
                    <span className="text-[10px] text-red-500 line-through decoration-red-500/50">{original}</span>
                )}
                <span className={`text-sm font-bold font-display ${color}`}>{value}</span>
            </div>
        </div>
    )
}

export default PlayerCard;
