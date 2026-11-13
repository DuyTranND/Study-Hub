# Study Hub

A local-first study workspace with an English interface and Vietnamese learning content. Includes question banks, timed practice, explanations, bookmarks, lessons, formula sheets, and SHL-style practice.

## Run locally

Requires Node.js 22 or newer. No dependency installation is needed.

```sh
node server.cjs
```

Open http://127.0.0.1:8768/ in your browser. On Windows, double-click `OPEN-LOCAL.cmd` (uses port 8771). Do not open `index.html` directly: question banks and assets require HTTP.

Individual practice progress is stored in browser localStorage and belongs to the particular origin/port. Changing ports does not automatically migrate progress.

## Study Groups and leaderboard

Open **Study Groups** to create a group and invite friends with the 8-character code. Friends open the same hosted Study Hub instance and join with their own nicknames. Timed exam results with at least 10 answered, gradable questions count toward the group leaderboard; results can also be shared again from the exam results screen. Each distinct correctly answered question earns one point per member per week. Rankings have weekly (Monday in Vietnam) and all-time views, plus recent group activity. Retaking the same questions does not generate extra points in the same week.

The shared scoreboard runs in the Node server (`server.cjs` + `group-api.cjs`). Scores are graded against bundled questions on the server; submitted answers aren't shown to group members. The default persistent database is `storage/groups.json` and is excluded from Git and blocked from HTTP. Set `STUDY_GROUP_STORE` to an absolute path on a persistent mounted disk to place the database elsewhere. Back up the storage file when upgrading. A browser's local group membership is tied to its origin; leaving a group removes that member's scoreboard history.

To study with friends outside this computer, deploy the **entire Node app** to an HTTPS host with persistent writable storage. Configure `HOST=0.0.0.0` and `PORT` for your hosting environment, and share the hosted URL. A loopback address such as `127.0.0.1` only works on your own machine. **GitHub Pages alone hosts only static files** and cannot operate this shared leaderboard; scores will not sync on a Pages-only deployment. The service is suitable for small, trusted study groups and is not a proctored or cheating-resistant exam system.

## Layout

- `app.js`, `index.html`, `*.css`: application and interface.
- `community.js`, `community.css`, `group-api.cjs`: study group UI, shared scoreboard API, and server-side scoring.
- `data/`: prepared question banks, practice sets and study guide.
- `sources/`: source materials and bundled offline assets required by the app.
- `tools/`: content preparation and validation scripts.
- `_qa/*.cjs`: browser checks; SHL checks require Google Chrome on Windows.

Backups, browser profiles, screenshots, logs, downloaded archives and nested Git metadata are excluded from version control.

## Content sources and attribution

This repository incorporates materials from:

- AI20K Exam Prep: https://hieubui2409.github.io/ai20k-exam-prep/
- Vin20K AI Phase 1 Quiz: https://vin20k-ai-phase1-quiz.vercel.app/
- Hirin AI Quiz: https://hirin.github.io/AI-Quiz/

Original content and bundled third-party libraries remain subject to their respective owners' terms and licenses. No blanket license is asserted over those materials. Preserve upstream attribution and library notices.

SHL-style questions are independently authored practice material, not official SHL or Techcombank assessments. External links are references, not endorsements or proof of the actual exam structure.
