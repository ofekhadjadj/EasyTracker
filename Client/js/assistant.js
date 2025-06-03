let assistantData = null;
let isLoading = false;

function getCurrentUser() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

$(document).ready(function () {
  initializeAssistant();
  setupEventListeners();
  loadUserProfile();
});

function initializeAssistant() {
  const user = getCurrentUser();
  if (!user || !user.id) {
    window.location.href = "login.html";
    return;
  }
  loadAssistantData(user.id);
}

function setupEventListeners() {
  $("#send-button").click(sendMessage);
  $("#chat-input").keypress(function (e) {
    if (e.which === 13 && !isLoading) {
      sendMessage();
    }
  });
  $(".profile-arrow").click(function () {
    $("#user-dropdown-menu").toggle();
  });
  $("#logout-btn").click(function () {
    localStorage.removeItem("user");
    sessionStorage.clear();
    window.location.href = "login.html";
  });
  $(document).click(function (e) {
    if (!$(e.target).closest(".profile").length) {
      $("#user-dropdown-menu").hide();
    }
  });
}

function loadUserProfile() {
  const user = getCurrentUser();
  $("#menu-prof-name").text(user?.firstName || "משתמש");
  if (user?.image) {
    $(".avatar-img").attr("src", user.image);
  }
}

function loadAssistantData(userId) {
  showLoading(true);
  addMessage("assistant", "טוען את הנתונים שלך... ⏳");
  ajaxCall(
    "GET",
    `https://localhost:7198/api/Reports/GetFullAssistantData?userId=${userId}`,
    "",
    function (response) {
      // עיבוד הנתונים מהשרת
      const processedData = {
        Projects: [],
        Clients: [],
        Sessions: response,
      };

      // איסוף פרויקטים ייחודיים
      const uniqueProjects = new Map();
      const uniqueClients = new Map();

      response.forEach((session) => {
        // הוספת פרויקט אם עוד לא קיים
        if (!uniqueProjects.has(session.ProjectID)) {
          uniqueProjects.set(session.ProjectID, {
            ProjectID: session.ProjectID,
            ProjectName: session.ProjectName,
            ProjectDescription: session.ProjectDescription,
            ProjectHourlyRate: session.ProjectHourlyRate,
            ProjectImage: session.ProjectImage,
            ProjectIsArchived: session.ProjectIsArchived,
            ProjectIsDone: session.ProjectIsDone,
            DurationGoal: session.DurationGoal,
            ClientID: session.ClientID,
          });
        }

        // הוספת לקוח אם עוד לא קיים
        if (!uniqueClients.has(session.ClientID)) {
          uniqueClients.set(session.ClientID, {
            ClientID: session.ClientID,
            CompanyName: session.CompanyName,
            ContactPerson: session.ContactPerson,
            ClientEmail: session.ClientEmail,
            ContactPersonPhone: session.ContactPersonPhone,
            OfficePhone: session.OfficePhone,
            ClientImage: session.ClientImage,
            ClientIsArchived: session.ClientIsArchived,
          });
        }
      });

      processedData.Projects = Array.from(uniqueProjects.values());
      processedData.Clients = Array.from(uniqueClients.values());

      assistantData = processedData;
      hideLoading();
      enableChat();
      updateWelcomeMessage();
    },
    function (error) {
      console.error("שגיאה בטעינת נתונים:", error);
      hideLoading();
      addMessage(
        "assistant",
        "אופס! נתקלתי בבעיה בטעינת הנתונים שלך. אנא נסה לרענן את הדף. 😔"
      );
    }
  );
}

function enableChat() {
  $("#chat-input").prop("disabled", false);
  $("#send-button").prop("disabled", false);
  $("#chat-input").focus();
}

function updateWelcomeMessage() {
  $(".message.assistant").last().remove();
  const projectsCount = assistantData?.Projects?.length || 0;
  const clientsCount = assistantData?.Clients?.length || 0;
  const welcomeMsg = `מעולה! הנתונים שלך נטענו בהצלחה 🎉\n\nאני רואה שיש לך ${projectsCount} פרויקטים ו-${clientsCount} לקוחות.\nמה תרצה לדעת?`;
  addMessage("assistant", welcomeMsg);
}

