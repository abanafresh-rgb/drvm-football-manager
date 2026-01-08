import React, { useState, useEffect } from 'react';
import { Coach, CoachRole } from '../types';
import { generateStaffMarket } from '../services/geminiService';
import { Briefcase, UserPlus, UserMinus, Star, DollarSign, Award, RefreshCw, Loader2, Users } from 'lucide-react';

interface StaffViewProps {
    currentStaff: Coach[];
    budget: number;
    onHire: (coach: Coach) => void;
    onFire: (coachId: string, severance: number) => void;
}

const StaffView: React.FC<StaffViewProps> = ({ currentStaff, budget, onHire, onFire }) => {
    const [availableStaff, setAvailableStaff] = useState<Coach[]>([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        loadMarket();
    }, []);

    const loadMarket = async () => {
        setLoading(true);
        const staff = await generateStaffMarket(6);
        setAvailableStaff(staff);
        setLoading(false);
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
    };

    const handleFire = (coach: Coach) => {
        // Severance is typically remaining contract, let's estimate 10 weeks
        const severance = coach.salary * 10;
        if (confirm(`Fire ${coach.name}? You must pay a severance package of ${formatMoney(severance)}.`)) {
            onFire(coach.id, severance);
        }
    };

    const handleHire = (coach: Coach) => {
        if (budget < coach.signingFee) {
            alert("Insufficient funds for signing fee.");
            return;
        }
        if (confirm(`Hire ${coach.name} as ${coach.role}?\nSign-on Fee: ${formatMoney(coach.signingFee)}\nWeekly Wage: ${formatMoney(coach.salary)}`)) {
            onHire(coach);
            setAvailableStaff(prev => prev.filter(c => c.id !== coach.id));
        }
    };

    const getRoleColor = (role: CoachRole) => {
        switch(role) {
            case CoachRole.ASSISTANT: return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            case CoachRole.FITNESS: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case CoachRole.PHYSIO: return 'text-red-400 bg-red-500/10 border-red-500/20';
            case CoachRole.SCOUT: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    const totalWages = currentStaff.reduce((acc, s) => acc + s.salary, 0);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header Stats */}
            <div className="bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                        <Users className="text-emerald-500" /> Coaching Staff
                    </h2>
                    <p className="text-slate-400 text-sm">Manage your backroom team to improve training and match performance.</p>
                </div>
                <div className="flex gap-6">
                    <div className="text-right">
                         <div className="text-[10px] font-bold text-slate-500 uppercase">Staff Size</div>
                         <div className="text-xl font-bold text-white">{currentStaff.length} / 12</div>
                    </div>
                    <div className="text-right">
                         <div className="text-[10px] font-bold text-slate-500 uppercase">Weekly Wages</div>
                         <div className="text-xl font-bold text-red-400">-{formatMoney(totalWages)}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-8">
                
                {/* Current Staff List */}
                <div className="flex-1 space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Briefcase size={18} className="text-slate-400"/> Current Staff
                    </h3>
                    
                    {currentStaff.length === 0 ? (
                        <div className="p-8 border border-dashed border-slate-700 rounded-xl text-center text-slate-500">
                            No staff hired yet. Check the recruitment center.
                        </div>
                    ) : (
                        currentStaff.map(coach => (
                            <div key={coach.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between group hover:border-slate-600 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-300 border border-slate-700">
                                        {coach.rating}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-lg">{coach.name}</div>
                                        <div className={`text-xs font-bold px-2 py-0.5 rounded inline-block border mt-1 ${getRoleColor(coach.role)}`}>
                                            {coach.role}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="text-sm text-slate-400 flex items-center gap-1">
                                        <Award size={14} className="text-yellow-500" /> {coach.specialty}
                                    </div>
                                    <div className="text-xs font-mono text-slate-500">{formatMoney(coach.salary)}/wk</div>
                                </div>
                                <button 
                                    onClick={() => handleFire(coach)}
                                    className="ml-4 p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-500/20 opacity-0 group-hover:opacity-100"
                                    title="Fire Staff"
                                >
                                    <UserMinus size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Recruitment Center */}
                <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-fit">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <UserPlus size={18} className="text-emerald-400"/> Recruitment Center
                        </h3>
                        <button 
                            onClick={loadMarket} 
                            disabled={loading}
                            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-12 text-center text-slate-500">
                                <Loader2 size={32} className="mx-auto mb-2 animate-spin text-emerald-500"/>
                                Searching database...
                            </div>
                        ) : (
                            availableStaff.map(coach => (
                                <div key={coach.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:shadow-lg transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-white">{coach.name}</div>
                                            <div className="text-xs text-slate-400">{coach.nationality} • {coach.age} yrs</div>
                                        </div>
                                        <div className="font-bold text-emerald-400 text-lg border border-emerald-500/20 bg-emerald-500/10 px-2 rounded">
                                            {coach.rating}
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getRoleColor(coach.role)}`}>
                                            {coach.role}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-500/20 bg-yellow-500/10 text-yellow-500 uppercase flex items-center gap-1">
                                            <Star size={10} fill="currentColor" /> {coach.specialty}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-slate-800/50">
                                        <div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold">Sign-on Fee</div>
                                            <div className="text-sm font-mono text-white">{formatMoney(coach.signingFee)}</div>
                                        </div>
                                        <button 
                                            onClick={() => handleHire(coach)}
                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-1 transition-colors shadow-lg shadow-emerald-900/20"
                                        >
                                            <DollarSign size={12} /> Hire
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffView;