// ============================================================
// app.js — Infra Self-Service Portal
// ============================================================

const $ = (sel) => document.querySelector(sel);

// ---- State ----
let accessToken = localStorage.getItem('gh_token');
let currentUser = null;
let allIssues = []; // full list for client-side status filtering
let _pollTimer = null; // background status-refresh timer
let _issuePRMap = {}; // issue_number → { merged: bool, state: 'open'|'closed' }

// ---- DOM refs ----
const loginSection = $('#login-section');
const userSection = $('#user-section');
const formSection = $('#form-section');
const statusSection = $('#status-section');
const requestsSection = $('#requests-section');

function showSyncStatus(message, isError = false) {
  if (!statusSection) return;
  statusSection.classList.remove('hidden');
  const cls = isError ? 'status-error' : 'status-success';
  $('#status-message').innerHTML = `<p class="${cls}">${message}</p>`;
}

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
  stopPolling();
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
    cache: 'no-store',
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
  serviceSection.classList.remove('hidden');
  formSection.classList.add('hidden');
  requestsSection.classList.add('hidden');

  $('#user-avatar').src = currentUser.avatar_url;
  $('#user-name').textContent = currentUser.login;
}

// ---- Service Request UI ----
const serviceSection = document.getElementById('service-section');
const serviceList = document.getElementById('service-list');
const providerBtns = [
  document.getElementById('provider-aws'),
  document.getElementById('provider-gcp'),
];

const SERVICES = {
  AWS: [
    { name: 'Bucket', enabled: true },
    { name: 'EC2', enabled: false },
    { name: 'Lambda', enabled: false },
    { name: 'RDS', enabled: false },
    { name: 'DynamoDB', enabled: false },
    { name: 'S3', enabled: false },
    { name: 'CloudFront', enabled: false },
    { name: 'ECS', enabled: false },
    { name: 'SNS', enabled: false },
    { name: 'SQS', enabled: false },
  ],
  GCP: [
    { name: 'Bucket', enabled: true },
    { name: 'Compute Engine', enabled: false },
    { name: 'Cloud Functions', enabled: false },
    { name: 'Cloud SQL', enabled: false },
    { name: 'BigQuery', enabled: false },
    { name: 'Pub/Sub', enabled: false },
    { name: 'Cloud Run', enabled: false },
    { name: 'Firestore', enabled: false },
    { name: 'App Engine', enabled: false },
    { name: 'Spanner', enabled: false },
  ],
};

providerBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const provider = btn.dataset.provider;
    showServices(provider);
  });
});

