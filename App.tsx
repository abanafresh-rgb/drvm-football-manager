
// ... existing imports ...
import React, { useState, useEffect } from 'react';
import { GameView, Team, Player, MatchStats, Position, TransferType, TeamMetadata, SeasonState, CompetitionType, Competition, LeagueTableEntry, Fixture, PressingIntensity, PassingStyle, DefensiveLine, Coach, CoachRole, ContinentalTier, SquadStatus, TeamCategory, JobOffer, SeasonAwards, ManagerProfile, InjuryStatus, GameSettings, SaveData } from './types';
import { generateSquad, getTacticalAdvice, generateLeagueTeams, generateSeasonContext, generateOpponentForContext, generateLeagueSchedule, simulateMatchResult, generateHeadhuntOffers, getEuropeanTeams, getRestOfWorldTeams, generateSeasonAwards, generateAcademyIntake } from './services/geminiService';
import PlayerCard from './components/PlayerCard';
import Pitch from './components/Pitch';
import MatchView from './components/MatchView';
import TransferMarket from './components/TransferMarket';
import ScoutingView from './components/ScoutingView';
import CompetitionsView from './components/CompetitionsView';
import StaffView from './components/StaffView';
import ShopView from './components/ShopView';
import JobHuntView from './components/JobHuntView';
import JobOfferModal from './components/JobOfferModal';
import SeasonAwardsModal from './components/SeasonAwardsModal';
import ManagerView from './components/ManagerView';
import SettingsView from './components/SettingsView';
import { LayoutDashboard, Users, Trophy, Settings, BrainCircuit, PlayCircle, Loader2, Filter, SlidersHorizontal, ChevronRight, Crown, Medal, Banknote, Globe, ScanEye, Briefcase, HeartPulse, Calendar, Ticket, Table, Activity, ArrowRight, Shield, Zap, Move, User, ArrowLeftRight, Shirt, GraduationCap, ShoppingBag, ThumbsUp, ThumbsDown, AlertOctagon, PanelLeftClose, PanelLeftOpen, TrendingUp, WifiOff, Menu, X, ArrowUpCircle } from 'lucide-react';

const TOP_LEAGUES = [
    { name: 'Premier League', country: 'England', tier: 1 },
    { name: 'La Liga', country: 'Spain', tier: 1 },
    { name: 'Bundesliga', country: 'Germany', tier: 1 },
    { name: 'Serie A', country: 'Italy', tier: 1 },
    { name: 'Ligue 1', country: 'France', tier: 1 },
    { name: 'Primeira Liga', country: 'Portugal', tier: 2 },
    { name: 'Eredivisie', country: 'Netherlands', tier: 2 },
    { name: 'Brasileirão Série A', country: 'Brazil', tier: 2 },
    { name: 'Belgian Pro League', country: 'Belgium', tier: 2 },
    { name: 'MLS', country: 'USA', tier: 2 },
    { name: 'Liga MX', country: 'Mexico', tier: 2 },
    { name: 'Argentine Primera División', country: 'Argentina', tier: 2 },
    { name: 'Süper Lig', country: 'Turkey', tier: 2 },
    { name: 'Saudi Pro League', country: 'Saudi Arabia', tier: 2 },
    { name: 'Championship', country: 'England', tier: 2 },
    { name: 'Scottish Premiership', country: 'Scotland', tier: 3 },
    { name: 'Swiss Super League', country: 'Switzerland', tier: 3 },
    { name: 'Austrian Bundesliga', country: 'Austria', tier: 3 },
    { name: 'Danish Superliga', country: 'Denmark', tier: 3 },
    { name: 'Eliteserien', country: 'Norway', tier: 3 },
    { name: 'Greek Super League', country: 'Greece', tier: 3 },
    { name: 'Czech First League', country: 'Czech Republic', tier: 3 },
    { name: 'Polish Ekstraklasa', country: 'Poland', tier: 3 },
    { name: 'J1 League', country: 'Japan', tier: 3 },
    { name: 'A-League', country: 'Australia', tier: 3 },
];

const FORMATIONS_LIST = ['4-4-2', '4-3-3', '3-5-2', '5-3-2', '4-2-3-1'];

const updateTableStats = (table: LeagueTableEntry[], matchResults: { homeTeam: string, awayTeam: string, homeScore: number, awayScore: number }[]): LeagueTableEntry[] => {
    const updatedTable = [...table];
    
    const updateUser = (name: string, goalsF: number, goalsA: number) => {
        const idx = updatedTable.findIndex(t => t.teamName === name);
        if (idx !== -1) {
            const team = updatedTable[idx];
            const won = goalsF > goalsA;
            const drawn = goalsF === goalsA;
            updatedTable[idx] = {
                ...team,
                played: team.played + 1,
                won: team.won + (won ? 1 : 0),
                drawn: team.drawn + (drawn ? 1 : 0),
                lost: team.lost + (!won && !drawn ? 1 : 0),
                goalsFor: team.goalsFor + goalsF,
                goalsAgainst: team.goalsAgainst + goalsA,
                points: team.points + (won ? 3 : (drawn ? 1 : 0)),
                form: [...team.form, won ? 'W' : (drawn ? 'D' : 'L')]
            };
        }
    }

    matchResults.forEach(match => {
        updateUser(match.homeTeam, match.homeScore, match.awayScore);
        updateUser(match.awayTeam, match.awayScore, match.homeScore);
    });

    return updatedTable.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });
};

