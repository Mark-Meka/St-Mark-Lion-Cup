/* ============================================================
   St Mark Lions Cup — Client Application (Static / localStorage)
   ============================================================ */

// ── Admin Credential Hash (SHA-256 of "username:password") ──
// The actual username and password are NOT stored here.
const ADMIN_HASH = 'ed5c91a4ca10841816d7732e80661d226034cc02def58cb70cbf9dc3ae3d041d';

async function hashCredentials(username, password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(username + ':' + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Storage Keys ──────────────────────────────────────────
const STORAGE_KEYS = {
  teams: 'stmark_teams',
  matches: 'stmark_matches',
  players: 'stmark_players',
  nextMatchId: 'stmark_nextMatchId',
  nextPlayerId: 'stmark_nextPlayerId'
};

// ── Default Data ──────────────────────────────────────────
const DEFAULT_TEAMS = [
  { id: 1, name: 'Team 1' },
  { id: 2, name: 'Team 2' },
  { id: 3, name: 'Team 3' },
  { id: 4, name: 'Team 4' },
  { id: 5, name: 'Team 5' },
  { id: 6, name: 'Team 6' }
];

// ── Auth State ────────────────────────────────────────────
let isAdmin = false;

function checkAdminSession() {
  isAdmin = sessionStorage.getItem('stmark_admin') === 'true';
  updateAdminUI();
}

async function loginAdmin(username, password) {
  const hash = await hashCredentials(username, password);
  if (hash === ADMIN_HASH) {
    isAdmin = true;
    sessionStorage.setItem('stmark_admin', 'true');
    updateAdminUI();
    return true;
  }
  return false;
}

function logoutAdmin() {
  isAdmin = false;
  sessionStorage.removeItem('stmark_admin');
  updateAdminUI();
}

function updateAdminUI() {
  document.querySelectorAll('.admin-only').forEach(el => {
    el.classList.toggle('hidden', !isAdmin);
  });
  const loginBtn = document.getElementById('admin-login-btn');
  if (loginBtn) loginBtn.classList.toggle('hidden', isAdmin);
  renderMatches();
}

// ── Data Access ───────────────────────────────────────────
function getTeams() {
  const raw = localStorage.getItem(STORAGE_KEYS.teams);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(DEFAULT_TEAMS));
    return [...DEFAULT_TEAMS];
  }
  return JSON.parse(raw);
}
function saveTeams(teams) { localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(teams)); }

function getMatches() {
  const raw = localStorage.getItem(STORAGE_KEYS.matches);
  return raw ? JSON.parse(raw) : [];
}
function saveMatches(matches) { localStorage.setItem(STORAGE_KEYS.matches, JSON.stringify(matches)); }

function getPlayers() {
  const raw = localStorage.getItem(STORAGE_KEYS.players);
  return raw ? JSON.parse(raw) : [];
}
function savePlayers(players) { localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(players)); }

function getNextId(key) {
  const raw = localStorage.getItem(key);
  return raw ? parseInt(raw, 10) : 1;
}
function setNextId(key, id) { localStorage.setItem(key, id.toString()); }

// ── Compute Standings ─────────────────────────────────────
function computeStandings() {
  const teams = getTeams();
  const matches = getMatches();
  const stats = {};
  teams.forEach(t => {
    stats[t.id] = { id: t.id, name: t.name, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
  });
  matches.forEach(m => {
    const home = stats[m.homeTeamId];
    const away = stats[m.awayTeamId];
    if (!home || !away) return;
    home.mp++; away.mp++;
    home.gf += m.homeGoals; home.ga += m.awayGoals;
    away.gf += m.awayGoals; away.ga += m.homeGoals;
    if (m.homeGoals > m.awayGoals) { home.w++; away.l++; }
    else if (m.homeGoals < m.awayGoals) { away.w++; home.l++; }
    else { home.d++; away.d++; }
  });
  Object.values(stats).forEach(s => { s.gd = s.gf - s.ga; s.pts = s.w * 3 + s.d; });
  return Object.values(stats).sort((a, b) =>
    b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name)
  );
}

