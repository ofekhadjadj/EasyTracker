let CurrentProject = JSON.parse(localStorage.getItem("CurrentProject"));
let CurrentUser = JSON.parse(localStorage.getItem("user"));
console.log("CurrentProject", CurrentProject);
console.log("User", CurrentUser);
let table;

document.addEventListener("DOMContentLoaded", renderTableFromDB);
document.addEventListener("DOMContentLoaded", FillDeatils);

function FillDeatils() {
  const projectName = document.getElementById("ProjectTitle");
  const ProjectClient = document.getElementById("ProjectClient");
  const breadcrumbsProjName = document.getElementById("breadcrumbsProjName");
  let breadcrumbsText = `${CurrentProject.ProjectName} - ${CurrentProject.CompanyName}`;
  breadcrumbsProjName.innerText = breadcrumbsText;
  projectName.innerText = CurrentProject.ProjectName;
  ProjectClient.innerText = CurrentProject.CompanyName;

  //בנוסף לפרטים גם תכין איונט ללחיצה על מחק
}

let interval = null;
let seconds = 0;
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

// 🕒 יעד בזמן (בשעות) — אתה יכול לשנות לכמה שתרצה
const goalHours = 0.01;
const goalInSeconds = goalHours * 3600;

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
}

toggleBtn.addEventListener("click", () => {
  if (isRunning) {
    clearInterval(interval);
    isRunning = false;
    toggleText.textContent = "התחל";
    toggleIcon.src = "./images/play-icon.png";
  } else {
    interval = setInterval(updateTime, 1000);
    isRunning = true;
    toggleText.textContent = "השהה";
    toggleIcon.src = "./images/puse icon.png";
  }
});

stopBtn.addEventListener("click", () => {
  clearInterval(interval);
  isRunning = false;
  toggleText.textContent = "התחל";
  toggleIcon.src = "./images/play-icon.png";
  console.log("⏱️ זמן כולל בשניות:", seconds);

  // איפוס סטופר
  seconds = 0;
  timeDisplay.textContent = "00:00:00";
  circle.style.strokeDashoffset = circumference;
  progressFill.style.width = `0%`;
  progressText.textContent = `0%`;
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

  // פונקציית הרחבה
  // function format() {
  //   return '<div class="details-row">כאן יופיע תיאור מפורט של הסשן שנבחר</div>';
  // }

  function format(session) {
    const desc = session.description || "אין תיאור זמין לסשן זה.";
    return `<div class="details-row">תיאור הסשן: ${desc}</div>`;
  }
  // האזנה ללחיצה
  // $("#sessionsTable tbody").on("click", "td .details-control", function () {
  //   const tr = $(this).closest("tr");
  //   const row = table.row(tr);

  //   if (row.child.isShown()) {
  //     row.child.hide();
  //     $(this).text("\u25BC");
  //   } else {
  //     row.child(format()).show();
  //     $(this).text("\u25B2");
  //   }
  // });

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

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // חודשים מ-0 עד 11
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
      const rawDate = session.startDate;
      const { time, formattedDate } = formatDateTime(rawDate);

      const fDate = session.endDate;
      // const { Ftime, formatFtedDate } = formatDateTime(fDate);
      let finelFdate = formatDateTime(fDate);

      const newRow = [
        "", // עמודה ריקה
        formattedDate, // תאריך
        time, // שעת התחלה
        finelFdate.time, // שעת סיום
        formatSecondsToHHMMSS(session.durationSeconds), // משך זמן
        session.hourlyRate, // תעריף
        calculateEarnings(session.hourlyRate, session.durationSeconds), // שכר
        '<button class="edit-btn">✏️</button><button id="dlt-btn-session" class="delete-btn">🗑️</button>', // כפתורים
        '<button class="details-control">▼</button>', // פרטים נוספים
      ];
      // הוספה ורינדור:
      // table.row.add(newRow).draw(false);

      // const rowNode = table.row.add(newRow).draw(false).node();
      // $(rowNode).data("session", session); // שמור את האובייקט המקורי בשורה

      const rowNode = table.row.add(newRow).draw(false).node();
      $(rowNode).data("session", session); // שמירת הסשן כולו
      $(rowNode).attr("data-session-id", session.sessionID); // שמירת ה-ID כשדה data
    });

    //הסרת סשן מהטבלה
    document
      .getElementById("sessionsTable")
      .addEventListener("click", function (e) {
        if (e.target.classList.contains("delete-btn")) {
          const row = e.target.closest("tr");
          const sessionId = row.getAttribute("data-session-id");
          console.log("נמחק סשן עם ID:", sessionId);

          // הסרת השורה מהטבלה דרך DataTables:
          table.row(row).remove().draw(false);

          // אם תרצה גם לשלוח בקשת DELETE לשרת:
          const apiUrl = `https://localhost:7198/api/Session/delete_session?SessionID=${sessionId}`;
          ajaxCall(
            "PUT",
            apiUrl,
            "",
            () => console.log(" נמחק בהצלחה מהשרת"),
            () => console.error("שגיאה במחיקה")
          );
        }
      });
  }

  function ErrorCB(xhr, status, error) {
    console.error("שגיאה בטעינת הפרויקטים:", error);
  }
}
