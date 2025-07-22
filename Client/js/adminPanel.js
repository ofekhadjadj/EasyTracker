// Admin Panel JavaScript
let currentUser = null;
let allUsers = [];
let filteredUsers = [];
let systemStats = null;
let currentSort = { field: null, direction: "asc" };
let usersTable = null;

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

  // Initialize search and sort functionality
  initializeSearchAndSort();
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
    apiConfig.createApiUrl("AdminPanel/GetSystemSummary"),
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
    apiConfig.createApiUrl("AdminPanel/GetTop5ActiveUsers"),
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
    apiConfig.createApiUrl("AdminPanel/GetTop5EarningUsers"),
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
    apiConfig.createApiUrl("AdminPanel/GetAllUsersOverview"),
    "",
    function (data) {
      console.log("✅ All users loaded:", data);
      console.log("📊 Number of users:", data.length);
      console.log("📊 First user structure:", data[0]);
      allUsers = data;
      filteredUsers = [...data]; // Initialize filtered users
      displayUsersTable(filteredUsers);
      updateResultsCount(); // Initialize results count
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

// Initialize DataTable for pagination only
function initializeUsersTable() {
  console.log("📊 Initializing users DataTable for pagination...");

  usersTable = $("#users-table").DataTable({
    paging: true,
    searching: false, // Disable built-in search (we have our own)
    ordering: false, // Disable built-in sorting (we have our own)
    info: true, // Enable info text
    lengthChange: true,
    pageLength: 5,
    lengthMenu: [5, 10, 25, 50, 100],
    language: {
      lengthMenu: "הצג _MENU_ משתמשים",
      info: "מציג _START_ עד _END_ מתוך _TOTAL_ משתמשים",
      infoEmpty: "מציג 0 עד 0 מתוך 0 משתמשים",
      infoFiltered: "(מסונן מתוך _MAX_ משתמשים)",
      paginate: {
        first: "ראשון",
        last: "אחרון",
        next: "הבא",
        previous: "קודם",
      },
      emptyTable: "אין משתמשים זמינים בטבלה",
    },
  });

  console.log("✅ Users DataTable initialized successfully");
}

// Display users table
function displayUsersTable(users) {
  console.log("📋 Displaying users table with", users?.length || 0, "users");

  // Initialize DataTable if not already done
  if (!usersTable) {
    initializeUsersTable();
  }

  // Clear existing data
  usersTable.clear();

  if (!users || users.length === 0) {
    console.log("⚠️ No users to display");
    usersTable.draw();
    return;
  }

  // Add users to table
  users.forEach((user) => {
    const rowData = [
      user.FirstName || "-",
      user.LastName || "-",
      user.Email || "-",
      user.Role || "משתמש",
      formatDate(user.RegistrationDate),
      user.ProjectCount || 0,
      `₪${Math.round(user.TotalEarnings || 0).toLocaleString()}`,
      user.SessionCount || 0,
      user.LastSessionDate ? formatDate(user.LastSessionDate) : "אין",
      `<label class="toggle-switch">
        <input type="checkbox" ${user.IsActive ? "checked" : ""} 
               onchange="toggleUserStatus(${user.UserID}, this.checked)"
               ${!user.UserID ? "disabled" : ""}>
        <span class="toggle-slider ${!user.UserID ? "disabled" : ""}"></span>
      </label>`,
      `<div class="action-buttons">
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
      </div>`,
    ];

    usersTable.row.add(rowData);
  });

  // Draw the table
  usersTable.draw();
}

// Display error for users table
function displayUsersTableError() {
  if (usersTable) {
    usersTable.clear().draw();
  }
  showNotification("שגיאה בטעינת רשימת המשתמשים", "error");
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
    url: apiConfig.createApiUrl("AdminPanel/ToggleUserActiveStatus", {
      userId: userId,
    }),
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

      // Update user in filteredUsers array too
      const filteredUserIndex = filteredUsers.findIndex(
        (u) => u.UserID === userId
      );
      if (filteredUserIndex !== -1) {
        filteredUsers[filteredUserIndex].IsActive = isActive;
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

  // Find the user data from allUsers array
  const targetUser = allUsers.find((u) => u.UserID === userId);
  const userName = targetUser
    ? `${targetUser.FirstName} ${targetUser.LastName}`
    : "המשתמש";

  // בדיקה שאין כבר פופאפ פתוח
  if ($.fancybox.getInstance()) {
    console.log("פופאפ כבר פתוח, מתעלם מהקליק");
    return;
  }

  const popupHtml = `
    <div style="max-width: 400px; text-align: center; font-family: Assistant; padding: 20px;">
      <h3>איפוס סיסמה</h3>
      <p>האם אתה בטוח שברצונך לאפס את סיסמת ${userName}?</p>
      <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
        <button class="gradient-button" id="confirmResetBtn" style="background: linear-gradient(135deg, #d50000, #ff4e50); color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(255, 78, 80, 0.3);">כן, אפס סיסמה</button>
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
      $("#confirmResetBtn")
        .off("click")
        .on("click", function () {
          const button = $(this);
          if (button.data("resetting")) {
            return false;
          }
          button.data("resetting", true);

          ajaxCall(
            "PUT",
            apiConfig.createApiUrl("AdminPanel/ResetUserPassword", {
              userId: userId,
            }),
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
          $.fancybox.close();

          setTimeout(() => {
            button.data("resetting", false);
          }, 1000);
        });
    },
    beforeClose: function () {
      // ניקוי event listeners
      $("#confirmResetBtn").off("click");
    },
  });
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

  // בדיקה שאין כבר פופאפ פתוח
  if ($.fancybox.getInstance()) {
    console.log("פופאפ כבר פתוח, מתעלם מהקליק");
    return;
  }

  const popupHtml = `
    <div style="max-width: 400px; text-align: center; font-family: Assistant; padding: 20px;">
      <h3>כניסה כמשתמש</h3>
      <p>האם אתה בטוח שברצונך להתחבר כמשתמש <strong>${targetUser.FirstName} ${targetUser.LastName}</strong>?</p>
      <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
        <button class="gradient-button" id="confirmLoginBtn" style="background: linear-gradient(135deg, #d50000, #ff4e50); color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(255, 78, 80, 0.3);">כן, היכנס</button>
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
      $("#confirmLoginBtn")
        .off("click")
        .on("click", function () {
          const button = $(this);
          if (button.data("logging")) {
            return false;
          }
          button.data("logging", true);

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

          $.fancybox.close();

          // Redirect to projects page
          setTimeout(() => {
            window.location.href = "projects.html";
          }, 1000);

          setTimeout(() => {
            button.data("logging", false);
          }, 1000);
        });
    },
    beforeClose: function () {
      // ניקוי event listeners
      $("#confirmLoginBtn").off("click");
    },
  });
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

  // Clear search and sort
  $("#users-search").val("");
  $("#clear-search").hide();
  currentSort = { field: null, direction: "asc" };
  $(".users-table th.sortable").removeClass("sort-asc sort-desc");

  // Reset DataTable if exists
  if (usersTable) {
    usersTable.page.len(5).draw(); // Reset to 5 items per page
  }

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
          min: 0,
          suggestedMax: 3,
          grid: {
            color: "rgba(0, 0, 0, 0.1)",
          },
          ticks: {
            stepSize: 1,
            font: {
              family: "Assistant",
              size: 12,
            },
            color: "#666",
            callback: function (value) {
              // Only show whole numbers
              if (Number.isInteger(value)) {
                return value;
              }
              return null;
            },
          },
        },
        x: {
          grid: {
            color: "rgba(0, 0, 0, 0.1)",
          },
          ticks: {
            font: {
              family: "Assistant",
              size: 13,
            },
            color: "#666",
            maxRotation: 0,
            minRotation: 0,
            callback: function (value, index, values) {
              // Handle multi-line labels for month view
              const label = this.getLabelForValue(value);
              if (label && label.includes("\n")) {
                return label.split("\n");
              }
              return label;
            },
          },
        },
      },
    },
  });

  // Load initial data
  loadChartData("month");
}