function sendMessage() {
  if (isLoading) return;
  const message = $("#chat-input").val().trim();
  if (!message) return;
  addMessage("user", message);
  $("#chat-input").val("");
  sendToGemini(message);
}

function sendToGemini(userQuestion) {
  if (!assistantData) {
    addMessage(
      "assistant",
      "עדיין לא סיימתי לטעון את הנתונים שלך. אנא המתן רגע... ⏳"
    );
    return;
  }
  isLoading = true;
  showTypingIndicator();

  // יצירת תיאור הנתונים בצורה מסודרת
  let dataDescription = "פרויקטים:\n";
  assistantData.Projects.forEach((project) => {
    const client = assistantData.Clients.find(
      (c) => c.ClientID === project.ClientID
    );
    dataDescription += `- ${project.ProjectName} (${
      project.ProjectDescription
    }) - ${project.ProjectHourlyRate}₪ לשעה - לקוח: ${
      client?.CompanyName || "לא ידוע"
    }\n`;
  });

  dataDescription += "\nלקוחות:\n";
  assistantData.Clients.forEach((client) => {
    dataDescription += `- ${client.CompanyName} (${client.ContactPerson}, ${client.ClientEmail})\n`;
  });

  dataDescription += "\nסשני עבודה:\n";
  assistantData.Sessions.forEach((session) => {
    const startDate = new Date(session.StartDate).toLocaleDateString("he-IL");
    const duration = calculateDuration(session.StartDate, session.EndDate);
    dataDescription += `- ${session.ProjectName} (${
      session.CompanyName
    }): ${duration} ב-${startDate} - ${
      session.SessionDescription || "ללא תיאור"
    }\n`;
  });

  const prompt = `
הנתונים של המשתמש הם:
${dataDescription}

השאלה שלי היא:
${userQuestion}

ענה בעברית בצורה ברורה ותמציתית. השתמש באימוג'ים כדי להפוך את התשובה לידידותית יותר.
אם השאלה לא קשורה לנתונים, הסבר בנימוס שאתה יכול לעזור רק עם מידע הקשור לפרויקטים, לקוחות ושעות עבודה.
`.trim();

  console.log("שולח לגמיני:", prompt);

  const requestData = JSON.stringify({ prompt: prompt });
  ajaxCall(
    "POST",
    "https://localhost:7198/api/Gemini/ask",
    requestData,
    function (response) {
      hideTypingIndicator();
      isLoading = false;
      if (response) {
        try {
          // אם התשובה היא JSON, ננסה לחלץ את הטקסט
          let responseText;
          if (typeof response === "string") {
            try {
              const jsonResponse = JSON.parse(response);
              // חילוץ הטקסט מהמבנה המורכב של התשובה
              responseText =
                jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text ||
                response;
            } catch {
              responseText = response;
            }
          } else {
            responseText =
              response.text || response.message || JSON.stringify(response);
          }

          // ניקוי הטקסט מסימנים מיותרים
          responseText = responseText
            .replace(/\\n/g, "\n") // החלפת \n בשורות חדשות
            .replace(/\*\*/g, "") // הסרת **
            .replace(/\*/g, "") // הסרת *
            .replace(/\\/g, "") // הסרת \
            .replace(/\{.*?\}/g, "") // הסרת כל מה שבין סוגריים מסולסלות
            .replace(/\[.*?\]/g, "") // הסרת כל מה שבין סוגריים מרובעות
            .replace(/"candidates":.*?"text":/g, "") // הסרת החלק של candidates
            .replace(/"role":"model".*?}/g, "") // הסרת החלק של role:model
            .replace(/"finishReason".*?}/g, "") // הסרת החלק של finishReason
            .replace(/"usageMetadata".*?}/g, "") // הסרת החלק של usageMetadata
            .replace(/"modelVersion".*?}/g, "") // הסרת החלק של modelVersion
            .replace(/"responseId".*?}/g, "") // הסרת החלק של responseId
            .replace(/[{}[\]]/g, "") // הסרת כל הסוגריים הנותרים
            .replace(/\s+/g, " ") // החלפת רווחים מרובים ברווח אחד
            .replace(/,+$/g, "") // הסרת פסיקים בסוף הטקסט
            .replace(/^,+/, "") // הסרת פסיקים בתחילת הטקסט
            .replace(/,+/g, ",") // החלפת פסיקים מרובים בפסיק אחד
            .trim();

          if (responseText) {
            addMessage("assistant", responseText);
          } else {
            addMessage(
              "assistant",
              "מצטער, לא הצלחתי להבין את השאלה. תוכל לנסח אותה אחרת? 🤔"
            );
          }
        } catch (error) {
          console.error("שגיאה בעיבוד התשובה:", error);
          addMessage(
            "assistant",
            "מצטער, לא הצלחתי להבין את השאלה. תוכל לנסח אותה אחרת? 🤔"
          );
        }
      } else {
        addMessage(
          "assistant",
          "מצטער, לא הצלחתי להבין את השאלה. תוכל לנסח אותה אחרת? 🤔"
        );
      }
    },
    function (error) {
      console.error("שגיאה בשליחה לגמיני:", error);
      hideTypingIndicator();
      isLoading = false;
      addMessage(
        "assistant",
        "אופס! נתקלתי בבעיה טכנית. אנא נסה שוב בעוד רגע. 😅"
      );
    }
  );
}

