# Claimstake

A frontier-town auction and building game for 1–4 players (hot-seat or vs. bots). Open `site/index.html` or play on GitHub Pages.

Rebuild after editing: `node build.js` then copy `dist/claimstake.html` to `site/index.html`. Tests: `node tests/rules.test.js`.

Online play (host a table, friends join with a 4-letter code) runs on Supabase: table `claim_docs`, anonymous sign-in, row-level security. The publishable key in the page is safe to expose. Inside the Claude artifact it uses the artifact database instead.
