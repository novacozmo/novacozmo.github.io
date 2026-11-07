# Snapshot: 2026-11-07

A complete copy of the live site as it was at commit `edd2924`
("Show the sims up front: hero visual, share cards, project thumbnails"),
taken just before the growth strip, nav highlight, linkable dev stories and
reduced-motion changes.

It is self-contained: open `index.html` in this folder in a browser to see it.
It is not published on the website (folders starting with `_` are skipped by
GitHub Pages).

## Restore it

From the repository root, copy the three files back over the live ones:

    cp _snapshots/2026-11-07/index.html index.html
    cp _snapshots/2026-11-07/css/style.css css/style.css
    cp _snapshots/2026-11-07/js/main.js js/main.js

Then commit and push. All three files must go back together, because
`index.html` links to the CSS and JS by version number.

To compare with the current site: `git diff edd2924 HEAD`.
To undo only the later changes using git instead: `git revert <commit>`.
