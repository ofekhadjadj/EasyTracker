// js/chat-firebase.js - Firebase-based Chat System for Easy Tracker

// Import Firebase modules (using modern ES6 imports)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  and,
  or,
  getDocs,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Import Firebase configuration
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
let app, db;

try {
  // Check if firebaseConfig is properly set
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
    throw new Error(
      "Firebase configuration not set. Please update js/firebase-config.js with your Firebase project settings."
    );
  }

  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("✅ Firebase initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization failed:", error.message);
  alert(
    "שגיאה: הגדרות Firebase לא נקבעו. אנא עדכן את הקובץ js/firebase-config.js"
  );
}

// Global variables
let CurrentUser = JSON.parse(localStorage.getItem("user"));
let CurrentProject = JSON.parse(localStorage.getItem("CurrentProject"));
let selectedReceiverId = null; // null = group chat
let messagesListener = null; // To store the current Firestore listener

// Initialize chat system when DOM is ready
$(document).ready(function () {
  // Check if Firebase is properly initialized
  if (!db) {
    console.error("Firebase not initialized, cannot start chat system");
    return;
  }

  // Check if user and project data exists
  if (
    !CurrentUser ||
    !CurrentUser.id ||
    !CurrentProject ||
    !CurrentProject.ProjectID
  ) {
    console.error("Missing user or project data");
    alert("שגיאה: נתוני המשתמש או הפרויקט חסרים. אנא התחבר מחדש.");
    return;
  }

  // Initialize user interface
  $("#menu-prof-name").text(CurrentUser.firstName);
  $(".avatar-img").attr(
    "src",
    CurrentUser.image || "./images/def/user-def.png"
  );

  // Load project team avatars
  loadProjectTeam(CurrentProject.ProjectID, CurrentUser.id);

  // Set up chat message handlers
  $("#sendMessageBtn").on("click", sendMessage);
  $("#chatText").on("keypress", function (e) {
    if (e.which === 13) sendMessage();
  });

  // Mark chat as read when user interacts with the chat area
  $("#chat-messages").on("scroll click", function () {
    if (selectedReceiverId !== undefined) {
      const chatId = getChatId(selectedReceiverId, CurrentProject.ProjectID);
      updateLastReadTime(chatId);
    }
  });

  // Also mark as read when user types
  $("#chatText").on("focus input", function () {
    if (selectedReceiverId !== undefined) {
      const chatId = getChatId(selectedReceiverId, CurrentProject.ProjectID);
      updateLastReadTime(chatId);
    }
  });

  // Update unread badges initially and every 10 seconds for real-time responsiveness
  setTimeout(updateUnreadBadges, 2000); // Initial delay to let avatars load
  setInterval(updateUnreadBadges, 10000); // Update every 10 seconds for better real-time experience
});

// Load project team avatars (keeping existing functionality)
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

// Create avatar element with click handler
function createAvatar(type, name, imageUrl, userId) {
  let avatarHtml;

  if (type === "group") {
    // Group chat avatar (blue circle with text)
    avatarHtml = `
      <div class="chat-avatar group-avatar" data-userid="" title="${name}">
        <div class="circle-wrapper">
          <div class="group-label">צ׳אט קבוצתי</div>
        </div>
        <span></span>
      </div>
    `;
  } else {
    // Private chat avatar (regular circle with image and name)
    avatarHtml = `
      <div class="chat-avatar" data-userid="${userId}" title="${name}">
        <img src="${imageUrl || "./images/def/user-def.png"}" alt="${name}" />
        <span>${name.split(" ")[0]}</span>
      </div>
    `;
  }

  const avatar = $(avatarHtml);

  // Handle avatar click to switch chat
  avatar.on("click", function () {
    // Remove unread badge on click
    $(this).removeClass("unread");

    // Select this chat
    $(".chat-avatar").removeClass("active");
    $(this).addClass("active");
    selectedReceiverId = userId;

    // Switch to new chat and start listening for messages
    switchToChat();
  });

  return avatar;
}

