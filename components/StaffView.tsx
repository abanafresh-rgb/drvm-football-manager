
import React, { useState, useEffect } from 'react';
import { Coach, CoachRole } from '../types';
import { generateStaffMarket } from '../services/geminiService';
import { Briefcase, UserPlus, UserMinus, Star, DollarSign, Award, RefreshCw, Loader2, Users, HeartPulse, Shield, Crosshair, GraduationCap, ScanEye, Activity } from 'lucide-react';

interface StaffViewProps {
    currentStaff: Coach[];
    budget: number;
    onHire: (coach: Coach) => void;
    onFire: (coachId: string, severance: number) => void;
}

const STAFF_LIMITS = {
    [CoachRole.ASSISTANT]: 1,
    [CoachRole.GK_COACH]: 1,
    [CoachRole.DEF_COACH]: 1,
    [CoachRole.ATT_COACH]: 1,
    [CoachRole.FITNESS]: 2,
    [CoachRole.HEAD_PHYSIO]: 1,
    [CoachRole.SCOUT]: 3,
    [CoachRole.YOUTH_COACH]: 2
};

const CATEGORIES = [
    {
        id: 'TECHNICAL',
        label: 'Coaching Team',
        roles: [CoachRole.ASSISTANT, CoachRole.ATT_COACH, CoachRole.DEF_COACH, CoachRole.GK_COACH],
        icon: <Briefcase size={20} className="text-indigo-400" />
    },
    {
        id: 'MEDICAL',
        label: 'Medical & Performance',
        roles: [CoachRole.HEAD_PHYSIO, CoachRole.FITNESS],
        icon: <HeartPulse size={20} className="text-red-400" />
    },
    {
        id: 'RECRUITMENT',
        label: 'Recruitment & Development',
        roles: [CoachRole.SCOUT, CoachRole.YOUTH_COACH],
        icon: <ScanEye size={20} className="text-emerald-400" />
    }
];

