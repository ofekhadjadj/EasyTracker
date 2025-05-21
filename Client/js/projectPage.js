let CurrentProject = JSON.parse(localStorage.getItem("CurrentProject"));
let CurrentUser = JSON.parse(localStorage.getItem("user"));
console.log("CurrentProject", CurrentProject);
console.log("User", CurrentUser);
let table;
const avatarImg = document.querySelector(".avatar-img");

function loadTeamPreview() {
  const teamContainer = document.getElementById("project-team-preview");

  // שמור את כפתור הפתיחה בצד (נוסיף אותו מחדש אחר כך)
  // const openPopupBtn = document.getElementById("open-team-popup");
  // const arrowImg = document.getElementById("open-team-popup");

  // ננקה את התוכן הקיים
  teamContainer.innerHTML = "";

  const url = `https://localhost:7198/api/Projects/GetProjectTeam?ProjectID=${CurrentProject.ProjectID}`;

  ajaxCall(
    "GET",
    url,
    "",
    (members) => {
      members.forEach((member) => {
        const img = document.createElement("img");
        img.src = member.Image ? member.Image : "./images/default-avatar.png"; // 🔁 ברירת מחדל אם אין תמונה
        img.alt = member.FullName;
        img.title = member.FullName;
        img.style.width = "40px";
        img.style.height = "40px";
        img.style.borderRadius = "50%";
        img.style.objectFit = "cover";
        img.style.marginLeft = "4px";

        teamContainer.appendChild(img);
      });

      // הוסף את החץ לפתיחת פופאפ
      // teamContainer.appendChild(arrowImg);
    },
    (err) => {
      console.error("❌ שגיאה בשליפת חברי הצוות:", err);
    }
  );
}

//תיקון  לזמנים של UTC עבור עריכה של סשן
function toLocalDateObject(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}`);
}

// [Function loadEditLabelsDropdown removed - now handled directly in popup code]

document
  .getElementById("open-description-editor")
  .addEventListener("click", function () {
    // 🟢 שלוף מה-LocalStorage את הגרסה הכי עדכנית
    const freshProject =
      JSON.parse(localStorage.getItem("CurrentProject")) || {};
    const description = freshProject.Description || "";

    document.getElementById("description-textarea").value = description;

    $.fancybox.open({
      src: "#description-editor-popup",
      type: "inline",
      touch: false,
      animationEffect: "fade",
      animationDuration: 300,
      closeExisting: true,
    });
  });

function toIsoLocalFormat(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

//שליחה לשרת של התיאור פרויקט מהכפתור שמירת פרטים
document.getElementById("desc-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const newDescription = document.getElementById("description-textarea").value;

  const updatedProject = {
    projectid: CurrentProject.ProjectID,
    description: newDescription,
  };

  ajaxCall(
    "PUT",
    "https://localhost:7198/api/Projects/update_project",
    JSON.stringify(updatedProject),
    () => {
      // Create and show success notification
      const notification = document.createElement("div");
      notification.className = "save-notification";
      notification.innerHTML = `
        <div class="notification-icon">✓</div>
        <div class="notification-message">תיאור הפרויקט נשמר בהצלחה!</div>
      `;
      document.body.appendChild(notification);

      // Close the popup
      $.fancybox.close();

      // Animate notification
      setTimeout(() => {
        notification.classList.add("show");
      }, 10);

      // Remove notification after delay
      setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 500);
      }, 3000);

      // רענון localStorage מהשרת
      const refreshedApiUrl = `https://localhost:7198/api/Projects/GetThisProject/ProjectID/${CurrentProject.ProjectID}/UserID/${CurrentUser.id}`;
      ajaxCall("GET", refreshedApiUrl, "", (updated) => {
        CurrentProject = updated;
        localStorage.setItem("CurrentProject", JSON.stringify(CurrentProject));
      });
    },
    () => {
      // Show error notification      const notification = document.createElement("div");      notification.className = "save-notification";      notification.innerHTML = `        <div class="notification-icon">✕</div>        <div class="notification-message">שגיאה בשמירת התיאור</div>      `;      document.body.appendChild(notification);

      // Animate notification
      setTimeout(() => {
        notification.classList.add("show");
      }, 10);

      // Remove notification after delay
      setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 500);
      }, 3000);
    }
  );
});

function openEndSessionPopup() {
  const labelApi = `https://localhost:7198/api/Label/GetAllLabelsByUserID?userID=${CurrentUser.id}`;

  // Clear any previous session description
  document.getElementById("session-description").value = "";

  ajaxCall("GET", labelApi, "", (labels) => {
    const labelSelect = document.getElementById("session-label");
    labelSelect.innerHTML = '<option value="">בחר תווית</option>';

    // Set explicit size to force dropdown direction
    labelSelect.setAttribute("size", "1");

    // Add existing labels with colors
    labels.forEach((label) => {
      const option = document.createElement("option");
      option.value = label.labelID;
      option.textContent = label.labelName;
      // Add data attributes for color
      if (label.labelColor) {
        option.setAttribute("data-color", label.labelColor);
      }
      labelSelect.appendChild(option);
    });

    // Add "Add new label" option
    const addNewOption = document.createElement("option");
    addNewOption.value = "add_new";
    addNewOption.textContent = "➕ הוסף תווית חדשה";
    addNewOption.style.fontWeight = "bold";
    addNewOption.style.borderTop = "1px solid #ddd";
    addNewOption.style.marginTop = "5px";
    addNewOption.style.paddingTop = "5px";
    labelSelect.appendChild(addNewOption);

    // Add event listener for "Add new label" option
    labelSelect.addEventListener("change", function () {
      if (this.value === "add_new") {
        // Store the current session data
        const description = document.getElementById(
          "session-description"
        ).value;
        localStorage.setItem("pendingSessionDescription", description);

        // Open the add label popup
        openAddLabelPopup();

        // Reset selection
        this.value = "";
      }
    });

    // Apply custom styling to select options on focus
    labelSelect.addEventListener("focus", function () {
      this.style.borderColor = "#0072ff";
      this.style.boxShadow = "0 0 0 3px rgba(0, 114, 255, 0.1)";
    });

    labelSelect.addEventListener("blur", function () {
      this.style.borderColor = "#ddd";
      this.style.boxShadow = "none";
    });

    // פתיחת הפופאפ
    $.fancybox.open({
      src: "#end-session-popup",
      type: "inline",
      touch: false, // Disable touch events to avoid interference
      afterShow: function () {
        // Apply dropdown fix
        const selectElement = document.getElementById("session-label");

        // Force reset any previous state
        selectElement.blur();
        selectElement.size = 1;

        // Temporarily disable and re-enable to force refresh
        setTimeout(() => {
          selectElement.disabled = true;

          setTimeout(() => {
            selectElement.disabled = false;

            // Make sure dropdown behavior is initialized
            selectElement.style.display = "block";

            // Manually initialize this specific dropdown
            selectElement.addEventListener("mousedown", function (e) {
              if (this.size > 1) {
                setTimeout(() => {
                  this.size = 1;
                  this.blur();
                }, 0);
              } else {
                // Only stop propagation when opening to avoid issues with fancybox
                e.stopPropagation();
              }
            });

            selectElement.addEventListener("blur", function () {
              this.size = 1;
            });

            selectElement.addEventListener("change", function () {
              this.size = 1;
              this.blur();
            });
          }, 50);
        }, 50);
      },
    });
  });
}

// Function to open add label popup
function openAddLabelPopup(fromEditSession = false) {
  // Create popup for adding a new label
  const popupHtml = `
    <div id="add-label-popup" style="width: 400px; padding: 25px; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
      <h2 style="text-align: center; margin-bottom: 20px; color: #0072ff;">הוספת תווית חדשה</h2>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">שם התווית:</label>
        <input type="text" id="new-label-name" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; font-size: 15px; box-sizing: border-box;">
      </div>
      
      <div style="margin-bottom: 25px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">צבע:</label>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
          <div class="color-option" data-color="#FF5252" style="background-color: #FF5252; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;"></div>
          <div class="color-option" data-color="#FF4081" style="background-color: #FF4081; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;"></div>
          <div class="color-option" data-color="#7C4DFF" style="background-color: #7C4DFF; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;"></div>
          <div class="color-option" data-color="#536DFE" style="background-color: #536DFE; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;"></div>
          <div class="color-option" data-color="#448AFF" style="background-color: #448AFF; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;"></div>
          <div class="color-option" data-color="#64FFDA" style="background-color: #64FFDA; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;"></div>
          <div class="color-option" data-color="#4CAF50" style="background-color: #4CAF50; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;"></div>
          <div class="color-option" data-color="#CDDC39" style="background-color: #CDDC39; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;"></div>
          <div class="color-option" data-color="#FFC107" style="background-color: #FFC107; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;"></div>
          <div class="color-option" data-color="#FF9800" style="background-color: #FF9800; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;"></div>
        </div>
        <input type="hidden" id="new-label-color" value="#FF5252">
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="save-new-label" style="padding: 12px 20px; background: linear-gradient(135deg, #0072ff, #00c6ff); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; flex: 1;">שמור</button>
        <button onclick="$.fancybox.close()" style="padding: 12px 20px; background: #f0f0f0; color: #333; border: none; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer; flex: 1;">ביטול</button>
      </div>
    </div>
  `;

  $.fancybox.open({
    src: popupHtml,
    type: "html",
    autoFocus: false,
    afterShow: function () {
      // Set initial selected color
      document.querySelector(".color-option").classList.add("selected");

      // Add click handlers to color options
      document.querySelectorAll(".color-option").forEach((element) => {
        element.addEventListener("click", function () {
          // Remove previous selection
          document.querySelectorAll(".color-option").forEach((el) => {
            el.style.boxShadow = "none";
            el.classList.remove("selected");
          });

          // Add selection to clicked color
          this.style.boxShadow =
            "0 0 0 3px white, 0 0 0 5px " + this.dataset.color;
          this.classList.add("selected");

          // Update hidden input
          document.getElementById("new-label-color").value = this.dataset.color;
        });

        // Add hover effect
        element.addEventListener("mouseenter", function () {
          if (!this.classList.contains("selected")) {
            this.style.transform = "scale(1.1)";
          }
        });

        element.addEventListener("mouseleave", function () {
          if (!this.classList.contains("selected")) {
            this.style.transform = "scale(1)";
          }
        });
      });

      // Handle save button click
      document
        .getElementById("save-new-label")
        .addEventListener("click", function () {
          const labelName = document
            .getElementById("new-label-name")
            .value.trim();
          const labelColor = document.getElementById("new-label-color").value;

          if (!labelName) {
            alert("אנא הכנס שם לתווית");
            return;
          }

          // Create new label object
          const newLabel = {
            labelName: labelName,
            labelColor: labelColor,
            userID: CurrentUser.id,
          };

          // Using the correct endpoint and method from labels.js
          $.ajax({
            url: "https://localhost:7198/api/Label/addNewLabel",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(newLabel),
            success: (response) => {
              console.log("✅ התווית נוספה בהצלחה:", response);

              // Close current popup
              $.fancybox.close();

              // החזרה לפופאפ המתאים על פי המקור
              if (fromEditSession) {
                // שחזור נתוני העריכה
                const pendingData = JSON.parse(
                  localStorage.getItem("pendingEditSession") || "{}"
                );

                // פתיחת פופאפ העריכה מחדש
                // פתח את פופאפ העריכה מחדש עם הנתונים הקודמים
                $(document).trigger("reopenEditSessionPopup", [
                  response.labelID,
                ]);

                // מחיקת הנתונים השמורים
                localStorage.removeItem("pendingEditSession");
              } else {
                // Immediately reopen the end session popup
                openEndSessionPopup();

                // Restore the description if available
                const savedDescription = localStorage.getItem(
                  "pendingSessionDescription"
                );
                if (savedDescription) {
                  document.getElementById("session-description").value =
                    savedDescription;
                  localStorage.removeItem("pendingSessionDescription");
                }
              }

              // Show success notification
              showLabelAddedNotification();
            },
            error: (error) => {
              console.error("❌ שגיאה בהוספת התווית:", error);
              alert("שגיאה בהוספת התווית");
            },
          });
        });
    },
  });
}

