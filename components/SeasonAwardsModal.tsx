
import React from 'react';
import { SeasonAwards, AwardWinner } from '../types';
import { Trophy, Medal, Star, Shield, Shirt, ChevronRight, Crown } from 'lucide-react';

interface SeasonAwardsModalProps {
    awards: SeasonAwards;
    onClose: () => void;
    year: number;
}

const SeasonAwardsModal: React.FC<SeasonAwardsModalProps> = ({ awards, onClose, year }) => {
    
    const renderAwardCard = (title: string, winner: AwardWinner, icon: React.ReactNode, delay: number, color: string) => (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards" style={{ animationDelay: `${delay}ms` }}>
            <div className={`absolute top-0 right-0 p-4 opacity-10 ${color}`}>
                {icon}
            </div>
            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${color} bg-opacity-20 border border-opacity-30`}>
                    {icon}
                </div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
                <div className="text-2xl font-display font-bold text-white mb-1">{winner.name}</div>
                <div className="text-sm text-slate-500 font-bold mb-3">{winner.team}</div>
                {winner.stats && (
                    <div className="inline-block px-3 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
                        {winner.stats}
                    </div>
                )}
            </div>
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
        </div>
    );

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6 overflow-y-auto">
             <div className="max-w-6xl w-full flex flex-col items-center">
                 {/* Header */}
                 <div className="text-center mb-12 animate-in zoom-in duration-700">
                     <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-yellow-400 to-yellow-700 rounded-full shadow-[0_0_50px_rgba(234,179,8,0.4)] mb-6 border-4 border-yellow-300">
                         <Trophy size={48} className="text-white drop-shadow-md" />
                     </div>
                     <h1 className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-2">
                         SEASON {year} AWARDS
                     </h1>
                     <p className="text-slate-400 font-bold tracking-widest uppercase">The Best of the Best</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-12">
                     {renderAwardCard("Ballon d'Or", awards.ballonDor, <Crown size={32} className="text-yellow-400"/>, 100, "text-yellow-400")}
                     {renderAwardCard("Golden Glove", awards.goldenGlove, <Shield size={32} className="text-blue-400"/>, 200, "text-blue-400")}
                     {renderAwardCard("Golden Boy", awards.goldenBoy, <Star size={32} className="text-emerald-400"/>, 300, "text-emerald-400")}
                     {renderAwardCard("Manager of the Year", awards.managerOfYear, <Medal size={32} className="text-purple-400"/>, 400, "text-purple-400")}
                 </div>

                 {/* Team of the Year */}
                 <div className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-12 duration-700 delay-500">
                     <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-4">
                         <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400 border border-indigo-500/30">
                             <Shirt size={24} />
                         </div>
                         <h2 className="text-2xl font-display font-bold text-white">Team of the Year</h2>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                         {awards.teamOfYear.map((player, idx) => (
                             <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center gap-4 hover:border-indigo-500/50 transition-colors group">
                                 <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-500 border border-slate-700 group-hover:text-white group-hover:bg-indigo-600 transition-colors">
                                     {player.position}
                                 </div>
                                 <div>
                                     <div className="font-bold text-white">{player.name}</div>
                                     <div className="text-xs text-slate-500">{player.team}</div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>

                 <button 
                    onClick={onClose}
                    className="mt-12 px-8 py-4 bg-white text-slate-950 font-bold rounded-full hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-bounce"
                 >
                     Start New Season <ChevronRight size={20} />
                 </button>
             </div>
        </div>
    );
}

export default SeasonAwardsModal;
