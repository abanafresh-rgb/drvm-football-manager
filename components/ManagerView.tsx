
import React, { useState } from 'react';
import { ManagerProfile, TrophyItem, ManagerAward } from '../types';
import { Trophy, Medal, Briefcase, Star, TrendingUp, TrendingDown, Target, Shield, Crown, Award, Activity, History } from 'lucide-react';

interface ManagerViewProps {
    profile: ManagerProfile;
}

const ManagerView: React.FC<ManagerViewProps> = ({ profile }) => {
    const [activeTab, setActiveTab] = useState<'TROPHIES' | 'AWARDS' | 'HISTORY'>('TROPHIES');

    const renderTrophy = (trophy: TrophyItem) => (
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 p-4 rounded-xl flex flex-col items-center text-center hover:scale-105 transition-transform group relative overflow-hidden">
            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="p-3 bg-yellow-500/20 rounded-full mb-3 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                <Trophy size={32} strokeWidth={1.5} />
            </div>
            <h4 className="font-display font-bold text-white text-lg leading-tight mb-1">{trophy.name}</h4>
            <div className="text-xs text-yellow-500/80 font-mono font-bold tracking-wider">{trophy.year}</div>
        </div>
    );

    const renderAward = (award: ManagerAward) => (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4 hover:border-slate-600 transition-colors relative group">
            <div className="p-3 bg-slate-800 rounded-lg text-slate-300 border border-slate-700 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                {award.type === 'MONTH' ? <Medal size={24} /> : <Crown size={24} />}
            </div>
            <div>
                <h4 className="font-bold text-white text-sm">{award.name}</h4>
                <div className="text-xs text-slate-500">{award.year}</div>
            </div>
            {award.type === 'YEAR' && (
                <div className="absolute top-2 right-2">
                    <Star size={12} className="text-yellow-500 fill-yellow-500 animate-pulse" />
                </div>
            )}
        </div>
    );

    const winPercentage = profile.stats.gamesManaged > 0 
        ? Math.round((profile.stats.wins / profile.stats.gamesManaged) * 100) 
        : 0;

    return (
        <div className="h-full bg-slate-950 flex flex-col overflow-hidden">
            {/* Header Profile */}
            <div className="p-8 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-4xl font-bold text-slate-500 shadow-2xl relative">
                        {profile.name.charAt(0)}
                        <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 p-1.5 rounded-full">
                            <Briefcase size={16} className="text-emerald-500" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-display font-bold text-white">{profile.name}</h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-400 uppercase tracking-wide">
                                {profile.nationality}
                            </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-400">
                            <span>{profile.age} Years Old</span>
                            <div className="flex items-center gap-1">
                                <span>Reputation:</span>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star 
                                            key={star} 
                                            size={12} 
                                            className={star <= Math.round(profile.reputation / 20) ? "text-yellow-500 fill-yellow-500" : "text-slate-700"} 
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                {/* Stats Grid */}
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                    <Activity size={16} /> Career Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Matches</div>
                        <div className="text-3xl font-display font-bold text-white">{profile.stats.gamesManaged}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Wins</div>
                        <div className="text-3xl font-display font-bold text-emerald-400">{profile.stats.wins}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Win Rate</div>
                        <div className="text-3xl font-display font-bold text-blue-400">{winPercentage}%</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Goal Diff</div>
                        <div className={`text-3xl font-display font-bold ${profile.stats.goalsFor >= profile.stats.goalsAgainst ? 'text-white' : 'text-red-400'}`}>
                            {profile.stats.goalsFor - profile.stats.goalsAgainst > 0 ? '+' : ''}
                            {profile.stats.goalsFor - profile.stats.goalsAgainst}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800 mb-6">
                    <button 
                        onClick={() => setActiveTab('TROPHIES')}
                        className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'TROPHIES' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Trophy Cabinet
                    </button>
                    <button 
                        onClick={() => setActiveTab('AWARDS')}
                        className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'AWARDS' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Personal Accolades
                    </button>
                    <button 
                        onClick={() => setActiveTab('HISTORY')}
                        className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'HISTORY' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        Club History
                    </button>
                </div>

                {/* Tab Content */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {activeTab === 'TROPHIES' && (
                        profile.trophies.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {profile.trophies.map((trophy, idx) => (
                                    <div key={`${trophy.id}_${idx}`}>{renderTrophy(trophy)}</div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-xl text-slate-600">
                                <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-bold text-lg">Empty Cabinet</p>
                                <p className="text-sm">Win competitions to fill this space.</p>
                            </div>
                        )
                    )}

                    {activeTab === 'AWARDS' && (
                        profile.awards.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {profile.awards.map((award, idx) => (
                                    <div key={`${award.id}_${idx}`}>{renderAward(award)}</div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-xl text-slate-600">
                                <Award size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-bold text-lg">No Individual Awards</p>
                                <p className="text-sm">Perform well to earn recognition.</p>
                            </div>
                        )
                    )}

                    {activeTab === 'HISTORY' && (
                        <div className="space-y-4">
                            {profile.clubHistory.map((history, idx) => {
                                const winRate = history.stats.played > 0 
                                    ? Math.round((history.stats.won / history.stats.played) * 100) 
                                    : 0;
                                    
                                return (
                                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-500 text-lg">
                                                    {history.club.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-lg">{history.club}</div>
                                                    <div className="font-mono text-slate-500 text-sm flex items-center gap-1">
                                                        <History size={12} /> {history.years}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="px-3 py-1 bg-slate-950 rounded border border-slate-800 text-xs font-bold text-slate-400">
                                                    {history.stats.played} Games
                                                </div>
                                                <div className="px-3 py-1 bg-blue-900/20 rounded border border-blue-500/20 text-xs font-bold text-blue-400">
                                                    {winRate}% Win Rate
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                                            <div className="text-center">
                                                <div className="text-[10px] uppercase font-bold text-emerald-500/70">Wins</div>
                                                <div className="text-lg font-bold text-emerald-400">{history.stats.won}</div>
                                            </div>
                                            <div className="text-center border-x border-slate-800">
                                                <div className="text-[10px] uppercase font-bold text-slate-500/70">Draws</div>
                                                <div className="text-lg font-bold text-slate-300">{history.stats.drawn}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[10px] uppercase font-bold text-red-500/70">Losses</div>
                                                <div className="text-lg font-bold text-red-400">{history.stats.lost}</div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            {profile.clubHistory.length === 0 && (
                                <div className="text-slate-500 italic p-4 text-center">No past clubs recorded.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerView;
