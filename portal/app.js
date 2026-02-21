// ============================================================
// app.js — Infra Self-Service Portal
// ============================================================

const $ = (sel) => document.querySelector(sel);

// ---- State ----
let accessToken = localStorage.getItem('gh_token');
let currentUser = null;

// ---- DOM refs ----
const loginSection = $('#login-section');
const userSection = $('#user-section');
const formSection = $('#form-section');
const statusSection = $('#status-section');
const requestsSection = $('#requests-section');

// ============================================================
// GitHub OAuth (Device Flow is not available for static sites,
// so we use the standard OAuth web flow)
// ============================================================

$('#login-btn').addEventListener('click', () => {
  // Redirect to GitHub OAuth authorization page
  const params = new URLSearchParams({
    client_id: CONFIG.GITHUB_CLIENT_ID,
    scope: 'repo',
    redirect_uri: window.location.origin + window.location.pathname,
  });
  window.location.href = `https://github.com/login/oauth/authorize?${params}`;
});

$('#logout-btn').addEventListener('click', () => {
  localStorage.removeItem('gh_token');
  accessToken = null;
  currentUser = null;
  showLogin();
});

// ---- Check for OAuth callback code ----
async function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (code) {
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);

    // Exchange code for token via a proxy (required because GitHub doesn't support CORS)
    // You need a small backend or use a service like:
    // - Your own Cloudflare Worker / AWS Lambda
    // - Or use https://github.com/nickytonline/github-oauth-proxy
    try {
      statusSection.classList.remove('hidden');
      $('#status-message').innerHTML = '<span class="spinner"></span> Authenticating...';

      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: CONFIG.GITHUB_CLIENT_ID,
          code: code,
        }),
      });

      // NOTE: The above direct call won't work due to CORS.
      // You MUST use a proxy. See README for setup instructions.
      // For now, we support manually pasting a PAT (Personal Access Token).

      const data = await res.json();
      if (data.access_token) {
        accessToken = data.access_token;
        localStorage.setItem('gh_token', accessToken);
        statusSection.classList.add('hidden');
      }
    } catch (e) {
      // OAuth proxy not set up — fall back to PAT mode
      statusSection.classList.add('hidden');
    }
  }
}

// ---- PAT Fallback (for POC without OAuth proxy) ----
function showPATLogin() {
  loginSection.innerHTML = `
    <h2>Sign in to continue</h2>
    <p>Enter a GitHub <a href="https://github.com/settings/tokens/new?scopes=repo&description=InfraPortal" target="_blank" style="color: var(--primary);">Personal Access Token</a> with <code>repo</code> scope.</p>
    <div class="form-group" style="margin-top: 1rem;">
      <input type="password" id="pat-input" placeholder="ghp_xxxxxxxxxxxx" />
    </div>
    <button id="pat-login-btn" class="btn btn-primary">
      <svg class="github-icon" viewBox="0 0 16 16" width="20" height="20">
        <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      Sign in
    </button>
  `;
  $('#pat-login-btn').addEventListener('click', async () => {
    const pat = $('#pat-input').value.trim();
    if (!pat) return;

    // Validate token
    try {
      const res = await ghAPI('/user', pat);
      if (res.login) {
        accessToken = pat;
        localStorage.setItem('gh_token', pat);
        await initApp();
      } else {
        alert('Invalid token. Please check and try again.');
      }
    } catch {
      alert('Invalid token. Please check and try again.');
    }
  });
}

// ============================================================
// GitHub API helper
// ============================================================

