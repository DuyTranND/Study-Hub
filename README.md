# Study Hub

A local-first study workspace with an English interface and Vietnamese learning content. Includes question banks, timed practice, explanations, bookmarks, lessons, formula sheets, and SHL-style practice.

## Run locally

Requires Node.js 22 or newer. No dependency installation is needed.

```sh
node server.cjs
```

Open http://127.0.0.1:8768/ in your browser. On Windows, double-click `OPEN-LOCAL.cmd` (uses port 8771). Do not open `index.html` directly: question banks and assets require HTTP.

Progress is stored in browser localStorage and belongs to the particular origin/port. Changing ports does not automatically migrate progress.

## Layout

- `app.js`, `index.html`, `*.css`: application and interface.
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
