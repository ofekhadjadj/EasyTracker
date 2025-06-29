let CurrentUser = JSON.parse(localStorage.getItem("user"));

$(document).ready(function () {
  if (!CurrentUser || !CurrentUser.id) return;
  const userID = CurrentUser.id;

  $(`#menu-prof-name`).text(CurrentUser.firstName);
  $(".avatar-img").attr(
    "src",
    CurrentUser.image || "./images/def/user-def.png"
  );

  loadDashboardSummary(userID);
  loadTopClients(userID);
  loadTopProjects(userID);

  // Load filter dropdowns
  loadClientsForFilter(userID);
  loadProjectsForFilter(userID);

  // Set default dates (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  $("#toDate").val(today.toISOString().split("T")[0]);
  $("#fromDate").val(thirtyDaysAgo.toISOString().split("T")[0]);

  // Set default group by
  $("#groupBy").val("WEEK");

  // Load charts with default filters
  const defaultFilters = {
    groupBy: "WEEK",
    fromDate: thirtyDaysAgo.toISOString().split("T")[0],
    toDate: today.toISOString().split("T")[0],
    clientID: "",
    projectID: "",
  };

  // Load charts with default filters
  loadCharts(userID, defaultFilters);

  $("#go-to-team-tracking").on("click", function () {
    window.location.href = "TeamWorkTracking.html";
  });

  $("#open-client-summary").on("click", () =>
    showSummaryPopup("client", userID)
  );
  $("#open-project-summary").on("click", () =>
    showSummaryPopup("project", userID)
  );

  // Handle filter button click
  $("#apply-filters").on("click", function () {
    applyFilters(userID);
  });

  // Update projects dropdown when client changes
  $("#clientID").on("change", function () {
    const selectedClientID = $(this).val();
    if (selectedClientID) {
      loadProjectsForClient(userID, selectedClientID);
    } else {
      loadProjectsForFilter(userID);
    }
  });
});

