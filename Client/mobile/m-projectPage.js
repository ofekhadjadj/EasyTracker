// Mobile Project Page JS - Using exact desktop logic

// Global variables
let CurrentProject = JSON.parse(localStorage.getItem("CurrentProject"));
let CurrentUser = JSON.parse(localStorage.getItem("user"));
let currentActiveSessionID = null;

// Timer variables
let seconds = 0;
let interval;
let isRunning = false;
let totalPastSeconds = 0;
let isProcessingToggle = false; // מונע לחיצות כפולות
let isProcessingStop = false; // מונע לחיצות כפולות על עצירה

// Check if user and project data exists
if (!CurrentUser || !CurrentProject) {
  console.warn("No user or project found, redirecting to projects page");
  window.location.href = "m-projects.html";
}

console.log("Current Project:", CurrentProject);
console.log("Current User:", CurrentUser);

// Mobile specific DOM elements
const timeDisplay = document.getElementById("time-display");
const toggleBtn = document.getElementById("start-pause-btn");
const toggleText = document.getElementById("timer-text");
const toggleIcon = document.getElementById("timer-icon");
const stopBtn = document.getElementById("stop-btn");

// Progress elements
const progressFill = document.getElementById("project-progress-fill");
const progressText = document.getElementById("project-progress-text");

// הגדרת יעד משך הפרויקט בשעות ביחס לבר ההתקדמות
const goalInSeconds = CurrentProject.DurationGoal * 3600 || 3600; // ברירת מחדל לשעה אם לא קיים

// Mobile menu functions
function toggleMobileMenu() {
  const mobileMenu = document.getElementById("mobileMenu");
  mobileMenu.classList.toggle("active");
}

function goBack() {
  window.location.href = "m-projects.html";
}

