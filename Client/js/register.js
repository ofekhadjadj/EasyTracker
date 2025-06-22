const registerForm = document.querySelector(".register-form");

// פונקציה להצגה/הסתרה של סיסמה
function togglePassword(inputId) {
  const passwordInput = document.getElementById(inputId);
  const toggleIcon = passwordInput.nextElementSibling;

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleIcon.textContent = "🙈";
  } else {
    passwordInput.type = "password";
    toggleIcon.textContent = "👁️";
  }
}

// הוספת event listener לתצוגה מקדימה של תמונה
document.addEventListener("DOMContentLoaded", function () {
  const imageInput = document.getElementById("userImageFile-register");
  const imagePreview = document.getElementById("user-image-thumb-register");

  if (imageInput && imagePreview) {
    imageInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          imagePreview.src = e.target.result;
          imagePreview.style.display = "block";
          imagePreview.classList.add("image-preview-circle");

          // עדכון הטקסט בתיבת הקובץ
          updateFileInputText(file.name);
        };
        reader.readAsDataURL(file);
      } else {
        imagePreview.style.display = "none";
        updateFileInputText("לחץ לבחירת תמונה (אופציונלי)");
      }
    });
  }
});

function updateFileInputText(text) {
  const style = document.createElement("style");
  style.textContent = `
    #userImageFile-register::before {
      content: '${text}' !important;
    }
  `;

  // הסרת style קודם אם קיים
  const existingStyle = document.getElementById("file-input-style");
  if (existingStyle) {
    existingStyle.remove();
  }

  style.id = "file-input-style";
  document.head.appendChild(style);
}

registerForm.addEventListener("submit", function (event) {
  event.preventDefault(); // מונע את רענון הדף

  // שליפת ערכים מהשדות
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  // בדיקה אם יש תמונה
  const imageFile = document.getElementById("userImageFile-register").files[0];

  if (imageFile) {
    // העלאת תמונה תחילה
    const formData = new FormData();
    formData.append("files", imageFile);

    $.ajax({
      url: "https://localhost:7198/api/Upload",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: function (paths) {
        // אחרי העלאת התמונה בהצלחה, יצירת המשתמש עם התמונה
        handleRegister(firstName, lastName, email, password, paths[0]);
      },
      error: function () {
        alert("שגיאה בהעלאת התמונה. נסה שוב.");
      },
    });
  } else {
    // אם אין תמונה, יצירת משתמש עם תמונת ברירת מחדל
    handleRegister(
      firstName,
      lastName,
      email,
      password,
      "./images/def/user-def.png"
    );
  }
});

function handleRegister(
  firstName,
  lastName,
  email,
  password,
  imagePath = "./images/def/user-def.png"
) {
  console.log("FirstName: ", firstName);
  console.log("LastName: ", lastName);
  console.log("Email: ", email);
  console.log("Password: ", password);
  console.log("Image: ", imagePath);

  const apiUrl = "https://localhost:7198/api/Users/addNewUser";

  const data = JSON.stringify({
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password,
    image: imagePath,
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
