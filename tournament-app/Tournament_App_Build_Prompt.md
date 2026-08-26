# Build Prompt: Generic Tournament & Community App

Copy everything below into your coding agent (Claude Code, Cursor, etc.) as the project brief.

---

## 1. Overview

Build a cross-platform mobile app (React Native + Expo preferred, or Flutter if the agent prefers) that lets a community:

1. Create and run **tournaments for any game/sport** (not tied to one game — table tennis, badminton, chess, FIFA, carrom, etc.)
2. **Manage tournaments end-to-end**: registration, round-robin scheduling, live score entry, standings, knockout brackets
3. Post **individual and group public posts** (like a mini social feed) — updates, results, photos, trash talk, announcements
4. Support **multiple concurrent and future tournaments**, each with its own game type, rules, and participants

Treat this as a community sports club app, not a single-tournament tool.

---

## 2. Core Modules

### A. Auth & Profiles
- Sign up / login (email or phone OTP)
- Profile: name, avatar, bio, "games I play"
- Public profile page showing: tournaments joined, win/loss record, badges/trophies, recent posts

### B. Tournament Management
- **Create Tournament** wizard:
  - Tournament name, game/sport (free text or pick from list + "Other"), banner image
  - Format selector: Round Robin only / Round Robin + Knockout / Single Elimination / Double Elimination / League
  - Configurable rules per tournament (this is important — make rules data-driven, not hardcoded):
    - Match format (best of N games/sets)
    - Points per game/target score
    - Points-per-win system (editable, e.g. 1 pt per game won, or 3/1/0 league style)
    - Tie-break order (configurable list: e.g. Games Won → Head-to-Head → Coin Toss)
    - Number of players advancing to knockout stage (e.g. top 8 of 12)
  - Add participants (invite via link/username, or manual entry for offline players)
  - Auto-generate round-robin schedule (round-robin pairing algorithm — every player plays every other player once, balanced across rounds) — mirror the kind of schedule structure in the uploaded doc (Round 1–11, Matches M1–M66 for 12 players)
  - Auto-generate knockout bracket from standings once round robin ends (random draw or seeded draw — make both options available)

- **Match/Score Entry**:
  - Each match has: Player A, Player B, Game 1/2/3+ scores, Winner, Notes
  - Score entry restricted to: tournament admin, or both players (with confirmation from both to avoid disputes)
  - Auto-calculate match winner from game scores based on tournament's win rule
  - Support "walkover" / "no-show" / "forfeit" statuses

- **Standings (auto-calculated, not manual)**:
  - Live-updating table: MP, Wins, Losses, Games Won, Games Lost, Game Diff, Points, Qualification Status
  - Apply the tournament's configured tie-break rules automatically
  - Mark "Qualified" / "Eliminated" once cutoffs are known

- **Bracket View**:
  - Visual knockout bracket (QF → SF → Final, + 3rd place playoff toggle)
  - Tap a match to enter/view score

- **Individual Player Score Cards**:
  - Per-player card showing all their matches, opponents, game-by-game results, total record — auto-generated from match data (not manually duplicated like in the Word doc)

### C. Social / Community Feed
- Public feed (like Instagram/Twitter-lite) scoped to the app or to a specific tournament/club:
  - Individual posts: text + photo/video, tag a tournament or match
  - Group posts: post on behalf of a team/club
  - Auto-generated system posts: "Match M12 result: Rahim beat Furqan 2-0", "Sheheryar qualified for Quarter-Finals" — auto-post highlights so players don't have to
  - Likes, comments, share
- Notifications: match reminders, "you're up next", results posted, someone commented

### D. Discovery / Home
- Home feed: mix of social posts + tournament updates from tournaments the user follows/joined
- "My Tournaments" list (active, upcoming, past)
- "Explore Tournaments" — browse public tournaments to join, filter by game type/location

### E. Admin Tools
- Tournament organizer dashboard: manage participants, edit schedule, override scores, close/finalize tournament, export results (CSV/PDF)
- Roles: Super Admin (app), Tournament Admin (per tournament), Player

---

## 3. Suggested Tech Stack

- **Frontend**: React Native + Expo (fast to ship, one codebase for iOS/Android)
- **Backend**: Node.js + Express or Firebase/Supabase (Supabase recommended for speed — built-in auth, Postgres, realtime, storage)
- **Database**: Postgres (via Supabase) — relational fits tournaments/matches well
- **Realtime**: Supabase Realtime or Socket.io for live score updates and feed
- **Storage**: Supabase Storage or S3 for images/avatars
- **Push Notifications**: Expo Notifications / Firebase Cloud Messaging

(If the coding agent has a strong default stack it prefers, that's fine — the above is a suggestion, not a hard requirement.)

---

## 4. Data Model (starting point)

```
User { id, name, username, avatar_url, bio, created_at }

Tournament {
  id, name, game_type, banner_url, format,        // round_robin, round_robin_knockout, single_elim, league
  rules_json,                                       // { matchFormat, pointsPerGame, tieBreakOrder[], qualifiersCount }
  status,                                           // draft, registration_open, in_progress, completed
  organizer_id, created_at
}

TournamentParticipant { id, tournament_id, user_id, seed, status }  // status: active, qualified, eliminated

Match {
  id, tournament_id, round, match_number, stage,    // round_robin, quarter_final, semi_final, final, third_place
  player_a_id, player_b_id, games_json,             // [{g:1, a_score, b_score}, ...]
  winner_id, status                                  // scheduled, in_progress, completed, walkover
}

Standing { tournament_id, user_id, played, won, lost, games_won, games_lost, points, rank, qualification_status }
// (can be a computed view instead of a stored table)

Post { id, author_id, tournament_id (nullable), group_id (nullable), text, media_urls[], type, created_at }
// type: user_post, system_result, announcement

Comment / Like { id, post_id, user_id, ... }
```

---

## 5. Build Priority (MVP first)

1. Auth + profile
2. Create tournament + add participants + auto-generate round-robin schedule
3. Score entry + auto standings calculation
4. Knockout bracket generation from standings
5. Basic social feed with auto-generated match result posts
6. User posts (text + image), likes/comments
7. Notifications
8. Admin dashboard polish, multi-tournament discovery, roles/permissions

Start with #1–4 as a working vertical slice before touching the social layer — the tournament engine is the hard part; the feed is comparatively easy once the data model exists.

---

## 6. Notes for the coding agent

- Make the round-robin scheduling algorithm and rule engine **generic and game-agnostic** — don't hardcode "table tennis" or "20 points" anywhere; everything sport-specific must come from `rules_json` on the Tournament.
- Design the schema so a single account can belong to multiple tournaments across multiple games simultaneously.
- Favor a clean, mobile-first UI — bottom tab nav: Home (feed) / Tournaments / Create / Notifications / Profile.