function showServices(provider) {
  serviceList.classList.remove('hidden');
  serviceList.innerHTML = `<div class="service-grid">${SERVICES[provider].map(s => `
    <button class="service-btn${s.enabled ? '' : ' disabled'}" ${s.enabled ? '' : 'disabled'} data-service="${s.name}">${s.name}</button>
  `).join('')}</div>`;
  // Only allow Bucket to proceed
  serviceList.querySelectorAll('.service-btn').forEach(btn => {
    if (btn.dataset.service === 'Bucket' && !btn.disabled) {
      btn.addEventListener('click', () => {
        serviceSection.classList.add('hidden');
        formSection.classList.remove('hidden');
        // Pre-select provider in hidden field
        document.getElementById('cloud_provider').value = provider;
        // Trigger region dropdown population
        document.getElementById('cloud_provider').dispatchEvent(new Event('change'));
        // Show back button
        document.getElementById('back-to-provider').style.display = '';
        document.getElementById('back-to-provider').onclick = function() {
          formSection.classList.add('hidden');
          serviceSection.classList.remove('hidden');
        };
      });
    }
  });
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
        <a href="#" class="view-issue-link" data-issue-number="${issue.number}">View Issue #${issue.number} (open in portal)</a>
        &nbsp;•&nbsp;
        <a href="${issue.html_url}" class="allow-github" target="_blank">Open on GitHub</a>
      </p>
    `;

    // Attach handler so 'View Issue' opens modal in-portal
    setTimeout(() => {
      const v = document.querySelector('.view-issue-link');
      if (v) {
        v.addEventListener('click', (ev) => {
          ev.preventDefault();
          openTicketModal(ev.currentTarget.dataset.issueNumber);
        });
      }
    }, 0);

    // Reset form
    $('#bucket-form').reset();
    $('#region').innerHTML = '<option value="">Select region...</option>';

    // Optimistically show the newly created issue in the list, then refresh in background
    prependIssueToList(issue);
    loadRecentRequests().then((ok) => {
      if (!ok) {
        showSyncStatus('Request created, but recent list sync failed. Check token/repo access.', true);
      }
    });
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

function bindTicketControls() {
  const ticketInput = document.getElementById('ticket-number-input');
  const openBtn = document.getElementById('open-ticket-btn');
  const refreshBtn = document.getElementById('refresh-tickets-btn');

  if (openBtn && ticketInput) {
    openBtn.onclick = () => {
      const val = ticketInput.value.trim();
      if (val && !isNaN(val) && Number(val) > 0) {
        openTicketModal(val);
      } else {
        ticketInput.focus();
        ticketInput.classList.add('input-error');
        setTimeout(() => ticketInput.classList.remove('input-error'), 1200);
      }
    };

    if (!ticketInput.dataset.boundEnter) {
      ticketInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') openBtn.click();
      });
      ticketInput.dataset.boundEnter = 'true';
    }
  }

  // Status filter tabs
  document.querySelectorAll('.filter-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      const filtered =
        filter === 'all'
          ? allIssues
          : allIssues.filter((issue) => deriveTicketStatus(issue).tone === filter);
      renderRequestsList(filtered);
    });
  });

  if (refreshBtn) {
    refreshBtn.onclick = async () => {
      refreshBtn.disabled = true;
      const previousText = refreshBtn.textContent;
      refreshBtn.textContent = 'Refreshing...';
      try {
        const ok = await loadRecentRequests();
        if (ok) {
          showSyncStatus('Recent requests synced successfully.');
        } else {
          showSyncStatus('Could not sync recent requests. Check token/repo access.', true);
        }
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = previousText || 'Refresh Requests';
      }
    };
  }
}

function deriveTicketStatus(issue) {
  if (!issue) return { text: 'open', className: 'badge-open', tone: 'open' };
  if (issue.state === 'closed') {
    return { text: 'closed', className: 'badge-closed', tone: 'closed' };
  }

  const labels = (issue.labels || []).map((l) => (l.name || '').toLowerCase());
  const inProgressLabels = [
    'approved-by-admin',
    'in-progress',
    'provisioning',
    'provisioning-in-progress',
    'ready-for-plan',
  ];

  if (inProgressLabels.some((label) => labels.includes(label))) {
    return { text: 'in-progress', className: 'badge-in-progress', tone: 'in-progress' };
  }

  // Infer in-progress from a linked PR when no status label is present.
  // A merged OR open PR means work was picked up — show in-progress.
  // Closed status is ONLY set from issue.state === 'closed' (checked above),
  // never from PR state, to avoid false-positives when the apply workflow
  // failed to close the issue.
  const prInfo = _issuePRMap[issue.number];
  if (prInfo && (prInfo.merged || prInfo.state === 'open')) {
    return { text: 'in-progress', className: 'badge-in-progress', tone: 'in-progress' };
  }

  return { text: 'open', className: 'badge-open', tone: 'open' };
}

function statusToneStyles(tone) {
  if (tone === 'closed') {
    return {
      bg: '#f3f4f6',
      fg: '#6b7280',
      border: '#e5e7eb',
    };
  }
  if (tone === 'in-progress') {
    return {
      bg: '#fff7ed',
      fg: '#c2410c',
      border: '#fdba74',
    };
  }
  return {
    bg: '#e0fbe0',
    fg: '#16a34a',
    border: '#bbf7d0',
  };
}

async function loadRecentRequests() {
  const list = $('#requests-list');
  try {
    if (!list) {
      showSyncStatus('Recent requests panel not found in page.', true);
      return false;
    }

    if (!currentUser || !currentUser.login) {
      throw new Error('Not authenticated with GitHub');
    }

    const nonce = Date.now();

    // Build a robust list: creator issues + labeled issues.
    // This prevents missing tickets when labels are not attached immediately.
    const creatorLabeled = await ghAPI(
      `/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/issues?labels=${CONFIG.ISSUE_LABEL}&creator=${currentUser.login}&per_page=20&state=all&sort=created&direction=desc&t=${nonce}`
    );

    const creatorAll = await ghAPI(
      `/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/issues?creator=${currentUser.login}&per_page=30&state=all&sort=created&direction=desc&t=${nonce}`
    );

    const labeledAll = await ghAPI(
      `/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/issues?labels=${CONFIG.ISSUE_LABEL}&per_page=20&state=all&sort=created&direction=desc&t=${nonce}`
    );

    const isPortalRequest = (issue) => {
      const title = (issue.title || '').toLowerCase();
      const body = (issue.body || '').toLowerCase();
      const labels = (issue.labels || []).map((l) => (l.name || '').toLowerCase());
      return (
        labels.includes((CONFIG.ISSUE_LABEL || '').toLowerCase()) ||
        title.startsWith('[bucket request]:') ||
        body.includes('submitted via infra self-service portal')
      );
    };

    const mergedMap = new Map();
    [...creatorLabeled, ...creatorAll, ...labeledAll].forEach((issue) => {
      if (issue && issue.number) {
        mergedMap.set(issue.number, issue);
      }
    });

    // Fetch all PRs against automation branch in one call to infer status for
    // issues that lack an in-progress label (e.g. older requests actioned before
    // the label-writing step was added to the workflow).
    let prs = [];
    try {
      prs = await ghAPI(
        `/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/pulls?state=all&base=automation&per_page=100`
      );
    } catch (_) { /* non-fatal */ }
    _issuePRMap = {};
    (prs || []).forEach((pr) => {
      const text = `${pr.title || ''} ${pr.body || ''}`;
      const m = text.match(/Issue\s*#(\d+)/i);
      if (m) {
        const num = parseInt(m[1], 10);
        // Prefer merged record if we've already stored an entry
        if (!_issuePRMap[num] || pr.merged_at) {
          _issuePRMap[num] = { merged: !!pr.merged_at, state: pr.state };
        }
      }
    });

    // Candidate list from the merged map (used only for ordering/filtering)
    const candidates = Array.from(mergedMap.values())
      .filter((issue) => !issue.pull_request)
      .filter(isPortalRequest)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    // Re-fetch each issue individually so we always get live labels/state.
    // The list endpoint can serve stale label data; the single-issue endpoint
    // always returns the current state.
    const freshResults = await Promise.all(
      candidates.map((c) =>
        ghAPI(`/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/issues/${c.number}`)
          .catch(() => c) // fall back to cached copy on error
      )
    );

    const issues = freshResults.filter(Boolean);

    allIssues = issues;
    // Reset filter to 'All' on each fresh load
    document.querySelectorAll('.filter-tab').forEach((b) => {
      b.classList.toggle('active', b.dataset.filter === 'all');
    });
    updateFilterCounts(issues);

    if (!issues || issues.length === 0) {
      list.innerHTML = '<p class="no-requests">No requests yet</p>';
      return true;
    }

    renderRequestsList(issues);

    return true;
  } catch (err) {
    if (list) {
      list.innerHTML = `<p class="no-requests">Could not load requests: ${err.message || 'Unknown error'}</p>`;
    }
    return false;
  }
}

// Update count badges on filter tabs
function updateFilterCounts(issues) {
  const counts = { all: issues.length, open: 0, 'in-progress': 0, closed: 0 };
  issues.forEach((issue) => {
    const tone = deriveTicketStatus(issue).tone;
    if (counts[tone] !== undefined) counts[tone]++;
  });
  Object.entries(counts).forEach(([filter, n]) => {
    const el = document.getElementById(`filter-count-${filter}`);
    if (el) el.textContent = n > 0 ? String(n) : '';
  });
}

// Render a (possibly filtered) subset of issues into #requests-list
function renderRequestsList(issues) {
  const list = $('#requests-list');
  if (!list) return;

  if (!issues || issues.length === 0) {
    list.innerHTML = '<p class="no-requests">No requests match this filter</p>';
    return;
  }

  list.innerHTML = issues
    .map((issue) => {
      const status = deriveTicketStatus(issue);
      return `
      <div class="request-item status-${status.tone}">
        <div>
          <div class="request-title"><a href="#" class="ticket-link" data-issue-number="${issue.number}">${issue.title}</a></div>
          <div class="request-meta"><a href="#" class="ticket-number-link" data-issue-number="${issue.number}">#${issue.number}</a> · ${new Date(issue.created_at).toLocaleDateString()}</div>
        </div>
        <span class="badge ${status.className}">${status.text}</span>
      </div>
    `;
    })
    .join('');
}

// Prepend newly created issue to the list (optimistic UI)
function prependIssueToList(issue) {
  try {
    const list = $('#requests-list');
    const status = deriveTicketStatus(issue);
    const el = document.createElement('div');
    el.className = `request-item status-${status.tone}`;
    el.innerHTML = `
      <div>
        <div class="request-title"><a href="#" class="ticket-link" data-issue-number="${issue.number}">${issue.title}</a></div>
        <div class="request-meta"><a href="#" class="ticket-number-link" data-issue-number="${issue.number}">#${issue.number}</a> · ${new Date(issue.created_at).toLocaleDateString()}</div>
      </div>
      <span class="badge ${status.className}">${status.text}</span>
    `;

    // Insert at top
    if (list.firstChild) {
      list.insertBefore(el, list.firstChild);
    } else {
      list.appendChild(el);
    }

    // Attach click handlers for title and number
    const titleLink = el.querySelector('.ticket-link');
    if (titleLink) {
      titleLink.addEventListener('click', (ev) => {
        ev.preventDefault();
        openTicketModal(ev.currentTarget.dataset.issueNumber);
      });
    }
    const numLink = el.querySelector('.ticket-number-link');
    if (numLink) {
      numLink.addEventListener('click', (ev) => {
        ev.preventDefault();
        openTicketModal(ev.currentTarget.dataset.issueNumber);
      });
    }
  } catch (e) {
    // ignore
  }
}

// Event delegation: ensure any click on title/number/view links opens modal
// This handles dynamic/optimistic elements and prevents default navigation.
;(function attachDelegatedHandlers(){
  const requestsList = document.getElementById('requests-list');
  if (requestsList) {
    requestsList.addEventListener('click', (ev) => {
      const link = ev.target.closest('.ticket-link, .ticket-number-link');
      if (!link) return;
      ev.preventDefault();
      const num = link.dataset.issueNumber;
      try { openTicketModal(num); } catch (e) { console.error('openTicketModal failed', e); }
    });
  }

  // Also delegate for the temporary 'view-issue-link' placed in the status message
  document.addEventListener('click', (ev) => {
    const v = ev.target.closest('.view-issue-link');
    if (!v) return;
    ev.preventDefault();
    const num = v.dataset.issueNumber;
    try { openTicketModal(num); } catch (e) { console.error('openTicketModal failed', e); }
  });
})();

// Capture-phase global anchor interceptor: prevents navigation for any issue links
// and forces opening the in-portal modal. We run in capture phase so this fires
// before other handlers or default navigation.
document.addEventListener('click', function(ev) {
  try {
    const a = ev.target.closest && ev.target.closest('a');
    if (!a) return;
    // Allow explicit external GitHub links (marked with .allow-github)
    if (a.classList && a.classList.contains('allow-github')) return;

    // If anchor carries an issue number, open modal
    if (a.dataset && a.dataset.issueNumber) {
      ev.preventDefault();
      openTicketModal(a.dataset.issueNumber);
      return;
    }

    // If link points to a GitHub issue URL, try to extract number and open modal
    const href = a.getAttribute('href') || '';
    const m = href.match(/issues\/(\d+)/);
    if (m) {
      ev.preventDefault();
      openTicketModal(m[1]);
      return;
    }
  } catch (e) {
    // swallow
  }
}, true);

// Simple modal builder and ticket detail fetcher
function ensureTicketModal() {
  // Always remove any existing modal to avoid duplicates
  const old = document.getElementById('ticket-modal');
  if (old) old.remove();
  const modal = document.createElement('div');
  modal.id = 'ticket-modal';
  modal.className = 'modal hidden';
  // Inline styles to guarantee overlay behavior even if external CSS is cached or overridden
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.background = 'rgba(8,10,15,0.45)';
  modal.style.zIndex = '9999';
  modal.style.padding = '24px';
  // Add a border and shadow for clarity
  modal.innerHTML = `
    <div class="modal-inner" style="background: #fff; border-radius: 16px; box-shadow: 0 8px 40px rgba(0,0,0,0.25); border: 2px solid #7c3aed; min-width:340px; max-width:600px; width:100%; padding:0;">
      <div class="modal-header" style="padding: 18px 20px; border-bottom: 1px solid #eee; display:flex; align-items:center; justify-content:space-between;">
        <h3 id="ticket-modal-title" style="font-size:1.1rem; font-weight:800; color:#3b2f6b;">Loading...</h3>
        <button id="ticket-modal-close" class="btn btn-sm" style="font-size:1.2rem; background:transparent; border:none;">✕</button>
      </div>
      <div id="ticket-modal-body" class="modal-body" style="padding: 20px 24px 28px; min-height: 80px;">
        <div class="spinner"></div>
        <div style="margin-top:16px; color:#888; font-size:0.95rem;">(This is a test: Modal is rendered as overlay, not at the bottom.)</div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('ticket-modal-close').addEventListener('click', closeTicketModal);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) closeTicketModal(); });
  // Close on Escape key
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeTicketModal(); });
}

