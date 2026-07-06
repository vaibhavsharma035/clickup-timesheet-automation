/**
 * Main.gs
 * ONE-TIME SETUP USE ONLY.
 *
 * Run Main_discoverWorkspaceAndUserIds() once after saving your ClickUp token
 * (Automation > Set ClickUp Token) to find your Workspace ID and User ID.
 * Check View > Logs (Ctrl+Enter) after running, then copy both values into
 * the Settings sheet (WORKSPACE_ID and USER_ID rows).
 *
 * This function is not used in normal day-to-day operation and can be safely
 * left in place or removed once setup is complete.
 */
function Main_discoverWorkspaceAndUserIds() {
  const teamData = ClickUp_getTeamsAndUser_();
  const userData = ClickUp_getCurrentUser_();

  Logger.log('--- Your Workspaces ---');
  teamData.teams.forEach(function(team) {
    Logger.log('Workspace: ' + team.name + '  |  Workspace ID: ' + team.id);
  });

  Logger.log('--- Your User ---');
  Logger.log('Username: ' + userData.user.username + '  |  User ID: ' + userData.user.id + '  |  Email: ' + userData.user.email);
}
