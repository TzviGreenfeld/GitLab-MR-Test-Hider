// GitLab MR Test Hider - content script.
//
// How GitLab keeps "Viewed" state (app/assets/javascripts/diffs/stores/code_review.js):
//   localStorage["code-review-<mrPath>"] = JSON array of diff files' code_review_id
// The store reads it once when the page loads, so we write to it and reload the page.
// After the reload we collapse the matching folders in the file tree.

(() => {
  const DEFAULTS = { patterns: '*test*', caseSensitive: false, autoRun: false, showButton: true };
  const PENDING_KEY = 'mr-test-hider:pending-collapse';
  const LOG = (...a) => console.log('[mr-test-hider]', ...a);

  const mrMatch = location.pathname.match(/^(.*\/-\/merge_requests\/\d+)/);
  if (!mrMatch) return;
  const mrPath = mrMatch[1];

  // ---------- settings / pattern matching ----------

  const getSettings = () =>
    new Promise((resolve) => chrome.storage.sync.get(DEFAULTS, resolve));

  function globToRegex(glob, caseSensitive) {
    const body = glob
      .split('')
      .map((ch) => {
        if (ch === '*') return '.*';
        if (ch === '?') return '.';
        return ch.replace(/[.+^${}()|[\]\\/]/g, '\\$&');
      })
      .join('');
    return new RegExp(`^${body}$`, caseSensitive ? '' : 'i');
  }

  function buildMatcher(settings) {
    const regexes = settings.patterns
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => globToRegex(p, settings.caseSensitive));
    return (path) => regexes.some((re) => re.test(path));
  }

  // ---------- diff file metadata ----------

  function metadataUrl() {
    const el = document.querySelector('[data-endpoint-metadata]');
    const fromDom = el && el.getAttribute('data-endpoint-metadata');
    return fromDom || `${mrPath}/diffs_metadata.json`;
  }

  async function fetchDiffFiles() {
    const res = await fetch(metadataUrl(), {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`diffs_metadata request failed: ${res.status}`);
    const data = await res.json();
    return data.diff_files || [];
  }

  // ---------- reviewed (Viewed) state ----------

  function reviewStorageKey() {
    // Prefer a key GitLab already wrote for this MR, in case its mrPath differs from ours
    // (e.g. a full URL instead of a path).
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key.startsWith('code-review-') && key.endsWith(mrPath)) return key;
    }
    return `code-review-${mrPath}`;
  }

  function readReviewed(key) {
    try {
      const ids = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(ids) ? ids.map(String) : [];
    } catch {
      return [];
    }
  }

  async function setViewed(matches, viewed) {
    const files = await fetchDiffFiles();
    const targets = files.filter((f) => matches(f.new_path) || matches(f.old_path));
    const ids = targets.map((f) => f.code_review_id).filter(Boolean).map(String);
    const key = reviewStorageKey();
    const current = new Set(readReviewed(key));
    const before = current.size;
    ids.forEach((id) => (viewed ? current.add(id) : current.delete(id)));
    if (current.size) localStorage.setItem(key, JSON.stringify([...current]));
    else localStorage.removeItem(key);
    LOG(`${viewed ? 'marked' : 'unmarked'} ${ids.length} files (key ${key}, ${before} -> ${current.size})`);
    return { matched: targets.length, changed: Math.abs(current.size - before), total: files.length };
  }

  // ---------- file tree folder collapsing ----------

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function waitFor(selector, timeoutMs = 20000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const el = document.querySelector(selector);
      if (el) return el;
      await sleep(250);
    }
    return null;
  }

  // A folder row's title is the folder's full path (file_row.vue textForTitle); fall back to its name.
  function folderPath(row) {
    return row.getAttribute('title') || row.getAttribute('aria-label') || row.textContent.trim();
  }

  function collapseVisibleFolders(matches) {
    const rows = document.querySelectorAll(
      '[data-testid="file-tree-container"] .file-row.folder[aria-expanded="true"]'
    );
    for (const row of rows) {
      const path = folderPath(row);
      if (!matches(path)) continue;
      // Collapse only the outermost matching folder; nested ones disappear with it.
      const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
      if (parent && matches(parent)) continue;
      row.click();
      return true; // the virtual list re-renders after a click; rescan
    }
    return false;
  }

  async function collapseFolders(matches) {
    const container = await waitFor('[data-testid="file-tree-container"]');
    if (!container) {
      LOG('file tree not found (is the file browser hidden?)');
      return 0;
    }
    await waitFor('[data-testid="file-tree-container"] .file-row');
    const scroller =
      container.querySelector('[data-testid="tree-list-scroll"]') || container;
    let collapsed = 0;
    // The tree is virtualised (only visible rows exist), so walk it top to bottom.
    scroller.scrollTop = 0;
    await sleep(100);
    for (let guard = 0; guard < 2000; guard += 1) {
      if (collapseVisibleFolders(matches)) {
        collapsed += 1;
        await sleep(60);
        continue;
      }
      const prev = scroller.scrollTop;
      scroller.scrollTop = prev + Math.max(scroller.clientHeight - 40, 100);
      await sleep(80);
      if (scroller.scrollTop === prev) break;
    }
    scroller.scrollTop = 0;
    LOG(`collapsed ${collapsed} folders`);
    return collapsed;
  }

  // ---------- actions ----------

  async function hide({ markViewed = true, collapse = true } = {}) {
    const settings = await getSettings();
    const matches = buildMatcher(settings);
    let result = { matched: 0, changed: 0 };
    if (markViewed) result = await setViewed(matches, true);
    if (markViewed && result.changed > 0) {
      // GitLab only reads the Viewed state on load: reload, then collapse.
      if (collapse) sessionStorage.setItem(PENDING_KEY, '1');
      location.reload();
      return { ...result, reloading: true };
    }
    const collapsed = collapse ? await collapseFolders(matches) : 0;
    return { ...result, collapsed };
  }

  async function unhide() {
    const settings = await getSettings();
    const result = await setViewed(buildMatcher(settings), false);
    if (result.changed > 0) location.reload();
    return { ...result, reloading: result.changed > 0 };
  }

  // ---------- page button ----------

  function addButton() {
    if (document.getElementById('mr-test-hider-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'mr-test-hider-btn';
    btn.type = 'button';
    btn.textContent = 'Hide tests';
    btn.title = 'Mark files matching your patterns as Viewed and collapse their folders';
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Working…';
      try {
        const r = await hide();
        if (!r.reloading) btn.textContent = `Done (${r.matched} files)`;
      } catch (e) {
        btn.textContent = 'Failed – see console';
        LOG(e);
      } finally {
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = 'Hide tests';
        }, 2500);
      }
    });
    document.body.appendChild(btn);
  }

  // ---------- wiring ----------

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    const run = msg.type === 'hide' ? hide(msg.options) : msg.type === 'unhide' ? unhide() : null;
    if (!run) return false;
    run.then((r) => sendResponse({ ok: true, ...r })).catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  });

  (async () => {
    const settings = await getSettings();
    if (settings.showButton) addButton();
    const onDiffsTab = () => /\/diffs\b/.test(location.pathname) || document.querySelector('[data-testid="file-tree-container"]');
    if (sessionStorage.getItem(PENDING_KEY)) {
      sessionStorage.removeItem(PENDING_KEY);
      await collapseFolders(buildMatcher(settings));
    } else if (settings.autoRun && onDiffsTab()) {
      await hide();
    }
  })();
})();
