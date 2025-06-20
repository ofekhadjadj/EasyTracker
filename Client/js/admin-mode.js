// admin-mode.js - ניהול מצב אדמין בכל הדפים

// Check if we're in admin mode and show indicator
function initAdminMode() {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  if (currentUser && currentUser.isAdminMode) {
    console.log("🔧 Admin mode detected on page:", window.location.pathname);

    // Don't show indicator on admin panel itself
    if (!window.location.pathname.includes("adminPanel.html")) {
      showAdminModeIndicator(currentUser);
    }
  }
}

// Show admin mode indicator
function showAdminModeIndicator(user) {
  // Remove existing indicator if present
  const existingIndicator = document.getElementById("admin-mode-indicator");
  if (existingIndicator) {
    existingIndicator.remove();
  }

  // Create admin mode indicator HTML
  const indicatorHTML = `
    <div id="admin-mode-indicator" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      color: white;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
      animation: adminPulse 2s infinite;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    ">
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-user-shield" style="font-size: 1.2em;"></i>
        <span style="font-weight: bold;">מצב אדמין פעיל</span>
        <span style="font-size: 0.9em; opacity: 0.9;">
          צופה כ: ${user.firstName} ${user.lastName}
        </span>
      </div>
      <button id="return-to-admin" style="
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 8px 15px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9em;
        transition: all 0.3s ease;
      " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" 
         onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
        <i class="fas fa-arrow-left"></i> חזור לפאנל אדמין
      </button>
    </div>
  `;

  // Add CSS animation if not exists
  if (!document.getElementById("admin-mode-styles")) {
    const style = document.createElement("style");
    style.id = "admin-mode-styles";
    style.textContent = `
      @keyframes adminPulse {
        0% { box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3); }
        50% { box-shadow: 0 4px 25px rgba(255, 107, 107, 0.5); }
        100% { box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3); }
      }
      
      /* Adjust body padding when admin indicator is shown */
      body.admin-mode {
        padding-top: 60px !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Insert indicator at the beginning of body
  document.body.insertAdjacentHTML("afterbegin", indicatorHTML);
  document.body.classList.add("admin-mode");

  // Add click event to return button
  const returnBtn = document.getElementById("return-to-admin");
  if (returnBtn) {
    returnBtn.addEventListener("click", returnToAdminPanel);
  }
}

// Return to admin panel
function returnToAdminPanel() {
  console.log("🔙 Returning to admin panel");

  // Restore admin user
  const adminUser = JSON.parse(localStorage.getItem("adminUser"));
  if (adminUser) {
    localStorage.setItem("user", JSON.stringify(adminUser));
    localStorage.removeItem("adminUser");
  }

  // Show loading message
  const indicator = document.getElementById("admin-mode-indicator");
  if (indicator) {
    indicator.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; justify-content: center; width: 100%;">
        <i class="fas fa-spinner fa-spin"></i>
        <span>חוזר לפאנל אדמין...</span>
      </div>
    `;
  }

  // Redirect to admin panel
  setTimeout(() => {
    window.location.href = "adminPanel.html";
  }, 1000);
}

// Initialize admin mode when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  initAdminMode();
});

// Also check when page becomes visible (in case of navigation)
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) {
    initAdminMode();
  }
});