// Function to show notification that label was added successfully
function showLabelAddedNotification() {
  const notification = document.createElement("div");
  notification.className = "save-notification";
  notification.style.zIndex = "99999"; // Ensure it appears over the fancybox
  notification.innerHTML = `
    <div class="notification-icon">✓</div>
    <div class="notification-message">התווית נוספה בהצלחה!</div>
  `;

  document.body.appendChild(notification);

  // Animate notification
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Remove notification after delay
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, 3000);
}

// הגדרות אלו הועברו לאירוע DOMContentLoaded אחד כולל בקוד בהמשך הקובץ

function FillDeatils() {
  const ProfName = document.getElementById("menu-prof-name");

  const projectName = document.getElementById("ProjectTitle");
  const ProjectClient = document.getElementById("ProjectClient");
  const breadcrumbsProjName = document.getElementById("breadcrumbsProjName");
  ProfName.innerText = CurrentUser.firstName;
  let breadcrumbsText = `${CurrentProject.ProjectName} - ${CurrentProject.CompanyName}`;
  breadcrumbsProjName.innerText = breadcrumbsText;
  projectName.innerText = CurrentProject.ProjectName;
  ProjectClient.innerText = CurrentProject.CompanyName;
  if (CurrentUser?.image && avatarImg) {
    avatarImg.src = CurrentUser.image;
  }
}

let interval = null;
let seconds = 0;
let totalPastSeconds = 0;

let isRunning = false;

const timeDisplay = document.getElementById("time");
const toggleBtn = document.getElementById("toggle-btn");
const toggleText = document.getElementById("toggle-text");
const toggleIcon = document.getElementById("toggle-icon");
const stopBtn = document.getElementById("stop-btn");
const circle = document.querySelector(".circle-progress");
const circumference = 2 * Math.PI * 100; //היקף המעגל

// 🟦 בר התקדמות
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");

// הגדרת יעד משך הפרויקט בשעות ביחס לבר ההתקדמות

const goalInSeconds = CurrentProject.DurationGoal * 3600 || 3600; // ברירת מחדל לשעה אם לא קיים

circle.style.strokeDasharray = circumference;
circle.style.strokeDashoffset = circumference;

function updateTime() {
  seconds++;

  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  timeDisplay.textContent = `${h}:${m}:${s}`;

  // 🟦 עדכון עיגול
  const progress = (seconds % 3600) / 3600;
  circle.style.strokeDashoffset = circumference * (1 - progress);

  // 🟦 עדכון בר התקדמות
  const progressPercent = Math.min((seconds / goalInSeconds) * 100, 100);
  progressFill.style.width = `${progressPercent}%`;
  progressText.textContent = `${Math.floor(progressPercent)}%`;

  // שינוי צבע הרקע לפי אחוז ההתקדמות
  if (progressPercent >= 90) {
    progressFill.style.background =
      "linear-gradient(to right, #ff4e50, #f00000)"; // אדום
  } else if (progressPercent >= 80) {
    progressFill.style.background =
      "linear-gradient(to right, #ff9900, #ff6600)"; // כתום
  } else {
    progressFill.style.background =
      "linear-gradient(to right, #00c6ff, #0072ff)"; // כחול רגיל
  }

  // שינוי צבע הטקסט לפי אחוזים
  if (progressPercent <= 10) {
    progressText.style.color = "#000"; // שחור
  } else {
    progressText.style.color = "#fff"; // לבן
  }
  updateOverallProgress();
}

function updateOverallProgress() {
  const totalSeconds = totalPastSeconds + seconds; // כולל מה שרץ עכשיו
  const progressPercent = Math.min((totalSeconds / goalInSeconds) * 100, 100);

  progressFill.style.width = `${progressPercent}%`;
  progressText.textContent = `${Math.floor(progressPercent)}%`;

  // צבע רקע
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

  progressText.style.color = progressPercent <= 10 ? "#000" : "#fff";
}

// 🟦 המרת זמן לשעון ישראל
function getLocalISOString() {
  const tzOffset = new Date().getTimezoneOffset() * 60000; // זמן מקומי מול UTC
  return new Date(Date.now() - tzOffset).toISOString();
}

// 🟦 כפתור הפעלה
function getLocalISOStringWithoutZ() {
  const now = new Date();

  // מחשב את ההפרש בין הזמן המקומי ל־UTC
  const localOffsetMs = now.getTimezoneOffset() * -60000;

  // מוסיף את ההפרש כדי להגיע לזמן מקומי אמיתי
  const localDate = new Date(now.getTime() + localOffsetMs);

  return localDate.toISOString().replace("Z", "");
}

toggleBtn.addEventListener("click", () => {
  // כפתור השהייה תוספת
  if (isRunning) {
    clearInterval(interval);
    isRunning = false;
    toggleText.textContent = "המשך";
    toggleIcon.src = "./images/play-icon.png";

    const durationSeconds = seconds;

    const lastSessionRow = $("#sessionsTable tbody tr").first();
    const sessionData = lastSessionRow.data("session");

    if (!sessionData) {
      console.error("❌ לא נמצא סשן פעיל לעדכון (Pause).");
      return;
    }

    const pausedSession = {
      sessionID: sessionData.SessionID,
      projectID: sessionData.ProjectID,
      durationSeconds: durationSeconds,
      status: "Paused",
    };

    console.log("⏸️ השהיית סשן | נשלח לשרת:", pausedSession);

    ajaxCall(
      "PUT",
      "https://localhost:7198/api/Session/update_session",
      JSON.stringify(pausedSession),
      () => {
        console.log("✅ סשן הושהה בהצלחה!");
      },
      () => {
        console.error("❌ שגיאה בהשהיית סשן.");
      }
    );
  } else {
    // קריאה לשרת לפני שמתחיל הסטופר
    const sessionStart = getLocalISOStringWithoutZ();

    const apiUrl = `https://localhost:7198/api/Session/start_auto_session?userID=${
      CurrentUser.id
    }&projectID=${CurrentProject.ProjectID}&startDate=${encodeURIComponent(
      sessionStart
    )}`;

    ajaxCall(
      "POST",
      apiUrl,
      "",
      (response) => {
        console.log("✅ סשן התחיל בהצלחה:", response);
        // Clear and completely refresh the table with newest sessions at top
        table.clear();
        renderTableFromDB();
      },
      (xhr) => {
        console.error("❌ שגיאה בהתחלת סשן:", xhr);
      }
    );

    // רק אחרי השליחה מתחיל הסטופר
    interval = setInterval(updateTime, 1000);
    isRunning = true;
    toggleText.textContent = "השהה";
    toggleIcon.src = "./images/puse icon.png";
  }
});

//סיום סשן
stopBtn.addEventListener("click", () => {
  if (!isRunning) {
    alert("לא ניתן לסיים סשן לפני שהתחלת אחד.");
    return;
  }
  clearInterval(interval);
  isRunning = false;
  toggleText.textContent = "התחל";
  toggleIcon.src = "./images/play-icon.png";

  const endDate = getLocalISOStringWithoutZ();
  const durationSeconds = seconds;

  const lastSessionRow = $("#sessionsTable tbody tr").first();
  const sessionData = lastSessionRow.data("session");

  if (!sessionData) {
    console.error("❌ לא נמצא סשן פעיל לעדכון.");
    return;
  }

  // שמור משתנים זמניים לצורך השליחה בסיום הפופאפ
  window.sessionToClose = {
    sessionID: sessionData.SessionID,
    projectID: sessionData.ProjectID,
    startDate: sessionData.StartDate,
    endDate,
    durationSeconds,
    hourlyRate: sessionData.HourlyRate,
    userID: sessionData.UserID,
  };

  // אפס סטופר
  seconds = 0;
  timeDisplay.textContent = "00:00:00";
  circle.style.strokeDashoffset = circumference;
  progressFill.style.width = `0%`;
  progressText.textContent = `0%`;

  // פתח פופאפ לסיום סשן
  openEndSessionPopup();
});

document.getElementById("submit-end-session").addEventListener("click", () => {
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
    "https://localhost:7198/api/Session/update_session",
    JSON.stringify(data),
    () => {
      // Close the popup completely including overlay
      $.fancybox.close(true);

      // Reset any pending session data
      if (localStorage.getItem("pendingSessionDescription")) {
        localStorage.removeItem("pendingSessionDescription");
      }

      // Replace alert with elegant notification
      const notification = document.createElement("div");
      notification.className = "save-notification";
      notification.innerHTML = `
        <div class="notification-icon">✓</div>
        <div class="notification-message">הסשן הסתיים בהצלחה!</div>
      `;
      document.body.appendChild(notification);

      // Animate notification
      setTimeout(() => {
        notification.classList.add("show");
      }, 10);

      // Remove notification after delay
      setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 500);
      }, 3000);

      // Clear and refresh the table completely to ensure newest sessions are at the top
      table.clear();
      renderTableFromDB();
    },
    () => {
      // Close the popup to avoid UI issues
      $.fancybox.close(true);

      // Show error notification instead of alert      const notification = document.createElement("div");      notification.className = "save-notification";      notification.innerHTML = `        <div class="notification-icon">✕</div>        <div class="notification-message">שגיאה בסיום הסשן</div>      `;      document.body.appendChild(notification);

      // Animate notification
      setTimeout(() => {
        notification.classList.add("show");
      }, 10);

      // Remove notification after delay
      setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 500);
      }, 3000);
    }
  );
});

