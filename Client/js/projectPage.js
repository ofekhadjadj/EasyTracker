let CurrentProject = JSON.parse(localStorage.getItem("CurrentProject"));
let CurrentUser = JSON.parse(localStorage.getItem("user"));
console.log("CurrentProject", CurrentProject);
console.log("User", CurrentUser);
let table;
const avatarImg = document.querySelector(".avatar-img");

// משתנים גלובליים לניהול נתוני סשנים
let allSessionsData = []; // כל הסשנים המקוריים

// משתני זמן וסטופר
let seconds = 0;
let interval;
let isRunning = false;
let totalPastSeconds = 0; // זמן עבודה כולל מקודם

function loadTeamPreview() {
  const teamContainer = document.getElementById("project-team-preview");

  // שמור את כפתור הפתיחה בצד (נוסיף אותו מחדש אחר כך)
  // const openPopupBtn = document.getElementById("open-team-popup");
  // const arrowImg = document.getElementById("open-team-popup");

  // ננקה את התוכן הקיים
  teamContainer.innerHTML = "";

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating team URL...");
  const url = apiConfig.createApiUrl(
    `Projects/GetProjectTeam?ProjectID=${CurrentProject.ProjectID}`
  );
  console.log("👥 Team URL:", url);

  ajaxCall(
    "GET",
    url,
    "",
    (members) => {
      members.forEach((member) => {
        const img = document.createElement("img");
        img.src = member.Image ? member.Image : "./images/def/user-def.png"; // 🔁 ברירת מחדל אם אין תמונה
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

// פונקציה לבדיקת שעות עתידיות
function isTimeInFuture(dateStr, timeStr) {
  const inputDateTime = toLocalDateObject(dateStr, timeStr);
  const now = new Date();
  return inputDateTime > now;
}

// פונקציה לחישוב משך זמן עם טיפול במעבר חצות
function calculateDurationWithMidnightCrossing(dateStr, startTime, endTime) {
  const startDateTime = toLocalDateObject(dateStr, startTime);
  let endDateTime = toLocalDateObject(dateStr, endTime);

  // אם שעת הסיום קודמת לשעת ההתחלה, זה אומר שעבר חצות
  if (endDateTime <= startDateTime) {
    // הוספת יום אחד לשעת הסיום
    endDateTime.setDate(endDateTime.getDate() + 1);
    console.log("מעבר חצות זוהה - הוספת יום לשעת הסיום:", endDateTime);
  }

  const durationSeconds = Math.floor((endDateTime - startDateTime) / 1000);
  return { startDateTime, endDateTime, durationSeconds };
}

// פונקציה להגבלת זמנים עתידיים בשדות זמן
function setupTimeValidation(dateFieldId, timeFieldId) {
  const dateField = document.getElementById(dateFieldId);
  const timeField = document.getElementById(timeFieldId);

  if (!dateField || !timeField) return;

  function validateTime() {
    const selectedDate = dateField.value;
    const selectedTime = timeField.value;

    if (selectedDate && selectedTime) {
      const now = new Date();
      const today = now.toISOString().split("T")[0];

      // אם התאריך הוא היום, בדוק שהשעה לא עתידית
      if (
        selectedDate === today &&
        isTimeInFuture(selectedDate, selectedTime)
      ) {
        const currentTime =
          now.getHours().toString().padStart(2, "0") +
          ":" +
          now.getMinutes().toString().padStart(2, "0");
        timeField.value = currentTime;
        showCustomAlert("לא ניתן להזין שעה עתידית", "warning", false);
      }
    }
  }

  function updateMaxTime() {
    const selectedDate = dateField.value;
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // אם התאריך שנבחר הוא היום, הגבל את השעה המקסימלית
    if (selectedDate === today) {
      const currentTime =
        now.getHours().toString().padStart(2, "0") +
        ":" +
        now.getMinutes().toString().padStart(2, "0");
      timeField.setAttribute("max", currentTime);
    } else {
      timeField.removeAttribute("max");
    }
  }

  timeField.addEventListener("blur", validateTime);
  timeField.addEventListener("change", validateTime);
  dateField.addEventListener("change", function () {
    updateMaxTime();
    validateTime();
  });

  // קריאה ראשונית להגדרת ההגבלה
  updateMaxTime();
}

//שליחה לשרת של התיאור פרויקט מהכפתור שמירת פרטים
document.getElementById("desc-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const newDescription = document.getElementById("description-textarea").value;

  const updatedProject = {
    projectid: CurrentProject.ProjectID,
    description: newDescription,
  };

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating update project URL...");
  const updateUrl = apiConfig.createApiUrl("Projects/update_project");
  console.log("🔄 Update URL:", updateUrl);

  ajaxCall(
    "PUT",
    updateUrl,
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
      console.log("🌐 Creating refresh project URL...");
      const refreshedApiUrl = apiConfig.createApiUrl(
        `Projects/GetThisProject/ProjectID/${CurrentProject.ProjectID}/UserID/${CurrentUser.id}`
      );
      console.log("🔄 Refresh URL:", refreshedApiUrl);

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
  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating labels URL...");
  const labelApi = apiConfig.createApiUrl(
    `Label/GetAllLabelsByUserID?userID=${CurrentUser.id}`
  );
  console.log("🏷️ Labels URL:", labelApi);

  // Clear any previous session description and AI states
  document.getElementById("session-description").value = "";

  // Reset AI helper states
  originalSessionText = "";
  isAiProcessing = false;

  // Hide any existing tooltips
  const aiHelperTooltip = document.getElementById("ai-helper-tooltip");
  const aiResultTooltip = document.getElementById("ai-result-tooltip");
  const aiLoading = document.getElementById("ai-loading");

  if (aiHelperTooltip) aiHelperTooltip.style.display = "none";
  if (aiResultTooltip) aiResultTooltip.style.display = "none";
  if (aiLoading) aiLoading.style.display = "none";

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
    addNewOption.value = "add-new-label";
    addNewOption.textContent = "➕ הוסף תווית חדשה";
    addNewOption.style.fontWeight = "bold";
    addNewOption.style.borderTop = "1px solid #ddd";
    addNewOption.style.marginTop = "5px";
    addNewOption.style.paddingTop = "5px";
    labelSelect.appendChild(addNewOption);

    // Add event listener for "Add new label" option
    labelSelect.addEventListener("change", function () {
      if (this.value === "add-new-label") {
        // Store the current session data
        const description = document.getElementById(
          "session-description"
        ).value;
        localStorage.setItem("pendingSessionDescription", description);

        // Open the new label popup
        openNewLabelFormProject();

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
      beforeClose: function () {
        // נקה פונקציות קול לפני סגירה
        stopVoiceRecording();
        isVoiceRecording = false;
        hasShownAiTooltip = false;

        // בדוק אם המשתמש סגר את הפופאפ בלי לסיים את הסשן
        if (isStopProcessing && window.sessionToClose) {
          console.log(
            "🔄 המשתמש סגר את הפופאפ בלי לסיים את הסשן, מחזיר את הסטופר"
          );

          // חשב את הזמן שעבר בעת שהפופאפ היה פתוח
          const popupDuration = Math.floor((Date.now() - popupOpenTime) / 1000);

          // החזר את הזמן שהיה בעת לחיצה על כפתור הסיום + הזמן שעבר בפופאפ
          seconds = window.sessionSecondsAtStop + popupDuration;

          // שחזר את מצב הסטופר
          isRunning = true;
          toggleText.textContent = "השהה";
          toggleIcon.src = "./images/puse icon.png";

          // התחל את הסטופר מחדש אם הוא לא פועל
          if (!interval) {
            interval = setInterval(updateTime, 1000);
          }

          // עדכן את התצוגה
          const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
          const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
          const s = String(seconds % 60).padStart(2, "0");
          timeDisplay.textContent = `${h}:${m}:${s}`;

          // עדכן את הפרוגרס
          const progress = Math.min(
            seconds / (CurrentProject.DurationGoal * 3600 || 3600),
            1
          );
          circle.style.strokeDashoffset = circumference * (1 - progress);
          progressFill.style.width = `${progress * 100}%`;
          progressText.textContent = `${Math.round(progress * 100)}%`;

          // נקה את הנתונים הזמניים
          window.sessionToClose = null;
          window.sessionSecondsAtStop = null;
          isStopProcessing = false;
          popupOpenTime = null;

          console.log(`✅ הסטופר חזר לפעולה עם ${seconds} שניות`);
        }
      },
      afterShow: function () {
        // Initialize AI helper for session description
        setupAiHelperForSessionDescription();

        // Initialize voice recording functionality
        setupVoiceRecording();

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

// Function to open add label popup - DEPRECATED - use openNewLabelFormProject instead
function openAddLabelPopup(fromEditSession = false) {
  // Redirect to new function
  openNewLabelFormProject();
  return;
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

          // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
          console.log("🌐 Creating add label URL...");
          const addLabelUrl = apiConfig.createApiUrl("Label/addNewLabel");
          console.log("🏷️ Add Label URL:", addLabelUrl);

          // Using the correct endpoint and method from labels.js
          $.ajax({
            url: addLabelUrl,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(newLabel),
            success: (response) => {
              alert("הקוד החדש רץ!"); // זמני לבדיקה
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
              } else if (localStorage.getItem("pendingManualSession")) {
                // חזרה לפופאפ הוספת סשן ידנית
                $(document).trigger("reopenManualSessionPopup", [
                  response.labelID,
                ]);
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

  // בדיקה האם המשתמש הנוכחי הוא מנהל הפרויקט
  if (CurrentProject.Role === "TeamMember") {
    // אם המשתמש הוא חבר צוות, נטען את שם מנהל הפרויקט
    loadProjectManagerName();
  } else {
    // אם המשתמש הוא מנהל הפרויקט, נציג את שם הלקוח
    ProjectClient.innerText = CurrentProject.CompanyName;
  }

  if (avatarImg) {
    avatarImg.src = CurrentUser?.image || "./images/def/user-def.png";
  }

  // הגדרת פונקציונליות תגיות חדשה
  setupNewLabelFunctionality();

  // רענון dropdowns של תגיות כדי להוסיף את האופציה "הוסף תגית חדשה"
  setTimeout(() => {
    refreshAllLabelDropdowns();
  }, 1000);
}

// פונקציה לטעינת שם מנהל הפרויקט
function loadProjectManagerName() {
  const ProjectClient = document.getElementById("ProjectClient");

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating team URL for project manager...");
  const url = apiConfig.createApiUrl(
    `Projects/GetProjectTeam?ProjectID=${CurrentProject.ProjectID}`
  );
  console.log("👥 Team URL for manager:", url);

  ajaxCall(
    "GET",
    url,
    "",
    (members) => {
      // חיפוש מנהל הפרויקט מתוך רשימת חברי הצוות
      const projectManager = members.find(
        (member) => member.Role === "ProjectManager"
      );

      if (projectManager) {
        // הצגת שם מנהל הפרויקט
        ProjectClient.innerText = projectManager.FullName;

        // עדכון ה-breadcrumbs גם כן
        const breadcrumbsProjName = document.getElementById(
          "breadcrumbsProjName"
        );
        let breadcrumbsText = `${CurrentProject.ProjectName} - מנהל: ${projectManager.FullName}`;
        breadcrumbsProjName.innerText = breadcrumbsText;
      } else {
        // במקרה שלא נמצא מנהל פרויקט, נציג את שם הלקוח
        ProjectClient.innerText = CurrentProject.CompanyName;
      }
    },
    (err) => {
      console.error("❌ שגיאה בשליפת נתוני מנהל הפרויקט:", err);
      // במקרה של שגיאה, נציג את שם הלקוח
      ProjectClient.innerText = CurrentProject.CompanyName;
    }
  );
}

let currentActiveSessionID = null; // משתנה לאחסון מזהה הסשן הפעיל

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

// פונקציה לבדיקת סשן פעיל בעת טעינת הדף
function checkActiveSessionOnPageLoad() {
  if (!CurrentUser || !CurrentProject) {
    console.log("🔍 אין משתמש או פרויקט נוכחי - לא בודק סשן פעיל");
    return;
  }

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating check active session URL...");
  const checkActiveSessionUrl = apiConfig.createApiUrl(
    `Session/CheckActiveSession?userID=${CurrentUser.id}&projectID=${CurrentProject.ProjectID}`
  );
  console.log("🔍 Check Active Session URL:", checkActiveSessionUrl);

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

          // התחל את הסטופר
          interval = setInterval(updateTime, 1000);
          isRunning = true;
          toggleText.textContent = "השהה";
          toggleIcon.src = "./images/puse icon.png";
          console.log("▶️ הסטופר התחיל אוטומטית - סשן פעיל");
        } else if (sessionData.SessionStatus === "Paused") {
          // סשן מושהה - השתמש ב-DurationSeconds שנשמר
          elapsedSeconds = sessionData.DurationSeconds || 0;

          console.log(`⏸️ סשן מושהה! זמן שנשמר: ${elapsedSeconds} שניות`);

          // אל תתחיל את הסטופר
          isRunning = false;
          toggleText.textContent = "המשך";
          toggleIcon.src = "./images/play-icon.png";
          console.log("⏸️ סשן מושהה - הסטופר לא פועל");
        }

        // עדכון הסטופר להתחיל מהזמן הנכון
        seconds = elapsedSeconds;

        // עדכון התצוגה
        const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");
        timeDisplay.textContent = `${h}:${m}:${s}`;

        // עדכון בר ההתקדמות
        updateOverallProgress();

        console.log("✅ סטטוס הסשן הפעיל שוחזר בהצלחה!");
      } else {
        console.log("ℹ️ אין סשן פעיל - הכפתור יישאר במצב 'התחל'");
        // וידוא שהמשתנים מתאפסים
        currentActiveSessionID = null;
        seconds = 0;
        isRunning = false;
        toggleText.textContent = "התחל";
        toggleIcon.src = "./images/play-icon.png";
      }
    },
    (xhr) => {
      console.error("❌ שגיאה בבדיקת סשן פעיל:", xhr);
    }
  );
}

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
  const now = new Date();

  // שיטה פשוטה יותר לקבלת זמן מקומי בפורמט ISO עם Z
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}

// 🟦 כפתור הפעלה
function getLocalISOStringWithoutZ() {
  const now = new Date();

  // שיטה פשוטה יותר לקבלת זמן מקומי בפורמט ISO
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
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

    // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
    console.log("🌐 Creating update session URL (pause)...");
    const updateSessionUrl = apiConfig.createApiUrl("Session/update_session");
    console.log("⏸️ Update Session URL:", updateSessionUrl);

    ajaxCall(
      "PUT",
      updateSessionUrl,
      JSON.stringify(pausedSession),
      () => {
        console.log("✅ סשן הושהה בהצלחה!");
      },
      () => {
        console.error("❌ שגיאה בהשהיית סשן.");
      }
    );
  } else {
    // בדיקה אם זה המשכת סשן קיים או התחלת סשן חדש
    const isResuming =
      currentActiveSessionID !== null && toggleText.textContent === "המשך";

    if (isResuming) {
      // 🔄 אפקט קונפטי להמשכת סשן
      triggerStartSessionCelebration(true);

      // המשכת סטופר של סשן מושהה
      const pausedSession = {
        sessionID: currentActiveSessionID,
        status: "Active",
      };

      // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
      console.log("🌐 Creating update session URL (resume)...");
      const resumeSessionUrl = apiConfig.createApiUrl("Session/update_session");
      console.log("▶️ Resume Session URL:", resumeSessionUrl);

      ajaxCall(
        "PUT",
        resumeSessionUrl,
        JSON.stringify(pausedSession),
        () => {
          console.log("✅ סשן הומשך בהצלחה!");
        },
        () => {
          console.error("❌ שגיאה בהמשכת סשן.");
        }
      );

      // המשכת הסטופר
      interval = setInterval(updateTime, 1000);
      isRunning = true;
      toggleText.textContent = "השהה";
      toggleIcon.src = "./images/puse icon.png";
    } else {
      // 🎉 אפקט קונפטי להתחלת סשן חדש
      triggerStartSessionCelebration(false);

      // קריאה לשרת לפני שמתחיל הסטופר
      const sessionStart = getLocalISOStringWithoutZ();
      console.log("🕐 זמן התחלת סשן:", sessionStart);

      // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
      console.log("🌐 Creating start auto session URL...");
      const apiUrl = apiConfig.createApiUrl(
        `Session/start_auto_session?userID=${CurrentUser.id}&projectID=${
          CurrentProject.ProjectID
        }&startDate=${encodeURIComponent(sessionStart)}`
      );
      console.log("🎬 Start Auto Session URL:", apiUrl);

      ajaxCall(
        "POST",
        apiUrl,
        "",
        (response) => {
          console.log("✅ סשן התחיל בהצלחה:", response);

          // שמירת מזהה הסשן החדש וזמן ההתחלה
          currentActiveSessionID = response.sessionID;
          window.currentSessionStartDate = sessionStart; // שמור את זמן ההתחלה

          // רענן את הטבלה מהשרת כדי לקבל את הסשן החדש
          renderTableFromDB();

          // וודא שהטבלה ממויינת נכון אחרי הרענון
          setTimeout(() => {
            if (table) {
              table
                .order([
                  [1, "desc"],
                  [2, "desc"],
                ])
                .draw();
            }
          }, 500);
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
  }
});

//סיום סשן
let isStopProcessing = false; // דגל למניעת לחיצות כפולות
let popupOpenTime = null; // זמן פתיחת הפופאפ

stopBtn.addEventListener("click", () => {
  // בדיקה שיש סשן פעיל (רץ או מושהה)
  if (!isRunning && !currentActiveSessionID) {
    showCustomAlert("לא ניתן לסיים סשן לפני שהתחלת אחד", "error");
    return;
  }

  if (isStopProcessing) {
    console.log("⚠️ כבר מעבד סגירת סשן, מתעלם מלחיצה נוספת");
    return;
  }

  isStopProcessing = true;
  popupOpenTime = Date.now(); // שמור זמן פתיחת הפופאפ

  const endDate = getLocalISOStringWithoutZ();
  const durationSeconds = seconds;

  // השתמש ב-currentActiveSessionID שמכיל את ה-ID הנכון של הסשן החדש
  if (!currentActiveSessionID) {
    console.error("❌ לא נמצא מזהה סשן פעיל.");
    isStopProcessing = false;
    return;
  }

  // נסה לקחת נתוני סשן מהטבלה, אבל אם לא קיימים - השתמש בערכי ברירת מחדל
  const lastSessionRow = $("#sessionsTable tbody tr").first();
  const sessionData = lastSessionRow.data("session");

  // שמור משתנים זמניים לצורך השליחה בסיום הפופאפ
  window.sessionToClose = {
    sessionID: currentActiveSessionID, // השתמש ב-ID הנכון מהמשתנה הגלובלי!
    projectID: sessionData ? sessionData.ProjectID : CurrentProject.ProjectID,
    startDate:
      window.currentSessionStartDate ||
      (sessionData ? sessionData.StartDate : getLocalISOStringWithoutZ()), // השתמש בזמן ההתחלה הנכון!
    endDate,
    durationSeconds,
    hourlyRate: sessionData
      ? sessionData.HourlyRate
      : CurrentProject.HourlyRate || 0,
    userID: sessionData ? sessionData.UserID : CurrentUser.id,
  };

  // שמור את הזמן המדויק שהסטופר היה עליו כשנלחץ כפתור הסיום
  window.sessionSecondsAtStop = seconds;

  // פתח פופאפ לסיום סשן (הסטופר ימשיך לרוץ)
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
  console.log("🕐 זמן התחלה:", data.startDate);
  console.log("🕐 זמן סיום:", data.endDate);

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating end session URL...");
  const endSessionUrl = apiConfig.createApiUrl("Session/update_session");
  console.log("🏁 End Session URL:", endSessionUrl);

  ajaxCall(
    "PUT",
    endSessionUrl,
    JSON.stringify(data),
    () => {
      // עצור את הסטופר לחלוטין
      clearInterval(interval);
      interval = null;
      isRunning = false;
      toggleText.textContent = "התחל";
      toggleIcon.src = "./images/play-icon.png";

      // אפס את הסטופר
      seconds = 0;
      currentActiveSessionID = null;
      window.currentSessionStartDate = null;
      timeDisplay.textContent = "00:00:00";
      circle.style.strokeDashoffset = circumference;
      progressFill.style.width = `0%`;
      progressText.textContent = `0%`;

      // נקה את הנתונים הזמניים
      window.sessionToClose = null;
      window.sessionSecondsAtStop = null;
      isStopProcessing = false;
      popupOpenTime = null;

      // Close the popup completely including overlay
      $.fancybox.close(true);

      // Reset any pending session data
      if (localStorage.getItem("pendingSessionDescription")) {
        localStorage.removeItem("pendingSessionDescription");
      }

      // Reset AI helper states
      originalSessionText = "";
      isAiProcessing = false;
      hasShownAiTooltip = false;

      // Reset voice recording states
      stopVoiceRecording();
      isVoiceRecording = false;

      // 🎉 הפעלת אפקט קונפטי לסיום סשן עם התיאור שהמשתמש מילא
      const sessionDescription =
        document.getElementById("session-description").value || "";
      triggerEndSessionCelebration(sessionDescription);

      // רענן את הטבלה מהשרת לאחר עדכון הסשן
      renderTableFromDB();

      // וודא שהטבלה מתרענה אחרי עדכון
      setTimeout(() => {
        if (table) {
          table.draw();
        }
      }, 500);
    },
    () => {
      // במקרה של שגיאה, עצור את הסטופר גם כן
      clearInterval(interval);
      interval = null;
      isRunning = false;
      toggleText.textContent = "התחל";
      toggleIcon.src = "./images/play-icon.png";
      seconds = 0;
      currentActiveSessionID = null;
      window.currentSessionStartDate = null;
      timeDisplay.textContent = "00:00:00";
      circle.style.strokeDashoffset = circumference;
      progressFill.style.width = `0%`;
      progressText.textContent = `0%`;

      // נקה את הנתונים הזמניים
      window.sessionToClose = null;
      window.sessionSecondsAtStop = null;
      isStopProcessing = false;
      popupOpenTime = null;

      // Close the popup to avoid UI issues
      $.fancybox.close(true);

      // Show error notification instead of alert
      const notification = document.createElement("div");
      notification.className = "save-notification";
      notification.innerHTML = `
        <div class="notification-icon">✕</div>
        <div class="notification-message">שגיאה בסיום הסשן</div>
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
});

$(document).ready(function () {
  table = $("#sessionsTable").DataTable({
    responsive: true,
    language: {
      searchPlaceholder: "חיפוש סשנים...",
      search: "חיפוש:",
      lengthMenu: "הצג _MENU_ סשנים",
      info: "מציג _START_ עד _END_ מתוך _TOTAL_ סשנים",
      infoEmpty: "מציג 0 עד 0 מתוך 0 סשנים",
      infoFiltered: "(מסונן מתוך _MAX_ סשנים)",
      paginate: {
        first: "ראשון",
        last: "אחרון",
        next: "הבא",
        previous: "קודם",
      },
      emptyTable: "אין סשנים זמינים בטבלה",
      zeroRecords: "לא נמצאו רשומות תואמות",
    },
    ordering: false, // Disable automatic sorting - we pre-sort the data
    columnDefs: [
      {
        targets: 1, // Date column
        render: function (data, type, row) {
          if (type === "display") {
            // For display, format the date nicely
            const { formattedDate } = formatDateTime(data);
            return formattedDate;
          }
          return data; // For other cases, return raw data
        },
      },
      {
        targets: [5, 6], // Work time and earnings columns
        className: "text-center",
      },
      {
        targets: [7, 8], // Buttons columns
        className: "text-center",
      },
    ],
    pageLength: 5,
    lengthMenu: [5, 10, 25, 50, 100],
  });

  // Add event listener for details control (expanding/collapsing session details)
  $("#sessionsTable tbody").on("click", "button.details-control", function () {
    const tr = $(this).closest("tr");
    const row = table.row(tr);

    if (row.child.isShown()) {
      row.child.hide();
      tr.removeClass("shown");
      $(this).html('<i class="fas fa-chevron-down"></i>');
    } else {
      const session = $(tr).data("session");
      if (session) {
        row.child(format(session)).show();
        tr.addClass("shown");
        $(this).html('<i class="fas fa-chevron-up"></i>');
      }
    }
  });

  // Export functionality
  document.getElementById("export-pdf").addEventListener("click", exportToPdf);
  document
    .getElementById("export-excel")
    .addEventListener("click", exportToExcel);

  // חשבונית עסקה
  document
    .getElementById("create-invoice")
    .addEventListener("click", getGreenInvoiceToken);

  // פונקציה לקבלת טוקן מחשבונית ירוקה דרך השרת
  function getGreenInvoiceToken() {
    console.log("שולח בקשה לקבלת טוקן מחשבונית ירוקה דרך השרת...");

    // הצגת מצב טעינה בכפתור
    const invoiceButton = document.getElementById("create-invoice");
    const originalButtonContent = invoiceButton.innerHTML;
    invoiceButton.innerHTML = '<span class="loading-spinner"></span> מעבד...';
    invoiceButton.disabled = true;

    // נתוני הבקשה
    const tokenData = {
      id: "8fd5bc07-bed0-42bf-b842-acf985a55392",
      secret: "K-9U54djBYtdjnkeX-Xkbg",
    };

    // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
    console.log("🌐 Creating Green Invoice token URL...");
    const tokenUrl = apiConfig.createApiUrl("GreenInvoice/GetToken");
    console.log("🧾 Token URL:", tokenUrl);

    // שליחת בקשה לשרת שלנו
    $.ajax({
      type: "POST",
      url: tokenUrl,
      data: JSON.stringify(tokenData),
      contentType: "application/json",
      success: function (response) {
        console.log("=== תשובת Green Invoice הגולמית ===");
        console.log(response);
        console.log("=== סוג התשובה ===");
        console.log(typeof response);
        console.log("=== JSON מפורמט ===");
        console.log(JSON.stringify(response, null, 2));
        console.log("===============================");

        // אם קיבלנו טוקן, נמשיך ליצירת החשבונית
        if (response && response.token) {
          createInvoice(response.token, invoiceButton, originalButtonContent);
        } else {
          showCustomAlert("לא התקבל טוקן מהשרת", "error");
          setTimeout(() => {
            invoiceButton.innerHTML = originalButtonContent;
            invoiceButton.disabled = false;
          }, 1000);
        }
      },
      error: function (xhr, status, error) {
        console.error("שגיאה בקבלת הטוקן:", error);
        console.error("פרטי השגיאה:", xhr.responseText);

        // החזרת הכפתור למצב הרגיל
        setTimeout(() => {
          invoiceButton.innerHTML = originalButtonContent;
          invoiceButton.disabled = false;
        }, 1000);
      },
    });
  }

  function createInvoice(token, invoiceButton, originalButtonContent) {
    console.log("יוצר חשבונית עסקה עם הטוקן שהתקבל...");

    // קבלת פרטי הפרויקט מ-localStorage
    const currentProject = JSON.parse(localStorage.getItem("CurrentProject"));

    if (!currentProject) {
      console.error("לא נמצאו פרטי פרויקט ב-localStorage");
      setTimeout(() => {
        invoiceButton.innerHTML = originalButtonContent;
        invoiceButton.disabled = false;
      }, 1000);
      return;
    }

    // קבלת נתוני הסשנים מהטבלה
    const tableData = getTableData();

    // חישוב סה"כ שעות עבודה
    let totalHours = 0;
    tableData.forEach((row) => {
      if (row.durationSeconds) {
        totalHours += row.durationSeconds / 3600; // המרה לשעות
      }
    });

    // יצירת נתוני החשבונית
    const invoiceData = {
      type: 300, // סוג חשבונית עסקה
      lang: "he",
      currency: "ILS",
      vatType: 0,
      add: true, // חשוב! שדה נדרש ליצירת החשבונית
      client: {
        name: currentProject.CompanyName || "לקוח",
        emails: [currentProject.Email || ""],
        taxId: currentProject.ClientTaxId || "",
        address: currentProject.ClientAddress || "",
        city: currentProject.ClientCity || "",
        zip: currentProject.ClientZip || "",
        phone: currentProject.OfficePhone || "",
        mobile: currentProject.ContactPersonPhone || "",
      },
      income: [
        {
          catalogNum: "001",
          description: `עבודה על פרויקט: ${currentProject.ProjectName}`,
          quantity: totalHours.toFixed(2),
          price: currentProject.HourlyRate || 0,
          currency: "ILS",
          currencyRate: 1,
          vatType: 0,
        },
      ],
      remarks: `דוח עבודה לפרויקט: ${currentProject.ProjectName}\nלקוח: ${
        currentProject.CompanyName
      }\nסה"כ שעות: ${totalHours.toFixed(2)}`,
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 30 יום מהיום
    };

    console.log("נתוני החשבונית שנשלחים:", invoiceData);

    // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
    console.log("🌐 Creating Green Invoice create URL...");
    const createInvoiceUrl = apiConfig.createApiUrl(
      "GreenInvoice/CreateInvoice"
    );
    console.log("🧾 Create Invoice URL:", createInvoiceUrl);

    // שליחת בקשה ליצירת החשבונית
    $.ajax({
      type: "POST",
      url: createInvoiceUrl,
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      data: JSON.stringify(invoiceData),
      success: function (response) {
        console.log("=== תשובת יצירת חשבונית מ-Green Invoice ===");
        console.log(response);
        console.log("=== סוג התשובה ===");
        console.log(typeof response);
        console.log("=== JSON מפורמט ===");
        console.log(JSON.stringify(response, null, 2));
        console.log("=======================================");

        // החזרת הכפתור למצב הרגיל
        setTimeout(() => {
          invoiceButton.innerHTML = originalButtonContent;
          invoiceButton.disabled = false;
        }, 1000);

        // יצירת פופאפ עם פרטי החשבונית
        const invoiceNumber = response.number || "לא זמין";
        const downloadUrl = response.url?.origin || "";

        // חישוב הסכום לפני מע"מ
        const totalAmount = (
          totalHours * (currentProject.HourlyRate || 0)
        ).toFixed(2);

        const invoicePopupHtml = `
          <div style="width: 500px; padding: 30px; background: white; border-radius: 15px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); font-family: Assistant; direction: rtl;">
            <div style="text-align: center; margin-bottom: 25px;">
              <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 15px;">
                <img src="./images/logo.png" alt="EasyTracker" style="width: 80px; height: 80px; object-fit: contain; margin-left: 15px;" onerror="this.style.display='none';">
                <!-- הוסף כאן את לוגו חשבונית ירוקה -->
                <img src="./images/מורנינג-שירות-לקוחות-לוגו.png" alt="חשבונית ירוקה" style="width: 120px; height: 40px; object-fit: contain; border-radius: 8px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="width: 120px; height: 40px; background: #4CAF50; border-radius: 8px; display: none; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">
                  חשבונית ירוקה
                </div>
              </div>
              <h2 style="color: #4CAF50; margin: 0; font-size: 24px; font-weight: bold;">חשבונית מספר ${invoiceNumber} מוכנה!</h2>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px; direction: rtl;">
                <span style="color: #666; font-weight: 500;">מספר חשבונית:</span>
                <span style="font-weight: bold; color: #333;">${invoiceNumber}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px; direction: rtl;">
                <span style="color: #666; font-weight: 500;">פרויקט:</span>
                <span style="font-weight: bold; color: #333;">${
                  currentProject.ProjectName
                }</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px; direction: rtl;">
                <span style="color: #666; font-weight: 500;">לקוח:</span>
                <span style="font-weight: bold; color: #333;">${
                  currentProject.CompanyName
                }</span>
              </div>
              <div style="display: flex; justify-content: space-between; direction: rtl; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 15px;">
                <span style="color: #666; font-weight: 500;">סכום לפני מע״מ:</span>
                <span style="font-weight: bold; color: #0072ff; font-size: 16px;">₪${totalAmount}</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              ${
                downloadUrl
                  ? `
                <a href="${downloadUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0072ff, #00c6ff); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; transition: transform 0.2s; margin-bottom: 15px;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                  📄 לחץ כאן להורדת החשבונית
                </a>
              `
                  : `
                <div style="background: #ffebee; color: #c62828; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                  לא ניתן היה לקבל קישור הורדה
                </div>
              `
              }
              
              <div>
                <button onclick="$.fancybox.close()" style="background: #f0f0f0; color: #333; padding: 12px 25px; border: none; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer;">סגור</button>
              </div>
            </div>
          </div>
        `;

        // פתיחת הפופאפ
        $.fancybox.open({
          src: invoicePopupHtml,
          type: "html",
          smallBtn: false,
          toolbar: false,
          touch: false,
          animationEffect: "fade",
          animationDuration: 300,
        });
      },
      error: function (xhr, status, error) {
        console.error("שגיאה ביצירת החשבונית:", error);
        console.error("פרטי השגיאה:", xhr.responseText);

        // הצגת הודעת שגיאה
        showCustomAlert("שגיאה ביצירת החשבונית: " + error, "error");

        // החזרת הכפתור למצב הרגיל
        setTimeout(() => {
          invoiceButton.innerHTML = originalButtonContent;
          invoiceButton.disabled = false;
        }, 1000);
      },
    });
  }

  function exportToPdf() {
    const currentDate = new Date().toLocaleDateString("he-IL");
    const projectName = document.getElementById("ProjectTitle").innerText;
    const clientName = document.getElementById("ProjectClient").innerText;
    const fileName = `${projectName} - סשנים - ${currentDate}.pdf`;

    // Get data from table
    const tableData = getTableData();

    // Create a window object for the PDF
    const pdfWindow = window.open("", "_blank");

    // Build HTML content for PDF (עיצוב משודרג)
    let pdfContent = `
      <html dir="rtl">
      <head>
        <title>${fileName}</title>
        <style>
          body {
            font-family: 'Assistant', Arial, sans-serif;
            background: #f7faff;
            padding: 30px;
            direction: rtl;
          }
          .pdf-header {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 25px;
            gap: 18px;
          }
          .pdf-header img {
            height: 60px;
            border-radius: 12px;
            box-shadow: 0 2px 8px #0072ff22;
          }
          .pdf-title {
            font-size: 2.1em;
            color: #0072ff;
            font-weight: bold;
            margin: 0;
            letter-spacing: 1px;
          }
          .pdf-subtitle {
            font-size: 1.2em;
            color: #333;
            margin-bottom: 8px;
            font-weight: 500;
          }
          .pdf-date {
            color: #888;
            font-size: 0.95em;
            margin-bottom: 18px;
            text-align: left;
          }
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            background: white;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 2px 12px #0072ff11;
          }
          th, td {
            padding: 12px 8px;
            text-align: center;
            font-size: 1em;
          }
          th {
            background: linear-gradient(90deg, #e3f0ff 60%, #f7faff 100%);
            color: #0072ff;
            font-weight: bold;
            border-bottom: 2px solid #b3d1ff;
          }
          tr:nth-child(even) td {
            background: #f7faff;
          }
          tr:last-child td {
            font-weight: bold;
            background: #e3f0ff;
            color: #0072ff;
            border-top: 2px solid #b3d1ff;
          }
          .total-label {
            text-align: right;
            color: #0072ff;
            font-size: 1.1em;
          }
          .footer-note {
            margin-top: 30px;
            color: #aaa;
            font-size: 0.95em;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="pdf-header">
          <img src="./images/logo.png" alt="לוגו" />
          <div>
            <div class="pdf-title">דוח סשנים: ${projectName}</div>
            <div class="pdf-subtitle">לקוח: ${clientName}</div>
          </div>
        </div>
        <div class="pdf-date">הופק בתאריך: ${currentDate}</div>
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
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" class="total-label">סה"כ:</td>
              <td style="font-weight:bold;">${formatSecondsToHHMMSS(
                totalDuration
              )}</td>
              <td style="font-weight:bold;">₪ ${totalEarnings.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <div class="footer-note">
          דוח זה הופק אוטומטית על ידי מערכת EasyTracker. כל הזכויות שמורות.
        </div>
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

  // הקוד הישן של האירועים הוסר - עכשיו משתמשים ב-DataTable events
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
  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating sessions URL...");
  const apiUrl = apiConfig.createApiUrl(
    `Session/GetAllSessionsByUserAndProject?userID=${CurrentUser.id}&projectID=${CurrentProject.ProjectID}`
  );
  console.log("📅 Sessions URL:", apiUrl);

  console.log(apiUrl);

  ajaxCall("GET", apiUrl, "", successCB, ErrorCB);

  function successCB(response) {
    console.log(response);
    console.log(table);

    // First clear the table to avoid duplication issues
    table.clear();

    // Sort sessions by StartDate in descending order (newest first, oldest last)
    response.sort((a, b) => {
      const dateA = new Date(a.StartDate);
      const dateB = new Date(b.StartDate);

      // Sort by full date and time in descending order
      return dateB.getTime() - dateA.getTime();
    });

    console.log(
      "📅 סדר הסשנים אחרי מיון (חדש ראשון, ישן אחרון):",
      response.map((s, index) => ({
        position: index + 1,
        id: s.SessionID,
        startDate: s.StartDate,
        formatted: formatDateTime(s.StartDate),
        timestamp: new Date(s.StartDate).getTime(),
      }))
    );

    // Verify sorting is correct
    for (let i = 1; i < response.length; i++) {
      const prev = new Date(response[i - 1].StartDate).getTime();
      const curr = new Date(response[i].StartDate).getTime();
      if (prev < curr) {
        console.error(
          `❌ שגיאה במיון! האינדקס ${i - 1} (${
            response[i - 1].StartDate
          }) צריך להיות אחרי האינדקס ${i} (${response[i].StartDate})`
        );
      }
    }

    // שמירת כל הנתונים במשתנה גלובלי
    allSessionsData = response;

    // הוספת כל הסשנים לטבלה בבת אחת (בלי למיין בכל הוספה)
    console.log("🔨 מתחיל להוסיף סשנים לטבלה בסדר:");
    allSessionsData.forEach((session, index) => {
      console.log(
        `   ${index + 1}. סשן ${session.SessionID} - ${
          formatDateTime(session.StartDate).formattedDate
        } ${formatDateTime(session.StartDate).time}`
      );
      addSessionRowToDataTable(session, true); // Skip sorting during bulk load
    });

    // Draw the table (data is already pre-sorted)
    console.log("📊 מציג טבלה עם נתונים ממוינים (חדש ראשון, ישן אחרון)");
    table.draw();

    // חישוב סיכומים עבור כל הסשנים (מבוסס על כל הנתונים)
    let totalDurationSeconds = 0;
    let totalEarningsValue = 0;

    allSessionsData.forEach((session) => {
      const earnings = calculateEarnings(
        session.HourlyRate,
        session.DurationSeconds
      );
      totalDurationSeconds += session.DurationSeconds;
      totalEarningsValue += parseFloat(earnings);
    });

    // Update table footer with totals (מבוסס על כל הסשנים - לא משנה כמה מוצגים)
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

    totalPastSeconds = allSessionsData.reduce(
      (sum, session) => sum + session.DurationSeconds,
      0
    );
    updateOverallProgress();

    console.log(
      "✅ All sessions loaded to DataTable - total sessions:",
      allSessionsData.length
    );

    //הסרת סשן מהטבלה
    document
      .getElementById("sessionsTable")
      .addEventListener("click", function (e) {
        // Check if the clicked element is the button or the icon inside it
        if (
          e.target.classList.contains("delete-btn") ||
          (e.target.tagName === "I" && e.target.closest(".delete-btn"))
        ) {
          e.preventDefault();
          e.stopPropagation();

          const row = e.target.closest("tr");
          const sessionId = row.getAttribute("data-session-id");
          const session = $(row).data("session");

          if (!session) {
            console.warn("⚠️ לא נמצא session לשורה הזו.");
            return;
          }

          // בדיקה שהסשן לא פעיל (יש לו EndDate)
          if (!session.EndDate) {
            console.log("⚠️ לא ניתן למחוק סשן פעיל");
            return;
          }

          // בדיקה שאין כבר פופאפ פתוח
          if ($.fancybox.getInstance()) {
            console.log("פופאפ כבר פתוח, מתעלם מהקליק");
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
            <button class="gradient-button" onclick="$.fancybox.close()">ביטול</button>
          </div>
        </div>
      `;

          $.fancybox.open({
            src: popupHtml,
            type: "html",
            smallBtn: false,
            afterShow: function () {
              // הוספת event listener רק לאחר שהפופאפ נפתח
              $("#confirmDeleteSessionBtn")
                .off("click")
                .on("click", function () {
                  const button = $(this);
                  if (button.data("deleting")) {
                    return false;
                  }
                  button.data("deleting", true);

                  deleteSession(sessionId, row, session.DurationSeconds);
                  $.fancybox.close();

                  setTimeout(() => {
                    button.data("deleting", false);
                  }, 1000);
                });
            },
            beforeClose: function () {
              // ניקוי event listeners
              $("#confirmDeleteSessionBtn").off("click");
            },
          });
        }
      });

    function deleteSession(sessionId, row, durationSeconds) {
      // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
      console.log("🌐 Creating delete session URL...");
      const apiUrl = apiConfig.createApiUrl(
        `Session/delete_session?SessionID=${sessionId}`
      );
      console.log("🗑️ Delete Session URL:", apiUrl);

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

          // עדכון הנתונים הגלובליים
          const sessionIdToRemove = parseInt(sessionId);
          allSessionsData = allSessionsData.filter(
            (session) => session.SessionID !== sessionIdToRemove
          );
          // displayedSessionsCount = Math.min(
          //   displayedSessionsCount - 1,
          //   allSessionsData.length
          // );
          // updateLoadMoreButton(); // הסרת הקריאה - עכשיו משתמשים ב-DataTable
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

// פונקציה זו הוסרה - עכשיו משתמשים ב-DataTable pagination

// פונקציה להוספת שורת סשן יחידה לטבלת DataTable
function addSessionRowToDataTable(session, skipSort = false) {
  const rawDate = session.StartDate;
  const { time, formattedDate } = formatDateTime(rawDate);

  const endTimeDisplay = session.EndDate
    ? formatDateTime(session.EndDate).time
    : "--:--:--";

  // Calculate earnings for this session
  const earnings = calculateEarnings(
    session.HourlyRate,
    session.DurationSeconds
  );

  // Enhanced label style with better visual presentation
  const labelHtml = `<span style="width: auto; height: auto; background-color: ${
    session.LabelColor ?? "#e0e0e0"
  }; color: black; display: inline-block; padding: 6px 12px; border-radius: 20px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${
    session.LabelName ?? "-"
  }</span>`;

  // בדיקה אם הסשן פעיל (אין לו EndDate) - אם כן, לא להציג כפתורי עריכה ומחיקה
  const isActiveSession = !session.EndDate;
  const actionButtons = isActiveSession
    ? '<span style="color: #0072ff; font-weight: 600; font-size: 14px;">סשן פעיל</span>'
    : '<button class="edit-btn"><i class="fas fa-edit"></i></button><button class="delete-btn"><i class="fas fa-trash-alt"></i></button>';

  const newRow = [
    labelHtml, // תווית
    session.StartDate, // תאריך גולמי למיון (תוצג כתאריך מפורמט)
    time, // שעת התחלה
    endTimeDisplay, // שעת סיום
    session.HourlyRate, // תעריף
    formatSecondsToHHMMSS(session.DurationSeconds), // משך זמן
    earnings, // שכר
    actionButtons, // כפתורים (רק אם הסשן לא פעיל)
    '<button class="details-control"><i class="fas fa-chevron-down"></i></button>', // פרטים נוספים
  ];

  // Add row to table
  const rowNode = table.row.add(newRow).node();

  // Store session data in the row
  $(rowNode).data("session", session); // שמירת הסשן כולו
  $(rowNode).attr("data-session-id", session.SessionID); // שמירת ה-ID כשדה data

  // For new sessions added individually, we need to insert at the correct position
  if (!skipSort) {
    console.log("📊 הוספת סשן חדש - רענון מלא מהשרת");
    // Instead of trying to sort, refresh the entire table from server to maintain correct order
    setTimeout(() => {
      renderTableFromDB();
    }, 100);
  }
}

// פונקציה זו הוסרה - עכשיו משתמשים ב-DataTable pagination

// פתיחת פופאפ עריכת סשן
$(document).on("click", ".edit-btn, .edit-btn i", function () {
  const row = $(this).closest("tr");
  const session = row.data("session");
  if (!session) return;

  // בדיקה שהסשן לא פעיל (יש לו EndDate)
  if (!session.EndDate) {
    console.log("⚠️ לא ניתן לערוך סשן פעיל");
    return;
  }

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

  // הגבלת זמנים עתידיים בעריכת סשן
  setupTimeValidation("edit-date", "edit-start-time");
  setupTimeValidation("edit-date", "edit-end-time");

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

      // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה - עריכת סשן נוספת
      console.log("🌐 Creating edit session additional labels URL...");
      const labelApi = apiConfig.createApiUrl(
        `Label/GetAllLabelsByUserID?userID=${CurrentUser.id}`
      );
      console.log("🏷️ Edit Session Additional Labels URL:", labelApi);

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

  // בדיקת שעות עתידיות
  if (isTimeInFuture(startDate, startTime)) {
    showCustomAlert("לא ניתן להזין שעת התחלה עתידית", "error", false);
    return;
  }

  if (isTimeInFuture(startDate, endTime)) {
    showCustomAlert("לא ניתן להזין שעת סיום עתידית", "error", false);
    return;
  }

  // חישוב זמנים עם טיפול במעבר חצות
  const { startDateTime, endDateTime, durationSeconds } =
    calculateDurationWithMidnightCrossing(startDate, startTime, endTime);

  // בדיקת תקינות משך הסשן (מקסימום 24 שעות)
  if (durationSeconds > 24 * 60 * 60) {
    showCustomAlert("משך הסשן לא יכול להיות יותר מ-24 שעות", "error", false);
    return;
  }

  if (durationSeconds <= 0) {
    showCustomAlert("משך הסשן חייב להיות חיובי", "error", false);
    return;
  }

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

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating edit session URL...");
  const apiUrl = apiConfig.createApiUrl("Session/update_session");
  console.log("✏️ Edit Session URL:", apiUrl);

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
  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating last 5 projects URL...");
  const apiUrl = apiConfig.createApiUrl(
    `Projects/GetLast5ProjectsByUserId/${CurrentUser.id}`
  );
  console.log("📂 Last 5 Projects URL:", apiUrl);

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

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating fetch team URL...");
  const teamUrl = apiConfig.createApiUrl(
    `Projects/GetProjectTeam?ProjectID=${projectID}`
  );
  console.log("👥 Fetch Team URL:", teamUrl);

  ajaxCall(
    "GET",
    teamUrl,
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

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating add team member URL...");
  const url = apiConfig.createApiUrl(
    `Projects/AddNewTeamMemberToProject?TeamMemberEmail=${encodeURIComponent(
      email
    )}&projectID=${CurrentProject.ProjectID}`
  );
  console.log("➕ Add Team Member URL:", url);

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

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating remove team member URL...");
  const url = apiConfig.createApiUrl(
    `Projects/RemoveTeamMemberFromProject?TeamMemberEmail=${encodeURIComponent(
      email
    )}&ProjectID=${CurrentProject.ProjectID}`
  );
  console.log("➖ Remove Team Member URL:", url);

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

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating current team members URL...");
  const teamUrl = apiConfig.createApiUrl(
    `Projects/GetProjectTeam?ProjectID=${projectID}`
  );
  console.log("👥 Current Team Members URL:", teamUrl);

  ajaxCall(
    "GET",
    teamUrl,
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

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating remove team members URL...");
  const teamUrl = apiConfig.createApiUrl(
    `Projects/GetProjectTeam?ProjectID=${projectID}`
  );
  console.log("👥 Remove Team Members URL:", teamUrl);

  ajaxCall(
    "GET",
    teamUrl,
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
                // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
                console.log("🌐 Creating remove team member URL from list...");
                const removeUrl = apiConfig.createApiUrl(
                  `Projects/RemoveTeamMemberFromProject?TeamMemberEmail=${encodeURIComponent(
                    member.Email
                  )}&ProjectID=${CurrentProject.ProjectID}`
                );
                console.log("🗑️ Remove Team Member from List URL:", removeUrl);

                ajaxCall(
                  "PUT",
                  removeUrl,
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

      // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
      console.log("🌐 Creating add team member by email URL...");
      const url = apiConfig.createApiUrl(
        `Projects/AddNewTeamMemberToProject?TeamMemberEmail=${encodeURIComponent(
          email
        )}&projectID=${CurrentProject.ProjectID}`
      );
      console.log("➕ Add Team Member by Email URL:", url);

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

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating tasks dropdown team URL...");
  const teamUrl = apiConfig.createApiUrl(
    `Projects/GetProjectTeam?ProjectID=${projectID}`
  );
  console.log("📋 Tasks Dropdown Team URL:", teamUrl);

  // Load team members
  ajaxCall(
    "GET",
    teamUrl,
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

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating tasks URL...");
  const tasksUrl = apiConfig.createApiUrl(
    `Task/GetTasksByUserAndProject?userID=${userId}&projectID=${projectId}`
  );
  console.log("📋 Tasks URL:", tasksUrl);

  // Fetch tasks from API
  ajaxCall(
    "GET",
    tasksUrl,
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

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating update task URL...");
  const updateTaskUrl = apiConfig.createApiUrl("Task/UpdateTask");
  console.log("📝 Update Task URL:", updateTaskUrl);

  // Send the update request
  ajaxCall(
    "PUT",
    updateTaskUrl,
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

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating archive task URL...");
  const archiveTaskUrl = apiConfig.createApiUrl(
    `Task/ArchiveTask?taskID=${taskId}`
  );
  console.log("🗑️ Archive Task URL:", archiveTaskUrl);

  ajaxCall(
    "PUT",
    archiveTaskUrl,
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

      // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
      console.log("🌐 Creating add task URL...");
      const addTaskUrl = apiConfig.createApiUrl("Task/AddTask");
      console.log("➕ Add Task URL:", addTaskUrl);

      // Send the add task request
      ajaxCall(
        "POST",
        addTaskUrl,
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

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating my tasks URL...");
  const myTasksUrl = apiConfig.createApiUrl(
    `Task/GetTasksByUserAndProject?userID=${userId}&projectID=${projectId}`
  );
  console.log("🎯 My Tasks URL:", myTasksUrl);

  // Fetch tasks from API
  ajaxCall(
    "GET",
    myTasksUrl,
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

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating update task status URL...");
  const updateStatusUrl = apiConfig.createApiUrl(
    `Task/UpdateTaskStatus?taskID=${taskId}&isDone=${isDone}`
  );
  console.log("✅ Update Task Status URL:", updateStatusUrl);

  // Send API request to update task status
  ajaxCall(
    "PUT",
    updateStatusUrl,
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

// Function to show custom confirmation dialog - styled like session delete popup
function showCustomConfirm(message, onConfirm, confirmBtnText = "כן, בצע") {
  // בדיקה שאין כבר פופאפ פתוח
  if ($.fancybox.getInstance()) {
    console.log("פופאפ כבר פתוח, מתעלם מהקליק");
    return;
  }

  // כל כפתורי האישור יהיו באדום (הן "כן, סמן" והן "כן, החזר")
  const buttonStyle =
    "background: linear-gradient(135deg, #d50000, #ff4e50); box-shadow: 0 2px 5px rgba(255, 78, 80, 0.3);";

  // יצירת HTML עבור הפופאפ בסגנון זהה לפופאפ מחיקת סשן
  const popupHtml = `
    <div style="max-width: 400px; text-align: center; font-family: Assistant; padding: 20px;">
      <h3>אישור פעולה</h3>
      <p>${message}</p>
      <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
        <button class="gradient-button" id="confirmCustomActionBtn" style="${buttonStyle} color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold;">${confirmBtnText}</button>
        <button class="gradient-button" onclick="$.fancybox.close()">ביטול</button>
      </div>
    </div>
  `;

  $.fancybox.open({
    src: popupHtml,
    type: "html",
    smallBtn: false,
    afterShow: function () {
      // הוספת event listener רק לאחר שהפופאפ נפתח
      $("#confirmCustomActionBtn")
        .off("click")
        .on("click", function () {
          const button = $(this);
          if (button.data("processing")) {
            return false;
          }
          button.data("processing", true);

          onConfirm(); // ביצוע הפעולה
          $.fancybox.close();

          setTimeout(() => {
            button.data("processing", false);
          }, 1000);
        });
    },
    beforeClose: function () {
      // ניקוי event listeners
      $("#confirmCustomActionBtn").off("click");
    },
  });
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

  // בדיקת סשן פעיל בעת טעינת הדף - אחרי שהטבלה נטענה
  setTimeout(() => {
    checkActiveSessionOnPageLoad();
  }, 1000);

  // --- התחלה: עדכון טוגל סטטוס פרויקט ---
  setupProjectStatusToggle();
  // --- סוף: עדכון טוגל סטטוס פרויקט ---

  // --- התחלה: שליפת מצב הפרויקט מהשרת לפני עדכון טוגל סטטוס ---
  refreshProjectFromServer().then(() => {
    setupProjectStatusToggle();
  });
  // --- סוף: שליפת מצב הפרויקט מהשרת ---
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

  // הגבלת זמנים עתידיים בעריכת סשן
  setupTimeValidation("edit-date", "edit-start-time");
  setupTimeValidation("edit-date", "edit-end-time");

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

      // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה - תוויות חדשות
      console.log("🌐 Creating new labels URL...");
      const labelApi = apiConfig.createApiUrl(
        `Label/GetAllLabelsByUserID?userID=${CurrentUser.id}`
      );
      console.log("🏷️ New Labels URL:", labelApi);

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

function setPlayStopDisabled(disabled) {
  const playBtn = document.getElementById("toggle-btn");
  const stopBtn = document.getElementById("stop-btn");
  if (playBtn && stopBtn) {
    playBtn.disabled = disabled;
    stopBtn.disabled = disabled;
    if (disabled) {
      playBtn.classList.add("disabled-btn");
      stopBtn.classList.add("disabled-btn");
    } else {
      playBtn.classList.remove("disabled-btn");
      stopBtn.classList.remove("disabled-btn");
    }
  }
}

function setupProjectStatusToggle() {
  const toggle = document.getElementById("project-status-toggle");
  if (!toggle) return;

  // בדיקת הרשאות - רק מנהל פרויקט יכול לשנות סטטוס פרויקט
  const isProjectManager = CurrentProject.Role === "ProjectManager";
  const toggleContainer = toggle.closest(".toggle-container");

  if (!isProjectManager) {
    // אם המשתמש אינו מנהל פרויקט, הפוך את הטוגל ללא זמין
    toggleContainer.classList.add("disabled");

    // הוסף הסבר שזה רק למנהל פרויקט
    const toggleLabel = toggleContainer.querySelector(".toggle-label");
    if (toggleLabel) {
      toggleLabel.textContent = "פרויקט הושלם (רק מנהל פרויקט)";
    }
  } else {
    // אם המשתמש הוא מנהל פרויקט, וודא שהטוגל פעיל
    toggleContainer.classList.remove("disabled");

    const toggleLabel = toggleContainer.querySelector(".toggle-label");
    if (toggleLabel) {
      toggleLabel.textContent = "פרויקט הושלם";
    }
  }

  // עדכון מצב הטוגל בהתאם לסטטוס הפרויקט
  if (CurrentProject.IsDone || CurrentProject.isDone) {
    toggle.classList.add("active");
    setPlayStopDisabled(true);
  } else {
    toggle.classList.remove("active");
    setPlayStopDisabled(false);
  }

  // הוסף event listener לטוגל (רק אם המשתמש הוא מנהל פרויקט)
  toggle.onclick = function () {
    // בדיקת הרשאות נוספת
    if (!isProjectManager) {
      showCustomAlert(
        "רק מנהל הפרויקט יכול לשנות את סטטוס הפרויקט",
        "error",
        false
      );
      return;
    }
    const isCurrentlyDone = toggle.classList.contains("active");
    const newStatus = !isCurrentlyDone;

    const confirmMessage = newStatus
      ? "האם לסמן את הפרויקט כהושלם?"
      : "האם להחזיר את הפרויקט למצב פעיל?";

    const confirmText = newStatus ? "כן, סמן" : "כן, החזר";

    showCustomConfirm(
      confirmMessage,
      () => {
        // החלפת מצב הטוגל מיידית למשוב חזותי
        if (newStatus) {
          toggle.classList.add("active");
          setPlayStopDisabled(true);
        } else {
          toggle.classList.remove("active");
          setPlayStopDisabled(false);
        }

        $.ajax({
          // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
          url: apiConfig.createApiUrl(
            `Projects/MarkProjectAsDone?projectID=${CurrentProject.ProjectID}`
          ),
          type: "PUT",
          success: function () {
            if (newStatus) {
              CurrentProject.IsDone = true;
            } else {
              // שלוף מהשרת את הפרויקט המעודכן אחרי החזרה לפעיל
              $.ajax({
                // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
                url: apiConfig.createApiUrl(
                  `Projects/GetThisProject/ProjectID/${CurrentProject.ProjectID}/UserID/${CurrentUser.id}`
                ),
                type: "GET",
                success: function (updatedProject) {
                  CurrentProject = updatedProject;
                  localStorage.setItem(
                    "CurrentProject",
                    JSON.stringify(CurrentProject)
                  );
                  setupProjectStatusToggle();
                  FillDeatils(); // עדכון כותרות/סטטוס
                },
              });
              return;
            }

            localStorage.setItem(
              "CurrentProject",
              JSON.stringify(CurrentProject)
            );
          },
          error: function () {
            // החזר לסטטוס הקודם במקרה של שגיאה
            if (newStatus) {
              toggle.classList.remove("active");
              setPlayStopDisabled(false);
            } else {
              toggle.classList.add("active");
              setPlayStopDisabled(true);
            }
            alert("אירעה שגיאה בעדכון סטטוס הפרויקט.");
          },
        });
      },
      confirmText
    );
  };
}

// --- סוף: עדכון טוגל סטטוס פרויקט ---

// --- התחלה: שליפת מצב הפרויקט מהשרת ---
function refreshProjectFromServer() {
  return new Promise((resolve, reject) => {
    if (!CurrentProject || !CurrentProject.ProjectID || !CurrentUser?.id) {
      resolve();
      return;
    }
    // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
    console.log("🌐 Creating refresh project URL...");
    const url = apiConfig.createApiUrl(
      `Projects/GetThisProject/ProjectID/${CurrentProject.ProjectID}/UserID/${CurrentUser.id}`
    );
    console.log("🔄 Refresh Project URL:", url);

    $.ajax({
      url: url,
      type: "GET",
      success: function (updatedProject) {
        CurrentProject = updatedProject;
        localStorage.setItem("CurrentProject", JSON.stringify(CurrentProject));
        resolve();
      },
      error: function () {
        resolve(); // גם אם נכשל, נמשיך הלאה
      },
    });
  });
}
// --- סוף: שליפת מצב הפרויקט מהשרת ---

// AI Helper Functions for Session Description
let originalSessionText = "";
let isAiProcessing = false;

// משתנה גלובלי למעקב אחר הצגת AI Helper
let hasShownAiTooltip = false;

function setupAiHelperForSessionDescription() {
  const sessionDescInput = document.getElementById("session-description");
  const aiHelperTooltip = document.getElementById("ai-helper-tooltip");
  const aiResultTooltip = document.getElementById("ai-result-tooltip");
  const aiLoading = document.getElementById("ai-loading");

  if (!sessionDescInput) return;

  let typingTimer;

  // Listen for typing in the description field
  sessionDescInput.addEventListener("input", function () {
    clearTimeout(typingTimer);

    // רק אם לא בתהליך הקלטה קולית ולא הוצג כבר הטולטיפ
    if (
      this.value.trim().length > 3 &&
      !hasShownAiTooltip &&
      !isAiProcessing &&
      !isVoiceRecording
    ) {
      showAiHelperTooltip();
      hasShownAiTooltip = true;
    }
  });

  // Hide tooltip when clicking elsewhere
  document.addEventListener("click", function (e) {
    if (
      !e.target.closest("#ai-helper-tooltip") &&
      !e.target.closest("#session-description")
    ) {
      hideAiHelperTooltip();
    }
  });

  // AI Helper Yes button
  document
    .getElementById("ai-helper-yes-btn")
    .addEventListener("click", function () {
      const currentText = sessionDescInput.value.trim();
      if (currentText.length < 3) {
        alert("יש להזין לפחות כמה מילים כדי שהבינה המלאכותית תוכל לעזור");
        return;
      }

      originalSessionText = currentText;
      hideAiHelperTooltip();
      showAiLoading();
      callGeminiAPI(currentText);
    });

  // AI Result buttons
  document
    .getElementById("ai-approve-btn")
    .addEventListener("click", function () {
      hideAiResultTooltip();
      hasShownTooltip = false; // Reset flag to allow tooltip to show again for new text
    });

  document
    .getElementById("ai-reject-btn")
    .addEventListener("click", function () {
      sessionDescInput.value = originalSessionText;
      hideAiResultTooltip();
      hasShownTooltip = false; // Reset flag
    });
}

function showAiHelperTooltip() {
  const tooltip = document.getElementById("ai-helper-tooltip");
  if (tooltip) {
    tooltip.style.display = "block";
  }
}

function hideAiHelperTooltip() {
  const tooltip = document.getElementById("ai-helper-tooltip");
  if (tooltip) {
    tooltip.style.display = "none";
  }
}

function showAiLoading() {
  const loading = document.getElementById("ai-loading");
  if (loading) {
    loading.style.display = "block";
    isAiProcessing = true;
  }
}

function hideAiLoading() {
  const loading = document.getElementById("ai-loading");
  if (loading) {
    loading.style.display = "none";
    isAiProcessing = false;
  }
}

function showAiResultTooltip() {
  const tooltip = document.getElementById("ai-result-tooltip");
  if (tooltip) {
    tooltip.style.display = "block";
  }
}

function hideAiResultTooltip() {
  const tooltip = document.getElementById("ai-result-tooltip");
  if (tooltip) {
    tooltip.style.display = "none";
  }
}

function callGeminiAPI(text) {
  const prompt = `נסח בצורה מקצועית ועניינית את התיאור הבא של סשן עבודה. 
שמור על הדברים ממוקדים, מובנים ומדויקים מבלי לנפח יותר מידי.
השב בסגנון פסקה רציפה ולא בבולטים או רשימות.
השב רק עם הטקסט המנוסח מחדש ללא הסברים או הוספות:

"${text}"`;

  const requestData = {
    prompt: prompt,
  };

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating Gemini API URL...");
  const geminiUrl = apiConfig.createApiUrl("Gemini/ask");
  console.log("🤖 Gemini URL:", geminiUrl);

  ajaxCall(
    "POST",
    geminiUrl,
    JSON.stringify(requestData),
    (response) => {
      console.log("תשובה גולמית מהבינה המלאכותית:", response);
      console.log("סוג התשובה:", typeof response);

      hideAiLoading();

      // Update the textarea with the improved text
      const sessionDescInput = document.getElementById("session-description");

      // Try different response formats
      let aiResponse = null;

      if (typeof response === "string") {
        aiResponse = response;
      } else if (
        response &&
        response.candidates &&
        response.candidates.length > 0 &&
        response.candidates[0].content &&
        response.candidates[0].content.parts &&
        response.candidates[0].content.parts.length > 0 &&
        response.candidates[0].content.parts[0].text
      ) {
        // Gemini API format: response.candidates[0].content.parts[0].text
        aiResponse = response.candidates[0].content.parts[0].text;
      } else if (response && response.response) {
        aiResponse = response.response;
      } else if (response && response.result) {
        aiResponse = response.result;
      } else if (response && response.data) {
        aiResponse = response.data;
      } else if (response && response.text) {
        aiResponse = response.text;
      } else if (response && response.content) {
        aiResponse = response.content;
      } else if (response && response.message) {
        aiResponse = response.message;
      }

      console.log("התגובה שנמצאה:", aiResponse);

      if (sessionDescInput && aiResponse && aiResponse.trim()) {
        sessionDescInput.value = aiResponse.trim();
        showAiResultTooltip();
      } else {
        console.error("לא נמצאה תגובה תקינה:", response);
        alert(
          "לא התקבלה תשובה תקינה מהבינה המלאכותית. נא לבדוק את החיבור לשרת."
        );
        if (sessionDescInput) {
          sessionDescInput.value = originalSessionText;
        }
      }
    },
    (xhr, status, error) => {
      console.error("שגיאה בקריאה לבינה מלאכותית:", error);
      console.error("פרטי השגיאה:", xhr.responseText);
      console.error("סטטוס:", status);
      hideAiLoading();

      const sessionDescInput = document.getElementById("session-description");
      if (sessionDescInput) {
        sessionDescInput.value = originalSessionText;
      }

      let errorMessage = "אירעה שגיאה בהתקשרות עם הבינה המלאכותית.";

      if (xhr.status === 0) {
        errorMessage += " בדוק את החיבור לאינטרנט ולשרת.";
      } else if (xhr.status >= 500) {
        errorMessage += " שגיאה בשרת. נסה שוב מאוחר יותר.";
      } else if (xhr.status === 404) {
        errorMessage += " API לא נמצא.";
      } else {
        errorMessage += ` (קוד שגיאה: ${xhr.status})`;
      }

      alert(errorMessage);
    }
  );
}

// --- התחלה: הוספת סשן ידנית ---

// פתיחת פופאפ הוספת סשן ידנית
document.addEventListener("DOMContentLoaded", function () {
  const addManualSessionBtn = document.getElementById("add-manual-session-btn");
  if (addManualSessionBtn) {
    addManualSessionBtn.addEventListener("click", openAddManualSessionPopup);
  }
});

function openAddManualSessionPopup() {
  console.log("🔄 פותח פופאפ הוספת סשן ידנית");

  // איפוס שדות הטופס
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("manual-date").value = today;
  document.getElementById("manual-date").max = today;
  document.getElementById("manual-rate").value =
    CurrentProject.HourlyRate || "";
  document.getElementById("manual-start-time").value = "";
  document.getElementById("manual-end-time").value = "";
  document.getElementById("manual-description").value = "";

  // הגבלת זמנים עתידיים
  setupTimeValidation("manual-date", "manual-start-time");
  setupTimeValidation("manual-date", "manual-end-time");

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה - סשן ידני
  console.log("🌐 Creating manual session labels URL...");
  const labelSelect = document.getElementById("manual-label-id");
  labelSelect.innerHTML = '<option value="">בחר תווית</option>';

  const labelApi = apiConfig.createApiUrl(
    `Label/GetAllLabelsByUserID?userID=${CurrentUser.id}`
  );
  console.log("🏷️ Manual Session Labels URL:", labelApi);

  ajaxCall(
    "GET",
    labelApi,
    "",
    (labels) => {
      // הוספת תוויות
      labels.forEach((label) => {
        const option = document.createElement("option");
        option.value = label.labelID;
        option.textContent = label.labelName;

        if (label.labelColor) {
          option.setAttribute("data-color", label.labelColor);
          option.style.backgroundColor = label.labelColor + "20";
        }

        labelSelect.appendChild(option);
      });

      // הוספת אפשרות ליצירת תווית חדשה
      const addNewOption = document.createElement("option");
      addNewOption.value = "add_new";
      addNewOption.textContent = "➕ הוסף תווית חדשה";
      addNewOption.style.fontWeight = "bold";
      addNewOption.style.borderTop = "1px solid #ddd";
      addNewOption.style.marginTop = "5px";
      addNewOption.style.paddingTop = "5px";
      labelSelect.appendChild(addNewOption);

      // טיפול בבחירת "הוסף תווית חדשה"
      labelSelect.addEventListener("change", function () {
        if (this.value === "add_new") {
          // שמירת נתוני הטופס
          const formData = {
            date: document.getElementById("manual-date").value,
            rate: document.getElementById("manual-rate").value,
            startTime: document.getElementById("manual-start-time").value,
            endTime: document.getElementById("manual-end-time").value,
            description: document.getElementById("manual-description").value,
          };
          localStorage.setItem(
            "pendingManualSession",
            JSON.stringify(formData)
          );

          // פתיחת פופאפ הוספת תווית
          openAddLabelPopup(false); // רק הפרמטר הראשון

          // איפוס הבחירה
          this.value = "";
        }
      });
    },
    (err) => {
      console.error("❌ שגיאה בטעינת תוויות:", err);
    }
  );

  // פתיחת הפופאפ
  $.fancybox.open({
    src: "#add-manual-session-modal",
    type: "inline",
    touch: false,
    afterShow: function () {
      // התמקדות בשדה הראשון
      document.getElementById("manual-date").focus();
    },
  });
}

// טיפול בשליחת טופס הוספת סשן ידנית
$(document).on("submit", "#add-manual-session-form", function (e) {
  e.preventDefault();

  const date = document.getElementById("manual-date").value;
  const startTime = document.getElementById("manual-start-time").value;
  const endTime = document.getElementById("manual-end-time").value;
  const hourlyRate = parseFloat(document.getElementById("manual-rate").value);
  const description = document
    .getElementById("manual-description")
    .value.trim();
  const labelID = document.getElementById("manual-label-id").value;

  // בדיקות תקינות
  if (!date || !startTime || !endTime) {
    showCustomAlert("יש למלא את התאריך, שעת התחלה ושעת סיום", "error", false);
    return;
  }

  // בדיקת שעות עתידיות
  if (isTimeInFuture(date, startTime)) {
    showCustomAlert("לא ניתן להזין שעת התחלה עתידית", "error", false);
    return;
  }

  if (isTimeInFuture(date, endTime)) {
    showCustomAlert("לא ניתן להזין שעת סיום עתידית", "error", false);
    return;
  }

  // חישוב זמנים עם טיפול במעבר חצות
  const { startDateTime, endDateTime, durationSeconds } =
    calculateDurationWithMidnightCrossing(date, startTime, endTime);

  // בדיקת תקינות משך הסשן (מקסימום 24 שעות)
  if (durationSeconds > 24 * 60 * 60) {
    showCustomAlert("משך הסשן לא יכול להיות יותר מ-24 שעות", "error", false);
    return;
  }

  if (durationSeconds <= 0) {
    showCustomAlert("משך הסשן חייב להיות חיובי", "error", false);
    return;
  }

  // יצירת אובייקט הסשן
  const sessionData = {
    sessionID: 0,
    projectID: CurrentProject.ProjectID,
    startDate: toIsoLocalFormat(startDateTime) + "Z",
    endDate: toIsoLocalFormat(endDateTime) + "Z",
    durationSeconds: durationSeconds,
    hourlyRate: hourlyRate,
    description: description,
    labelID: labelID ? parseInt(labelID) : null,
    isArchived: false,
    userID: CurrentUser.id,
    status: "Ended",
  };

  console.log("📤 שולח סשן ידני:", sessionData);

  // שליחה לשרת
  ajaxCall(
    "POST",
    apiConfig.createApiUrl("Session/insert_session_Manually"),
    JSON.stringify(sessionData),
    () => {
      // סגירת הפופאפ
      $.fancybox.close();

      // הצגת הודעת הצלחה
      showCustomAlert("הסשן נוסף בהצלחה!", "success");

      // רענון הטבלה
      setTimeout(() => {
        renderTableFromDB();
      }, 1000);
    },
    (xhr, status, error) => {
      console.error("❌ שגיאה בהוספת הסשן:", error);
      console.error("פרטי השגיאה:", xhr.responseText);
      console.error("סטטוס:", xhr.status);

      let errorMessage = "שגיאה בהוספת הסשן";

      if (xhr.responseText) {
        try {
          const errorData = JSON.parse(xhr.responseText);
          if (errorData.message) {
            errorMessage += ": " + errorData.message;
          }
        } catch (e) {
          errorMessage += ": " + xhr.responseText;
        }
      }

      showCustomAlert(errorMessage, "error", false);
    }
  );
});

// טיפול בחזרה מהוספת תווית חדשה לפופאפ הוספת סשן ידנית
$(document).on("reopenManualSessionPopup", function (event, newLabelID) {
  // שחזור נתוני הטופס
  const pendingData = JSON.parse(
    localStorage.getItem("pendingManualSession") || "{}"
  );

  // פתיחת פופאפ הוספת סשן ידנית מחדש
  openAddManualSessionPopup();

  // מילוי השדות עם הנתונים השמורים
  setTimeout(() => {
    if (pendingData.date)
      document.getElementById("manual-date").value = pendingData.date;
    if (pendingData.rate)
      document.getElementById("manual-rate").value = pendingData.rate;
    if (pendingData.startTime)
      document.getElementById("manual-start-time").value =
        pendingData.startTime;
    if (pendingData.endTime)
      document.getElementById("manual-end-time").value = pendingData.endTime;
    if (pendingData.description)
      document.getElementById("manual-description").value =
        pendingData.description;

    // בחירת התווית החדשה
    if (newLabelID) {
      document.getElementById("manual-label-id").value = newLabelID;
    }
  }, 500);

  // מחיקת הנתונים השמורים
  localStorage.removeItem("pendingManualSession");
});

// --- סוף: הוספת סשן ידנית ---

// --- התחלה: אפקט קונפטי להתחלת סשן ---

function createConfettiEffect() {
  // יצירת קונטיינר לקונפטי
  const confettiContainer = document.createElement("div");
  confettiContainer.className = "confetti-container";
  document.body.appendChild(confettiContainer);

  // יצירת חתיכות קונפטי
  for (let i = 0; i < 50; i++) {
    const confettiPiece = document.createElement("div");
    confettiPiece.className = "confetti-piece";

    // מיקום אקראי בחלק העליון של המסך
    confettiPiece.style.left = Math.random() * 100 + "%";
    confettiPiece.style.animationDelay = Math.random() * 0.3 + "s";

    // צורות שונות
    if (Math.random() > 0.7) {
      confettiPiece.style.borderRadius = "50%";
    }

    confettiContainer.appendChild(confettiPiece);
  }

  // הסרת הקונפטי אחרי האנימציה
  setTimeout(() => {
    if (confettiContainer.parentNode) {
      document.body.removeChild(confettiContainer);
    }
  }, 4000);
}

function showStartSessionMessage(isResume = false) {
  // יצירת הודעת התחלה
  const message = document.createElement("div");
  message.className = "start-session-message";

  if (isResume) {
    message.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
        <i class="fas fa-play" style="font-size: 30px;"></i>
        <div>
          <div style="font-size: 28px; margin-bottom: 5px;">🔄 ממשיכים לעבוד!</div>
          <div style="font-size: 16px; font-weight: normal; opacity: 0.9;">בהצלחה המשך הפרויקט</div>
        </div>
      </div>
    `;
  } else {
    message.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
        <i class="fas fa-play-circle" style="font-size: 30px;"></i>
        <div>
          <div style="font-size: 28px; margin-bottom: 5px;">🎉 מתחילים לעבוד!</div>
          <div style="font-size: 16px; font-weight: normal; opacity: 0.9;">בהצלחה בפרויקט שלך</div>
        </div>
      </div>
    `;
  }

  document.body.appendChild(message);

  // הסרת ההודעה אחרי האנימציה
  setTimeout(() => {
    if (message.parentNode) {
      document.body.removeChild(message);
    }
  }, 3000);
}

function showEndSessionMessage(sessionDescription = "") {
  // יצירת הודעת סיום עם טקסט טעינה תחילה
  const message = document.createElement("div");
  message.className = "end-session-message";

  // הודעת טעינה תחילית
  message.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
      <div class="loading-spinner" style="width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <div>
        <div style="font-size: 28px; margin-bottom: 5px;">🏁 סיימנו בהצלחה!</div>
        <div style="font-size: 16px; font-weight: normal; opacity: 0.9;">מכין הודעת עידוד אישית...</div>
      </div>
    </div>
  `;

  document.body.appendChild(message);

  // קבלת שם המשתמש
  const userName = CurrentUser?.name || CurrentUser?.firstName || "מפתח מעולה";
  console.log("👤 נתוני משתמש נוכחי:", CurrentUser);
  console.log("👤 שם משתמש נבחר:", userName);

  // יצירת הודעת עידוד דינמית
  console.log("🔍 בודק תיאור סשן:", sessionDescription);
  console.log(
    "🔍 אורך התיאור:",
    sessionDescription ? sessionDescription.trim().length : 0
  );
  console.log("🔍 שם משתמש:", userName);

  if (sessionDescription && sessionDescription.trim().length > 5) {
    // יש תיאור - נשתמש ב-Gemini להודעה אישית
    console.log("✅ יש תיאור מספיק - קורא ל-Gemini API");
    generatePersonalizedEndMessage(sessionDescription, userName, message);
  } else {
    // אין תיאור - הודעה מעודדת כללית
    console.log("⚠️ אין תיאור או שהוא קצר מדי - משתמש בהודעה כללית");
    showGeneralEndMessage(userName, message);
  }
}

function generatePersonalizedEndMessage(description, userName, messageElement) {
  console.log("🤖 מתחיל ליצור הודעה אישית...");
  console.log("📝 תיאור:", description);
  console.log("👤 שם משתמש:", userName);

  const prompt = `כתב הודעת עידוד אישית בעברית עבור המפתח ${userName} שזה עתה סיים את העבודה הבאה: "${description}".

חובה לכלול:
✅ את השם "${userName}" בהודעה עצמה 
✅ התייחסות ישירה וספציפית לתיאור העבודה שמולא
✅ טון מעודד וחיובי

דרישות נוספות:
- אורך: 12-18 מילים בלבד
- בעברית בלבד
- טון חברותי ומקצועי
- ללא הקדמות או הסברים, רק ההודעה עצמה

דוגמאות לפורמט הרצוי:
"כל הכבוד ${userName}! העבודה על הבאג יצאה מעולה - הקוד נראה נקי!"
"מרשים ${userName}! הפיצ'ר החדש באמת משדרג את החוויה!"
"יופי של עבודה ${userName}! התיקון שעשית חוסך הרבה זמן!"`;

  console.log("📤 שולח פרומפט ל-Gemini...");

  callGeminiAPIForEndMessage(
    prompt,
    (response) => {
      console.log("✅ קיבלתי תשובה מ-Gemini:", response);
      if (response && response.trim()) {
        console.log("✅ מעדכן הודעה עם תשובת Gemini");
        updateEndMessage(messageElement, userName, response.trim());
      } else {
        console.log("⚠️ תשובה ריקה מ-Gemini - עובר להודעה כללית");
        showGeneralEndMessage(userName, messageElement);
      }
    },
    () => {
      // בשגיאה - הצג הודעה כללית
      console.log("❌ שגיאה ב-Gemini API - עובר להודעה כללית");
      showGeneralEndMessage(userName, messageElement);
    }
  );
}

function showGeneralEndMessage(userName, messageElement) {
  const encouragingMessages = [
    `עבודה מצוינת ${userName}! אתה מפתח באמת מוכשר! 💪`,
    `כל הכבוד ${userName}! עוד יום פרודוקטיבי נוסף בארגז! 🌟`,
    `מרשים ${userName}! ההתקדמות שלך פשוט מדהימה! 🚀`,
    `יופי של עבודה ${userName}! אתה באמת עושה הבדל! ✨`,
    `מעולה ${userName}! עוד פיסת קוד מקצועית הושלמה! 🎯`,
  ];

  const randomMessage =
    encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
  updateEndMessage(messageElement, userName, randomMessage);
}

function updateEndMessage(messageElement, userName, encouragementText) {
  // הפיכת ההודעה לאינטראקטיבית
  messageElement.style.pointerEvents = "auto";

  messageElement.innerHTML = `
    <div style="position: relative;">
      <!-- כפתור סגירה -->
      <button id="close-end-message" style="
        position: absolute;
        top: -5px;
        right: -5px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        opacity: 0.7;
        backdrop-filter: blur(5px);
      " onmouseover="this.style.backgroundColor='rgba(255, 255, 255, 0.3)'; this.style.opacity='1'; this.style.transform='scale(1.1)';" onmouseout="this.style.backgroundColor='rgba(255, 255, 255, 0.2)'; this.style.opacity='0.7'; this.style.transform='scale(1)';">
        ✕
      </button>
      
      <!-- תוכן ההודעה -->
      <div style="display: flex; align-items: center; justify-content: center; gap: 15px; padding: 5px;">
        <i class="fas fa-trophy" style="font-size: 30px; color: #ffd700;"></i>
        <div>
          <div style="font-size: 28px; margin-bottom: 5px;">🏁 סיימנו בהצלחה!</div>
          <div style="font-size: 16px; font-weight: normal; opacity: 0.9; max-width: 400px; line-height: 1.4;">${encouragementText}</div>
        </div>
      </div>
    </div>
  `;

  // פונקציה לסגירת ההודעה
  function closeMessage() {
    // אנימציית יציאה
    messageElement.style.animation = "fadeOut 0.3s ease forwards";
    setTimeout(() => {
      if (messageElement.parentNode) {
        document.body.removeChild(messageElement);
      }
    }, 300);
  }

  // האזנה לקליק על כפתור הסגירה
  const closeButton = messageElement.querySelector("#close-end-message");
  if (closeButton) {
    closeButton.addEventListener("click", function (e) {
      e.stopPropagation();
      closeMessage();
    });
  }

  // הוספת אנימציית יציאה ל-CSS אם לא קיימת
  if (!document.querySelector("#end-message-animations")) {
    const style = document.createElement("style");
    style.id = "end-message-animations";
    style.textContent = `
      @keyframes fadeOut {
        from {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        to {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.9);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // הסרת ההודעה אחרי 6 שניות לפחות
  setTimeout(() => {
    if (messageElement.parentNode) {
      closeMessage();
    }
  }, 6000);
}

function triggerStartSessionCelebration(isResume = false) {
  createConfettiEffect();
  showStartSessionMessage(isResume);
}

function callGeminiAPIForEndMessage(text, onSuccess, onError) {
  console.log("🤖 שולח בקשה ל-Gemini API להודעת סיום דרך השרת...");

  const requestData = {
    prompt: text,
  };

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  const geminiEndUrl = apiConfig.createApiUrl("Gemini/ask");

  ajaxCall(
    "POST",
    geminiEndUrl,
    JSON.stringify(requestData),
    (response) => {
      console.log("✅ תשובה מ-Gemini API התקבלה!", response);
      console.log("סוג התשובה:", typeof response);

      // Try different response formats (same logic as existing function)
      let aiResponse = null;

      if (typeof response === "string") {
        aiResponse = response;
      } else if (
        response &&
        response.candidates &&
        response.candidates.length > 0 &&
        response.candidates[0].content &&
        response.candidates[0].content.parts &&
        response.candidates[0].content.parts.length > 0 &&
        response.candidates[0].content.parts[0].text
      ) {
        // Gemini API format: response.candidates[0].content.parts[0].text
        aiResponse = response.candidates[0].content.parts[0].text;
      } else if (response && response.response) {
        aiResponse = response.response;
      } else if (response && response.result) {
        aiResponse = response.result;
      } else if (response && response.data) {
        aiResponse = response.data;
      } else if (response && response.text) {
        aiResponse = response.text;
      } else if (response && response.content) {
        aiResponse = response.content;
      } else if (response && response.message) {
        aiResponse = response.message;
      }

      console.log("🤖 התגובה שנמצאה:", aiResponse);

      if (aiResponse && aiResponse.trim()) {
        onSuccess(aiResponse.trim());
      } else {
        console.warn("⚠️ תשובה ריקה מ-Gemini API");
        onError();
      }
    },
    (xhr, status, error) => {
      console.error("❌ שגיאה ב-Gemini API:", error);
      console.error("פרטי השגיאה:", xhr.responseText);
      console.error("סטטוס:", status);
      onError();
    }
  );
}

function triggerEndSessionCelebration(sessionDescription = "") {
  createConfettiEffect();
  showEndSessionMessage(sessionDescription);
}

// --- סוף: אפקט קונפטי להתחלת סשן ---

// --- התחלה: Voice Recognition Functions ---
let voiceRecognition = null;
let isVoiceRecording = false;

function initializeVoiceRecognition() {
  // בדיקה אם הדפדפן תומך ב-Speech Recognition
  if (
    !("webkitSpeechRecognition" in window) &&
    !("SpeechRecognition" in window)
  ) {
    console.warn("🎤 הדפדפן לא תומך בזיהוי קולי");
    return false;
  }

  // יצירת אובייקט זיהוי קולי
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  voiceRecognition = new SpeechRecognition();

  // הגדרות זיהוי קולי
  voiceRecognition.continuous = false; // הקלטה לא רציפה
  voiceRecognition.interimResults = true; // תוצאות ביניים
  voiceRecognition.lang = "he-IL"; // עברית

  // אירועי זיהוי קולי
  voiceRecognition.onstart = function () {
    console.log("🎤 התחיל זיהוי קולי");
    isVoiceRecording = true;
    updateVoiceButton("recording");
    setTimeout(() => {
      showVoiceTooltip("🎙️ מקליט... דבר עכשיו");
    }, 100);
  };

  voiceRecognition.onresult = function (event) {
    let transcript = "";
    let isFinal = false;

    // איסוף כל התוצאות
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      transcript += result[0].transcript;
      if (result.isFinal) {
        isFinal = true;
      }
    }

    console.log("🎤 זיהוי קולי - טקסט:", transcript, "סופי:", isFinal);

    // עדכון שדה התיאור
    const sessionDescInput = document.getElementById("session-description");
    if (sessionDescInput) {
      if (isFinal) {
        // תוצאה סופית - הוספה לטקסט הקיים
        const currentText = sessionDescInput.value.trim();
        const newText = currentText
          ? currentText + " " + transcript.trim()
          : transcript.trim();
        sessionDescInput.value = newText;

        // עדכון סטטוס
        updateVoiceButton("processing");
        showVoiceTooltip("מעבד את הטקסט...");

        // החזרה למצב רגיל ואצעת AI Helper
        setTimeout(() => {
          stopVoiceRecording();

          // הצעת שיפור הטקסט עם בינה מלאכותית
          setTimeout(() => {
            if (newText.trim().length > 3) {
              // איפוס הסטטוס כדי לאפשר הצגה מחדש
              hasShownAiTooltip = false;
              showAiHelperTooltip();
              hasShownAiTooltip = true;
            }
          }, 500);
        }, 1000);
      } else {
        // תוצאה זמנית - הצגת מחוון
        if (transcript.trim()) {
          updateVoiceStatusText(`שומע: "${transcript}"`);
        }
      }
    }
  };

  voiceRecognition.onerror = function (event) {
    console.error("🎤 שגיאה בזיהוי קולי:", event.error);

    let errorMessage = "שגיאה בזיהוי קולי";
    switch (event.error) {
      case "no-speech":
        errorMessage = "לא זוהה דיבור. נסה שוב";
        break;
      case "audio-capture":
        errorMessage = "לא ניתן לגשת למיקרופון";
        break;
      case "not-allowed":
        errorMessage = "גישה למיקרופון נדחתה. אנא אפשר גישה במעלה הדפדפן";
        break;
      case "network":
        errorMessage = "שגיאת רשת. בדוק את החיבור לאינטרנט";
        break;
      default:
        errorMessage = `שגיאה: ${event.error}`;
    }

    showVoiceTooltip(errorMessage);
    setTimeout(() => {
      stopVoiceRecording();
    }, 3000);
  };

  voiceRecognition.onend = function () {
    console.log("🎤 זיהוי קולי הסתיים");
    stopVoiceRecording();
  };

  return true;
}

function startVoiceRecording() {
  if (!voiceRecognition) {
    if (!initializeVoiceRecognition()) {
      alert("הדפדפן שלך לא תומך בזיהוי קולי. אנא השתמש בדפדפן Chrome או Edge");
      return;
    }
  }

  if (isVoiceRecording) {
    stopVoiceRecording();
    return;
  }

  try {
    // הצגת הודעה על בקשת הרשאה
    showVoiceTooltip("בודק הרשאות מיקרופון...");
    voiceRecognition.start();
  } catch (error) {
    console.error("🎤 שגיאה בהתחלת זיהוי קולי:", error);
    hideVoiceTooltip();
    alert("שגיאה בהפעלת זיהוי קולי. נסה שוב");
  }
}

function stopVoiceRecording() {
  if (voiceRecognition && isVoiceRecording) {
    voiceRecognition.stop();
  }

  isVoiceRecording = false;
  updateVoiceButton("idle");
  hideVoiceTooltip();
}

function updateVoiceButton(state) {
  const voiceBtn = document.getElementById("voice-record-btn");
  if (!voiceBtn) return;

  // הסרת כל הקלאסים הקודמים
  voiceBtn.classList.remove("recording", "voice-listening", "voice-processing");

  switch (state) {
    case "recording":
      voiceBtn.classList.add("recording");
      voiceBtn.innerHTML = '<i class="fas fa-microphone-alt"></i>';
      break;
    case "listening":
      voiceBtn.classList.add("voice-listening");
      voiceBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      break;
    case "processing":
      voiceBtn.classList.add("voice-processing");
      voiceBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      break;
    default: // idle
      voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      break;
  }
}

function showVoiceTooltip(message) {
  const tooltip = document.getElementById("voice-recording-tooltip");
  const statusText = document.getElementById("voice-status-text");

  if (tooltip && statusText) {
    statusText.textContent = message;
    tooltip.style.display = "block";
    tooltip.style.position = "fixed";
    tooltip.style.top = "50%";
    tooltip.style.left = "50%";
    tooltip.style.transform = "translate(-50%, -50%)";
    tooltip.style.zIndex = "20000";
  }
}

function hideVoiceTooltip() {
  const tooltip = document.getElementById("voice-recording-tooltip");
  if (tooltip) {
    tooltip.style.display = "none";
  }
}

function updateVoiceStatusText(message) {
  const statusText = document.getElementById("voice-status-text");
  if (statusText) {
    statusText.textContent = message;
  }
}

function setupVoiceRecording() {
  const voiceBtn = document.getElementById("voice-record-btn");
  const voiceStopBtn = document.getElementById("voice-stop-btn");

  if (voiceBtn) {
    voiceBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      startVoiceRecording();
    });
  }

  if (voiceStopBtn) {
    voiceStopBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      stopVoiceRecording();
    });
  }

  // הסתרת הטולטיפ אם לוחצים במקום אחר
  document.addEventListener("click", function (e) {
    if (
      !e.target.closest("#voice-recording-tooltip") &&
      !e.target.closest("#voice-record-btn")
    ) {
      hideVoiceTooltip();
    }
  });
}
// --- סוף: Voice Recognition Functions ---

// ================================
// New Label Functionality
// ================================

// פונקציה להגדרת פונקציונליות התגיות החדשה
function setupNewLabelFunctionality() {
  // הוספת event listeners לכל ה-select עם תגיות
  const labelSelects = ["session-label", "edit-label-id", "manual-label-id"];

  labelSelects.forEach((selectId) => {
    const select = document.getElementById(selectId);
    if (select) {
      select.addEventListener("change", function () {
        if (this.value === "add-new-label") {
          // פתיחת פופ-אפ הוספת תגית חדשה
          openNewLabelFormProject();
          // איפוס הבחירה ב-select
          this.value = "";
        }
      });
    }
  });

  // הוספת event listeners לפופ-אפ התגיות החדש
  setupLabelFormProjectEvents();
}

// פונקציה לפתיחת פופ-אפ הוספת תגית חדשה
function openNewLabelFormProject() {
  // איפוס הטופס
  document.getElementById("labelName-project").value = "";
  selectColorProject("#6699CC");
  document.getElementById("labelColor-project").value = "#6699CC";
  updatePreviewProject();

  // פתיחת הפופ-אפ
  $.fancybox.open({
    src: "#new-label-form-project",
    type: "inline",
    touch: false,
    animationEffect: "fade",
    animationDuration: 300,
    closeExisting: true,
  });
}

// פונקציה להגדרת event listeners לפופ-אפ התגיות
function setupLabelFormProjectEvents() {
  // עדכון תצוגה מקדימה כשמשנים את שם התגית
  $(document).on("input", "#labelName-project", function () {
    updatePreviewProject();
  });

  // טיפול בלחיצה על צבע בפלטה
  $(document).on(
    "click",
    "#new-label-form-project .color-option:not(.custom-color)",
    function () {
      const selectedColor = $(this).data("color");
      selectColorProject(selectedColor);
    }
  );

  // טיפול בלחיצה על כפתור צבע מותאם אישית
  $(document).on("click", "#custom-color-btn-project", function () {
    $("#custom-color-picker-project").click();
  });

  // טיפול בשינוי צבע מותאם אישית
  $(document).on("change", "#custom-color-picker-project", function () {
    const customColor = $(this).val().toUpperCase();
    selectColorProject(customColor);
  });

  // טיפול בשליחת הטופס
  $(document).on("submit", "#label-form-project", function (e) {
    e.preventDefault();
    const labelName = $("#labelName-project").val();
    const labelColor = $("#labelColor-project").val();
    addNewLabelProject(labelName, labelColor);
  });
}

// פונקציה לבחירת צבע ועדכון התצוגה
function selectColorProject(color) {
  // עדכון השדה הנסתר
  $("#labelColor-project").val(color);

  // הסרת הסימון הקודם והוספת סימון חדש
  $("#new-label-form-project .color-option").removeClass("selected");
  $(`#new-label-form-project .color-option[data-color="${color}"]`).addClass(
    "selected"
  );

  // עדכון התצוגה המקדימה
  updatePreviewProject();
}

// פונקציה לעדכון תצוגה מקדימה של התגית
function updatePreviewProject() {
  const labelName = $("#labelName-project").val().trim();
  const labelColor = $("#labelColor-project").val();

  // עדכון הטקסט
  const previewText = labelName || "תגית חדשה";
  $("#preview-text-project").text(previewText);

  // עדכון הצבע
  $("#label-preview-project").css("background-color", labelColor);

  // בחירת צבע טקסט מתאים (בהיר או כהה) בהתאם לרקע
  const textColor = getContrastTextColorProject(labelColor);
  $("#label-preview-project").css("color", textColor);
}

// פונקציה לחישוב צבע טקסט מתאים (בהיר או כהה)
function getContrastTextColorProject(hexColor) {
  // המרת צבע hex לRGB
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // חישוב בהירות הצבע
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // החזרת צבע טקסט מתאים
  return brightness > 128 ? "#333" : "#fff";
}

// פונקציה להוספת תגית חדשה
function addNewLabelProject(name, color) {
  const newLabel = {
    labelName: name,
    labelColor: color,
    userID: CurrentUser.id,
  };

  $.ajax({
    url: apiConfig.createApiUrl("Label/addNewLabel"),
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(newLabel),
    success: () => {
      $.fancybox.close();
      showSuccessNotificationProject("התגית נוספה בהצלחה!");
      // רענון כל ה-dropdowns של התגיות
      refreshAllLabelDropdowns();
    },
    error: (xhr) => {
      if (xhr.status === 409) {
        showErrorNotificationProject(
          `תגית בשם "${name}" כבר קיימת במערכת. אנא בחר שם אחר.`
        );
      } else {
        showErrorNotificationProject("שגיאה בהוספת תגית. אנא נסה שוב.");
      }
    },
  });
}

// פונקציה לרענון כל ה-dropdowns של התגיות
function refreshAllLabelDropdowns() {
  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה - רענון תגיות
  console.log("🌐 Creating refresh labels URL...");
  const labelApi = apiConfig.createApiUrl(
    `Label/GetAllLabelsByUserID?userID=${CurrentUser.id}`
  );
  console.log("🔄 Refresh Labels URL:", labelApi);

  $.get(labelApi)
    .done((labels) => {
      const labelSelects = [
        "session-label",
        "edit-label-id",
        "manual-label-id",
      ];

      labelSelects.forEach((selectId) => {
        const select = document.getElementById(selectId);
        if (select) {
          // שמירת הערך הנוכחי
          const currentValue = select.value;

          // ניקוי והוספת אופציות חדשות
          select.innerHTML = '<option value="">בחר תווית</option>';
          select.innerHTML +=
            '<option value="add-new-label" style="color: #0072ff; font-weight: bold;">➕ הוסף תגית חדשה</option>';

          labels.forEach((label) => {
            const option = document.createElement("option");
            option.value = label.labelID;
            option.textContent = label.labelName;
            option.style.backgroundColor = label.labelColor;
            option.style.color = getContrastTextColorProject(label.labelColor);
            select.appendChild(option);
          });

          // החזרת הערך הקודם אם קיים
          if (currentValue && currentValue !== "add-new-label") {
            select.value = currentValue;
          }
        }
      });
    })
    .fail(() => {
      showErrorNotificationProject("שגיאה בטעינת תגיות");
    });
}

// הודעת הצלחה מעוצבת כמו בשאר האתר
function showSuccessNotificationProject(message) {
  const notification = document.createElement("div");
  notification.className = "save-notification";
  notification.style.backgroundColor = "#4caf50";
  notification.style.zIndex = "99999999"; // z-index גבוה מאוד כדי להופיע מעל הכל
  notification.innerHTML = `
    <div class="notification-icon">✓</div>
    <div class="notification-message">${message}</div>
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, 3000);
}

// הודעת שגיאה מעוצבת כמו בשאר האתר
function showErrorNotificationProject(message) {
  const notification = document.createElement("div");
  notification.className = "save-notification";
  notification.style.backgroundColor = "#ff4757";
  notification.style.zIndex = "99999999"; // z-index גבוה מאוד כדי להופיע מעל הכל
  notification.innerHTML = `
    <div class="notification-icon">✕</div>
    <div class="notification-message">${message}</div>
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, 3000);
}

// קריאה לפונקציה כשהדף נטען
$(document).ready(function () {
  setupNewLabelFunctionality();
});
