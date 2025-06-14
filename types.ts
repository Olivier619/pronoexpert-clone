
export enum MatchStatus {
  SCHEDULED = 'Scheduled',
  IN_PROGRESS = 'In Progress',
  FINISHED = 'Finished',
  CANCELLED = 'Cancelled',
  POSTPONED = 'Postponed',
}

export interface Team {
  id: string; // Will be generated (e.g., slugified name)
  name: string; // From Gemini
  logoUrl: string; // Will be generated (e.g., picsum with name as seed)
}

export interface OutcomeProbabilities {
  homeWin: number;
  draw: number;
  awayWin: number;
}

export interface Match {
  id: string; // Will be generated (e.g., combination of team names and date)
  league: string; // From Gemini
  round: string; // From Gemini
  date: string; // ISO string from Gemini
  status: MatchStatus; // From Gemini
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number | null; // From Gemini
  awayScore?: number | null; // From Gemini
  homeHalfTimeScore?: number | null; // From Gemini
  awayHalfTimeScore?: number | null; // From Gemini
  recentForm?: { 
    home: string; // From GeminiMatchResponse.homeTeamRecentForm
    away: string; // From GeminiMatchResponse.awayTeamRecentForm
  };
  outcomeProbabilities?: OutcomeProbabilities | null; // Calculated based on recentForm
  detailsError?: string | null; // From Gemini, or for local errors
  competitionId: string; // From Gemini (or derived)
  competitionName: string; // From Gemini (or derived)
}

export interface Competition {
  id: string;
  name: string;
}

export enum NavTab {
  TODAY = "AUJOURD'HUI",
  TOMORROW = "DEMAIN",
  LAST_MATCHES = "DERNIERS MATCHS",
}

// For Gemini raw response parsing
export interface GeminiMatchResponse {
  league: string;
  round: string;
  date: string;
  status: string; // Will be cast to MatchStatus
  homeTeamName: string;
  awayTeamName:string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeHalfTimeScore?: number | null;
  awayHalfTimeScore?: number | null;
  competitionId: string;
  competitionName: string;
  detailsError?: string | null;
  homeTeamRecentForm: string; // e.g., "W D L W W L D D W L W W L D W"
  awayTeamRecentForm: string; // e.g., "L L D W W L D W W L D D W L W"
}