async function ghAPI(endpoint, token = accessToken, options = {}) {
  const { headers: optHeaders, ...restOptions } = options;
  const res = await fetch(`https://api.github.com${endpoint}`, {
    ...restOptions,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...optHeaders,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${res.status}`);
  }

  return res.json();
}

// ============================================================
// UI state management
// ============================================================

function showLogin() {
  loginSection.classList.remove('hidden');
  userSection.classList.add('hidden');
  formSection.classList.add('hidden');
  requestsSection.classList.add('hidden');
  statusSection.classList.add('hidden');
  showPATLogin();
}

function showApp() {
  loginSection.classList.add('hidden');
  userSection.classList.remove('hidden');
  formSection.classList.remove('hidden');
  requestsSection.classList.remove('hidden');

  $('#user-avatar').src = currentUser.avatar_url;
  $('#user-name').textContent = currentUser.login;
}

// ============================================================
// Region dropdown — changes based on provider
// ============================================================

// Sync provider radio cards with hidden select
document.querySelectorAll('input[name="cloud_provider_radio"]').forEach((radio) => {
  radio.addEventListener('change', (e) => {
    const provider = e.target.value;
    $('#cloud_provider').value = provider;
    $('#cloud_provider').dispatchEvent(new Event('change'));
  });
});

$('#cloud_provider').addEventListener('change', (e) => {
  const provider = e.target.value;
  const regionSelect = $('#region');
  const hint = $('#region-hint');

  regionSelect.innerHTML = '<option value="">Select region...</option>';

  if (provider && CONFIG.REGIONS[provider]) {
    CONFIG.REGIONS[provider].forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r.value;
      opt.textContent = r.label;
      regionSelect.appendChild(opt);
    });
    hint.textContent = `Available regions for ${provider}`;
  } else {
    hint.textContent = '';
  }
});

// ============================================================
// Form submission — creates a GitHub Issue
// ============================================================

$('#bucket-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = $('#submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Submitting...';
  statusSection.classList.add('hidden');

  const provider = $('#cloud_provider').value;
  const bucketName = $('#bucket_name').value.trim();
  const region = $('#region').value;
  const environment = $('#environment').value;
  const publicAccess = $('#public_access').value;
  const justification = $('#justification').value.trim();

  // Build issue body matching the GitHub Issue template format
  const body = `### Cloud Provider

${provider}

### Bucket Name

${bucketName}

### Region

${region}

### Environment

${environment}

### Public Access

${publicAccess}

---
**Business Justification:** ${justification || 'N/A'}

_Submitted via Infra Self-Service Portal_`;

  try {
    const issue = await ghAPI(
      `/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/issues`,
      accessToken,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[Bucket Request]: ${bucketName}`,
          body: body,
          labels: [CONFIG.ISSUE_LABEL],
        }),
      }
    );

    statusSection.classList.remove('hidden');
    $('#status-message').innerHTML = `
      <p class="status-success">
        ✅ Request submitted successfully!<br />
        <button class="btn btn-outline btn-sm" id="view-issue-btn" data-issue-number="${issue.number}">View Issue #${issue.number}</button>
      </p>
    `;
    setTimeout(() => {
      const viewBtn = document.getElementById('view-issue-btn');
      if (viewBtn) {
        viewBtn.onclick = () => {
          window.location.hash = `#/request/${issue.number}`;
        };
      }
    }, 0);

    // Reset form
    $('#bucket-form').reset();
    $('#region').innerHTML = '<option value="">Select region...</option>';

    // Refresh requests list
    await loadRecentRequests();
  } catch (err) {
    statusSection.classList.remove('hidden');
    $('#status-message').innerHTML = `
      <p class="status-error">❌ Error: ${err.message}</p>
    `;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit Request';
  }
});

// ============================================================
// Load recent requests
// ============================================================

async function loadRecentRequests() {
  try {
    const issues = await ghAPI(
      `/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/issues?labels=${CONFIG.ISSUE_LABEL}&creator=${currentUser.login}&per_page=10&state=all`
    );

    const list = $('#requests-list');

    if (issues.length === 0) {
      list.innerHTML = '<p class="no-requests">No requests yet</p>';
      return;
    }

    list.innerHTML = issues
      .map(
        (issue) => `
        <div class="request-item" data-issue-number="${issue.number}" style="cursor:pointer;">
          <div>
            <div class="request-title">${issue.title}</div>
            <div class="request-meta">#${issue.number} · ${new Date(issue.created_at).toLocaleDateString()}</div>
          </div>
          <span class="badge ${issue.state === 'open' ? 'badge-open' : 'badge-closed'}">${issue.state}</span>
        </div>
      `
      )
      .join('');

    // Add click handlers for detailed view (route-based)
    list.querySelectorAll('.request-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        const issueNumber = item.getAttribute('data-issue-number');
        window.location.hash = `#/request/${issueNumber}`;
      });
    });
  } catch {
    $('#requests-list').innerHTML = '<p class="no-requests">Could not load requests</p>';
  }
}

