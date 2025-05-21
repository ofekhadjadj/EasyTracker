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
      $("#user-image-thumb").hide();
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
          alert("❌ שגיאה בהעלאת תמונה.");
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
      image: imagePath,
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
        if (avatarImg) avatarImg.src = currentUser.image;

        alert("✅ הפרטים עודכנו בהצלחה");
        $.fancybox.close();
      },
      error: function () {
        alert("❌ שגיאה בעדכון הפרטים. ודא שהסיסמה נכונה.");
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
        alert("✅ הסיסמה עודכנה בהצלחה.");
        $.fancybox.close();
      },
      error: function () {
        alert("❌ שגיאה בשינוי הסיסמה. ודא שהסיסמה הישנה נכונה.");
      },
    });
  });
});

// תצוגה מוגדלת של התמונה בריחוף
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
        style="max-width: 80000px; max-height: 80000px; border-radius: 12px;" />
    `;
    document.body.appendChild(popup);
  }

  const popup = document.getElementById("avatar-preview-popup");
  const overlay = document.getElementById("avatar-overlay");
  const previewImg = document.getElementById("avatar-preview-img");

  let isPopupVisible = false;

  function showPopup() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.image) {
      previewImg.src = user.image;
      $(overlay).fadeIn(150);
      $(popup).fadeIn(150);
      isPopupVisible = true;
    }
  }

  function hidePopup() {
    $(popup).fadeOut(150);
    $(overlay).fadeOut(150);
    isPopupVisible = false;
  }

  avatarImg.addEventListener("mouseenter", showPopup);

  document.addEventListener("mousemove", function (e) {
    if (!isPopupVisible) return;

    const x = e.clientX;
    const y = e.clientY;

    const imgRect = avatarImg.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();

    const insideAvatar =
      x >= imgRect.left &&
      x <= imgRect.right &&
      y >= imgRect.top &&
      y <= imgRect.bottom;

    const insidePopup =
      x >= popupRect.left &&
      x <= popupRect.right &&
      y >= popupRect.top &&
      y <= popupRect.bottom;

    if (!insideAvatar && !insidePopup) {
      hidePopup();
    }
  });

  // לחיצה על הרקע תסגור מיד
  overlay.addEventListener("click", hidePopup);
});
