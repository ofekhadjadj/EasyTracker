// clients.js - קובץ JavaScript לניהול לקוחות במערכת Easy Tracker
// כולל פונקציונליות להוספה, עדכון ומחיקה של לקוחות

const ClientsDiv = document.getElementById("clients");
let allClients = [];
let allProjects = [];
let clientSummaries = [];
let projectSummaries = [];
let initialLoadComplete = false;
let CurrentUser = null;

// בעת עליית הדף
$(document).ready(function () {
  // שליפת המשתמש הנוכחי
  CurrentUser = JSON.parse(localStorage.getItem("user"));

  if (!CurrentUser || !CurrentUser.id) {
    alert("לא נמצא משתמש מחובר. אנא התחבר מחדש.");
    return;
  }

  // הגדרת תמונת משתמש ושם בתפריט הצדדי
  const avatarImg = document.querySelector(".avatar-img");
  if (avatarImg)
    avatarImg.src = CurrentUser.image || "./images/def/user-def.png";
  const ProfName = document.getElementById("menu-prof-name");
  if (ProfName) ProfName.innerText = CurrentUser.firstName;

  // הגדרת פתיחת טופס הוספת/עדכון לקוח
  $('a[href="#new-client-form"]').on("click", function () {
    // איפוס הערכים בטופס
    $("#client-form")[0].reset();
    $("#client-image-thumb").hide();
    // כותרת וכפתור שמירה לטופס חדש
    $("#new-client-form h2").text("➕ לקוח חדש");
    $("#client-form .btn-submit").text("📤 שמור לקוח");
    // טיפול בהגשת הטופס ליצירת לקוח
    $("#client-form").off("submit").on("submit", handleCreateClient);
  });

  // שליפת כל הנתונים
  fetchAllData();

  // חיפוש דינמי לפי שם החברה
  $("#search-client").on("input", function () {
    const term = $(this).val().toLowerCase().trim();
    renderClients(
      term === ""
        ? allClients
        : allClients.filter((c) => c.companyName?.toLowerCase().includes(term)),
      false
    );
  });
});

// טיפול ביצירת לקוח חדש
function handleCreateClient(e) {
  e.preventDefault();
  const files = $("#clientImageFile")[0].files;
  if (files.length > 0) {
    const formData = new FormData();
    formData.append("files", files[0]);
    $.ajax({
      url: "https://localhost:7198/api/Upload",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: function (paths) {
        createClient(paths[0]);
      },
      error: function () {
        alert("שגיאה בהעלאת התמונה.");
      },
    });
  } else {
    createClient(null);
  }
}

// קריאה להוספת לקוח חדש לשרת
function createClient(imagePath) {
  const newClient = {
    userID: CurrentUser.id,
    companyName: $("#companyName").val().trim(),
    contactPerson: $("#contactPerson").val().trim(),
    email: $("#email").val().trim(),
    contactPersonPhone: $("#contactPersonPhone").val().trim(),
    officePhone: $("#officePhone").val().trim(),
    image: imagePath || "./images/def/client-def.jpg",
  };
  $.ajax({
    url: "https://localhost:7198/api/Client/Add%20Client",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(newClient),
    success: function () {
      alert("הלקוח נוסף בהצלחה.");
      $.fancybox.close();
      fetchAllData();
    },
    error: function (xhr, status, errorThrown) {
      console.error("Add Client error:", status, errorThrown, xhr.responseText);
      alert("אירעה שגיאה בהוספת הלקוח:\n" + xhr.responseText);
    },
  });
}

// שליפת נתונים: לקוחות, תקצירים, פרויקטים
function fetchAllData() {
  const userID = CurrentUser.id;
  const urls = [
    $.get(
      `https://localhost:7198/api/Client/GetAllClientsByUserID?userID=${userID}`
    ),
    $.get(
      `https://localhost:7198/api/Client/GetClientSummariesByUserID?userID=${userID}`
    ),
    $.get(`https://localhost:7198/api/Projects/GetProjectByUserId/${userID}`),
  ];
  Promise.all(urls)
    .then(([clientsRes, summaryRes, projectsRes]) => {
      allClients = clientsRes;
      clientSummaries = summaryRes.clients;
      projectSummaries = summaryRes.projects;
      allProjects = projectsRes.slice(0, -1);
      renderClients(allClients, true);
      initialLoadComplete = true;
    })
    .catch((err) => console.error("שגיאה בטעינת נתונים:", err));
}

