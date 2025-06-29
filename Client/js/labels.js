const LabelsDiv = document.getElementById("labels");
let allLabels = [];
let CurrentUser = null;

$(document).ready(function () {
  CurrentUser = JSON.parse(localStorage.getItem("user"));

  if (!CurrentUser || !CurrentUser.id) {
    showErrorNotification("לא נמצא משתמש מחובר. מפנה לדף התחברות...");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
    return;
  }

  const avatarImg = document.querySelector(".avatar-img");
  if (avatarImg)
    avatarImg.src = CurrentUser.image || "./images/def/user-def.png";

  const ProfName = document.getElementById("menu-prof-name");
  if (ProfName) ProfName.innerText = CurrentUser.firstName;

  fetchAllLabels();

  $("#search-label").on("input", function () {
    const term = $(this).val().toLowerCase().trim();
    if (term === "") {
      renderLabels(allLabels);
      return;
    }
    const filtered = allLabels.filter((label) =>
      label.labelName.toLowerCase().includes(term)
    );
    renderLabels(filtered);
  });

  // טיפול בפתיחת פופ-אפ תגית חדשה
  $('a[href="#new-label-form"]').on("click", function (e) {
    // איפוס הטופס לתגית חדשה
    $("#labelName").val("");
    selectColor("#6699CC");
    $("#label-form").removeData("edit").removeData("labelid");
    $("#new-label-form h2").text("➕ תגית חדשה");
    $(".btn-submit").text("📤 שמור תגית");
    updatePreview();
  });

  // עדכון תצוגה מקדימה כשמשנים את שם התגית
  $(document).on("input", "#labelName", function () {
    updatePreview();
  });

  // טיפול בלחיצה על צבע בפלטה
  $(document).on("click", ".color-option:not(.custom-color)", function () {
    const selectedColor = $(this).data("color");
    selectColor(selectedColor);
  });

  // טיפול בלחיצה על כפתור צבע מותאם אישית
  $(document).on("click", "#custom-color-btn", function () {
    $("#custom-color-picker").click();
  });

  // טיפול בשינוי צבע מותאם אישית
  $(document).on("change", "#custom-color-picker", function () {
    const customColor = $(this).val().toUpperCase();
    selectColor(customColor);
  });

  $("#label-form").on("submit", function (e) {
    e.preventDefault();
    const labelName = $("#labelName").val();
    const labelColor = $("#labelColor").val();
    const isEdit = $("#label-form").data("edit");

    if (isEdit) {
      const labelID = $("#label-form").data("labelid");
      updateLabel(labelID, labelName, labelColor);
    } else {
      addNewLabel(labelName, labelColor);
    }
  });
});

function fetchAllLabels() {
  const url = apiConfig.createApiUrl("Label/GetAllLabelsByUserID", {
    userID: CurrentUser.id,
  });
  $.get(url)
    .done((data) => {
      allLabels = data;
      renderLabels(allLabels);
    })
    .fail(() => {
      showErrorNotification("שגיאה בטעינת תגיות");
    });
}

function renderLabels(labels) {
  LabelsDiv.innerHTML = "";
  labels.forEach((label) => {
    const card = document.createElement("div");
    card.className = "project-card label-card";
    card.style.backgroundColor = label.labelColor;

    const content = document.createElement("div");
    content.className = "project-content";
    content.innerHTML = `
      <h2>${label.labelName}</h2>
<p>${label.SessionCount || 0} שימושים</p>
    `;

    const actions = document.createElement("div");
    actions.className = "client-actions";
    actions.innerHTML = `
      <i class="fas fa-edit edit-icon" title="ערוך תגית"></i>
      <i class="fas fa-trash delete-icon" title="מחק תגית"></i>
    `;

    actions.querySelector(".edit-icon").addEventListener("click", (e) => {
      e.stopPropagation();
      openEditLabelPopup(label);
    });

    actions.querySelector(".delete-icon").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteLabel(label.labelID);
    });

    card.appendChild(content);
    card.appendChild(actions);
    LabelsDiv.appendChild(card);
  });

  const doneText = document.getElementById("doneText");
  if (doneText) doneText.innerText = `יש לך ${labels.length} תגיות`;
}

