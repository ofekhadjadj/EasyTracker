const LabelsDiv = document.getElementById("labels");
let allLabels = [];
let CurrentUser = null;

$(document).ready(function () {
  CurrentUser = JSON.parse(localStorage.getItem("user"));

  if (!CurrentUser || !CurrentUser.id) {
    alert("לא נמצא משתמש מחובר. אנא התחבר מחדש.");
    return;
  }

  const avatarImg = document.querySelector(".avatar-img");
  if (CurrentUser.image && avatarImg) avatarImg.src = CurrentUser.image;

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
  const url = `https://localhost:7198/api/Label/GetAllLabelsByUserID?userID=${CurrentUser.id}`;
  $.get(url)
    .done((data) => {
      allLabels = data;
      renderLabels(allLabels);
    })
    .fail(() => alert("שגיאה בטעינת תגיות."));
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
    url: "https://localhost:7198/api/Label/addNewLabel",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(newLabel),
    success: () => {
      $.fancybox.close();
      fetchAllLabels();
    },
    error: () => alert("שגיאה בהוספת תגית."),
  });
}

function updateLabel(id, name, color) {
  const updatedLabel = {
    labelID: id,
    labelName: name,
    labelColor: color,
  };

  $.ajax({
    url: "https://localhost:7198/api/Label/update_label",
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify(updatedLabel),
    success: () => {
      $.fancybox.close();
      fetchAllLabels();
    },
    error: () => alert("שגיאה בעדכון תגית."),
  });
}

function deleteLabel(labelID) {
  const popupHtml = `
    <div style="max-width: 400px; text-align: center; font-family: Assistant; padding: 20px;">
      <h3>מחיקת תגית</h3>
      <p>האם אתה בטוח שברצונך למחוק את התגית?</p>
      <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
        <button class="gradient-button delete-button" id="confirmDeleteBtn" style="background: linear-gradient(135deg, #ff4757, #ff3838); color: white; border: none;">כן, מחק</button>
        <button class="gradient-button" onclick="$.fancybox.close()">ביטול</button>
      </div>
    </div>
  `;

  $.fancybox.open({
    src: popupHtml,
    type: "html",
    smallBtn: false,
  });

  $(document)
    .off("click", "#confirmDeleteBtn")
    .on("click", "#confirmDeleteBtn", function () {
      $.ajax({
        url: `https://localhost:7198/api/Label/delete_label?LabelID=${labelID}`,
        method: "PUT",
        success: () => {
          $.fancybox.close();
          showSuccessNotification("התגית נמחקה בהצלחה!");
          fetchAllLabels();
        },
        error: () => alert("שגיאה במחיקת תגית."),
      });
    });
}

function openEditLabelPopup(label) {
  $("#labelName").val(label.labelName);
  $("#labelColor").val(label.labelColor);
  $("#label-form").data("edit", true).data("labelid", label.labelID);
  $("#new-label-form h2").text("✏️ עדכון תגית");
  $(".btn-submit").text("עדכן תגית");

  $.fancybox.open({ src: "#new-label-form", type: "inline" });
}

// הודעת הצלחה מעוצבת
function showSuccessNotification(message) {
  const notification = document.createElement("div");
  notification.className = "save-notification";
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
      if (notification.parentNode) document.body.removeChild(notification);
    }, 500);
  }, 3000);
}