// יצירת קלפי לקוחות ודומיהם
function renderClients(clients, withAnimation = false) {
  ClientsDiv.innerHTML = "";
  clients.forEach((client) => {
    const summary = clientSummaries.find(
      (s) => Number(s.clientID) === Number(client.clientID)
    );
    const projectCount = summary?.projectCount || 0;
    const income = summary?.totalClientIncome || 0;
    const clientProjects = allProjects.filter(
      (p) => Number(p.ClientID) === Number(client.clientID)
    );

    const card = document.createElement("div");
    card.className = "project-card client-card";
    if (withAnimation && !initialLoadComplete && typeof WOW === "function")
      card.classList.add("wow", "bounceInUp");
    card.setAttribute("data-client-id", client.clientID);
    card.style.backgroundImage = `url('${
      client.image || "./images/def/client-def.jpg"
    }')`;

    const content = document.createElement("div");
    content.className = "project-content";
    content.innerHTML = `
      <h2>${client.companyName}</h2>
      <p>${projectCount} פרויקטים</p>
      <p>₪${income.toFixed(2)} הכנסות</p>
    `;

    const actions = document.createElement("div");
    actions.className = "client-actions";
    actions.innerHTML = `
      <i class="fas fa-edit edit-icon" title="ערוך לקוח"></i>
      <i class="fas fa-trash delete-icon" title="מחק לקוח"></i>
    `;

    actions.querySelector(".edit-icon").addEventListener("click", (e) => {
      e.stopPropagation();
      openEditPopup(client);
    });
    actions.querySelector(".delete-icon").addEventListener("click", (e) => {
      e.stopPropagation();
      openDeletePopup(client);
    });

    card.append(content, actions);
    ClientsDiv.appendChild(card);

    // מעבר לדף פרטי הלקוח
    card.addEventListener("click", () => {
      localStorage.setItem("SelectedClientID", client.clientID);
      localStorage.setItem(
        "SelectedClientProjects",
        JSON.stringify(clientProjects)
      );
      localStorage.setItem("SelectedClientName", client.companyName);
      localStorage.setItem(
        "ProjectSummaries",
        JSON.stringify(projectSummaries)
      );
      window.location.href = "clientPage.html";
    });
  });
  const doneText = document.getElementById("doneText");
  if (doneText) doneText.innerText = `יש לך ${clients.length} לקוחות`;
}

// פתיחת פופאפ עריכת לקוח
function openEditPopup(client) {
  $("#companyName").val(client.companyName);
  $("#contactPerson").val(client.contactPerson);
  $("#email").val(client.email);
  $("#contactPersonPhone").val(client.contactPersonPhone);
  $("#officePhone").val(client.officePhone);
  $("#new-client-form h2").text("✏️ עדכון פרטי לקוח");
  $("#client-form .btn-submit").text("עדכן");

  const fileInput = document.getElementById("clientImageFile");
  fileInput.value = "";
  $("#client-image-thumb")
    .attr("src", client.image || "./images/def/client-def.jpg")
    .show();

  $("#client-form")
    .off("submit")
    .on("submit", function (e) {
      e.preventDefault();
      const files = fileInput.files;
      if (files.length > 0) {
        const formData = new FormData();
        formData.append("files", files[0]);
        $.ajax({
          url: "https://localhost:7198/api/Upload",
          type: "POST",
          data: formData,
          processData: false,
          contentType: false,
          success: (paths) => updateClient(client.clientID, paths[0]),
          error: () => alert("שגיאה בהעלאת התמונה."),
        });
      } else updateClient(client.clientID, client.image);
    });

  $.fancybox.open({ src: "#new-client-form", type: "inline" });
}

// קריאה לעדכון לקוח
function updateClient(clientID, imagePath) {
  const updatedClient = {
    clientID: clientID,
    userID: CurrentUser.id,
    companyName: $("#companyName").val(),
    contactPerson: $("#contactPerson").val(),
    email: $("#email").val(),
    contactPersonPhone: $("#contactPersonPhone").val(),
    officePhone: $("#officePhone").val(),
    image: imagePath,
  };
  $.ajax({
    url: "https://localhost:7198/api/Client/Update%20Client",
    type: "PUT",
    contentType: "application/json",
    data: JSON.stringify(updatedClient),
    success: function () {
      alert("הפרטים עודכנו בהצלחה.");
      $.fancybox.close();
      fetchAllData();
    },
    error: function (xhr, status, errorThrown) {
      console.error(
        "Update Client error:",
        status,
        errorThrown,
        xhr.responseText
      );
      alert("אירעה שגיאה בעדכון הלקוח:\n" + xhr.responseText);
    },
  });
}

// פתיחת פופאפ המחיקה
function openDeletePopup(client) {
  const popupHtml = `
    <div style="max-width:400px;text-align:center;font-family:Assistant;padding:20px;">
      <h3>מחיקת לקוח</h3>
      <p>האם אתה בטוח שברצונך למחוק את הלקוח <strong>"${client.companyName}"</strong>?</p>
      <div style="margin-top:20px;display:flex;justify-content:center;gap:10px;">
        <button class="gradient-button delete-confirm-btn" id="confirmDeleteBtn" style="background: linear-gradient(135deg, #d50000, #ff4e50); color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(255, 78, 80, 0.3);">כן, מחק</button>
        <button class="gradient-button" onclick="$.fancybox.close()">ביטול</button>
      </div>
    </div>
  `;
  $.fancybox.open({ src: popupHtml, type: "html", smallBtn: false });
  $(document)
    .off("click", "#confirmDeleteBtn")
    .on("click", "#confirmDeleteBtn", function () {
      archiveClient(client.clientID);
      $.fancybox.close();
    });
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

// קריאה למחיקת לקוח (ארכיון)
function archiveClient(clientID) {
  $.ajax({
    url: `https://localhost:7198/api/Client/Delete%20Client/${clientID}`,
    type: "PUT",
    success: function () {
      showSuccessNotification("הלקוח הועבר לארכיון בהצלחה.");
      fetchAllData();
    },
    error: function (xhr, status, errorThrown) {
      console.error(
        "Delete Client error:",
        status,
        errorThrown,
        xhr.responseText
      );
      alert("אירעה שגיאה במחיקת הלקוח:\n" + xhr.responseText);
    },
  });
}