$(document).ready(function () {
  table = $("#sessionsTable").DataTable({
    responsive: true,
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.13.4/i18n/he.json",
    },
    paging: false,
    searching: false,
    info: false,
    ordering: false, // Disable DataTables' built-in ordering to use our custom sort
  });

  // Export functionality
  document.getElementById("export-pdf").addEventListener("click", exportToPdf);
  document
    .getElementById("export-excel")
    .addEventListener("click", exportToExcel);

  function exportToPdf() {
    const currentDate = new Date().toLocaleDateString("he-IL");
    const projectName = document.getElementById("ProjectTitle").innerText;
    const clientName = document.getElementById("ProjectClient").innerText;
    const fileName = `${projectName} - סשנים - ${currentDate}.pdf`;

    // Get data from table
    const tableData = getTableData();

    // Create a window object for the PDF
    const pdfWindow = window.open("", "_blank");

    // Build HTML content for PDF
    let pdfContent = `
      <html dir="rtl">
      <head>
        <title>${fileName}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            padding: 20px;
            direction: rtl;
          }
          h1, h2 {
            text-align: center;
            color: #0072ff;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .report-header {
            margin-bottom: 30px;
            text-align: center;
          }
          .report-date {
            text-align: left;
            margin-bottom: 20px;
            font-size: 14px;
          }
          .total-row {
            font-weight: bold;
            background-color: #f2f2f2;
          }
          .total-row td {
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>דוח סשנים: ${projectName}</h1>
          <h2>לקוח: ${clientName}</h2>
        </div>
        <div class="report-date">
          <p>הופק בתאריך: ${currentDate}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>תווית</th>
              <th>תאריך</th>
              <th>שעת התחלה</th>
              <th>שעת סיום</th>
              <th>תעריף</th>
              <th>משך זמן</th>
              <th>שכר</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Calculate totals
    let totalDuration = 0;
    let totalEarnings = 0;

    // Add rows to PDF content
    tableData.forEach((row) => {
      pdfContent += `<tr>
        <td>${row.label}</td>
        <td>${row.date}</td>
        <td>${row.startTime}</td>
        <td>${row.endTime}</td>
        <td>${row.rate} ₪</td>
        <td>${row.duration}</td>
        <td>${row.earnings} ₪</td>
      </tr>`;

      // Add to totals if possible
      if (row.durationSeconds) {
        totalDuration += row.durationSeconds;
      }

      if (row.earningsValue) {
        totalEarnings += row.earningsValue;
      }
    });

    // Add totals row
    pdfContent += `
          <tr class="total-row">
            <td colspan="4" style="text-align: right; font-weight: bold;">סה"כ:</td>
            <td style="text-align: center;"></td>
            <td style="text-align: center; font-weight: bold;">${formatSecondsToHHMMSS(
              totalDuration
            )}</td>
            <td style="text-align: center; font-weight: bold;">${totalEarnings.toFixed(
              2
            )} ₪</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
    `;

    // Write to the new window
    pdfWindow.document.open();
    pdfWindow.document.write(pdfContent);
    pdfWindow.document.close();

    // Use window.print() to open the print dialog
    setTimeout(() => {
      pdfWindow.print();
    }, 500);

    // Show success notification
    showExportNotification("PDF");
  }

  function exportToExcel() {
    const currentDate = new Date().toLocaleDateString("he-IL");
    const projectName = document.getElementById("ProjectTitle").innerText;
    const fileName = `${projectName} - סשנים - ${currentDate}.xlsx`;

    // Get data from table
    const tableData = getTableData();

    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(
      tableData.map((row) => ({
        תווית: row.label,
        תאריך: row.date,
        "שעת התחלה": row.startTime,
        "שעת סיום": row.endTime,
        "תעריף (₪)": row.rate,
        "משך זמן": row.duration,
        "שכר (₪)": row.earnings,
      }))
    );

    // Set column widths for better appearance
    ws["!cols"] = [
      { wch: 15 }, // תווית
      { wch: 12 }, // תאריך
      { wch: 12 }, // שעת התחלה
      { wch: 12 }, // שעת סיום
      { wch: 12 }, // תעריף
      { wch: 12 }, // משך זמן
      { wch: 12 }, // שכר
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "סשנים");

    // Create and download excel file
    XLSX.writeFile(wb, fileName);

    // Show success notification
    showExportNotification("Excel");
  }

  function getTableData() {
    const data = [];
    const rows = document.querySelectorAll("#sessionsTable tbody tr");

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length >= 7) {
        // Ensure it's a data row
        const label = cells[0].textContent.trim();
        const date = cells[1].textContent.trim();
        const startTime = cells[2].textContent.trim();
        const endTime = cells[3].textContent.trim();
        const rate = parseFloat(cells[4].textContent.trim()) || 0;
        const duration = cells[5].textContent.trim();
        const earnings = cells[6].textContent.trim();

        // Get session data if available for additional calculations
        const sessionData = $(row).data("session");
        const durationSeconds = sessionData ? sessionData.DurationSeconds : 0;
        const earningsValue = parseFloat(earnings) || 0;

        data.push({
          label,
          date,
          startTime,
          endTime,
          rate,
          duration,
          earnings,
          durationSeconds,
          earningsValue,
        });
      }
    });

    return data;
  }

  function showExportNotification(type) {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = "export-notification";
    notification.innerHTML = `
      <div class="notification-icon">✓</div>
      <div class="notification-message">הקובץ יוצא ל${type} בהצלחה!</div>
    `;

    // Style the notification
    notification.style.position = "fixed";
    notification.style.top = "20px";
    notification.style.left = "50%";
    notification.style.transform = "translateX(-50%)";
    notification.style.backgroundColor = "#4CAF50";
    notification.style.color = "white";
    notification.style.padding = "15px 25px";
    notification.style.borderRadius = "8px";
    notification.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";
    notification.style.zIndex = "9999";
    notification.style.display = "flex";
    notification.style.alignItems = "center";
    notification.style.gap = "10px";
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.3s, transform 0.3s";

    // Add to body
    document.body.appendChild(notification);

    // Fade in
    setTimeout(() => {
      notification.style.opacity = "1";
    }, 10);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  function format(session) {
    const desc = session.Description || "אין תיאור זמין לסשן זה.";

    // Enhanced details format with better styling
    return `
      <div class="details-row">
        <div style="display: flex; align-items: flex-start;">
          <div style="flex: 1;">
            <strong style="color: #0072ff; display: block; margin-bottom: 10px; font-size: 15px;">תיאור הסשן:</strong>
            <div style="padding: 12px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              ${desc}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  $("#sessionsTable tbody").on("click", "td .details-control", function () {
    const tr = $(this).closest("tr");
    const row = table.row(tr);
    const session = $(tr).data("session"); // שליפת הסשן מהשורה

    if (row.child.isShown()) {
      row.child.hide();
      $(this).html('<i class="fas fa-chevron-down"></i>');
    } else {
      row.child(format(session)).show();
      $(this).html('<i class="fas fa-chevron-up"></i>');
    }
  });
});

function formatDateTime(isoString) {
  const date = new Date(isoString);

  // הפיכת תאריך בפורמט ISO לפורמט מקומי
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const time = `${hours}:${minutes}:${seconds}`;
  const formattedDate = `${day}/${month}/${year}`;

  return {
    time,
    formattedDate,
  };
}

function formatSecondsToHHMMSS(seconds) {
  const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${secs}`;
}

function calculateEarnings(hourlyRate, durationSeconds) {
  const hours = durationSeconds / 3600;
  const earnings = hours * hourlyRate;
  return earnings.toFixed(2); // נחזיר עם 2 ספרות אחרי הנקודה
}

function renderTableFromDB() {
  //bring sessions from db
  const apiUrl = `https://localhost:7198/api/Session/GetAllSessionsByUserAndProject?userID=${CurrentUser.id}&projectID=${CurrentProject.ProjectID}`;

  console.log(apiUrl);

  ajaxCall("GET", apiUrl, "", successCB, ErrorCB);

  function successCB(response) {
    console.log(response);
    console.log(table);

    // First clear the table to avoid duplication issues
    table.clear();

    let totalDurationSeconds = 0;
    let totalEarningsValue = 0;

    // Sort sessions by StartDate in descending order (newest first)
    response.sort((a, b) => new Date(b.StartDate) - new Date(a.StartDate));

    response.forEach((session) => {
      const rawDate = session.StartDate;
      const { time, formattedDate } = formatDateTime(rawDate);

      const fDate = session.EndDate;

      const endTimeDisplay = session.EndDate
        ? formatDateTime(session.EndDate).time
        : "--:--:--";

      // Calculate earnings for this session
      const earnings = calculateEarnings(
        session.HourlyRate,
        session.DurationSeconds
      );
      // Add to totals
      totalDurationSeconds += session.DurationSeconds;
      totalEarningsValue += parseFloat(earnings);

      // Enhanced label style with better visual presentation
      const labelHtml = `<span style="width: auto; height: auto; background-color: ${
        session.LabelColor ?? "#RRGGBBAA"
      }; color: black; display: inline-block; padding: 6px 12px; border-radius: 20px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${
        session.LabelName ?? "-"
      }</span>`;

      const newRow = [
        labelHtml, // תווית
        formattedDate, // תאריך
        time, // שעת התחלה
        endTimeDisplay, // שעת סיום
        session.HourlyRate, // תעריף
        formatSecondsToHHMMSS(session.DurationSeconds), // משך זמן
        earnings, // שכר
        '<button class="edit-btn"><i class="fas fa-edit"></i></button><button id="dlt-btn-session" class="delete-btn"><i class="fas fa-trash-alt"></i></button>', // כפתורים
        '<button class="details-control"><i class="fas fa-chevron-down"></i></button>', // פרטים נוספים
      ];

      // Add row to table (already in sorted order)
      const rowNode = table.row.add(newRow).node();

      // Store session data in the row
      $(rowNode).data("session", session); // שמירת הסשן כולו
      $(rowNode).attr("data-session-id", session.SessionID); // שמירת ה-ID כשדה data
    });

    // Draw the table with our pre-sorted data
    table.draw();

    // Update table footer with totals
    document.getElementById(
      "total-worktime"
    ).innerHTML = `<strong style="display: block; text-align: center">${formatSecondsToHHMMSS(
      totalDurationSeconds
    )}</strong>`;
    document.getElementById(
      "total-earnings"
    ).innerHTML = `<strong style="display: block; text-align: center">${totalEarningsValue.toFixed(
      2
    )}</strong>`;

    totalPastSeconds = response.reduce(
      (sum, session) => sum + session.DurationSeconds,
      0
    );
    updateOverallProgress(); // נעדכן את בר ההתקדמות הכללי

    //הסרת סשן מהטבלה
    document
      .getElementById("sessionsTable")
      .addEventListener("click", function (e) {
        // Check if the clicked element is the button or the icon inside it
        if (
          e.target.classList.contains("delete-btn") ||
          (e.target.tagName === "I" && e.target.closest(".delete-btn"))
        ) {
          const row = e.target.closest("tr");
          const sessionId = row.getAttribute("data-session-id");
          const session = $(row).data("session"); // ✅ שליפה מהשורה

          if (!session) {
            console.warn("⚠️ לא נמצא session לשורה הזו.");
            return;
          }

          const message = `האם למחוק את הסשן שנוצר בתאריך ${
            formatDateTime(session.StartDate).formattedDate
          }?`;

          const popupHtml = `
        <div style="max-width: 400px; text-align: center; font-family: Assistant; padding: 20px;">
          <h3>מחיקת סשן</h3>
          <p>${message}</p>
          <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
            <button class="gradient-button" id="confirmDeleteSessionBtn" style="background: linear-gradient(135deg, #d50000, #ff4e50); color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(255, 78, 80, 0.3);">כן, מחק</button>
            <button class="gradient-button" onclick="$.fancybox.close()" style="background: #f0f0f0; color: #333; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold;">ביטול</button>
          </div>
        </div>
      `;

          $.fancybox.open({
            src: popupHtml,
            type: "html",
            smallBtn: false,
          });

          $(document)
            .off("click", "#confirmDeleteSessionBtn")
            .on("click", "#confirmDeleteSessionBtn", function () {
              deleteSession(sessionId, row, session.DurationSeconds);
              $.fancybox.close();
            });
        }
      });

    function deleteSession(sessionId, row, durationSeconds) {
      const apiUrl = `https://localhost:7198/api/Session/delete_session?SessionID=${sessionId}`;

      ajaxCall(
        "PUT",
        apiUrl,
        "",
        () => {
          console.log("✅ הסשן נמחק מהשרת");

          // Show success notification
          const notification = document.createElement("div");
          notification.className = "save-notification";
          notification.innerHTML = `
            <div class="notification-icon">✓</div>
            <div class="notification-message">הסשן נמחק בהצלחה!</div>
          `;
          document.body.appendChild(notification);

          // Animate notification
          setTimeout(() => {
            notification.classList.add("show");
          }, 10);

          // Remove notification after delay
          setTimeout(() => {
            notification.classList.remove("show");
            setTimeout(() => {
              if (notification.parentNode) {
                document.body.removeChild(notification);
              }
            }, 500);
          }, 3000);

          // עדכון זמן כולל (בר)
          if (durationSeconds) {
            totalPastSeconds -= durationSeconds;
            updateOverallProgress();
          }

          // הסרת השורה מהטבלה
          table.row(row).remove().draw(false);
        },
        () => {
          console.error("❌ שגיאה במחיקת הסשן מהשרת");

          // Show error notification
          const notification = document.createElement("div");
          notification.className = "save-notification error";
          notification.innerHTML = `
            <div class="notification-icon">✕</div>
            <div class="notification-message">שגיאה במחיקת הסשן</div>
          `;
          document.body.appendChild(notification);

          // Animate notification
          setTimeout(() => {
            notification.classList.add("show");
          }, 10);

          // Remove notification after delay
          setTimeout(() => {
            notification.classList.remove("show");
            setTimeout(() => {
              if (notification.parentNode) {
                document.body.removeChild(notification);
              }
            }, 500);
          }, 3000);
        }
      );
    }
  }

  function ErrorCB(xhr, status, error) {
    console.error("שגיאה בטעינת הפרויקטים:", error);
  }
}

