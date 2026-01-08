import React, { useState, useEffect } from 'react';
import { JobOffer } from '../types';
import { generateJobOffers } from '../services/geminiService';
import { Briefcase, AlertOctagon, RefreshCw, CheckCircle2, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';

interface JobHuntViewProps {
    reputation: number;
    onAcceptJob: (offer: JobOffer) => void;
}

const JobHuntView: React.FC<JobHuntViewProps> = ({ reputation, onAcceptJob }) => {
    const [loading, setLoading] = useState(false);
    const [offers, setOffers] = useState<JobOffer[]>([]);

    useEffect(() => {
        loadOffers();
    }, [reputation]);

    const loadOffers = async () => {
        setLoading(true);
        const newOffers = await generateJobOffers(reputation);
        setOffers(newOffers);
        setLoading(false);
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
    }

    return (
        <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden relative">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>

            <div className="p-8 max-w-5xl mx-auto w-full z-10 flex flex-col h-full">
                
                {/* Header Section */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="inline-flex items-center justify-center p-4 bg-red-500/10 rounded-full border border-red-500/20 mb-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <AlertOctagon size={48} className="text-red-500" />
                    </div>
                    <h1 className="text-5xl font-display font-bold text-white mb-2 tracking-wide">CAREER CRISIS</h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Following your recent dismissal, your reputation in the football world has taken a significant hit. 
                        Top clubs are no longer interested. You must rebuild your career from the ground up.
                    </p>
                    
                    <div className="mt-6 flex items-center justify-center gap-4">
                        <div className="bg-slate-900 border border-slate-800 px-6 py-3 rounded-lg flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-[10px] text-slate-500 uppercase font-bold">Current Reputation</div>
                                <div className={`text-2xl font-bold ${reputation < 50 ? 'text-red-400' : 'text-yellow-400'}`}>{reputation}/100</div>
                            </div>
                            {reputation < 50 ? <TrendingDown size={24} className="text-red-500" /> : <TrendingUp size={24} className="text-yellow-500" />}
                        </div>
                    </div>
                </div>

                {/* Job Listings */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Briefcase className="text-emerald-500" /> Available Positions
                        </h2>
                        <button 
                            onClick={loadOffers} 
                            disabled={loading}
                            className="text-sm text-slate-400 hover:text-white flex items-center gap-2 disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Listings
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 size={40} className="animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-8 custom-scrollbar">
                            {offers.map((offer, idx) => (
                                <div 
                                    key={offer.id} 
                                    className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-600 transition-all hover:shadow-xl hover:scale-[1.02] flex flex-col group animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-backwards"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-full border-2 border-slate-700 flex items-center justify-center text-xl font-bold bg-slate-800 shadow-lg" style={{ borderColor: offer.primaryColor }}>
                                            {offer.name.charAt(0)}
                                        </div>
                                        <div className="px-3 py-1 bg-slate-800 rounded text-[10px] font-bold text-slate-400 border border-slate-700 uppercase">
                                            {offer.league}
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{offer.name}</h3>
                                    <p className="text-xs text-slate-500 mb-4 h-10">{offer.description}</p>
                                    
                                    <div className="space-y-3 mb-6 bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Transfer Budget</span>
                                            <span className="font-mono font-bold text-emerald-400">{formatMoney(offer.transferBudget)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Wage Budget</span>
                                            <span className="font-mono font-bold text-white">{formatMoney(offer.wageBudget)}/wk</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => onAcceptJob(offer)}
                                        className="mt-auto w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all group-hover:shadow-emerald-500/20"
                                    >
                                        Accept Offer <CheckCircle2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobHuntView;