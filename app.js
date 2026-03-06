/* ============================================================
   St Mark Lions Cup — Client Application (Firebase Backend)
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

// ── Firebase Configuration ────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDNo18IIcMO1a0RC0rxNw3kR9m9PSBGpYQ",
  authDomain: "st-mark-lion-cup.firebaseapp.com",
  databaseURL: "https://st-mark-lion-cup-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "st-mark-lion-cup",
  storageBucket: "st-mark-lion-cup.firebasestorage.app",
  messagingSenderId: "611606030868",
  appId: "1:611606030868:web:52eb110a4c5aa1b0a69501",
  measurementId: "G-W5D2PLXMV7"
};

const isConfigured = firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE";
let db;
try {
  if (isConfigured) {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  }
} catch (err) {
  console.error("Firebase init failed:", err);
}

// ── In-Memory State Syncing ───────────────────────────────
let globalTeams = [
  { id: 1, name: 'Team 1' }, { id: 2, name: 'Team 2' }, { id: 3, name: 'Team 3' },
  { id: 4, name: 'Team 4' }, { id: 5, name: 'Team 5' }, { id: 6, name: 'Team 6' }
];
let globalMatches = [];
let globalPlayers = [];

if (isConfigured) {
  onValue(ref(db, 'teams'), (snapshot) => {
    if (snapshot.exists()) {
      const val = snapshot.val();
      globalTeams = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
    } else {
      // First run: DB has no teams yet — seed with defaults
      globalTeams = [
        { id: 1, name: 'Team 1' }, { id: 2, name: 'Team 2' }, { id: 3, name: 'Team 3' },
        { id: 4, name: 'Team 4' }, { id: 5, name: 'Team 5' }, { id: 6, name: 'Team 6' }
      ];
      set(ref(db, 'teams'), globalTeams);
    }
    refreshAll();
  });

  onValue(ref(db, 'matches'), (snapshot) => {
    if (snapshot.exists()) {
      const val = snapshot.val();
      globalMatches = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
    } else {
      globalMatches = [];
    }
    refreshAll();
  });

  onValue(ref(db, 'players'), (snapshot) => {
    if (snapshot.exists()) {
      const val = snapshot.val();
      globalPlayers = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
    } else {
      // First run: seed players from roster
      globalPlayers = [
        { id: 1, teamId: 1, name: 'Kyrillos George', number: '1' },
        { id: 2, teamId: 1, name: 'George Michael', number: '2' },
        { id: 3, teamId: 1, name: 'Ghaly Karam', number: '3' },
        { id: 4, teamId: 1, name: 'Nagy Nabil', number: '4' },
        { id: 5, teamId: 1, name: 'Peter Azmy', number: '5' },
        { id: 6, teamId: 1, name: 'Mark Ayman', number: '6' },

        { id: 7, teamId: 2, name: 'Fady Hany', number: '1' },
        { id: 8, teamId: 2, name: 'Henery', number: '2' },
        { id: 9, teamId: 2, name: 'Bassem Saeed', number: '3' },
        { id: 10, teamId: 2, name: 'Morcos Osama', number: '4' },
        { id: 11, teamId: 2, name: 'Abanob Telmiz', number: '5' },
        { id: 12, teamId: 2, name: 'Kevin', number: '6' },

        { id: 13, teamId: 3, name: 'Bishoy Ramez', number: '1' },
        { id: 14, teamId: 3, name: 'Emad Mahrous', number: '2' },
        { id: 15, teamId: 3, name: 'Jan Nabil', number: '3' },
        { id: 16, teamId: 3, name: 'Amir Antonios', number: '4' },
        { id: 17, teamId: 3, name: 'Mark Mekhael', number: '5' },
        { id: 18, teamId: 3, name: 'Pehlo Essam', number: '6' },

        { id: 19, teamId: 4, name: 'Romany Sobhy', number: '1' },
        { id: 20, teamId: 4, name: 'Michael Mourad', number: '2' },
        { id: 21, teamId: 4, name: 'Thomas Mahrous', number: '3' },
        { id: 22, teamId: 4, name: 'Peter Hany', number: '4' },
        { id: 23, teamId: 4, name: 'Fady Mekha', number: '5' },
        { id: 24, teamId: 4, name: 'Philo Emad', number: '6' },

        { id: 25, teamId: 5, name: 'Bola Hany', number: '1' },
        { id: 26, teamId: 5, name: 'Micheal Osama', number: '2' },
        { id: 27, teamId: 5, name: 'Mounir Moheb', number: '3' },
        { id: 28, teamId: 5, name: 'Ramy Adel', number: '4' },
        { id: 29, teamId: 5, name: 'Marvin Wahed', number: '5' },
        { id: 30, teamId: 5, name: 'Antione Adel', number: '6' },

        { id: 31, teamId: 6, name: 'Andrew Ramez', number: '1' },
        { id: 32, teamId: 6, name: 'Giovanni Kamel', number: '2' },
        { id: 33, teamId: 6, name: 'Bishoy Atef', number: '3' },
        { id: 34, teamId: 6, name: 'Mina Raafat', number: '4' },
        { id: 35, teamId: 6, name: 'Fady Wagdy', number: '5' },
        { id: 36, teamId: 6, name: 'Samer Waleed', number: '6' },
        { id: 37, teamId: 6, name: 'Patrick Atef', number: '7' },
      ];
      set(ref(db, 'players'), globalPlayers);
    }
    refreshAll();
  });
} else {
  // If not configured, show error toast after a tiny delay
  setTimeout(() => {
    showToast("Database not configured! Admin must add Firebase keys.", "error");
  }, 1000);
}

// ── Admin Credential Hash (SHA-256) ───────────────────────
const ADMIN_HASH = 'ed5c91a4ca10841816d7732e80661d226034cc02def58cb70cbf9dc3ae3d041d';

async function hashCredentials(username, password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(username + ':' + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
  document.querySelectorAll('.admin-only').forEach(el => el.classList.toggle('hidden', !isAdmin));
  const loginBtn = document.getElementById('admin-login-btn');
  if (loginBtn) loginBtn.classList.toggle('hidden', isAdmin);
  renderMatches();
}

// ── Data Savers (pushes to Firebase) ──────────────────────
function saveTeams() {
  if (isConfigured) set(ref(db, 'teams'), globalTeams);
}
function saveMatches() {
  if (isConfigured) set(ref(db, 'matches'), globalMatches);
}
function savePlayers() {
  if (isConfigured) set(ref(db, 'players'), globalPlayers);
}

// ── Helpers for auto-incrementing IDs ─────────────────────
function getNextMatchId() {
  return globalMatches.reduce((max, m) => Math.max(max, m.id), 0) + 1;
}
function getNextPlayerId() {
  return globalPlayers.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

// ── Compute Standings ─────────────────────────────────────
function computeStandings() {
  const stats = {};
  globalTeams.forEach(t => {
    stats[t.id] = { id: t.id, name: t.name, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
  });
  globalMatches.forEach(m => {
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
    b.pts - a.pts || b.gf - a.gf || Object.values(stats).indexOf(a) - Object.values(stats).indexOf(b)
  );
}

// ── Temp events for the match form ────────────────────────
let pendingEvents = [];

// ── DOM Refs ──────────────────────────────────────────────
const $ = id => document.getElementById(id);
const standingsBody = $('standings-body');
const statsBody = $('stats-body');
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
  [homeTeamSel, awayTeamSel].forEach(sel => {
    sel.innerHTML = '<option value="">Select team…</option>';
    globalTeams.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id; opt.textContent = t.name;
      sel.appendChild(opt);
    });
  });
  playerTeamSelect.innerHTML = '<option value="">Select a team…</option>';
  globalTeams.forEach(t => {
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
      <td class="col-num" style="font-weight:600;">${r.gf}</td>
      <td class="col-pts">${r.pts}</td>`;
    tr.style.animation = `fadeUp .35s ease ${i * 0.04}s both`;
    frag.appendChild(tr);
  });
  standingsBody.appendChild(frag);
}

// ── Render Player Stats ───────────────────────────────────
function renderPlayerStats() {
  if (!statsBody) return;
  const playerStatsMap = {};

  // Initialize stats for every registered player
  globalPlayers.forEach(p => {
    playerStatsMap[p.id] = { id: p.id, name: p.name, teamId: p.teamId, goals: 0, yellow: 0, red: 0 };
  });

  // Tally events
  globalMatches.forEach(m => {
    if (!m.events) return;
    m.events.forEach(ev => {
      // Find player by name/teamId since pendingEvents historically saved strings, not IDs
      let targetPlayer = globalPlayers.find(p => p.name === ev.player && p.teamId === ev.teamId);
      if (targetPlayer) {
        if (ev.type === 'goal') playerStatsMap[targetPlayer.id].goals++;
        if (ev.type === 'yellow') playerStatsMap[targetPlayer.id].yellow++;
        if (ev.type === 'red') playerStatsMap[targetPlayer.id].red++;
      }
    });
  });

  // Convert to array and sort: Highest Goals first, then Name
  const statsArray = Object.values(playerStatsMap).filter(p => p.goals > 0 || p.yellow > 0 || p.red > 0);
  statsArray.sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    return a.name.localeCompare(b.name);
  });

  statsBody.innerHTML = '';
  const frag = document.createDocumentFragment();
  statsArray.forEach((p, i) => {
    const tr = document.createElement('tr');
    const pos = i + 1;
    let posClass = pos === 1 ? 'pos-1' : pos === 2 ? 'pos-2' : pos === 3 ? 'pos-3' : '';
    const teamName = globalTeams.find(t => t.id === p.teamId)?.name || '';

    tr.innerHTML = `
      <td class="col-pos"><span class="pos-badge ${posClass}">${pos}</span></td>
      <td class="team-name">${escHtml(p.name)}</td>
      <td class="team-name" style="font-size: 0.85rem; color: var(--text-dim);">${escHtml(teamName)}</td>
      <td class="col-num" style="font-weight: 700;">${p.goals}</td>
      <td class="col-num">${p.yellow}</td>
      <td class="col-num">${p.red}</td>`;
    tr.style.animation = `fadeUp .35s ease ${i * 0.04}s both`;
    frag.appendChild(tr);
  });
  statsBody.appendChild(frag);
}

// ── Render Matches (with events) ──────────────────────────
function renderMatches() {
  const teamMap = {};
  globalTeams.forEach(t => { teamMap[t.id] = t.name; });
  const sorted = [...globalMatches].sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt) || b.id - a.id);

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

    let eventsHtml = '';
    if (m.events && m.events.length > 0) {
      const homeEvents = m.events.filter(ev => ev.teamId === m.homeTeamId).sort((a, b) => (a.minute || 0) - (b.minute || 0));
      const awayEvents = m.events.filter(ev => ev.teamId === m.awayTeamId).sort((a, b) => (a.minute || 0) - (b.minute || 0));

      const renderEvts = (evts, isHome) => evts.map(ev => {
        const icon = ev.type === 'goal' ? '⚽' : ev.type === 'yellow' ? '🟨' : '🟥';
        const minStr = ev.minute ? `<span class="event-min">${ev.minute}'</span>` : '';
        // If home team, put minute on the right. If away team, put minute on the left.
        if (isHome) return `<span class="event-item">${escHtml(ev.player)} <span class="event-icon">${icon}</span> ${minStr}</span>`;
        return `<span class="event-item">${minStr} <span class="event-icon">${icon}</span> ${escHtml(ev.player)}</span>`;
      }).join('');

      eventsHtml = `
      <div class="match-events">
        <div class="match-events-col home">${renderEvts(homeEvents, true)}</div>
        <div class="match-events-col away">${renderEvts(awayEvents, false)}</div>
      </div>`;
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
    const tName = globalTeams.find(t => t.id === ev.teamId)?.name || '';
    const minStr = ev.minute ? `${ev.minute}'` : '';
    const div = document.createElement('div');
    div.className = 'pending-event';
    div.innerHTML = `<span>${icon} ${escHtml(ev.player)} <span class="event-team-tag">${escHtml(tName)}</span> <span class="event-min">${minStr}</span></span>
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

function updateEventTeamDropdown() {
  eventTeam.innerHTML = '<option value="">Team…</option>';
  const homeId = parseInt(homeTeamSel.value, 10);
  const awayId = parseInt(awayTeamSel.value, 10);

  [homeId, awayId].forEach(id => {
    if (!id) return;
    const team = globalTeams.find(t => t.id === id);
    if (team) {
      const opt = document.createElement('option');
      opt.value = team.id; opt.textContent = team.name;
      eventTeam.appendChild(opt);
    }
  });
  updateEventPlayerDropdown();
}

function updateEventPlayerDropdown() {
  const teamId = parseInt(eventTeam.value, 10);
  eventPlayer.innerHTML = '<option value="">Player…</option>';

  if (!teamId) {
    eventPlayer.disabled = true;
    return;
  }

  eventPlayer.disabled = false;
  const teamPlayers = globalPlayers.filter(p => p.teamId === teamId);

  if (teamPlayers.length === 0) {
    const opt = document.createElement('option');
    opt.value = ""; opt.textContent = "(No players found)";
    eventPlayer.appendChild(opt);
    return;
  }

  teamPlayers.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.name; opt.textContent = `${p.number ? p.number + ' - ' : ''}${p.name}`;
    eventPlayer.appendChild(opt);
  });
}

homeTeamSel.addEventListener('change', updateEventTeamDropdown);
awayTeamSel.addEventListener('change', updateEventTeamDropdown);
eventTeam.addEventListener('change', updateEventPlayerDropdown);

addEventBtn.addEventListener('click', () => {
  const player = eventPlayer.value.trim();
  const teamId = parseInt(eventTeam.value, 10);
  const minute = eventMinute.value ? parseInt(eventMinute.value, 10) : null;
  if (!teamId) return showToast('Select a team for the event.', 'error');
  if (!player) return showToast('Select a player.', 'error');

  pendingEvents.push({ type: eventType.value, teamId, player, minute });
  eventPlayer.value = '';
  eventMinute.value = '';
  renderPendingEvents();
});

// ── Match Form Submission ─────────────────────────────────
matchForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!isAdmin) return showToast('Admin login required.', 'error');
  if (!isConfigured) return showToast('Error: Database not configured.', 'error');

  const homeTeamId = parseInt(homeTeamSel.value, 10);
  const awayTeamId = parseInt(awayTeamSel.value, 10);
  if (!homeTeamSel.value || !awayTeamSel.value) return showToast('Please select both teams.', 'error');
  if (homeTeamId === awayTeamId) return showToast('A team cannot play against itself.', 'error');
  const hg = parseInt(homeGoalsIn.value, 10);
  const ag = parseInt(awayGoalsIn.value, 10);
  if (isNaN(hg) || isNaN(ag) || hg < 0 || ag < 0) return showToast('Goals must be non-negative numbers.', 'error');

  setLoading(true);
  globalMatches.push({
    id: getNextMatchId(), homeTeamId, awayTeamId, homeGoals: hg, awayGoals: ag,
    events: [...pendingEvents],
    playedAt: new Date().toISOString()
  });
  saveMatches();

  const homeName = homeTeamSel.options[homeTeamSel.selectedIndex].text;
  const awayName = awayTeamSel.options[awayTeamSel.selectedIndex].text;
  showToast(`${homeName} ${hg} – ${ag} ${awayName} recorded!`, 'success');

  pendingEvents = [];
  matchForm.reset();
  updateEventTeamDropdown();
  renderPendingEvents();
  refreshAll(); // will be natively refreshed by onValue if online, but good fallback
  setLoading(false);
});

// ── Delete Match ──────────────────────────────────────────
function deleteMatch(id) {
  if (!isAdmin) return;
  if (!isConfigured) return;
  if (!confirm('Delete this match result? Standings will be recalculated.')) return;
  globalMatches = globalMatches.filter(m => m.id !== id);
  saveMatches();
  showToast('Match deleted.', 'success');
}

// ── Teams Management ──────────────────────────────────────
function renderTeamsManagement() {
  teamsList.innerHTML = '';
  globalTeams.forEach((t, i) => {
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
  const team = globalTeams.find(t => t.id === id);
  if (!team) return;
  if (globalTeams.find(t => t.id !== id && t.name.toLowerCase() === newName.toLowerCase()))
    return showToast('Another team already has that name.', 'error');
  team.name = newName;
  saveTeams();
  showToast(`Team renamed to "${newName}"`, 'success');
}

// ── Player Management (admin) ─────────────────────────────
playerTeamSelect.addEventListener('change', () => renderPlayersList());

function renderPlayersList() {
  const teamId = parseInt(playerTeamSelect.value, 10);
  if (!teamId) { playersList.innerHTML = ''; addPlayerRow.classList.add('hidden'); return; }
  addPlayerRow.classList.remove('hidden');
  const players = globalPlayers.filter(p => p.teamId === teamId);
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
      globalPlayers = globalPlayers.filter(p => p.id !== parseInt(btn.dataset.id, 10));
      savePlayers();
      showToast('Player removed.', 'success');
    });
  });
}

addPlayerBtn.addEventListener('click', () => {
  if (!isAdmin) return;
  if (!isConfigured) return showToast('Error: Database not configured.', 'error');
  const name = newPlayerName.value.trim();
  const number = newPlayerNumber.value.trim();
  const teamId = parseInt(playerTeamSelect.value, 10);
  if (!name) return showToast('Enter a player name.', 'error');
  if (!teamId) return showToast('Select a team first.', 'error');

  globalPlayers.push({ id: getNextPlayerId(), teamId, name, number });
  savePlayers();
  newPlayerName.value = '';
  newPlayerNumber.value = '';
  showToast(`${name} added!`, 'success');
});

// ── Rosters (public view) ─────────────────────────────────
function renderRosters() {
  rostersContainer.innerHTML = '';
  globalTeams.forEach((t, ti) => {
    const players = globalPlayers.filter(p => p.teamId === t.id);
    const card = document.createElement('div');
    card.className = 'roster-card card';
    card.style.animation = `fadeUp .35s ease ${ti * 0.05}s both`;
    let playersHtml = players.length === 0
      ? '<p class="empty-state" style="padding:1rem;font-size:0.85rem;">No players registered yet.</p>'
      : Object.values(players).map(p => `<tr><td class="roster-num">${escHtml(p.number || '-')}</td><td class="roster-name">${escHtml(p.name)}</td></tr>`).join('');

    if (players.length > 0) playersHtml = `<table class="roster-table"><thead><tr><th>#</th><th>Player</th></tr></thead><tbody>${playersHtml}</tbody></table>`;

    card.innerHTML = `<div class="roster-header"><h3 class="roster-team-name">${escHtml(t.name)}</h3><span class="roster-count">${players.length} player${players.length !== 1 ? 's' : ''}</span></div>${playersHtml}`;
    rostersContainer.appendChild(card);
  });
}

// ── Refresh All ───────────────────────────────────────────
function refreshAll() {
  renderTeamDropdowns();
  renderStandings();
  renderPlayerStats();
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
function init() { checkAdminSession(); refreshAll(); }
init();