async function openTicketModal(issueNumber) {
  try {
    ensureTicketModal();
    const modal = document.getElementById('ticket-modal');
    const body = document.getElementById('ticket-modal-body');
    const title = document.getElementById('ticket-modal-title');

    modal.classList.remove('hidden');
    // trigger animated show class (delay to allow CSS to apply)
    setTimeout(() => modal.classList.add('show'), 10);
    // Prevent background scroll while modal is open
    try { document.body.style.overflow = 'hidden'; } catch (e) {}
    title.textContent = `Loading #${issueNumber}...`;
    body.innerHTML = '<div class="spinner"></div>';

    const issue = await ghAPI(`/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/issues/${issueNumber}`);
    const status = deriveTicketStatus(issue);
    const tone = statusToneStyles(status.tone);

    // Build a visually appealing modal layout
    const created = new Date(issue.created_at).toLocaleString();
    const avatar = issue.user && issue.user.avatar_url ? `<img src="${issue.user.avatar_url}" alt="avatar" style="width:40px;height:40px;border-radius:50%;border:1.5px solid #eee;box-shadow:0 2px 8px #0001;margin-right:16px;vertical-align:middle;">` : '';
    body.innerHTML = `
      <div class="modal-ticket-outer">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:10px;">
          <div style="flex:1;">
            <div style="font-size:1.08rem;font-weight:700;color:#3b2f6b;line-height:1.2;">${escapeHtml(issue.title)}</div>
            <div style="font-size:0.92rem;color:#888;">#${issue.number} &bull; ${created}</div>
          </div>
          <span style="font-size:0.85rem;padding:4px 12px;border-radius:12px;font-weight:600;background:${tone.bg};color:${tone.fg};border:1px solid ${tone.border};">${status.text.toUpperCase()}</span>
        </div>
        <div style="margin-bottom:14px;font-size:0.97rem;color:#555;"><b>Author:</b> ${escapeHtml(issue.user.login)}</div>
        <hr style="margin:10px 0 18px 0;" />
        <div class="issue-body" style="font-size:1.01rem;line-height:1.7;color:#222;white-space:pre-line;">${escapeHtml(issue.body)}</div>
      </div>
      <div style="margin:32px 0 18px 0; display:flex; justify-content:center;">
        <div class="modal-activity-outer">
          <div class="modal-activity-title">Activity Feed</div>
          <div class="modal-activity-feed" id="modal-activity-feed-list">
            <div style="color:#aaa; font-size:0.97rem;">Loading activity...</div>
          </div>
        </div>
      </div>
      <div class="modal-btn-row">
        <button class="modal-btn modal-btn-close" id="ticket-modal-close-cta">✕ Close</button>
        <a class="modal-btn modal-btn-github allow-github" href="${issue.html_url}" target="_blank"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-right:7px;"><path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.67.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.38 9.38 0 0 1 12 6.84c.85.004 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.58.69.48A10.01 10.01 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" fill="#18181b"/></svg>Open on GitHub</a>
      </div>
    `;

    // Fetch and render activity feed (comments)
    fetchActivityFeed(issue.number);

    // Close CTA handler
    const closeCta = document.getElementById('ticket-modal-close-cta');
    if (closeCta) closeCta.addEventListener('click', closeTicketModal);
  } catch (e) {
    // Instead of immediately opening GitHub, show an error in the modal
    ensureTicketModal();
    const modal = document.getElementById('ticket-modal');
    const body = document.getElementById('ticket-modal-body');
    const title = document.getElementById('ticket-modal-title');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('show'), 10);
    title.textContent = `Issue #${issueNumber}`;
    body.innerHTML = `
      <p class="status-error">Unable to load issue details (network or permission error).</p>
      <div style="display:flex; gap:12px; justify-content:flex-end; margin-top:12px;">
        <button class="btn btn-sm" id="ticket-modal-close-cta-err">Close</button>
        <a class="allow-github btn btn-sm" href="https://github.com/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/issues/${issueNumber}" target="_blank" style="text-decoration:none;">Open on GitHub</a>
      </div>
    `;
    const closeErr = document.getElementById('ticket-modal-close-cta-err');
    if (closeErr) closeErr.addEventListener('click', closeTicketModal);
  }
}

