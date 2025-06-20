$(document).ready(function () {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  if (!currentUser) return;

  // Add dropdown toggle functionality
  $(".profile-arrow").on("click", function (e) {
    e.stopPropagation();
    $(this).toggleClass("active");
    $("#user-dropdown-menu").fadeToggle(200);
  });

  // Close dropdown when clicking anywhere else
  $(document).on("click", function (e) {
    if (
      !$(e.target).closest("#user-dropdown-menu").length &&
      !$(e.target).is(".profile-arrow")
    ) {
      $(".profile-arrow").removeClass("active");
      $("#user-dropdown-menu").fadeOut(200);
    }
  });

  // Handle edit profile button click
  $("#edit-profile-btn").on("click", function () {
    $("#user-dropdown-menu").fadeOut(200);
    $(".profile-arrow").removeClass("active");

    $("#user-firstname").val(currentUser.firstName);
    $("#user-lastname").val(currentUser.lastName);
    $("#user-email").val(currentUser.email);
    $("#user-current-password").val("");
    $("#userImageFile").val("");
    $("#old-password").val("");
    $("#new-password").val("");

    if (currentUser.image) {
      $("#user-image-thumb").attr("src", currentUser.image).show();
    } else {
      $("#user-image-thumb").attr("src", "./images/def/user-def.png").show();
    }

    $.fancybox.open({ src: "#edit-user-form", type: "inline" });
  });

  // Handle logout button click
  $("#logout-btn").on("click", function () {
    // Clear user data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("CurrentProject");

    // Redirect to login page
    window.location.href = "login.html";
  });

  // מעבר לפופאפ סיסמה
  $("#open-password-popup").on("click", function () {
    $.fancybox.close();
    setTimeout(() => {
      $.fancybox.open({ src: "#change-password-form", type: "inline" });
    }, 300);
  });

  // שליחת טופס פרטים
  $("#user-details-form").on("submit", function (e) {
    e.preventDefault();

    const fileInput = $("#userImageFile")[0];
    const password = $("#user-current-password").val();

    if (fileInput.files.length > 0) {
      const formData = new FormData();
      formData.append("files", fileInput.files[0]);

      $.ajax({
        url: "https://localhost:7198/api/Upload",
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: function (uploadedPaths) {
          const newImagePath = uploadedPaths[0];
          updateUserDetails(newImagePath, password);
        },
        error: function () {
          showCustomAlert("שגיאה בהעלאת תמונה", "error", false);
        },
      });
    } else {
      updateUserDetails(currentUser.image, password);
    }
  });

  function updateUserDetails(imagePath, password) {
    const data = {
      id: currentUser.id,
      firstName: $("#user-firstname").val(),
      lastName: $("#user-lastname").val(),
      email: $("#user-email").val(),
      password: password,
      image: imagePath || "./images/def/user-def.png",
    };

    $.ajax({
      url: "https://localhost:7198/api/Users/change-details",
      type: "PUT",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: function () {
        currentUser.firstName = data.firstName;
        currentUser.lastName = data.lastName;
        currentUser.email = data.email;
        currentUser.image = imagePath;
        localStorage.setItem("user", JSON.stringify(currentUser));

        $("#menu-prof-name").text(currentUser.firstName);
        const avatarImg = document.querySelector(".avatar-img");
        if (avatarImg)
          avatarImg.src = currentUser.image || "./images/def/user-def.png";

        showCustomAlert("הפרטים עודכנו בהצלחה", "success");
      },
      error: function () {
        showCustomAlert(
          "שגיאה בעדכון הפרטים. ודא שהסיסמה נכונה",
          "error",
          false
        );
      },
    });
  }

  // שליחת טופס שינוי סיסמה
  $("#user-password-form").on("submit", function (e) {
    e.preventDefault();

    const data = {
      id: currentUser.id,
      oldPassword: $("#old-password").val(),
      newPassword: $("#new-password").val(),
    };

    $.ajax({
      url: "https://localhost:7198/api/Users/change-password",
      type: "PUT",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: function () {
        showCustomAlert("הסיסמה עודכנה בהצלחה", "success");
      },
      error: function () {
        showCustomAlert(
          "שגיאה בשינוי הסיסמה. ודא שהסיסמה הישנה נכונה",
          "error",
          false
        );
      },
    });
  });
});

