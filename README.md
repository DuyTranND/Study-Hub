# StudyHub

A local-first study workspace with an English interface and Vietnamese learning content. Includes question banks, timed practice, explanations, bookmarks, lessons and a shared leaderboard.

## Run locally

Requires Node.js 22 or newer. No dependency installation is needed.

```sh
node server.cjs
```

Open http://127.0.0.1:8768/ in your browser. On Windows, double-click `OPEN-LOCAL.cmd` (uses port 8771). Do not open `index.html` directly: question banks and assets require HTTP.

Anonymous progress is stored in this browser. Named profiles synchronize through the shared server as described below.

## Practice and code writing

Practice separates full exams into **ĐGNL** and **AI Test**; all six integrated mock exams are under ĐGNL. Questions are arranged in a continuous vertical list, with each prompt followed by its answer choices or writing field. On desktop, the list scrolls alongside the timer, early submission and numbered question navigator. Phone layouts use the same single-column question order. Answered questions and review flags are saved with the session. Unanswered objective questions count as incorrect when an exam is submitted early.

**Code tay** contains 14 Python, pandas, algorithm and SQL problems. Drafts save automatically, Tab inserts four spaces, and Escape then Tab leaves the editor. Reference solutions are available for comparison and self-assessment. The website does not execute code or award automatic scores for code-writing sessions. Ten complete reference functions and corrected complexity/API explanations were verified in the content review; `tools/content-corrections.cjs` keeps those reviewed edits reproducible without changing question IDs or answer keys.

## Shared profiles and leaderboard

Choose **Enter your name** in the top bar to open a profile. Names ignore case, extra spaces and Unicode compatibility differences. The same name opens the same shared profile on any browser using the same server. This is an intentionally shared name-only system, without passwords: anyone entering the name can view and change that profile. Use a different name for a separate profile.

Completed questions, bookmarks, answers, the current session and the last lesson are saved on the server. Browser caches are separate per profile ID. Pending changes remain cached for retry after a failed save. Anonymous progress stays on the device and is imported when creating a new profile. Changing names loads the selected profile rather than moving the previous person's progress.

Everyone can view **Leaderboard** without joining a group. Opening a named profile registers it on the shared board. Timed exams with at least 10 answered, automatically graded questions qualify. Each distinct correctly answered question earns one point per profile per week. Rankings have weekly (starting Monday in Vietnam) and all-time views; ties use accuracy and exam count. Practice progress cannot directly award leaderboard points.

The Node server (`server.cjs` + `group-api.cjs`) grades scores against the bundled question bank. The public board contains names, scores and recent exam summaries, without saved answers or full profile progress. Existing private group records remain separate.

The default persistent database is `storage/groups.json`, excluded from Git and blocked from HTTP. Set `STUDY_GROUP_STORE` to an absolute persistent path to move it. Back up this file before upgrading. The cloud API uses Redis compare-and-swap and merges changed answers and bookmark operations to preserve concurrent edits. Local and hosted databases are independent.

For access outside this computer, deploy the entire app to Vercel with Redis or an HTTPS Node host with writable persistent storage. `127.0.0.1` only works on the same computer; GitHub Pages alone cannot run the shared API.

## Deploy to Vercel (public HTTPS website)

1. Sign into [Vercel](https://vercel.com/new) with your GitHub account and **Import** `DuyTranND/Study-Hub`. Use the repository root, with **Framework Preset: Other**. `vercel.json` supplies the build command (`node build-vercel.cjs`), output directory (`dist`) and Node API function. Deploy; Vercel gives you a public `*.vercel.app` URL.
2. To enable shared profiles and leaderboard, open the new Vercel project's **Storage** or **Marketplace**, add an **Upstash Redis** database, and connect it to the project. Configure the *server-side* environment variables `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from the Upstash Redis REST connection details. The Vercel KV aliases `KV_REST_API_URL` / `KV_REST_API_TOKEN` also work. **Never** expose the Redis token in client scripts or variables prefixed `NEXT_PUBLIC_` / `VITE_`.
3. **Redeploy** after configuring storage. Open `https://YOUR-SITE.vercel.app/api/groups/status` to check for `{"enabled":true}` (the endpoint now verifies the Redis connection). Open the site and enter the same name in two separate browsers to verify restored progress. A Vercel deployment without Redis still serves the public quiz website, but returns `{"enabled":false,"reason":"not_configured"}` for shared scoring. If Redis is unreachable, the response instead has `"reason":"storage_unavailable"`.

Vercel Functions have no durable local filesystem. For the hosted version, `api/groups.mjs` stores the group database in Upstash Redis using an atomic compare-and-swap so concurrent submissions do not overwrite each other. Local `node server.cjs` continues storing groups in `storage/groups.json`; the two databases are independent. Browser caches are scoped to their origin. The same name restores progress across browsers using the same shared database.

The build publishes **only** public assets from `dist/` and excludes server code, test files and private storage. To check the hosted build locally, run `node build-vercel.cjs` and `node _qa/vercel-deploy-test.cjs`. Connecting the GitHub repository to Vercel enables deployments after future pushes to `main`.

## Layout

- `app.js`, `index.html`, `*.css`: application and interface.
- `community.js`, `community.css`, `group-api.cjs`: profile UI, shared progress and leaderboard API, and server-side scoring.
- `data/`: prepared question banks, practice sets and study guide.
- `sources/`: source materials and bundled offline assets required by the app.
- `tools/`: content preparation and validation scripts.
- `_qa/*.cjs`: browser checks using Google Chrome on Windows.

Backups, browser profiles, screenshots, logs, downloaded archives and nested Git metadata are excluded from version control.

## Content sources and attribution

This repository incorporates materials from:

- AI20K Exam Prep: https://hieubui2409.github.io/ai20k-exam-prep/
- Vin20K AI Phase 1 Quiz: https://vin20k-ai-phase1-quiz.vercel.app/
- Hirin AI Quiz: https://hirin.github.io/AI-Quiz/

Original content and bundled third-party libraries remain subject to their respective owners' terms and licenses. No blanket license is asserted over those materials. Preserve upstream attribution and library notices.


## Duplicate questions

The practice picker show one copy per question type and normalized prompt (including numbered scenario variants). Currently 563 duplicate entries are filtered, leaving 2,738 questions. Published mock IDs take priority. Imported files and the ID lookup remain intact so saved sessions still open. This filters repeated wording, not paraphrases. Run `node _qa/dedup-test.cjs` to verify the filter and published exam membership.