// Toast notification function for mobile
function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="toast-icon fas ${
      type === "success" ? "fa-check-circle" : "fa-exclamation-circle"
    }"></i>
    <span class="toast-message">${message}</span>
  `;

  toastContainer.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-50px)";
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Fill project details
function fillProjectDetails() {
  // Update page title and header
  document.getElementById("project-title").textContent =
    CurrentProject.ProjectName;
  document.getElementById("project-client").textContent =
    CurrentProject.CompanyName || "ללא לקוח";

  // Update progress information
  updateOverallProgress();

  // Update stats
  loadProjectStats();
}

// פונקציה לבדיקת סשן פעיל בעת טעינת הדף - EXACT COPY FROM DESKTOP
function checkActiveSessionOnPageLoad() {
  if (!CurrentUser || !CurrentProject) {
    console.log("🔍 אין משתמש או פרויקט נוכחי - לא בודק סשן פעיל");
    return;
  }

  const checkActiveSessionUrl = apiConfig.createApiUrl(
    "Session/CheckActiveSession",
    {
      userID: CurrentUser.id,
      projectID: CurrentProject.ProjectID,
    }
  );

  console.log("🔍 בודק אם יש סשן פעיל בעת טעינת הדף...");

  ajaxCall(
    "GET",
    checkActiveSessionUrl,
    "",
    (response) => {
      console.log("📊 תשובה מבדיקת סשן פעיל:", response);

      if (response.hasActiveSession && response.sessionData) {
        const sessionData = response.sessionData;
        let elapsedSeconds;

        // שמירת מזהה הסשן הפעיל
        currentActiveSessionID = sessionData.SessionID;

        if (sessionData.SessionStatus === "Active") {
          // סשן פעיל - חישוב זמן לפי StartDate
          const startTime = new Date(sessionData.StartDate);
          const currentTime = new Date();
          const elapsedMs = currentTime.getTime() - startTime.getTime();
          elapsedSeconds = Math.floor(elapsedMs / 1000);

          console.log(`⏰ סשן פעיל! עברו ${elapsedSeconds} שניות מההתחלה`);

          // התחל את הסטופר רק אם אין כבר interval
          if (!interval) {
            interval = setInterval(updateTime, 1000);
          }
          isRunning = true;
          if (toggleText) toggleText.textContent = "השהה";
          if (toggleIcon) toggleIcon.className = "fas fa-pause";
          console.log("▶️ הסטופר התחיל אוטומטית - סשן פעיל");
        } else if (sessionData.SessionStatus === "Paused") {
          // סשן מושהה - השתמש ב-DurationSeconds שנשמר
          elapsedSeconds = sessionData.DurationSeconds || 0;

          console.log(`⏸️ סשן מושהה! זמן שנשמר: ${elapsedSeconds} שניות`);

          // אל תתחיל את הסטופר
          isRunning = false;
          if (toggleText) toggleText.textContent = "המשך";
          if (toggleIcon) toggleIcon.className = "fas fa-play";
          console.log("⏸️ סשן מושהה - הסטופר לא פועל");
        }

        // עדכון הסטופר להתחיל מהזמן הנכון
        seconds = elapsedSeconds;

        // עדכון התצוגה
        const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");
        if (timeDisplay) timeDisplay.textContent = `${h}:${m}:${s}`;

        // עדכון בר ההתקדמות
        updateOverallProgress();

        console.log("✅ סטטוס הסשן הפעיל שוחזר בהצלחה!");
      } else {
        console.log("ℹ️ אין סשן פעיל - הכפתור יישאר במצב 'התחל'");
        // וידוא שהמשתנים מתאפסים
        currentActiveSessionID = null;
        seconds = 0;
        isRunning = false;
        if (toggleText) toggleText.textContent = "התחל";
        if (toggleIcon) toggleIcon.className = "fas fa-play";
      }

      // Update stop button state
      if (stopBtn) {
        stopBtn.disabled = !currentActiveSessionID;
      }
    },
    (xhr) => {
      console.error("❌ שגיאה בבדיקת סשן פעיל:", xhr);
    }
  );
}

// EXACT COPY FROM DESKTOP
function updateTime() {
  seconds++;

  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  if (timeDisplay) timeDisplay.textContent = `${h}:${m}:${s}`;

  // Update progress circle
  const progressRingCircle = document.querySelector(".progress-ring-circle");
  if (progressRingCircle) {
    const circumference = 2 * Math.PI * 50;
    const progress = (seconds % 3600) / 3600;
    progressRingCircle.style.strokeDashoffset = circumference * (1 - progress);
  }

  const progressTextElement = document.querySelector(".progress-text");
  if (progressTextElement) {
    const progressPercent = Math.min((seconds / goalInSeconds) * 100, 100);
    progressTextElement.textContent = `${Math.floor(progressPercent)}%`;
  }

  updateOverallProgress();
}

function updateOverallProgress() {
  const totalSeconds = totalPastSeconds + seconds; // כולל מה שרץ עכשיו
  const progressPercent = Math.min((totalSeconds / goalInSeconds) * 100, 100);

  if (progressFill) {
    progressFill.style.width = `${progressPercent}%`;
  }
  if (progressText) {
    progressText.textContent = `${Math.floor(progressPercent)}% הושלם`;
  }

  // צבע רקע
  if (progressFill) {
    if (progressPercent >= 90) {
      progressFill.style.background =
        "linear-gradient(to right, #ff4e50, #f00000)";
    } else if (progressPercent >= 80) {
      progressFill.style.background =
        "linear-gradient(to right, #ff9900, #ff6600)";
    } else {
      progressFill.style.background =
        "linear-gradient(to right, #00c6ff, #0072ff)";
    }
  }

  // Update hours text
  const hoursText = document.getElementById("project-hours-text");
  if (hoursText) {
    const totalHours = Math.floor(totalSeconds / 3600);
    const goalHours = CurrentProject.DurationGoal || 0;
    hoursText.textContent = `${totalHours} שעות מתוך ${goalHours}`;
  }
}

// 🟦 המרת זמן לשעון ישראל - EXACT COPY
function getLocalISOString() {
  const tzOffset = new Date().getTimezoneOffset() * 60000; // זמן מקומי מול UTC
  return new Date(Date.now() - tzOffset).toISOString();
}

// 🟦 כפתור הפעלה - EXACT COPY
function getLocalISOStringWithoutZ() {
  const now = new Date();

  // מחשב את ההפרש בין הזמן המקומי ל־UTC
  const localOffsetMs = now.getTimezoneOffset() * -60000;

  // מוסיף את ההפרש כדי להגיע לזמן מקומי אמיתי
  const localDate = new Date(now.getTime() + localOffsetMs);

  return localDate.toISOString().replace("Z", "");
}

// EXACT COPY FROM DESKTOP with mobile session data handling
function toggleTimer() {
  // מונע לחיצות כפולות
  if (isProcessingToggle) {
    console.log("⚠️ מעבד כבר לחיצה, מתעלם מלחיצה נוספת");
    return;
  }

  isProcessingToggle = true;
  // כפתור השהייה תוספת
  if (isRunning) {
    clearInterval(interval);
    interval = null;
    isRunning = false;
    if (toggleText) toggleText.textContent = "המשך";
    if (toggleIcon) toggleIcon.className = "fas fa-play";

    const durationSeconds = seconds;

    // במובייל אין לנו טבלה, אז נשתמש במזהה הסשן הפעיל
    if (!currentActiveSessionID) {
      console.error("❌ לא נמצא סשן פעיל לעדכון (Pause).");
      return;
    }

    const pausedSession = {
      sessionID: currentActiveSessionID,
      projectID: CurrentProject.ProjectID,
      durationSeconds: durationSeconds,
      status: "Paused",
    };

    console.log("⏸️ השהיית סשן | נשלח לשרת:", pausedSession);

    ajaxCall(
      "PUT",
      apiConfig.createApiUrl("Session/update_session"),
      JSON.stringify(pausedSession),
      () => {
        console.log("✅ סשן הושהה בהצלחה!");
        showToast("הסשן הושהה");
        isProcessingToggle = false;
      },
      () => {
        console.error("❌ שגיאה בהשהיית סשן.");
        showToast("שגיאה בהשהיית סשן", "error");
        isProcessingToggle = false;
      }
    );
  } else {
    // בדיקה אם זה המשכת סשן קיים או התחלת סשן חדש
    const isResuming =
      currentActiveSessionID !== null &&
      toggleText &&
      toggleText.textContent === "המשך";

    if (isResuming) {
      // המשכת סטופר של סשן מושהה
      const pausedSession = {
        sessionID: currentActiveSessionID,
        status: "Active",
      };

      ajaxCall(
        "PUT",
        apiConfig.createApiUrl("Session/update_session"),
        JSON.stringify(pausedSession),
        () => {
          console.log("✅ סשן הומשך בהצלחה!");

          // המשכת הסטופר רק אחרי תשובה מהשרת
          if (!interval) {
            interval = setInterval(updateTime, 1000);
          }
          isRunning = true;
          if (toggleText) toggleText.textContent = "השהה";
          if (toggleIcon) toggleIcon.className = "fas fa-pause";
          if (stopBtn) stopBtn.disabled = false;
          showToast("הסשן התחדש!");
          isProcessingToggle = false;
        },
        () => {
          console.error("❌ שגיאה בהמשכת סשן.");
          showToast("שגיאה בהמשכת הסשן", "error");
          isProcessingToggle = false;
        }
      );
    } else {
      // קריאה לשרת לפני שמתחיל הסטופר
      const sessionStart = getLocalISOStringWithoutZ();

      const apiUrl = apiConfig.createApiUrl("Session/start_auto_session", {
        userID: CurrentUser.id,
        projectID: CurrentProject.ProjectID,
        startDate: sessionStart,
      });

      ajaxCall(
        "POST",
        apiUrl,
        "",
        (response) => {
          console.log("✅ סשן התחיל בהצלחה:", response);

          // שמירת מזהה הסשן החדש
          currentActiveSessionID = response.sessionID;

          // רק אחרי השליחה מתחיל הסטופר
          if (!interval) {
            interval = setInterval(updateTime, 1000);
          }
          isRunning = true;
          if (toggleText) toggleText.textContent = "השהה";
          if (toggleIcon) toggleIcon.className = "fas fa-pause";
          if (stopBtn) stopBtn.disabled = false;
          showToast("הסשן התחיל בהצלחה!");

          // Reload stats and sessions
          loadProjectStats();
          isProcessingToggle = false;
        },
        (xhr) => {
          console.error("❌ שגיאה בהתחלת סשן:", xhr);
          showToast("שגיאה בהתחלת הסשן", "error");
          isProcessingToggle = false;
        }
      );
    }
  }
}

//סיום סשן - EXACT COPY FROM DESKTOP
function stopTimer() {
  if (isProcessingStop) {
    console.log("⚠️ מעבד כבר עצירה, מתעלם מלחיצה נוספת");
    return;
  }

  if (!currentActiveSessionID) {
    showToast("לא ניתן לסיים סשן לפני שהתחלת אחד", "error");
    return;
  }

  isProcessingStop = true;
  clearInterval(interval);
  interval = null;
  isRunning = false;
  if (toggleText) toggleText.textContent = "התחל";
  if (toggleIcon) toggleIcon.className = "fas fa-play";

  const endDate = getLocalISOStringWithoutZ();
  const durationSeconds = seconds;

  // במובייל אין לנו טבלה, אז נשתמש במזהה הסשן הפעיל
  // שמור משתנים זמניים לצורך השליחה בסיום הפופאפ
  window.sessionToClose = {
    sessionID: currentActiveSessionID,
    projectID: CurrentProject.ProjectID,
    startDate: null, // נשמור את התאריך המקורי
    endDate,
    durationSeconds,
    hourlyRate: CurrentProject.HourlyRate,
    userID: CurrentUser.id,
  };

  // אפס סטופר
  seconds = 0;
  currentActiveSessionID = null; // ניקוי מזהה הסשן הפעיל
  if (timeDisplay) timeDisplay.textContent = "00:00:00";
  if (stopBtn) stopBtn.disabled = true;
  updateOverallProgress();

  // פתח פופאפ לסיום סשן
  openEndSessionModal();

  // איפוס הדגל רק אחרי שהפופאפ נפתח
  isProcessingStop = false;
}

// Load project statistics
function loadProjectStats() {
  const userId = CurrentUser.id;
  const projectId = CurrentProject.ProjectID;

  // Load total hours and earnings
  const apiUrl = apiConfig.createApiUrl(
    "Session/GetAllSessionsByUserAndProject",
    {
      userID: userId,
      projectID: projectId,
    }
  );

  ajaxCall(
    "GET",
    apiUrl,
    "",
    function (sessions) {
      let totalHours = 0;
      let totalEarnings = 0;
      let sessionsCount = sessions.length;

      sessions.forEach((session) => {
        if (session.DurationSeconds) {
          totalHours += session.DurationSeconds / 3600;
          totalEarnings +=
            (session.DurationSeconds / 3600) * CurrentProject.HourlyRate;
        }
      });

      // Update past seconds for progress calculation
      totalPastSeconds = totalHours * 3600;

      // Update stats display
      const totalHoursEl = document.getElementById("total-hours");
      const totalEarningsEl = document.getElementById("total-earnings");
      const sessionsCountEl = document.getElementById("sessions-count");

      if (totalHoursEl) totalHoursEl.textContent = Math.floor(totalHours);
      if (totalEarningsEl)
        totalEarningsEl.textContent = `₪${Math.floor(totalEarnings)}`;
      if (sessionsCountEl) sessionsCountEl.textContent = sessionsCount;

      // Update progress after loading stats
      updateOverallProgress();

      // Load recent sessions
      loadRecentSessions(sessions);
    },
    function (error) {
      console.error("Error loading project stats:", error);
    }
  );
}

// Load recent sessions for display
function loadRecentSessions(sessions) {
  const sessionsList = document.getElementById("sessions-list");
  if (!sessionsList) return;

  sessionsList.innerHTML = "";

  if (sessions.length === 0) {
    sessionsList.innerHTML = `
      <div class="no-sessions">
        <i class="fas fa-clock"></i>
        <p>עדיין לא התחלת סשנים בפרויקט זה</p>
      </div>
    `;
    return;
  }

  // Show last 5 sessions
  const recentSessions = sessions.slice(-5).reverse();

  recentSessions.forEach((session) => {
    const sessionElement = createSessionElement(session);
    sessionsList.appendChild(sessionElement);
  });
}

// Create session element for display
function createSessionElement(session) {
  const sessionDiv = document.createElement("div");
  sessionDiv.className = "session-item";

  const startDate = new Date(session.StartDate);
  const duration = formatSecondsToHHMMSS(session.DurationSeconds || 0);
  const earnings = Math.floor(
    (session.DurationSeconds / 3600) * CurrentProject.HourlyRate
  );

  sessionDiv.innerHTML = `
    <div class="session-info">
      <div class="session-date">${formatDateForDisplay(startDate)}</div>
      <div class="session-description">${
        session.Description || "ללא תיאור"
      }</div>
    </div>
    <div class="session-meta">
      <div class="session-duration">${duration}</div>
      <div class="session-earnings">₪${earnings}</div>
    </div>
  `;

  return sessionDiv;
}

// Format seconds to HH:MM:SS
function formatSecondsToHHMMSS(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// Format date for display
function formatDateForDisplay(date) {
  return date.toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// End session modal functions
function openEndSessionModal() {
  const modal = document.getElementById("endSessionModal");
  if (modal) {
    modal.classList.add("active");
    document.body.classList.add("modal-open");

    // Update session summary
    const duration = formatSecondsToHHMMSS(
      window.sessionToClose.durationSeconds
    );
    const earnings = Math.floor(
      (window.sessionToClose.durationSeconds / 3600) * CurrentProject.HourlyRate
    );

    const sessionDurationEl = document.getElementById("session-duration");
    const sessionEarningsEl = document.getElementById("session-earnings");

    if (sessionDurationEl) sessionDurationEl.textContent = duration;
    if (sessionEarningsEl) sessionEarningsEl.textContent = `₪${earnings}`;

    // Load labels for dropdown
    loadLabelsForSession();
  }
}

function closeEndSessionModal() {
  const modal = document.getElementById("endSessionModal");
  if (modal) {
    modal.classList.remove("active");
    document.body.classList.remove("modal-open");

    // Reset form
    const form = document.getElementById("endSessionForm");
    if (form) form.reset();
  }
}

// Load labels for session dropdown
function loadLabelsForSession() {
  const labelApi = apiConfig.createApiUrl("Label/GetAllLabelsByUserID", {
    userID: CurrentUser.id,
  });

  ajaxCall(
    "GET",
    labelApi,
    "",
    function (labels) {
      const labelSelect = document.getElementById("session-label");
      if (labelSelect) {
        labelSelect.innerHTML = '<option value="">בחר תווית</option>';

        labels.forEach((label) => {
          const option = document.createElement("option");
          option.value = label.labelID;
          option.textContent = label.labelName;
          labelSelect.appendChild(option);
        });
      }
    },
    function (error) {
      console.error("Error loading labels:", error);
    }
  );
}

// Handle end session form submission - EXACT COPY FROM DESKTOP
function handleEndSession(event) {
  event.preventDefault();

  const description = document.getElementById("session-description").value;
  const labelID = document.getElementById("session-label").value;

  const data = {
    ...window.sessionToClose,
    description,
    labelID: labelID ? parseInt(labelID) : null,
    isArchived: false,
    status: "Ended",
  };

  console.log("📤 סיום סשן נשלח:", data);

  ajaxCall(
    "PUT",
    apiConfig.createApiUrl("Session/update_session"),
    JSON.stringify(data),
    () => {
      console.log("✅ הסשן הסתיים בהצלחה!");

      // וודא שהטיימר מופסק לחלוטין
      clearInterval(interval);
      interval = null;
      isRunning = false;
      currentActiveSessionID = null;

      // Close modal
      closeEndSessionModal();

      // Reload stats and sessions
      loadProjectStats();

      showToast("הסשן הסתיים בהצלחה!");
    },
    () => {
      console.error("❌ שגיאה בסיום הסשן");
      closeEndSessionModal();
      showToast("שגיאה בסיום הסשן", "error");
    }
  );
}

function viewAllSessions() {
  showToast("צפייה בכל הסשנים - בפיתוח", "info");
}

function viewProjectDetails() {
  showToast("פרטי פרויקט - בפיתוח", "info");
}

function exportSessions() {
  showToast("ייצוא סשנים - בפיתוח", "info");
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("📱 Mobile Project Page initialized");

  // Check if user and project are available
  if (!CurrentUser || !CurrentProject) {
    console.error("Missing user or project data");
    window.location.href = "m-projects.html";
    return;
  }

  // Fill project details
  fillProjectDetails();

  // Check for active session
  checkActiveSessionOnPageLoad();

  // Setup event listeners
  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleTimer);
  }
  if (stopBtn) {
    stopBtn.addEventListener("click", stopTimer);
  }

  const endSessionForm = document.getElementById("endSessionForm");
  if (endSessionForm) {
    endSessionForm.addEventListener("submit", handleEndSession);
  }

  // Setup modal overlay clicks
  const modalOverlay = document.querySelector(
    "#endSessionModal .modal-overlay"
  );
  if (modalOverlay) {
    modalOverlay.addEventListener("click", closeEndSessionModal);
  }

  // Close modal on escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeEndSessionModal();
    }
  });

  console.log("✅ Mobile Project Page setup complete");
});