// תצוגה מוגדלת של התמונה בלחיצה
$(document).ready(function () {
  const avatarImg = document.querySelector(".avatar-img");
  if (!avatarImg) return;

  // צור את הפופאפ והרקע אם לא קיימים
  if (!document.getElementById("avatar-preview-popup")) {
    const overlay = document.createElement("div");
    overlay.id = "avatar-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: "9998",
      display: "none",
    });
    document.body.appendChild(overlay);

    const popup = document.createElement("div");
    popup.id = "avatar-preview-popup";
    Object.assign(popup.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: "9999",
      backgroundColor: "#fff",
      padding: "12px",
      borderRadius: "12px",
      boxShadow: "0 0 25px rgba(0,0,0,0.3)",
      display: "none",
    });
    popup.innerHTML = `
      <img id="avatar-preview-img" src="" alt="תמונה מוגדלת"
        style="max-width: 300px; max-height: 300px; border-radius: 12px;" />
    `;
    document.body.appendChild(popup);
  }

  const popup = document.getElementById("avatar-preview-popup");
  const overlay = document.getElementById("avatar-overlay");
  const previewImg = document.getElementById("avatar-preview-img");

  function showPopup() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.image) {
      previewImg.src = user.image;
      $(overlay).fadeIn(150);
      $(popup).fadeIn(150);
    }
  }

  function hidePopup() {
    $(popup).fadeOut(150);
    $(overlay).fadeOut(150);
  }

  // שינוי מריחוף ללחיצה
  avatarImg.addEventListener("click", function (e) {
    e.stopPropagation();
    showPopup();
  });

  // לחיצה על הרקע או בכל מקום אחר תסגור את התמונה המוגדלת
  overlay.addEventListener("click", hidePopup);
  document.addEventListener("click", function (e) {
    if (e.target !== avatarImg && $(popup).is(":visible")) {
      hidePopup();
    }
  });
});

// Function to show custom styled alerts
function showCustomAlert(message, type = "success", closePopup = true) {
  // Only close fancybox popups if closePopup is true
  if (closePopup && $.fancybox.getInstance()) {
    $.fancybox.close();

    // Small delay to ensure fancybox is closed before showing alert
    setTimeout(() => {
      displayAlert();
    }, 300);
  } else {
    displayAlert();
  }

  function displayAlert() {
    // Remove any existing alerts
    const existingAlerts = document.querySelectorAll(".custom-alert");
    existingAlerts.forEach((alert) => {
      if (alert.parentNode) {
        document.body.removeChild(alert);
      }
    });

    // Create alert container
    const alertContainer = document.createElement("div");
    alertContainer.className = `custom-alert ${type}`;

    // Create icon based on type
    const icon = document.createElement("div");
    icon.className = "alert-icon";

    if (type === "success") {
      icon.innerHTML = `
        <svg viewBox="0 0 52 52" width="50" height="50">
          <circle cx="26" cy="26" r="25" fill="none" stroke="#4CAF50" stroke-width="2"></circle>
          <path fill="none" stroke="#4CAF50" stroke-width="3" d="M14.1 27.2l7.1 7.2 16.7-16.8"></path>
        </svg>
      `;
    } else {
      icon.innerHTML = `
        <svg viewBox="0 0 52 52" width="50" height="50">
          <circle cx="26" cy="26" r="25" fill="none" stroke="#F44336" stroke-width="2"></circle>
          <line x1="18" y1="18" x2="34" y2="34" stroke="#F44336" stroke-width="3"></line>
          <line x1="34" y1="18" x2="18" y2="34" stroke="#F44336" stroke-width="3"></line>
        </svg>
      `;
    }

    // Create content
    const content = document.createElement("div");
    content.className = "alert-content";

    const title = document.createElement("h3");
    title.className = "alert-title";
    title.textContent = type === "success" ? "הצלחה!" : "שגיאה!";

    const text = document.createElement("p");
    text.className = "alert-text";
    text.textContent = message;

    content.appendChild(title);
    content.appendChild(text);

    // Create close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "alert-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", () => {
      alertContainer.classList.add("closing");
      setTimeout(() => {
        if (alertContainer.parentNode) {
          document.body.removeChild(alertContainer);
        }
      }, 300);
    });

    // Assemble the alert
    alertContainer.appendChild(icon);
    alertContainer.appendChild(content);
    alertContainer.appendChild(closeBtn);

    // Add to document
    document.body.appendChild(alertContainer);

    // Animate in
    setTimeout(() => {
      alertContainer.classList.add("show");
    }, 10);

    // Auto close after 4 seconds
    setTimeout(() => {
      alertContainer.classList.add("closing");
      setTimeout(() => {
        if (alertContainer.parentNode) {
          document.body.removeChild(alertContainer);
        }
      }, 300);
    }, 4000);
  }
}
