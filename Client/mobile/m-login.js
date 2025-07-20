// Mobile Login JavaScript - Based on original login.js functionality

// Password toggle function
function togglePassword(inputId) {
  const passwordInput = document.getElementById(inputId);
  const toggleIcon = passwordInput.nextElementSibling;

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleIcon.className = "fa-solid fa-eye-slash password-toggle";
  } else {
    passwordInput.type = "password";
    toggleIcon.className = "fa-solid fa-eye password-toggle";
  }
}

// Show loading state
function showLoadingState() {
  const loginBtn = document.querySelector(".mobile-login-btn");
  const btnText = loginBtn.querySelector(".btn-text");
  const btnLoading = loginBtn.querySelector(".btn-loading");

  loginBtn.classList.add("loading");
  loginBtn.disabled = true;
  btnText.style.display = "none";
  btnLoading.style.display = "flex";

  // Also show overlay
  document.querySelector(".loading-overlay").style.display = "flex";
}

// Hide loading state
function hideLoadingState() {
  const loginBtn = document.querySelector(".mobile-login-btn");
  const btnText = loginBtn.querySelector(".btn-text");
  const btnLoading = loginBtn.querySelector(".btn-loading");

  loginBtn.classList.remove("loading");
  loginBtn.disabled = false;
  btnText.style.display = "inline";
  btnLoading.style.display = "none";

  // Hide overlay
  document.querySelector(".loading-overlay").style.display = "none";
}

// Show success notification
function showSuccessNotification(message) {
  // Remove any existing notifications
  const existingNotification = document.querySelector(".success-notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.className = "success-notification";
  notification.innerHTML = `
    <i class="fas fa-check-circle" style="margin-left: 8px;"></i>
    ${message}
  `;

  document.body.appendChild(notification);

  // Auto-remove after message duration
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 4000);
}

// Show error notification
function showErrorNotification(message) {
  // Remove any existing error messages
  const existingError = document.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

  // Create new error message
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;

  // Add after the form
  const form = document.querySelector(".mobile-login-form");
  form.parentNode.insertBefore(errorDiv, form.nextSibling);

  // Style the error message
  errorDiv.style.background = "#fff5f5";
  errorDiv.style.color = "#dc3545";
  errorDiv.style.padding = "12px";
  errorDiv.style.borderRadius = "8px";
  errorDiv.style.marginTop = "15px";
  errorDiv.style.border = "1px solid #dc3545";
  errorDiv.style.textAlign = "center";

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.remove();
    }
  }, 5000);
}

// Main login handler
function handleLogin(email, password) {
  console.log("Mobile Login - Email:", email);
  console.log("Mobile Login - Password:", password);

  const apiUrl = apiConfig.createApiUrl("Users/login");

  const data = JSON.stringify({
    email: email,
    password: password,
  });

  showLoadingState();

  ajaxCall(
    "POST",
    apiUrl,
    data,
    function (response) {
      console.log("התחברות הצליחה:", response);

      if (response.success == true) {
        console.log("התחברות מוצלחת!");
        localStorage.setItem("user", JSON.stringify(response.user));

        // Check if user is admin
        const user = response.user;
        console.log("User role:", user.role);
        console.log("User email:", user.email);

        // Check if this is an admin user - specific email check
        const isAdmin = user.email === "admin@easytracker.com";

        if (isAdmin) {
          console.log("🔧 Admin user detected, redirecting to admin panel");

          hideLoadingState();

          // Direct redirect to admin panel
          window.location.href = "../adminPanel.html";
        } else {
          console.log("👤 Regular user, redirecting to mobile projects");

          hideLoadingState();

          // Immediate redirect - no delay or notification that might confuse users
          window.location.href = "./m-projects.html";
        }
      } else {
        hideLoadingState();
        showErrorNotification("שם משתמש או סיסמה שגויים!");
      }
    },
    function (xhr, status, error) {
      console.error("שגיאת התחברות:", error);
      hideLoadingState();
      showErrorNotification("אירעה שגיאה בשרת. נסה שוב מאוחר יותר.");
    }
  );
}

// Validate form inputs
function validateInputs(email, password) {
  let isValid = true;

  // Remove existing error states
  document.querySelectorAll(".input-group").forEach((group) => {
    group.classList.remove("error");
  });

  // Email validation
  const emailGroup = document
    .querySelector("#mobile-email")
    .closest(".input-group");
  if (!email || !email.includes("@")) {
    emailGroup.classList.add("error");
    isValid = false;
  }

  // Password validation
  const passwordGroup = document
    .querySelector("#mobile-password")
    .closest(".input-group");
  if (!password || password.length < 8) {
    passwordGroup.classList.add("error");
    isValid = false;
  }

  return isValid;
}

// Initialize mobile login functionality
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.querySelector(".mobile-login-form");

  // Handle form submission
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault(); // מונע את רענון הדף

    // Get form values
    const email = document.getElementById("mobile-email").value.trim();
    const password = document.getElementById("mobile-password").value.trim();

    // Validate inputs
    if (!validateInputs(email, password)) {
      showErrorNotification("יש למלא את כל השדות בצורה תקינה");
      return;
    }

    // Call login handler
    handleLogin(email, password);
  });

  // Add touch feedback for buttons
  const buttons = document.querySelectorAll(".mobile-login-btn");
  buttons.forEach((button) => {
    button.addEventListener("touchstart", function () {
      this.style.transform = "scale(0.98)";
    });

    button.addEventListener("touchend", function () {
      setTimeout(() => {
        this.style.transform = "";
      }, 100);
    });
  });

  // Prevent form submission on Enter in password field (mobile keyboards)
  document
    .getElementById("mobile-password")
    .addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        loginForm.dispatchEvent(new Event("submit"));
      }
    });

  // Auto-focus email field after a short delay (better UX on mobile)
  setTimeout(() => {
    document.getElementById("mobile-email").focus();
  }, 500);

  // Handle loading overlay click (close on click outside)
  document
    .querySelector(".loading-overlay")
    .addEventListener("click", function (e) {
      if (e.target === this) {
        // Don't allow closing during actual login process
        // This is just for better UX
      }
    });

  console.log("Mobile login page initialized successfully");
});

// Handle viewport changes and orientation
window.addEventListener("orientationchange", function () {
  // Reload page after orientation change for better layout
  setTimeout(() => {
    window.location.reload();
  }, 500);
});

// Handle back button - prevent accidental navigation during login
window.addEventListener("beforeunload", function (e) {
  const isLoading = document
    .querySelector(".mobile-login-btn")
    .classList.contains("loading");
  if (isLoading) {
    e.preventDefault();
    e.returnValue = "";
    return "בתהליך התחברות...";
  }
});

// Error handling for network issues
window.addEventListener("online", function () {
  showSuccessNotification("חיבור לאינטרנט חזר");
});

window.addEventListener("offline", function () {
  showErrorNotification("אין חיבור לאינטרנט");
});

// Accessibility improvements
document.addEventListener("keydown", function (e) {
  // Allow tab navigation
  if (e.key === "Tab") {
    return;
  }

  // Handle Enter key globally
  if (e.key === "Enter" && document.activeElement.tagName !== "BUTTON") {
    const submitBtn = document.querySelector(".mobile-login-btn");
    if (!submitBtn.disabled) {
      submitBtn.click();
    }
  }
});