function loadDashboardSummary(userID) {
  const url = apiConfig.createApiUrl(`Reports/GetDashboardSummary`, { userID });
  ajaxCall("GET", url, null, (data) => {
    if (!data || !data.length) {
      console.error("No dashboard summary data received");
      return;
    }

    const summary = data[0];

    const metrics = [
      { label: 'סה"כ לקוחות', value: summary.TotalClients || 0 },
      { label: 'סה"כ פרויקטים', value: summary.TotalProjects || 0 },
      {
        label: "הלקוח הכי רווחי",
        value: summary.TopClientName?.trim() || "אין מידע",
      },
      {
        label: "הפרויקט הכי רווחי",
        value: summary.TopProjectName?.trim() || "אין מידע",
      },
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
  const url = apiConfig.createApiUrl(`Reports/GetTopEarning5Clients`, {
    userID,
  });
  ajaxCall("GET", url, null, (clients) => {
    if (!clients || !clients.length) {
      console.error("No top clients data received");
      $("#top-clients").html(
        '<h3 class="top-title">5 הלקוחות הכי רווחיים</h3><p>אין נתונים להצגה</p>'
      );
      return;
    }

    const container = $("#top-clients");
    container.empty();
    container.append(`<h3 class="top-title">5 הלקוחות הכי רווחיים</h3>`);

    let html = `<table class="top-content">
                  <thead>
                    <tr>
                      <th>שם לקוח</th>
                      <th>הכנסות</th>
                    </tr>
                  </thead>
                  <tbody>`;

    clients.forEach((c) => {
      html += `<tr>
                <td>${c.CompanyName.trim()}</td>
<td>₪${c.TotalEarnings.toLocaleString("he-IL")}</td>
              </tr>`;
    });

    html += `</tbody></table>`;
    container.append(html);
  });
}

function loadTopProjects(userID) {
  const url = apiConfig.createApiUrl(`Reports/GetTopEarning5Projects`, {
    userID,
  });
  ajaxCall("GET", url, null, (projects) => {
    if (!projects || !projects.length) {
      console.error("No top projects data received");
      $("#top-projects").html(
        '<h3 class="top-title">5 הפרויקטים הכי רווחיים</h3><p>אין נתונים להצגה</p>'
      );
      return;
    }

    const container = $("#top-projects");
    container.empty();
    container.append(`<h3 class="top-title">5 הפרויקטים הכי רווחיים</h3>`);

    let html = `<table class="top-content">
                  <thead>
                    <tr>
                      <th>שם פרויקט</th>
                      <th>הכנסות</th>
                    </tr>
                  </thead>
                  <tbody>`;

    projects.forEach((p) => {
      html += `<tr>
                <td>${p.ProjectName.trim()}</td>
<td>₪${p.TotalEarnings.toLocaleString("he-IL")}</td>
              </tr>`;
    });

    html += `</tbody></table>`;
    container.append(html);
  });
}

function showSummaryPopup(type, userID) {
  const popupID =
    type === "client" ? "client-summary-popup" : "project-summary-popup";
  const endpoint =
    type === "client"
      ? "Reports/GetClientSummaries"
      : "Reports/GetProjectSummaries";
  const url = apiConfig.createApiUrl(endpoint, { userID });

  ajaxCall("GET", url, null, (data) => {
    if (!data || !data.length) {
      console.error(`No ${type} summary data received`);
      $(`#${popupID}`).html(
        `<div class='popup-summary'><h2>${
          type === "client" ? "סיכום לפי לקוחות" : "סיכום לפי פרויקטים"
        }</h2><p>אין נתונים להצגה</p></div>`
      );
      $.fancybox.open({ src: `#${popupID}`, type: "inline" });
      return;
    }

    let html = `<div class='popup-summary'>
      <h2>${type === "client" ? "סיכום לפי לקוחות" : "סיכום לפי פרויקטים"}</h2>
      <table dir="rtl">
        <thead>
          <tr><th>#</th>`;

    const keys = Object.keys(data[0]);
    keys.forEach((key) => {
      if (key !== "ClientID" && key !== "ProjectID") {
        html += `<th>${translateHeader(key)}</th>`;
      }
    });

    html += `</tr></thead><tbody>`;

    data.forEach((row, index) => {
      html += `<tr><td>${index + 1}</td>`;
      keys.forEach((key) => {
        if (key !== "ClientID" && key !== "ProjectID") {
          const val = row[key];
          const isNumber = !isNaN(parseFloat(val)) && isFinite(val);
          if (key === "TotalMinutes" && isNumber) {
            html += `<td>${formatMinutesToHHMM(val)}</td>`;
          } else {
            html += `<td>${
              isNumber ? parseFloat(val).toLocaleString("he-IL") : val
            }</td>`;
          }
        }
      });
      html += `</tr>`;
    });

    html += `</tbody></table></div>`;

    $(`#${popupID}`).html(html);
    $.fancybox.open({
      src: `#${popupID}`,
      type: "inline",
      opts: {
        touch: false,
        autoFocus: false,
        closeExisting: true,
        animationEffect: "fade",
      },
    });
  });
}

function translateHeader(key) {
  const translations = {
    ClientName: "שם לקוח",
    ProjectCount: "מספר פרויקטים",
    AvgHourlyRate: "תעריף ממוצע לשעה",
    ClientID: "מזהה לקוח",
    CompanyName: "שם לקוח",
    TotalEarnings: 'סה"כ הכנסות',
    ProjectID: "מזהה פרויקט",
    ProjectName: "שם פרויקט",
    DurationGoal: "יעד (שעות)",
    TotalMinutes: 'סה"כ זמן עבודה',
    TotalHours: 'סה"כ שעות עבודה',
    TotalProjects: 'סה"כ פרויקטים',
    AverageHourlyRate: "תעריף שעתי ממוצע",
    LastActivity: "פעילות אחרונה",
    Status: "סטטוס",
    ClientSince: "לקוח מתאריך",
    ContactPerson: "איש קשר",
    Email: "אימייל",
    Phone: "טלפון",
    Address: "כתובת",
    City: "עיר",
    Country: "מדינה",
    PostalCode: "מיקוד",
    Notes: "הערות",
    Website: "אתר אינטרנט",
    Industry: "תעשייה",
    PaymentTerms: "תנאי תשלום",
    Currency: "מטבע",
    TaxRate: "שיעור מס",
    Discount: "הנחה",
    Balance: "יתרה",
    CreditLimit: "מסגרת אשראי",
    PaymentMethod: "אמצעי תשלום",
    BillingCycle: "מחזור חיוב",
    InvoicePrefix: "קידומת חשבונית",
    InvoiceNotes: "הערות לחשבונית",
    InvoiceFooter: "כותרת תחתונה לחשבונית",
    InvoiceTerms: "תנאי חשבונית",
    InvoiceDueDate: "תאריך לתשלום",
    InvoiceTemplate: "תבנית חשבונית",
    InvoiceLanguage: "שפת חשבונית",
    InvoiceCurrency: "מטבע חשבונית",
    InvoiceTaxRate: "שיעור מס בחשבונית",
    InvoiceDiscount: "הנחה בחשבונית",
    InvoiceDiscountType: "סוג הנחה בחשבונית",
    InvoiceDiscountValue: "ערך הנחה בחשבונית",
    InvoiceSubtotal: "סיכום ביניים בחשבונית",
    InvoiceTax: "מס בחשבונית",
    InvoiceTotal: "סך הכל בחשבונית",
    InvoicePaid: "שולם בחשבונית",
    InvoiceDue: "לתשלום בחשבונית",
    InvoiceStatus: "סטטוס חשבונית",
    InvoiceDate: "תאריך חשבונית",
    InvoiceNumber: "מספר חשבונית",
    InvoiceReference: "מספר אסמכתא",
    InvoiceNotes: "הערות לחשבונית",
    InvoiceTerms: "תנאי חשבונית",
    InvoiceDueDate: "תאריך לתשלום",
    InvoiceTemplate: "תבנית חשבונית",
    InvoiceLanguage: "שפת חשבונית",
    InvoiceCurrency: "מטבע חשבונית",
  };
  return translations[key] || key;
}

function loadCharts(userID, filters = {}) {
  loadWorkSummaryOverTime(userID, filters);
  loadWorkByLabel(userID, filters);
  loadMonthlyWorkAndEarnings(userID, filters);
}

function loadWorkSummaryOverTime(userID, filters = {}) {
  // Create base params
  let params = { userID, ...filters };

  const url = apiConfig.createApiUrl("Reports/GetWorkSummaryOverTime", params);

  ajaxCall("GET", url, null, (data) => {
    if (!data || !data.length) {
      console.error("No work summary data received");
      // הצג הודעה שאין נתונים
      $("#workTimeChart")
        .parent()
        .append(
          '<p class="no-data-message">אין נתונים להצגה בטווח הזמן שנבחר</p>'
        );
      return;
    }

    // הסר הודעות קודמות אם קיימות
    $("#workTimeChart").parent().find(".no-data-message").remove();

    const labels = data.map((d) =>
      formatPeriodLabel(d.Period, (filters.groupBy || "WEEK").toUpperCase())
    );
    const values = data.map((d) => d.TotalMinutes);

    // Clear previous chart if exists
    const chartElement = document.getElementById("workTimeChart");
    if (chartElement.chart) {
      chartElement.chart.destroy();
    }

    chartElement.chart = new Chart(chartElement, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: 'סה"כ דקות',
            data: values,
            backgroundColor: "#0072ff",
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.raw;
                return `סה"כ זמן: ${formatMinutesToHHMM(value)}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return formatMinutesToHHMM(value);
              },
            },
          },
        },
      },
    });
  });
}

function loadWorkByLabel(userID, filters = {}) {
  // Create base params
  let params = { userID, ...filters };

  const url = apiConfig.createApiUrl("Reports/GetWorkByLabel", params);

  // First get all labels to get their colors
  const labelsUrl = apiConfig.createApiUrl("Label/GetAllLabelsByUserID", {
    userID,
  });

  ajaxCall("GET", labelsUrl, null, (labelsData) => {
    // Create a map of label names to their colors
    const labelColors = {};
    labelsData.forEach((label) => {
      labelColors[label.labelName] = label.labelColor;
    });

    // Now get the work data
    ajaxCall("GET", url, null, (data) => {
      if (!data || !data.length) {
        console.error("No label data received");
        // הצג הודעה שאין נתונים
        $("#labelChart")
          .parent()
          .append(
            '<p class="no-data-message">אין נתוני תיוגים להצגה בטווח הזמן שנבחר</p>'
          );
        return;
      }

      // הסר הודעות קודמות אם קיימות
      $("#labelChart").parent().find(".no-data-message").remove();

      const labels = data.map((d) => d.LabelName);
      const values = data.map((d) => d.TotalMinutes);

      // Get colors for each label, fallback to default colors if not found
      const defaultColors = [
        "#00c6ff",
        "#0072ff",
        "#0051cc",
        "#66CC99",
        "#9966CC",
        "#FFB347",
        "#FFD700",
        "#90EE90",
        "#DC143C",
        "#8A2BE2",
        "#FF6347",
        "#4682B4",
        "#008B8B",
        "#556B2F",
        "#FF69B4",
      ];

      const colors = labels.map(
        (label, index) =>
          labelColors[label] || defaultColors[index % defaultColors.length]
      );

      // Clear previous chart if exists
      const chartElement = document.getElementById("labelChart");
      if (chartElement.chart) {
        chartElement.chart.destroy();
      }

      chartElement.chart = new Chart(chartElement, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [
            {
              label: "דקות",
              data: values,
              backgroundColor: colors,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom" },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || "";
                  const value = context.raw;
                  return `${label}: ${formatMinutesToHHMM(value)}`;
                },
              },
            },
          },
        },
      });
    });
  });
}

function loadMonthlyWorkAndEarnings(userID, filters = {}) {
  // Create base params
  let params = { userID, ...filters };

  const url = apiConfig.createApiUrl(
    "Reports/GetWorkAndEarningsByPeriod",
    params
  );

  ajaxCall("GET", url, null, (data) => {
    if (!data || !data.length) {
      console.error("No monthly data received");
      // הצג הודעה שאין נתונים
      $("#monthlyChart")
        .parent()
        .append(
          '<p class="no-data-message">אין נתוני עבודה והכנסות להצגה בטווח הזמן שנבחר</p>'
        );
      return;
    }

    // הסר הודעות קודמות אם קיימות
    $("#monthlyChart").parent().find(".no-data-message").remove();

    const labels = data.map((d) =>
      formatPeriodLabel(d.Period, (filters.groupBy || "WEEK").toUpperCase())
    );
    const minutes = data.map((d) => d.TotalMinutes);
    const earnings = data.map((d) => d.TotalEarnings);

    // Clear previous chart if exists
    const chartElement = document.getElementById("monthlyChart");
    if (chartElement.chart) {
      chartElement.chart.destroy();
    }

    chartElement.chart = new Chart(chartElement, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "שעות",
            data: minutes,
            backgroundColor: "#0072ff",
            borderRadius: 6,
          },
          {
            label: "הכנסות (₪)",
            data: earnings,
            backgroundColor: "#00c6ff",
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.dataset.label;
                const value = context.raw;
                if (label === "שעות") {
                  return `זמן עבודה: ${formatMinutesToHHMM(value)}`;
                } else {
                  return `הכנסה: ₪${parseFloat(value).toLocaleString("he-IL")}`;
                }
              },
            },
          },
        },
        scales: {
          x: { stacked: false },
          y: { beginAtZero: true },
        },
      },
    });
  });
}

// Format period labels based on groupBy
function formatPeriodLabel(period, groupBy) {
  if (typeof period !== "string" || typeof groupBy !== "string") return "";

  groupBy = groupBy.toUpperCase();

  if (groupBy === "DAY") {
    const dateParts = period.split("-");
    return dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : period;
  } else if (groupBy === "WEEK") {
    const parts = period.split("-W");
    return parts.length === 2 && parts[1] ? `שבוע ${parts[1]}` : period;
  } else if (groupBy === "MONTH") {
    const dateParts = period.split("-");
    const monthNames = [
      "ינואר",
      "פברואר",
      "מרץ",
      "אפריל",
      "מאי",
      "יוני",
      "יולי",
      "אוגוסט",
      "ספטמבר",
      "אוקטובר",
      "נובמבר",
      "דצמבר",
    ];
    const monthIndex = parseInt(dateParts[1]) - 1;
    return dateParts.length === 2 && monthIndex >= 0 && monthIndex < 12
      ? `${monthNames[monthIndex]} ${dateParts[0]}`
      : period;
  }

  return period;
}
function formatMinutesToHHMM(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

// Load clients for the filter dropdown
function loadClientsForFilter(userID) {
  const url = apiConfig.createApiUrl("Client/GetAllClientsByUserID", {
    userID,
  });

  ajaxCall("GET", url, null, (clients) => {
    console.log("לקוחות שהתקבלו:", clients);

    if (!clients || !clients.length) {
      console.error("No clients data received");
      $("#clientID").html('<option value="">אין לקוחות להצגה</option>');
      return;
    }

    const dropdown = $("#clientID");
    dropdown.find("option:not(:first)").remove(); // שומר את האפשרות הראשונה ("כל הלקוחות")

    // מיון לפי שם לקוח
    clients.sort((a, b) => a.companyName.localeCompare(b.companyName, "he"));

    clients.forEach((client) => {
      dropdown.append(
        `<option value="${
          client.clientID
        }">${client.companyName.trim()}</option>`
      );
    });
  });
}