// ============================================================
// Request Detail Full Page View & Activity Feed (Client Routing)
// ============================================================

const detailPageId = 'request-detail-page';

function renderRequestDetailPage(issueNumber) {
  // Hide all main sections
  loginSection.classList.add('hidden');
  userSection.classList.add('hidden');
  formSection.classList.add('hidden');
  requestsSection.classList.add('hidden');
  statusSection.classList.add('hidden');

  let detailPage = document.getElementById(detailPageId);
  if (!detailPage) {
    detailPage = document.createElement('div');
    detailPage.id = detailPageId;
    detailPage.className = 'card';
    document.querySelector('.container').appendChild(detailPage);
  }
  detailPage.innerHTML = '<div style="text-align:center"><span class="spinner"></span> Loading...</div>';
  detailPage.classList.remove('hidden');

  (async () => {
    try {
      const issue = await ghAPI(`/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/issues/${issueNumber}`);
      const comments = await ghAPI(`/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/issues/${issueNumber}/comments`);

      let html = `<button class="btn btn-outline btn-sm" id="back-to-dashboard">← Back to Dashboard</button>`;
      html += `<h2 style="margin-bottom:0.5rem;">${issue.title}</h2>`;
      html += `<div class="request-meta">#${issue.number} · ${new Date(issue.created_at).toLocaleString()}${issue.closed_at ? ' · Closed: ' + new Date(issue.closed_at).toLocaleString() : ''}</div>`;
      html += `<div class="badge ${issue.state === 'open' ? 'badge-open' : 'badge-closed'}" style="margin-bottom:1rem;">${issue.state}</div>`;
      html += `<div class="activity-body" style="margin-bottom:1.2rem;">${issue.body.replace(/\n/g, '<br>')}</div>`;

      html += `<div class="activity-feed"><strong>Activity Feed</strong>`;
      if (comments.length === 0) {
        html += `<div class="activity-item"><span class="activity-meta">No comments yet.</span></div>`;
      } else {
        comments.forEach((c) => {
          html += `<div class="activity-item">
            <div class="activity-meta">${c.user.login} · ${new Date(c.created_at).toLocaleString()}</div>
            <div class="activity-body">${c.body.replace(/\n/g, '<br>')}</div>
          </div>`;
        });
      }
      html += `</div>`;

      detailPage.innerHTML = html;
      document.getElementById('back-to-dashboard').onclick = () => {
        window.history.pushState({}, '', window.location.pathname);
        detailPage.classList.add('hidden');
        showApp();
      };
    } catch (err) {
      detailPage.innerHTML = `<div class="status-error">Failed to load details: ${err.message}</div>`;
    }
  })();
}

function handleRoute() {
  const hash = window.location.hash;
  if (hash.startsWith('#/request/')) {
    const issueNumber = hash.split('/')[2];
    renderRequestDetailPage(issueNumber);
  } else {
    // Show dashboard
    const detailPage = document.getElementById(detailPageId);
    if (detailPage) detailPage.classList.add('hidden');
    showApp();
  }
}

window.addEventListener('popstate', handleRoute);
window.addEventListener('hashchange', handleRoute);

// ============================================================
// Init
// ============================================================

async function initApp() {
  if (!accessToken) {
    showLogin();
    return;
  }

  try {
    currentUser = await ghAPI('/user');
    showApp();
    await loadRecentRequests();
  } catch {
    // Token expired or invalid
    localStorage.removeItem('gh_token');
    accessToken = null;
    showLogin();
  }
}

// Handle OAuth callback, then init
handleOAuthCallback().then(() => {
  initApp();
  handleRoute();
});
