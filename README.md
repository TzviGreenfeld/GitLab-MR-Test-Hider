# GitLab MR Test Hider

A Chrome extension for GitLab merge request diffs. It marks every file whose path matches a pattern (default `*test*`) as **Viewed** and collapses the matching folders in the file browser.

## Install (unpacked)

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. Open an MR's **Changes** tab, for example `https://gitlab.com/<group>/<project>/-/merge_requests/<iid>/diffs`.

## Use

- Click the **Hide tests** button in the bottom-right corner of the MR page, or
- open the extension popup, edit the patterns and click **Hide matching**.

**Unmark Viewed** clears the Viewed mark from the matching files.

Patterns are globs matched against the full file path. `*` matches any characters, including `/`. Put one pattern per line, or separate them with commas, e.g. `*test*, *fixtures*, *.snap`.

## How it works

GitLab keeps the per-file "Viewed" checkbox state in the browser only, in
`localStorage["code-review-<mr path>"]`, as a JSON array of `code_review_id`s
(see `app/assets/javascripts/diffs/stores/code_review.js` in GitLab).

1. The extension fetches `…/merge_requests/<iid>/diffs_metadata.json` to get every changed file's path and `code_review_id`.
2. It adds the IDs of the matching files to that localStorage entry.
3. GitLab reads that entry only when the page loads, so the extension reloads the page.
4. After the reload, it walks the file tree and collapses the outermost expanded folders whose path matches.

Because this is the same state GitLab's own checkbox writes, unticking a file by hand keeps working. Like GitLab's own Viewed marks, it is stored in this browser only.

## Limits

- Only `https://gitlab.com` is enabled. For a self-hosted GitLab, add its host to `host_permissions` and `content_scripts.matches` in `manifest.json`.
- Collapsing folders relies on GitLab's file-tree markup (`.file-row.folder[aria-expanded]` in `[data-testid="file-tree-container"]`). If GitLab changes it, marking files as Viewed keeps working, but folders may stay open. Check the console for `[mr-test-hider]` messages.
