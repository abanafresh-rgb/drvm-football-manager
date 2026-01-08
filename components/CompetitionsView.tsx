
import React, { useState } from 'react';
import { SeasonState, CompetitionType, Competition, LeagueTableEntry, Team } from '../types';
import { Trophy, Calendar, Table, ChevronRight, Medal, Globe, Shield, Star, Users, CalendarCheck } from 'lucide-react';

interface CompetitionsViewProps {
    seasonState: SeasonState;
    myTeam: Team;
    teamRatings: Record<string, number>;
}

const CompetitionsView: React.FC<CompetitionsViewProps> = ({ seasonState, myTeam, teamRatings }) => {
    const [activeTab, setActiveTab] = useState<'TABLE' | 'CALENDAR' | 'CUPS' | 'EUROPE' | 'RESULTS'>('TABLE');

    const leagueComp = seasonState.competitions.find(c => c.type === CompetitionType.LEAGUE);
    const cupComp = seasonState.competitions.find(c => c.type === CompetitionType.DOMESTIC_CUP);
    const euroComps = seasonState.competitions.filter(c => c.type === CompetitionType.CONTINENTAL_CUP);

    const renderTable = (tableData: LeagueTableEntry[], title: string, subTitle: string, icon: React.ReactNode, colorClass: string) => (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg text-white ${colorClass}`}>
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-xl font-display font-bold text-white">{title}</h2>
                        <p className="text-xs text-slate-400">{subTitle}</p>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                            <th className="p-4 w-12 text-center">Pos</th>
                            <th className="p-4">Club</th>
                            <th className="p-4 w-12 text-center">Rtg</th>
                            <th className="p-4 w-12 text-center">P</th>
                            <th className="p-4 w-12 text-center">W</th>
                            <th className="p-4 w-12 text-center">D</th>
                            <th className="p-4 w-12 text-center">L</th>
                            <th className="p-4 w-12 text-center">GD</th>
                            <th className="p-4 w-12 text-center">Pts</th>
                            <th className="p-4 w-32 text-center hidden md:table-cell">Form</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-sm">
                        {tableData.map((entry, index) => {
                            const isMyTeam = entry.teamName === myTeam.name;
                            const rating = teamRatings[entry.teamName] || '-';
                            return (
                                <tr key={entry.teamName} className={`${isMyTeam ? 'bg-emerald-900/10' : 'hover:bg-slate-800/30'} transition-colors`}>
                                    <td className="p-4 text-center">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                            index === 0 ? 'bg-yellow-500 text-black' : 
                                            index < 4 ? 'bg-blue-500/20 text-blue-400' :
                                            index > tableData.length - 4 ? 'bg-red-500/20 text-red-400' : 'text-slate-500'
                                        }`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold text-white flex items-center gap-2">
                                        {isMyTeam && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                                        {entry.teamName}
                                    </td>
                                    <td className="p-4 text-center font-bold text-slate-300">{rating}</td>
                                    <td className="p-4 text-center text-slate-400">{entry.played}</td>
                                    <td className="p-4 text-center text-slate-400">{entry.won}</td>
                                    <td className="p-4 text-center text-slate-400">{entry.drawn}</td>
                                    <td className="p-4 text-center text-slate-400">{entry.lost}</td>
                                    <td className="p-4 text-center text-slate-400 font-mono">
                                        {entry.goalsFor - entry.goalsAgainst > 0 ? '+' : ''}{entry.goalsFor - entry.goalsAgainst}
                                    </td>
                                    <td className={`p-4 text-center font-bold ${isMyTeam ? 'text-emerald-400' : 'text-white'}`}>{entry.points}</td>
                                    <td className="p-4 hidden md:flex items-center justify-center gap-1">
                                        {entry.form.slice(-5).map((result, i) => (
                                            <span key={i} className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                                                result === 'W' ? 'bg-emerald-500 text-white' : 
                                                result === 'D' ? 'bg-slate-600 text-slate-200' : 'bg-red-500 text-white'
                                            }`}>
                                                {result}
                                            </span>
                                        ))}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderCalendar = () => (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                 <CalendarCheck size={20} className="text-emerald-500" />
                 <h2 className="text-xl font-display font-bold">Season Calendar</h2>
             </div>
             <div className="divide-y divide-slate-800">
                 {seasonState.fixtures.filter(f => f.isUserMatch).map((fixture, index) => {
                     const isNext = fixture.week === seasonState.week && !fixture.isPlayed;
                     const isPast = fixture.isPlayed;
                     const isWin = isPast && ((fixture.homeTeam === myTeam.name && (fixture.homeScore || 0) > (fixture.awayScore || 0)) ||
                                   (fixture.awayTeam === myTeam.name && (fixture.awayScore || 0) > (fixture.homeScore || 0)));
                     
                     return (
                         <div key={fixture.id} className={`p-4 transition-colors flex items-center justify-between ${isNext ? 'bg-emerald-900/10 border-l-4 border-l-emerald-500' : 'hover:bg-slate-800/30'}`}>
                             <div className="flex flex-col items-center w-24 shrink-0">
                                 <span className="text-[10px] font-bold text-slate-500 uppercase">Matchday</span>
                                 <span className={`text-lg font-bold ${isNext ? 'text-emerald-400' : 'text-white'}`}>{fixture.week}</span>
                             </div>
                             
                             <div className="flex-1 px-4">
                                 <div className="text-[10px] font-bold uppercase mb-1 text-center">
                                     <span className="text-slate-500">{fixture.competitionName}</span>
                                 </div>
                                 <div className="flex items-center justify-between">
                                     <div className={`flex-1 text-right text-sm font-bold ${fixture.homeTeam === myTeam.name ? 'text-white' : 'text-slate-400'}`}>{fixture.homeTeam}</div>
                                     <div className="mx-4 px-3 py-1 bg-slate-950 rounded border border-slate-800 font-mono font-bold text-white whitespace-nowrap">
                                         {isPast ? `${fixture.homeScore} - ${fixture.awayScore}` : 'v'}
                                     </div>
                                     <div className={`flex-1 text-left text-sm font-bold ${fixture.awayTeam === myTeam.name ? 'text-white' : 'text-slate-400'}`}>{fixture.awayTeam}</div>
                                 </div>
                             </div>

                             <div className="w-16 shrink-0 flex justify-center">
                                 {isPast ? (
                                     <div className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${isWin ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                         {isWin ? 'Win' : 'Result'}
                                     </div>
                                 ) : isNext ? (
                                     <div className="text-[10px] font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                                         Next
                                     </div>
                                 ) : (
                                     <span className="text-xs text-slate-600">-</span>
                                 )}
                             </div>
                         </div>
                     );
                 })}
                 {seasonState.fixtures.filter(f => f.isUserMatch).length === 0 && (
                     <div className="p-8 text-center text-slate-500">No fixtures scheduled yet.</div>
                 )}
             </div>
        </div>
    );

    const renderEurope = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {euroComps.map(comp => (
                <div key={comp.id} className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden ${!comp.isActive ? 'opacity-75 grayscale' : ''}`}>
                    <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
                                <Globe size={24} />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-xl text-white">{comp.name}</h3>
                                <p className="text-xs text-blue-300">{comp.formatDescription}</p>
                            </div>
                         </div>
                         <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase border ${comp.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                             {comp.isActive ? 'Qualified' : 'Not Qualified'}
                         </div>
                    </div>
                    
                    {comp.isActive && comp.table && comp.table.length > 0 ? (
                        <div className="p-4">
                            <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 ml-2">League Phase Standings</h4>
                            {/* Re-use simplified table or generic table logic */}
                            <div className="overflow-x-auto rounded-lg border border-slate-800">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-950 text-xs font-bold text-slate-500 uppercase">
                                        <tr>
                                            <th className="p-3 w-10">#</th>
                                            <th className="p-3">Team</th>
                                            <th className="p-3 text-center">P</th>
                                            <th className="p-3 text-center">Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {comp.table.map((team, i) => (
                                            <tr key={team.teamId} className={team.teamName === myTeam.name ? 'bg-emerald-900/20' : ''}>
                                                <td className="p-3 text-center text-slate-500">{i+1}</td>
                                                <td className={`p-3 font-bold ${team.teamName === myTeam.name ? 'text-emerald-400' : 'text-slate-300'}`}>{team.teamName}</td>
                                                <td className="p-3 text-center text-slate-400">{team.played}</td>
                                                <td className="p-3 text-center font-bold text-white">{team.points}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-500 italic">
                             {comp.isActive ? 'Competition waiting to start...' : 'Your team is not participating in this competition this season.'}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    const renderCups = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Domestic Cup */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                <div className="p-6 bg-gradient-to-br from-indigo-900/50 to-slate-900 border-b border-slate-800 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/20">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-xl text-white">{cupComp?.name}</h3>
                            <p className="text-xs text-indigo-300">Domestic Knockout</p>
                        </div>
                     </div>
                     <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${cupComp?.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                         {cupComp?.isActive ? 'Active' : 'Eliminated'}
                     </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-center">
                    <div className="space-y-6 relative">
                        {/* Progress Line */}
                        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-800"></div>
                        
                        {['Round of 64', 'Round of 32', 'Round of 16', 'Quarter Final', 'Semi Final', 'Final'].map((round, idx) => {
                            const isCurrent = cupComp?.currentRound === round;
                            return (
                                <div key={round} className="relative pl-8 flex items-center justify-between group">
                                    <div className={`absolute left-[0.35rem] w-3 h-3 rounded-full border-2 transition-all ${isCurrent ? 'bg-emerald-500 border-emerald-500 scale-125' : 'bg-slate-900 border-slate-700'}`}></div>
                                    <span className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-slate-500'}`}>{round}</span>
                                    {isCurrent && cupComp?.isActive && <span className="text-[10px] text-emerald-400 animate-pulse font-mono">NEXT MATCH</span>}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderResults = () => (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                 <Calendar size={20} className="text-emerald-500" />
                 <h2 className="text-xl font-display font-bold">Past Results</h2>
             </div>
             <div className="divide-y divide-slate-800">
                 {seasonState.recentResults.slice().reverse().map((fixture, index) => {
                     const isWin = (fixture.homeTeam === myTeam.name && (fixture.homeScore || 0) > (fixture.awayScore || 0)) ||
                                   (fixture.awayTeam === myTeam.name && (fixture.awayScore || 0) > (fixture.homeScore || 0));
                     const isDraw = fixture.homeScore === fixture.awayScore;
                     
                     return (
                         <div key={index} className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between">
                             <div className="flex flex-col items-center w-16 shrink-0">
                                 <span className="text-[10px] font-bold text-slate-500 uppercase">Week</span>
                                 <span className="text-lg font-bold text-white">{fixture.week}</span>
                             </div>
                             
                             <div className="flex-1 px-4">
                                 <div className="text-[10px] text-emerald-400 font-bold uppercase mb-2 text-center">{fixture.competitionName}</div>
                                 <div className="flex items-center justify-between">
                                     <div className={`flex-1 text-right text-sm font-bold ${fixture.homeTeam === myTeam.name ? 'text-white' : 'text-slate-400'}`}>{fixture.homeTeam}</div>
                                     <div className="mx-4 px-3 py-1 bg-slate-950 rounded border border-slate-800 font-mono font-bold text-white whitespace-nowrap">
                                         {fixture.homeScore} - {fixture.awayScore}
                                     </div>
                                     <div className={`flex-1 text-left text-sm font-bold ${fixture.awayTeam === myTeam.name ? 'text-white' : 'text-slate-400'}`}>{fixture.awayTeam}</div>
                                 </div>
                             </div>

                             <div className="w-8 shrink-0 flex justify-center">
                                 {isWin ? <div className="w-2 h-2 rounded-full bg-emerald-500"></div> : 
                                  isDraw ? <div className="w-2 h-2 rounded-full bg-slate-500"></div> :
                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                             </div>
                         </div>
                     );
                 })}
                 
                 {seasonState.recentResults.length === 0 && (
                     <div className="p-10 text-center text-slate-500 italic">No matches played yet this season.</div>
                 )}
             </div>
        </div>
    );

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="flex gap-4 mb-6 sticky top-0 bg-slate-950/90 backdrop-blur z-10 py-2 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('TABLE')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'TABLE' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                    League Table
                </button>
                <button 
                    onClick={() => setActiveTab('CALENDAR')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'CALENDAR' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                    <CalendarCheck size={14} /> Fixtures
                </button>
                <button 
                    onClick={() => setActiveTab('EUROPE')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'EUROPE' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                    <Globe size={14} /> Europe
                </button>
                <button 
                    onClick={() => setActiveTab('CUPS')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'CUPS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                    Cups
                </button>
                <button 
                    onClick={() => setActiveTab('RESULTS')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'RESULTS' ? 'bg-slate-600 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                    Results
                </button>
            </div>

            {activeTab === 'TABLE' && renderTable(seasonState.leagueTable, leagueComp?.name || 'League Table', `Season ${seasonState.year}-${seasonState.year + 1}`, <Table size={20} />, 'bg-emerald-600')}
            {activeTab === 'CALENDAR' && renderCalendar()}
            {activeTab === 'EUROPE' && renderEurope()}
            {activeTab === 'CUPS' && renderCups()}
            {activeTab === 'RESULTS' && renderResults()}
        </div>
    );
};

export default CompetitionsView;