// Load projects for the filter dropdown
function loadProjectsForFilter(userID) {
  const url = apiConfig.createApiUrl(`Projects/GetProjectByUserId/${userID}`);

  ajaxCall("GET", url, null, (projects) => {
    console.log("פרויקטים שהתקבלו מהשרת:", projects);

    if (!projects || !projects.length) {
      console.error("No projects data received");
      $("#projectID").html('<option value="">אין פרויקטים להצגה</option>');
      return;
    }

    // סינון פרויקטים שהם לא מושבתים
    const activeProjects = projects.filter(
      (p) => p.isDisable === "False" || p.isDisable === false
    );

    console.log("פרויקטים לאחר סינון:", activeProjects);

    const dropdown = $("#projectID");
    dropdown.find("option:not(:first)").remove(); // שומר את האפשרות הראשונה ("כל הפרויקטים")

    if (activeProjects.length === 0) {
      $("#projectID").append('<option value="">אין פרויקטים להצגה</option>');
      return;
    }

    // מיון לפי שם פרויקט
    activeProjects.sort((a, b) =>
      a.ProjectName.localeCompare(b.ProjectName, "he")
    );

    activeProjects.forEach((project) => {
      dropdown.append(
        `<option value="${
          project.ProjectID
        }">${project.ProjectName.trim()}</option>`
      );
    });
  });
}

// Load projects for a specific client
function loadProjectsForClient(userID, clientID) {
  const url = apiConfig.createApiUrl("Projects/GetProjectsByClient", {
    userID,
    clientID,
  });
  ajaxCall("GET", url, null, (projects) => {
    if (!projects || !projects.length) {
      console.error("No projects data received for client");
      $("#projectID").html('<option value="">אין פרויקטים ללקוח זה</option>');
      return;
    }

    const dropdown = $("#projectID");
    dropdown.find("option:not(:first)").remove(); // Keep the "All projects" option

    // מיון פרויקטים לפי שם
    projects.sort((a, b) => a.ProjectName.localeCompare(b.ProjectName, "he"));

    projects.forEach((project) => {
      dropdown.append(
        `<option value="${project.ProjectID}">${project.ProjectName}</option>`
      );
    });
  });
}

// Apply filters from the form
function applyFilters(userID) {
  const filters = {
    groupBy: $("#groupBy").val(),
    fromDate: $("#fromDate").val(),
    toDate: $("#toDate").val(),
    clientID: $("#clientID").val(),
    projectID: $("#projectID").val(),
  };

  loadCharts(userID, filters);
}

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
