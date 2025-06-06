// js/project-unread-checker.js - Check for unread messages on project page

// Function to check and update unread status for chat button
function checkUnreadMessages() {
  const CurrentProject = JSON.parse(localStorage.getItem("CurrentProject"));

  if (!CurrentProject || !CurrentProject.ProjectID) {
    return;
  }

  const projectID = CurrentProject.ProjectID;
  const unreadKey = `projectUnread_${projectID}`;
  const unreadStatus = JSON.parse(localStorage.getItem(unreadKey) || "{}");

  // Find the chat button on the page
  const $chatButton = $(".gradient-button-header-chat");

  if ($chatButton.length === 0) {
    console.log("❓ Chat button not found on this page");
    return;
  }

  // More detailed logging
  console.log("🔍 Checking unread status for project:", projectID);
  console.log("📊 Unread data:", unreadStatus);
  console.log("⏰ Last update:", unreadStatus.lastUpdate);

  // Check if data is recent (within last 30 seconds for better real-time)
  const lastUpdate = unreadStatus.lastUpdate
    ? new Date(unreadStatus.lastUpdate)
    : new Date(0);
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
  const isDataRecent = lastUpdate > thirtySecondsAgo;

  console.log(
    `📅 Data freshness: ${
      isDataRecent ? "Fresh" : "Stale"
    } (${lastUpdate.toLocaleTimeString()})`
  );

  // Rule #1: Show green dot on project page chat button when there are unread messages
  if (unreadStatus.hasUnread && (isDataRecent || unreadStatus.hasUnread)) {
    $chatButton.addClass("unread");
    console.log(
      "🔔 [RULE #1] Chat button marked as unread - has unread messages"
    );
  } else {
    $chatButton.removeClass("unread");
    console.log(
      `✅ [RULE #1] Chat button marked as read (hasUnread: ${unreadStatus.hasUnread}, fresh: ${isDataRecent})`
    );
  }
}

// Function to periodically check for updates
function startUnreadChecker() {
  // Check immediately
  checkUnreadMessages();

  // Check every 5 seconds for better real-time response
  setInterval(checkUnreadMessages, 5000);

  console.log("📡 Started unread message checker for project page");
}

// Start checking when DOM is ready
$(document).ready(function () {
  // Start the checker if we're on a project page
  if (
    window.location.pathname.includes("project") ||
    window.location.pathname.includes("team") ||
    $(".gradient-button-header-chat").length > 0
  ) {
    setTimeout(startUnreadChecker, 1000); // Small delay to ensure everything is loaded
  }
});

// Function to manually refresh unread status (can be called from other scripts)
window.refreshUnreadStatus = checkUnreadMessages;

// Listen for storage changes from other tabs/windows
window.addEventListener("storage", function (e) {
  if (e.key && e.key.startsWith("projectUnread_")) {
    console.log("📨 Unread status updated from another tab");
    checkUnreadMessages();
  }
});
