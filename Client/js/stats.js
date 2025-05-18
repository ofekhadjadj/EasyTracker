let CurrentUser = JSON.parse(localStorage.getItem("user"));

$(document).ready(function () {
  if (!CurrentUser || !CurrentUser.id) return;
  const userID = CurrentUser.id;

  $(`#menu-prof-name`).text(CurrentUser.firstName);
  if (CurrentUser.image) $(".avatar-img").attr("src", CurrentUser.image);

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
  const url = `https://localhost:7198/api/Reports/GetDashboardSummary?userID=${userID}`;
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
  const url = `https://localhost:7198/api/Reports/GetTopEarning5Clients?userID=${userID}`;
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
                <td>₪${c.TotalEarnings.toFixed(2)}</td>
              </tr>`;
    });

    html += `</tbody></table>`;
    container.append(html);
  });
}

function loadTopProjects(userID) {
  const url = `https://localhost:7198/api/Reports/GetTopEarning5Projects?userID=${userID}`;
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
                <td>₪${p.TotalEarnings.toFixed(2)}</td>
              </tr>`;
    });

    html += `</tbody></table>`;
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
          html += `<td>${
            isNumber ? parseFloat(val).toLocaleString("he-IL") : val
          }</td>`;
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
    TotalMinutes: 'סה"כ דקות עבודה',
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
  let url = `https://localhost:7198/api/Reports/GetWorkSummaryOverTime?userID=${userID}`;

  // Add filters to URL
  url = appendFiltersToUrl(url, filters);

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
      formatPeriodLabel(d.Period, filters.groupBy || "week")
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
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  });
}

function loadWorkByLabel(userID, filters = {}) {
  let url = `https://localhost:7198/api/Reports/GetWorkByLabel?userID=${userID}`;

  // Add filters to URL
  url = appendFiltersToUrl(url, filters);

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
            backgroundColor: [
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

function loadMonthlyWorkAndEarnings(userID, filters = {}) {
  let url = `https://localhost:7198/api/Reports/GetMonthlyWorkAndEarnings?userID=${userID}`;

  // Add filters to URL
  url = appendFiltersToUrl(url, filters);

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
      formatPeriodLabel(d.Period, filters.groupBy || "week")
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
            label: "דקות",
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
        plugins: { legend: { position: "top" } },
        scales: {
          x: { stacked: false },
          y: { beginAtZero: true },
        },
      },
    });
  });
}

// Helper function to add filters to API URL
function appendFiltersToUrl(url, filters) {
  if (filters.groupBy) {
    url += `&groupBy=${filters.groupBy}`;
  }

  if (filters.fromDate) {
    url += `&fromDate=${filters.fromDate}`;
  }

  if (filters.toDate) {
    url += `&toDate=${filters.toDate}`;
  }

  if (filters.clientID) {
    url += `&clientID=${filters.clientID}`;
  }

  if (filters.projectID) {
    url += `&projectID=${filters.projectID}`;
  }

  return url;
}

// Format period labels based on groupBy
function formatPeriodLabel(period, groupBy) {
  if (groupBy === "DAY") {
    // Format: YYYY-MM-DD to DD/MM
    const dateParts = period.split("-");
    return `${dateParts[2]}/${dateParts[1]}`;
  } else if (groupBy === "WEEK") {
    // Format: YYYY-Www to שבוע WW
    return `שבוע ${period.split("-W")[1]}`;
  } else if (groupBy === "MONTH") {
    // Format: YYYY-MM to MM/YYYY
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
    return `${monthNames[monthIndex]} ${dateParts[0]}`;
  }

  return period;
}

// Load clients for the filter dropdown
function loadClientsForFilter(userID) {
  const url = `https://localhost:7198/api/Client/GetAllClientsByUserID?userID=${userID}`;

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
  const url = `https://localhost:7198/api/Projects/GetProjectByUserId/${userID}`;

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
  const url = `https://localhost:7198/api/Projects/GetProjectsByClient?userID=${userID}&clientID=${clientID}`;
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