// Fetch and render activity feed (comments and events)
async function fetchActivityFeed(issueNumber) {
  try {
    const feedList = document.getElementById('modal-activity-feed-list');
    if (!feedList) return;
    feedList.innerHTML = '<div style="color:#94a3b8; font-size:0.95rem;">Loading key comments...</div>';

    // Fetch comments
    const comments = await ghAPI(`/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/issues/${issueNumber}/comments`);
    if (!comments || comments.length === 0) {
      feedList.innerHTML = '<div style="color:#aaa; font-size:0.97rem;">No activity yet.</div>';
      return;
    }

    const keyComments = pickKeyComments(comments, 6)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    feedList.innerHTML = keyComments.map((c) => {
      const rawBody = (c.body || '').trim();
      const safeBody = escapeHtml(rawBody || '(empty comment)');
      const shortBody = toPreviewText(rawBody, 180);
      const shortSafeBody = escapeHtml(shortBody);
      const needsToggle = safeBody !== shortSafeBody;
      const score = scoreComment(rawBody);
      const badge = score >= 6 ? 'High Signal' : score >= 3 ? 'Useful' : 'Context';
      const avatar = c.user && c.user.avatar_url ? c.user.avatar_url : '';

      return `
      <article class="modal-activity-item">
        <header class="modal-activity-head">
          <img class="modal-activity-avatar" src="${avatar}" alt="${escapeHtml(c.user.login)} avatar" />
          <div class="modal-activity-ident">
            <div class="modal-activity-meta">
              <span class="modal-activity-user">${escapeHtml(c.user.login)}</span>
              <span class="modal-activity-action">commented</span>
            </div>
            <div class="modal-activity-date">${new Date(c.created_at).toLocaleString()}</div>
          </div>
          <span class="modal-activity-badge">${badge}</span>
        </header>
        <div class="modal-activity-body" data-expanded="false">
          <span class="comment-preview">${shortSafeBody}</span>
          <span class="comment-full hidden">${safeBody}</span>
        </div>
        ${needsToggle ? '<button class="modal-comment-toggle" type="button">Show more</button>' : ''}
      </article>
      `;
    }).join('');

    feedList.querySelectorAll('.modal-comment-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.modal-activity-item');
        if (!card) return;
        const body = card.querySelector('.modal-activity-body');
        const preview = card.querySelector('.comment-preview');
        const full = card.querySelector('.comment-full');
        if (!body || !preview || !full) return;

        const expanded = body.dataset.expanded === 'true';
        if (expanded) {
          body.dataset.expanded = 'false';
          preview.classList.remove('hidden');
          full.classList.add('hidden');
          btn.textContent = 'Show more';
        } else {
          body.dataset.expanded = 'true';
          preview.classList.add('hidden');
          full.classList.remove('hidden');
          btn.textContent = 'Show less';
        }
      });
    });
  } catch (e) {
    const feedList = document.getElementById('modal-activity-feed-list');
    if (feedList) feedList.innerHTML = '<div style="color:#e11d48;">Could not load activity feed.</div>';
  }
}