function createDataDescription() {
  if (!assistantData) return "אין נתונים זמינים.";
  let description = "";
  if (assistantData.Projects && assistantData.Projects.length > 0) {
    description += "פרויקטים:\n";
    assistantData.Projects.forEach((project) => {
      description += `- פרויקט \"${project.ProjectName}\" של לקוח \"${project.ClientName}\" בתעריף ${project.HourlyRate}₪ לשעה\n`;
    });
    description += "\n";
  }
  if (assistantData.Clients && assistantData.Clients.length > 0) {
    description += "לקוחות:\n";
    assistantData.Clients.forEach((client) => {
      description += `- לקוח \"${client.ClientName}\" (${client.Email})\n`;
    });
    description += "\n";
  }
  if (assistantData.Sessions && assistantData.Sessions.length > 0) {
    description += "סשני עבודה:\n";
    assistantData.Sessions.forEach((session) => {
      const sessionDate = new Date(session.StartTime).toLocaleDateString(
        "he-IL"
      );
      const duration = calculateDuration(session.StartTime, session.EndTime);
      description += `- ב-${sessionDate} עבדת ${duration} על פרויקט \"${session.ProjectName}\" של לקוח \"${session.ClientName}\"\n`;
    });
    description += "\n";
  }
  return description || "אין נתונים זמינים.";
}

function calculateDuration(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHours > 0) {
    return `${diffHours} שעות ו-${diffMinutes} דקות`;
  } else {
    return `${diffMinutes} דקות`;
  }
}

function addMessage(sender, text) {
  const messageClass = sender === "user" ? "message user" : "message assistant";
  const messageHtml = `<div class="${messageClass}">${text.replace(
    /\n/g,
    "<br>"
  )}</div>`;
  $("#chat-messages").append(messageHtml);
  scrollToBottom();
}

function showTypingIndicator() {
  const typingHtml =
    '<div class="message assistant typing-indicator" id="typing">העוזר כותב...</div>';
  $("#chat-messages").append(typingHtml);
  scrollToBottom();
}

function hideTypingIndicator() {
  $("#typing").remove();
}

function scrollToBottom() {
  const chatMessages = $("#chat-messages");
  chatMessages.scrollTop(chatMessages[0].scrollHeight);
}

function showLoading(show) {
  if (show) {
    $("#loading-indicator").show();
  } else {
    $("#loading-indicator").hide();
  }
}

function hideLoading() {
  $("#loading-indicator").hide();
}