// פתיחת פופאפ עריכת סשן
$(document).on("click", ".edit-btn, .edit-btn i", function () {
  const row = $(this).closest("tr");
  const session = row.data("session");
  if (!session) return;

  const start = new Date(session.StartDate);
  const end = new Date(session.EndDate);

  // Set max date attribute to today's date
  const today = new Date().toISOString().split("T")[0];
  $("#edit-date").attr("max", today);

  $("#edit-session-id").val(session.SessionID);
  $("#edit-date").val(start.toISOString().split("T")[0]);
  $("#edit-start-time").val(start.toTimeString().slice(0, 5));
  $("#edit-end-time").val(end.toTimeString().slice(0, 5));
  $("#edit-rate").val(session.HourlyRate || 0);
  $("#edit-description").val(session.Description || "");

  // פתח את הפופאפ עם fancybox
  $.fancybox.open({
    src: "#edit-session-modal",
    type: "inline",
    touch: false,
    width: 600,
    maxWidth: "90%",
    autoSize: false,
    padding: 0,
    margin: 20,
    afterShow: function () {
      // Get references to form elements
      const labelSelect = document.getElementById("edit-label-id");

      // Clear any existing options and event listeners to prevent duplicates
      labelSelect.innerHTML = '<option value="">בחר תווית</option>';
      $(labelSelect).off("change");

      // Set dropdown properties
      labelSelect.setAttribute("size", "1");
      labelSelect.classList.add("force-dropdown-down");
      labelSelect.style.display = "block";

      // Add dropdown event listeners
      labelSelect.addEventListener("mousedown", function (e) {
        if (this.size > 1) {
          setTimeout(() => {
            this.size = 1;
            this.blur();
          }, 0);
        }
      });

      labelSelect.addEventListener("blur", function () {
        this.size = 1;
      });

      labelSelect.addEventListener("change", function () {
        this.size = 1;
        this.blur();

        // Handle "Add new label" option
        if (this.value === "add_new") {
          // Save form data to localStorage
          const sessionId = document.getElementById("edit-session-id").value;
          const date = document.getElementById("edit-date").value;
          const startTime = document.getElementById("edit-start-time").value;
          const endTime = document.getElementById("edit-end-time").value;
          const rate = document.getElementById("edit-rate").value;
          const description = document.getElementById("edit-description").value;

          localStorage.setItem(
            "pendingEditSession",
            JSON.stringify({
              sessionId,
              date,
              startTime,
              endTime,
              rate,
              description,
            })
          );

          // Close current popup and open add label popup
          $.fancybox.close();
          openAddLabelPopup(true);

          // Reset selection
          this.value = "";
        }
      });

      // Fetch and add labels
      const labelApi = `https://localhost:7198/api/Label/GetAllLabelsByUserID?userID=${CurrentUser.id}`;

      ajaxCall(
        "GET",
        labelApi,
        "",
        (labels) => {
          // Add label options
          labels.forEach((label) => {
            const option = document.createElement("option");
            option.value = label.labelID;
            option.textContent = label.labelName;

            // Add color styling
            if (label.labelColor) {
              option.setAttribute("data-color", label.labelColor);
              option.style.backgroundColor = label.labelColor + "20"; // צבע שקוף של התווית
            }

            labelSelect.appendChild(option);
          });

          // Add the "Add new label" option
          const addNewOption = document.createElement("option");
          addNewOption.value = "add_new";
          addNewOption.textContent = "➕ הוסף תווית חדשה";
          addNewOption.style.fontWeight = "bold";
          addNewOption.style.borderTop = "1px solid #ddd";
          addNewOption.style.marginTop = "5px";
          addNewOption.style.paddingTop = "5px";
          labelSelect.appendChild(addNewOption);

          // Set the selected value based on session's label
          if (session.LabelID) {
            labelSelect.value = session.LabelID;
          }
        },
        (err) => {
          console.error("❌ שגיאה בשליפת תוויות לעריכה:", err);
        }
      );

      // התמקד בשדה הראשון
      $("#edit-date").focus();
    },
  });
});

// פופאפ עריכת סשן שליחה לשרת
$(document).on("submit", "#edit-session-form", function (e) {
  e.preventDefault();

  const sessionID = parseInt($("#edit-session-id").val());
  const startDate = $("#edit-date").val();
  const startTime = $("#edit-start-time").val();
  const endTime = $("#edit-end-time").val();
  const hourlyRate = parseFloat($("#edit-rate").val());
  const description = $("#edit-description").val();
  const labelID = $("#edit-label-id").val()
    ? parseInt($("#edit-label-id").val())
    : null;

  const startDateTime = toLocalDateObject(startDate, startTime);

  const endDateTime = toLocalDateObject(startDate, endTime);

  const durationSeconds = Math.floor((endDateTime - startDateTime) / 1000);

  const updatedSession = {
    sessionID: sessionID,
    projectID: CurrentProject.ProjectID,
    startDate: toIsoLocalFormat(startDateTime),
    endDate: toIsoLocalFormat(endDateTime),
    durationSeconds: durationSeconds,
    hourlyRate: hourlyRate,
    description: description,
    labelID: labelID,
    isArchived: false,
    userID: CurrentUser.id,
  };

  console.log("🟡 שולח עדכון סשן:", updatedSession);

  const apiUrl = "https://localhost:7198/api/Session/update_session";
  ajaxCall(
    "PUT",
    apiUrl,
    JSON.stringify(updatedSession),
    () => {
      // סגירת הפופאפ
      $.fancybox.close();

      // הצגת הודעת הצלחה מעוצבת
      showCustomAlert("הסשן עודכן בהצלחה", "success");

      // רענון הטבלה לאחר קצת זמן
      setTimeout(() => {
        table.clear();
        renderTableFromDB();
      }, 1000);
    },
    () => {
      // הצגת הודעת שגיאה מעוצבת
      showCustomAlert("שגיאה בעדכון הסשן", "error", false);
    }
  );
});

document.addEventListener("DOMContentLoaded", function () {
  const apiUrl = `https://localhost:7198/api/Projects/GetLast5ProjectsByUserId/${CurrentUser.id}`;

  ajaxCall("GET", apiUrl, "", (projects) => {
    const wrapper = document.getElementById("recent-projects-wrapper");
    console.log(projects);

    projects.forEach((project) => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";

      // Check if image exists and format URL properly
      if (project.Image && project.Image.trim() !== "") {
        try {
          // Sanitize URL to prevent issues with special characters
          const imageUrl = project.Image.trim().replace(/\\/g, "/");
          slide.style.backgroundImage = `url("${imageUrl}")`;
          slide.style.backgroundSize = "cover";
          slide.style.backgroundPosition = "center";
          // Add error handling for images
          const img = new Image();
          img.onerror = function () {
            // Fallback to default if image fails to load
            slide.style.backgroundColor = "#f0f0f0";
            slide.style.backgroundImage = `url("./images/default-project.png")`;
          };
          img.src = imageUrl;
        } catch (e) {
          // Use default if any error occurs
          slide.style.backgroundColor = "#f0f0f0";
          slide.style.backgroundImage = `url("./images/default-project.png")`;
          console.error("Error loading project image:", e);
        }
      } else {
        // Set default background if no image
        slide.style.backgroundColor = "#f0f0f0";
        slide.style.backgroundImage = `url("./images/default-project.png")`;
      }

      slide.innerHTML = `
          <div class="slide-content">
            <h4>${project.ProjectName}</h4>
            <p>${project.CompanyName}</p>
          </div>
        `;

      // ✅ בלחיצה על הכרטיס – שמירה והפניה
      slide.addEventListener("click", () => {
        localStorage.setItem("CurrentProject", JSON.stringify(project));
        window.location.href = "projectPage.html";
      });

      wrapper.appendChild(slide);
    });

    // Initialize Swiper with additional options
    new Swiper(".recent-projects-swiper", {
      slidesPerView: 2,
      spaceBetween: 20,
      loop: true, // Enable loop
      autoplay: {
        delay: 3000, // Auto-advance every 3 seconds
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      breakpoints: {
        768: {
          slidesPerView: 3,
        },
        1024: {
          slidesPerView: 4,
        },
      },
    });
  });
});

