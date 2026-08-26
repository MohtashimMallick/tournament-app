import { Match, Tournament, TournamentParticipant, GameScore, Standing, User } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function generateRoundRobinSchedule(
  tournamentId: string,
  participants: TournamentParticipant[]
): Match[] {
  const players = participants.map((p) => p.user_id);
  const n = players.length;

  if (n < 2) return [];

  const matches: Match[] = [];
  let matchNumber = 1;

  // If odd number of players, add a bye
  const playerList = n % 2 === 0 ? [...players] : [...players, null];
  const totalPlayers = playerList.length;
  const totalRounds = totalPlayers - 1;
  const matchesPerRound = totalPlayers / 2;

  // Create a copy of the player list for rotation
  const rotating = [...playerList];

  for (let round = 1; round <= totalRounds; round++) {
    for (let i = 0; i < matchesPerRound; i++) {
      const playerA = rotating[i];
      const playerB = rotating[totalPlayers - 1 - i];

      // Skip if either player is a bye (null)
      if (playerA === null || playerB === null) continue;

      matches.push({
        id: uuidv4(),
        tournament_id: tournamentId,
        round,
        match_number: matchNumber++,
        stage: 'round_robin',
        player_a_id: playerA,
        player_b_id: playerB,
        games_json: [],
        winner_id: null,
        status: 'scheduled',
        notes: null,
      });
    }

    // Rotate: fix first element, rotate the rest
    if (totalPlayers > 2) {
      const last = rotating.pop()!;
      rotating.splice(1, 0, last);
    }
  }

  return matches;
}

export function calculateStandings(
  matches: Match[],
  participants: TournamentParticipant[],
  rules: { pointsPerWin: { win: number; draw: number; loss: number } }
): Standing[] {
  const standingsMap = new Map<string, Standing>();

  // Initialize standings for all participants
  for (const p of participants) {
    standingsMap.set(p.user_id, {
      tournament_id: p.tournament_id,
      user_id: p.user_id,
      played: 0,
      won: 0,
      lost: 0,
      drawn: 0,
      games_won: 0,
      games_lost: 0,
      game_diff: 0,
      points: 0,
      rank: 0,
      qualification_status: 'active',
    });
  }

  // Process completed matches
  const completedMatches = matches.filter((m) => m.status === 'completed' && m.winner_id);

  for (const match of completedMatches) {
    if (!match.player_a_id || !match.player_b_id || !match.winner_id) continue;

    const standingA = standingsMap.get(match.player_a_id);
    const standingB = standingsMap.get(match.player_b_id);
    if (!standingA || !standingB) continue;

    // Update games won/lost
    for (const game of match.games_json) {
      standingA.games_won += game.a_score;
      standingA.games_lost += game.b_score;
      standingB.games_won += game.b_score;
      standingB.games_lost += game.a_score;
    }

    standingA.played += 1;
    standingB.played += 1;

    if (match.winner_id === match.player_a_id) {
      standingA.won += 1;
      standingA.points += rules.pointsPerWin.win;
      standingB.lost += 1;
      standingB.points += rules.pointsPerWin.loss;
    } else if (match.winner_id === match.player_b_id) {
      standingB.won += 1;
      standingB.points += rules.pointsPerWin.win;
      standingA.lost += 1;
      standingA.points += rules.pointsPerWin.loss;
    } else {
      // Draw
      standingA.drawn += 1;
      standingB.drawn += 1;
      standingA.points += rules.pointsPerWin.draw;
      standingB.points += rules.pointsPerWin.draw;
    }
  }

  // Calculate game difference
  for (const standing of standingsMap.values()) {
    standing.game_diff = standing.games_won - standing.games_lost;
  }

  // Sort standings
  const standings = Array.from(standingsMap.values());
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.game_diff !== a.game_diff) return b.game_diff - a.game_diff;
    if (b.games_won !== a.games_won) return b.games_won - a.games_won;
    return b.won - a.won;
  });

  // Assign ranks
  standings.forEach((s, i) => {
    s.rank = i + 1;
  });

  return standings;
}

