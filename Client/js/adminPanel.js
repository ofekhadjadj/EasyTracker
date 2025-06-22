// Admin Panel JavaScript
let currentUser = null;
let allUsers = [];
let systemStats = null;

// Initialize page when DOM is ready
$(document).ready(function () {
  console.log("🚀 Admin Panel initializing...");

  // Check if returning from admin mode
  const wasInAdminMode = localStorage.getItem("adminUser");
  if (wasInAdminMode) {
    console.log("🔙 Returning from admin mode");
    localStorage.removeItem("adminUser");
    showNotification("חזרת בהצלחה ממצב צפייה כמשתמש", "success");
  }

  // Check if user is logged in
  currentUser = JSON.parse(localStorage.getItem("user"));
  console.log("👤 Current user:", currentUser);

  if (!currentUser || !currentUser.id) {
    console.log("❌ No user found in localStorage");
    alert("לא נמצא משתמש מחובר. אנא התחבר מחדש.");
    window.location.href = "login.html";
    return;
  }

  // Set user info in sidebar
  const avatarImg = document.querySelector(".avatar-img");
  if (avatarImg) {
    avatarImg.src = currentUser.image || "./images/def/user-def.png";
  }

  const profName = document.getElementById("menu-prof-name");
  if (profName) {
    profName.innerText = currentUser.firstName || "אדמין";
  }

  // Check if AjaxCall is available
  if (typeof ajaxCall === "undefined") {
    console.error("❌ AjaxCall function not found!");
    showNotification("שגיאה: קובץ AjaxCall.js לא נטען", "error");
    return;
  }

  console.log("✅ AjaxCall is available");

  // Load all data
  loadSystemData();
});

// Load all system data
function loadSystemData() {
  console.log("🔄 Loading system data...");

  // Load system summary statistics
  loadSystemSummary();

  // Load top users
  loadTopActiveUsers();
  loadTopEarningUsers();

  // Load all users
  loadAllUsers();
}

// Load system summary statistics
function loadSystemSummary() {
  console.log("📊 Loading system summary...");

  ajaxCall(
    "GET",
    "https://localhost:7198/api/AdminPanel/GetSystemSummary",
    "",
    function (data) {
      console.log("✅ System summary loaded:", data);
      systemStats = data;
      displaySystemStats(data);
      showNotification("סטטיסטיקות המערכת נטענו בהצלחה", "success");
    },
    function (error) {
      console.error("❌ Error loading system summary:", error);
      console.error("❌ Error status:", error.status);
      console.error("❌ Error response:", error.responseText);

      let errorMessage = "שגיאה בטעינת סטטיסטיקות המערכת";
      if (error.status === 0) {
        errorMessage = "לא ניתן להתחבר לשרת - האם השרת פועל?";
      } else if (error.status === 404) {
        errorMessage = "API לא נמצא - בדוק את כתובת השרת";
      } else if (error.status === 500) {
        errorMessage = "שגיאת שרת פנימית";
      }

      showNotification(errorMessage, "error");
      displaySystemStatsError();
    }
  );
}

