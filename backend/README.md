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
