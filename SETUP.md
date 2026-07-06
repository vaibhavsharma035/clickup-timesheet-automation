# Setup Guide

## 1. Get your ClickUp API Token

1. ClickUp → click your avatar (bottom-left) → **Settings** → **Apps**.
2. Under "API Token", click **Generate** (or **Copy** if one exists).
3. Copy the token (starts with `pk_`) somewhere temporary.

## 2. Create the Google Sheet

1. Create a new Google Sheet.
2. Rename the first tab to `Timesheet`. Add these headers to row 1:
   ```
   User | Project | Department | Description | Tags | Billable | Date | Start Time | End Time | Duration | ClickUp Task ID | Time Entry ID | Task URL | Status | Last Sync | Updated At
   ```
3. Hide columns K–P (ClickUp Task ID through Updated At).
4. Add a second tab named `Settings` with columns `Key` / `Value`, and fill in:

   | Key | Value |
   |---|---|
   | WORKSPACE_ID | *(leave blank)* |
   | USER_ID | *(leave blank)* |
   | USER_NAME | Your Name |
   | TIMEZONE | Asia/Kolkata |
   | SHEET_NAME | Timesheet |
   | COMPLETED_STATUS | complete |
   | SYNC_LIMIT | 100 |
   | DEPARTMENT_DEFAULT | Your Department |
   | TAGS_DEFAULT | Client Feedback |
   | BILLABLE_DEFAULT | Yes |
   | TOTAL_WORKING_HOURS | 8 |
   | REPORT_DATE | *(leave blank)* |

5. Click the empty `REPORT_DATE` value cell → **Data → Data validation** →
   Criteria: **Date** → **is valid date** → **Done**. This turns the cell
   into a native calendar picker.

## 3. Add the script files

1. Extensions → Apps Script.
2. Create each file listed in `src/` (matching names) and paste in its contents.
3. Save (Ctrl+S).

## 4. Authorize and set your token

1. Reload the Google Sheet tab. An **Automation** menu should appear.
2. **Automation → Set ClickUp Token** → approve the authorization prompts →
   paste your token when asked.

## 5. Discover your Workspace ID and User ID

1. In the Apps Script editor, select `Main_discoverWorkspaceAndUserIds`
   from the function dropdown and click **Run**.
2. **View → Logs** (Ctrl+Enter). Copy the Workspace ID and User ID shown.
3. Paste both into the `Settings` sheet.

## 6. Test the sync

1. Log some time on a task in ClickUp today (timer or "Add time").
2. **Automation → Sync My Tasks**.
3. Confirm a new row appears in `Timesheet` with everything filled in
   except `Project` — fill that in manually.

## 7. Test the report

1. **Automation → Generate Daily Report** (today), or set the
   `REPORT_DATE` cell in Settings and run
   **Automation → Generate Report for Selected Date**.
2. Copy the generated text from the popup.

## Daily use going forward

1. Log time in ClickUp.
2. **Sync My Tasks**.
3. Fill in `Project` for any new rows.
4. **Generate Daily Report** → copy into your email.