// פופאפ צוות פרויקט

const openPopupBtn = document.getElementById("open-team-popup");
const teamList = document.getElementById("team-list");

// openPopupBtn.addEventListener("click", () => {
//   fetchTeamMembers();
//   $.fancybox.open({ src: "#team-popup", type: "inline" });
// });

function fetchTeamMembers() {
  const projectID = CurrentProject.ProjectID;
  ajaxCall(
    "GET",
    `https://localhost:7198/api/Projects/GetProjectTeam?ProjectID=${projectID}`,
    "",
    (members) => {
      console.log(members);
      teamList.innerHTML = "";
      members.forEach((member) => {
        const li = document.createElement("li");
        li.textContent = member.FullName;
        teamList.appendChild(li);
      });
    },
    () => {
      teamList.innerHTML = "<li>שגיאה בטעינת צוות</li>";
    }
  );
}

document.getElementById("add-user-btn").addEventListener("click", () => {
  const email = document.getElementById("add-user-email").value;
  const url = `https://localhost:7198/api/Projects/AddNewTeamMemberToProject?TeamMemberEmail=${encodeURIComponent(
    email
  )}&projectID=${CurrentProject.ProjectID}`;

  ajaxCall(
    "POST",
    url,
    "",
    () => {
      alert("✅ נוסף בהצלחה");
      fetchTeamMembers();
      loadTeamPreview();
    },
    () => alert("❌ שגיאה בהוספה")
  );
});

document.getElementById("remove-user-btn").addEventListener("click", () => {
  const email = document.getElementById("remove-user-email").value;
  const url = `https://localhost:7198/api/Projects/RemoveTeamMemberFromProject?TeamMemberEmail=${encodeURIComponent(
    email
  )}&ProjectID=${CurrentProject.ProjectID}`;

  ajaxCall(
    "PUT",
    url,
    "",
    () => {
      alert("✅ הוסר בהצלחה");
      fetchTeamMembers();
      loadTeamPreview();
    },
    () => alert("❌ שגיאה בהסרה")
  );
});

/*
 <!-- 🔵 פופאפ ניהול צוות -->
<div style="display: none; width: 400px;" id="team-popup">
  <h2>👥 צוות הפרויקט</h2>

  <!-- 🔹 חלק ראשון: רשימת משתמשים -->
  <div id="team-members-list">
    <ul id="team-list">
      <li>...טוען צוות</li>
    </ul>
  </div>

  <hr>

  <!-- 🔹 חלק שני: טופס הוספה -->
  <h3>➕ הוסף חבר צוות</h3>
  <input type="email" id="add-user-email" placeholder="אימייל של המשתמש" />
  <button id="add-user-btn">הוסף</button>

  <hr>

  <!-- 🔹 חלק שלישי: טופס הסרה -->
  <h3>➖ הסר חבר צוות</h3>
  <input type="email" id="remove-user-email" placeholder="אימייל של המשתמש" />
  <button id="remove-user-btn">הסר</button>
</div>*/

// New function to set up the team management button based on user role
function setupTeamManagementButton() {
  const teamBtn = document.getElementById("btn-header-team");
  const teamMenu = document.getElementById("team-dropdown-menu");

  console.log("Current Project Role:", CurrentProject.Role);

  // Check if the current user is a Team Member or Project Manager
  if (CurrentProject.Role === "TeamMember") {
    // Change button text for team members
    teamBtn.textContent = "המשימות שלי";
    teamBtn.style.backgroundColor = "#5cb85c"; // Green color for tasks button

    // For team members, show their tasks
    teamBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Load and show the user's tasks
      loadMyTasks(CurrentUser.id);
      $.fancybox.open({
        src: "#my-tasks-popup",
        type: "inline",
      });
    });

    // Hide the dropdown menu for team members
    teamMenu.style.display = "none";
  } else {
    // Default behavior for Project Managers
    teamBtn.textContent = "ניהול צוות";

    // Existing dropdown logic for project managers
    teamBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const visible = teamMenu.style.display === "block";
      teamMenu.style.display = visible ? "none" : "block";

      // הצמדת התפריט לכפתור
      const rect = teamBtn.getBoundingClientRect();
      teamMenu.style.top = `${teamBtn.offsetTop + teamBtn.offsetHeight + 5}px`;
      teamMenu.style.left = `${teamBtn.offsetLeft}px`;
    });

    // סגירה בלחיצה מחוץ
    document.addEventListener("click", () => {
      teamMenu.style.display = "none";
    });

    // מניעת סגירה כשלוחצים בתוך התפריט
    teamMenu.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Handle click on "Add team member" button in dropdown
    document
      .querySelector(".team-menu-btn:nth-child(1)")
      .addEventListener("click", () => {
        // Fetch team members and show them in the new popup
        loadCurrentTeamMembers();

        // Open the popup
        $.fancybox.open({
          src: "#add-team-member-popup",
          type: "inline",
        });
      });

    // Handle click on "Remove team member" button in dropdown
    document
      .querySelector(".team-menu-btn:nth-child(2)")
      .addEventListener("click", () => {
        // Fetch team members and show them in the remove popup
        loadRemoveTeamMembers();

        // Open the popup
        $.fancybox.open({
          src: "#remove-team-member-popup",
          type: "inline",
        });
      });

    // Handle click on "Task management" button in dropdown
    document
      .querySelector(".team-menu-btn:nth-child(3)")
      .addEventListener("click", () => {
        // Load team members into the dropdown
        loadTeamMembersForTasksDropdown();

        // Open the popup
        $.fancybox.open({
          src: "#tasks-management-popup",
          type: "inline",
        });
      });
  }
}

// Function to load current team members for the add-member popup
function loadCurrentTeamMembers() {
  const projectID = CurrentProject.ProjectID;
  const teamList = document.getElementById("current-team-list");

  ajaxCall(
    "GET",
    `https://localhost:7198/api/Projects/GetProjectTeam?ProjectID=${projectID}`,
    "",
    (members) => {
      teamList.innerHTML = "";
      if (members.length === 0) {
        teamList.innerHTML =
          "<div class='empty-team-message'>אין משתמשים בפרויקט</div>";
      } else {
        members.forEach((member) => {
          const memberItem = document.createElement("div");
          memberItem.className = "team-member-item";

          // Create user avatar
          const avatar = document.createElement("div");
          avatar.className = "team-member-avatar";

          // Use member image if available, otherwise use initials
          if (member.Image) {
            const img = document.createElement("img");
            img.src = member.Image;
            img.alt = member.FullName;
            avatar.appendChild(img);
          } else {
            // Get initials from name
            const initials = member.FullName.split(" ")
              .map((name) => name.charAt(0))
              .join("")
              .substring(0, 2)
              .toUpperCase();
            avatar.textContent = initials;
          }

          // Create member details
          const details = document.createElement("div");
          details.className = "team-member-details";
          details.textContent = member.FullName;

          // Append elements to member item
          memberItem.appendChild(avatar);
          memberItem.appendChild(details);

          teamList.appendChild(memberItem);
        });
      }

      // Add CSS for the team members list
      const style = document.createElement("style");
      style.textContent = `
        .team-member-item {
          display: flex;
          align-items: center;
          padding: 6px 8px;
          margin-bottom: 5px;
          background-color: #f8f9fa;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .team-member-item:hover {
          background-color: #e9ecef;
        }
        .team-member-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #0072ff;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-left: 8px;
          font-size: 14px;
        }
        .team-member-avatar img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }
        .team-member-details {
          font-size: 14px;
        }
        .empty-team-message {
          padding: 6px;
          text-align: center;
          color: #6c757d;
          font-style: italic;
        }
        .team-members-container {
          max-height: 150px;
          overflow-y: auto;
        }
      `;

      if (!document.getElementById("team-members-style")) {
        style.id = "team-members-style";
        document.head.appendChild(style);
      }
    },
    (err) => {
      teamList.innerHTML =
        "<div class='empty-team-message error'>שגיאה בטעינת צוות</div>";
      console.error("Error loading team members:", err);
    }
  );
}

// Function to load current team members for the remove-member popup
function loadRemoveTeamMembers() {
  const projectID = CurrentProject.ProjectID;
  const teamList = document.getElementById("remove-team-list");

  ajaxCall(
    "GET",
    `https://localhost:7198/api/Projects/GetProjectTeam?ProjectID=${projectID}`,
    "",
    (members) => {
      teamList.innerHTML = "";
      if (members.length === 0) {
        teamList.innerHTML =
          "<div class='empty-team-message'>אין משתמשים בפרויקט</div>";
      } else {
        members.forEach((member) => {
          const memberItem = document.createElement("div");
          memberItem.className = "team-member-item";

          // Create user avatar
          const avatar = document.createElement("div");
          avatar.className = "team-member-avatar";

          // Use member image if available, otherwise use initials
          if (member.Image) {
            const img = document.createElement("img");
            img.src = member.Image;
            img.alt = member.FullName;
            img.style.width = "32px";
            img.style.height = "32px";
            img.style.objectFit = "cover";
            avatar.appendChild(img);
          } else {
            // Get initials from name
            const initials = member.FullName.split(" ")
              .map((name) => name.charAt(0))
              .join("")
              .substring(0, 2)
              .toUpperCase();
            avatar.textContent = initials;
          }

          // Create member details
          const details = document.createElement("div");
          details.className = "team-member-details";
          details.textContent = member.FullName;

          // Create delete button
          const deleteBtn = document.createElement("button");
          deleteBtn.className = "team-member-delete-btn";
          deleteBtn.innerHTML = "🗑️";
          deleteBtn.title = "הסר מהפרויקט";
          deleteBtn.style.background = "none";
          deleteBtn.style.border = "none";
          deleteBtn.style.cursor = "pointer";
          deleteBtn.style.fontSize = "16px";
          deleteBtn.style.marginRight = "auto";
          deleteBtn.style.color = "#dc3545";
          deleteBtn.style.opacity = "0.7";
          deleteBtn.style.transition = "opacity 0.2s";

          // Show the delete button more prominently on hover
          memberItem.addEventListener("mouseenter", () => {
            deleteBtn.style.opacity = "1";
          });

          memberItem.addEventListener("mouseleave", () => {
            deleteBtn.style.opacity = "0.7";
          });

          // Add click event to the delete button
          deleteBtn.addEventListener("click", () => {
            showCustomConfirm(
              `האם אתה בטוח שברצונך להסיר את ${member.FullName} מהפרויקט?`,
              () => {
                // Call API to remove user
                ajaxCall(
                  "PUT",
                  `https://localhost:7198/api/Projects/RemoveTeamMemberFromProject?TeamMemberEmail=${encodeURIComponent(
                    member.Email
                  )}&ProjectID=${CurrentProject.ProjectID}`,
                  "",
                  () => {
                    showCustomAlert(
                      `${member.FullName} הוסר בהצלחה`,
                      "success",
                      false
                    );
                    loadRemoveTeamMembers(); // Refresh the list
                    loadTeamPreview(); // Update the preview in the main page
                  },
                  (err) => {
                    showCustomAlert("שגיאה בהסרת המשתמש", "error", false);
                    console.error("Error removing team member:", err);
                  }
                );
              }
            );
          });

          // Append elements to member item
          memberItem.appendChild(avatar);
          memberItem.appendChild(details);
          memberItem.appendChild(deleteBtn);

          // Set flex layout for the member item
          memberItem.style.display = "flex";
          memberItem.style.alignItems = "center";

          teamList.appendChild(memberItem);
        });
      }

      // Add CSS for the team members list if not already added
      if (!document.getElementById("remove-team-members-style")) {
        const style = document.createElement("style");
        style.id = "remove-team-members-style";
        style.textContent = `
          .team-member-item {
            display: flex;
            align-items: center;
            padding: 6px 8px;
            margin-bottom: 5px;
            background-color: #f8f9fa;
            border-radius: 6px;
            transition: all 0.2s ease;
          }
          .team-member-item:hover {
            background-color: #e9ecef;
          }
          .team-member-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: #0072ff;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-left: 8px;
            font-size: 14px;
            overflow: hidden;
          }
          .team-member-avatar img {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
          }
          .team-member-details {
            font-size: 14px;
            flex-grow: 1;
          }
          .empty-team-message {
            padding: 6px;
            text-align: center;
            color: #6c757d;
            font-style: italic;
          }
        `;
        document.head.appendChild(style);
      }
    },
    (err) => {
      teamList.innerHTML =
        "<div class='empty-team-message error'>שגיאה בטעינת צוות</div>";
      console.error("Error loading team members:", err);
    }
  );
}

