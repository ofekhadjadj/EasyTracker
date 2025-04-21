let CurrentProject = JSON.parse(localStorage.getItem("CurrentProject"));
let CurrentUser = JSON.parse(localStorage.getItem("user"));
console.log("CurrentProject", CurrentProject);
console.log("User", CurrentUser);
let table;
const avatarImg = document.querySelector(".avatar-img");

function loadTeamPreview() {
  const teamContainer = document.getElementById("project-team-preview");

  // שמור את כפתור הפתיחה בצד (נוסיף אותו מחדש אחר כך)
  const openPopupBtn = document.getElementById("open-team-popup");
  const arrowImg = document.getElementById("open-team-popup");

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
      teamContainer.appendChild(arrowImg);
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

//טעינת לייבלים לעריכת סשן
function loadEditLabelsDropdown() {
  const labelApi = `https://localhost:7198/api/Label/GetAllLabelsByUserID?userID=${CurrentUser.id}`;
  const labelSelect = document.getElementById("edit-label-id");
  labelSelect.innerHTML = '<option value="">בחר תווית</option>';

  ajaxCall(
    "GET",
    labelApi,
    "",
    (labels) => {
      labels.forEach((label) => {
        const option = document.createElement("option");
        option.value = label.labelID;
        option.textContent = label.labelName;
        labelSelect.appendChild(option);
      });
    },
    (err) => {
      console.error("❌ שגיאה בשליפת תוויות לעריכה:", err);
    }
  );
}

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
document
  .getElementById("save-description-btn")
  .addEventListener("click", function () {
    const newDescription = document.getElementById(
      "description-textarea"
    ).value;

    const updatedProject = {
      projectid: CurrentProject.ProjectID,
      description: newDescription,
    };

    ajaxCall(
      "PUT",
      "https://localhost:7198/api/Projects/update_project",
      JSON.stringify(updatedProject),
      () => {
        alert("✅ תיאור עודכן בהצלחה!");
        $.fancybox.close();

        // ❗ רענון ה-CurrentProject מהשרת
        const refreshedApiUrl = `https://localhost:7198/api/Projects/GetThisProject/ProjectID/${CurrentProject.ProjectID}/UserID/${CurrentUser.id}`;
        ajaxCall(
          "GET",
          refreshedApiUrl,
          "",
          (updatedProjectFromServer) => {
            // 🟢 שמירה גם בזיכרון וגם ב-localStorage
            CurrentProject = updatedProjectFromServer;
            localStorage.setItem(
              "CurrentProject",
              JSON.stringify(CurrentProject)
            );
            console.log("🎯 עודכן הפרויקט ב-localStorage:", CurrentProject);
          },
          (xhr) => {
            console.error("❌ שגיאה ברענון CurrentProject מהשרת:", xhr);
          }
        );
      },
      () => {
        alert("❌ שגיאה בעדכון התיאור");
      }
    );
  });

function openEndSessionPopup() {
  const labelApi = `https://localhost:7198/api/Label/GetAllLabelsByUserID?userID=${CurrentUser.id}`;

  ajaxCall("GET", labelApi, "", (labels) => {
    const labelSelect = document.getElementById("session-label");
    labelSelect.innerHTML = '<option value="">בחר תווית</option>';

    labels.forEach((label) => {
      const option = document.createElement("option");
      option.value = label.labelID;
      option.textContent = label.labelName;
      labelSelect.appendChild(option);
    });

    // פתיחת הפופאפ
    $.fancybox.open({
      src: "#end-session-popup",
      type: "inline",
    });
  });
}

document.addEventListener("DOMContentLoaded", renderTableFromDB);
document.addEventListener("DOMContentLoaded", FillDeatils);
document.addEventListener("DOMContentLoaded", loadTeamPreview);

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
const circumference = 2 * Math.PI * 100;

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
        table.clear().draw(); // מנקה את כל השורות לפני הרנדר
        renderTableFromDB(); // רענן את הטבלה עם הסשן החדש
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
      alert("✅ הסשן הסתיים בהצלחה!");
      $.fancybox.close();
      table.clear().draw();
      renderTableFromDB();
    },
    () => {
      alert("❌ שגיאה בסיום הסשן");
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
  });

  function format(session) {
    const desc = session.Description || "אין תיאור זמין לסשן זה.";
    return `<div class="details-row">תיאור הסשן: ${desc}</div>`;
  }

  $("#sessionsTable tbody").on("click", "td .details-control", function () {
    const tr = $(this).closest("tr");
    const row = table.row(tr);
    const session = $(tr).data("session"); // שליפת הסשן מהשורה

    if (row.child.isShown()) {
      row.child.hide();
      $(this).text("\u25BC");
    } else {
      row.child(format(session)).show();
      $(this).text("\u25B2");
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

function calculateEarnings(durationSeconds, hourlyRate) {
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

    response.forEach((session) => {
      const rawDate = session.StartDate;
      const { time, formattedDate } = formatDateTime(rawDate);

      const fDate = session.EndDate;

      const endTimeDisplay = session.EndDate
        ? formatDateTime(session.EndDate).time
        : "--:--:--";

      const newRow = [
        `<span style="width: 80%; height: 15px; background-color: ${
          session.LabelColor ?? "#RRGGBBAA"
        }; color: black; display: inline-block; padding: 4px 10px; border-radius: 6px;">${
          session.LabelName ?? "-"
        }</span>`, // עמודה ריקה
        formattedDate, // תאריך
        time, // שעת התחלה
        endTimeDisplay, // שעת סיום
        formatSecondsToHHMMSS(session.DurationSeconds), // משך זמן
        session.HourlyRate, // תעריף
        calculateEarnings(session.HourlyRate, session.DurationSeconds), // שכר
        '<button class="edit-btn">✏️</button><button id="dlt-btn-session" class="delete-btn">🗑️</button>', // כפתורים
        '<button class="details-control">▼</button>', // פרטים נוספים
      ];
      // הוספה ורינדור:

      const rowNode = table.row.add(newRow).draw(false).node();
      $(rowNode).prependTo("#sessionsTable tbody");

      $(rowNode).data("session", session); // שמירת הסשן כולו
      $(rowNode).attr("data-session-id", session.SessionID); // שמירת ה-ID כשדה data
    });

    totalPastSeconds = response.reduce(
      (sum, session) => sum + session.DurationSeconds,
      0
    );
    updateOverallProgress(); // נעדכן את בר ההתקדמות הכללי

    //הסרת סשן מהטבלה
    document
      .getElementById("sessionsTable")
      .addEventListener("click", function (e) {
        if (e.target.classList.contains("delete-btn")) {
          const row = e.target.closest("tr");
          const sessionId = row.getAttribute("data-session-id");
          const session = $(row).data("session"); // ✅ שליפה מהשורה

          if (!session) {
            console.warn("⚠️ לא נמצא session לשורה הזו.");
            return;
          }

          console.log("🗑️ נמחק סשן עם ID:", sessionId);

          // עדכון זמן כולל (בר)
          if (session.DurationSeconds) {
            totalPastSeconds -= session.DurationSeconds;
            updateOverallProgress();
          }

          // הסרת השורה מהטבלה
          table.row(row).remove().draw(false);

          // מחיקה מהשרת
          const apiUrl = `https://localhost:7198/api/Session/delete_session?SessionID=${sessionId}`;
          ajaxCall(
            "PUT",
            apiUrl,
            "",
            () => console.log("✅ הסשן נמחק מהשרת"),
            () => console.error("❌ שגיאה במחיקת הסשן מהשרת")
          );
        }
      });
  }

  function ErrorCB(xhr, status, error) {
    console.error("שגיאה בטעינת הפרויקטים:", error);
  }
}

// פתיחת פופאפ עריכת סשן
$(document).on("click", ".edit-btn", function () {
  const row = $(this).closest("tr");
  const session = row.data("session");
  if (!session) return;

  const start = new Date(session.StartDate);

  const end = new Date(session.EndDate);

  $("#edit-session-id").val(session.SessionID);
  $("#edit-date").val(start.toISOString().split("T")[0]);
  $("#edit-start-time").val(start.toTimeString().slice(0, 5));
  $("#edit-end-time").val(end.toTimeString().slice(0, 5));
  $("#edit-rate").val(session.HourlyRate || 0);
  $("#edit-description").val(session.Description || "");
  $("#edit-label-id").val(session.LabelID ?? "");
  $("#edit-status").val(session.SessionStatus || "");

  $.fancybox.open({
    src: "#edit-session-modal",
    type: "inline",
  });
  loadEditLabelsDropdown();
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
      alert("✅ הסשן עודכן בהצלחה!");
      $.fancybox.close();
      location.reload();
    },
    () => {
      alert("❌ שגיאה בעדכון הסשן");
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
      slide.style.backgroundImage = `url(${project.Image})`;

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

    new Swiper(".recent-projects-swiper", {
      slidesPerView: 2,
      spaceBetween: 20,
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

openPopupBtn.addEventListener("click", () => {
  fetchTeamMembers();
  $.fancybox.open({ src: "#team-popup", type: "inline" });
});

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
