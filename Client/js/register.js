const registerForm = document.querySelector(".register-form");

registerForm.addEventListener("submit", function (event) {
  event.preventDefault(); // מונע את רענון הדף

  // שליפת ערכים מהשדות
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  // קריאה לפונקציית התחברות
  handleRegister(firstName, lastName, email, password);
});

function handleRegister(firstName, lastName, email, password) {
  console.log("FirstName: ", firstName);
  console.log("LastName: ", lastName);
  console.log("Email: ", email);
  console.log("Password: ", password);

  const apiUrl = "https://localhost:7198/api/Users/addNewUser";

  const data = JSON.stringify({
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password,
  });

  ajaxCall(
    "POST",
    apiUrl,
    data,
    function (response) {
      console.log("התחברות הצליחה:", response);

      if (response === 7) {
        console.log("הרשמה הצליחה!");
        window.location.href = "login.html";
      } else {
        alert("הרשמה נכשלה. ייתכן שהמשתמש כבר קיים.");
      }
    },
    function (xhr, status, error) {
      console.error("שגיאת התחברות:", error);
      alert("אירעה שגיאה בשרת. נסה שוב מאוחר יותר.");
    }
  );
}