// ── Temp events for the match form ────────────────────────
let pendingEvents = [];

// ── DOM Refs ──────────────────────────────────────────────
const $ = id => document.getElementById(id);
const standingsBody = $('standings-body');
const matchesList = $('matches-list');
const noMatches = $('no-matches');
const matchForm = $('match-form');
const homeTeamSel = $('home-team');
const awayTeamSel = $('away-team');
const homeGoalsIn = $('home-goals');
const awayGoalsIn = $('away-goals');
const submitBtn = $('submit-btn');
const toastContainer = $('toast-container');
const teamsList = $('teams-list');
const loginModal = $('login-modal');
const loginForm = $('login-form');
const loginError = $('login-error');
const loginBtn = $('admin-login-btn');
const logoutBtn = $('admin-logout-btn');
const loginCancel = $('login-cancel');
const eventsList = $('events-list');
const eventType = $('event-type');
const eventTeam = $('event-team');
const eventPlayer = $('event-player');
const eventMinute = $('event-minute');
const addEventBtn = $('add-event-btn');
const rostersContainer = $('rosters-container');
const playerTeamSelect = $('player-team-select');
const playersList = $('players-list');
const addPlayerRow = $('add-player-row');
const newPlayerName = $('new-player-name');
const newPlayerNumber = $('new-player-number');
const addPlayerBtn = $('add-player-btn');

// ── Navigation ────────────────────────────────────────────
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

// ── Login / Logout ────────────────────────────────────────
loginBtn.addEventListener('click', () => {
  loginModal.classList.remove('hidden');
  loginError.classList.add('hidden');
  loginForm.reset();
  $('login-username').focus();
});
loginCancel.addEventListener('click', () => loginModal.classList.add('hidden'));
loginModal.addEventListener('click', e => { if (e.target === loginModal) loginModal.classList.add('hidden'); });

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const u = $('login-username').value.trim();
  const p = $('login-password').value;
  if (await loginAdmin(u, p)) {
    loginModal.classList.add('hidden');
    showToast('Welcome, Admin!', 'success');
    refreshAll();
  } else {
    loginError.classList.remove('hidden');
  }
});

logoutBtn.addEventListener('click', () => { logoutAdmin(); showToast('Logged out.', 'success'); });

// ── Render Team Dropdowns ─────────────────────────────────
function renderTeamDropdowns() {
  const teams = getTeams();
  [homeTeamSel, awayTeamSel].forEach(sel => {
    sel.innerHTML = '<option value="">Select team…</option>';
    teams.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id; opt.textContent = t.name;
      sel.appendChild(opt);
    });
  });
  // Event team dropdown
  eventTeam.innerHTML = '<option value="">Team…</option>';
  teams.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id; opt.textContent = t.name;
    eventTeam.appendChild(opt);
  });
  // Player mgmt dropdown
  playerTeamSelect.innerHTML = '<option value="">Select a team…</option>';
  teams.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id; opt.textContent = t.name;
    playerTeamSelect.appendChild(opt);
  });
}

// ── Render Standings ──────────────────────────────────────
function renderStandings() {
  const rows = computeStandings();
  standingsBody.innerHTML = '';
  const frag = document.createDocumentFragment();
  rows.forEach((r, i) => {
    const tr = document.createElement('tr');
    const pos = i + 1;
    let posClass = pos === 1 ? 'pos-1' : pos === 2 ? 'pos-2' : pos === 3 ? 'pos-3' : '';
    let gdClass = r.gd > 0 ? 'gd-positive' : r.gd < 0 ? 'gd-negative' : '';
    const gdStr = r.gd > 0 ? `+${r.gd}` : `${r.gd}`;
    tr.innerHTML = `
      <td class="col-pos"><span class="pos-badge ${posClass}">${pos}</span></td>
      <td class="team-name">${escHtml(r.name)}</td>
      <td class="col-num">${r.mp}</td><td class="col-num">${r.w}</td>
      <td class="col-num">${r.d}</td><td class="col-num">${r.l}</td>
      <td class="col-num">${r.gf}</td><td class="col-num">${r.ga}</td>
      <td class="col-num ${gdClass}">${gdStr}</td><td class="col-pts">${r.pts}</td>`;
    tr.style.animation = `fadeUp .35s ease ${i * 0.04}s both`;
    frag.appendChild(tr);
  });
  standingsBody.appendChild(frag);
}

