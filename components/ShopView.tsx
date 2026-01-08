import React, { useState, useEffect } from 'react';
import { Coins, Zap, HeartPulse, CreditCard, ShoppingBag, ArrowRight, Bandage, Megaphone, Banknote, Star, WifiOff } from 'lucide-react';

interface ShopViewProps {
    goldCoins: number;
    onBuyCoins: (amount: number, cost: string) => void;
    onBuyBoost: (type: 'RECOVERY' | 'HEAL' | 'MORALE' | 'BUDGET', cost: number) => void;
}

const ShopView: React.FC<ShopViewProps> = ({ goldCoins, onBuyCoins, onBuyBoost }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const coinPacks = [
        { id: 1, amount: 100, cost: '$0.99', label: 'Handful of Coins', icon: <Coins size={24} className="text-yellow-200" /> },
        { id: 2, amount: 550, cost: '$4.99', label: 'Pouch of Gold', icon: <Coins size={32} className="text-yellow-300" />, popular: true },
        { id: 3, amount: 1200, cost: '$9.99', label: 'Chest of Gold', icon: <Coins size={40} className="text-yellow-400" /> },
        { id: 4, amount: 3000, cost: '$19.99', label: 'Treasury Vault', icon: <Coins size={48} className="text-yellow-500" /> },
    ];

    const boosts = [
        { 
            id: 'RECOVERY', 
            name: 'Full Squad Recovery', 
            desc: 'Restores 100% condition to every player in your squad immediately.', 
            cost: 150, 
            icon: <HeartPulse size={24} className="text-emerald-400" />,
            color: 'bg-emerald-900/20 border-emerald-500/30'
        },
        { 
            id: 'HEAL', 
            name: 'Magic Sponge', 
            desc: 'Miraculously heals all injuries in the squad instantly.', 
            cost: 300, 
            icon: <Bandage size={24} className="text-blue-400" />,
            color: 'bg-blue-900/20 border-blue-500/30'
        },
        { 
            id: 'MORALE', 
            name: 'Inspirational Talk', 
            desc: 'Boosts team morale to maximum level for upcoming fixtures.', 
            cost: 100, 
            icon: <Megaphone size={24} className="text-purple-400" />,
            color: 'bg-purple-900/20 border-purple-500/30'
        },
        { 
            id: 'BUDGET', 
            name: 'Financial Injection', 
            desc: 'Exchange gold coins for €10,000,000 transfer budget.', 
            cost: 500, 
            icon: <Banknote size={24} className="text-yellow-400" />,
            color: 'bg-yellow-900/20 border-yellow-500/30'
        },
    ];

    return (
        <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                        <ShoppingBag className="text-emerald-500" size={32} /> 
                        Club Shop
                    </h2>
                    <p className="text-slate-400 mt-1">Purchase premium currency and exclusive gameplay boosts.</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-900 px-6 py-3 rounded-full border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-lg">
                        <Coins size={16} className="text-yellow-950" />
                    </div>
                    <div>
                        <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Balance</div>
                        <div className="text-2xl font-bold text-white leading-none">{new Intl.NumberFormat().format(goldCoins)}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 relative">
                
                {/* Offline Warning Overlay */}
                {!isOnline && (
                    <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-red-500/90 backdrop-blur-md text-white font-bold flex items-center justify-center gap-2 shadow-lg animate-in slide-in-from-top-full duration-300">
                        <WifiOff size={20} />
                        You are currently offline. An internet connection is required to make purchases.
                    </div>
                )}

                <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 ${!isOnline ? 'opacity-50 pointer-events-none filter grayscale-[0.5]' : ''}`}>
                    
                    {/* Coin Store */}
                    <div className="lg:col-span-5 space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <CreditCard size={20} className="text-slate-400"/> Currency Store
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                            {coinPacks.map(pack => (
                                <button 
                                    key={pack.id}
                                    onClick={() => isOnline && onBuyCoins(pack.amount, pack.cost)}
                                    disabled={!isOnline}
                                    className="relative flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-900 hover:border-yellow-500/50 hover:bg-slate-800 transition-all group overflow-hidden disabled:cursor-not-allowed"
                                >
                                    {pack.popular && (
                                        <div className="absolute top-0 right-0 bg-yellow-500 text-yellow-950 text-[10px] font-bold px-2 py-0.5 rounded-bl">
                                            BEST VALUE
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 z-10">
                                        <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 group-hover:border-yellow-500/30 transition-colors">
                                            {pack.icon}
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-lg text-white group-hover:text-yellow-400 transition-colors">{pack.amount} Coins</div>
                                            <div className="text-xs text-slate-500">{pack.label}</div>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-slate-950 rounded-lg border border-slate-700 text-white font-bold group-hover:bg-emerald-600 group-hover:border-emerald-500 transition-all z-10">
                                        {pack.cost}
                                    </div>
                                    {/* BG Glow */}
                                    <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Boost Store */}
                    <div className="lg:col-span-7 space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Zap size={20} className="text-slate-400"/> Player Boosts & Consumables
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {boosts.map(boost => (
                                <div key={boost.id} className={`p-5 rounded-xl border ${boost.color} flex flex-col justify-between relative overflow-hidden group`}>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-slate-950/50 rounded-lg backdrop-blur-sm border border-white/10">
                                                {boost.icon}
                                            </div>
                                            <div className="flex items-center gap-1 text-yellow-400 font-bold bg-slate-950/80 px-2 py-1 rounded border border-yellow-500/20">
                                                <Star size={12} fill="currentColor" /> {boost.cost}
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-lg text-white mb-2">{boost.name}</h4>
                                        <p className="text-sm text-slate-400 leading-relaxed mb-6 h-12">{boost.desc}</p>
                                    </div>
                                    
                                    <button 
                                        onClick={() => isOnline && onBuyBoost(boost.id as any, boost.cost)}
                                        disabled={!isOnline || goldCoins < boost.cost}
                                        className={`relative z-10 w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                            isOnline && goldCoins >= boost.cost 
                                            ? 'bg-slate-950 hover:bg-white hover:text-slate-950 text-white border border-slate-700' 
                                            : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                                        }`}
                                    >
                                        {!isOnline ? 'Offline' : goldCoins >= boost.cost ? 'Purchase Boost' : 'Insufficient Coins'} <ArrowRight size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ShopView;