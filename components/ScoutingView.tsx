
import React, { useState, useEffect } from 'react';
import { Player, TransferType, Coach, CoachRole } from '../types';
import { generateScoutedPlayer } from '../services/geminiService';
import PlayerCard from './PlayerCard';
import { ScanEye, Globe, MapPin, Search, Loader2, Target, CheckCircle, Radar, User, Flag, ArrowRight, UserPlus, Trash2, Mail, Users } from 'lucide-react';

interface ScoutingViewProps {
    budget: number;
    staff: Coach[];
    onSpendBudget: (amount: number) => void;
    onSignPlayer: (player: Player, type: TransferType, cost: number, futureFee?: number) => void;
}

interface ScoutingReport {
    id: string;
    player: Player;
    date: string;
    region: string;
    scoutName: string;
}

const REGIONS = [
    { id: 'UK_IRE', name: 'UK & Ireland', cost: 15000, risk: 'Low' },
    { id: 'WEST_EU', name: 'Western Europe', cost: 25000, risk: 'Low' },
    { id: 'SOUTH_AM', name: 'South America', cost: 40000, risk: 'Med' },
    { id: 'EAST_EU', name: 'Eastern Europe', cost: 20000, risk: 'Med' },
    { id: 'ASIA', name: 'Asia', cost: 15000, risk: 'High' },
    { id: 'AFRICA', name: 'Africa', cost: 20000, risk: 'High' },
];

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];
const AGES = ['Wonderkid (<21)', 'Prime (21-29)', 'Veteran (30+)'];

