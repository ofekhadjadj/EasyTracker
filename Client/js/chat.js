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
  if (CurrentUser.image) $(".avatar-img").attr("src", CurrentUser.image);

  // 1. Load team avatars
  loadProjectTeam(CurrentProject.ProjectID, CurrentUser.id);

  // 2. Immediate badge–update + polling every 5 seconds
  updateUnreadBadges();
  setInterval(updateUnreadBadges, 5000);

  // Chat send handlers
  $("#sendMessageBtn").on("click", sendMessage);
  $("#chatText").on("keypress", function (e) {
    if (e.which === 13) sendMessage();
  });

  // Polling: every 3 seconds, reload if a chat is active
  setInterval(() => {
    if ($(".chat-avatar.active").length) {
      loadChatMessages();
    }
  }, 3000);
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
        <img src="${imageUrl}" alt="${name}" />
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

    // איתחול מחדש של הצ'אט כדי לטעון אותו מה־API
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

// Load messages for selected chat, with differential DOM updates
function loadChatMessages() {
  const projectID = CurrentProject.ProjectID;
  const isGroup = selectedReceiverId === null;
  const chatTitle = isGroup
    ? "צ'אט קבוצתי"
    : `צ'אט עם ${$(".chat-avatar.active span").text()}`;

  $("#chat-container .chat-title").text(chatTitle);

  // סימון קריאה תמידית לפני שליפת ההודעות
  if (isGroup) {
    // קבוצתי
    $.post(
      `https://localhost:7198/api/Chat/MarkGroupAsRead?userID=${CurrentUser.id}&projectID=${projectID}`
    ).always(() => {
      updateUnreadBadges();
    });
  } else {
    // פרטי
    $.post(
      `https://localhost:7198/api/Chat/MarkPrivateAsRead?userID=${CurrentUser.id}&otherUserID=${selectedReceiverId}&projectID=${projectID}`
    ).always(() => {
      updateUnreadBadges();
    });
  }

  // עכשיו נטען את ההודעות
  const url = isGroup
    ? `https://localhost:7198/api/Chat/GetGroupChat?projectID=${projectID}`
    : `https://localhost:7198/api/Chat/GetPrivateChat?userID1=${CurrentUser.id}&userID2=${selectedReceiverId}&projectID=${projectID}`;

  $.getJSON(url, function (messages) {
    const $container = $("#chat-messages");

    // רענון מלא בפעם הראשונה או אחרי החלפת שיחה
    if (hasSwitchedChat || lastMessageCount === 0) {
      $container.empty();
      messages.forEach((msg) => appendMessage(msg, $container));
    } else {
      // הוספת הודעות חדשות בלבד
      for (let i = lastMessageCount; i < messages.length; i++) {
        appendMessage(messages[i], $container);
      }
    }

    // גלילה לסוף
    $container.scrollTop($container[0].scrollHeight);

    // עדכון הספירה וסימון שאין מעבר שיחה
    lastMessageCount = messages.length;
    hasSwitchedChat = false;
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

function updateUnreadBadges() {
  const url = `https://localhost:7198/api/Chat/GetUnreadStatus?userID=${CurrentUser.id}&projectID=${CurrentProject.ProjectID}`;

  $.getJSON(url, (status) => {
    // –––––– קבוצתי ––––––
    const $group = $("#chat-avatars .group-avatar");
    if (selectedReceiverId === null) {
      // אם אנחנו כבר בצ'אט קבוצתי, נסיר כל badge
      $group.removeClass("unread");
    } else {
      // אחרת, נראה אם יש הודעות חדשות
      $group.toggleClass("unread", status.groupUnreadCount > 0);
    }

    // –––––– פרטי ––––––
    status.private.forEach((p) => {
      const $av = $(`.chat-avatar[data-userid=${p.otherUserID}]`);
      if (selectedReceiverId === p.otherUserID) {
        // אם אנחנו בצ'אט הזה כרגע, אין נקודה
        $av.removeClass("unread");
      } else {
        // אחרת, הוסף/הסר לפי מצב השרת
        $av.toggleClass("unread", p.unreadCount > 0);
      }
    });
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
