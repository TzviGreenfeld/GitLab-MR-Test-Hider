# Privacy Policy: GitLab MR Test Hider

Last updated: 2026-11-22

GitLab MR Test Hider does not collect, transmit, sell or share any personal or user data.

## What the extension does with data

- **Your settings.** The file patterns and options you enter in the popup are saved with Chrome's `storage.sync` API. Chrome keeps them in your browser and, if you have Chrome sync turned on, syncs them through your own Google account. The developer cannot see them.
- **Merge request file list.** On a gitlab.com merge request page, the extension requests that merge request's file list (`diffs_metadata.json`) from gitlab.com, the same site you are already on, using your existing session. The response is used only in that page and is not sent anywhere else.
- **GitLab's "Viewed" state.** The extension updates the entry GitLab itself keeps in your browser's `localStorage` to remember which files you marked as Viewed. It stays in your browser.

## What the extension does not do

- It does not send data to the developer or to any third party.
- It does not use analytics, tracking, advertising or remote code.
- It does not read pages other than gitlab.com merge request pages.

## Contact

Questions or problems: https://github.com/TzviGreenfeld/GitLab-MR-Test-Hider/issues