// Switch to selected chat and set up Firestore listener
function switchToChat() {
  const isGroup = selectedReceiverId === null;
  const chatTitle = isGroup
    ? "צ'אט קבוצתי"
    : `צ'אט עם ${$(".chat-avatar.active span").text()}`;

  $("#chat-container .chat-title").text(chatTitle);

  // Clear previous messages when switching chats
  $("#chat-messages").empty();

  // Remove existing listener if any
  if (messagesListener) {
    messagesListener(); // This unsubscribes the listener
    messagesListener = null;
  }

  // Small delay to ensure cleanup is complete
  setTimeout(() => {
    // Set up new Firestore listener for real-time messages
    setupMessageListener();

    // DON'T immediately mark as read - let user actually see the messages first
    // We'll mark as read when updateUnreadBadges runs and detects we're in this chat

    // Update badges after switching chat (this will mark current chat as read if needed)
    setTimeout(() => {
      updateUnreadBadges();
    }, 500); // Give time for messages to load
  }, 100);
}

// Set up Firestore listener for real-time message updates
function setupMessageListener() {
  const projectID = CurrentProject.ProjectID;
  const isGroup = selectedReceiverId === null;

  let messagesQuery;

  if (isGroup) {
    // Group chat: get messages where receiverUserID is null and projectID matches
    // Using simpler query without orderBy to avoid index requirements
    messagesQuery = query(
      collection(db, "messages"),
      where("projectID", "==", projectID),
      where("receiverUserID", "==", null)
    );
  } else {
    // Private chat: get all messages for this project and filter in JavaScript
    // This avoids complex OR queries that need indexes
    messagesQuery = query(
      collection(db, "messages"),
      where("projectID", "==", projectID)
    );
  }

  // Set up real-time listener
  messagesListener = onSnapshot(
    messagesQuery,
    (snapshot) => {
      const $container = $("#chat-messages");

      // Check if this is the first load (container is empty)
      const isFirstLoad = $container.children().length === 0;

      if (isFirstLoad) {
        // Initial load: add all existing messages
        let messages = snapshot.docs.map((doc) => doc.data());

        // Filter messages based on chat type
        console.log(
          "🔍 Filtering messages for chat type:",
          isGroup ? "Group" : "Private"
        );
        console.log("📊 Total messages received:", messages.length);

        if (!isGroup) {
          // Private chat: filter messages between current user and selected user
          console.log(
            "👤 Filtering for private chat between:",
            CurrentUser.id,
            "and",
            selectedReceiverId
          );
          messages = messages.filter((msg) => {
            const isMatch =
              (msg.senderUserID === CurrentUser.id &&
                msg.receiverUserID === selectedReceiverId) ||
              (msg.senderUserID === selectedReceiverId &&
                msg.receiverUserID === CurrentUser.id);
            if (isMatch) {
              console.log("✅ Message matches private chat filter:", msg);
            }
            return isMatch;
          });
        } else {
          // Group chat: filter messages where receiverUserID is null
          console.log("👥 Filtering for group chat");
          messages = messages.filter((msg) => {
            const isMatch = msg.receiverUserID === null;
            if (isMatch) {
              console.log("✅ Message matches group chat filter:", msg);
            }
            return isMatch;
          });
        }

        console.log("📋 Filtered messages count:", messages.length);

        // Sort messages by timestamp in JavaScript since we removed orderBy from query
        messages.sort((a, b) => {
          const timeA = a.sentAt
            ? a.sentAt.toDate
              ? a.sentAt.toDate()
              : new Date(a.sentAt)
            : new Date(0);
          const timeB = b.sentAt
            ? b.sentAt.toDate
              ? b.sentAt.toDate()
              : new Date(b.sentAt)
            : new Date(0);
          return timeA - timeB;
        });

        messages.forEach((message) => {
          appendMessage(message, $container);
        });

        // Scroll to bottom after initial load
        $container.scrollTop($container[0].scrollHeight);
      } else {
        // Subsequent updates: only add new messages
        snapshot.docChanges().forEach((change) => {
          const message = change.doc.data();

          if (change.type === "added") {
            // Check if this message belongs to current chat
            let shouldShow = false;

            if (isGroup) {
              // Group chat: show if receiverUserID is null
              shouldShow = message.receiverUserID === null;
            } else {
              // Private chat: show if message is between current user and selected user
              shouldShow =
                (message.senderUserID === CurrentUser.id &&
                  message.receiverUserID === selectedReceiverId) ||
                (message.senderUserID === selectedReceiverId &&
                  message.receiverUserID === CurrentUser.id);
            }

            if (shouldShow) {
              // Only add new messages to avoid duplicates
              appendMessage(message, $container);

              // Scroll to bottom for new messages
              $container.scrollTop($container[0].scrollHeight);
            } else {
              // Message is not for current chat - this means there's a new unread message
              // RULE #3: Update badges immediately to show green dots in real-time
              console.log(
                "📨 [RULE #3] New message received for different chat, updating badges in real-time"
              );
              updateUnreadBadges();
            }
          }
          // Handle modified and removed changes if needed in the future
          // if (change.type === "modified") { ... }
          // if (change.type === "removed") { ... }
        });
      }
    },
    (error) => {
      console.error("Error listening to messages:", error);
      alert("שגיאה בטעינת הודעות: " + error.message);
    }
  );
}