function addNewLabel(name, color) {
  const newLabel = {
    labelName: name,
    labelColor: color,
    userID: CurrentUser.id,
  };

  $.ajax({
    url: apiConfig.createApiUrl("Label/addNewLabel"),
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(newLabel),
    success: () => {
      $.fancybox.close();
      fetchAllLabels();
      showSuccessNotification("התגית נוספה בהצלחה!");
    },
    error: (xhr) => {
      if (xhr.status === 409) {
        showErrorNotification(
          `תגית בשם "${name}" כבר קיימת במערכת. אנא בחר שם אחר.`
        );
      } else {
        showErrorNotification("שגיאה בהוספת תגית. אנא נסה שוב.");
      }
    },
  });
}

function updateLabel(id, name, color) {
  const updatedLabel = {
    labelID: id,
    labelName: name,
    labelColor: color,
  };

  $.ajax({
    url: apiConfig.createApiUrl("Label/update_label"),
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify(updatedLabel),
    success: () => {
      $.fancybox.close();
      fetchAllLabels();
      showSuccessNotification("התגית עודכנה בהצלחה!");
    },
    error: (xhr) => {
      if (xhr.status === 409) {
        showErrorNotification(
          `תגית בשם "${name}" כבר קיימת במערכת. אנא בחר שם אחר.`
        );
      } else {
        showErrorNotification("שגיאה בעדכון תגית. אנא נסה שוב.");
      }
    },
  });
}

function deleteLabel(labelID) {
  Swal.fire({
    title: "מחיקת תגית",
    text: "האם אתה בטוח שברצונך למחוק את התגית?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "כן, מחק",
    cancelButtonText: "ביטול",
    confirmButtonColor: "#ff4757",
    cancelButtonColor: "#6c757d",
    reverseButtons: true,
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: apiConfig.createApiUrl("Label/delete_label", { LabelID: labelID }),
        method: "PUT",
        success: () => {
          fetchAllLabels();
          showSuccessNotification("התגית נמחקה בהצלחה!");
        },
        error: () => {
          showErrorNotification("שגיאה במחיקת תגית");
        },
      });
    }
  });
}

function openEditLabelPopup(label) {
  $("#labelName").val(label.labelName);
  selectColor(label.labelColor);
  $("#label-form").data("edit", true).data("labelid", label.labelID);
  $("#new-label-form h2").text("✏️ עדכון תגית");
  $(".btn-submit").text("עדכן תגית");
  updatePreview();

  $.fancybox.open({ src: "#new-label-form", type: "inline" });
}

// פונקציה לבחירת צבע ועדכון התצוגה
function selectColor(color) {
  // עדכון השדה הנסתר
  $("#labelColor").val(color);

  // הסרת הסימון הקודם והוספת סימון חדש
  $(".color-option").removeClass("selected");
  $(`.color-option[data-color="${color}"]`).addClass("selected");

  // עדכון התצוגה המקדימה
  updatePreview();
}

// פונקציה לעדכון תצוגה מקדימה של התגית
function updatePreview() {
  const labelName = $("#labelName").val().trim();
  const labelColor = $("#labelColor").val();

  // עדכון הטקסט
  const previewText = labelName || "תגית חדשה";
  $("#preview-text").text(previewText);

  // עדכון הצבע
  $("#label-preview").css("background-color", labelColor);

  // בחירת צבע טקסט מתאים (בהיר או כהה) בהתאם לרקע
  const textColor = getContrastTextColor(labelColor);
  $("#label-preview").css("color", textColor);
}

// פונקציה לחישוב צבע טקסט מתאים (בהיר או כהה)
function getContrastTextColor(hexColor) {
  // המרת צבע hex לRGB
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // חישוב בהירות הצבע
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // החזרת צבע טקסט מתאים
  return brightness > 128 ? "#333" : "#fff";
}

// הודעת הצלחה מעוצבת כמו בשאר האתר
function showSuccessNotification(message) {
  const notification = document.createElement("div");
  notification.className = "save-notification";
  notification.style.backgroundColor = "#4caf50";
  notification.innerHTML = `
    <div class="notification-icon">✓</div>
    <div class="notification-message">${message}</div>
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, 3000);
}

// הודעת שגיאה מעוצבת כמו בשאר האתר
function showErrorNotification(message) {
  const notification = document.createElement("div");
  notification.className = "save-notification";
  notification.style.backgroundColor = "#ff4757";
  notification.innerHTML = `
    <div class="notification-icon">✕</div>
    <div class="notification-message">${message}</div>
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, 3000);
}
