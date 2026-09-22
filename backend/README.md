# Celestia backend

## Run on Windows

Double-click `run-backend.cmd`, or run this from Command Prompt:

```cmd
cd "C:\Users\Dev Shah\Desktop\Celestia 2026\backend"
run-backend.cmd
```

The runner starts the API on port 3000 and applies the DNS workaround needed by the configured MongoDB Atlas `mongodb+srv` connection. It starts the server directly, so restart the runner after code changes.

## Run with automatic reload

```cmd
npm run dev
```

Use the runner when the Atlas connection reports `querySrv ECONNREFUSED`.

## MongoDB connection fails

The API starts listening only after MongoDB connects. Startup stops if no server
can be selected within 10 seconds, instead of accepting requests that time out.

1. In MongoDB Atlas, confirm your cluster is running.
2. Under Network Access / IP Access List, add your current public IP and wait for
   the entry to become active. Switching Wi-Fi or VPN can change your public IP.
3. Verify MONGODB_URI in backend/.env uses the correct cluster and database user.
4. Check whether your firewall or network blocks outbound MongoDB connections
   (usually TCP port 27017).
5. Run run-backend.cmd again. Expect MongoDB Connected before Server is running.

## Deployment and local email delivery

See [DEPLOYMENT.md](../DEPLOYMENT.md) for frontend/backend hosting settings.

Email credentials are optional. Without both EMAIL_USER and EMAIL_PASS, registration succeeds and its QR email remains pending. To send later, point local backend/.env at the same production database, add the email credentials, then run:

~~~sh
npm run emails:send -- --dry-run
npm run emails:send
~~~

This uses saved QR codes and skips sent teams. Historical teams without tracking and interrupted sends require review; see the deployment guide.