const ScoutingView: React.FC<ScoutingViewProps> = ({ budget, staff, onSpendBudget, onSignPlayer }) => {
    const [loading, setLoading] = useState(false);
    const [reports, setReports] = useState<ScoutingReport[]>([]);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    
    // Mission Config
    const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
    const [selectedPos, setSelectedPos] = useState(POSITIONS[2]);
    const [selectedAge, setSelectedAge] = useState(AGES[0]);
    const [selectedScoutId, setSelectedScoutId] = useState<string>('');

    // Filter available scouts
    const availableScouts = staff.filter(c => c.role === CoachRole.SCOUT);

    // Effect to validate selected scout presence
    useEffect(() => {
        if (selectedScoutId && !availableScouts.find(s => s.id === selectedScoutId)) {
            setSelectedScoutId('');
        }
    }, [staff, selectedScoutId]);

    const handleScout = async () => {
        if (!selectedScoutId && availableScouts.length > 0) {
            alert("Please select a scout for this mission.");
            return;
        }
        
        if (budget < selectedRegion.cost) {
            alert("Insufficient budget for this mission.");
            return;
        }

        const scout = availableScouts.find(s => s.id === selectedScoutId) || availableScouts[0];

        onSpendBudget(selectedRegion.cost);
        setLoading(true);

        // Artificial delay for effect
        await new Promise(resolve => setTimeout(resolve, 2000));

        const player = await generateScoutedPlayer({
            region: selectedRegion.name,
            position: selectedPos,
            ageGroup: selectedAge,
            scoutRating: scout?.rating
        });

        if (player) {
            const newReport: ScoutingReport = {
                id: `rep_${Date.now()}`,
                player: player,
                date: new Date().toLocaleDateString(),
                region: selectedRegion.name,
                scoutName: scout ? scout.name : 'Agency Scout'
            };
            setReports(prev => [newReport, ...prev]);
        } else {
            alert("Scouts came back empty handed.");
        }
        setLoading(false);
    };

    const deleteReport = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setReports(prev => prev.filter(r => r.id !== id));
        if (selectedReportId === id) setSelectedReportId(null);
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
    }

    const activeReport = reports.find(r => r.id === selectedReportId);

    return (
        <div className="flex h-full p-6 gap-6 overflow-hidden">
            {/* Left Column: Mission Control */}
            <div className="w-[400px] flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar relative">
                
                {availableScouts.length === 0 && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6 border border-slate-800 rounded-xl">
                        <Users size={48} className="text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Recruitment Offline</h3>
                        <p className="text-slate-400 text-sm mb-6">You must hire a Scout from the Staff department to launch scouting missions.</p>
                    </div>
                )}

                {/* Assignment Panel */}
                <div className={`bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl ${availableScouts.length === 0 ? 'opacity-20 pointer-events-none' : ''}`}>
                    <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-6 text-white">
                        <Radar className="text-emerald-400" />
                        New Assignment
                    </h2>

                    {/* Scout Selector */}
                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Assign Scout</label>
                        <select 
                            value={selectedScoutId}
                            onChange={(e) => setSelectedScoutId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                        >
                            <option value="" disabled>Select a Scout...</option>
                            {availableScouts.map(s => (
                                <option key={s.id} value={s.id}>{s.name} (Rating: {s.rating})</option>
                            ))}
                        </select>
                    </div>

                    {/* Region Selector */}
                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Target Region</label>
                        <div className="grid grid-cols-2 gap-2">
                            {REGIONS.map(reg => (
                                <button
                                    key={reg.id}
                                    onClick={() => setSelectedRegion(reg)}
                                    className={`p-3 rounded-lg border text-left transition-all ${
                                        selectedRegion.id === reg.id 
                                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                                    }`}
                                >
                                    <div className="font-bold text-sm mb-1">{reg.name}</div>
                                    <div className="flex justify-between items-center text-[10px] opacity-80 font-mono">
                                        <span>{formatMoney(reg.cost)}</span>
                                        <span className={reg.risk === 'High' ? 'text-red-300' : reg.risk === 'Med' ? 'text-yellow-300' : 'text-emerald-200'}>{reg.risk} Risk</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Criteria Selectors */}
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Tactical Focus</label>
                            <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                                {POSITIONS.map(pos => (
                                    <button
                                        key={pos}
                                        onClick={() => setSelectedPos(pos)}
                                        className={`px-3 py-1.5 rounded text-xs font-bold border whitespace-nowrap transition-all ${selectedPos === pos ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
                                    >
                                        {pos}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Age Profile</label>
                            <div className="flex flex-col gap-2">
                                {AGES.map(age => (
                                    <button
                                        key={age}
                                        onClick={() => setSelectedAge(age)}
                                        className={`px-4 py-2 rounded text-xs font-bold border text-left transition-all flex justify-between ${selectedAge === age ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
                                    >
                                        <span>{age.split(' (')[0]}</span>
                                        <span className="opacity-60">{age.split(' (')[1].replace(')', '')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleScout}
                        disabled={loading || budget < selectedRegion.cost}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            loading 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                            : budget < selectedRegion.cost 
                                ? 'bg-red-900/50 text-red-400 border border-red-800 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 hover:shadow-lg hover:shadow-emerald-500/20'
                        }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> ESTABLISHING LINK...
                            </>
                        ) : budget < selectedRegion.cost ? (
                            <>INSUFFICIENT FUNDS</>
                        ) : (
                            <>
                                <ScanEye size={18} /> DISPATCH SCOUT
                            </>
                        )}
                    </button>
                </div>
                
                {/* Network Status */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <Globe size={48} className="text-slate-700" />
                            <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                            <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full"></div>
                        </div>
                    </div>
                    <div className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-1">Global Network Active</div>
                    <div className="text-xs text-slate-600">Accessing databases in 142 countries</div>
                </div>
            </div>

            {/* Right Column: Reports & Results */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl flex flex-col overflow-hidden relative">
                 {/* Background Grid */}
                 <div className="absolute inset-0 pointer-events-none opacity-20" 
                    style={{
                        backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}>
                </div>

                <div className="p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm z-10 flex justify-between items-center">
                    <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                        <Mail className="text-blue-400" /> Scouting Inbox
                    </h2>
                    <div className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-full text-slate-400 border border-slate-700">
                        {reports.length} Reports
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden z-10">
                    {/* Report List */}
                    <div className="w-1/3 border-r border-slate-800 overflow-y-auto custom-scrollbar bg-slate-900/30">
                        {reports.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 italic text-sm">
                                No reports available. Send a scout to generate leads.
                            </div>
                        ) : (
                            reports.map(rep => (
                                <div 
                                    key={rep.id}
                                    onClick={() => setSelectedReportId(rep.id)}
                                    className={`p-4 border-b border-slate-800 cursor-pointer transition-all hover:bg-slate-800/50 group relative ${selectedReportId === rep.id ? 'bg-slate-800 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold text-white truncate pr-6">{rep.player.name}</div>
                                        <div className="font-bold text-emerald-400 text-xs bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{rep.player.rating}</div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <Flag size={10} /> {rep.player.nationality}
                                        </div>
                                        <div>{rep.player.position}</div>
                                    </div>
                                    <div className="text-[10px] text-slate-600 mt-1 truncate">
                                        Scout: {rep.scoutName}
                                    </div>
                                    
                                    <button 
                                        onClick={(e) => deleteReport(rep.id, e)}
                                        className="absolute top-4 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Report Details */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50 flex flex-col">
                        {activeReport ? (
                            <div className="p-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                                    <Target size={12} className="text-emerald-500" />
                                    Scouted in {activeReport.region} by {activeReport.scoutName}
                                </div>
                                <div className="w-full max-w-sm">
                                    <PlayerCard 
                                        player={activeReport.player} 
                                        isOwned={false} 
                                        budget={budget}
                                        onTransfer={onSignPlayer}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                                <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                                    <Search size={32} className="opacity-50" />
                                </div>
                                <p className="font-bold">Select a report to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScoutingView;
