export interface User {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  games_played: string[];
  created_at: string;
}

export interface Tournament {
  id: string;
  name: string;
  game_type: string;
  banner_url: string | null;
  format: TournamentFormat;
  rules_json: TournamentRules;
  status: TournamentStatus;
  organizer_id: string;
  created_at: string;
}

export type TournamentFormat =
  | 'round_robin'
  | 'round_robin_knockout'
  | 'single_elimination'
  | 'double_elimination'
  | 'league';

export type TournamentStatus =
  | 'draft'
  | 'registration_open'
  | 'in_progress'
  | 'completed';

export interface TournamentRules {
  matchFormat: number; // best of N
  pointsPerGame: number;
  pointsPerWin: { win: number; draw: number; loss: number };
  tieBreakOrder: string[];
  qualifiersCount: number;
  thirdPlacePlayoff: boolean;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  seed: number | null;
  status: 'active' | 'qualified' | 'eliminated';
  user?: User;
}

export interface Match {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  stage: MatchStage;
  player_a_id: string | null;
  player_b_id: string | null;
  player_a?: User;
  player_b?: User;
  games_json: GameScore[];
  winner_id: string | null;
  status: MatchStatus;
  notes: string | null;
}

export type MatchStage =
  | 'round_robin'
  | 'quarter_final'
  | 'semi_final'
  | 'final'
  | 'third_place';

export type MatchStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'walkover'
  | 'forfeit'
  | 'no_show';

export interface GameScore {
  game: number;
  a_score: number;
  b_score: number;
}

export interface Standing {
  tournament_id: string;
  user_id: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  games_won: number;
  games_lost: number;
  game_diff: number;
  points: number;
  rank: number;
  qualification_status: 'active' | 'qualified' | 'eliminated';
  user?: User;
}

export interface Post {
  id: string;
  author_id: string;
  tournament_id: string | null;
  group_id: string | null;
  text: string;
  media_urls: string[];
  type: 'user_post' | 'system_result' | 'announcement';
  created_at: string;
  author?: User;
  tournament?: Tournament;
  likes_count: number;
  comments_count: number;
  liked_by_me?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
  user?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  read: boolean;
  data: Record<string, any>;
  created_at: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  TournamentDetail: { tournamentId: string };
  CreateTournament: undefined;
  MatchDetail: { matchId: string; tournamentId: string };
  ScoreEntry: { matchId: string; tournamentId: string };
  PlayerProfile: { userId: string };
  BracketView: { tournamentId: string };
  Standings: { tournamentId: string };
};

export type TabParamList = {
  Home: undefined;
  Tournaments: undefined;
  Create: undefined;
  Notifications: undefined;
  Profile: undefined;
};