export function generateKnockoutBracket(
  tournamentId: string,
  standings: Standing[],
  qualifiersCount: number,
  seeded: boolean = true
): Match[] {
  const qualifiers = standings
    .filter((s) => s.qualification_status === 'qualified' || standings.indexOf(s) < qualifiersCount)
    .slice(0, qualifiersCount);

  if (qualifiers.length < 2) return [];

  const players = seeded
    ? qualifiers.map((s) => s.user_id)
    : shuffleArray(qualifiers.map((s) => s.user_id));

  const matches: Match[] = [];
  let matchNumber = 1;

  // Quarter finals (if 8 players), Semi finals, Final
  const rounds = Math.ceil(Math.log2(players.length));

  // Pad to next power of 2
  const totalSlots = Math.pow(2, rounds);
  const paddedPlayers = [...players];
  while (paddedPlayers.length < totalSlots) {
    paddedPlayers.push(null as any);
  }

  // Generate first round matches
  const firstRoundMatches: (string | null)[][] = [];
  for (let i = 0; i < totalSlots / 2; i++) {
    firstRoundMatches.push([paddedPlayers[i], paddedPlayers[totalSlots - 1 - i]]);
  }

  // Create matches for each round
  let currentRoundMatches = firstRoundMatches;
  const stageNames = ['quarter_final', 'semi_final', 'final', 'third_place'];

  for (let round = 0; round < rounds; round++) {
    const stage = round === rounds - 1 ? 'final' : stageNames[round] || `round_${round + 1}`;

    for (const [playerA, playerB] of currentRoundMatches) {
      if (playerA === null && playerB === null) continue;

      matches.push({
        id: uuidv4(),
        tournament_id: tournamentId,
        round: round + 1,
        match_number: matchNumber++,
        stage: stage as any,
        player_a_id: playerA,
        player_b_id: playerB,
        games_json: [],
        winner_id: null,
        status: playerA && playerB ? 'scheduled' : playerA ? 'walkover' : 'walkover',
        notes: !playerA || !playerB ? 'Walkover' : null,
      });
    }

    // Prepare next round pairings (winners will be determined later)
    if (round < rounds - 1) {
      currentRoundMatches = [];
      for (let i = 0; i < currentRoundMatches.length / 2; i++) {
        currentRoundMatches.push([null, null]); // Will be filled when winners are determined
      }
    }
  }

  return matches;
}

export function generateSingleEliminationBracket(
  tournamentId: string,
  participantIds: string[]
): Match[] {
  const matches: Match[] = [];
  let matchNumber = 1;

  const rounds = Math.ceil(Math.log2(participantIds.length));
  const totalSlots = Math.pow(2, rounds);
  const players = [...participantIds];
  while (players.length < totalSlots) {
    players.push(null as any);
  }

  let currentRound = [];
  for (let i = 0; i < players.length; i += 2) {
    currentRound.push([players[i], players[i + 1]]);
  }

  const stageNames = ['round_1', 'round_2', 'quarter_final', 'semi_final', 'final'];

  for (let round = 0; round < rounds; round++) {
    const stage = stageNames[round] || `round_${round + 1}`;

    for (const [playerA, playerB] of currentRound) {
      if (playerA === null && playerB === null) continue;

      matches.push({
        id: uuidv4(),
        tournament_id: tournamentId,
        round: round + 1,
        match_number: matchNumber++,
        stage: stage as any,
        player_a_id: playerA,
        player_b_id: playerB,
        games_json: [],
        winner_id: null,
        status: playerA && playerB ? 'scheduled' : playerA ? 'walkover' : 'walkover',
        notes: !playerA || !playerB ? 'Walkover' : null,
      });
    }

    // Next round will have half the matches
    currentRound = [];
    for (let i = 0; i < Math.ceil(currentRound.length / 2); i++) {
      currentRound.push([null, null]);
    }
  }

  return matches;
}

export function determineMatchWinner(
  games: GameScore[],
  matchFormat: number
): { winner: 'a' | 'b' | null; gamesToWin: number } {
  const gamesToWin = Math.ceil(matchFormat / 2);
  let aWins = 0;
  let bWins = 0;

  for (const game of games) {
    if (game.a_score > game.b_score) aWins++;
    else if (game.b_score > game.a_score) bWins++;

    if (aWins >= gamesToWin) return { winner: 'a', gamesToWin };
    if (bWins >= gamesToWin) return { winner: 'b', gamesToWin };
  }

  return { winner: null, gamesToWin };
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