// ── Render Matches (with events) ──────────────────────────
function renderMatches() {
  const matches = getMatches();
  const teams = getTeams();
  const teamMap = {};
  teams.forEach(t => { teamMap[t.id] = t.name; });

  const sorted = [...matches].sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt) || b.id - a.id);

  if (sorted.length === 0) {
    matchesList.innerHTML = '';
    noMatches.classList.remove('hidden');
    return;
  }
  noMatches.classList.add('hidden');
  matchesList.innerHTML = '';
  const frag = document.createDocumentFragment();

  sorted.forEach((m, i) => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.style.animationDelay = `${i * 0.05}s`;
    const homeName = teamMap[m.homeTeamId] || 'Unknown';
    const awayName = teamMap[m.awayTeamId] || 'Unknown';
    const dateStr = formatDate(m.playedAt);
    const deleteBtn = isAdmin ? `<button class="match-delete" data-id="${m.id}" title="Delete match">✕</button>` : '';

    // Build events HTML
    let eventsHtml = '';
    if (m.events && m.events.length > 0) {
      const eventItems = m.events
        .sort((a, b) => (a.minute || 0) - (b.minute || 0))
        .map(ev => {
          const icon = ev.type === 'goal' ? '⚽' : ev.type === 'yellow' ? '🟨' : '🟥';
          const tName = teamMap[ev.teamId] || '';
          const minStr = ev.minute ? `${ev.minute}'` : '';
          return `<span class="event-item"><span class="event-icon">${icon}</span> ${escHtml(ev.player)} <span class="event-team-tag">${escHtml(tName)}</span> <span class="event-min">${minStr}</span></span>`;
        }).join('');
      eventsHtml = `<div class="match-events">${eventItems}</div>`;
    }

    card.innerHTML = `
      <div class="match-header-row">
        <div class="match-teams">
          <span class="match-team-name home">${escHtml(homeName)}</span>
          <div class="match-score">
            <span class="score-num">${m.homeGoals}</span>
            <span class="score-sep">–</span>
            <span class="score-num">${m.awayGoals}</span>
          </div>
          <span class="match-team-name away">${escHtml(awayName)}</span>
        </div>
        <span class="match-meta">${dateStr}</span>
        ${deleteBtn}
      </div>
      ${eventsHtml}`;
    frag.appendChild(card);
  });
  matchesList.appendChild(frag);

  if (isAdmin) {
    matchesList.querySelectorAll('.match-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteMatch(parseInt(btn.dataset.id, 10)));
    });
  }
}

// ── Match Events (form) ───────────────────────────────────
function renderPendingEvents() {
  eventsList.innerHTML = '';
  if (pendingEvents.length === 0) return;
  pendingEvents.forEach((ev, i) => {
    const icon = ev.type === 'goal' ? '⚽' : ev.type === 'yellow' ? '🟨' : '🟥';
    const teams = getTeams();
    const tName = teams.find(t => t.id === ev.teamId)?.name || '';
    const minStr = ev.minute ? `${ev.minute}'` : '';
    const div = document.createElement('div');
    div.className = 'pending-event';
    div.innerHTML = `<span>${icon} ${escHtml(ev.player)} (${escHtml(tName)}) ${minStr}</span>
      <button type="button" class="event-remove" data-idx="${i}" title="Remove">✕</button>`;
    eventsList.appendChild(div);
  });
  eventsList.querySelectorAll('.event-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingEvents.splice(parseInt(btn.dataset.idx), 1);
      renderPendingEvents();
    });
  });
}

