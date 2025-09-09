-- 1. Tabela kategorii
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabela filmów
CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  thumb VARCHAR(500) NOT NULL,
  iframe VARCHAR(500) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  year INTEGER,
  duration INTEGER,
  points_required INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Tabela profili użytkowników
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username VARCHAR(50),
  points INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Tabela ocen
CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 1 AND score <= 10),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(movie_id, user_id)
);

-- 5. Tabela komentarzy
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Lista "chcę obejrzeć"
CREATE TABLE wishlist (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- 7. Historia oglądania
CREATE TABLE watch_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
  watched_at TIMESTAMP DEFAULT NOW()
);

-- 8. Odblokowane filmy
CREATE TABLE unlocks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- 9. Log punktów
CREATE TABLE points_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  change INTEGER NOT NULL,
  reason VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Kody premium/punkty
CREATE TABLE codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'points' lub 'premium'
  amount INTEGER,
  days INTEGER,
  limit_left INTEGER DEFAULT 1,
  expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger do automatycznego tworzenia profilu
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, points, is_admin)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'Użytkownik'), 0, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- Przykładowe dane
INSERT INTO categories (name) VALUES 
('Akcja'), ('Komedia'), ('Dramat'), ('Horror'), ('Sci-Fi');

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_log ENABLE ROW LEVEL SECURITY;

-- Polityki RLS
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can manage own ratings" ON ratings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can manage own comments" ON comments FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wishlist" ON wishlist FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own watch history" ON watch_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own unlocks" ON unlocks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own points log" ON points_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert points log" ON points_log FOR INSERT WITH CHECK (true);
