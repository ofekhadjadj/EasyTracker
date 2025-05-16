// analytics.js
let CurrentUser = JSON.parse(localStorage.getItem("user"));

$(document).ready(function () {
  if (!CurrentUser || !CurrentUser.id) return;
  const userID = CurrentUser.id;

  $(`#menu-prof-name`).text(CurrentUser.firstName);
  if (CurrentUser.image) $(".avatar-img").attr("src", CurrentUser.image);

  loadDashboardSummary(userID);
  loadTopClients(userID);
  loadTopProjects(userID);
  loadCharts(userID);

  $("#go-to-team-tracking").on("click", function () {
    window.location.href = "TeamWorkTracking.html";
  });

  $("#open-client-summary").on("click", () =>
    showSummaryPopup("client", userID)
  );
  $("#open-project-summary").on("click", () =>
    showSummaryPopup("project", userID)
  );
});

function loadDashboardSummary(userID) {
  const url = `https://localhost:7198/api/Reports/GetDashboardSummary?userID=${userID}`;
  ajaxCall("GET", url, null, (data) => {
    const metrics = [
      { label: 'סה"כ לקוחות', value: data.TotalClients },
      { label: 'סה"כ פרויקטים', value: data.TotalProjects },
      { label: "הלקוח הכי רווחי", value: data.TopClientName || "אין מידע" },
      { label: "הפרויקט הכי רווחי", value: data.TopProjectName || "אין מידע" },
    ];
    const container = $("#dashboard-circles");
    container.empty();
    metrics.forEach((item) => {
      container.append(`
        <div class="circle-stat">
          <div class="circle-value">${item.value}</div>
          <div class="circle-label">${item.label}</div>
        </div>
      `);
    });
  });
}

function loadTopClients(userID) {
  const url = `https://localhost:7198/api/Reports/GetTopEarning5Clients?userID=${userID}`;
  ajaxCall("GET", url, null, (clients) => {
    const container = $("#top-clients");
    container.empty();
    container.append(`<h3 class="top-title">5 הלקוחות הכי רווחיים</h3>`);
    let html = "<div class='top-content'>";
    clients.forEach((c) => {
      html += `<p><strong>${c.CompanyName.trim()}</strong> - ₪${c.TotalEarnings.toFixed(
        2
      )}</p>`;
    });
    html += "</div>";
    container.append(html);
  });
}

function loadTopProjects(userID) {
  const url = `https://localhost:7198/api/Reports/GetTopEarning5Projects?userID=${userID}`;
  ajaxCall("GET", url, null, (projects) => {
    const container = $("#top-projects");
    container.empty();
    container.append(`<h3 class="top-title">5 הפרויקטים הכי רווחיים</h3>`);
    let html = "<div class='top-content'>";
    projects.forEach((p) => {
      html += `<p><strong>${p.ProjectName.trim()}</strong> - ₪${p.TotalEarnings.toFixed(
        2
      )}</p>`;
    });
    html += "</div>";
    container.append(html);
  });
}

function showSummaryPopup(type, userID) {
  const popupID =
    type === "client" ? "client-summary-popup" : "project-summary-popup";
  const url =
    type === "client"
      ? `https://localhost:7198/api/Reports/GetClientSummaries?userID=${userID}`
      : `https://localhost:7198/api/Reports/GetProjectSummaries?userID=${userID}`;
  ajaxCall("GET", url, null, (data) => {
    let html = `<div class='popup-summary'><h2>${
      type === "client" ? "סיכום לפי לקוחות" : "סיכום לפי פרויקטים"
    }</h2>`;
    html += `<table><thead><tr>`;
    Object.keys(data[0]).forEach(
      (key) => (html += `<th>${translateHeader(key)}</th>`)
    );
    html += `</tr></thead><tbody>`;
    data.forEach((row) => {
      html += `<tr>`;
      Object.values(row).forEach((val) => {
        html += `<td>${val}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;

    $(`#${popupID}`).html(html);
    $.fancybox.open({ src: `#${popupID}`, type: "inline" });
  });
}

function translateHeader(key) {
  const translations = {
    ClientID: "מזהה לקוח",
    CompanyName: "שם לקוח",
    TotalEarnings: 'סה"כ הכנסות',
    ProjectID: "מזהה פרויקט",
    ProjectName: "שם פרויקט",
    DurationGoal: "יעד (שעות)",
    TotalMinutes: 'סה"כ דקות עבודה',
  };
  return translations[key] || key;
}

function loadCharts(userID) {
  loadWorkSummaryOverTime(userID);
  loadWorkByLabel(userID);
  loadMonthlyWorkAndEarnings(userID);
}

function loadWorkSummaryOverTime(userID) {
  const url = `https://localhost:7198/api/Reports/GetWorkSummaryOverTime?userID=${userID}&groupBy=DAY`;
  ajaxCall("GET", url, null, (data) => {
    const labels = data.map((d) => d.Period);
    const values = data.map((d) => d.TotalMinutes);
    new Chart(document.getElementById("workTimeChart"), {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { label: 'סה"כ דקות', data: values, backgroundColor: "#6699cc" },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  });
}

function loadWorkByLabel(userID) {
  const url = `https://localhost:7198/api/Reports/GetWorkByLabel?userID=${userID}`;
  ajaxCall("GET", url, null, (data) => {
    const labels = data.map((d) => d.LabelName);
    const values = data.map((d) => d.TotalMinutes);
    new Chart(document.getElementById("labelChart"), {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            label: "דקות",
            data: values,
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#66CC99",
              "#9966CC",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
      },
    });
  });
}

function loadMonthlyWorkAndEarnings(userID) {
  const url = `https://localhost:7198/api/Reports/GetMonthlyWorkAndEarnings?userID=${userID}`;
  ajaxCall("GET", url, null, (data) => {
    const labels = data.map((d) => d.Period);
    const minutes = data.map((d) => d.TotalMinutes);
    const earnings = data.map((d) => d.TotalEarnings);

    new Chart(document.getElementById("monthlyChart"), {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          { label: "דקות", data: minutes, backgroundColor: "#6699cc" },
          { label: "הכנסות (₪)", data: earnings, backgroundColor: "#ff9933" },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "top" } },
        scales: {
          x: { stacked: false },
          y: { beginAtZero: true },
        },
      },
    });
  });
}