// Display system statistics
function displaySystemStats(data) {
  const statsGrid = document.getElementById("stats-grid");

  // The API returns an array with one object
  const stats = Array.isArray(data) ? data[0] : data;
  console.log("📊 Processing stats:", stats);

  // Calculate average session duration in hours
  const avgSessionHours = (stats.AvgSessionDurationMinutes || 0) / 60;

  const statsCards = [
    {
      icon: "fas fa-users",
      value: stats.TotalUsers || 0,
      label: "סך המשתמשים",
      class: "users",
      description: "כל המשתמשים הרשומים במערכת",
      trend: "+12%",
    },
    {
      icon: "fas fa-user-check",
      value: stats.ActiveUsers || 0,
      label: "משתמשים פעילים",
      class: "users",
      description: "משתמשים שהיו פעילים השבוע",
      trend: "+8%",
    },
    {
      icon: "fas fa-user-slash",
      value: stats.InactiveUsers || 0,
      label: "משתמשים מושבתים",
      class: "inactive-users",
      description: "משתמשים שלא פעילים זמן רב",
      trend: "-3%",
    },
    {
      icon: "fas fa-folder",
      value: stats.TotalProjects || 0,
      label: "סך כל הפרויקטים",
      class: "projects",
      description: "כל הפרויקטים שנוצרו במערכת",
      trend: "+15%",
    },
    {
      icon: "fas fa-cogs",
      value: stats.ActiveProjects || 0,
      label: "פרויקטים בעבודה",
      class: "active-projects",
      description: "פרויקטים פעילים שמתבצעים כעת",
      trend: "+22%",
    },
    {
      icon: "fas fa-check-circle",
      value: stats.CompletedProjects || 0,
      label: "פרויקטים שהושלמו",
      class: "projects",
      description: "פרויקטים שסומנו כמושלמים",
      trend: "+18%",
    },
    {
      icon: "fas fa-shekel-sign",
      value: `₪${Math.round(stats.TotalIncome || 0).toLocaleString()}`,
      label: "סך כל ההכנסות",
      class: "revenue",
      description: "סך כל הכנסות המשתמשים מפרויקטים",
      trend: "+31%",
    },
    {
      icon: "fas fa-clock",
      value: Math.round(stats.TotalWorkHours || 0).toLocaleString(),
      label: "סך כל שעות העבודה",
      class: "time",
      description: "סך כל השעות שעבדו במערכת",
      trend: "+25%",
    },
    {
      icon: "fas fa-chart-line",
      value: stats.TotalSessions || 0,
      label: "מספר הסשנים הכולל",
      class: "sessions",
      description: "כל סשני העבודה שנרשמו במערכת",
      trend: "+19%",
    },
    {
      icon: "fas fa-stopwatch",
      value: `${avgSessionHours.toFixed(1)} שעות`,
      label: "זמן סשן ממוצע",
      class: "time",
      description: "משך זמן ממוצע של סשן עבודה",
      trend: "+5%",
    },
  ];

  statsGrid.innerHTML = statsCards
    .map(
      (stat) => `
    <div class="stat-card ${stat.class}">
      <div class="stat-header">
        <div class="stat-icon"><i class="${stat.icon}"></i></div>
        <div class="stat-trend ${Math.random() > 0.3 ? "" : "down"}">
          <i class="fas fa-arrow-${Math.random() > 0.3 ? "up" : "down"}"></i>
          ${stat.trend}
        </div>
      </div>
      <div class="stat-content">
        <div class="stat-value">${stat.value}</div>
        <div class="stat-label">${stat.label}</div>
        <div class="stat-description">${stat.description}</div>
      </div>
    </div>
  `
    )
    .join("");
}

// Display error message for system stats
function displaySystemStatsError() {
  const statsGrid = document.getElementById("stats-grid");
  statsGrid.innerHTML = `
    <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #dc3545;">
      <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
      <p>שגיאה בטעינת סטטיסטיקות המערכת</p>
      <button onclick="loadSystemSummary()" style="margin-top: 15px; padding: 10px 20px; background: #0072ff; color: white; border: none; border-radius: 8px; cursor: pointer;">
        🔄 נסה שוב
      </button>
    </div>
  `;
}

// Load top 5 active users
function loadTopActiveUsers() {
  console.log("🏆 Loading top active users...");

  ajaxCall(
    "GET",
    "https://localhost:7198/api/AdminPanel/GetTop5ActiveUsers",
    "",
    function (data) {
      console.log("✅ Top active users loaded:", data);
      displayTopUsers(
        data,
        "top-active-users",
        "TotalSessionsLast30Days",
        "סשנים"
      );
    },
    function (error) {
      console.error("❌ Error loading top active users:", error);
      displayTopUsersError("top-active-users");
    }
  );
}

// Load top 5 earning users
function loadTopEarningUsers() {
  console.log("💰 Loading top earning users...");

  ajaxCall(
    "GET",
    "https://localhost:7198/api/AdminPanel/GetTop5EarningUsers",
    "",
    function (data) {
      console.log("✅ Top earning users loaded:", data);
      displayTopUsers(data, "top-earning-users", "TotalEarnings", "הכנסות");
    },
    function (error) {
      console.error("❌ Error loading top earning users:", error);
      displayTopUsersError("top-earning-users");
    }
  );
}