const App: React.FC = () => {
  const [view, setView] = useState<GameView>(GameView.SETUP);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Initializing Manager...');
  const [tacticalAdvice, setTacticalAdvice] = useState<string>('');
  
  const [swapMode, setSwapMode] = useState(false);
  const [swapSourceId, setSwapSourceId] = useState<string | null>(null);
  const [squadCategory, setSquadCategory] = useState<TeamCategory>('FIRST_TEAM');

  const [seasonState, setSeasonState] = useState<SeasonState | null>(null);
  const [seasonAwards, setSeasonAwards] = useState<SeasonAwards | null>(null);
  
  // Settings State
  const [gameSettings, setGameSettings] = useState<GameSettings>({
      autoSave: true,
      soundEnabled: true,
      textSpeed: 1,
      theme: 'DARK'
  });
  const [lastSaveDate, setLastSaveDate] = useState<string | null>(null);

  // Manager Profile State
  const [managerProfile, setManagerProfile] = useState<ManagerProfile>({
      name: '',
      age: 35,
      nationality: '',
      reputation: 75,
      stats: { gamesManaged: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, trophiesWon: 0 },
      trophies: [],
      awards: [],
      clubHistory: []
  });

  const [isSacked, setIsSacked] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const [incomingOffers, setIncomingOffers] = useState<JobOffer[]>([]);
  
  const [setupStep, setSetupStep] = useState(1); 
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [availableTeams, setAvailableTeams] = useState<TeamMetadata[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  
  const [marketPlayers, setMarketPlayers] = useState<Player[]>([]);
  const [teamRatings, setTeamRatings] = useState<Record<string, number>>({});

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const [opponent, setOpponent] = useState<Team>({
    name: 'Unknown FC',
    primaryColor: '#ef4444',
    secondaryColor: '#ffffff',
    formation: '4-3-3',
    budget: 0,
    players: [],
    staff: [],
    tactics: {
        formation: '4-3-3',
        playStyle: 'Balanced',
        pressing: PressingIntensity.BALANCED,
        passing: PassingStyle.MIXED,
        defensiveLine: DefensiveLine.STANDARD
    },
    goldCoins: 0,
    managerName: 'CPU Manager',
    boardConfidence: 100
  });

  // ... (useEffects and handlers remain unchanged)
  useEffect(() => {
      const savedData = localStorage.getItem('drvm_fm_save');
      if (savedData) {
          try {
              const parsed: SaveData = JSON.parse(savedData);
              setLastSaveDate(parsed.dateSaved);
          } catch(e) { console.error("Save check failed", e); }
      }

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      const handleBeforeInstallPrompt = (e: any) => {
          e.preventDefault();
          setInstallPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
  }, []);

  const handleInstallApp = () => {
      if (installPrompt) {
          installPrompt.prompt();
          installPrompt.userChoice.then((choiceResult: any) => {
              if (choiceResult.outcome === 'accepted') {
                  setInstallPrompt(null);
              }
          });
      }
  };

  const handleSaveGame = () => {
      if (!myTeam || !seasonState) return;
      const saveData: SaveData = {
          myTeam,
          seasonState,
          managerProfile,
          gameSettings,
          marketPlayers,
          incomingOffers,
          dateSaved: new Date().toLocaleString()
      };
      localStorage.setItem('drvm_fm_save', JSON.stringify(saveData));
      setLastSaveDate(saveData.dateSaved);
      alert("Game Saved Successfully!");
  };

  const handleLoadGame = () => {
      const savedData = localStorage.getItem('drvm_fm_save');
      if (!savedData) return;
      try {
          const parsed: SaveData = JSON.parse(savedData);
          setMyTeam(parsed.myTeam);
          setSeasonState(parsed.seasonState);
          setManagerProfile(parsed.managerProfile);
          setGameSettings(parsed.gameSettings);
          setMarketPlayers(parsed.marketPlayers);
          setIncomingOffers(parsed.incomingOffers);
          setLastSaveDate(parsed.dateSaved);
          setView(GameView.DASHBOARD);
      } catch (e) {
          alert("Failed to load save file.");
      }
  };

  const handleResetGame = () => {
      localStorage.removeItem('drvm_fm_save');
      setLastSaveDate(null);
      window.location.reload();
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (managerProfile.name && managerProfile.nationality && managerProfile.age) {
          setSetupStep(2);
      } else {
          alert("Please fill in all manager details.");
      }
  };

  const handleLeagueSelect = async (leagueName: string) => {
      if (!isOnline) {
          alert("An internet connection is required to load league data from the AI engine.");
          return;
      }
      setSelectedLeague(leagueName);
      setAvailableTeams([]);
      setLoadingTeams(true);
      const teams = await generateLeagueTeams(leagueName);
      setAvailableTeams(teams);
      setLoadingTeams(false);
  }

  const startGame = async (team: TeamMetadata, startWeek: number = 1, preservedState?: Partial<Team>) => {
      const leagueToUse = team.league || selectedLeague;
      if (!leagueToUse) return;
      
      setLoading(true);
      
      setLoadingText("Generating Season Structure...");
      const competitions = await generateSeasonContext(leagueToUse);

      let players: Player[] = [];
      if (preservedState && preservedState.players) {
          setLoadingText("Processing Squad Registration...");
          players = preservedState.players;
      } else {
          setLoadingText("Signing Players...");
          players = await generateSquad(team.name, leagueToUse);
      }
      
      const leagueObj = TOP_LEAGUES.find(l => l.name === leagueToUse);
      
      const sortedPlayers = [...players].sort((a,b) => b.rating - a.rating);
      const avgRating = sortedPlayers.slice(0, 11).reduce((sum, p) => sum + p.rating, 0) / 11;

      let assignedContCompId: string | null = null;
      let assignedTier: ContinentalTier | null = null;

      if (leagueObj) {
          if (leagueObj.tier === 1) {
              if (avgRating > 83) { assignedContCompId = 'cont_1'; assignedTier = ContinentalTier.TIER_1; } 
              else if (avgRating > 79) { assignedContCompId = 'cont_2'; assignedTier = ContinentalTier.TIER_2; } 
              else if (avgRating > 77) { assignedContCompId = 'cont_3'; assignedTier = ContinentalTier.TIER_3; } 
          } else if (leagueObj.tier === 2) {
              if (avgRating > 78) { assignedContCompId = 'cont_1'; assignedTier = ContinentalTier.TIER_1; }
              else if (avgRating > 74) { assignedContCompId = 'cont_2'; assignedTier = ContinentalTier.TIER_2; }
          }
      }

      const euroTeams = getEuropeanTeams().filter(t => t !== team.name).sort(() => 0.5 - Math.random());
      
      let participatingInEurope = false;

      competitions.forEach(comp => {
          if (comp.type === CompetitionType.CONTINENTAL_CUP) {
              if (comp.id === assignedContCompId) {
                  comp.isActive = true;
                  participatingInEurope = true;
                  const count = 3;
                  const groupRivals = euroTeams.slice(0, count);
                  comp.table = [
                      { teamId: team.name, teamName: team.name, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, form: [] },
                      ...groupRivals.map((rival, idx) => ({
                          teamId: `euro_cpu_${idx}`,
                          teamName: rival,
                          played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, form: []
                      }))
                  ];
              }
          }
      });

      let startingBudget = 25000000;
      if (leagueObj?.tier === 1) startingBudget = 75000000;
      else if (leagueObj?.tier === 2) startingBudget = 40000000;
      
      if (assignedTier === ContinentalTier.TIER_1) startingBudget += 50000000;
      if (assignedTier === ContinentalTier.TIER_2) startingBudget += 15000000;

      if ((team as JobOffer).transferBudget) {
          startingBudget = (team as JobOffer).transferBudget;
      }

      setMyTeam({
        name: team.name,
        primaryColor: team.primaryColor || '#3f0071', 
        secondaryColor: team.secondaryColor || '#ffffff',
        formation: preservedState?.formation || '4-4-2',
        tactics: preservedState?.tactics || {
            formation: '4-4-2',
            playStyle: 'Balanced',
            pressing: PressingIntensity.BALANCED,
            passing: PassingStyle.MIXED,
            defensiveLine: DefensiveLine.STANDARD
        },
        budget: preservedState?.budget || startingBudget,
        goldCoins: preservedState?.goldCoins || 100, 
        players: players.map(p => ({ ...p, contractType: p.contractType || TransferType.PERMANENT })),
        staff: preservedState?.staff || [
            { id: '1', name: 'Albert Capellas', role: CoachRole.ASSISTANT, rating: 72, specialty: 'Youth Development', age: 45, nationality: 'Spain', salary: 8000, signingFee: 0 },
            { id: '2', name: 'Gary Lewin', role: CoachRole.HEAD_PHYSIO, rating: 78, specialty: 'Rehabilitation', age: 52, nationality: 'England', salary: 6000, signingFee: 0 }
        ],
        boardConfidence: 65 
      });
      
      setLoadingText("Scheduling Fixtures...");
      
      let leagueTeams = availableTeams.length > 0 && availableTeams[0].league === leagueToUse ? availableTeams : [
          team, 
          ...Array.from({length: 19}).map((_, i) => ({ name: `League Rival ${i+1}`, primaryColor: '#000', secondaryColor: '#fff' }))
      ];
      if (!leagueTeams.find(t => t.name === team.name)) {
          leagueTeams = [team, ...leagueTeams];
      }

      const ratings: Record<string, number> = {};
      leagueTeams.forEach(t => {
          if (t.name === team.name) {
               ratings[t.name] = Math.round(avgRating);
          } else {
               const leagueAvg = leagueObj?.tier === 1 ? 78 : leagueObj?.tier === 2 ? 72 : 68;
               ratings[t.name] = Math.floor(leagueAvg - 5 + Math.random() * 15); 
          }
      });
      setTeamRatings(ratings);
      
      const leagueComp = competitions.find(c => c.type === CompetitionType.LEAGUE) || competitions[0];
      
      // NEW: Generate Realistic Interleaved Schedule
      const seasonFixtures = generateLeagueSchedule(leagueTeams, leagueComp.name, team.name, participatingInEurope);

      let leagueTable: LeagueTableEntry[] = leagueTeams.map(t => ({
          teamId: t.name,
          teamName: t.name,
          played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, form: []
      }));

      // Simulate past results if starting late (Not full support for realistic schedule yet, assuming W1 start usually)
      const simulatedResults: Fixture[] = [];
      if (startWeek > 1) {
          // This would need logic to skip cup rounds etc, keeping simple for now
      }

      const currentWeekFixture = seasonFixtures.find(f => f.week === startWeek && f.isUserMatch);
      let initialOpponentName = "Rival FC";
      let initialOpponent: Team;
      let isHome = true;
      let roundName = `Matchday ${startWeek}`;
      let compId = leagueComp.id;

      if (currentWeekFixture) {
          initialOpponentName = currentWeekFixture.homeTeam === team.name ? currentWeekFixture.awayTeam : currentWeekFixture.homeTeam;
          isHome = currentWeekFixture.homeTeam === team.name;
          roundName = currentWeekFixture.roundName || roundName;
          compId = currentWeekFixture.competitionId;
          
          if (initialOpponentName === 'TBD') {
              initialOpponentName = (await generateOpponentForContext(leagueToUse, team.name, competitions.find(c => c.id === compId)!)).name;
              currentWeekFixture.awayTeam = initialOpponentName; // Fix TBD in schedule
          }
      }
      
      initialOpponent = await generateOpponentForContext(leagueToUse, team.name, competitions.find(c => c.id === compId)!);
      initialOpponent.name = initialOpponentName;
      if (ratings[initialOpponentName]) initialOpponent.rating = ratings[initialOpponentName];
      setOpponent(initialOpponent);

      setSeasonState({
          week: startWeek,
          year: preservedState ? seasonState!.year + 1 : 2025,
          competitions: competitions,
          nextMatchContext: {
              competitionId: compId,
              opponentName: initialOpponent.name,
              roundName: roundName,
              isHome: isHome
          },
          leagueTable: leagueTable,
          recentResults: simulatedResults,
          fixtures: seasonFixtures
      });

      if (!preservedState) {
          setManagerProfile(prev => {
              const history = [...prev.clubHistory];
              if (history.length > 0 && history[0].years.includes('Present')) {
                  history[0] = { ...history[0], years: history[0].years.replace('Present', (seasonState?.year || 2025).toString()) };
              }
              
              return {
                  ...prev,
                  clubHistory: [{ 
                      club: team.name, 
                      years: `${seasonState?.year || 2025} - Present`,
                      stats: { played: 0, won: 0, drawn: 0, lost: 0 }
                  }, ...history]
              };
          });
      }

      setLoading(false);
      setView(GameView.DASHBOARD);
  };

  const handleAcceptJob = (offer: JobOffer) => {
      setIsSacked(false);
      setIncomingOffers([]); 
      const nextWeek = seasonState?.week || 1;
      setSelectedLeague(offer.league); 
      setAvailableTeams([]); 
      startGame(offer, nextWeek); 
  };

  const scheduleNextMatch = async (currentWeek: number, competitions: Competition[], currentFixtures: Fixture[]) => {
      if (!myTeam || !seasonState) return;
      const leagueToUse = selectedLeague || 'Premier League';
      
      const nextFixture = currentFixtures.find(f => f.week === currentWeek && f.isUserMatch);
      
      // If we run out of fixtures or hit week 45, season end
      if (!nextFixture || currentWeek > 45) {
           return null;
      }

      const comp = competitions.find(c => c.id === nextFixture.competitionId);
      if (!comp) return null;

      // Handle TBD Opponents (e.g. Cup Draws)
      let opponentName = nextFixture.homeTeam === myTeam.name ? nextFixture.awayTeam : nextFixture.homeTeam;
      if (opponentName === 'TBD') {
          const randOpp = await generateOpponentForContext(leagueToUse, myTeam.name, comp);
          opponentName = randOpp.name;
          // Update fixture in place
          if (nextFixture.homeTeam === 'TBD') nextFixture.homeTeam = opponentName;
          else nextFixture.awayTeam = opponentName;
      }

      const nextOpponent = await generateOpponentForContext(leagueToUse, myTeam.name, comp);
      nextOpponent.name = opponentName;
      if (teamRatings[opponentName]) nextOpponent.rating = teamRatings[opponentName];
      
      setOpponent(nextOpponent);
      
      setSeasonState(prev => ({
          ...prev!,
          week: currentWeek,
          nextMatchContext: {
              competitionId: comp.id,
              opponentName: opponentName,
              roundName: nextFixture.roundName || comp.currentRound,
              isHome: nextFixture.homeTeam === myTeam.name
          }
      }));
      return true;
  };

  const processPlayerGrowth = (players: Player[], staff: Coach[]) => {
      const assistant = staff.find(c => c.role === CoachRole.ASSISTANT);
      const youthCoach = staff.find(c => c.role === CoachRole.YOUTH_COACH);
      const staffBoost = (assistant ? assistant.rating : 50) / 200 + (youthCoach ? youthCoach.rating : 50) / 100;

      return players.map(p => {
          if (p.rating >= p.potential) return { ...p, recentGrowth: 0 }; // Capped

          const ageFactor = Math.max(0.1, (30 - p.age) / 10); // Younger grows faster
          const growthChance = (100 - p.rating) * ageFactor * staffBoost; // Base chance
          
          let growth = 0;
          if (Math.random() * 100 < growthChance) {
              growth = 1;
              // Apply boost based on training focus
              const focus = p.trainingFocus || 'GENERAL';
              if (focus === 'PAC') p.pace = Math.min(99, p.pace + 1);
              else if (focus === 'SHO') p.shooting = Math.min(99, p.shooting + 1);
              else if (focus === 'PAS') p.passing = Math.min(99, p.passing + 1);
              else if (focus === 'DRI') p.dribbling = Math.min(99, p.dribbling + 1);
              else if (focus === 'DEF') p.defending = Math.min(99, p.defending + 1);
              else if (focus === 'PHY') p.physical = Math.min(99, p.physical + 1);
              else {
                  // General: random stat
                  const roll = Math.random();
                  if (roll < 0.16) p.pace++;
                  else if (roll < 0.32) p.shooting++;
                  else if (roll < 0.48) p.passing++;
                  else if (roll < 0.64) p.dribbling++;
                  else if (roll < 0.80) p.defending++;
                  else p.physical++;
              }
              p.rating = Math.min(99, p.rating + 1);
          }
          return { ...p, recentGrowth: growth };
      });
  };

  const handleMatchEnd = async (stats: MatchStats, updatedPlayers?: Player[]) => {
    if (!myTeam || !seasonState) return;

    const currentWeek = seasonState.week;
    const userWon = seasonState.nextMatchContext.isHome 
        ? stats.homeScore > stats.awayScore 
        : stats.awayScore > stats.homeScore;
    const isDraw = stats.homeScore === stats.awayScore;

    let confidenceChange = userWon ? 2 : isDraw ? 0 : -3;
    // Boost for Cup/Europe wins
    if (userWon && !seasonState.nextMatchContext.competitionId.includes('league')) confidenceChange = 5;
    // Harsh penalty for Cup elimination
    if (!userWon && !isDraw && !seasonState.nextMatchContext.competitionId.includes('league')) confidenceChange = -8;

    let newConfidence = Math.min(100, Math.max(0, myTeam.boardConfidence + confidenceChange));
    
    setManagerProfile(prev => {
        const newStats = { ...prev.stats, gamesManaged: prev.stats.gamesManaged + 1, wins: prev.stats.wins + (userWon ? 1 : 0), draws: prev.stats.draws + (isDraw ? 1 : 0), losses: prev.stats.losses + (!userWon && !isDraw ? 1 : 0), goalsFor: prev.stats.goalsFor + (seasonState.nextMatchContext.isHome ? stats.homeScore : stats.awayScore), goalsAgainst: prev.stats.goalsAgainst + (seasonState.nextMatchContext.isHome ? stats.awayScore : stats.homeScore) };
        const newHistory = [...prev.clubHistory];
        if (newHistory.length > 0) newHistory[0] = { ...newHistory[0], stats: { played: newHistory[0].stats.played + 1, won: newHistory[0].stats.won + (userWon ? 1 : 0), drawn: newHistory[0].stats.drawn + (isDraw ? 1 : 0), lost: newHistory[0].stats.lost + (!userWon && !isDraw ? 1 : 0) } };
        return { ...prev, reputation: Math.min(100, Math.max(0, prev.reputation + (userWon ? 1 : -1))), stats: newStats, clubHistory: newHistory };
    });

    if (newConfidence <= 0) {
        setIsSacked(true);
        setMyTeam(prev => ({ ...prev!, boardConfidence: 0 }));
        setView(GameView.JOB_HUNT);
        return; 
    }
    
    if (incomingOffers.length === 0 && managerProfile.reputation > 70 && currentWeek > 20 && Math.random() > 0.8) {
         generateHeadhuntOffers(managerProfile.reputation, selectedLeague || 'Premier League').then(setIncomingOffers);
    }

    const currentCompId = seasonState.nextMatchContext.competitionId;
    let updatedCompetitions = [...seasonState.competitions];
    let updatedLeagueTable = [...seasonState.leagueTable];
    let updatedFixtures = [...seasonState.fixtures];

    const actualHomeScore = seasonState.nextMatchContext.isHome ? stats.homeScore : stats.awayScore;
    const actualAwayScore = seasonState.nextMatchContext.isHome ? stats.awayScore : stats.homeScore;

    const userMatchResult = {
        homeTeam: seasonState.nextMatchContext.isHome ? myTeam.name : seasonState.nextMatchContext.opponentName,
        awayTeam: seasonState.nextMatchContext.isHome ? seasonState.nextMatchContext.opponentName : myTeam.name,
        homeScore: actualHomeScore,
        awayScore: actualAwayScore
    };

    // Update the fixture in the schedule
    const fixtureIdx = updatedFixtures.findIndex(f => f.week === currentWeek && f.isUserMatch && f.competitionId === currentCompId);
    if (fixtureIdx !== -1) {
        updatedFixtures[fixtureIdx] = { ...updatedFixtures[fixtureIdx], homeScore: actualHomeScore, awayScore: actualAwayScore, isPlayed: true, status: 'PLAYED' };
    }

    // Process League Sim
    if (currentCompId.includes('league')) {
        updatedFixtures.forEach((f, idx) => {
            if (f.week === currentWeek && !f.isUserMatch && f.competitionId === currentCompId && f.status === 'SCHEDULED') {
                const simResult = simulateMatchResult(f.homeTeam, f.awayTeam);
                updatedFixtures[idx] = { ...f, homeScore: simResult.homeScore, awayScore: simResult.awayScore, isPlayed: true, status: 'PLAYED' };
                updatedLeagueTable = updateTableStats(updatedLeagueTable, [{ homeTeam: f.homeTeam, awayTeam: f.awayTeam, homeScore: simResult.homeScore, awayScore: simResult.awayScore }]);
            }
        });
        updatedLeagueTable = updateTableStats(updatedLeagueTable, [userMatchResult]);
    } else {
        // Cup/Europe Logic: If user lost knockout, disable active flag
        if (!userWon && !isDraw) {
             const activeComp = updatedCompetitions.find(c => c.id === currentCompId);
             if (activeComp) {
                 if (activeComp.type === CompetitionType.DOMESTIC_CUP) activeComp.isActive = false;
                 // Add Europe KO logic here if needed
             }
        }
    }

    let fatiguedPlayers = updatedPlayers || myTeam.players.map(p => ({
        ...p,
        condition: Math.max(20, p.condition - (Math.floor(Math.random() * 10) + 5))
    }));

    // NEW: Youth Development Processing
    const developedPlayers = processPlayerGrowth(fatiguedPlayers, myTeam.staff);

    setMyTeam(prev => ({ ...prev!, players: developedPlayers, boardConfidence: newConfidence }));

    const newResult: Fixture = updatedFixtures.find(f => f.week === currentWeek && f.isUserMatch && f.competitionId === currentCompId) || {
        id: 'fallback', week: seasonState.week, competitionId: currentCompId, competitionName: 'Match',
        homeTeam: userMatchResult.homeTeam, awayTeam: userMatchResult.awayTeam, homeScore: userMatchResult.homeScore, awayScore: userMatchResult.awayScore, isPlayed: true, isUserMatch: true, status: 'PLAYED'
    };

    setSeasonState(prev => ({
        ...prev!,
        week: prev!.week + 1,
        competitions: updatedCompetitions,
        leagueTable: updatedLeagueTable,
        recentResults: [...prev!.recentResults, newResult],
        fixtures: updatedFixtures
    }));

    if (gameSettings.autoSave) {
        setTimeout(() => handleSaveGame(), 500);
    }

    if (newConfidence > 0) {
        const nextMatchScheduled = await scheduleNextMatch(seasonState.week + 1, updatedCompetitions, updatedFixtures);
        if (nextMatchScheduled) {
            setView(GameView.DASHBOARD);
        } else {
            setLoadingText("Calculating Season Awards...");
            setLoading(true);
            const awards = await generateSeasonAwards(updatedLeagueTable, myTeam, seasonState.year);
            setSeasonAwards(awards);
            setLoading(false);
        }
    }
  };

  const handleGetTacticalAdvice = async () => {
    if (!myTeam || !seasonState) return;
    setLoading(true);
    const advice = await getTacticalAdvice(myTeam, seasonState.nextMatchContext.opponentName);
    setTacticalAdvice(advice);
    setLoading(false);
  };

  const handleFormationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!myTeam) return;
    setMyTeam(prev => ({ ...prev!, formation: e.target.value }));
  };

  const toggleSwapMode = () => { setSwapMode(!swapMode); setSwapSourceId(null); };
  const handleSquadPlayerClick = (player: Player) => {
    if (swapMode) { if (!swapSourceId) setSwapSourceId(player.id); else handlePositionSwap(swapSourceId, player.id); } else setSelectedPlayer(player);
  };
  const handlePositionSwap = (sourceId: string, targetId: string) => {
    if (!myTeam) return;
    const players = [...myTeam.players];
    const sIdx = players.findIndex(p => p.id === sourceId);
    const tIdx = players.findIndex(p => p.id === targetId);
    if (sIdx !== -1 && tIdx !== -1) {
        const tempStatus = players[sIdx].squadStatus; players[sIdx].squadStatus = players[tIdx].squadStatus; players[tIdx].squadStatus = tempStatus;
        const temp = players[sIdx]; players[sIdx] = players[tIdx]; players[tIdx] = temp;
        setMyTeam(prev => ({ ...prev!, players }));
    }
    setSwapSourceId(null); setSwapMode(false);
  };
  const handleRoleChange = (id: string, role: string) => { if (!myTeam) return; setMyTeam(prev => ({ ...prev!, players: prev!.players.map(p => p.id === id ? { ...p, role } : p) })); };
  const handleTrainingChange = (id: string, focus: string) => { if (!myTeam) return; setMyTeam(prev => ({ ...prev!, players: prev!.players.map(p => p.id === id ? { ...p, trainingFocus: focus } : p) })); };
  const handleTransfer = (p: Player, type: TransferType, c: number) => { 
      if (!myTeam) return; 
      if (myTeam.players.find(pl => pl.id === p.id)) {
          setMyTeam(prev => ({ ...prev!, budget: prev!.budget + c, players: prev!.players.filter(pl => pl.id !== p.id) }));
      } else {
          if (myTeam.budget < c) return alert("No funds");
          setMyTeam(prev => ({ ...prev!, budget: prev!.budget - c, players: [...prev!.players, { ...p, teamCategory: TeamCategory.FIRST_TEAM, squadStatus: SquadStatus.RESERVE }] }));
          setMarketPlayers(prev => prev.filter(pl => pl.id !== p.id));
      }
      setSelectedPlayer(null);
  };
  const handleContractRenew = (p: Player, w: number, d: number) => { if (!myTeam) return; setMyTeam(prev => ({ ...prev!, players: prev!.players.map(pl => pl.id === p.id ? { ...pl, wages: w, contractExpiry: (seasonState?.year || 2025) + d } : pl) })); setSelectedPlayer(null); };
  const handleSpendBudget = (a: number) => { if (!myTeam) return; setMyTeam(prev => ({ ...prev!, budget: prev!.budget - a })); };
  const handleHireStaff = (c: Coach) => { if (!myTeam) return; setMyTeam(prev => ({ ...prev!, budget: prev!.budget - c.signingFee, staff: [...prev!.staff, c] })); };
  const handleFireStaff = (id: string, s: number) => { if (!myTeam) return; setMyTeam(prev => ({ ...prev!, budget: prev!.budget - s, staff: prev!.staff.filter(c => c.id !== id) })); };
  const handleBuyCoins = (a: number) => { if (!myTeam) return; setMyTeam(prev => ({ ...prev!, goldCoins: prev!.goldCoins + a })); };
  const handleBuyBoost = (t: string, c: number) => { if (!myTeam || myTeam.goldCoins < c) return; setMyTeam(prev => ({ ...prev!, goldCoins: prev!.goldCoins - c })); alert("Boost Applied"); };

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex flex-col md:flex-row overflow-hidden relative">
      {incomingOffers.length > 0 && <JobOfferModal offers={incomingOffers} onAccept={handleAcceptJob} onReject={() => setIncomingOffers([])} />}
      
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/70 z-40 md:hidden" 
            onClick={() => setIsMobileSidebarOpen(false)}
          ></div>
      )}

      {/* Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-transform duration-300 md:relative md:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:w-auto'} ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            {(!isSidebarCollapsed || isMobileSidebarOpen) && <div><h1 className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">GEN-MANAGER</h1></div>}
             <button onClick={() => { 
                 if (window.innerWidth < 768) setIsMobileSidebarOpen(false); 
                 else setIsSidebarCollapsed(!isSidebarCollapsed); 
             }} className="text-slate-500 hover:text-white transition-colors ml-auto hidden md:block">
                 {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
             </button>
             <button onClick={() => setIsMobileSidebarOpen(false)} className="text-slate-500 hover:text-white transition-colors ml-auto md:hidden">
                 <X size={24} />
             </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {[
                { id: GameView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
                { id: GameView.SQUAD, label: 'Squad & Tactics', icon: Users },
                { id: GameView.TRANSFERS, label: 'Transfer Market', icon: ArrowLeftRight },
                { id: GameView.SCOUTING, label: 'Scouting', icon: ScanEye },
                { id: GameView.STAFF, label: 'Staff', icon: Briefcase },
                { id: GameView.COMPETITIONS, label: 'Competitions', icon: Trophy },
                { id: GameView.MANAGER, label: 'My Career', icon: Crown },
                { id: GameView.SHOP, label: 'Club Shop', icon: ShoppingBag },
                { id: GameView.SETTINGS, label: 'Settings', icon: Settings },
            ].map(item => (
                <button key={item.id} onClick={() => { setView(item.id); setIsMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold overflow-hidden ${view === item.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                    <item.icon size={18} className="shrink-0" /> {(!isSidebarCollapsed || isMobileSidebarOpen) && <span>{item.label}</span>}
                </button>
            ))}
        </nav>
        {!isOnline && (
            <div className="p-2 m-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center gap-2 text-red-400 text-xs font-bold animate-pulse">
                <WifiOff size={14} /> {(!isSidebarCollapsed || isMobileSidebarOpen) && "Offline Mode"}
            </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0">
               <div className="flex items-center gap-4">
                   <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden text-white p-1">
                       <Menu size={24} />
                   </button>
                   <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg" style={{background: myTeam?.primaryColor}}></div>
                   <div><h2 className="font-display font-bold text-lg">{myTeam?.name}</h2><div className="text-xs text-slate-400">{seasonState?.nextMatchContext.roundName}</div></div>
               </div>
               <div className="flex items-center gap-3 md:gap-6">
                   <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-slate-950 rounded-full border border-slate-800"><Banknote size={16} className="text-emerald-500" /><span className="font-mono font-bold text-sm">{new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(myTeam?.budget || 0)}</span></div>
                   <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-slate-950 rounded-full border border-yellow-900/30"><Crown size={16} className="text-yellow-500" /><span className="font-mono font-bold text-sm text-yellow-500">{myTeam?.goldCoins || 0}</span></div>
               </div>
          </div>

          <div className="flex-1 overflow-hidden relative">
              {!myTeam ? (
                  // ... setup views (unchanged) ...
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950">
                      {loading ? (
                          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                              <Loader2 size={48} className="text-emerald-500 animate-spin" />
                              <h2 className="text-2xl font-bold text-white">{loadingText}</h2>
                              <p className="text-slate-400">Powered by Gemini AI</p>
                          </div>
                      ) : (
                          setupStep === 1 ? (
                              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
                                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 text-emerald-500 border border-emerald-500/20"><User size={32} /></div>
                                  <h2 className="text-3xl font-display font-bold text-white mb-2">Create Manager Profile</h2>
                                  <p className="text-slate-400 text-sm mb-8">Start your journey to football immortality.</p>
                                  {lastSaveDate && (
                                      <button onClick={handleLoadGame} className="w-full mb-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                                          <Settings size={18} /> Load Save ({lastSaveDate})
                                      </button>
                                  )}
                                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                                      <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-left">Full Name</label><input type="text" required value={managerProfile.name} onChange={e => setManagerProfile({...managerProfile, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g. Pep Guardiola" /></div>
                                      <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-left">Age</label><input type="number" required min="20" max="80" value={managerProfile.age} onChange={e => setManagerProfile({...managerProfile, age: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1 text-left">Nationality</label><input type="text" required value={managerProfile.nationality} onChange={e => setManagerProfile({...managerProfile, nationality: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" placeholder="e.g. Spain" /></div></div>
                                      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl mt-4 transition-all shadow-lg shadow-emerald-900/20">Continue to Team Selection</button>
                                  </form>
                              </div>
                          ) : (
                              <div className="w-full max-w-4xl flex flex-col h-[80vh]">
                                  <h2 className="text-3xl font-display font-bold text-white mb-6 animate-in fade-in slide-in-from-top-4">Select Your Team</h2>
                                  <div className="flex gap-6 h-full overflow-hidden">
                                      <div className="w-1/3 bg-slate-900 border border-slate-800 rounded-xl overflow-y-auto p-2 space-y-1 animate-in slide-in-from-left-8 duration-500">
                                          {TOP_LEAGUES.map(league => (
                                              <button key={league.name} onClick={() => handleLeagueSelect(league.name)} className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-between ${selectedLeague === league.name ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>{league.name}{selectedLeague === league.name && <ChevronRight size={16} />}</button>
                                          ))}
                                      </div>
                                      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-y-auto animate-in slide-in-from-right-8 duration-500">
                                          {loadingTeams ? (<div className="h-full flex items-center justify-center text-slate-500 gap-3"><Loader2 className="animate-spin text-emerald-500" /> Loading Teams...</div>) : availableTeams.length > 0 ? (<div className="grid grid-cols-2 gap-4">{availableTeams.map(team => (<button key={team.name} onClick={() => startGame(team)} className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/50 hover:bg-slate-800 transition-all group text-left relative overflow-hidden"><div className="flex items-center gap-3 mb-2 relative z-10"><div className="w-10 h-10 rounded-full border-2 border-white/10 shadow-lg flex items-center justify-center font-bold text-white text-lg shrink-0" style={{ background: team.primaryColor }}>{team.name.charAt(0)}</div><div className="font-bold text-white group-hover:text-emerald-400 transition-colors leading-tight">{team.name}</div></div><div className="text-xs text-slate-500 relative z-10">Manager: {team.managerName}</div><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div></button>))}</div>) : (<div className="h-full flex items-center justify-center text-slate-500">Select a league to view teams</div>)}
                                      </div>
                                  </div>
                              </div>
                          )
                      )}
                  </div>
              ) : (
                  // MAIN GAME VIEW RENDER
                  <>
                    {view === GameView.DASHBOARD && (
                        <div className="p-8 h-full overflow-y-auto">
                            {/* Dashboard Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[300px]">
                                    <div className="flex justify-between items-start mb-6">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2"><Calendar size={16}/> Next Fixture</h3>
                                        <div className="px-3 py-1 bg-slate-800/50 rounded border border-slate-700 text-xs font-bold text-white uppercase">{seasonState!.nextMatchContext.roundName}</div>
                                    </div>
                                    
                                    <div className="flex items-center justify-around mb-8 relative z-10">
                                        <div className="text-center">
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-2xl font-bold mb-3 shadow-lg mx-auto" style={{borderColor: seasonState!.nextMatchContext.isHome ? myTeam.primaryColor : opponent.primaryColor}}>
                                                {(seasonState!.nextMatchContext.isHome ? myTeam : opponent).name.charAt(0)}
                                            </div>
                                            <div className="font-bold text-lg md:text-xl text-white">{(seasonState!.nextMatchContext.isHome ? myTeam : opponent).name}</div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="text-3xl md:text-4xl font-display font-bold text-slate-700">VS</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-2xl font-bold mb-3 shadow-lg mx-auto" style={{borderColor: !seasonState!.nextMatchContext.isHome ? myTeam.primaryColor : opponent.primaryColor}}>
                                                {(!seasonState!.nextMatchContext.isHome ? myTeam : opponent).name.charAt(0)}
                                            </div>
                                            <div className="font-bold text-lg md:text-xl text-white">{(!seasonState!.nextMatchContext.isHome ? myTeam : opponent).name}</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                                        <button onClick={() => setView(GameView.MATCH)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all text-lg"><PlayCircle size={24} /> Play Match</button>
                                        <button onClick={() => setView(GameView.SQUAD)} className="px-8 py-4 sm:py-0 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold border border-slate-700 transition-all">Team Sheet</button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><Activity size={16}/> Board Confidence</h3>
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className={`text-4xl font-display font-bold ${myTeam.boardConfidence > 50 ? 'text-emerald-400' : 'text-red-400'}`}>{myTeam.boardConfidence}%</span>
                                            <span className="text-slate-500 text-sm mb-1 font-bold">{myTeam.boardConfidence > 50 ? 'Secure' : 'At Risk'}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className={`h-full ${myTeam.boardConfidence > 50 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{width: `${myTeam.boardConfidence}%`}}></div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><TrendingUp size={16}/> Season Stats</h3>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-slate-950 rounded p-2 border border-slate-800">
                                                <div className="text-xs text-slate-500 uppercase">Played</div>
                                                <div className="font-bold text-white">{managerProfile.stats.gamesManaged}</div>
                                            </div>
                                            <div className="bg-slate-950 rounded p-2 border border-slate-800">
                                                <div className="text-xs text-slate-500 uppercase">Wins</div>
                                                <div className="font-bold text-emerald-400">{managerProfile.stats.wins}</div>
                                            </div>
                                            <div className="bg-slate-950 rounded p-2 border border-slate-800">
                                                <div className="text-xs text-slate-500 uppercase">Goals</div>
                                                <div className="font-bold text-blue-400">{managerProfile.stats.goalsFor}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><Table size={16}/> League Table Preview</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-slate-500 uppercase bg-slate-950/50">
                                                <tr><th className="p-2">Pos</th><th className="p-2">Club</th><th className="p-2 text-center">Pts</th><th className="p-2 text-center">Form</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {seasonState!.leagueTable.slice(0, 5).map((entry, i) => (
                                                    <tr key={entry.teamName} className={entry.teamName === myTeam.name ? 'bg-emerald-900/10' : ''}>
                                                        <td className="p-2 text-slate-400">{i + 1}</td>
                                                        <td className={`p-2 font-bold ${entry.teamName === myTeam.name ? 'text-emerald-400' : 'text-white'}`}>{entry.teamName}</td>
                                                        <td className="p-2 text-center font-bold">{entry.points}</td>
                                                        <td className="p-2 text-center flex justify-center gap-0.5">
                                                            {entry.form.slice(-3).map((r, idx) => (
                                                                <span key={idx} className={`w-2 h-2 rounded-full ${r === 'W' ? 'bg-emerald-500' : r === 'D' ? 'bg-slate-500' : 'bg-red-500'}`}></span>
                                                            ))}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button onClick={() => setView(GameView.COMPETITIONS)} className="w-full mt-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-950 rounded border border-slate-800 hover:border-slate-700 transition-colors">View Full Table</button>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><BrainCircuit className="text-purple-500" /> AI Assistant Manager</h3>
                                        <button onClick={handleGetTacticalAdvice} className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-xs font-bold rounded border border-purple-500/30 transition-all">Get Analysis</button>
                                    </div>
                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 text-sm leading-relaxed font-mono flex-1 min-h-[100px]">
                                        {tacticalAdvice ? tacticalAdvice : <span className="text-slate-600 italic">No tactical report generated yet. Request analysis before the match to get insights on {seasonState!.nextMatchContext.opponentName}.</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === GameView.SQUAD && (
                        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                            <div className="w-full lg:flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800 relative h-[55%] lg:h-full">
                                <div className="absolute top-4 lg:top-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-full px-6 py-2 z-20 flex items-center gap-4 shadow-xl">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Formation</span>
                                        <select 
                                            value={myTeam.formation} 
                                            onChange={handleFormationChange}
                                            className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer"
                                        >
                                            {FORMATIONS_LIST.map(f => <option key={f} value={f} className="bg-slate-900">{f}</option>)}
                                        </select>
                                </div>

                                <div className="h-[90%] w-full max-w-lg"><Pitch players={myTeam.players} formation={myTeam.formation} onPlayerClick={handleSquadPlayerClick} highlightedPlayerId={swapSourceId} onSwapPlayers={handlePositionSwap}/></div>
                            </div>
                            <div className="w-full lg:w-96 bg-slate-900 flex flex-col border-l border-slate-800 h-[45%] lg:h-full">
                                <div className="p-4 border-b border-slate-800 bg-slate-900 z-10">
                                    <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-lg">Squad Selection</h2><button onClick={toggleSwapMode} className={`px-3 py-1 rounded text-xs font-bold border transition-all flex items-center gap-1 ${swapMode ? 'bg-yellow-500 text-black border-yellow-600' : 'bg-slate-800 border-slate-700 text-slate-400'}`}><ArrowLeftRight size={14} /> {swapMode ? 'Cancel Swap' : 'Swap Mode'}</button></div>
                                    <div className="flex gap-2 p-1 bg-slate-950 rounded-lg">{['FIRST_TEAM', 'U23', 'U18'].map(cat => (<button key={cat} onClick={() => setSquadCategory(cat as any)} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${squadCategory === cat ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>{cat.replace('_', ' ')}</button>))}</div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {['STARTING', 'SUB', 'RESERVE'].map(status => {
                                        const statusPlayers = myTeam.players.filter(p => p.squadStatus === status && p.teamCategory === squadCategory);
                                        if (statusPlayers.length === 0) return null;
                                        return (
                                            <div key={status} className="mb-4">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 px-1">{status} XI</div>
                                                {statusPlayers.map(player => (
                                                    <div key={player.id} onClick={() => handleSquadPlayerClick(player)} className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all hover:bg-slate-800 ${swapSourceId === player.id ? 'bg-yellow-500/10 border-yellow-500 text-yellow-200' : selectedPlayer?.id === player.id ? 'bg-emerald-500/10 border-emerald-500' : 'bg-slate-950 border-slate-800'}`}>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${player.position === Position.GK ? 'bg-yellow-500/20 text-yellow-500' : 'bg-slate-800 text-slate-300'}`}>{player.position}</div>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-bold text-white flex items-center gap-2">
                                                                {player.name}
                                                                {player.recentGrowth === 1 && <ArrowUpCircle size={12} className="text-emerald-400" />}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500">{player.role}</div>
                                                        </div>
                                                        <div className="font-display font-bold text-slate-300">{player.rating}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            {selectedPlayer && !swapMode && (<div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedPlayer(null)}><div onClick={e => e.stopPropagation()} className="w-full h-full flex items-center justify-center"><PlayerCard player={selectedPlayer} onClose={() => setSelectedPlayer(null)} onRoleChange={handleRoleChange} isOwned={true} onTransfer={handleTransfer} onContractRenew={handleContractRenew} onTrainingChange={handleTrainingChange} budget={myTeam.budget} /></div></div>)}
                        </div>
                    )}
                    {view === GameView.TRANSFERS && <TransferMarket marketPlayers={marketPlayers} setMarketPlayers={setMarketPlayers} budget={myTeam.budget} onBuyPlayer={handleTransfer} />}
                    {view === GameView.SCOUTING && <ScoutingView budget={myTeam.budget} staff={myTeam.staff} onSpendBudget={handleSpendBudget} onSignPlayer={handleTransfer} />}
                    {view === GameView.STAFF && <StaffView currentStaff={myTeam.staff} budget={myTeam.budget} onHire={handleHireStaff} onFire={handleFireStaff} />}
                    {view === GameView.COMPETITIONS && <CompetitionsView seasonState={seasonState!} myTeam={myTeam} teamRatings={teamRatings} />}
                    {view === GameView.SHOP && <ShopView goldCoins={myTeam.goldCoins} onBuyCoins={handleBuyCoins} onBuyBoost={handleBuyBoost} />}
                    {view === GameView.MANAGER && <ManagerView profile={managerProfile} />}
                    {view === GameView.MATCH && <MatchView myTeam={myTeam} opponent={opponent} onMatchEnd={handleMatchEnd} soundEnabled={gameSettings.soundEnabled} />}
                    {view === GameView.JOB_HUNT && <JobHuntView reputation={managerProfile.reputation} onAcceptJob={handleAcceptJob} />}
                    {view === GameView.SETTINGS && (
                        <SettingsView 
                            settings={gameSettings} 
                            onUpdateSettings={setGameSettings} 
                            onSaveGame={handleSaveGame} 
                            onLoadGame={handleLoadGame} 
                            onResetGame={handleResetGame}
                            hasSave={!!lastSaveDate}
                            lastSaveDate={lastSaveDate}
                            canInstall={!!installPrompt}
                            onInstall={handleInstallApp}
                        />
                    )}
                  </>
              )}
          </div>
      </div>
      {seasonAwards && <SeasonAwardsModal awards={seasonAwards} onClose={() => { setSeasonAwards(null); setView(GameView.DASHBOARD); }} year={seasonState!.year} />}
    </div>
  );
};

export default App;
