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

  const statsCards = [
    {
      icon: "👥",
      value: stats.TotalUsers || 0,
      label: "סך המשתמשים",
      class: "users",
    },
    {
      icon: "✅",
      value: stats.ActiveUsers || 0,
      label: "משתמשים פעילים",
      class: "users",
    },
    {
      icon: "❌",
      value: stats.InactiveUsers || 0,
      label: "משתמשים לא פעילים",
      class: "users",
    },
    {
      icon: "📁",
      value: stats.TotalProjects || 0,
      label: "סך כל הפרויקטים",
      class: "projects",
    },
    {
      icon: "🔄",
      value: stats.ActiveProjects || 0,
      label: "פרויקטים פעילים",
      class: "projects",
    },
    {
      icon: "✔️",
      value: stats.CompletedProjects || 0,
      label: "פרויקטים שהושלמו",
      class: "projects",
    },
    {
      icon: "💰",
      value: `₪${Math.round(stats.TotalIncome || 0).toLocaleString()}`,
      label: "סך כל ההכנסות",
      class: "revenue",
    },
    {
      icon: "⏰",
      value: Math.round(stats.TotalWorkHours || 0).toLocaleString(),
      label: "סך כל שעות העבודה",
      class: "time",
    },
    {
      icon: "📈",
      value: stats.TotalSessions || 0,
      label: "מספר הסשנים הכולל",
      class: "sessions",
    },
    {
      icon: "⏱️",
      value: `${Math.round(stats.AvgSessionDurationMinutes || 0)} דקות`,
      label: "זמן סשן ממוצע",
      class: "time",
    },
  ];

  statsGrid.innerHTML = statsCards
    .map(
      (stat) => `
    <div class="stat-card ${stat.class}">
      <div class="stat-icon">${stat.icon}</div>
      <div class="stat-value">${stat.value}</div>
      <div class="stat-label">${stat.label}</div>
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

// Export functions for global access
window.toggleUserStatus = toggleUserStatus;
window.resetUserPassword = resetUserPassword;
window.loginAsUser = loginAsUser;
window.refreshData = refreshData;
window.loadSystemSummary = loadSystemSummary;
window.loadAllUsers = loadAllUsers;
window.loadTopActiveUsers = loadTopActiveUsers;
window.loadTopEarningUsers = loadTopEarningUsers;
