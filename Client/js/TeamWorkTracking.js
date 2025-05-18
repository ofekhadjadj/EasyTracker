// teamwork.js – ניהול תצוגת עבודת צוות + תפריט + פופאפים

$(document).ready(function () {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  if (!currentUser || !currentUser.id) return;

  const managerID = currentUser.id;
  const apiUrl = `https://localhost:7198/api/Reports/GetTeamMonitoringData?managerUserID=${managerID}`;

  // הצגת שם ותמונה בתפריט
  $(`#menu-prof-name`).text(currentUser.firstName);
  if (currentUser.image) $(".avatar-img").attr("src", currentUser.image);

  // טען נתוני עבודת צוות
  $.get(apiUrl, function (data) {
    renderTeamMonitoring(data);
  });

  // כפתור לפתיחת עריכת משתמש
  $("#edit-user-btn").on("click", function () {
    $("#user-firstname").val(currentUser.firstName);
    $("#user-lastname").val(currentUser.lastName);
    $("#user-email").val(currentUser.email);
    if (currentUser.image) {
      $("#user-image-thumb").attr("src", currentUser.image).show();
    }
    $.fancybox.open({ src: "#edit-user-form" });
  });

  // טופס עדכון פרטי משתמש (שליחה לשרת תתווסף לפי המימוש שלך)
  $("#user-details-form").on("submit", function (e) {
    e.preventDefault();
    alert("הפרטים נשמרו (הדמיה בלבד)");
    $.fancybox.close();
  });

  $("#open-password-popup").on("click", function () {
    $.fancybox.close();
    setTimeout(() => {
      $.fancybox.open({ src: "#change-password-form" });
    }, 300);
  });

  $("#user-password-form").on("submit", function (e) {
    e.preventDefault();
    alert("הסיסמה עודכנה (הדמיה בלבד)");
    $.fancybox.close();
  });

  function renderTeamMonitoring(data) {
    const container = $("#team-monitoring-container");
    container.empty();
    const grouped = groupByProjectAndUser(data);

    for (const [projectKey, users] of Object.entries(grouped)) {
      const [projectName, clientName] = projectKey.split("||");
      const card = $(
        `<div class="project-group-card">
          <h2>📁 ${projectName}</h2>
          <p>לקוח: ${clientName}</p>
        </div>`
      );

      for (const [userKey, tasks] of Object.entries(users)) {
        const [fullName, email] = userKey.split("||");

        const memberSection = $(`
          <div class="team-member-section">
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
          </div>
        `);

        const tbody = memberSection.find("tbody");

        if (tasks.length === 0 || (tasks.length === 1 && !tasks[0].TaskID)) {
          tbody.append(`<tr><td colspan="4">אין משימות מוקצות</td></tr>`);
        } else {
          tasks.forEach((task) => {
            const row = $(
              `<tr class="${
                task.IsOverdue ? "overdue" : task.IsDone ? "done" : ""
              }">
                <td>${task.Description ?? "ללא תיאור"}</td>
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
      }

      container.append(card);
    }
  }

  function groupByProjectAndUser(data) {
    const grouped = {};
    data.forEach((item) => {
      const projectKey = `${item.ProjectName}||${item.ClientName}`;
      const userKey = `${item.FullName}||${item.Email}`;

      if (!grouped[projectKey]) grouped[projectKey] = {};
      if (!grouped[projectKey][userKey]) grouped[projectKey][userKey] = [];

      if (item.TaskID !== 0 || item.Description || item.DueDate) {
        grouped[projectKey][userKey].push(item);
      } else if (grouped[projectKey][userKey].length === 0) {
        grouped[projectKey][userKey].push(item);
      }
    });
    return grouped;
  }
});