// Display top users
function displayTopUsers(users, containerId, valueField, statType) {
  const container = document.getElementById(containerId);

  if (!users || users.length === 0) {
    container.innerHTML = `
      <div class="no-data" style="text-align: center; padding: 20px; color: #666;">
        <i class="fas fa-info-circle" style="font-size: 1.5rem; margin-bottom: 10px;"></i>
        <p>אין נתונים להצגה</p>
      </div>
    `;
    return;
  }

  container.innerHTML = users
    .map((user, index) => {
      let statValue;
      if (statType === "סשנים") {
        statValue = user[valueField] || 0;
      } else {
        statValue = `₪${Math.round(user[valueField] || 0).toLocaleString()}`;
      }

      return `
      <div class="top-user-item">
        <div class="top-user-info">
          <div class="top-user-rank">${index + 1}</div>
          <div class="top-user-name">${user.FirstName} ${user.LastName}</div>
        </div>
        <div class="top-user-stat">${statValue}</div>
      </div>
    `;
    })
    .join("");
}

// Display error for top users
function displayTopUsersError(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = `
    <div class="error-message" style="text-align: center; padding: 20px; color: #dc3545;">
      <i class="fas fa-exclamation-triangle" style="margin-bottom: 10px;"></i>
      <p>שגיאה בטעינת הנתונים</p>
    </div>
  `;
}

// Load all users
function loadAllUsers() {
  console.log("👥 Loading all users...");

  ajaxCall(
    "GET",
    "https://localhost:7198/api/AdminPanel/GetAllUsersOverview",
    "",
    function (data) {
      console.log("✅ All users loaded:", data);
      console.log("📊 Number of users:", data.length);
      console.log("📊 First user structure:", data[0]);
      allUsers = data;
      displayUsersTable(data);
      hideUsersLoading();
      showNotification(`${data.length} משתמשים נטענו בהצלחה`, "success");

      // Refresh chart with new data if chart is initialized
      if (registrationsChart) {
        const currentPeriod = $("#period-select").val() || "month";
        const chartData = processUsersDataForChart(data, currentPeriod);
        updateChart(chartData, currentPeriod);
        console.log("📊 Chart refreshed with real user data");
      }
    },
    function (error) {
      console.error("❌ Error loading users:", error);
      console.error("❌ Error status:", error.status);
      console.error("❌ Error response:", error.responseText);

      let errorMessage = "שגיאה בטעינת רשימת המשתמשים";
      if (error.status === 0) {
        errorMessage = "לא ניתן להתחבר לשרת - האם השרת פועל?";
      } else if (error.status === 404) {
        errorMessage = "API לא נמצא - בדוק את כתובת השרת";
      }

      showNotification(errorMessage, "error");
      displayUsersTableError();
      hideUsersLoading();
    }
  );
}

