# SSSIHL Research Portal

A React + Vite app to track PhD / Post-Doctoral research scholars and faculty
across the ten departments of SSSIHL.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Login IDs

Not listed here on purpose. See `CREDENTIALS.md` at the project root (kept out
of `src/`, so it is never bundled into the site) for the full list of working
login IDs and passwords.

Passwords and profile details can be changed inside the app (My Profile) and are
persisted in browser storage, so the new password works on the next login.

## Data

Bundled data lives as one CSV per department in `src/data/csv/` (scholars) and
`src/data/csv/faculty/` (faculty). Editing one of these files and rebuilding
(`npm run build`) is now enough for the change to show on the site — it's read
fresh on every load instead of being frozen into browser storage.

Use **Upload CSV** inside the app to add/replace a department's records without
touching the files at all. That upload is remembered only in the uploading
browser (`localStorage`) — to make it permanent for every visitor, use the
"Download current data as CSV" button on that page and replace the matching
file in `src/data/csv/` (or `src/data/csv/faculty/`), then rebuild/redeploy.

Downloads are also available as CSV or Excel from the Reports page.
