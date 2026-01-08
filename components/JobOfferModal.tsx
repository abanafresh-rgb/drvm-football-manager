
import React, { useState } from 'react';
import { JobOffer } from '../types';
import { Briefcase, CheckCircle2, XCircle, Shield, ChevronLeft, ChevronRight, Building2, Banknote, Star } from 'lucide-react';

interface JobOfferModalProps {
    offers: JobOffer[];
    onAccept: (offer: JobOffer) => void;
    onReject: () => void;
}

const JobOfferModal: React.FC<JobOfferModalProps> = ({ offers, onAccept, onReject }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const offer = offers[currentIndex];

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
    }

    const nextOffer = () => {
        if (currentIndex < offers.length - 1) setCurrentIndex(curr => curr + 1);
    };

    const prevOffer = () => {
        if (currentIndex > 0) setCurrentIndex(curr => curr - 1);
    };

    if (!offer) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 border-b border-slate-700 relative">
                    <div className="absolute top-4 right-4 text-emerald-500 animate-pulse">
                        <Briefcase size={24} />
                    </div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-display font-bold text-white">Job Offers</h2>
                        {offers.length > 1 && (
                            <span className="px-2 py-0.5 bg-slate-700 rounded text-[10px] font-bold text-white border border-slate-600">
                                {currentIndex + 1} / {offers.length}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400 text-sm">You have been approached by interested clubs.</p>
                </div>

                {/* Content */}
                <div className="p-6 flex-1">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-20 h-20 rounded-full border-4 border-slate-800 shadow-xl flex items-center justify-center text-4xl font-bold bg-slate-950 shrink-0" style={{ borderColor: offer.primaryColor, color: offer.primaryColor }}>
                            <Shield size={40} fill="currentColor" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-3xl font-bold text-white truncate">{offer.name}</h3>
                            <div className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 inline-block mt-2 uppercase tracking-wide">
                                {offer.league}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 mb-6 italic text-slate-300 text-sm leading-relaxed relative">
                        <span className="text-4xl absolute -top-2 -left-2 text-slate-700 font-serif">"</span>
                        {offer.description}
                        <span className="text-4xl absolute -bottom-4 right-2 text-slate-700 font-serif">"</span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex flex-col justify-between">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                                <Building2 size={12} /> Club Value
                            </div>
                            <div className="text-white font-mono font-bold text-sm truncate">{formatMoney(offer.clubValue)}</div>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex flex-col justify-between">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                                <Building2 size={12} /> Facilities
                            </div>
                            <div className="text-white font-bold text-sm truncate">{offer.facilitiesLevel}</div>
                        </div>
                    </div>

                    {/* Strength Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold text-slate-400 flex items-center gap-1"><Star size={12}/> Team Strength</span>
                            <span className="font-bold text-emerald-400">{offer.teamRating}/100</span>
                        </div>
                        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                            <div 
                                className={`h-full ${offer.teamRating > 80 ? 'bg-emerald-500' : offer.teamRating > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`} 
                                style={{ width: `${offer.teamRating}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Transfer Budget</div>
                            <div className="text-emerald-400 font-mono font-bold text-lg">{formatMoney(offer.transferBudget)}</div>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Wage Budget</div>
                            <div className="text-white font-mono font-bold text-lg">{formatMoney(offer.wageBudget)}/wk</div>
                        </div>
                    </div>
                </div>

                {/* Navigation & Actions */}
                <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col gap-3">
                    {offers.length > 1 && (
                        <div className="flex justify-between items-center px-2 mb-2">
                            <button 
                                onClick={prevOffer} 
                                disabled={currentIndex === 0}
                                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div className="flex gap-1">
                                {offers.map((_, idx) => (
                                    <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-emerald-500 w-4' : 'bg-slate-700'}`}></div>
                                ))}
                            </div>
                            <button 
                                onClick={nextOffer} 
                                disabled={currentIndex === offers.length - 1}
                                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button 
                            onClick={onReject}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700"
                        >
                            <XCircle size={18} /> Reject All
                        </button>
                        <button 
                            onClick={() => onAccept(offer)}
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                        >
                            Accept Offer <CheckCircle2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobOfferModal;
