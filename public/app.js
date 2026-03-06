/* ============================================================
   St Mark Lions Cup — Client Application
   ============================================================ */

const API = '';

// ── DOM Refs ─────────────────────────────────────────────
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

// ── Navigation ────────────────────────────────────────────
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

// ── Data Loaders ──────────────────────────────────────────
async function loadTeams() {
    const res = await fetch(`${API}/api/teams`);
    const teams = await res.json();
    const frag1 = document.createDocumentFragment();
    const frag2 = document.createDocumentFragment();

    // Keep the default "Select team…" option
    const def1 = document.createElement('option');
    def1.value = ''; def1.textContent = 'Select team…';
    frag1.appendChild(def1);

    const def2 = document.createElement('option');
    def2.value = ''; def2.textContent = 'Select team…';
    frag2.appendChild(def2);

    teams.forEach(t => {
        const opt1 = document.createElement('option');
        opt1.value = t.id; opt1.textContent = t.name;
        frag1.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = t.id; opt2.textContent = t.name;
        frag2.appendChild(opt2);
    });

    homeTeamSel.innerHTML = '';
    awayTeamSel.innerHTML = '';
    homeTeamSel.appendChild(frag1);
    awayTeamSel.appendChild(frag2);
}

async function loadStandings() {
    const res = await fetch(`${API}/api/standings`);
    const rows = await res.json();
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
        // Staggered animation
        tr.style.animation = `fadeUp .35s ease ${i * 0.04}s both`;
        frag.appendChild(tr);
    });

    standingsBody.appendChild(frag);
}

async function loadMatches() {
    const res = await fetch(`${API}/api/matches`);
    const matches = await res.json();

    if (matches.length === 0) {
        matchesList.innerHTML = '';
        noMatches.classList.remove('hidden');
        return;
    }

    noMatches.classList.add('hidden');
    matchesList.innerHTML = '';
    const frag = document.createDocumentFragment();

    matches.forEach((m, i) => {
        const card = document.createElement('div');
        card.className = 'match-card';
        card.style.animationDelay = `${i * 0.05}s`;

        const dateStr = formatDate(m.played_at);

        card.innerHTML = `
      <div class="match-teams">
        <span class="match-team-name home">${escHtml(m.home_team)}</span>
        <div class="match-score">
          <span class="score-num">${m.home_goals}</span>
          <span class="score-sep">–</span>
          <span class="score-num">${m.away_goals}</span>
        </div>
        <span class="match-team-name away">${escHtml(m.away_team)}</span>
      </div>
      <span class="match-meta">${dateStr}</span>
      <button class="match-delete" data-id="${m.id}" title="Delete match">✕</button>
    `;
        frag.appendChild(card);
    });

    matchesList.appendChild(frag);

    // Bind delete buttons
    matchesList.querySelectorAll('.match-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteMatch(btn.dataset.id));
    });
}

// ── Form Submission ───────────────────────────────────────
matchForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const homeTeamId = homeTeamSel.value;
    const awayTeamId = awayTeamSel.value;
    const homeGoals = homeGoalsIn.value;
    const awayGoals = awayGoalsIn.value;

    if (!homeTeamId || !awayTeamId) {
        return showToast('Please select both teams.', 'error');
    }
    if (homeTeamId === awayTeamId) {
        return showToast('A team cannot play against itself.', 'error');
    }
    if (homeGoals === '' || awayGoals === '') {
        return showToast('Please enter goals for both teams.', 'error');
    }

    setLoading(true);

    try {
        const res = await fetch(`${API}/api/matches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                homeTeamId: parseInt(homeTeamId),
                awayTeamId: parseInt(awayTeamId),
                homeGoals: parseInt(homeGoals),
                awayGoals: parseInt(awayGoals)
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to add match.');
        }

        // Get team names for message
        const homeName = homeTeamSel.options[homeTeamSel.selectedIndex].text;
        const awayName = awayTeamSel.options[awayTeamSel.selectedIndex].text;

        showToast(`${homeName} ${homeGoals} – ${awayGoals} ${awayName} recorded!`, 'success');

        // Reset form
        matchForm.reset();

        // Reload data
        await Promise.all([loadStandings(), loadMatches()]);
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        setLoading(false);
    }
});

// ── Delete Match ──────────────────────────────────────────
async function deleteMatch(id) {
    if (!confirm('Delete this match result? Standings will be recalculated.')) return;

    try {
        const res = await fetch(`${API}/api/matches/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete match.');
        showToast('Match deleted.', 'success');
        await Promise.all([loadStandings(), loadMatches()]);
    } catch (err) {
        showToast(err.message, 'error');
    }
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

function formatDate(iso) {
    try {
        const d = new Date(iso + 'Z');
        return d.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch {
        return iso;
    }
}

// ── Init ──────────────────────────────────────────────────
async function init() {
    await loadTeams();
    await Promise.all([loadStandings(), loadMatches()]);
}

init();
