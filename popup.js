const DEFAULTS = { patterns: '*test*', caseSensitive: false, autoRun: false, showButton: true };
const $ = (id) => document.getElementById(id);
const status = (text) => ($('status').textContent = text);

chrome.storage.sync.get(DEFAULTS, (s) => {
  $('patterns').value = s.patterns;
  $('caseSensitive').checked = s.caseSensitive;
  $('autoRun').checked = s.autoRun;
  $('showButton').checked = s.showButton;
});

function save() {
  return chrome.storage.sync.set({
    patterns: $('patterns').value,
    caseSensitive: $('caseSensitive').checked,
    autoRun: $('autoRun').checked,
    showButton: $('showButton').checked,
  });
}
['patterns', 'caseSensitive', 'autoRun', 'showButton'].forEach((id) => $(id).addEventListener('change', save));

async function send(message) {
  await save();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !/\/-\/merge_requests\/\d+/.test(tab.url || '')) {
    status('Open a GitLab merge request first.');
    return;
  }
  status('Working…');
  try {
    const r = await chrome.tabs.sendMessage(tab.id, message);
    if (!r || !r.ok) return status(`Failed: ${r ? r.error : 'no response (reload the MR page)'}`);
    if (r.reloading) return status(`${r.matched} matching files; reloading page…`);
    status(`${r.matched} matching files` + (r.collapsed != null ? `, ${r.collapsed} folders collapsed.` : '.'));
  } catch (e) {
    status('No response – reload the MR page and try again.');
  }
}

$('hide').addEventListener('click', () =>
  send({ type: 'hide', options: { markViewed: $('markViewed').checked, collapse: $('collapse').checked } })
);
$('unhide').addEventListener('click', () => send({ type: 'unhide' }));