// Handle add team member form submission
document.addEventListener("DOMContentLoaded", () => {
  // Add team member form submission
  document
    .getElementById("add-team-member-btn")
    .addEventListener("click", () => {
      const email = document.getElementById("add-team-member-email").value;

      if (!email || !email.trim()) {
        showCustomAlert("יש להזין כתובת מייל", "error");
        return;
      }

      const url = `https://localhost:7198/api/Projects/AddNewTeamMemberToProject?TeamMemberEmail=${encodeURIComponent(
        email
      )}&projectID=${CurrentProject.ProjectID}`;

      ajaxCall(
        "POST",
        url,
        "",
        () => {
          showCustomAlert("המשתמש נוסף בהצלחה", "success", false); // Added parameter to not close popup
          document.getElementById("add-team-member-email").value = ""; // Clear the input
          loadCurrentTeamMembers(); // Refresh the team members list
          loadTeamPreview(); // Update the preview in the main page
        },
        (err) => {
          showCustomAlert("שגיאה בהוספת המשתמש", "error", false); // Added parameter to not close popup
          console.error("Error adding team member:", err);
        }
      );
    });

  // Hide the email input field in the remove team member popup
  const removeEmailSection = document.getElementById("remove-email-section");
  if (removeEmailSection) {
    removeEmailSection.style.display = "none";
  }
});

// Function to show custom styled alerts
function showCustomAlert(message, type = "success", closePopup = true) {
  // Only close fancybox popups if closePopup is true
  if (closePopup && $.fancybox.getInstance()) {
    $.fancybox.close();

    // Small delay to ensure fancybox is closed before showing alert
    setTimeout(() => {
      displayAlert();
    }, 300);
  } else {
    displayAlert();
  }

  function displayAlert() {
    // Remove any existing alerts
    const existingAlerts = document.querySelectorAll(".custom-alert");
    existingAlerts.forEach((alert) => {
      if (alert.parentNode) {
        document.body.removeChild(alert);
      }
    });

    // Create alert container
    const alertContainer = document.createElement("div");
    alertContainer.className = `custom-alert ${type}`;

    // Create icon based on type
    const icon = document.createElement("div");
    icon.className = "alert-icon";

    if (type === "success") {
      icon.innerHTML = `
        <svg viewBox="0 0 52 52" width="50" height="50">
          <circle cx="26" cy="26" r="25" fill="none" stroke="#4CAF50" stroke-width="2"></circle>
          <path fill="none" stroke="#4CAF50" stroke-width="3" d="M14.1 27.2l7.1 7.2 16.7-16.8"></path>
        </svg>
      `;
    } else {
      icon.innerHTML = `
        <svg viewBox="0 0 52 52" width="50" height="50">
          <circle cx="26" cy="26" r="25" fill="none" stroke="#F44336" stroke-width="2"></circle>
          <line x1="18" y1="18" x2="34" y2="34" stroke="#F44336" stroke-width="3"></line>
          <line x1="34" y1="18" x2="18" y2="34" stroke="#F44336" stroke-width="3"></line>
        </svg>
      `;
    }

    // Create content
    const content = document.createElement("div");
    content.className = "alert-content";

    const title = document.createElement("h3");
    title.className = "alert-title";
    title.textContent = type === "success" ? "הצלחה!" : "שגיאה!";

    const text = document.createElement("p");
    text.className = "alert-text";
    text.textContent = message;

    content.appendChild(title);
    content.appendChild(text);

    // Create close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "alert-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", () => {
      alertContainer.classList.add("closing");
      setTimeout(() => {
        if (alertContainer.parentNode) {
          document.body.removeChild(alertContainer);
        }
      }, 300);
    });

    // Assemble the alert
    alertContainer.appendChild(icon);
    alertContainer.appendChild(content);
    alertContainer.appendChild(closeBtn);

    // Add to document
    document.body.appendChild(alertContainer);

    // Animate in
    setTimeout(() => {
      alertContainer.classList.add("show");
    }, 10);

    // Auto close after 4 seconds
    setTimeout(() => {
      alertContainer.classList.add("closing");
      setTimeout(() => {
        if (alertContainer.parentNode) {
          document.body.removeChild(alertContainer);
        }
      }, 300);
    }, 4000);
  }
}

// Function to load team members into tasks dropdown
function loadTeamMembersForTasksDropdown() {
  const projectID = CurrentProject.ProjectID;
  const userSelect = document.getElementById("task-user-select");

  // Clear the dropdown
  userSelect.innerHTML = '<option value="">בחר איש צוות...</option>';

  // Add option for the current user
  const currentUserOption = document.createElement("option");
  currentUserOption.value = CurrentUser.id;
  currentUserOption.textContent =
    CurrentUser.firstName + " " + CurrentUser.lastName + " (אני)";
  userSelect.appendChild(currentUserOption);

  // Load team members
  ajaxCall(
    "GET",
    `https://localhost:7198/api/Projects/GetProjectTeam?ProjectID=${projectID}`,
    "",
    (members) => {
      members.forEach((member) => {
        // Skip current user as we've already added them
        if (member.UserID == CurrentUser.id) return;

        const option = document.createElement("option");
        option.value = member.UserID;
        option.textContent = member.FullName;
        userSelect.appendChild(option);
      });

      // Set event listener for dropdown change
      userSelect.addEventListener("change", function () {
        const selectedUserId = this.value;
        if (selectedUserId) {
          loadTasksForUser(selectedUserId);
        } else {
          // Clear tasks if no user selected
          document.getElementById("tasks-table-body").innerHTML =
            '<tr><td colspan="3" style="text-align: center; padding: 10px;">בחר איש צוות כדי לצפות במשימות</td></tr>';
        }
      });

      // Default to current user's tasks
      userSelect.value = CurrentUser.id;
      loadTasksForUser(CurrentUser.id);
    },
    (err) => {
      console.error("שגיאה בטעינת אנשי צוות:", err);
      userSelect.innerHTML = '<option value="">שגיאה בטעינת אנשי צוות</option>';
    }
  );
}

// Function to format a date from API to local display format DD/MM/YYYY
function formatDateForDisplay(dateString) {
  if (!dateString) return "לא נקבע";

  try {
    // Parse the date, being careful about timezone issues
    const date = new Date(dateString);

    // Check if valid date
    if (isNaN(date.getTime())) {
      return "תאריך לא תקין";
    }

    // Format as DD/MM/YYYY
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  } catch (e) {
    console.error("Error formatting date for display:", e);
    return "תאריך לא תקין";
  }
}

