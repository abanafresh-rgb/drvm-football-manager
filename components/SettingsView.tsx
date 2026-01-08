
import React, { useState, useEffect } from 'react';
import { GameSettings, SaveData } from '../types';
import { Save, Download, RefreshCw, Volume2, VolumeX, Moon, Sun, Trash2, CheckCircle2, AlertTriangle, PlayCircle, Smartphone } from 'lucide-react';

interface SettingsViewProps {
    settings: GameSettings;
    onUpdateSettings: (newSettings: GameSettings) => void;
    onSaveGame: () => void;
    onLoadGame: () => void;
    onResetGame: () => void;
    hasSave: boolean;
    lastSaveDate: string | null;
    canInstall?: boolean;
    onInstall?: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings, onSaveGame, onLoadGame, onResetGame, hasSave, lastSaveDate, canInstall, onInstall }) => {
    
    const toggleSound = () => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled });
    const toggleAutoSave = () => onUpdateSettings({ ...settings, autoSave: !settings.autoSave });
    
    return (
        <div className="h-full flex flex-col bg-slate-950">
            <div className="p-8 border-b border-slate-800 bg-slate-900/50">
                <h2 className="text-3xl font-display font-bold text-white mb-2">Game Settings & Data</h2>
                <p className="text-slate-400">Manage your preferences and career progress.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
                
                {/* Installation Section */}
                {canInstall && (
                    <div className="mb-12 animate-in fade-in slide-in-from-top-4">
                        <div className="bg-gradient-to-r from-emerald-900/30 to-slate-900 border border-emerald-500/30 rounded-xl p-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                    <Smartphone className="text-emerald-400" /> Install App
                                </h3>
                                <p className="text-slate-400 text-sm">Add DrvmFM to your home screen for the full immersive experience.</p>
                            </div>
                            <button 
                                onClick={onInstall}
                                className="px-6 py-3 bg-white text-slate-950 font-bold rounded-lg hover:bg-emerald-400 transition-all shadow-lg"
                            >
                                Install Now
                            </button>
                        </div>
                    </div>
                )}

                {/* Save/Load Section */}
                <div className="mb-12">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Save className="text-emerald-500" /> Career Progress
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                            <div>
                                <div className="font-bold text-white text-lg mb-2">Manual Save</div>
                                <p className="text-slate-400 text-sm mb-4">Save your current progress to local storage.</p>
                            </div>
                            <button 
                                onClick={onSaveGame}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                            >
                                <Save size={18} /> Save Game
                            </button>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                            <div>
                                <div className="font-bold text-white text-lg mb-1">Load Game</div>
                                {hasSave ? (
                                    <p className="text-emerald-400 text-xs font-mono mb-4 flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Last Saved: {lastSaveDate}
                                    </p>
                                ) : (
                                    <p className="text-slate-500 text-sm mb-4">No save data found.</p>
                                )}
                            </div>
                            <button 
                                onClick={onLoadGame}
                                disabled={!hasSave}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                            >
                                <Download size={18} /> Load Game
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div className="mb-12">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <PlayCircle className="text-blue-500" /> Preferences
                    </h3>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${settings.autoSave ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                    <RefreshCw size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-white">Auto-Save</div>
                                    <div className="text-xs text-slate-500">Automatically save after every match</div>
                                </div>
                            </div>
                            <button 
                                onClick={toggleAutoSave}
                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoSave ? 'bg-emerald-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.autoSave ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${settings.soundEnabled ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                                    {settings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                                </div>
                                <div>
                                    <div className="font-bold text-white">Sound Effects</div>
                                    <div className="text-xs text-slate-500">Match engine commentary and UI sounds</div>
                                </div>
                            </div>
                            <button 
                                onClick={toggleSound}
                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.soundEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.soundEnabled ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div>
                    <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-red-500" /> Danger Zone
                    </h3>
                    <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-6 flex items-center justify-between">
                        <div>
                            <div className="font-bold text-white text-lg">Reset Career</div>
                            <p className="text-red-300/70 text-sm">Permanently delete your current save and start over.</p>
                        </div>
                        <button 
                            onClick={() => {
                                if(confirm("Are you sure you want to delete your save file? This cannot be undone.")) {
                                    onResetGame();
                                }
                            }}
                            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-red-900/20"
                        >
                            <Trash2 size={18} /> Reset Data
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SettingsView;
