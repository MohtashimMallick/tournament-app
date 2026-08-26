-- Tournament App Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  games_played TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournaments table
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  game_type TEXT NOT NULL,
  banner_url TEXT,
  format TEXT NOT NULL CHECK (format IN ('round_robin', 'round_robin_knockout', 'single_elimination', 'double_elimination', 'league')),
  rules_json JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'registration_open', 'in_progress', 'completed')),
  organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournament participants table
CREATE TABLE tournament_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  seed INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'qualified', 'eliminated')),
  UNIQUE(tournament_id, user_id)
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('round_robin', 'quarter_final', 'semi_final', 'final', 'third_place')),
  player_a_id UUID REFERENCES users(id) ON DELETE SET NULL,
  player_b_id UUID REFERENCES users(id) ON DELETE SET NULL,
  games_json JSONB DEFAULT '[]',
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'walkover', 'forfeit', 'no_show')),
  notes TEXT
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  group_id UUID,
  text TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  type TEXT NOT NULL DEFAULT 'user_post' CHECK (type IN ('user_post', 'system_result', 'announcement')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_tournaments_organizer ON tournaments(organizer_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_user ON tournament_participants(user_id);
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_stage ON matches(stage);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_tournament ON posts(tournament_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Tournaments policies
CREATE POLICY "Anyone can view tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tournaments" ON tournaments FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update tournaments" ON tournaments FOR UPDATE USING (auth.uid() = organizer_id);

-- Tournament participants policies
CREATE POLICY "Anyone can view participants" ON tournament_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join tournaments" ON tournament_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave tournaments" ON tournament_participants FOR DELETE USING (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Anyone can view matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Tournament organizers can manage matches" ON matches FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tournaments
    WHERE tournaments.id = matches.tournament_id
    AND tournaments.organizer_id = auth.uid()
  )
);

-- Posts policies
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete posts" ON posts FOR DELETE USING (auth.uid() = author_id);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Anyone can view likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
