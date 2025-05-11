const ClientsDiv = document.getElementById("clients");
let allClients = [];
let allProjects = [];
let clientSummaries = [];
let projectSummaries = [];
let initialLoadComplete = false;
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

  fetchAllData();

  // ✅ חיפוש דינמי לפי שם החברה
  $("#search-client").on("input", function () {
    const term = $(this).val().toLowerCase().trim();
    if (term === "") {
      renderClients(allClients, false);
      return;
    }

    const filtered = allClients.filter((client) =>
      client.companyName?.toLowerCase().includes(term)
    );

    renderClients(filtered, false);
  });
});

function fetchAllData() {
  const userID = CurrentUser?.id;
  const urlClients = `https://localhost:7198/api/Client/GetAllClientsByUserID?userID=${userID}`;
  const urlSummaries = `https://localhost:7198/api/Client/GetClientSummariesByUserID?userID=${userID}`;
  const urlProjects = `https://localhost:7198/api/Projects/GetProjectByUserId/${userID}`;

  Promise.all([$.get(urlClients), $.get(urlSummaries), $.get(urlProjects)])
    .then(([clientsRes, summaryRes, projectsRes]) => {
      allClients = clientsRes;
      clientSummaries = summaryRes.clients;
      projectSummaries = summaryRes.projects;
      allProjects = projectsRes.slice(0, -1);

      renderClients(allClients, true);
      initialLoadComplete = true;
    })
    .catch((err) => {
      console.error("שגיאה בטעינת נתונים:", err);
    });
}

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
    if (withAnimation && !initialLoadComplete) {
      card.classList.add("wow", "bounceInUp");
    }

    card.setAttribute("data-client-id", client.clientID);
    card.style.backgroundImage = `url('${
      client.image || "./images/client-avatar.png"
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

    const editBtn = actions.querySelector(".edit-icon");
    const deleteBtn = actions.querySelector(".delete-icon");

    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditPopup(client);
    });

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openDeletePopup(client);
    });

    card.appendChild(content);
    card.appendChild(actions);
    ClientsDiv.appendChild(card);

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

  if (withAnimation && !initialLoadComplete && typeof WOW === "function") {
    new WOW().init();
  }

  const doneText = document.getElementById("doneText");
  if (doneText) {
    doneText.innerText = `יש לך ${clients.length} לקוחות`;
  }
}

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

  // ✅ הצגת התמונה הממוזערת (אם קיימת)
  if (client.image) {
    $("#client-image-thumb").attr("src", client.image).show();
  } else {
    $("#client-image-thumb").hide();
  }

  // 🧾 שליחת טופס
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
          success: function (uploadedImagePaths) {
            const uploadedImage = uploadedImagePaths[0];
            updateClient(client.clientID, uploadedImage);
          },
          error: function () {
            alert("שגיאה בהעלאת תמונת הלקוח.");
          },
        });
      } else {
        updateClient(client.clientID, client.image);
      }
    });

  // ✅ פתיחת הפופ-אפ
  $.fancybox.open({
    src: "#new-client-form",
    type: "inline",
  });
}

function updateClient(clientID, imagePath = null) {
  const updatedClient = {
    clientID: clientID,
    userID: CurrentUser?.id,
    companyName: $("#companyName").val(),
    contactPerson: $("#contactPerson").val(),
    email: $("#email").val(),
    contactPersonPhone: $("#contactPersonPhone").val(),
    officePhone: $("#officePhone").val(),
    image: imagePath,
  };

  $.ajax({
    url: "https://localhost:7198/api/Client/Update Client",
    type: "PUT",
    contentType: "application/json",
    data: JSON.stringify(updatedClient),
    success: function () {
      alert("הפרטים עודכנו בהצלחה.");
      $.fancybox.close();
      fetchAllData();
    },
    error: function () {
      alert("אירעה שגיאה בעדכון הלקוח.");
    },
  });
}

function openDeletePopup(client) {
  const popupHtml = `
    <div style="max-width: 400px; text-align: center; font-family: Assistant; padding: 20px;">
      <h3>מחיקת לקוח</h3>
      <p>האם אתה בטוח שברצונך למחוק את הלקוח <strong>"${client.companyName}"</strong>?</p>
      <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
        <button class="gradient-button" id="confirmDeleteBtn">כן, מחק</button>
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
      archiveClient(client.clientID);
      $.fancybox.close();
    });
}

function archiveClient(clientID) {
  $.ajax({
    url: `https://localhost:7198/api/Client/Delete client/${clientID}`,
    type: "PUT",
    success: function () {
      alert("הלקוח הועבר לארכיון בהצלחה.");
      fetchAllData();
    },
    error: function () {
      alert("אירעה שגיאה במחיקת הלקוח.");
    },
  });
}