const StaffView: React.FC<StaffViewProps> = ({ currentStaff, budget, onHire, onFire }) => {
    const [availableStaff, setAvailableStaff] = useState<Coach[]>([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        loadMarket();
    }, []);

    const loadMarket = async () => {
        setLoading(true);
        const staff = await generateStaffMarket(8);
        setAvailableStaff(staff);
        setLoading(false);
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
    };

    const handleFire = (coach: Coach) => {
        const severance = coach.salary * 10;
        if (confirm(`Fire ${coach.name}? You must pay a severance package of ${formatMoney(severance)}.`)) {
            onFire(coach.id, severance);
        }
    };

    const handleHire = (coach: Coach) => {
        // Check Limit
        const currentCount = currentStaff.filter(c => c.role === coach.role).length;
        const limit = STAFF_LIMITS[coach.role];
        
        if (currentCount >= limit) {
            alert(`You have reached the limit for ${coach.role}s (${limit}). You must fire someone first.`);
            return;
        }

        if (budget < coach.signingFee) {
            alert("Insufficient funds for signing fee.");
            return;
        }
        
        if (confirm(`Hire ${coach.name} as ${coach.role}?\nSign-on Fee: ${formatMoney(coach.signingFee)}\nWeekly Wage: ${formatMoney(coach.salary)}`)) {
            onHire(coach);
            setAvailableStaff(prev => prev.filter(c => c.id !== coach.id));
        }
    };

    const getRoleIcon = (role: CoachRole) => {
        switch(role) {
            case CoachRole.ASSISTANT: return <Users size={14} />;
            case CoachRole.GK_COACH: return <Shield size={14} />;
            case CoachRole.DEF_COACH: return <Shield size={14} />;
            case CoachRole.ATT_COACH: return <Crosshair size={14} />;
            case CoachRole.FITNESS: return <Activity size={14} />;
            case CoachRole.HEAD_PHYSIO: return <HeartPulse size={14} />;
            case CoachRole.SCOUT: return <ScanEye size={14} />;
            case CoachRole.YOUTH_COACH: return <GraduationCap size={14} />;
            default: return <Briefcase size={14} />;
        }
    };

    const getRoleColor = (role: CoachRole) => {
        switch(role) {
            case CoachRole.ASSISTANT: return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            case CoachRole.GK_COACH: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            case CoachRole.DEF_COACH: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case CoachRole.ATT_COACH: return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            case CoachRole.FITNESS: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case CoachRole.HEAD_PHYSIO: return 'text-red-400 bg-red-500/10 border-red-500/20';
            case CoachRole.SCOUT: return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
            case CoachRole.YOUTH_COACH: return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    const totalWages = currentStaff.reduce((acc, s) => acc + s.salary, 0);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header Stats */}
            <div className="bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                        <Users className="text-emerald-500" /> Coaching & Backroom Staff
                    </h2>
                    <p className="text-slate-400 text-sm">Build a world-class support team to drive success.</p>
                </div>
                <div className="flex gap-6">
                    <div className="text-right">
                         <div className="text-[10px] font-bold text-slate-500 uppercase">Total Staff</div>
                         <div className="text-xl font-bold text-white">{currentStaff.length}</div>
                    </div>
                    <div className="text-right">
                         <div className="text-[10px] font-bold text-slate-500 uppercase">Weekly Cost</div>
                         <div className="text-xl font-bold text-red-400">-{formatMoney(totalWages)}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-6 flex flex-col lg:flex-row gap-8">
                
                {/* Staff Structure */}
                <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
                    
                    {CATEGORIES.map(cat => (
                        <div key={cat.id} className="mb-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                                {cat.icon} {cat.label}
                            </h3>
                            <div className="space-y-3">
                                {cat.roles.map(role => {
                                    const hired = currentStaff.filter(s => s.role === role);
                                    const limit = STAFF_LIMITS[role];
                                    const slots = Array.from({ length: limit });

                                    return (
                                        <div key={role} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`p-1.5 rounded-lg border ${getRoleColor(role)}`}>
                                                        {getRoleIcon(role)}
                                                    </span>
                                                    <span className="font-bold text-white text-sm">{role}</span>
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                                    {hired.length} / {limit} Filled
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {slots.map((_, idx) => {
                                                    const staffMember = hired[idx];
                                                    if (staffMember) {
                                                        return (
                                                            <div key={staffMember.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center group hover:border-slate-600 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-bold text-xs text-emerald-400 border border-slate-700">
                                                                        {staffMember.rating}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-bold text-white">{staffMember.name}</div>
                                                                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                                            <Star size={10} className="text-yellow-500" /> {staffMember.specialty}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button 
                                                                    onClick={() => handleFire(staffMember)}
                                                                    className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                                    title="Fire Staff"
                                                                >
                                                                    <UserMinus size={16} />
                                                                </button>
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <div key={`empty_${idx}`} className="bg-slate-950/30 p-3 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-600 font-bold gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                                                                Empty Slot
                                                            </div>
                                                        );
                                                    }
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recruitment Center */}
                <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-fit max-h-full overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <UserPlus size={18} className="text-emerald-400"/> Staff Market
                        </h3>
                        <button 
                            onClick={loadMarket} 
                            disabled={loading}
                            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="space-y-4 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="py-12 text-center text-slate-500">
                                <Loader2 size={32} className="mx-auto mb-2 animate-spin text-emerald-500"/>
                                Searching database...
                            </div>
                        ) : (
                            availableStaff.map(coach => {
                                const currentCount = currentStaff.filter(c => c.role === coach.role).length;
                                const limit = STAFF_LIMITS[coach.role];
                                const isFull = currentCount >= limit;

                                return (
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
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${getRoleColor(coach.role)}`}>
                                            {getRoleIcon(coach.role)} {coach.role}
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
                                            disabled={isFull}
                                            className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1 transition-colors shadow-lg ${
                                                isFull 
                                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                                            }`}
                                        >
                                            {isFull ? 'No Slots' : <><DollarSign size={12} /> Hire</>}
                                        </button>
                                    </div>
                                </div>
                            )})
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffView;
