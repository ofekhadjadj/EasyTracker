const loginForm = document.querySelector(".login-form");
loginForm.addEventListener("submit", function (event) {
  event.preventDefault(); // מונע את רענון הדף
  // שליפת ערכים מהשדות
  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  // קריאה לפונקציית התחברות
  handleLogin(email, password);
});

function handleLogin(email, password) {
  console.log("Email:", email);
  console.log("Password:", password);

  const apiUrl = "https://localhost:7198/api/Users/login";

  const data = JSON.stringify({
    email: email,
    password: password,
  });

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

          // Show admin login message
          const loginButton = document.querySelector(".login-btn");
          if (loginButton) {
            loginButton.innerHTML =
              '<i class="fas fa-spinner fa-spin"></i> מתחבר כאדמין...';
            loginButton.style.background =
              "linear-gradient(135deg, #ff6b6b, #ee5a24)";
          }

          setTimeout(() => {
            window.location.href = "./adminPanel.html";
          }, 1500);
        } else {
          console.log("👤 Regular user, redirecting to projects");

          // Show regular login message
          const loginButton = document.querySelector(".login-btn");
          if (loginButton) {
            loginButton.innerHTML =
              '<i class="fas fa-spinner fa-spin"></i> מתחבר...';
          }

          setTimeout(() => {
            window.location.href = "./projects.html";
          }, 1000);
        }
      } else {
        alert("שם משתמש או סיסמה שגויים!");
      }
    },
    function (xhr, status, error) {
      console.error("שגיאת התחברות:", error);
      alert("אירעה שגיאה בשרת. נסה שוב מאוחר יותר.");
    }
  );
}