// Display users table
function displayUsersTable(users) {
  const tbody = document.getElementById("users-tbody");
  console.log("📋 Displaying users table with", users?.length || 0, "users");

  if (!users || users.length === 0) {
    console.log("⚠️ No users to display");
    tbody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align: center; padding: 40px; color: #666;">
          <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
          אין משתמשים במערכת
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users
    .map(
      (user) => `
    <tr>
      <td>${user.FirstName || "-"}</td>
      <td>${user.LastName || "-"}</td>
      <td>${user.Email || "-"}</td>
      <td>${user.Role || "משתמש"}</td>
      <td>${formatDate(user.RegistrationDate)}</td>
      <td>${user.ProjectCount || 0}</td>
      <td>₪${Math.round(user.TotalEarnings || 0).toLocaleString()}</td>
      <td>${user.SessionCount || 0}</td>
      <td>${
        user.LastSessionDate ? formatDate(user.LastSessionDate) : "אין"
      }</td>
      <td>
        <label class="toggle-switch">
          <input type="checkbox" ${user.IsActive ? "checked" : ""} 
                 onchange="toggleUserStatus(${user.UserID}, this.checked)"
                 ${!user.UserID ? "disabled" : ""}>
          <span class="toggle-slider ${!user.UserID ? "disabled" : ""}"></span>
        </label>
      </td>
      <td>
        <div class="action-buttons">
          <button class="action-btn login-as" 
                  onclick="loginAsUser(${user.UserID})"
                  ${!user.UserID ? "disabled" : ""}
                  title="היכנס כמשתמש">
            <i class="fas fa-user"></i>
            היכנס
          </button>
          <button class="action-btn reset-password" 
                  onclick="resetUserPassword(${user.UserID})"
                  ${!user.UserID ? "disabled" : ""}
                  title="איפוס סיסמה">
            <i class="fas fa-key"></i>
            איפוס
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

// Display error for users table
function displayUsersTableError() {
  const tbody = document.getElementById("users-tbody");
  tbody.innerHTML = `
    <tr>
      <td colspan="11" style="text-align: center; padding: 40px; color: #dc3545;">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
        <p>שגיאה בטעינת רשימת המשתמשים</p>
        <button onclick="loadAllUsers()" style="margin-top: 15px; padding: 10px 20px; background: #0072ff; color: white; border: none; border-radius: 8px; cursor: pointer;">
          🔄 נסה שוב
        </button>
      </td>
    </tr>
  `;
}

// Hide users loading overlay
function hideUsersLoading() {
  const loadingOverlay = document.getElementById("users-loading");
  if (loadingOverlay) {
    loadingOverlay.classList.add("hidden");
  }
}

// Toggle user active status
function toggleUserStatus(userId, isActive) {
  console.log(`🔄 Toggling user ${userId} status to ${isActive}`);

  if (!userId) {
    showNotification("שגיאה: מזהה משתמש לא תקין", "error");
    return;
  }

  // Show loading state on the toggle
  const toggleSwitch = document.querySelector(`input[onchange*="${userId}"]`);
  if (toggleSwitch) {
    toggleSwitch.disabled = true;
  }

  // Use jQuery AJAX directly since the API returns text, not JSON
  $.ajax({
    type: "PUT",
    url: `https://localhost:7198/api/AdminPanel/ToggleUserActiveStatus?userId=${userId}`,
    timeout: 60000,
    success: function (response, textStatus, jqXHR) {
      console.log("✅ User status toggle success:", response);
      console.log("✅ Response text:", response);

      const statusText = isActive ? "הופעל" : "הושבת";
      showNotification(`המשתמש ${statusText} בהצלחה`, "success");

      // Update user in allUsers array
      const userIndex = allUsers.findIndex((u) => u.UserID === userId);
      if (userIndex !== -1) {
        allUsers[userIndex].IsActive = isActive;
        console.log(`✅ Updated user ${userId} IsActive to ${isActive}`);
      }

      // Re-enable the toggle and keep it in the correct position
      if (toggleSwitch) {
        toggleSwitch.disabled = false;
        toggleSwitch.checked = isActive;
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.error("❌ Error toggling user status:");
      console.error("❌ Status:", jqXHR.status);
      console.error("❌ StatusText:", jqXHR.statusText);
      console.error("❌ ResponseText:", jqXHR.responseText);
      console.error("❌ TextStatus:", textStatus);
      console.error("❌ ErrorThrown:", errorThrown);

      showNotification("שגיאה בשינוי סטטוס המשתמש", "error");

      // Revert toggle switch
      if (toggleSwitch) {
        toggleSwitch.disabled = false;
        toggleSwitch.checked = !isActive;
      }
    },
  });
}

// Reset user password
function resetUserPassword(userId) {
  console.log(`🔑 Resetting password for user ${userId}`);

  if (!userId) {
    showNotification("שגיאה: מזהה משתמש לא תקין", "error");
    return;
  }

  // Show confirmation dialog
  if (!confirm("האם אתה בטוח שברצונך לאפס את סיסמת המשתמש?")) {
    return;
  }

  ajaxCall(
    "PUT",
    `https://localhost:7198/api/AdminPanel/ResetUserPassword?userId=${userId}`,
    "",
    function (response) {
      console.log("✅ Password reset:", response);
      showNotification("סיסמת המשתמש אופסה בהצלחה", "success");
    },
    function (error) {
      console.error("❌ Error resetting password:", error);
      showNotification("שגיאה באיפוס סיסמת המשתמש", "error");
    }
  );
}

// Login as user
function loginAsUser(userId) {
  console.log(`👤 Logging in as user ${userId}`);

  if (!userId) {
    showNotification("שגיאה: מזהה משתמש לא תקין", "error");
    return;
  }

  // Find the user data from allUsers array
  const targetUser = allUsers.find((u) => u.UserID === userId);
  if (!targetUser) {
    showNotification("שגיאה: לא נמצא משתמש", "error");
    return;
  }

  // Show confirmation dialog
  if (
    !confirm(
      `האם אתה בטוח שברצונך להתחבר כמשתמש ${targetUser.FirstName} ${targetUser.LastName}?`
    )
  ) {
    return;
  }

  console.log(`🔄 Switching to user:`, targetUser);

  // Save current admin user
  const adminUser = JSON.parse(localStorage.getItem("user"));
  localStorage.setItem("adminUser", JSON.stringify(adminUser));

  // Create user object in the format expected by the system
  const userForLogin = {
    id: targetUser.UserID,
    firstName: targetUser.FirstName,
    lastName: targetUser.LastName,
    email: targetUser.Email,
    role: targetUser.Role,
    isActive: targetUser.IsActive,
    image: targetUser.image, // Add the user's image
    isAdminMode: true, // Flag to indicate this is admin mode
  };

  // Set the target user as current user
  localStorage.setItem("user", JSON.stringify(userForLogin));

  showNotification(
    `מתחבר כמשתמש ${targetUser.FirstName} ${targetUser.LastName}...`,
    "success"
  );

  // Redirect to projects page
  setTimeout(() => {
    window.location.href = "projects.html";
  }, 1000);
}

// Format date helper function
function formatDate(dateString) {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
}

// Show notification
function showNotification(message, type = "success") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((notification) => {
    if (notification.parentNode) {
      document.body.removeChild(notification);
    }
  });

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  const icon = type === "error" ? "✗" : "✓";
  notification.innerHTML = `
    <div class="notification-icon">${icon}</div>
    <div class="notification-message">${message}</div>
  `;

  document.body.appendChild(notification);

  // Show notification
  setTimeout(() => {
    notification.classList.add("show");
  }, 100);

  // Hide notification after delay
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, 4000);
}

