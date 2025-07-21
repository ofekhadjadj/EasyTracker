// js/chat.js

let CurrentUser = JSON.parse(localStorage.getItem("user"));
let CurrentProject = JSON.parse(localStorage.getItem("CurrentProject"));

let selectedReceiverId = null; // null = group chat

// For differential loading to avoid flicker
let lastMessageCount = 0;
let hasSwitchedChat = false;

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
  $(".avatar-img").attr(
    "src",
    CurrentUser.image || "./images/def/user-def.png"
  );

  // עדכון פירורי לחם
  updateBreadcrumbs();

  // 1. Load team avatars (Firebase-based implementation needed)
  loadProjectTeam(CurrentProject.ProjectID, CurrentUser.id);

  // Chat send handlers
  $("#sendMessageBtn").on("click", sendMessage);
  $("#chatText").on("keypress", function (e) {
    if (e.which === 13) sendMessage();
  });
});

// Load project team avatars based on role (Firebase implementation needed)
function loadProjectTeam(projectId, currentUserId) {
  // TODO: Implement Firebase-based team loading
  const avatarContainer = $("#chat-avatars");
  avatarContainer.empty();

  // Group chat avatar
  avatarContainer.append(
    createAvatar("group", "שיחה קבוצתית", "./images/group.png", null)
  );

  // TODO: Load team members from Firebase and create their avatars
}

// Create an avatar element and handle click
function createAvatar(type, name, imageUrl, userId) {
  let avatarHtml;

  if (type === "group") {
    // עיגול כחול עם טקסט
    avatarHtml = `
  <div class="chat-avatar group-avatar" data-userid="" title="${name}">
    <div class="circle-wrapper">
      <div class="group-label">צ׳אט קבוצתי</div>
    </div>
    <span></span>
  </div>
`;
  } else {
    // עיגולים רגילים עם תמונה ושם
    avatarHtml = `
      <div class="chat-avatar" data-userid="${userId}" title="${name}">
        <img src="${imageUrl || "./images/def/user-def.png"}" alt="${name}" />
        <span>${name.split(" ")[0]}</span>
      </div>
    `;
  }

  const avatar = $(avatarHtml);

  avatar.on("click", function () {
    // הסרת הבאנדג' של unread בזמן לחיצה
    $(this).removeClass("unread");

    // בחירת השיחה
    $(".chat-avatar").removeClass("active");
    $(this).addClass("active");
    selectedReceiverId = userId;

    // איתחול מחדש של הצ'אט כדי לטעון אותו מפיירבייס
    lastMessageCount = 0;
    hasSwitchedChat = true;
    loadChatMessages();
  });

  return avatar;
}

// Append a single message to the container
function appendMessage(msg, $container) {
  const isMine = msg.senderUserID === CurrentUser.id;
  $container.append(`
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
}

// Load messages for selected chat (Firebase implementation needed)
function loadChatMessages() {
  const projectID = CurrentProject.ProjectID;
  const isGroup = selectedReceiverId === null;
  const chatTitle = isGroup
    ? "צ'אט קבוצתי"
    : `צ'אט עם ${$(".chat-avatar.active span").text()}`;

  $("#chat-container .chat-title").text(chatTitle);

  // TODO: Implement Firebase-based message loading and mark as read functionality
  const $container = $("#chat-messages");

  // Placeholder for Firebase implementation
  // This will be replaced with Firebase realtime listeners
}

// Send a new message (Firebase implementation needed)
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

  // TODO: Implement Firebase-based message sending
  $("#chatText").val("");

  // Placeholder - will be replaced with Firebase write operation
}

// Update unread badges (Firebase implementation needed)
function updateUnreadBadges() {
  // TODO: Implement Firebase-based unread status tracking
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

// פונקציה לעדכון פירורי לחם
function updateBreadcrumbs() {
  const breadcrumbElement = document.getElementById("breadcrumb-project-name");
  if (breadcrumbElement && CurrentProject) {
    const projectName = CurrentProject.ProjectName || "פרויקט";
    const clientName = CurrentProject.CompanyName || "";
    const breadcrumbText = clientName
      ? `${projectName} - ${clientName}`
      : projectName;

    breadcrumbElement.textContent = breadcrumbText;
  }
}
