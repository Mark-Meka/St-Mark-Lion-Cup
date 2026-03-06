const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Database Setup ─────────────────────────────────────────
const db = new Database(path.join(__dirname, 'league.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS matches (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    home_team_id INTEGER NOT NULL REFERENCES teams(id),
    away_team_id INTEGER NOT NULL REFERENCES teams(id),
    home_goals   INTEGER NOT NULL CHECK(home_goals >= 0),
    away_goals   INTEGER NOT NULL CHECK(away_goals >= 0),
    played_at    TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK(home_team_id != away_team_id)
  );
`);

// Seed teams if empty
const teamCount = db.prepare('SELECT COUNT(*) AS cnt FROM teams').get().cnt;
if (teamCount === 0) {
  const insert = db.prepare('INSERT INTO teams (name) VALUES (?)');
  const seedTeams = [
    'St Mark Lions',
    'Golden Eagles',
    'Blue Thunder',
    'Red Warriors',
    'Silver Wolves',
    'Green Vipers'
  ];
  const seedMany = db.transaction((teams) => {
    for (const t of teams) insert.run(t);
  });
  seedMany(seedTeams);
  console.log('✓ Seeded 6 teams');
}

// ── Prepared Statements ────────────────────────────────────
const stmts = {
  allTeams: db.prepare('SELECT id, name FROM teams ORDER BY name'),

  addMatch: db.prepare(`
    INSERT INTO matches (home_team_id, away_team_id, home_goals, away_goals)
    VALUES (@homeTeamId, @awayTeamId, @homeGoals, @awayGoals)
  `),

  allMatches: db.prepare(`
    SELECT m.id, m.home_goals, m.away_goals, m.played_at,
           ht.name AS home_team, at2.name AS away_team
    FROM matches m
    JOIN teams ht  ON ht.id  = m.home_team_id
    JOIN teams at2 ON at2.id = m.away_team_id
    ORDER BY m.played_at DESC, m.id DESC
  `),

  deleteMatch: db.prepare('DELETE FROM matches WHERE id = ?'),

  standings: db.prepare(`
    SELECT
      t.id,
      t.name,
      COALESCE(s.mp, 0) AS mp,
      COALESCE(s.w, 0)  AS w,
      COALESCE(s.d, 0)  AS d,
      COALESCE(s.l, 0)  AS l,
      COALESCE(s.gf, 0) AS gf,
      COALESCE(s.ga, 0) AS ga,
      COALESCE(s.gf, 0) - COALESCE(s.ga, 0) AS gd,
      COALESCE(s.w, 0) * 3 + COALESCE(s.d, 0) AS pts
    FROM teams t
    LEFT JOIN (
      SELECT
        team_id,
        COUNT(*)                                  AS mp,
        SUM(CASE WHEN scored > conceded THEN 1 ELSE 0 END) AS w,
        SUM(CASE WHEN scored = conceded THEN 1 ELSE 0 END) AS d,
        SUM(CASE WHEN scored < conceded THEN 1 ELSE 0 END) AS l,
        SUM(scored)   AS gf,
        SUM(conceded) AS ga
      FROM (
        SELECT home_team_id AS team_id, home_goals AS scored, away_goals AS conceded FROM matches
        UNION ALL
        SELECT away_team_id AS team_id, away_goals AS scored, home_goals AS conceded FROM matches
      )
      GROUP BY team_id
    ) s ON s.team_id = t.id
    ORDER BY pts DESC, gd DESC, gf DESC, t.name ASC
  `)
};

// ── API Routes ─────────────────────────────────────────────

// Get all teams
app.get('/api/teams', (_req, res) => {
  res.json(stmts.allTeams.all());
});

// Get standings
app.get('/api/standings', (_req, res) => {
  res.json(stmts.standings.all());
});

// Get all matches
app.get('/api/matches', (_req, res) => {
  res.json(stmts.allMatches.all());
});

// Add a match
app.post('/api/matches', (req, res) => {
  const { homeTeamId, awayTeamId, homeGoals, awayGoals } = req.body;

  // Validation
  if (!homeTeamId || !awayTeamId || homeGoals == null || awayGoals == null) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (homeTeamId === awayTeamId) {
    return res.status(400).json({ error: 'A team cannot play against itself.' });
  }
  const hg = parseInt(homeGoals, 10);
  const ag = parseInt(awayGoals, 10);
  if (isNaN(hg) || isNaN(ag) || hg < 0 || ag < 0) {
    return res.status(400).json({ error: 'Goals must be non-negative integers.' });
  }

  try {
    const info = stmts.addMatch.run({
      homeTeamId: parseInt(homeTeamId, 10),
      awayTeamId: parseInt(awayTeamId, 10),
      homeGoals: hg,
      awayGoals: ag
    });
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a match
app.delete('/api/matches/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const info = stmts.deleteMatch.run(id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Match not found.' });
  }
  res.json({ success: true });
});

// ── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  🦁  St Mark Lions Cup is running at http://localhost:${PORT}\n`);
});