function toPreviewText(text, limit = 180) {
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '(empty comment)';
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit).trim()}...`;
}

function scoreComment(text) {
  const t = (text || '').toLowerCase();
  let score = 0;
  if (!t) return score;
  if (t.length >= 60) score += 1;
  if (/approve|approved|merge|merged|done|completed/.test(t)) score += 3;
  if (/error|fail|failed|blocked|denied/.test(t)) score += 3;
  if (/terraform|plan|apply|destroy|workflow|pipeline/.test(t)) score += 2;
  if (/bucket|region|environment|public access/.test(t)) score += 1;
  return score;
}

function pickKeyComments(comments, maxItems = 6) {
  const unique = new Map();
  comments.forEach((c) => {
    const body = (c.body || '').replace(/\s+/g, ' ').trim();
    if (!body) return;
    const key = body.toLowerCase();
    if (!unique.has(key)) unique.set(key, c);
  });

  const ranked = Array.from(unique.values()).sort((a, b) => {
    const scoreDiff = scoreComment(b.body) - scoreComment(a.body);
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const selected = ranked.slice(0, maxItems);
  if (selected.length > 0) return selected;
  return comments.slice(-Math.min(maxItems, comments.length)).reverse();
}

function closeTicketModal() {
  const modal = document.getElementById('ticket-modal');
  if (modal) {
    modal.classList.remove('show');
    // wait for animation to finish before hiding and restoring scroll
    setTimeout(() => {
      modal.classList.add('hidden');
      try { document.body.style.overflow = ''; } catch (e) {}
    }, 260);
  } else {
    try { document.body.style.overflow = ''; } catch (e) {}
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
// Init
// ============================================================

// ---- Background polling: silently refresh issue statuses ----
function startPolling(intervalMs = 30000) {
  stopPolling();
  _pollTimer = setInterval(async () => {
    try {
      await loadRecentRequests();
    } catch (_) {
      // silent — don't surface polling errors to the user
    }
  }, intervalMs);
}

function stopPolling() {
  if (_pollTimer !== null) {
    clearInterval(_pollTimer);
    _pollTimer = null;
  }
}

async function initApp() {
  if (!accessToken) {
    showLogin();
    return;
  }

  try {
    currentUser = await ghAPI('/user');
    showApp();
    bindTicketControls();
    await loadRecentRequests();
    startPolling(30000); // refresh every 30 s to pick up label changes automatically
    // Show requests on service-section
    document.getElementById('requests-section').classList.remove('hidden');
  } catch {
    // Token expired or invalid
    localStorage.removeItem('gh_token');
    accessToken = null;
    showLogin();
  }
}

// Handle OAuth callback, then init
handleOAuthCallback().then(() => initApp());