// Function to format a date from API to YYYY-MM-DD for input fields
function formatDateForInput(dateString) {
  if (!dateString) return "";

  try {
    // Parse the date, being careful about timezone issues
    const date = new Date(dateString);

    // Check if valid date
    if (isNaN(date.getTime())) {
      return "";
    }

    // Format as YYYY-MM-DD
    return `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  } catch (e) {
    console.error("Error formatting date for input:", e);
    return "";
  }
}

// Function to convert local date to UTC for API
function formatDateForAPI(dateString) {
  if (!dateString) return null;

  try {
    // If the format is YYYY-MM-DD, parse it correctly
    if (dateString.includes("-")) {
      const [year, month, day] = dateString
        .split("-")
        .map((num) => parseInt(num, 10));

      // Create date at noon to avoid timezone issues
      const date = new Date(year, month - 1, day, 12, 0, 0);

      return date.toISOString();
    } else {
      // Handle other formats
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
      }
      return date.toISOString();
    }
  } catch (e) {
    console.error("Error formatting date for API:", e);
    throw e;
  }
}

// Function to load tasks for a specific user - update the date handling
function loadTasksForUser(userId) {
  const projectId = CurrentProject.ProjectID;
  const tasksTableBody = document.getElementById("tasks-table-body");

  // Show loading indicator
  tasksTableBody.innerHTML =
    '<tr><td colspan="4" style="text-align: center; padding: 10px;">טוען משימות...</td></tr>';

  console.log(`Loading tasks for user ${userId} in project ${projectId}`);

  // Store the selected user ID for later use
  window.selectedTaskUserId = userId;

  // Fetch tasks from API
  ajaxCall(
    "GET",
    `https://localhost:7198/api/Task/GetTasksByUserAndProject?userID=${userId}&projectID=${projectId}`,
    "",
    (tasks) => {
      console.log("Tasks received:", tasks);

      if (!tasks || tasks.length === 0) {
        tasksTableBody.innerHTML =
          '<tr><td colspan="4" style="text-align: center; padding: 10px;">לא נמצאו משימות</td></tr>';
        return;
      }

      // Clear table
      tasksTableBody.innerHTML = "";

      // Add tasks to table
      tasks.forEach((task) => {
        // Create a new row
        const row = document.createElement("tr");
        row.setAttribute("data-task-id", task.taskID);

        // Format date using our helper function
        const formattedDueDate = formatDateForDisplay(task.dueDate);
        const inputDueDate = formatDateForInput(task.dueDate);

        // Create the description cell (editable)
        const descriptionCell = document.createElement("td");
        descriptionCell.style.padding = "8px";
        descriptionCell.style.border = "1px solid #ddd";
        descriptionCell.textContent = task.description || "ללא תיאור";
        descriptionCell.setAttribute("data-original", task.description || "");
        descriptionCell.style.cursor = "pointer";
        descriptionCell.title = "לחץ לעריכה";

        // Make description editable on click
        descriptionCell.addEventListener("click", function () {
          const originalText = this.getAttribute("data-original");

          // Create input element
          const input = document.createElement("input");
          input.type = "text";
          input.value = originalText;
          input.style.width = "100%";
          input.style.padding = "4px";
          input.style.boxSizing = "border-box";

          // Replace cell content with input
          this.textContent = "";
          this.appendChild(input);
          input.focus();

          // Save on enter key
          input.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
              const newValue = this.value.trim();
              updateTask(task.taskID, newValue, inputDueDate);
            }
          });

          // Save on blur (when focus is lost)
          input.addEventListener("blur", function () {
            const newValue = this.value.trim();
            updateTask(task.taskID, newValue, inputDueDate);
          });
        });

        // Create the due date cell (editable)
        const dueDateCell = document.createElement("td");
        dueDateCell.style.padding = "8px";
        dueDateCell.style.border = "1px solid #ddd";
        dueDateCell.textContent = formattedDueDate;
        dueDateCell.setAttribute("data-original", inputDueDate || "");
        dueDateCell.style.cursor = "pointer";
        dueDateCell.title = "לחץ לעריכה";

        // Make due date editable on click
        dueDateCell.addEventListener("click", function () {
          const originalDate = this.getAttribute("data-original");

          // Create date input element
          const input = document.createElement("input");
          input.type = "date";
          input.value = originalDate;
          input.style.width = "100%";
          input.style.padding = "4px";
          input.style.boxSizing = "border-box";

          // Replace cell content with input
          this.textContent = "";
          this.appendChild(input);
          input.focus();

          // Save on enter key
          input.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
              updateTask(task.taskID, task.description, this.value);
            }
          });

          // Save on blur (when focus is lost)
          input.addEventListener("blur", function () {
            updateTask(task.taskID, task.description, this.value);
          });
        });

        // Status cell with checkbox
        const statusCell = document.createElement("td");
        statusCell.style.textAlign = "center";
        statusCell.style.padding = "8px";
        statusCell.style.border = "1px solid #ddd";

        const statusCheckbox = document.createElement("input");
        statusCheckbox.type = "checkbox";
        statusCheckbox.checked = task.isDone === true;
        statusCheckbox.disabled = true; // Read-only for now

        statusCell.appendChild(statusCheckbox);

        // Actions cell with delete button
        const actionsCell = document.createElement("td");
        actionsCell.style.textAlign = "center";
        actionsCell.style.padding = "8px";
        actionsCell.style.border = "1px solid #ddd";

        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = "🗑️";
        deleteButton.style.background = "none";
        deleteButton.style.border = "none";
        deleteButton.style.cursor = "pointer";
        deleteButton.style.fontSize = "16px";
        deleteButton.title = "מחק משימה";
        deleteButton.style.opacity = "0.5";
        deleteButton.style.transition = "opacity 0.3s";

        // Show the delete button on hover
        row.addEventListener("mouseenter", () => {
          deleteButton.style.opacity = "1";
        });

        row.addEventListener("mouseleave", () => {
          deleteButton.style.opacity = "0.5";
        });

        // Delete button click handler
        deleteButton.addEventListener("click", () => {
          if (
            confirm(
              `האם אתה בטוח שברצונך למחוק את המשימה "${task.description}"?`
            )
          ) {
            deleteTask(task.taskID);
          }
        });

        actionsCell.appendChild(deleteButton);

        // Add cells to the row
        row.appendChild(descriptionCell);
        row.appendChild(dueDateCell);
        row.appendChild(statusCell);
        row.appendChild(actionsCell);

        // Add the row to the table
        tasksTableBody.appendChild(row);
      });
    },
    (err) => {
      console.error("שגיאה בטעינת משימות:", err);
      tasksTableBody.innerHTML =
        '<tr><td colspan="4" style="text-align: center; padding: 10px; color: red;">שגיאה בטעינת משימות</td></tr>';
    }
  );
}

// Function to update a task - update date formatting
function updateTask(taskId, description, dueDate) {
  // Format date for API
  let formattedDate = null;
  if (dueDate) {
    try {
      formattedDate = formatDateForAPI(dueDate);
    } catch (e) {
      console.error("Error formatting date for API:", e);
      alert("שגיאה בפורמט התאריך");
      return;
    }
  }

  const taskData = {
    taskID: taskId,
    description: description,
    dueDate: formattedDate,
  };

  console.log("Updating task:", taskData);

  // Send the update request
  ajaxCall(
    "PUT",
    "https://localhost:7198/api/Task/UpdateTask",
    JSON.stringify(taskData),
    (response) => {
      console.log("Task updated successfully:", response);

      // Reload the tasks to reflect changes
      loadTasksForUser(window.selectedTaskUserId);
    },
    (err) => {
      console.error("Error updating task:", err);
      alert("שגיאה בעדכון המשימה");

      // Reload to restore original values
      loadTasksForUser(window.selectedTaskUserId);
    }
  );
}

// Function to delete a task
function deleteTask(taskId) {
  console.log("Deleting task ID:", taskId);

  ajaxCall(
    "PUT",
    `https://localhost:7198/api/Task/ArchiveTask?taskID=${taskId}`,
    "",
    (response) => {
      console.log("Task deleted successfully:", response);

      // Reload tasks to reflect changes
      loadTasksForUser(window.selectedTaskUserId);
    },
    (err) => {
      console.error("Error deleting task:", err);
      alert("שגיאה במחיקת המשימה");
    }
  );
}

// Add event listeners for task-related buttons
document.addEventListener("DOMContentLoaded", function () {
  // Add new task button
  document
    .getElementById("add-new-task-btn")
    .addEventListener("click", function () {
      document.getElementById("add-task-form").style.display = "block";
      document.getElementById("new-task-description").focus();
    });

  // Cancel add task button
  document
    .getElementById("cancel-new-task-btn")
    .addEventListener("click", function () {
      document.getElementById("add-task-form").style.display = "none";
      document.getElementById("new-task-description").value = "";
      document.getElementById("new-task-due-date").value = "";
    });

  // Save new task button - update date formatting
  document
    .getElementById("save-new-task-btn")
    .addEventListener("click", function () {
      const description = document
        .getElementById("new-task-description")
        .value.trim();
      const dueDate = document.getElementById("new-task-due-date").value;
      const selectedUserId = window.selectedTaskUserId;

      if (!description) {
        alert("יש להזין תיאור למשימה");
        return;
      }

      if (!selectedUserId) {
        alert("יש לבחור משתמש");
        return;
      }

      // Format date for API
      let formattedDate = null;
      if (dueDate) {
        try {
          formattedDate = formatDateForAPI(dueDate);
        } catch (e) {
          console.error("Error formatting date for API:", e);
          alert("שגיאה בפורמט התאריך");
          return;
        }
      }

      const taskData = {
        projectID: CurrentProject.ProjectID,
        userID: selectedUserId,
        description: description,
        dueDate: formattedDate,
      };

      console.log("Adding new task:", taskData);

      // Send the add task request
      ajaxCall(
        "POST",
        "https://localhost:7198/api/Task/AddTask",
        JSON.stringify(taskData),
        (response) => {
          console.log("Task added successfully:", response);

          // Clear form and hide it
          document.getElementById("add-task-form").style.display = "none";
          document.getElementById("new-task-description").value = "";
          document.getElementById("new-task-due-date").value = "";

          // Reload tasks to show the new task
          loadTasksForUser(selectedUserId);
        },
        (err) => {
          console.error("Error adding task:", err);
          alert("שגיאה בהוספת המשימה");
        }
      );
    });
});

// Add the function to load tasks for a TeamMember
function loadMyTasks(userId) {
  const projectId = CurrentProject.ProjectID;
  const tasksTableBody = document.getElementById("my-tasks-table-body");

  // Show loading indicator
  tasksTableBody.innerHTML =
    '<tr><td colspan="3" style="text-align: center; padding: 10px;">טוען משימות...</td></tr>';

  console.log(
    `Loading tasks for team member ${userId} in project ${projectId}`
  );

  // Fetch tasks from API
  ajaxCall(
    "GET",
    `https://localhost:7198/api/Task/GetTasksByUserAndProject?userID=${userId}&projectID=${projectId}`,
    "",
    (tasks) => {
      console.log("My tasks received:", tasks);

      if (!tasks || tasks.length === 0) {
        tasksTableBody.innerHTML =
          '<tr><td colspan="3" style="text-align: center; padding: 10px;">לא נמצאו משימות</td></tr>';
        return;
      }

      // Clear table
      tasksTableBody.innerHTML = "";

      // Add tasks to table
      tasks.forEach((task) => {
        // Create a new row
        const row = document.createElement("tr");
        row.setAttribute("data-task-id", task.taskID);

        // Format date using our helper function
        const formattedDueDate = formatDateForDisplay(task.dueDate);

        // Create the description cell (read-only)
        const descriptionCell = document.createElement("td");
        descriptionCell.style.padding = "8px";
        descriptionCell.style.border = "1px solid #ddd";
        descriptionCell.textContent = task.description || "ללא תיאור";

        // Create the due date cell (read-only)
        const dueDateCell = document.createElement("td");
        dueDateCell.style.padding = "8px";
        dueDateCell.style.border = "1px solid #ddd";
        dueDateCell.textContent = formattedDueDate;

        // Status cell with checkbox (can be changed)
        const statusCell = document.createElement("td");
        statusCell.style.textAlign = "center";
        statusCell.style.padding = "8px";
        statusCell.style.border = "1px solid #ddd";

        const statusCheckbox = document.createElement("input");
        statusCheckbox.type = "checkbox";
        statusCheckbox.checked = task.isDone === true;
        statusCheckbox.style.transform = "scale(1.2)"; // Make checkbox a bit larger
        statusCheckbox.style.cursor = "pointer";

        // Add change event to update task status
        statusCheckbox.addEventListener("change", function () {
          updateTaskStatus(task.taskID, this.checked);
        });

        statusCell.appendChild(statusCheckbox);

        // Add cells to the row
        row.appendChild(descriptionCell);
        row.appendChild(dueDateCell);
        row.appendChild(statusCell);

        // Add the row to the table
        tasksTableBody.appendChild(row);

        // Add visual indication of completed tasks
        if (task.isDone === true) {
          row.style.backgroundColor = "#f8f8f8";
          descriptionCell.style.textDecoration = "line-through";
          descriptionCell.style.color = "#888";
        }
      });
    },
    (err) => {
      console.error("שגיאה בטעינת משימות:", err);
      tasksTableBody.innerHTML =
        '<tr><td colspan="3" style="text-align: center; padding: 10px; color: red;">שגיאה בטעינת משימות</td></tr>';
    }
  );
}