// Load chart data
function loadChartData(period, forceRefresh = false) {
  console.log(
    `📊 Loading chart data for period: ${period}, forceRefresh: ${forceRefresh}`
  );

  // Show loading
  $("#chart-loading").removeClass("hidden");

  // If we already have users data and not forcing refresh, process it for the chart
  if (allUsers && allUsers.length > 0 && !forceRefresh) {
    console.log("📊 Using cached users data for chart (no server call needed)");
    const chartData = processUsersDataForChart(allUsers, period);
    updateChart(chartData, period);
    $("#chart-loading").addClass("hidden");
    return;
  }

  // Otherwise, load users data first
  console.log(
    forceRefresh
      ? "🔄 FORCE REFRESH: Loading fresh data from server for chart"
      : "🔄 Loading fresh data from server for chart (no cached data available)"
  );
  ajaxCall(
    "GET",
    apiConfig.createApiUrl("AdminPanel/GetAllUsersOverview"),
    "",
    function (data) {
      console.log("✅ Users data loaded for chart:", data);
      allUsers = data; // Store the data
      const chartData = processUsersDataForChart(data, period);
      updateChart(chartData, period);
      $("#chart-loading").addClass("hidden");

      // Show success notification if this was a forced refresh
      if (forceRefresh) {
        showNotification("נתוני הגרף עודכנו בהצלחה", "success");
      }
    },
    function (error) {
      console.error("❌ Error loading users data for chart:", error);
      $("#chart-loading").addClass("hidden");

      if (forceRefresh) {
        showNotification(
          "שגיאה ברענון נתוני הגרף. מציג נתונים קיימים.",
          "error"
        );
        // If refresh failed but we have existing data, use it
        if (allUsers && allUsers.length > 0) {
          const chartData = processUsersDataForChart(allUsers, period);
          updateChart(chartData, period);
          return;
        }
      } else {
        showNotification("שגיאה בטעינת נתוני הגרף", "error");
      }

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

  // Calculate dynamic max for Y axis
  const maxValue = Math.max(...chartData, 0);
  const suggestedMax = Math.max(3, maxValue + 1); // At least 3, or max value + 1

  // Update Y axis configuration
  registrationsChart.options.scales.y.suggestedMax = suggestedMax;

  registrationsChart.data.labels = labels;
  registrationsChart.data.datasets[0].data = chartData;
  registrationsChart.update("active");
}

// Process users data for chart
function processUsersDataForChart(users, period) {
  console.log(`📊 Processing ${users.length} users for ${period} chart`);

  const now = new Date();
  let startDate,
    dateGroups = {},
    weekRanges = {}; // Store week date ranges for month view

  // Determine date range and grouping
  switch (period) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      console.log(
        `📊 Month chart - Start date: ${startDate.toLocaleDateString(
          "he-IL"
        )}, End date: ${now.toLocaleDateString("he-IL")}`
      );
      break;
    case "year":
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      console.log(
        `📊 Year chart - Start date: ${startDate.toLocaleDateString(
          "he-IL"
        )}, End date: ${now.toLocaleDateString("he-IL")}`
      );
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Initialize all periods with 0
  let allPeriods = [];

  switch (period) {
    case "week":
      // Calculate 7 days back from today
      allPeriods = [];
      for (let i = 6; i >= 0; i--) {
        const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayName = dayDate.toLocaleDateString("he-IL", {
          weekday: "long",
        });
        const dateStr = `${dayDate.getDate().toString().padStart(2, "0")}/${(
          dayDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}`;
        const dayLabel = `${dayName}\n${dateStr}`;
        allPeriods.push(dayLabel);

        console.log(
          `📅 Week chart day: ${dayLabel} (${dayDate.toLocaleDateString(
            "he-IL"
          )})`
        );
      }
      break;
    case "month":
      // Calculate actual week ranges for the last 30 days
      const endDate = new Date(now);
      const startDateMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Start from the beginning of the week containing startDate (Sunday = 0)
      const firstWeekStart = new Date(startDateMonth);
      firstWeekStart.setDate(
        firstWeekStart.getDate() - firstWeekStart.getDay()
      );

      let weekNumber = 1;
      let currentWeekStart = new Date(firstWeekStart);

      while (currentWeekStart <= endDate && weekNumber <= 5) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Format dates
        const startStr = `${currentWeekStart
          .getDate()
          .toString()
          .padStart(2, "0")}/${(currentWeekStart.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
        const endStr = `${weekEnd.getDate().toString().padStart(2, "0")}/${(
          weekEnd.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}`;

        const weekLabel = `שבוע ${weekNumber}\nמ-${startStr} עד-${endStr}`;
        allPeriods.push(weekLabel);

        // Store the actual date range for this week
        weekRanges[weekLabel] = {
          start: new Date(currentWeekStart),
          end: new Date(weekEnd),
        };

        console.log(
          `📊 Week range: ${weekLabel} - Start: ${currentWeekStart.toLocaleDateString(
            "he-IL"
          )} End: ${weekEnd.toLocaleDateString("he-IL")}`
        );

        // Move to next week
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        weekNumber++;
      }
      break;
    case "year":
      // Calculate 12 months back from current date
      const currentDate = new Date(now);
      allPeriods = [];

      // Start from 12 months ago
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );
        const monthName = monthDate.toLocaleDateString("he-IL", {
          month: "long",
        });
        const year = monthDate.getFullYear();

        const monthLabel = `${monthName}\n${year}`;
        allPeriods.push(monthLabel);

        console.log(
          `📅 Year chart month: ${monthLabel} (${monthDate.toLocaleDateString(
            "he-IL"
          )})`
        );
      }
      break;
  }

  // Initialize all periods with 0
  allPeriods.forEach((period) => {
    dateGroups[period] = 0;
  });

  // Filter users by registration date and group them
  users.forEach((user) => {
    if (!user.RegistrationDate) return;

    const regDate = new Date(user.RegistrationDate);
    if (regDate < startDate) {
      console.log(
        `📅 User ${user.FirstName} ${
          user.LastName
        } registered ${regDate.toLocaleDateString(
          "he-IL"
        )} is before startDate ${startDate.toLocaleDateString("he-IL")}`
      );
      return;
    }

    let groupKey;

    switch (period) {
      case "week":
        // Group by specific day with date
        const dayName = regDate.toLocaleDateString("he-IL", {
          weekday: "long",
        });
        const dateStr = `${regDate.getDate().toString().padStart(2, "0")}/${(
          regDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}`;
        groupKey = `${dayName}\n${dateStr}`;

        console.log(
          `📅 User ${user.FirstName} ${
            user.LastName
          } registered ${regDate.toLocaleDateString(
            "he-IL"
          )} assigned to ${groupKey}`
        );
        break;
      case "month":
        // Find which week this date belongs to
        groupKey = null;
        // Create a date object that only considers the date part (not time)
        const regDateOnly = new Date(
          regDate.getFullYear(),
          regDate.getMonth(),
          regDate.getDate()
        );

        for (const [weekLabel, range] of Object.entries(weekRanges)) {
          const startDateOnly = new Date(
            range.start.getFullYear(),
            range.start.getMonth(),
            range.start.getDate()
          );
          const endDateOnly = new Date(
            range.end.getFullYear(),
            range.end.getMonth(),
            range.end.getDate()
          );

          if (regDateOnly >= startDateOnly && regDateOnly <= endDateOnly) {
            groupKey = weekLabel;
            console.log(
              `📅 User registered ${regDate.toLocaleDateString(
                "he-IL"
              )} assigned to ${weekLabel}`
            );
            break;
          }
        }

        if (!groupKey) {
          console.log(
            `⚠️ User registered ${regDate.toLocaleDateString(
              "he-IL"
            )} could not be assigned to any week`
          );
        }
        break;
      case "year":
        // Group by month and year
        const monthName = regDate.toLocaleDateString("he-IL", {
          month: "long",
        });
        const year = regDate.getFullYear();
        groupKey = `${monthName}\n${year}`;

        console.log(
          `📅 User ${user.FirstName} ${
            user.LastName
          } registered ${regDate.toLocaleDateString(
            "he-IL"
          )} assigned to ${groupKey}`
        );
        break;
    }

    if (groupKey && dateGroups.hasOwnProperty(groupKey)) {
      dateGroups[groupKey] += 1;
    }
  });

  // Convert to chart format in the correct order
  const chartData = allPeriods.map((period) => ({
    date: period,
    count: dateGroups[period],
  }));

  console.log("📊 Processed chart data:", chartData);
  return chartData;
}

// Show demo data when API fails
function showDemoChartData(period) {
  let demoData = [];

  switch (period) {
    case "week":
      // Generate demo data for 7 days back
      const nowDemo = new Date();
      demoData = [];
      const weekDemoCountsData = [3, 7, 5, 12, 8, 15, 4];

      for (let i = 6; i >= 0; i--) {
        const dayDate = new Date(nowDemo.getTime() - i * 24 * 60 * 60 * 1000);
        const dayName = dayDate.toLocaleDateString("he-IL", {
          weekday: "long",
        });
        const dateStr = `${dayDate.getDate().toString().padStart(2, "0")}/${(
          dayDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}`;
        const dayLabel = `${dayName}\n${dateStr}`;

        demoData.push({
          date: dayLabel,
          count: weekDemoCountsData[6 - i],
        });
      }
      break;
    case "month":
      // Generate demo data for weeks with date ranges
      const currentDate = new Date();
      const startDate = new Date(
        currentDate.getTime() - 30 * 24 * 60 * 60 * 1000
      );
      const firstWeekStart = new Date(startDate);
      firstWeekStart.setDate(
        firstWeekStart.getDate() - firstWeekStart.getDay()
      );

      demoData = [];
      const weekDemoCounts = [23, 31, 28, 42, 35];
      let weekNumber = 1;
      let currentWeekStart = new Date(firstWeekStart);

      while (currentWeekStart <= currentDate && weekNumber <= 5) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const startStr = `${currentWeekStart
          .getDate()
          .toString()
          .padStart(2, "0")}/${(currentWeekStart.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
        const endStr = `${weekEnd.getDate().toString().padStart(2, "0")}/${(
          weekEnd.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}`;
        const weekLabel = `שבוע ${weekNumber}\nמ-${startStr} עד-${endStr}`;

        demoData.push({
          date: weekLabel,
          count: weekDemoCounts[weekNumber - 1] || 0,
        });

        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        weekNumber++;
      }
      break;
    case "year":
      // Generate demo data for 12 months back
      const now = new Date();
      demoData = [];
      const monthDemoCounts = [
        85, 92, 78, 105, 118, 134, 142, 156, 149, 167, 178, 189,
      ];

      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = monthDate.toLocaleDateString("he-IL", {
          month: "long",
        });
        const year = monthDate.getFullYear();
        const monthLabel = `${monthName}\n${year}`;

        demoData.push({
          date: monthLabel,
          count: monthDemoCounts[11 - i],
        });
      }
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
    const selectedPeriod = $(this).val();
    console.log(`📊 Period changed to: ${selectedPeriod}`);
    loadChartData(selectedPeriod);
  });

  $("#refresh-chart-btn").on("click", function () {
    const period = $("#period-select").val();
    console.log("🔄 Chart refresh button clicked");

    // Add spinning animation to button
    $(this).addClass("fa-spin");
    setTimeout(() => {
      $(this).removeClass("fa-spin");
    }, 1500);

    // Force refresh the chart data
    loadChartData(period, true);
    showNotification("מרענן נתוני הגרף...", "success");
  });
});

// Initialize search and sort functionality
function initializeSearchAndSort() {
  // Search input event listeners
  const searchInput = $("#users-search");
  const clearBtn = $("#clear-search");

  // Real-time search
  searchInput.on("input", function () {
    const searchTerm = $(this).val().trim();

    if (searchTerm) {
      clearBtn.show();
    } else {
      clearBtn.hide();
    }

    filterUsers(searchTerm);
  });

  // Clear search
  clearBtn.on("click", function () {
    searchInput.val("");
    $(this).hide();
    filterUsers("");
  });

  // Sort functionality
  $(".users-table").on("click", "th.sortable", function () {
    const field = $(this).data("sort");
    const currentDirection =
      currentSort.field === field ? currentSort.direction : "asc";
    const newDirection = currentDirection === "asc" ? "desc" : "asc";

    sortUsers(field, newDirection);
  });

  // Refresh users button
  $("#refresh-users-btn").on("click", function () {
    $(this).addClass("fa-spin");
    loadAllUsers();
    setTimeout(() => {
      $(this).removeClass("fa-spin");
    }, 1000);
  });
}

// Filter users based on search term
function filterUsers(searchTerm) {
  if (!allUsers || allUsers.length === 0) {
    return;
  }

  if (!searchTerm) {
    filteredUsers = [...allUsers];
  } else {
    const term = searchTerm.toLowerCase();
    filteredUsers = allUsers.filter((user) => {
      const firstName = (user.FirstName || "").toLowerCase();
      const lastName = (user.LastName || "").toLowerCase();
      const email = (user.Email || "").toLowerCase();
      const fullName = `${firstName} ${lastName}`;

      return (
        firstName.includes(term) ||
        lastName.includes(term) ||
        fullName.includes(term) ||
        email.includes(term)
      );
    });
  }

  // Apply current sort if any
  if (currentSort.field) {
    applySortToFilteredUsers();
  }

  // Update display
  displayUsersTable(filteredUsers);
  updateResultsCount();
}

// Sort users by field and direction
function sortUsers(field, direction) {
  // Update sort state
  currentSort = { field, direction };

  // Update UI to show sort direction
  $(".users-table th.sortable").removeClass("sort-asc sort-desc");
  $(`.users-table th[data-sort="${field}"]`).addClass(`sort-${direction}`);

  // Apply sort to current filtered results
  applySortToFilteredUsers();

  // Update display
  displayUsersTable(filteredUsers);
}

// Apply current sort to filtered users
function applySortToFilteredUsers() {
  if (!currentSort.field || !filteredUsers) return;

  filteredUsers.sort((a, b) => {
    let aVal = a[currentSort.field];
    let bVal = b[currentSort.field];

    // Handle different data types
    if (
      currentSort.field === "RegistrationDate" ||
      currentSort.field === "LastSessionDate"
    ) {
      aVal = aVal ? new Date(aVal) : new Date(0);
      bVal = bVal ? new Date(bVal) : new Date(0);
    } else if (
      currentSort.field === "ProjectCount" ||
      currentSort.field === "SessionCount" ||
      currentSort.field === "TotalEarnings"
    ) {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    } else if (currentSort.field === "IsActive") {
      aVal = aVal ? 1 : 0;
      bVal = bVal ? 1 : 0;
    } else {
      // String comparison
      aVal = (aVal || "").toString().toLowerCase();
      bVal = (bVal || "").toString().toLowerCase();
    }

    if (aVal < bVal) return currentSort.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return currentSort.direction === "asc" ? 1 : -1;
    return 0;
  });
}

// Update results count display
function updateResultsCount() {
  const total = allUsers.length;
  const filtered = filteredUsers.length;

  let text;
  if (filtered === total) {
    text = `${total} משתמשים`;
  } else {
    text = `${filtered} מתוך ${total} משתמשים`;
  }

  $("#results-count").text(text);
}

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