addEventBtn.addEventListener('click', () => {
  const player = eventPlayer.value.trim();
  const teamId = parseInt(eventTeam.value, 10);
  const minute = eventMinute.value ? parseInt(eventMinute.value, 10) : null;
  if (!player) return showToast('Enter a player name.', 'error');
  if (!teamId) return showToast('Select a team for the event.', 'error');
  pendingEvents.push({ type: eventType.value, teamId, player, minute });
  eventPlayer.value = '';
  eventMinute.value = '';
  renderPendingEvents();
});

// ── Match Form Submission ─────────────────────────────────
matchForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!isAdmin) return showToast('Admin login required.', 'error');

  const homeTeamId = parseInt(homeTeamSel.value, 10);
  const awayTeamId = parseInt(awayTeamSel.value, 10);
  if (!homeTeamSel.value || !awayTeamSel.value) return showToast('Please select both teams.', 'error');
  if (homeTeamId === awayTeamId) return showToast('A team cannot play against itself.', 'error');
  const hg = parseInt(homeGoalsIn.value, 10);
  const ag = parseInt(awayGoalsIn.value, 10);
  if (isNaN(hg) || isNaN(ag) || hg < 0 || ag < 0) return showToast('Goals must be non-negative numbers.', 'error');

  setLoading(true);
  const matches = getMatches();
  const newId = getNextId(STORAGE_KEYS.nextMatchId);
  matches.push({
    id: newId, homeTeamId, awayTeamId, homeGoals: hg, awayGoals: ag,
    events: [...pendingEvents],
    playedAt: new Date().toISOString()
  });
  saveMatches(matches);
  setNextId(STORAGE_KEYS.nextMatchId, newId + 1);

  const homeName = homeTeamSel.options[homeTeamSel.selectedIndex].text;
  const awayName = awayTeamSel.options[awayTeamSel.selectedIndex].text;
  showToast(`${homeName} ${hg} – ${ag} ${awayName} recorded!`, 'success');

  pendingEvents = [];
  matchForm.reset();
  renderPendingEvents();
  refreshAll();
  setLoading(false);
});

// ── Delete Match ──────────────────────────────────────────
function deleteMatch(id) {
  if (!isAdmin) return;
  if (!confirm('Delete this match result? Standings will be recalculated.')) return;
  saveMatches(getMatches().filter(m => m.id !== id));
  showToast('Match deleted.', 'success');
  refreshAll();
}

// ── Teams Management ──────────────────────────────────────
function renderTeamsManagement() {
  const teams = getTeams();
  teamsList.innerHTML = '';
  teams.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'team-row';
    row.style.animation = `fadeUp .35s ease ${i * 0.04}s both`;
    row.innerHTML = `
      <span class="team-number">${i + 1}</span>
      <input type="text" class="team-name-input" value="${escAttr(t.name)}" data-id="${t.id}" maxlength="30" />
      <button class="team-save-btn" data-id="${t.id}" title="Save name">Save</button>`;
    teamsList.appendChild(row);
  });
  teamsList.querySelectorAll('.team-save-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const input = teamsList.querySelector(`.team-name-input[data-id="${id}"]`);
      renameTeam(id, input.value.trim());
    });
  });
  teamsList.querySelectorAll('.team-name-input').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); renameTeam(parseInt(input.dataset.id, 10), input.value.trim()); }
    });
  });
}

function renameTeam(id, newName) {
  if (!isAdmin || !newName) return showToast('Team name cannot be empty.', 'error');
  const teams = getTeams();
  const team = teams.find(t => t.id === id);
  if (!team) return;
  if (teams.find(t => t.id !== id && t.name.toLowerCase() === newName.toLowerCase()))
    return showToast('Another team already has that name.', 'error');
  team.name = newName;
  saveTeams(teams);
  showToast(`Team renamed to "${newName}"`, 'success');
  refreshAll();
}

// ── Player Management (admin) ─────────────────────────────
playerTeamSelect.addEventListener('change', () => renderPlayersList());

