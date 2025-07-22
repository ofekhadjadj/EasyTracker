const registerForm = document.querySelector(".register-form");

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

// פונקציה להצגה/הסתרה של סיסמה
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
    // Show loading notification for image upload
    showNotification("מעלה תמונה...", "success");

    // העלאת תמונה תחילה
    const formData = new FormData();
    formData.append("files", imageFile);

    $.ajax({
      url: apiConfig.createApiUrl("Upload"),
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: function (paths) {
        // אחרי העלאת התמונה בהצלחה, יצירת המשתמש עם התמונה
        handleRegister(firstName, lastName, email, password, paths[0]);
      },
      error: function (xhr, status, error) {
        console.error("שגיאה בהעלאת התמונה:", error);
        console.error("Status:", status);
        console.error("Response:", xhr.responseText);

        let errorMessage = "שגיאה בהעלאת התמונה. נסה שוב.";

        if (xhr.status === 0) {
          errorMessage = "לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט.";
        } else if (xhr.status === 413) {
          errorMessage = "התמונה גדולה מדי. נסה עם תמונה קטנה יותר.";
        } else if (xhr.status === 415) {
          errorMessage = "סוג הקובץ לא נתמך. השתמש בתמונות JPG, PNG או GIF.";
        }

        showNotification(errorMessage, "error");
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

  // Show loading notification
  showNotification("נרשם...", "success");

  const apiUrl = apiConfig.createApiUrl("Users/addNewUser");

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
        showNotification("הרשמה הצליחה! מעביר לעמוד ההתחברות...", "success");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
      } else if (response === 1) {
        showNotification(
          "המשתמש כבר קיים במערכת. נסה עם כתובת אימייל אחרת.",
          "error"
        );
      } else {
        showNotification(
          "הרשמה נכשלה. ייתכן שהמשתמש כבר קיים או שחסרים פרטים.",
          "error"
        );
      }
    },
    function (xhr, status, error) {
      console.error("שגיאת רשמה:", error);
      console.error("Status:", status);
      console.error("Response:", xhr.responseText);

      let errorMessage = "אירעה שגיאה בשרת. נסה שוב מאוחר יותר.";

      if (xhr.status === 0) {
        errorMessage = "לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט.";
      } else if (xhr.status === 400) {
        errorMessage = "נתונים לא תקינים. אנא בדוק את הפרטים שהזנת.";
      } else if (xhr.status === 409) {
        errorMessage = "המשתמש כבר קיים במערכת. נסה עם כתובת אימייל אחרת.";
      } else if (xhr.status === 500) {
        errorMessage = "שגיאת שרת פנימית. נסה שוב מאוחר יותר.";
      }

      showNotification(errorMessage, "error");
    }
  );
}
