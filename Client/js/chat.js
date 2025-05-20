// js/chat.js

let CurrentUser = JSON.parse(localStorage.getItem("user"));
let CurrentProject = JSON.parse(localStorage.getItem("CurrentProject"));

let selectedReceiverId = null; // null = group chat

$(document).ready(function () {
  // Initialization and user info
  if (
    !CurrentUser ||
    !CurrentUser.id ||
    !CurrentProject ||
    !CurrentProject.ProjectID
  )
    return;
  $("#menu-prof-name").text(CurrentUser.firstName);
  if (CurrentUser.image) $(".avatar-img").attr("src", CurrentUser.image);

  // Load team avatars
  loadProjectTeam(CurrentProject.ProjectID, CurrentUser.id);

  // Chat send handlers
  $("#sendMessageBtn").on("click", sendMessage);
  $("#chatText").on("keypress", function (e) {
    if (e.which === 13) sendMessage();
  });

  // Pop-up handlers for editing user
  $("#edit-user-btn").on("click", function () {
    $.fancybox.open({
      src: "#edit-user-form",
      type: "inline",
      opts: {
        touch: false,
        autoFocus: false,
        closeExisting: true,
        animationEffect: "fade",
      },
    });
  });

  $("#open-password-popup").on("click", function () {
    $.fancybox.open({
      src: "#change-password-form",
      type: "inline",
      opts: {
        touch: false,
        autoFocus: false,
        closeExisting: true,
        animationEffect: "fade",
      },
    });
  });
});

// Load project team avatars based on role
function loadProjectTeam(projectId, currentUserId) {
  const url = `https://localhost:7198/api/Projects/GetProjectTeam?ProjectID=${projectId}`;
  $.getJSON(url, function (team) {
    const currentUser = team.find((u) => u.UserID === currentUserId);
    if (!currentUser) return;

    const isManager = currentUser.Role === "ProjectManager";
    let visibleUsers = team.filter(
      (u) =>
        u.UserID !== currentUserId && (isManager || u.Role === "ProjectManager")
    );

    const avatarContainer = $("#chat-avatars");
    avatarContainer.empty();

    // Group chat avatar
    avatarContainer.append(
      createAvatar("group", "שיחה קבוצתית", "./images/group.png", null)
    );

    // Private chat avatars
    visibleUsers.forEach((user) => {
      avatarContainer.append(
        createAvatar("user", user.FullName, user.Image, user.UserID)
      );
    });
  });
}

// Create an avatar element
function createAvatar(type, name, imageUrl, userId) {
  const avatar = $(`
    <div class="chat-avatar" title="${name}">
      <img src="${imageUrl}" alt="${name}" />
      <span>${name.split(" ")[0]}</span>
    </div>
  `);

  avatar.on("click", function () {
    $(".chat-avatar").removeClass("active");
    $(this).addClass("active");
    selectedReceiverId = userId;
    loadChatMessages();
  });

  return avatar;
}

// Load messages for selected chat
function loadChatMessages() {
  const projectID = CurrentProject.ProjectID;
  const chatTitle =
    selectedReceiverId === null
      ? "צ'אט קבוצתי"
      : `צ'אט עם ${$(".chat-avatar.active span").text()}`;
  $("#chat-container .chat-title").text(chatTitle);
  $("#chat-messages").empty();

  const url =
    selectedReceiverId === null
      ? `https://localhost:7198/api/Chat/GetGroupChat?projectID=${projectID}`
      : `https://localhost:7198/api/Chat/GetPrivateChat?userID1=${CurrentUser.id}&userID2=${selectedReceiverId}&projectID=${projectID}`;

  $.getJSON(url, function (messages) {
    messages.forEach((msg) => {
      const isMine = msg.senderUserID === CurrentUser.id;
      $("#chat-messages").append(`
        <div class="chat-message ${isMine ? "mine" : "theirs"}">
          <div class="sender-name">${msg.senderName}</div>
          <div class="text">${msg.messageText}</div>
          <div class="timestamp">${new Date(msg.sentAt).toLocaleTimeString(
            "he-IL",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )}</div>
        </div>
      `);
    });
    // Scroll to bottom
    $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);
  });
}

// Send a new message
function sendMessage() {
  const text = $("#chatText").val().trim();
  if (!text) return;

  const message = {
    senderUserID: CurrentUser.id,
    receiverUserID: selectedReceiverId,
    projectID: CurrentProject.ProjectID,
    messageText: text,
    sentAt: new Date().toISOString(),
    senderName: `${CurrentUser.firstName} ${CurrentUser.lastName}`,
  };

  $.ajax({
    url: "https://localhost:7198/api/Chat/SendMessage",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(message),
    success: () => {
      $("#chatText").val("");
      loadChatMessages();
    },
    error: (xhr) => {
      alert("שליחת ההודעה נכשלה:\n" + xhr.responseText);
    },
  });
}

// Highlight active sidebar link (from sidebar-active.js)
$(".main-nav a, .help-nav a").on("click", function () {
  $(".main-nav a, .help-nav a").removeClass("active");
  $(this).addClass("active");
});

// Stub handlers for edit-user.js forms
$("#user-details-form").on("submit", function (e) {
  e.preventDefault();
  // TODO: AJAX call to save user details
});

$("#user-password-form").on("submit", function (e) {
  e.preventDefault();
  // TODO: AJAX call to change password
});