// Function to update task status
function updateTaskStatus(taskId, isDone) {
  console.log(
    `Updating task ${taskId} status to ${
      isDone ? "completed" : "not completed"
    }`
  );

  // Send API request to update task status
  ajaxCall(
    "PUT",
    `https://localhost:7198/api/Task/UpdateTaskStatus?taskID=${taskId}&isDone=${isDone}`,
    "",
    (response) => {
      console.log("Task status updated successfully:", response);

      // Visual feedback
      const message = isDone
        ? "✅ המשימה סומנה כהושלמה"
        : "⭕ המשימה סומנה כלא הושלמה";
      const notification = document.createElement("div");
      notification.textContent = message;
      notification.style.position = "fixed";
      notification.style.top = "20px"; // Changed from bottom to top
      notification.style.left = "50%"; // Center horizontally
      notification.style.transform = "translateX(-50%)"; // Center alignment
      notification.style.backgroundColor = isDone ? "#4CAF50" : "#FF9800";
      notification.style.color = "white";
      notification.style.padding = "12px 25px"; // Slightly larger padding
      notification.style.borderRadius = "6px";
      notification.style.zIndex = "999999999"; // Super high z-index
      notification.style.opacity = "0";
      notification.style.transition = "opacity 0.3s, transform 0.3s";
      notification.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)"; // Add shadow for depth
      notification.style.fontWeight = "bold"; // Make text bold
      notification.style.fontSize = "16px"; // Slightly larger text

      // Remove any existing notifications first
      const existingNotifications = document.querySelectorAll(
        ".task-status-notification"
      );
      existingNotifications.forEach((n) => document.body.removeChild(n));

      // Add a class for easier selection
      notification.classList.add("task-status-notification");

      // Ensure it's inserted at the end of body to be on top
      document.body.appendChild(notification);

      // Fade in with a slight rise animation
      notification.style.transform = "translateX(-50%) translateY(10px)";
      setTimeout(() => {
        notification.style.opacity = "1";
        notification.style.transform = "translateX(-50%) translateY(0)";
      }, 10);

      // Fade out and remove
      setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateX(-50%) translateY(-10px)";
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 2500);

      // Update the task row appearance
      const row = document.querySelector(`tr[data-task-id="${taskId}"]`);
      if (row) {
        const descriptionCell = row.querySelector("td:first-child");

        if (isDone) {
          row.style.backgroundColor = "#f8f8f8";
          descriptionCell.style.textDecoration = "line-through";
          descriptionCell.style.color = "#888";
        } else {
          row.style.backgroundColor = "";
          descriptionCell.style.textDecoration = "";
          descriptionCell.style.color = "";
        }
      }
    },
    (err) => {
      console.error("Error updating task status:", err);
      alert("שגיאה בעדכון סטטוס המשימה");
    }
  );
}

// Function to show custom confirmation dialog
function showCustomConfirm(message, onConfirm) {
  // Remove any existing confirmation dialogs
  const existingConfirms = document.querySelectorAll(".custom-confirm");
  existingConfirms.forEach((confirm) => {
    if (confirm.parentNode) {
      document.body.removeChild(confirm);
    }
  });

  // Create confirm container
  const confirmContainer = document.createElement("div");
  confirmContainer.className = "custom-alert custom-confirm";

  // Create warning icon
  const icon = document.createElement("div");
  icon.className = "alert-icon";
  icon.innerHTML = `
    <svg viewBox="0 0 52 52" width="50" height="50">
      <circle cx="26" cy="26" r="25" fill="none" stroke="#FF9800" stroke-width="2"></circle>
      <path fill="none" stroke="#FF9800" stroke-width="3" d="M26 15v17"></path>
      <circle cx="26" cy="38" r="2" fill="#FF9800"></circle>
    </svg>
  `;

  // Create content
  const content = document.createElement("div");
  content.className = "alert-content";

  const title = document.createElement("h3");
  title.className = "alert-title";
  title.textContent = "אישור פעולה";

  const text = document.createElement("p");
  text.className = "alert-text";
  text.textContent = message;

  content.appendChild(title);
  content.appendChild(text);

  // Create buttons container
  const buttonsContainer = document.createElement("div");
  buttonsContainer.className = "confirm-buttons";

  // Create confirm button
  const confirmBtn = document.createElement("button");
  confirmBtn.className = "confirm-btn confirm-yes";
  confirmBtn.textContent = "כן, הסר";
  confirmBtn.addEventListener("click", () => {
    confirmContainer.classList.add("closing");
    setTimeout(() => {
      if (confirmContainer.parentNode) {
        document.body.removeChild(confirmContainer);
        onConfirm(); // Execute the callback function
      }
    }, 300);
  });

  // Create cancel button
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "confirm-btn confirm-no";
  cancelBtn.textContent = "ביטול";
  cancelBtn.addEventListener("click", () => {
    confirmContainer.classList.add("closing");
    setTimeout(() => {
      if (confirmContainer.parentNode) {
        document.body.removeChild(confirmContainer);
      }
    }, 300);
  });

  // Add buttons to container
  buttonsContainer.appendChild(cancelBtn);
  buttonsContainer.appendChild(confirmBtn);

  // Create close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "alert-close";
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", () => {
    confirmContainer.classList.add("closing");
    setTimeout(() => {
      if (confirmContainer.parentNode) {
        document.body.removeChild(confirmContainer);
      }
    }, 300);
  });
  // Assemble the confirm dialog
  confirmContainer.appendChild(icon);
  confirmContainer.appendChild(content);
  confirmContainer.appendChild(buttonsContainer);
  confirmContainer.appendChild(closeBtn);

  // Add to document
  document.body.appendChild(confirmContainer);

  // Animate in
  setTimeout(() => {
    confirmContainer.classList.add("show");
  }, 10);
}

// Function to handle the chat button
function setupChatButton() {
  const chatBtn = document.getElementById("btn-header-chat");

  // No functionality for now, just a placeholder button
  chatBtn.addEventListener("click", () => {
    console.log("Chat button clicked - functionality not yet implemented");
  });
}

document.addEventListener("DOMContentLoaded", function () {
  // Existing event listeners...
  renderTableFromDB();
  FillDeatils();
  loadTeamPreview();
  setupTeamManagementButton();
  setupChatButton();

  // Initialize all force-dropdown-down elements
  initializeDropdowns();
});

// Initialize dropdowns to open downward
function initializeDropdowns() {
  const dropdowns = document.querySelectorAll("select.force-dropdown-down");

  dropdowns.forEach((dropdown) => {
    // Ensure size is set
    dropdown.setAttribute("size", "1");

    // Force display block styling
    dropdown.style.display = "block";

    // Add click listener to handle dropdown behavior
    dropdown.addEventListener("mousedown", function (e) {
      // If the dropdown is already open when clicking, make sure it closes
      if (this.size > 1) {
        setTimeout(() => {
          this.size = 1;
          this.blur();
        }, 0);
      } else {
        // Only stop propagation when opening to avoid issues with fancybox
        e.stopPropagation();
      }
    });

    // Reset on blur
    dropdown.addEventListener("blur", function () {
      this.size = 1;
    });

    // Handle change event
    dropdown.addEventListener("change", function () {
      this.size = 1;
      this.blur();
    });
  });
}

// האזנה לאירוע החזרה מהוספת תווית חדשה בזמן עריכה
$(document).on("reopenEditSessionPopup", function (event, newLabelID) {
  // שחזור נתוני העריכה
  const pendingData = JSON.parse(
    localStorage.getItem("pendingEditSession") || "{}"
  );

  // פתיחת פופאפ העריכה מחדש
  const row = $(`tr[data-session-id="${pendingData.sessionId}"]`);
  const session = row.data("session");

  if (!session) return;

  // Set max date attribute to today's date
  const today = new Date().toISOString().split("T")[0];
  $("#edit-date").attr("max", today);

  // הגדרת הערכים בפופאפ
  $("#edit-session-id").val(pendingData.sessionId);
  $("#edit-date").val(pendingData.date);
  $("#edit-start-time").val(pendingData.startTime);
  $("#edit-end-time").val(pendingData.endTime);
  $("#edit-rate").val(pendingData.rate);
  $("#edit-description").val(pendingData.description);

  // פתיחת הפופאפ
  $.fancybox.open({
    src: "#edit-session-modal",
    type: "inline",
    touch: false,
    width: 600,
    maxWidth: "90%",
    autoSize: false,
    padding: 0,
    margin: 20,
    afterShow: function () {
      // Get references to form elements
      const labelSelect = document.getElementById("edit-label-id");

      // Clear any existing options and event listeners to prevent duplicates
      labelSelect.innerHTML = '<option value="">בחר תווית</option>';
      $(labelSelect).off("change");

      // Set dropdown properties
      labelSelect.setAttribute("size", "1");
      labelSelect.classList.add("force-dropdown-down");
      labelSelect.style.display = "block";

      // Add dropdown event listeners
      labelSelect.addEventListener("mousedown", function (e) {
        if (this.size > 1) {
          setTimeout(() => {
            this.size = 1;
            this.blur();
          }, 0);
        }
      });

      labelSelect.addEventListener("blur", function () {
        this.size = 1;
      });

      labelSelect.addEventListener("change", function () {
        this.size = 1;
        this.blur();

        // Handle "Add new label" option
        if (this.value === "add_new") {
          // Save form data to localStorage
          const sessionId = document.getElementById("edit-session-id").value;
          const date = document.getElementById("edit-date").value;
          const startTime = document.getElementById("edit-start-time").value;
          const endTime = document.getElementById("edit-end-time").value;
          const rate = document.getElementById("edit-rate").value;
          const description = document.getElementById("edit-description").value;

          localStorage.setItem(
            "pendingEditSession",
            JSON.stringify({
              sessionId,
              date,
              startTime,
              endTime,
              rate,
              description,
            })
          );

          // Close current popup and open add label popup
          $.fancybox.close();
          openAddLabelPopup(true);

          // Reset selection
          this.value = "";
        }
      });

      // Fetch and add labels
      const labelApi = `https://localhost:7198/api/Label/GetAllLabelsByUserID?userID=${CurrentUser.id}`;

      ajaxCall(
        "GET",
        labelApi,
        "",
        (labels) => {
          // Add label options
          labels.forEach((label) => {
            const option = document.createElement("option");
            option.value = label.labelID;
            option.textContent = label.labelName;

            // Add color styling
            if (label.labelColor) {
              option.setAttribute("data-color", label.labelColor);
              option.style.backgroundColor = label.labelColor + "20"; // צבע שקוף של התווית
            }

            labelSelect.appendChild(option);
          });

          // Add the "Add new label" option
          const addNewOption = document.createElement("option");
          addNewOption.value = "add_new";
          addNewOption.textContent = "➕ הוסף תווית חדשה";
          addNewOption.style.fontWeight = "bold";
          addNewOption.style.borderTop = "1px solid #ddd";
          addNewOption.style.marginTop = "5px";
          addNewOption.style.paddingTop = "5px";
          labelSelect.appendChild(addNewOption);

          // Set the selected value to the new label ID
          if (newLabelID) {
            labelSelect.value = newLabelID;
          }
        },
        (err) => {
          console.error("❌ שגיאה בשליפת תוויות לעריכה:", err);
        }
      );
    },
  });
});
