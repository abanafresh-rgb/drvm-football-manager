
// ... existing imports ...
import { GoogleGenAI, Type } from "@google/genai";
import { Team, MatchEvent, Player, Position, SquadStatus, TeamCategory, InjuryStatus, TeamMetadata, Competition, CompetitionType, Fixture, MatchStats, JobOffer, Coach, CoachRole, TransferType, PressingIntensity, PassingStyle, DefensiveLine, LeagueTableEntry, SeasonAwards } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview'; // Updated to valid model

const EUROPEAN_CLUBS = [
// ... existing array content ...
    'Real Madrid', 'Man City', 'Bayern Munich', 'Paris SG', 'Liverpool', 'Inter Milan', 
    'Arsenal', 'Bayer Leverkusen', 'Barcelona', 'Atlético Madrid', 'Juventus', 'AC Milan', 
    'Dortmund', 'RB Leipzig', 'Benfica', 'Sporting CP', 'Porto', 'PSV', 'Feyenoord',
    'Ajax', 'Napoli', 'Lazio', 'Roma', 'Atalanta', 'Aston Villa', 'Tottenham', 'Chelsea',
    'Man Utd', 'Newcastle', 'Real Sociedad', 'Athletic Bilbao', 'Girona', 'Monaco', 'Lille',
    'Lyon', 'Marseille', 'Stuttgart', 'Frankfurt', 'Salzburg', 'Shakhtar', 'Celtic', 'Rangers',
    'Galatasaray', 'Fenerbahçe', 'Besiktas', 'Olympiacos', 'Panathinaikos', 'Club Brugge', 'Bologna', 'Brest'
];

const ROTW_CLUBS = [
    'Flamengo', 'Palmeiras', 'Boca Juniors', 'River Plate',
    'Al-Hilal', 'Al-Nassr', 'Al-Ittihad', 'Urawa Red Diamonds', 
    'Al Ahly', 'Wydad AC', 'Mamelodi Sundowns',
    'Seattle Sounders', 'LAFC', 'Inter Miami', 'Club América', 'Monterrey',
    'Auckland City'
];

export const getEuropeanTeams = () => EUROPEAN_CLUBS;
export const getRestOfWorldTeams = () => ROTW_CLUBS;

