
export interface MatchEvent {
  minute: number;
  description: string;
  type: 'GOAL' | 'CHANCE' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'NORMAL' | 'INJURY' | 'CORNER' | 'FREE_KICK' | 'VAR' | 'PENALTY';
  teamName: string;
}

export enum GameView {
  SETUP = 'SETUP',
  DASHBOARD = 'DASHBOARD',
  SQUAD = 'SQUAD',
  TRANSFERS = 'TRANSFERS',
  SCOUTING = 'SCOUTING',
  STAFF = 'STAFF',
  COMPETITIONS = 'COMPETITIONS',
  SHOP = 'SHOP',
  MATCH = 'MATCH',
  JOB_HUNT = 'JOB_HUNT',
  MANAGER = 'MANAGER',
  SETTINGS = 'SETTINGS'
}

export enum Position {
  GK = 'GK',
  DEF = 'DEF',
  MID = 'MID',
  FWD = 'FWD'
}

export enum SquadStatus {
  STARTING = 'STARTING',
  SUB = 'SUB',
  RESERVE = 'RESERVE'
}

export enum TeamCategory {
  FIRST_TEAM = 'FIRST_TEAM',
  U23 = 'U23',
  U18 = 'U18'
}

export enum TransferType {
  PERMANENT = 'PERMANENT',
  LOAN = 'LOAN',
  LOAN_OPTION = 'LOAN_OPTION',
  LOAN_OBLIGATION = 'LOAN_OBLIGATION',
  FREE = 'FREE',
  ACADEMY = 'ACADEMY'
}

export enum InjuryStatus {
  FIT = 'FIT',
  DOUBTFUL = 'DOUBTFUL',
  INJURED = 'INJURED'
}

export enum CompetitionType {
  LEAGUE = 'LEAGUE',
  DOMESTIC_CUP = 'DOMESTIC_CUP',
  CONTINENTAL_CUP = 'CONTINENTAL_CUP',
  WORLD_CUP = 'WORLD_CUP'
}

export enum ContinentalTier {
  TIER_1 = 'TIER_1',
  TIER_2 = 'TIER_2',
  TIER_3 = 'TIER_3'
}

export enum CoachRole {
  ASSISTANT = 'Assistant Manager',
  GK_COACH = 'Goalkeeping Coach',
  ATT_COACH = 'Attacking Coach',
  DEF_COACH = 'Defensive Coach',
  FITNESS = 'Fitness Coach',
  HEAD_PHYSIO = 'Head Physio',
  SCOUT = 'Scout',
  YOUTH_COACH = 'Youth Coach'
}

export enum PressingIntensity {
  LOW_BLOCK = 'LOW_BLOCK',
  BALANCED = 'BALANCED',
  HIGH_PRESS = 'HIGH_PRESS',
  GEGENPRESS = 'GEGENPRESS'
}

export enum PassingStyle {
  SHORT = 'SHORT',
  MIXED = 'MIXED',
  DIRECT = 'DIRECT',
  LONG_BALL = 'LONG_BALL'
}

export enum DefensiveLine {
  DEEP = 'DEEP',
  STANDARD = 'STANDARD',
  HIGH = 'HIGH'
}

export interface PlayerAward {
  name: string;
  year: number;
  type: 'INDIVIDUAL' | 'TEAM';
}

export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  position: Position;
  role: string;
  rating: number;
  potential: number; // Max rating cap
  recentGrowth?: number; // Visual indicator for UI
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  marketValue: number;
  wages: number;
  contractExpiry: number;
  contractType?: TransferType;
  squadStatus: SquadStatus;
  teamCategory: TeamCategory;
  condition: number;
  morale: number;
  injuryStatus: InjuryStatus;
  injuryDetails?: { type: string; weeksOut: number };
  isInternationalDuty: boolean;
  trainingFocus?: string;
  seasonStats?: { appearances: number; goals: number; assists: number };
  careerStats?: { appearances: number; goals: number; assists: number };
  internationalStats: { caps: number; goals: number; assists: number };
  history?: { season: string; fromClub: string; toClub: string; fee: number; type: TransferType }[];
  awards?: PlayerAward[];
}

export interface Coach {
  id: string;
  name: string;
  role: CoachRole;
  rating: number;
  specialty: string;
  age: number;
  nationality: string;
  salary: number;
  signingFee: number;
}

export interface Tactics {
  formation: string;
  playStyle: string;
  pressing: PressingIntensity;
  passing: PassingStyle;
  defensiveLine: DefensiveLine;
}

export interface Team {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  formation: string;
  budget: number;
  players: Player[];
  staff: Coach[];
  tactics: Tactics;
  goldCoins: number;
  managerName?: string;
  boardConfidence: number;
  rating?: number;
}

export interface MatchStats {
  homeScore: number;
  awayScore: number;
  possession: number;
  shotsHome: number;
  shotsAway: number;
  xgHome?: number;
  xgAway?: number;
}

export interface TeamMetadata {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  league?: string;
  managerName?: string;
}

export interface LeagueTableEntry {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: string[];
}

export interface Fixture {
  id: string;
  week: number;
  competitionId: string;
  competitionName: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  isPlayed: boolean;
  isUserMatch?: boolean;
  status: 'SCHEDULED' | 'PLAYED';
  roundName?: string; // e.g., "Round of 16"
}

export interface Competition {
  id: string;
  name: string;
  type: CompetitionType;
  isActive: boolean;
  currentRound: string;
  table?: LeagueTableEntry[];
  formatDescription?: string;
}

export interface SeasonState {
  week: number;
  year: number;
  competitions: Competition[];
  nextMatchContext: {
    competitionId: string;
    opponentName: string;
    roundName: string;
    isHome: boolean;
  };
  leagueTable: LeagueTableEntry[];
  recentResults: Fixture[];
  fixtures: Fixture[];
}

export interface JobOffer extends TeamMetadata {
  id: string;
  description: string;
  league: string;
  transferBudget: number;
  wageBudget: number;
  clubValue: number;
  facilitiesLevel: string;
  teamRating: number;
  primaryColor: string;
  secondaryColor: string;
}

export interface AwardWinner {
  name: string;
  team: string;
  stats?: string;
}

export interface SeasonAwards {
  ballonDor: AwardWinner;
  goldenGlove: AwardWinner;
  goldenBoy: AwardWinner;
  managerOfYear: AwardWinner;
  teamOfYear: { name: string; position: string; team: string }[];
}

export interface TrophyItem {
  id: string;
  name: string;
  year: number;
  type: CompetitionType;
}

export interface ManagerAward {
  id: string;
  name: string;
  year: number;
  type: 'MONTH' | 'YEAR' | 'SPECIAL';
}

export interface ManagerStats {
  gamesManaged: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  trophiesWon: number;
}

export interface ClubHistoryEntry {
    club: string;
    years: string;
    stats: {
        played: number;
        won: number;
        drawn: number;
        lost: number;
    };
}

export interface ManagerProfile {
  name: string;
  age: number;
  nationality: string;
  reputation: number;
  stats: ManagerStats;
  trophies: TrophyItem[];
  awards: ManagerAward[];
  clubHistory: ClubHistoryEntry[];
}

export interface GameSettings {
    autoSave: boolean;
    soundEnabled: boolean;
    textSpeed: number; // 1 to 5
    theme: 'DARK' | 'LIGHT';
}

export interface SaveData {
    myTeam: Team;
    seasonState: SeasonState;
    managerProfile: ManagerProfile;
    gameSettings: GameSettings;
    marketPlayers: Player[];
    incomingOffers: JobOffer[];
    dateSaved: string;
}
