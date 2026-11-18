# Chrome Web Store listing

Text to paste into the Developer Dashboard (https://chrome.google.com/webstore/devconsole).

## Store listing

- **Name:** GitLab MR Test Hider
- **Category:** Developer Tools
- **Short description** (from the manifest): Mark files matching a pattern (e.g. *test*) as Viewed in a GitLab merge request and collapse their folders in the file tree.
- **Detailed description:**

  Reviewing a large GitLab merge request often means scrolling past dozens of test files.
  This extension marks every changed file whose path matches your patterns (default `*test*`)
  as Viewed, which collapses its diff, and collapses the matching folders in the file browser.

  - One click: a "Hide tests" button on the merge request page, or the toolbar popup.
  - Configurable glob patterns, e.g. `*test*, *fixtures*, *.snap`.
  - "Unmark Viewed" undoes it.
  - Uses GitLab's own Viewed state, so the checkboxes keep working as usual.

  Works on gitlab.com. Nothing leaves your browser.

- **Screenshots:** at least one, 1280x800 or 640x400. Take one of an MR with the file tree before and after.
- **Icon:** `icons/icon128.png`

## Privacy practices tab

- **Single purpose:** Mark files matching user-defined path patterns as Viewed in GitLab merge request diffs and collapse their folders.
- **storage justification:** Saves the user's file patterns and options.
- **Host access justification (content script on gitlab.com merge request pages):** Reads the list of changed files from the merge request page's own diffs metadata and updates GitLab's local Viewed state in that page.
- **Remote code:** No.
- **Data usage:** Collects no user data. Tick none of the data categories and certify the three disclosures.
