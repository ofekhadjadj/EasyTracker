$(document).ready(function () {
  const user = JSON.parse(localStorage.getItem("user"));
  const project = JSON.parse(localStorage.getItem("CurrentProject"));

  if (!user || !project) return;

  function checkChatNotifications() {
    $.getJSON(
      apiConfig.createApiUrl("Chat/GetUnreadStatus", {
        userID: user.id,
        projectID: project.ProjectID,
      }),
      (status) => {
        const hasGroup = status.groupUnreadCount > 0;
        const hasPrivate = status.private.some((p) => p.unreadCount > 0);

        if (hasGroup || hasPrivate) {
          $("#chat-unread-dot").show();
        } else {
          $("#chat-unread-dot").hide();
        }
      }
    );
  }

  checkChatNotifications();
  setInterval(checkChatNotifications, 5000); // בדיקה כל 5 שניות
});