const cleanJSON = (text: string) => {
    if (!text) return '{}';
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

const COMMON_SURNAMES = [
    "Smith", "Garcia", "Silva", "Muller", "Rossi", "Dubois", "Bakker", "Kim", "Li", "Singh", 
    "Sato", "Ivanov", "Popov", "O'Connor", "Davies", "Schmidt", "Ferrari", "Santos", "Costa", 
    "Fernandez", "Lopez", "Gonzalez", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Hoffmann",
    "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti", "De Luca", "Mancini", "Rizzo",
    "Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand", "Leroy", "Moreau",
    "Williams", "Brown", "Taylor", "Wilson", "Evans", "Thomas", "Roberts", "Walker", "Wright"
];

const FIRST_NAMES = [
    "James", "David", "John", "Robert", "Michael", "William", "Thomas", "Daniel", "Matthew", "Anthony",
    "Lucas", "Mateo", "Leo", "Gabriel", "Santiago", "Sebastian", "Alex", "Max", "Paul", "Marc",
    "Luca", "Marco", "Alessandro", "Giuseppe", "Antonio", "Giovanni", "Roberto", "Andrea", "Stefano",
    "Hans", "Klaus", "Jürgen", "Stefan", "Walter", "Uwe", "Frank", "Peter", "Karl", "Dieter",
    "Hugo", "Joao", "Pedro", "Rui", "Nuno", "Tiago", "Miguel", "Andre", "Luis", "Carlos"
];

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateYouthPlayer = (index: number, category: TeamCategory, nationality: string, teamRating: number, isWonderkid: boolean = false): Player => {
    const isU23 = category === TeamCategory.U23;
    const age = isU23 ? 19 + Math.floor(Math.random() * 4) : 15 + Math.floor(Math.random() * 3);
    
    // Rating calculation: U23s are closer to first team, U18s are raw
    let baseRating = isU23 ? teamRating - 15 : teamRating - 25;
    
    // Wonderkid Overrides
    if (isWonderkid) {
        baseRating = Math.max(baseRating + 15, 72); // Wonderkids start high
    }

    // Ensure rating is an integer
    const calculatedRating = Math.max(45, Math.min(isWonderkid ? 85 : 80, baseRating + Math.floor(Math.random() * 10) - 5));
    const rating = Math.round(calculatedRating);
    
    const positions = [Position.GK, Position.DEF, Position.MID, Position.FWD];
    const position = positions[Math.floor(Math.random() * positions.length)];
    
    // Name generation
    const firstName = getRandomItem(FIRST_NAMES);
    const lastName = getRandomItem(COMMON_SURNAMES);
    
    const statsMultiplier = isWonderkid ? 1.2 : 1.0;

    return {
        id: `${category.toLowerCase()}_${Date.now()}_${index}`,
        name: `${firstName} ${lastName}`,
        age: age,
        nationality: nationality,
        position: position,
        role: isWonderkid ? 'Generational Talent' : (isU23 ? 'Reserve' : 'Academy Prospect'),
        rating: rating,
        pace: Math.min(99, Math.floor((50 + Math.random() * 40) * statsMultiplier)),
        shooting: Math.min(99, Math.floor((40 + Math.random() * 40) * statsMultiplier)),
        passing: Math.min(99, Math.floor((40 + Math.random() * 40) * statsMultiplier)),
        dribbling: Math.min(99, Math.floor((40 + Math.random() * 40) * statsMultiplier)),
        defending: Math.min(99, Math.floor((40 + Math.random() * 40) * statsMultiplier)),
        physical: Math.min(99, Math.floor((40 + Math.random() * 40) * statsMultiplier)),
        marketValue: rating * (isWonderkid ? 1500000 : (isU23 ? 200000 : 50000)),
        wages: isWonderkid ? 5000 : (isU23 ? 2000 : 500),
        contractExpiry: 2029 + Math.floor(Math.random() * 3),
        contractType: TransferType.ACADEMY,
        squadStatus: SquadStatus.RESERVE,
        teamCategory: category,
        condition: 100,
        morale: 70,
        injuryStatus: InjuryStatus.FIT,
        isInternationalDuty: false,
        seasonStats: { appearances: 0, goals: 0, assists: 0 },
        careerStats: { appearances: 0, goals: 0, assists: 0 },
        internationalStats: { caps: 0, goals: 0, assists: 0 },
        history: [],
        awards: []
    };
};

export const generateAcademyIntake = (count: number, teamRating: number, nationality: string): Player[] => {
    const intake: Player[] = [];
    for (let i = 0; i < count; i++) {
        // 5% chance of a Wonderkid (Extremely great stats)
        const isWonderkid = Math.random() < 0.05;
        intake.push(generateYouthPlayer(i, TeamCategory.U18, nationality, teamRating, isWonderkid));
    }
    return intake;
};

// ... keep existing code ...
const generatePlayerHistory = (age: number, currentTeam: string, rating: number): any[] => {
    const history = [];
    const careerLength = age - 17; // Started at 17
    if (careerLength <= 0) return [];

    let currentYear = 2024;
    let previousClub = currentTeam;
    
    // Generate 1-4 past transfers depending on age
    const numTransfers = Math.floor(Math.random() * Math.min(careerLength / 2, 4));
    const allClubs = [...EUROPEAN_CLUBS, ...ROTW_CLUBS];

    for(let i=0; i<numTransfers; i++) {
        const year = currentYear - Math.floor(1 + Math.random() * 3);
        currentYear = year;
        
        const isAcademy = i === numTransfers - 1 && age < 23;
        let fromClub = isAcademy ? 'Academy' : getRandomItem(allClubs.filter(t => t !== previousClub));
        if (!fromClub) fromClub = 'Unknown FC';

        const type = isAcademy ? TransferType.ACADEMY : (Math.random() > 0.8 ? TransferType.LOAN : (Math.random() > 0.8 ? TransferType.FREE : TransferType.PERMANENT));
        const fee = type === TransferType.PERMANENT ? (rating * 100000 * (0.5 + Math.random())) : 0;

        history.push({
            season: `${year}/${year+1}`,
            fromClub: fromClub,
            toClub: previousClub,
            fee: Math.floor(fee),
            type: type
        });

        previousClub = fromClub;
        if (isAcademy) break;
    }
    
    return history;
};

export const generateMatchCommentary = async (minute: number, myTeam: Team, opponent: Team, currentScore: {home: number, away: number}): Promise<MatchEvent | null> => {
    const rand = Math.random();
    if (rand > 0.95) {
        const eventTypeRand = Math.random();
        let type: MatchEvent['type'] = 'NORMAL';
        let description = "";
        const teamName = Math.random() > 0.5 ? myTeam.name : opponent.name;

        if (eventTypeRand > 0.94) {
            type = 'GOAL';
            const scorer = teamName === myTeam.name ? myTeam.players.find(p=>p.position === Position.FWD)?.name || 'Striker' : 'Opponent Striker';
            description = `GOAL! ${scorer} fires it into the net! What a finish for ${teamName}!`;
        } else if (eventTypeRand > 0.92) {
            type = 'RED_CARD';
            description = `DISASTER! A reckless challenge sees a player from ${teamName} sent off! Red Card!`;
        } else if (eventTypeRand > 0.90) {
            type = 'INJURY';
            description = `Play stops as a player from ${teamName} goes down clutching their leg. Looks serious.`;
        } else if (eventTypeRand > 0.7) {
            type = 'CHANCE';
            description = `Big chance for ${teamName}! The shot whistles just past the post.`;
        } else if (eventTypeRand > 0.6) {
            type = 'YELLOW_CARD';
            description = `The referee reaches into his pocket. Yellow card for a player from ${teamName} for pulling the shirt.`;
        } else {
            description = `${teamName} is controlling the possession now, looking for an opening.`;
        }

        return { minute, description, type, teamName };
    }
    return null;
};

// --- Generators using Gemini ---

export const generateSquad = async (teamName: string, league: string): Promise<Player[]> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Generate a squad of 23 REAL football players for the team ${teamName} in the ${league} (Current 2024/25 Season). 
            Return a JSON object with a "players" array.
            Each player should have: accurate name, age, nationality, position (GK, DEF, MID, FWD), rating (based on real life performance 50-95), and role (e.g., 'Captain', 'Star Player').`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        players: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    age: { type: Type.NUMBER },
                                    nationality: { type: Type.STRING },
                                    position: { type: Type.STRING, enum: ['GK', 'DEF', 'MID', 'FWD'] },
                                    rating: { type: Type.NUMBER },
                                    role: { type: Type.STRING }
                                },
                                required: ['name', 'age', 'nationality', 'position', 'rating', 'role']
                            }
                        }
                    },
                    required: ['players']
                }
            }
        });

        const data = JSON.parse(cleanJSON(response.text));
        
        // Process First Team
        const firstTeam: Player[] = data.players.map((p: any, index: number) => ({
            id: `p_${Date.now()}_${index}`,
            name: p.name,
            age: p.age,
            nationality: p.nationality,
            position: p.position as Position,
            role: p.role,
            rating: p.rating,
            pace: Math.floor(Math.random() * 40) + 50,
            shooting: Math.floor(Math.random() * 40) + 50,
            passing: Math.floor(Math.random() * 40) + 50,
            dribbling: Math.floor(Math.random() * 40) + 50,
            defending: Math.floor(Math.random() * 40) + 50,
            physical: Math.floor(Math.random() * 40) + 50,
            marketValue: p.rating * 1000000,
            wages: p.rating * 2000,
            contractExpiry: 2026 + Math.floor(Math.random() * 3),
            contractType: TransferType.PERMANENT,
            squadStatus: index < 11 ? SquadStatus.STARTING : index < 18 ? SquadStatus.SUB : SquadStatus.RESERVE,
            teamCategory: TeamCategory.FIRST_TEAM,
            condition: 100,
            morale: 80 + Math.floor(Math.random() * 20),
            injuryStatus: InjuryStatus.FIT,
            isInternationalDuty: false,
            seasonStats: { appearances: 0, goals: 0, assists: 0 },
            careerStats: { appearances: Math.floor(Math.random() * 200), goals: Math.floor(Math.random() * 50), assists: Math.floor(Math.random() * 50) },
            internationalStats: { caps: Math.floor(Math.random() * 50), goals: Math.floor(Math.random() * 10), assists: Math.floor(Math.random() * 10) },
            history: generatePlayerHistory(p.age, teamName, p.rating),
            awards: []
        }));

        // 2. Determine Dominant Nationality and Average Rating for Youth Generation
        const nationalities = firstTeam.map(p => p.nationality);
        const modeNationality = nationalities.sort((a,b) =>
            nationalities.filter(v => v===a).length - nationalities.filter(v => v===b).length
        ).pop() || "Unknown";
        
        const avgRating = firstTeam.reduce((sum, p) => sum + p.rating, 0) / firstTeam.length;

        // 3. Generate Youth Teams
        const u23Squad: Player[] = Array.from({ length: 15 }).map((_, i) => 
            generateYouthPlayer(i, TeamCategory.U23, modeNationality, avgRating)
        );

        const u18Squad: Player[] = Array.from({ length: 15 }).map((_, i) => 
            generateYouthPlayer(i, TeamCategory.U18, modeNationality, avgRating)
        );

        return [...firstTeam, ...u23Squad, ...u18Squad];

    } catch (e) {
        console.error("Failed to generate squad, using fallback", e);
        // Fallback for failure
        const fallbackSquad = Array.from({ length: 20 }).map((_, i) => ({
            id: `fallback_${i}`,
            name: `Player ${i}`,
            age: 24,
            nationality: 'Unknown',
            position: i === 0 ? Position.GK : i < 6 ? Position.DEF : i < 11 ? Position.MID : Position.FWD,
            role: 'Player',
            rating: 70,
            pace: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70,
            marketValue: 1000000, wages: 5000, contractExpiry: 2027,
            squadStatus: i < 11 ? SquadStatus.STARTING : SquadStatus.SUB,
            teamCategory: TeamCategory.FIRST_TEAM,
            condition: 100, morale: 100, injuryStatus: InjuryStatus.FIT, isInternationalDuty: false,
            internationalStats: { caps: 0, goals: 0, assists: 0 },
            history: [],
            awards: []
        }));
        return fallbackSquad; 
    }
};

export const generateLeagueTeams = async (leagueName: string): Promise<TeamMetadata[]> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Generate a list of all REAL teams (names, accurate primary/secondary hex colors, and current real manager names) for the league ${leagueName} (Current 2024/25 Season).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        teams: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    primaryColor: { type: Type.STRING },
                                    secondaryColor: { type: Type.STRING },
                                    managerName: { type: Type.STRING }
                                },
                                required: ['name', 'primaryColor', 'secondaryColor', 'managerName']
                            }
                        }
                    },
                    required: ['teams']
                }
            }
        });
        const data = JSON.parse(cleanJSON(response.text));
        return data.teams.map((t: any) => ({ ...t, league: leagueName }));
    } catch (e) {
        return Array.from({ length: 10 }).map((_, i) => ({
            name: `Team ${i}`,
            primaryColor: '#000000',
            secondaryColor: '#ffffff',
            league: leagueName,
            managerName: 'CPU'
        }));
    }
};

export const generateJobOffers = async (reputation: number): Promise<JobOffer[]> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Generate 3 job offers for a football manager with reputation ${reputation}/100.
            Use REAL clubs that would realistically hire a manager of this reputation level (Current 2024/25 Season).
            Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        offers: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    league: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    transferBudget: { type: Type.NUMBER },
                                    wageBudget: { type: Type.NUMBER },
                                    clubValue: { type: Type.NUMBER },
                                    facilitiesLevel: { type: Type.STRING },
                                    teamRating: { type: Type.NUMBER },
                                    primaryColor: { type: Type.STRING },
                                    secondaryColor: { type: Type.STRING }
                                },
                                required: ['name', 'league', 'description', 'transferBudget', 'wageBudget', 'clubValue', 'facilitiesLevel', 'teamRating', 'primaryColor', 'secondaryColor']
                            }
                        }
                    },
                    required: ['offers']
                }
            }
        });
        const data = JSON.parse(cleanJSON(response.text));
        return data.offers.map((o: any, i: number) => ({ ...o, id: `job_${Date.now()}_${i}` }));
    } catch (e) {
        return [];
    }
};

export const getTacticalAdvice = async (myTeam: Team, opponentName: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `As an expert assistant manager, give me tactical advice for our upcoming match against ${opponentName}.
            My team plays ${myTeam.formation}. We have average rating ${myTeam.rating || 75}.
            Keep it brief and actionable (max 3 sentences).`
        });
        return response.text || "Play hard and keep possession.";
    } catch (e) {
        return "Focus on maintaining shape and exploiting space on the counter-attack.";
    }
};

export const generateSeasonAwards = async (leagueTable: LeagueTableEntry[], myTeam: Team, year: number): Promise<SeasonAwards | null> => {
    try {
        const myTeamRank = leagueTable.findIndex(t => t.teamName === myTeam.name) + 1;
        const topScorerCandidate = myTeam.players.find(p => p.position === Position.FWD && p.rating > 80);
        const topKeeperCandidate = myTeam.players.find(p => p.position === Position.GK && p.rating > 80);

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Generate end-of-season awards for the ${year} season.
            Context:
            - User's Team: ${myTeam.name} finished position ${myTeamRank} in the league.
            - League Winner: ${leagueTable[0].teamName}.
            - User's Star Player: ${topScorerCandidate ? topScorerCandidate.name : 'None'}
            - User's Goalkeeper: ${topKeeperCandidate ? topKeeperCandidate.name : 'None'}
            
            Based on this, simulate realistic winners for:
            1. Ballon d'Or (Global best player)
            2. Golden Glove (Best GK)
            3. Golden Boy (Best U21)
            4. Manager of the Year
            5. Team of the Year (11 players)
            
            Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        ballonDor: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, team: { type: Type.STRING }, stats: { type: Type.STRING } } },
                        goldenGlove: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, team: { type: Type.STRING }, stats: { type: Type.STRING } } },
                        goldenBoy: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, team: { type: Type.STRING }, stats: { type: Type.STRING } } },
                        managerOfYear: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, team: { type: Type.STRING }, stats: { type: Type.STRING } } },
                        teamOfYear: { 
                            type: Type.ARRAY, 
                            items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, position: { type: Type.STRING }, team: { type: Type.STRING } } }
                        }
                    },
                    required: ['ballonDor', 'goldenGlove', 'goldenBoy', 'managerOfYear', 'teamOfYear']
                }
            }
        });

        const data = JSON.parse(cleanJSON(response.text));
        return data as SeasonAwards;
    } catch (e) {
        console.error("Awards generation failed", e);
        return null;
    }
};

// ... keep existing code ...
export const generateSeasonContext = async (leagueName: string): Promise<Competition[]> => {
    return [
        { id: 'league_1', name: leagueName, type: CompetitionType.LEAGUE, isActive: true, currentRound: 'Regular Season' },
        { id: 'cup_1', name: 'Domestic Cup', type: CompetitionType.DOMESTIC_CUP, isActive: true, currentRound: 'Round of 64' },
        { id: 'cont_1', name: 'Champions Elite', type: CompetitionType.CONTINENTAL_CUP, isActive: false, currentRound: 'Group Stage', formatDescription: 'Top Tier European Competition' },
        { id: 'cont_2', name: 'Europa League', type: CompetitionType.CONTINENTAL_CUP, isActive: false, currentRound: 'Group Stage', formatDescription: 'Second Tier European Competition' },
        { id: 'wc_1', name: 'Club World Cup', type: CompetitionType.WORLD_CUP, isActive: false, currentRound: 'Group Stage', formatDescription: 'FIFA Club World Championship' },
    ];
};

// ... existing helper simulations ...
export const generateOpponentForContext = async (leagueName: string, myTeamName: string, competition: Competition): Promise<Team> => {
    let opponentName = '';

    if (competition.type === CompetitionType.CONTINENTAL_CUP) {
        const candidates = EUROPEAN_CLUBS.filter(n => n !== myTeamName);
        opponentName = candidates[Math.floor(Math.random() * candidates.length)];
    } else if (competition.type === CompetitionType.WORLD_CUP) {
        // Mix of top Euro clubs and Rest of World
        const allCandidates = [...EUROPEAN_CLUBS.slice(0, 10), ...ROTW_CLUBS].filter(n => n !== myTeamName);
        opponentName = allCandidates[Math.floor(Math.random() * allCandidates.length)];
    } else {
        const names = ['United', 'City', 'Rovers', 'Athletic', 'Sporting', 'Real', 'Inter', 'FC', 'Dynamo'];
        opponentName = `${names[Math.floor(Math.random() * names.length)]} ${['FC', 'SC', 'City'].find((_,i) => Math.random() > 0.7) || ''}`;
    }
    
    return {
        name: opponentName,
        primaryColor: '#' + Math.floor(Math.random()*16777215).toString(16),
        secondaryColor: '#ffffff',
        formation: '4-3-3',
        budget: 10000000,
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
        managerName: 'CPU Boss',
        boardConfidence: 100
    };
};

export const generateLeagueSchedule = (teams: TeamMetadata[], competitionName: string, myTeamName: string): Fixture[] => {
    // Simple Round Robin generator
    const schedule: Fixture[] = [];
    const teamList = [...teams];
    if (teamList.length % 2 !== 0) teamList.push({ name: 'BYE', primaryColor: '', secondaryColor: '' }); // dummy
    
    const numTeams = teamList.length;
    const numRounds = (numTeams - 1) * 2;
    const halfRounds = numTeams - 1;

    for (let round = 0; round < numRounds; round++) {
        for (let i = 0; i < numTeams / 2; i++) {
            const homeIdx = (round + i) % (numTeams - 1);
            const awayIdx = (numTeams - 1 - i + round) % (numTeams - 1);
            
            let t1 = teamList[homeIdx];
            let t2 = teamList[awayIdx];
            
            // Fix last team
            if (i === 0) {
                t2 = teamList[numTeams - 1];
            }

            if (t1.name !== 'BYE' && t2.name !== 'BYE') {
                // Swap home/away for second half of season
                if (round >= halfRounds) {
                    const temp = t1; t1 = t2; t2 = temp;
                }

                schedule.push({
                    id: `fix_${round}_${t1.name}_${t2.name}`,
                    week: round + 1,
                    competitionId: 'league_1',
                    competitionName: competitionName,
                    homeTeam: t1.name,
                    awayTeam: t2.name,
                    isPlayed: false,
                    isUserMatch: t1.name === myTeamName || t2.name === myTeamName,
                    status: 'SCHEDULED'
                });
            }
        }
    }
    return schedule.sort((a,b) => a.week - b.week);
};

export const simulateMatchResult = (homeTeam: string, awayTeam: string): { homeScore: number, awayScore: number } => {
    // Simple random simulation
    const homeAdvantage = 0.3;
    const homeScore = Math.floor(Math.random() * 4 + homeAdvantage);
    const awayScore = Math.floor(Math.random() * 3);
    return { homeScore, awayScore };
};

export const generateHeadhuntOffers = async (reputation: number, league: string): Promise<JobOffer[]> => {
    return generateJobOffers(reputation);
};

export const generateTransferMarket = async (count: number): Promise<Player[]> => {
     try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Generate ${count} REAL football players who might be available on the transfer market (Current 2024/25 Season). Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        players: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    age: { type: Type.NUMBER },
                                    nationality: { type: Type.STRING },
                                    position: { type: Type.STRING, enum: ['GK', 'DEF', 'MID', 'FWD'] },
                                    rating: { type: Type.NUMBER }
                                },
                                required: ['name', 'age', 'nationality', 'position', 'rating']
                            }
                        }
                    },
                    required: ['players']
                }
            }
        });

        const data = JSON.parse(cleanJSON(response.text));
        
        return data.players.map((p: any, index: number) => ({
            id: `tm_${Date.now()}_${index}`,
            name: p.name,
            age: p.age,
            nationality: p.nationality,
            position: p.position as Position,
            role: 'Transfer Target',
            rating: p.rating,
            pace: 60 + Math.floor(Math.random()*30),
            shooting: 60 + Math.floor(Math.random()*30),
            passing: 60 + Math.floor(Math.random()*30),
            dribbling: 60 + Math.floor(Math.random()*30),
            defending: 60 + Math.floor(Math.random()*30),
            physical: 60 + Math.floor(Math.random()*30),
            marketValue: p.rating * 800000,
            wages: p.rating * 1500,
            contractExpiry: 2026,
            squadStatus: SquadStatus.RESERVE,
            teamCategory: TeamCategory.FIRST_TEAM,
            condition: 100,
            morale: 50,
            injuryStatus: InjuryStatus.FIT,
            isInternationalDuty: false,
            internationalStats: { caps: 0, goals: 0, assists: 0 },
            awards: []
        }));
    } catch {
        return [];
    }
};

export const generateScoutedPlayer = async (criteria: { region: string, position: string, ageGroup: string, scoutRating?: number }): Promise<Player | null> => {
     try {
        const qualityHint = criteria.scoutRating && criteria.scoutRating > 80 
            ? "The scout is world-class. Find a high potential 'hidden gem' or an elite player." 
            : "The scout is average. Find a decent squad player.";

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Generate a detailed REAL football player who fits the following scouting criteria:
            Region/League Context: ${criteria.region}
            Position: ${criteria.position}
            Age Context: ${criteria.ageGroup}
            Context: ${qualityHint}
            
            Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        age: { type: Type.NUMBER },
                        nationality: { type: Type.STRING },
                        position: { type: Type.STRING, enum: ['GK', 'DEF', 'MID', 'FWD'] },
                        rating: { type: Type.NUMBER },
                        playStyle: { type: Type.STRING }
                    },
                    required: ['name', 'age', 'nationality', 'position', 'rating', 'playStyle']
                }
            }
        });

        const data = JSON.parse(cleanJSON(response.text));
        if (!data.name) return null;
        
        const p = data;

        return {
            id: `scout_${Date.now()}`,
            name: p.name,
            age: p.age,
            nationality: p.nationality,
            position: p.position as Position,
            role: p.playStyle || 'Scouted Talent',
            rating: p.rating,
            pace: 60 + Math.floor(Math.random()*35),
            shooting: 50 + Math.floor(Math.random()*40),
            passing: 50 + Math.floor(Math.random()*40),
            dribbling: 50 + Math.floor(Math.random()*40),
            defending: 50 + Math.floor(Math.random()*40),
            physical: 50 + Math.floor(Math.random()*40),
            marketValue: p.rating * 900000,
            wages: p.rating * 1200,
            contractExpiry: 2026,
            squadStatus: SquadStatus.RESERVE,
            teamCategory: TeamCategory.FIRST_TEAM,
            condition: 100,
            morale: 50,
            injuryStatus: InjuryStatus.FIT,
            isInternationalDuty: false,
            internationalStats: { caps: 0, goals: 0, assists: 0 },
            history: [],
            awards: []
        };
     } catch (e) {
         console.error("Scouting error", e);
         return null;
     }
};

export const generateStaffMarket = async (count: number): Promise<Coach[]> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Generate ${count} REAL football coaches/staff (Current 2024/25 Season). Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        staff: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    role: { type: Type.STRING, enum: ['Assistant Manager', 'Fitness Coach', 'Physio', 'Scout'] },
                                    rating: { type: Type.NUMBER },
                                    specialty: { type: Type.STRING },
                                    nationality: { type: Type.STRING },
                                    age: { type: Type.NUMBER }
                                },
                                required: ['name', 'role', 'rating', 'specialty', 'nationality', 'age']
                            }
                        }
                    },
                    required: ['staff']
                }
            }
        });
        const data = JSON.parse(cleanJSON(response.text));
        return data.staff.map((s: any, i: number) => ({
            id: `staff_${Date.now()}_${i}`,
            ...s,
            salary: s.rating * 500,
            signingFee: s.rating * 1000
        }));
    } catch {
        return [];
    }
};