// Append a single message to the chat container
function appendMessage(msg, $container) {
  const isMine = msg.senderUserID === CurrentUser.id;

  // Convert Firestore timestamp to JavaScript Date
  let displayTime = "";
  if (msg.sentAt) {
    const timestamp = msg.sentAt.toDate
      ? msg.sentAt.toDate()
      : new Date(msg.sentAt);
    displayTime = timestamp.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  $container.append(`
    <div class="chat-message ${isMine ? "mine" : "theirs"}">
      <div class="sender-name">${msg.senderName}</div>
      <div class="text">${msg.messageText}</div>
      <div class="timestamp">${displayTime}</div>
    </div>
  `);
}

// Send a new message to Firestore
async function sendMessage() {
  const text = $("#chatText").val().trim();
  if (!text) return;

  // Prepare message data
  const messageData = {
    senderUserID: CurrentUser.id,
    receiverUserID: selectedReceiverId, // null for group chat
    projectID: CurrentProject.ProjectID,
    senderName: `${CurrentUser.firstName} ${CurrentUser.lastName}`,
    messageText: text,
    sentAt: serverTimestamp(), // Use server timestamp for consistency
  };

  // Debug logging
  console.log("Sending message with data:", {
    ...messageData,
    sentAt: "serverTimestamp()",
  });
  console.log(
    "Current chat type:",
    selectedReceiverId === null ? "Group" : "Private"
  );
  console.log("Selected receiver ID:", selectedReceiverId);

  try {
    // Add message to Firestore
    await addDoc(collection(db, "messages"), messageData);

    // Clear input field
    $("#chatText").val("");

    // Mark current chat as read (since user just sent a message)
    const chatId = getChatId(selectedReceiverId, CurrentProject.ProjectID);
    updateLastReadTime(chatId);

    console.log("✅ Message sent successfully to Firestore");
  } catch (error) {
    console.error("❌ Error sending message:", error);
    alert("שליחת ההודעה נכשלה: " + error.message);
  }
}

// Track when user last read each chat to implement proper unread system
let lastReadTimes = JSON.parse(localStorage.getItem("chatReadTimes") || "{}");

// Update last read time when switching chats or sending messages
function updateLastReadTime(chatId) {
  const now = new Date().toISOString();
  lastReadTimes[chatId] = now;
  localStorage.setItem("chatReadTimes", JSON.stringify(lastReadTimes));
  console.log(`⏰ Updated read time for ${chatId}: ${now}`);
}

// Get chat ID for tracking
function getChatId(receiverUserId, projectId) {
  if (receiverUserId === null) {
    return `group_${projectId}`;
  } else {
    // Ensure consistent ID regardless of who started the chat
    const ids = [CurrentUser.id, receiverUserId].sort();
    return `private_${ids[0]}_${ids[1]}_${projectId}`;
  }
}

// Update unread badges with proper read tracking
async function updateUnreadBadges() {
  if (!db) return;

  try {
    const projectID = CurrentProject.ProjectID;
    console.log("📊 Updating unread badges for project:", projectID);

    // Get all messages for this project at once
    const allMessagesQuery = query(
      collection(db, "messages"),
      where("projectID", "==", projectID)
    );

    const allMessagesSnapshot = await getDocs(allMessagesQuery);
    console.log("📨 Total messages found:", allMessagesSnapshot.size);

    // Check group chat unread
    const currentGroupChatId = getChatId(null, projectID);
    const lastGroupRead = lastReadTimes[currentGroupChatId]
      ? new Date(lastReadTimes[currentGroupChatId])
      : new Date(0);

    const unreadGroupMessages = allMessagesSnapshot.docs.filter((doc) => {
      const data = doc.data();
      if (data.receiverUserID !== null || data.senderUserID === CurrentUser.id)
        return false;

      const messageTime =
        data.sentAt && data.sentAt.toDate
          ? data.sentAt.toDate()
          : new Date(data.sentAt || 0);
      return messageTime > lastGroupRead;
    });

    const $groupAvatar = $("#chat-avatars .group-avatar");
    if (selectedReceiverId === null) {
      // Currently in group chat - mark as read and remove badge
      if (unreadGroupMessages.length > 0) {
        updateLastReadTime(currentGroupChatId);
        console.log(
          "✅ [RULE #2] Marked group chat as read - user is viewing it"
        );
      }
      $groupAvatar.removeClass("unread");
    } else {
      // Not in group chat - show badge if there are unread messages (RULE #2 & #3)
      const hasUnread = unreadGroupMessages.length > 0;
      $groupAvatar.toggleClass("unread", hasUnread);
      if (hasUnread) {
        console.log(
          "🔔 [RULE #2/#3] Group chat has unread messages - showing green dot"
        );
      }
    }

    console.log(`👥 Group chat unread: ${unreadGroupMessages.length} messages`);

    // Check private chats unread
    const userAvatars = $(".chat-avatar[data-userid]").toArray();
    let hasAnyUnread = false;

    for (const avatarElement of userAvatars) {
      const $avatar = $(avatarElement);
      const otherUserId = parseInt($avatar.data("userid"));

      if (!otherUserId) continue;

      const privateChatId = getChatId(otherUserId, projectID);
      const lastPrivateRead = lastReadTimes[privateChatId]
        ? new Date(lastReadTimes[privateChatId])
        : new Date(0);

      const unreadPrivateMessages = allMessagesSnapshot.docs.filter((doc) => {
        const data = doc.data();

        // Only messages sent by the other user to current user
        if (
          data.senderUserID !== otherUserId ||
          data.receiverUserID !== CurrentUser.id
        )
          return false;

        const messageTime =
          data.sentAt && data.sentAt.toDate
            ? data.sentAt.toDate()
            : new Date(data.sentAt || 0);
        return messageTime > lastPrivateRead;
      });

      if (selectedReceiverId === otherUserId) {
        // Currently in this private chat - mark as read and remove badge
        if (unreadPrivateMessages.length > 0) {
          updateLastReadTime(privateChatId);
          console.log(
            `✅ [RULE #2] Marked private chat with ${otherUserId} as read - user is viewing it`
          );
        }
        $avatar.removeClass("unread");
      } else {
        // Not in this private chat - show badge if there are unread messages (RULE #2 & #3)
        const hasUnread = unreadPrivateMessages.length > 0;
        $avatar.toggleClass("unread", hasUnread);
        if (hasUnread) {
          hasAnyUnread = true;
          console.log(
            `🔔 [RULE #2/#3] Private chat with ${otherUserId} has unread messages - showing green dot`
          );
        }
      }

      console.log(
        `👤 Private chat with ${otherUserId}: ${unreadPrivateMessages.length} unread messages`
      );
    }

    // Calculate total unread status more accurately
    const hasGroupUnread = unreadGroupMessages.length > 0;
    const hasTotalUnread = hasGroupUnread || hasAnyUnread;

    console.log(
      `🔔 [SUMMARY] Unread status: Group: ${hasGroupUnread} (${unreadGroupMessages.length}), Private: ${hasAnyUnread}, Total: ${hasTotalUnread}`
    );
    console.log(
      `📊 [RULES CHECK] Rule #1 (Project page): ${
        hasTotalUnread ? "Show green dot" : "No dot"
      }`
    );
    console.log(
      `📊 [RULES CHECK] Rule #2 (Chat page): Green dots on ${
        (hasGroupUnread ? 1 : 0) + (hasAnyUnread ? "multiple" : 0)
      } chats`
    );
    console.log(
      `📊 [RULES CHECK] Rule #3 (Real-time): Updates triggered by new messages`
    );

    // Store unread status for project page
    const projectUnreadStatus = {
      hasUnread: hasTotalUnread,
      groupUnread: hasGroupUnread,
      privateUnread: hasAnyUnread,
      lastUpdate: new Date().toISOString(),
    };

    localStorage.setItem(
      `projectUnread_${projectID}`,
      JSON.stringify(projectUnreadStatus)
    );
  } catch (error) {
    console.error("❌ Error updating unread badges:", error);
  }
}

// Cleanup function to remove listeners when leaving the page
window.addEventListener("beforeunload", function () {
  if (messagesListener) {
    messagesListener();
  }

  // Final update of unread badges before leaving
  updateUnreadBadges();
});

// Export functions for external use if needed
window.chatFirebase = {
  sendMessage,
  updateUnreadBadges,
  switchToChat,
};
