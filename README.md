# ClickUp Timesheet Automation

A Google Apps Script automation that syncs logged ClickUp time entries into a
Google Sheet and generates a formatted daily work report — no third-party
platforms (n8n/Zapier/Make), just Apps Script + Sheets + the ClickUp REST API.

## How it works

```
ClickUp (you log time on a task)
        ↓
"Sync My Tasks" menu button
        ↓
Script fetches today's time entries for your ClickUp user
        ↓
Each entry becomes one row in the Timesheet sheet
        ↓
You manually fill in "Project" (client/project name)
        ↓
"Generate Daily Report" builds the formatted report text
```

Each row = one ClickUp time entry, deduplicated by ClickUp's own
**Time Entry ID**. The same task logged on different days creates separate
rows — nothing is ever overwritten.

## Files

| File | Responsibility |
|---|---|
| `Config.gs` | Reads/writes settings (Settings sheet + secure token storage) |
| `ClickUp.gs` | All communication with the ClickUp REST API |
| `Sheet.gs` | All reads/writes to the Timesheet sheet; owns dedup logic |
| `Helpers.gs` | Small pure formatting/date utilities |
| `Sync.gs` | Orchestrates ClickUp → Sheet row mapping |
| `Report.gs` | Builds the daily report text (today or a chosen date) |
| `Menu.gs` | The "Automation" menu and token-entry flow |
| `Main.gs` | One-time setup helper to discover Workspace/User IDs |
| `appsscript.json` | Apps Script project manifest |

## Setup

See [docs/SETUP.md](docs/SETUP.md) for the full step-by-step walkthrough,
from creating the sheet to your first sync.

## Sheet structure

**Timesheet** tab — visible columns:
`User | Project | Department | Description | Tags | Billable | Date | Start Time | End Time | Duration`

Hidden columns (tracking only):
`ClickUp Task ID | Time Entry ID | Task URL | Status | Last Sync | Updated At`

**Settings** tab — key/value pairs:
`WORKSPACE_ID, USER_ID, USER_NAME, TIMEZONE, SHEET_NAME, COMPLETED_STATUS, SYNC_LIMIT, DEPARTMENT_DEFAULT, TAGS_DEFAULT, BILLABLE_DEFAULT, TOTAL_WORKING_HOURS, REPORT_DATE`

The ClickUp API token is **not** stored in the sheet — it's kept in Apps
Script's Script Properties via the "Set ClickUp Token" menu item, so it's
never visible in a cell.

## Deploying this code to your Apps Script project

This repo is a source-of-truth mirror of the Apps Script project. Since
Apps Script doesn't read directly from GitHub, you have two options:

1. **Manual copy** — open each `.gs` file here and paste its contents into
   the matching file in the Apps Script editor (Extensions → Apps Script
   from your Google Sheet).
2. **[clasp](https://github.com/google/clasp)** (optional, for those
   comfortable with the command line) — Google's official CLI for pushing
   local files straight into an Apps Script project:
   ```bash
   npm install -g @google/clasp
   clasp login
   clasp clone <your-script-id>   # run once, inside src/
   clasp push                      # pushes local files to Apps Script
   ```

## License

Personal/internal use.
