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
const STORAGE_KEYS = { teams: 'stmark_teams', matches: 'stmark_matches', nextMatchId: 'stmark_nextMatchId' };

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
  const adminElements = document.querySelectorAll('.admin-only');
  const loginBtn = document.getElementById('admin-login-btn');

  adminElements.forEach(el => {
    if (isAdmin) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  if (loginBtn) {
    if (isAdmin) {
      loginBtn.classList.add('hidden');
    } else {
      loginBtn.classList.remove('hidden');
    }
  }

  // Re-render matches to show/hide delete buttons
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

function saveTeams(teams) {
  localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(teams));
}

function getMatches() {
  const raw = localStorage.getItem(STORAGE_KEYS.matches);
  return raw ? JSON.parse(raw) : [];
}

function saveMatches(matches) {
  localStorage.setItem(STORAGE_KEYS.matches, JSON.stringify(matches));
}

function getNextMatchId() {
  const raw = localStorage.getItem(STORAGE_KEYS.nextMatchId);
  return raw ? parseInt(raw, 10) : 1;
}

function setNextMatchId(id) {
  localStorage.setItem(STORAGE_KEYS.nextMatchId, id.toString());
}

// ── Compute Standings (client-side) ───────────────────────
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

    if (m.homeGoals > m.awayGoals) {
      home.w++; away.l++;
    } else if (m.homeGoals < m.awayGoals) {
      away.w++; home.l++;
    } else {
      home.d++; away.d++;
    }
  });

  Object.values(stats).forEach(s => {
    s.gd = s.gf - s.ga;
    s.pts = s.w * 3 + s.d;
  });

  return Object.values(stats).sort((a, b) =>
    b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name)
  );
}

// ── DOM Refs ──────────────────────────────────────────────
const standingsBody = document.getElementById('standings-body');
const matchesList = document.getElementById('matches-list');
const noMatches = document.getElementById('no-matches');
const matchForm = document.getElementById('match-form');
const homeTeamSel = document.getElementById('home-team');
const awayTeamSel = document.getElementById('away-team');
const homeGoalsIn = document.getElementById('home-goals');
const awayGoalsIn = document.getElementById('away-goals');
const submitBtn = document.getElementById('submit-btn');
const toastContainer = document.getElementById('toast-container');
const teamsList = document.getElementById('teams-list');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('admin-login-btn');
const logoutBtn = document.getElementById('admin-logout-btn');
const loginCancel = document.getElementById('login-cancel');

// ── Navigation ────────────────────────────────────────────
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

// ── Login / Logout Events ─────────────────────────────────
loginBtn.addEventListener('click', () => {
  loginModal.classList.remove('hidden');
  loginError.classList.add('hidden');
  loginForm.reset();
  document.getElementById('login-username').focus();
});

loginCancel.addEventListener('click', () => {
  loginModal.classList.add('hidden');
});

loginModal.addEventListener('click', (e) => {
  if (e.target === loginModal) loginModal.classList.add('hidden');
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  if (await loginAdmin(username, password)) {
    loginModal.classList.add('hidden');
    showToast('Welcome, Admin!', 'success');
    refreshAll();
  } else {
    loginError.classList.remove('hidden');
  }
});

logoutBtn.addEventListener('click', () => {
  logoutAdmin();
  showToast('Logged out.', 'success');
});

// ── Render Teams Dropdown ─────────────────────────────────
function renderTeamDropdowns() {
  const teams = getTeams();
  [homeTeamSel, awayTeamSel].forEach(sel => {
    sel.innerHTML = '';
    const def = document.createElement('option');
    def.value = ''; def.textContent = 'Select team…';
    sel.appendChild(def);
    teams.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id; opt.textContent = t.name;
      sel.appendChild(opt);
    });
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
    let posClass = '';
    if (pos === 1) posClass = 'pos-1';
    else if (pos === 2) posClass = 'pos-2';
    else if (pos === 3) posClass = 'pos-3';

    let gdClass = '';
    if (r.gd > 0) gdClass = 'gd-positive';
    else if (r.gd < 0) gdClass = 'gd-negative';
    const gdStr = r.gd > 0 ? `+${r.gd}` : `${r.gd}`;

    tr.innerHTML = `
      <td class="col-pos"><span class="pos-badge ${posClass}">${pos}</span></td>
      <td class="team-name">${escHtml(r.name)}</td>
      <td class="col-num">${r.mp}</td>
      <td class="col-num">${r.w}</td>
      <td class="col-num">${r.d}</td>
      <td class="col-num">${r.l}</td>
      <td class="col-num">${r.gf}</td>
      <td class="col-num">${r.ga}</td>
      <td class="col-num ${gdClass}">${gdStr}</td>
      <td class="col-pts">${r.pts}</td>
    `;
    tr.style.animation = `fadeUp .35s ease ${i * 0.04}s both`;
    frag.appendChild(tr);
  });

  standingsBody.appendChild(frag);
}