// Refresh data function (can be called from UI)
function refreshData() {
  console.log("🔄 Refreshing all data...");
  showNotification("מרענן נתונים...", "success");

  // Show loading states
  document.getElementById("stats-grid").innerHTML = `
    <div class="loading-spinner" style="grid-column: 1 / -1;">
      <i class="fas fa-spinner fa-spin"></i>
      <span>טוען נתונים...</span>
    </div>
  `;

  document.getElementById("top-active-users").innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
    </div>
  `;

  document.getElementById("top-earning-users").innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
    </div>
  `;

  document.getElementById("users-loading").classList.remove("hidden");

  // Reload all data
  loadSystemData();
}

// Chart functionality
let registrationsChart = null;

// Initialize chart
function initializeChart() {
  const ctx = document.getElementById("registrations-chart");
  if (!ctx) {
    console.error("❌ Chart canvas not found");
    return;
  }

  registrationsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "מצטרפים חדשים",
          data: [],
          borderColor: "rgb(0, 114, 255)",
          backgroundColor: "rgba(0, 114, 255, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "rgb(0, 114, 255)",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            font: {
              family: "Assistant",
              size: 14,
            },
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "rgb(0, 114, 255)",
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: function (context) {
              return context[0].label;
            },
            label: function (context) {
              return `מצטרפים: ${context.parsed.y}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.1)",
          },
          ticks: {
            font: {
              family: "Assistant",
              size: 12,
            },
            color: "#666",
          },
        },
        x: {
          grid: {
            color: "rgba(0, 0, 0, 0.1)",
          },
          ticks: {
            font: {
              family: "Assistant",
              size: 12,
            },
            color: "#666",
          },
        },
      },
    },
  });

  // Load initial data
  loadChartData("month");
}

// Load chart data
function loadChartData(period) {
  console.log(`📊 Loading chart data for period: ${period}`);

  // Show loading
  $("#chart-loading").removeClass("hidden");

  // If we already have users data, process it for the chart
  if (allUsers && allUsers.length > 0) {
    console.log("📊 Processing existing users data for chart");
    const chartData = processUsersDataForChart(allUsers, period);
    updateChart(chartData, period);
    $("#chart-loading").addClass("hidden");
    return;
  }

  // Otherwise, load users data first
  ajaxCall(
    "GET",
    "https://localhost:7198/api/AdminPanel/GetAllUsersOverview",
    "",
    function (data) {
      console.log("✅ Users data loaded for chart:", data);
      allUsers = data; // Store the data
      const chartData = processUsersDataForChart(data, period);
      updateChart(chartData, period);
      $("#chart-loading").addClass("hidden");
    },
    function (error) {
      console.error("❌ Error loading users data for chart:", error);
      $("#chart-loading").addClass("hidden");
      showNotification("שגיאה בטעינת נתוני הגרף", "error");

      // Show demo data on error
      showDemoChartData(period);
    }
  );
}

// Update chart with new data
function updateChart(data, period) {
  if (!registrationsChart) {
    console.error("❌ Chart not initialized");
    return;
  }

  let labels = [];
  let chartData = [];

  if (Array.isArray(data) && data.length > 0) {
    labels = data.map((item) => item.date || item.label);
    chartData = data.map((item) => item.count || item.value || 0);
  }

  registrationsChart.data.labels = labels;
  registrationsChart.data.datasets[0].data = chartData;
  registrationsChart.update("active");
}

// Process users data for chart
function processUsersDataForChart(users, period) {
  console.log(`📊 Processing ${users.length} users for ${period} chart`);

  const now = new Date();
  let startDate,
    dateGroups = {};

  // Determine date range and grouping
  switch (period) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "year":
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Filter users by registration date and group them
  users.forEach((user) => {
    if (!user.RegistrationDate) return;

    const regDate = new Date(user.RegistrationDate);
    if (regDate < startDate) return;

    let groupKey;

    switch (period) {
      case "week":
        // Group by day
        groupKey = regDate.toLocaleDateString("he-IL", { weekday: "long" });
        break;
      case "month":
        // Group by week
        const weekNumber = Math.ceil(regDate.getDate() / 7);
        groupKey = `שבוע ${weekNumber}`;
        break;
      case "year":
        // Group by month
        groupKey = regDate.toLocaleDateString("he-IL", { month: "long" });
        break;
    }

    if (groupKey) {
      dateGroups[groupKey] = (dateGroups[groupKey] || 0) + 1;
    }
  });

  // Convert to chart format
  const chartData = Object.entries(dateGroups).map(([date, count]) => ({
    date,
    count,
  }));

  // Sort by chronological order
  if (period === "year") {
    const monthOrder = [
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
    chartData.sort(
      (a, b) => monthOrder.indexOf(a.date) - monthOrder.indexOf(b.date)
    );
  } else if (period === "week") {
    const dayOrder = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    chartData.sort(
      (a, b) => dayOrder.indexOf(a.date) - dayOrder.indexOf(b.date)
    );
  }

  console.log("📊 Processed chart data:", chartData);
  return chartData;
}

// Show demo data when API fails
function showDemoChartData(period) {
  let demoData = [];

  switch (period) {
    case "week":
      demoData = [
        { date: "ראשון", count: 3 },
        { date: "שני", count: 7 },
        { date: "שלישי", count: 5 },
        { date: "רביעי", count: 12 },
        { date: "חמישי", count: 8 },
        { date: "שישי", count: 15 },
        { date: "שבת", count: 4 },
      ];
      break;
    case "month":
      demoData = [
        { date: "שבוע 1", count: 23 },
        { date: "שבוע 2", count: 31 },
        { date: "שבוע 3", count: 28 },
        { date: "שבוע 4", count: 42 },
      ];
      break;
    case "year":
      demoData = [
        { date: "ינואר", count: 85 },
        { date: "פברואר", count: 92 },
        { date: "מרץ", count: 78 },
        { date: "אפריל", count: 105 },
        { date: "מאי", count: 118 },
        { date: "יוני", count: 134 },
        { date: "יולי", count: 142 },
        { date: "אוגוסט", count: 156 },
        { date: "ספטמבר", count: 149 },
        { date: "אוקטובר", count: 167 },
        { date: "נובמבר", count: 178 },
        { date: "דצמבר", count: 189 },
      ];
      break;
  }

  updateChart(demoData, period);
  showNotification("מוצגים נתונים לדוגמה", "info");
}

// Initialize chart and event listeners when DOM is ready
$(document).ready(function () {
  // Initialize chart after other data loads
  setTimeout(initializeChart, 1500);

  // Event listeners for chart controls
  $("#period-select").on("change", function () {
    loadChartData($(this).val());
  });

  $("#refresh-chart-btn").on("click", function () {
    const period = $("#period-select").val();
    loadChartData(period);
  });
});

// Export functions for global access
window.toggleUserStatus = toggleUserStatus;
window.resetUserPassword = resetUserPassword;
window.loginAsUser = loginAsUser;
window.refreshData = refreshData;
window.loadSystemSummary = loadSystemSummary;
window.loadAllUsers = loadAllUsers;
window.loadTopActiveUsers = loadTopActiveUsers;
window.loadTopEarningUsers = loadTopEarningUsers;
window.initializeChart = initializeChart;
window.loadChartData = loadChartData;
