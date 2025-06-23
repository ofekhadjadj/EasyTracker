// redirect.js - Automatic mobile detection and redirection
function isMobileDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Check for mobile keywords in user agent
  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;

  // Also check screen width as additional indicator
  const screenWidth = window.screen.width;
  const isMobileScreen = screenWidth <= 768;

  return mobileRegex.test(userAgent) || isMobileScreen;
}

function redirectToAppropriateLogin() {
  // Don't redirect if we're already on a mobile page or desktop page
  const currentPath = window.location.pathname;

  // If already on mobile pages, don't redirect
  if (currentPath.includes("/mobile/")) {
    return;
  }

  // If already on login pages, handle appropriately
  if (
    currentPath.includes("login.html") ||
    currentPath.endsWith("/") ||
    currentPath.endsWith("index.html")
  ) {
    if (isMobileDevice()) {
      // Redirect to mobile login
      window.location.href = "./mobile/m-login.html";
    }
    // If desktop, stay on current page (login.html or index.html)
    return;
  }

  // For other pages, redirect mobile users to mobile login
  if (isMobileDevice()) {
    window.location.href = "./mobile/m-login.html";
  }
}

// Run redirection when DOM is loaded
document.addEventListener("DOMContentLoaded", redirectToAppropriateLogin);

// Also run immediately in case DOMContentLoaded already fired
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", redirectToAppropriateLogin);
} else {
  redirectToAppropriateLogin();
}