function renderPlayersList() {
  const teamId = parseInt(playerTeamSelect.value, 10);
  if (!teamId) { playersList.innerHTML = ''; addPlayerRow.classList.add('hidden'); return; }
  addPlayerRow.classList.remove('hidden');
  const players = getPlayers().filter(p => p.teamId === teamId);
  playersList.innerHTML = '';
  if (players.length === 0) {
    playersList.innerHTML = '<p class="empty-state" style="padding:1rem;">No players added yet.</p>';
    return;
  }
  players.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'player-row';
    row.style.animation = `fadeUp .25s ease ${i * 0.03}s both`;
    row.innerHTML = `
      <span class="player-num">${escHtml(p.number || '-')}</span>
      <span class="player-name-text">${escHtml(p.name)}</span>
      <button class="player-delete" data-id="${p.id}" title="Remove player">✕</button>`;
    playersList.appendChild(row);
  });
  playersList.querySelectorAll('.player-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Remove this player?')) return;
      const id = parseInt(btn.dataset.id, 10);
      savePlayers(getPlayers().filter(p => p.id !== id));
      showToast('Player removed.', 'success');
      renderPlayersList();
      renderRosters();
    });
  });
}

addPlayerBtn.addEventListener('click', () => {
  if (!isAdmin) return;
  const name = newPlayerName.value.trim();
  const number = newPlayerNumber.value.trim();
  const teamId = parseInt(playerTeamSelect.value, 10);
  if (!name) return showToast('Enter a player name.', 'error');
  if (!teamId) return showToast('Select a team first.', 'error');

  const players = getPlayers();
  const newId = getNextId(STORAGE_KEYS.nextPlayerId);
  players.push({ id: newId, teamId, name, number });
  savePlayers(players);
  setNextId(STORAGE_KEYS.nextPlayerId, newId + 1);
  newPlayerName.value = '';
  newPlayerNumber.value = '';
  showToast(`${name} added!`, 'success');
  renderPlayersList();
  renderRosters();
});

// ── Rosters (public view) ─────────────────────────────────
function renderRosters() {
  const teams = getTeams();
  const allPlayers = getPlayers();
  rostersContainer.innerHTML = '';

  teams.forEach((t, ti) => {
    const players = allPlayers.filter(p => p.teamId === t.id);
    const card = document.createElement('div');
    card.className = 'roster-card card';
    card.style.animation = `fadeUp .35s ease ${ti * 0.05}s both`;

    let playersHtml;
    if (players.length === 0) {
      playersHtml = '<p class="empty-state" style="padding:1rem;font-size:0.85rem;">No players registered yet.</p>';
    } else {
      const rows = players.map(p =>
        `<tr><td class="roster-num">${escHtml(p.number || '-')}</td><td class="roster-name">${escHtml(p.name)}</td></tr>`
      ).join('');
      playersHtml = `<table class="roster-table"><thead><tr><th>#</th><th>Player</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    card.innerHTML = `<div class="roster-header"><h3 class="roster-team-name">${escHtml(t.name)}</h3><span class="roster-count">${players.length} player${players.length !== 1 ? 's' : ''}</span></div>${playersHtml}`;
    rostersContainer.appendChild(card);
  });
}

// ── Refresh All ───────────────────────────────────────────
function refreshAll() {
  renderTeamDropdowns();
  renderStandings();
  renderMatches();
  renderTeamsManagement();
  renderRosters();
  renderPlayersList();
}

// ── Helpers ───────────────────────────────────────────────
function setLoading(s) {
  submitBtn.disabled = s;
  submitBtn.querySelector('.btn-text').classList.toggle('hidden', s);
  submitBtn.querySelector('.btn-loader').classList.toggle('hidden', !s);
}
function showToast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}
function escHtml(str) { const d = document.createElement('div'); d.appendChild(document.createTextNode(str)); return d.innerHTML; }
function escAttr(str) { return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

// ── Init ──────────────────────────────────────────────────
function init() { getTeams(); checkAdminSession(); refreshAll(); }
init();
