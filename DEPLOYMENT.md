# Deploy Celestia with local QR email sending

## Backend (Node web service)

- Root directory: backend
- Install command: npm ci --omit=dev
- Start command: npm start
- Environment: NODE_ENV=production, MONGODB_URI, JWT_SECRET, FRONTEND_URL
- FRONTEND_URL is the deployed frontend origin, for example https://your-frontend.example.com (no trailing slash). Multiple allowed origins can be comma-separated.
- Use a long random JWT_SECRET and the production MongoDB database URI. Allow the backend host to connect to that database.
- The server uses the host's PORT environment variable (3000 by default).
- Omit EMAIL_USER and EMAIL_PASS. Registrations save their QR codes and pending email status without contacting Gmail.

## Frontend (static hosting)

- Root directory: frontend
- Install command: npm ci
- Build command: npm run build
- Output directory: dist
- Build environment: VITE_BACKEND_URL=https://your-backend.example.com/api
- Set the variable BEFORE building; rebuild after changing it.
- Serve index.html for client-side routes such as /admin/login. frontend/vercel.json already provides this for Vercel. Configure an equivalent SPA fallback on other hosts.
- Use HTTPS for both frontend and backend, including camera QR scanning.
- Never put database, JWT, or email secrets in frontend environment variables.

Deploy the backend and frontend, set their actual URLs in the above environment variables, and redeploy as needed. Log in with an admin account in the production database. Verify registration creates a team, shows pending delivery, and offers its QR download.

## Send queued emails from your laptop

In local backend/.env set MONGODB_URI to the EXACT same production database used above, plus EMAIL_USER and EMAIL_PASS (Gmail app password). Keep this file private. The backend server does not need to be running locally. Your laptop must have network access to the database and SMTP.

From the backend directory:

~~~sh
npm ci
npm run emails:send -- --dry-run
npm run emails:send
~~~

The dry run lists eligible team IDs without sending or updating records. The send command processes pending/failed teams once per run, uses their saved QR codes, and records successful delivery. Run it whenever you want to send new emails or retry failures. Successfully sent teams are skipped, even across repeated runs. When your laptop is off, registration still works and emails wait in the database.

## Existing teams and interrupted sends

Teams registered before email tracking was added have unknown delivery status and are excluded to avoid mailing them twice. After checking your sent mailbox, use your database administration tool to set emailStatus to pending for specific teams you want to email, or sent for teams already emailed. Do not re-register them.

A sending record can mean an active sender or an interrupted delivery. Stop the sender and check your sent mailbox before manually changing that record to sent or pending. Such records are deliberately not retried automatically: SMTP delivery and a database update cannot be one atomic operation. SMTP errors can also have ambiguous delivery outcomes; check your mailbox before retrying if a connection dropped during sending.

No email credentials are needed on the deployed backend. If you later add both credentials there, new registrations will attempt immediate delivery and track the result in the same database.
