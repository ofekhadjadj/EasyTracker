// TeamWorkTracking.js – ניהול תצוגת מעקב עבודת צוות + סינון

$(document).ready(function () {
  // טעינת פרטי משתמש מהלוקל סטורג' להצגת שם ותמונה בתפריט
  const currentUser = JSON.parse(localStorage.getItem("user"));
  if (!currentUser || !currentUser.id) return;
  const managerID = currentUser.id;
  $(`#menu-prof-name`).text(currentUser.firstName);
  $(".avatar-img").attr(
    "src",
    currentUser.image || "./images/def/user-def.png"
  );

  // URL של ה-API לקבלת נתוני מעקב צוות
  const apiUrl = apiConfig.createApiUrl("Reports/GetTeamMonitoringData", {
    managerUserID: managerID,
  });

  let allData = [];

  // קריאה לשרת לקבלת נתוני הצוות
  $.get(apiUrl, function (data) {
    allData = data;
    renderTeamMonitoring(data);
    setupFilters(data);
  });

  // ---------------------------------------------
  // פונקציית הגדרת הסינונים (פרויקט ואיש צוות)
  function setupFilters(data) {
    // בונים מערכי ייחוד
    const projectSet = new Set();
    const userSet = new Set();
    data.forEach((item) => {
      if (item.ProjectID && item.ProjectName) {
        projectSet.add(`${item.ProjectID}||${item.ProjectName}`);
      }
      if (item.UserID && item.FullName) {
        userSet.add(`${item.UserID}||${item.FullName}`);
      }
    });

    // מציאת האלמנטים ב-HTML
    const projectFilter = $("#projectFilter");
    const userFilter = $("#userFilter");

    // אתחול אפשרויות
    projectFilter.empty().append('<option value="">כל הפרויקטים</option>');
    userFilter.empty().append('<option value="">כל חברי הצוות</option>');

    // הוספת אופציות לתפריטים
    [...projectSet].forEach((p) => {
      const [id, name] = p.split("||");
      projectFilter.append(`<option value="${id}">${name}</option>`);
    });
    [...userSet].forEach((u) => {
      const [id, name] = u.split("||");
      userFilter.append(`<option value="${id}">${name}</option>`);
    });

    // מאזינים לשינויי סינון
    projectFilter.on("change", () => applyTeamFilters());
    userFilter.on("change", () => applyTeamFilters());
  }

  // פונקציית יישום הסינון על הנתונים ומעבר לרינדור
  function applyTeamFilters() {
    const selProj = $("#projectFilter").val();
    const selUser = $("#userFilter").val();
    const filtered = allData.filter((item) => {
      const byProj = !selProj || item.ProjectID == selProj;
      const byUser = !selUser || item.UserID == selUser;
      return byProj && byUser;
    });
    renderTeamMonitoring(filtered);
  }

  // ---------------------------------------------
  // פונקציה להצגת נתוני מעקב בצוות לפי קבוצות פרויקט ומשתמש
  function renderTeamMonitoring(data) {
    const container = $("#team-monitoring-container");
    container.empty();
    const grouped = groupByProjectAndUser(data);

    Object.entries(grouped).forEach(([projectKey, users]) => {
      const [projectName, clientName] = projectKey.split("||");
      const card = $(
        `<div class="project-group-card">
           <h2>📁 ${projectName}</h2>
           <p>לקוח: ${clientName}</p>
         </div>`
      );

      Object.entries(users).forEach(([userKey, tasks]) => {
        const [fullName, email] = userKey.split("||");
        const memberSection = $(
          `<div class="team-member-section">
             <h3>👤 ${fullName} <span class="email">(${email})</span></h3>
             <table class="task-table">
               <thead>
                 <tr>
                   <th>תיאור משימה</th>
                   <th>תאריך יעד</th>
                   <th>בוצע</th>
                   <th>באיחור</th>
                 </tr>
               </thead>
               <tbody></tbody>
             </table>
           </div>`
        );
        const tbody = memberSection.find("tbody");

        if (tasks.length === 0 || (tasks.length === 1 && !tasks[0].TaskID)) {
          tbody.append(`<tr><td colspan="4">אין משימות מוקצות</td></tr>`);
        } else {
          tasks.forEach((task) => {
            const row = $(
              `<tr class="${
                task.IsOverdue ? "overdue" : task.IsDone ? "done" : ""
              }">
                 <td>${task.Description || "ללא תיאור"}</td>
                 <td>${
                   task.DueDate
                     ? new Date(task.DueDate).toLocaleDateString()
                     : "-"
                 }</td>
                 <td>${task.IsDone ? "✅" : "❌"}</td>
                 <td>${task.IsOverdue ? "⚠️" : "❌"}</td>
               </tr>`
            );
            tbody.append(row);
          });
        }
        card.append(memberSection);
      });
      container.append(card);
    });
  }

  // פונקציה לקיבוץ הנתונים לפי פרויקט ומשתמש
  function groupByProjectAndUser(data) {
    const grouped = {};
    data.forEach((item) => {
      const projKey = `${item.ProjectName}||${item.ClientName}`;
      const userKey = `${item.FullName}||${item.Email}`;
      if (!grouped[projKey]) grouped[projKey] = {};
      if (!grouped[projKey][userKey]) grouped[projKey][userKey] = [];
      if (item.TaskID || item.Description || item.DueDate) {
        grouped[projKey][userKey].push(item);
      } else if (grouped[projKey][userKey].length === 0) {
        grouped[projKey][userKey].push(item);
      }
    });
    return grouped;
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
