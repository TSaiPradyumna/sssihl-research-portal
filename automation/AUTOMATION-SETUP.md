# Google Sheets automation — setup process

This turns your Google Sheet into the "backend" for two things:
1. Email alerts to a scholar + their supervisor + their HoD whenever a row is edited
   (with a special, more detailed email specifically for Seminar 1 / Seminar 2 / Colloquium date changes).
2. An "Activity Log" tab that records who edited what and when — this is how
   admin/deans get visibility without needing a real login system.

## Step 1 — Import the workbook

1. Go to Google Sheets → **File → Import → Upload** → choose `sssihl-sheets-automation.xlsx`.
2. Choose **"Insert new sheet(s)"** (not "Replace spreadsheet") if importing into an existing file,
   otherwise just let it create a new spreadsheet.
3. You should now have these tabs: `Read Me`, `Departments`, one tab per department (`DFNS`, `DMACS`, ...),
   `Faculty`, `Activity Log`.

## Step 2 — Replace the placeholder emails with real ones

Every scholar/supervisor email in the department tabs, and every faculty/HoD email in `Departments`
and `Faculty`, is currently a placeholder like `firstname.lastname@sssihl.edu.in` — **fake, for testing structure only.**

Before testing automation:
- In each department tab, fill in the real **Scholar Email** and **Supervisor Email** columns.
- In the `Departments` tab, fill in the real **HoD Email** for each department.
- You don't have to do all 10 departments before testing — just fill in real emails for
  **one department** first (I'd suggest DMACS since it's smallest to check), test the automation
  works, then roll out to the rest.

## Step 3 — Add the script

1. In the Google Sheet, go to **Extensions → Apps Script**.
2. Delete anything in the default `Code.gs` file that opens.
3. Paste in the entire contents of `Code.gs` (included alongside this file).
4. Click the **Save** icon (or Ctrl/Cmd+S).
5. Rename the project at the top (e.g. "SSSIHL Portal Automation") — optional, just for clarity.

## Step 4 — Install the trigger (one-time)

Apps Script edits made by *typing in the sheet* need an **installable trigger** — the code alone
won't run automatically until you do this once.

1. In the Apps Script editor, use the function dropdown near the top (▶ Run button area) and select **`setupTrigger`**.
2. Click **Run** (▶).
3. The first time, Google will ask you to **authorize** the script — click **Review permissions**,
   choose your account, click **Advanced → Go to (project name) (unsafe)** (this warning is
   normal for your own scripts — Google shows it because it's unverified, not because it's unsafe), then **Allow**.
   It needs permission to: read/modify the spreadsheet, and send email as you.
4. You should see "Trigger installed." in the execution log at the bottom.

You only need to do this once per spreadsheet, even if many people later edit it.

## Step 5 — Test it

1. Run **`sendTestEmail`** the same way (dropdown → select it → Run) to confirm you personally
   receive an email — this checks Gmail sending works before you test the real flow.
2. Open one department tab where you've filled in real emails.
3. Manually change a **Colloquium** date for one scholar.
4. Within a few seconds, the scholar, their supervisor, and the HoD (from `Departments`) should
   each get an email.
5. Check the **Activity Log** tab — a new row should appear recording the edit and who was emailed.
6. Try editing a different field (e.g. "Paper published") and confirm the general-update email
   goes out instead of the date-specific one.

## How it decides who to email

- **Scholar Email** and **Supervisor Email** come from that row, in the department tab you edited.
- **HoD Email** comes from the `Departments` tab, matched by which department tab you edited.
- If any of those three is blank or not a valid-looking email, it's silently skipped (no error) —
  so a scholar with no email on file just means the supervisor+HoD still get notified.

## Things worth knowing

- **Only single-cell edits trigger it.** If someone pastes a whole row or many cells at once,
  Google Sheets doesn't reliably give the "before" value for each cell, so the script intentionally
  skips multi-cell edits to avoid sending wrong/confusing emails. Ask people to edit one cell at a time
  for scheduling changes (which is the realistic case anyway).
- **Editing the header row, or a row with no Scholar Name, is ignored** — so adding/removing
  columns or working in a scratch row won't spam anyone.
- **`IGNORED_FIELDS`** at the top of `Code.gs` currently skips emails for the two long free-text
  columns ("Any other relevant details", "Contribution to research facility") to avoid noise —
  remove either from that list in the code if you want those watched too.
- **The script runs as whoever installed the trigger** (i.e., you). Emails will show as sent by
  your Google account, with `Session.getActiveUser().getEmail()` in the Activity Log showing who
  actually made the edit (this only works reliably if everyone editing the sheet has their own
  Google account with edit access — anonymous/link-based editors won't be identifiable).
- If you later want a **daily/weekly digest instead of one email per edit**, that's a small change
  (write to a queue instead of emailing immediately, then a time-based trigger sends a batch) —
  say the word when you're ready for that.

## Next automations (once this is tested and working)

We talked about a few more — happy to build these next once this one is confirmed working:
- Weekly summary email to admin/deans (scholar counts, papers published this week, inactive departments)
- Data-quality flags on the sheet itself (blank Programme, duplicate registration numbers)
- A combined "export everything" that zips all department tabs together
