
import React, { useState, useEffect } from 'react';
import { Player, Position, TransferType } from '../types';
import { generateTransferMarket } from '../services/geminiService';
import PlayerCard from './PlayerCard';
import { Search, Loader2, RefreshCw, Filter, Sparkles, X, ArrowUpDown, ChevronDown } from 'lucide-react';

interface TransferMarketProps {
    marketPlayers: Player[];
    setMarketPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    budget: number;
    onBuyPlayer: (player: Player, type: TransferType, cost: number, futureFee?: number) => void;
}

const TransferMarket: React.FC<TransferMarketProps> = ({ marketPlayers, setMarketPlayers, budget, onBuyPlayer }) => {
    const [loading, setLoading] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPos, setFilterPos] = useState('ALL');
    const [sortOption, setSortOption] = useState('RATING_DESC');

    useEffect(() => {
        if (marketPlayers.length === 0) {
            refreshMarket();
        }
    }, []);

    const refreshMarket = async () => {
        setLoading(true);
        // Small delay to allow exit animations if we had them, or just to show the loading state
        await new Promise(resolve => setTimeout(resolve, 600)); 
        const players = await generateTransferMarket(12);
        setMarketPlayers(players);
        setLoading(false);
    }

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
    }

    const filteredPlayers = marketPlayers
        .filter(p => {
            const matchName = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchPos = filterPos === 'ALL' || p.position === filterPos;
            return matchName && matchPos;
        })
        .sort((a, b) => {
            switch (sortOption) {
                case 'RATING_DESC': return b.rating - a.rating;
                case 'RATING_ASC': return a.rating - b.rating;
                case 'VALUE_DESC': return b.marketValue - a.marketValue;
                case 'VALUE_ASC': return a.marketValue - b.marketValue;
                case 'AGE_ASC': return a.age - b.age;
                case 'NAME_ASC': return a.name.localeCompare(b.name);
                default: return 0;
            }
        });

    return (
        <div className="h-full bg-slate-950 flex flex-col relative">
             {/* Header / Filter Bar */}
             <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-display font-bold">Transfer Market</h2>
                            <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={10} /> Live
                            </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 shadow-sm flex items-center gap-2">
                            <span className="text-xs text-slate-400 uppercase font-bold">Budget</span>
                            <span className={`font-mono font-bold transition-colors duration-500 ${budget < 5000000 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {formatMoney(budget)}
                            </span>
                        </div>
                        <button 
                            onClick={refreshMarket}
                            disabled={loading}
                            className={`flex items-center gap-2 px-3 py-2 rounded text-white font-bold text-sm transition-all shadow-lg ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-900/20'}`}
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            <span className="hidden sm:inline">{loading ? 'Scouting...' : 'Refresh Market'}</span>
                        </button>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Bar */}
                    <div className="relative flex-1 group">
                        {loading ? (
                            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" size={16} />
                        ) : (
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={16} />
                        )}
                        <input 
                            type="text" 
                            placeholder="Search player name..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder-slate-600 text-white"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2 overflow-x-auto">
                        {/* Sort Dropdown */}
                        <div className="relative shrink-0">
                            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" size={14} />
                            <select 
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-8 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500 appearance-none text-white cursor-pointer hover:bg-slate-900 transition-colors w-full md:w-auto min-w-[180px]"
                            >
                                <option value="RATING_DESC">Rating: High to Low</option>
                                <option value="RATING_ASC">Rating: Low to High</option>
                                <option value="VALUE_DESC">Value: High to Low</option>
                                <option value="VALUE_ASC">Value: Low to High</option>
                                <option value="AGE_ASC">Age: Youngest First</option>
                                <option value="NAME_ASC">Name: A to Z</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative shrink-0">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" size={14} />
                            <select 
                                value={filterPos}
                                onChange={(e) => setFilterPos(e.target.value)}
                                className="bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-8 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500 appearance-none text-white cursor-pointer hover:bg-slate-900 transition-colors w-full md:w-auto min-w-[150px]"
                            >
                                <option value="ALL">All Positions</option>
                                <option value="GK">Goalkeepers</option>
                                <option value="DEF">Defenders</option>
                                <option value="MID">Midfielders</option>
                                <option value="FWD">Forwards</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Player Grid */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                {loading && marketPlayers.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 animate-in fade-in duration-500">
                        <Loader2 size={40} className="animate-spin text-emerald-500" />
                        <p className="font-mono text-sm tracking-wide">Contacting agents...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredPlayers.length > 0 ? filteredPlayers.map((player, index) => (
                            <div 
                                key={player.id}
                                onClick={() => setSelectedPlayer(player)}
                                style={{ animationDelay: `${index * 50}ms` }}
                                className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards hover:scale-[1.02] hover:shadow-xl hover:shadow-black/40 group bg-slate-900 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border border-white/5 shadow-sm ${player.position === Position.GK ? 'bg-yellow-500/10 text-yellow-400' : player.position === Position.DEF ? 'bg-blue-500/10 text-blue-400' : player.position === Position.MID ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {player.position}
                                    </span>
                                    <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-xs shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                        {player.rating}
                                    </span>
                                </div>
                                <h3 className="font-bold text-white truncate text-lg">{player.name}</h3>
                                <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
                                    <span>{player.age} yrs</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                    <span className="truncate max-w-[100px]">{player.nationality}</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-800/50 flex justify-between items-center group-hover:border-slate-700 transition-colors">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 group-hover:text-slate-400">Value</span>
                                    <span className="font-mono font-bold text-white text-sm tracking-tight">{formatMoney(player.marketValue)}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-500">
                                <Search size={48} className="mb-4 opacity-50" />
                                <p className="text-lg font-bold">No players found</p>
                                <p className="text-sm">Try adjusting your search criteria</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Player Negotiation Modal */}
            {selectedPlayer && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPlayer(null)}>
                    <div onClick={(e) => e.stopPropagation()}> 
                        <PlayerCard 
                        player={selectedPlayer} 
                        isOwned={false} 
                        budget={budget}
                        onTransfer={onBuyPlayer}
                        onClose={() => setSelectedPlayer(null)} 
                    />
                    </div>
                </div>
            )}
        </div>
    )
}

export default TransferMarket;
