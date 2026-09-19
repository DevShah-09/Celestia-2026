# Event portal setup

## Development

1. Configure `backend/.env` with `MONGODB_URI` and `JWT_SECRET`. Registration emails additionally require `EMAIL_USER` and `EMAIL_PASS`.
2. Install backend dependencies and start the API with `npm run dev` inside `backend`. Its default port is 3000.
3. Install frontend dependencies and run `npm run dev` inside `frontend`. Vite proxies `/api` to `http://127.0.0.1:3000`.

To use another API, copy `.env.example` to `.env.local` and set `VITE_BACKEND_URL` to its URL **including `/api`**. Set this variable during production builds when the frontend and backend have separate origins. Restart Vite after environment changes.

## Pages

- `/leaderboard`: real team scores, team-name/ID search, ten-second refresh, retry, empty and loading states. Previous scores remain visible if a refresh fails.
- `/login`: participant login by registered team name and numeric team ID.
- `/teamprogress`: signed-in team's score, per-game statistics, searchable games, and activity including deductions.
- `/admin/login`: administrator email/password login.
- `/admin`: server-verified admin profile, expired-session handling, and sign-out.
- `/admin/register`: authenticated team registration, downloadable QR code, and email-delivery status.
- `/admin/scoring`: game selection, team-ID verification, camera/image QR scanning, and explicit points award.
- `/admin/bulkupdate`: multiple score additions/deductions, optional game association, and per-team results. Successful rows are removed; failed rows remain for correction.

All organizer pages share a protected layout. It verifies the bearer token against `/admin/profile`, checks the current server role, and hides the forms if any authenticated request reports an expired session. The backend also checks that the account remains active with an organizer role.

QR scanning uses [html5-qrcode](https://scanapp.org/html5-qrcode-docs/). Camera scanning requires browser permission and HTTPS or localhost. Image upload is available as an alternative. A scan verifies the team; it does not automatically award points.

Registration remains successful if email delivery fails after the team was saved. Its response includes a QR download and `emailSent: false`, so the organizer can hand over the QR without registering again.

Team and admin sessions are separate and stored in browser session storage. They survive page reloads in the tab. Passwords are never stored. The existing participant API only identifies teams; it does not issue authentication tokens, and its progress endpoint remains public. Admin profile requests use the backend-issued bearer token.

## Validation

- `npm run build` in `frontend` builds the production bundle.
- `npm run test:e2e` in `frontend` runs Playwright against local Chrome with mocked API responses and a temporary Vite server on port 5178. Tests cover polling, searches, errors, both login flows, session expiry, progress, logout, mobile navigation, protected organizer routes, registration, scoring, real QR image decoding, and partial/all-failed bulk results.
- `npm test` in `backend` runs progress, bulk validation, and organizer-controller tests. Model calls and mail transport are stubbed; no live database or email is used.

Browser tests do not replace testing against a configured MongoDB and real registered accounts.
