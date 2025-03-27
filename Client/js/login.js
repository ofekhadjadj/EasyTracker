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
        // מעבר לעמוד הבא
        // window.location.href = "dashboard.html";
        console.log("התחברות מוצלחת!");
        localStorage.setItem("user", JSON.stringify(response.user));
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