// ── Render Matches ────────────────────────────────────────
function renderMatches() {
  const matches = getMatches();
  const teams = getTeams();
  const teamMap = {};
  teams.forEach(t => { teamMap[t.id] = t.name; });

  const sorted = [...matches].sort((a, b) =>
    new Date(b.playedAt) - new Date(a.playedAt) || b.id - a.id
  );

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

    const deleteBtn = isAdmin
      ? `<button class="match-delete" data-id="${m.id}" title="Delete match">✕</button>`
      : '';

    card.innerHTML = `
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
    `;
    frag.appendChild(card);
  });

  matchesList.appendChild(frag);

  if (isAdmin) {
    matchesList.querySelectorAll('.match-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteMatch(parseInt(btn.dataset.id, 10)));
    });
  }
}

// ── Render Teams Management ───────────────────────────────
function renderTeamsManagement() {
  const teams = getTeams();
  teamsList.innerHTML = '';
  const frag = document.createDocumentFragment();

  teams.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'team-row';
    row.style.animation = `fadeUp .35s ease ${i * 0.04}s both`;

    row.innerHTML = `
      <span class="team-number">${i + 1}</span>
      <input type="text" class="team-name-input" value="${escAttr(t.name)}" data-id="${t.id}" maxlength="30" />
      <button class="team-save-btn" data-id="${t.id}" title="Save name">Save</button>
    `;
    frag.appendChild(row);
  });

  teamsList.appendChild(frag);

  teamsList.querySelectorAll('.team-save-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const input = teamsList.querySelector(`.team-name-input[data-id="${id}"]`);
      renameTeam(id, input.value.trim());
    });
  });

  teamsList.querySelectorAll('.team-name-input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const id = parseInt(input.dataset.id, 10);
        renameTeam(id, input.value.trim());
      }
    });
  });
}

// ── Match Form Submission ─────────────────────────────────
matchForm.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!isAdmin) return showToast('Admin login required.', 'error');

  const homeTeamId = parseInt(homeTeamSel.value, 10);
  const awayTeamId = parseInt(awayTeamSel.value, 10);
  const homeGoals = homeGoalsIn.value;
  const awayGoals = awayGoalsIn.value;

  if (!homeTeamSel.value || !awayTeamSel.value) {
    return showToast('Please select both teams.', 'error');
  }
  if (homeTeamId === awayTeamId) {
    return showToast('A team cannot play against itself.', 'error');
  }
  if (homeGoals === '' || awayGoals === '') {
    return showToast('Please enter goals for both teams.', 'error');
  }

  const hg = parseInt(homeGoals, 10);
  const ag = parseInt(awayGoals, 10);
  if (isNaN(hg) || isNaN(ag) || hg < 0 || ag < 0) {
    return showToast('Goals must be non-negative numbers.', 'error');
  }

  setLoading(true);

  const matches = getMatches();
  const newId = getNextMatchId();
  matches.push({
    id: newId,
    homeTeamId,
    awayTeamId,
    homeGoals: hg,
    awayGoals: ag,
    playedAt: new Date().toISOString()
  });
  saveMatches(matches);
  setNextMatchId(newId + 1);

  const homeName = homeTeamSel.options[homeTeamSel.selectedIndex].text;
  const awayName = awayTeamSel.options[awayTeamSel.selectedIndex].text;
  showToast(`${homeName} ${hg} – ${ag} ${awayName} recorded!`, 'success');

  matchForm.reset();
  refreshAll();
  setLoading(false);
});

// ── Delete Match ──────────────────────────────────────────
function deleteMatch(id) {
  if (!isAdmin) return;
  if (!confirm('Delete this match result? Standings will be recalculated.')) return;

  const matches = getMatches().filter(m => m.id !== id);
  saveMatches(matches);
  showToast('Match deleted.', 'success');
  refreshAll();
}

// ── Rename Team ───────────────────────────────────────────
function renameTeam(id, newName) {
  if (!isAdmin) return;
  if (!newName) {
    return showToast('Team name cannot be empty.', 'error');
  }

  const teams = getTeams();
  const team = teams.find(t => t.id === id);
  if (!team) return;

  const duplicate = teams.find(t => t.id !== id && t.name.toLowerCase() === newName.toLowerCase());
  if (duplicate) {
    return showToast('Another team already has that name.', 'error');
  }

  team.name = newName;
  saveTeams(teams);
  showToast(`Team renamed to "${newName}"`, 'success');
  refreshAll();
}

// ── Refresh All Views ─────────────────────────────────────
function refreshAll() {
  renderTeamDropdowns();
  renderStandings();
  renderMatches();
  renderTeamsManagement();
}

// ── Helpers ───────────────────────────────────────────────
function setLoading(state) {
  submitBtn.disabled = state;
  submitBtn.querySelector('.btn-text').classList.toggle('hidden', state);
  submitBtn.querySelector('.btn-loader').classList.toggle('hidden', !state);
}

function showToast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function escHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function escAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

// ── Init ──────────────────────────────────────────────────
function init() {
  getTeams();
  checkAdminSession();
  refreshAll();
}

init();
