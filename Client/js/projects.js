// projects.js - ניהול פרויקטים במערכת Easy Tracker

const CardsDiv = document.getElementById("projects");
let allProjects = [];
let CurrentUser = JSON.parse(localStorage.getItem("user"));

// פונקציה לטיפול ביצירת פרויקט חדש
function handleCreateProject() {
  const files = $("#projectImageFile")[0].files;
  if (files.length > 0) {
    const formData = new FormData();
    formData.append("files", files[0]);

    // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
    console.log("🌐 Creating upload URL...");
    const uploadUrl = apiConfig.createApiUrl("Upload");
    console.log("📡 Upload URL:", uploadUrl);

    $.ajax({
      url: uploadUrl,
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: (paths) => createProject(paths[0]),
      error: () => alert("שגיאה בהעלאת תמונה."),
    });
  } else {
    createProject("");
  }
}

function createProject(imagePath) {
  const newProj = {
    CreatedByUserID: CurrentUser.id, // <-- כאן
    ProjectName: $("#projectName").val().trim(),
    Description: $("#projectDesc").val().trim(),
    HourlyRate: Number($("#hourlyRate").val()),
    Image: imagePath || "./images/def/proj-def.jpg",
    ClientID: Number($("#clientId").val()),
    DurationGoal: Number($("#durationGoal").val()),
  };
  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating project URL...");
  const projectUrl = apiConfig.createApiUrl("Projects/addNewProject");
  console.log("🎯 Project URL:", projectUrl);

  $.ajax({
    url: projectUrl,
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(newProj),
    success: function () {
      showSuccessNotification("הפרויקט נוסף בהצלחה! 🎉");
      $.fancybox.close();
      LoadProject();
    },
    error: function (xhr, status, errorThrown) {
      console.error(
        "Add Project error:",
        status,
        errorThrown,
        xhr.responseText
      );
      alert("אירעה שגיאה ביצירת הפרויקט:\n" + xhr.responseText);
    },
  });
}

$(document).ready(function () {
  LoadProject();
  loadClients();

  const avatarImg = document.querySelector(".avatar-img");
  if (avatarImg)
    avatarImg.src = CurrentUser?.image || "./images/def/user-def.png";
  const ProfName = document.getElementById("menu-prof-name");
  ProfName.innerText = CurrentUser.firstName;

  // --- סינון פרויקטים שהושלמו ---
  let showCompleted = false;
  $(document).on("change", "#show-completed-projects", function () {
    showCompleted = this.checked;

    if (showCompleted) {
      // אם תיבת הסימון מסומנת, הצג את כל הפרויקטים
      renderProjects(allProjects.slice(0, -1));
    } else {
      // אחרת, הצג רק פרויקטים פעילים
      filterAndRenderActiveProjects();
    }
  });

  // חיפוש דינמי לפי שם פרויקט
  $(".search-input").on("input", function () {
    const searchTerm = $(this).val().trim().toLowerCase();
    let filtered = allProjects.slice(0, -1);

    // אם תיבת הסימון לא מסומנת, סנן רק פרויקטים פעילים
    if (!showCompleted) {
      filtered = filtered.filter((p) => !p.isDone && !p.IsDone);
    }

    // סנן לפי מה שהמשתמש מחפש
    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.ProjectName.toLowerCase().includes(searchTerm)
      );
    }

    renderProjects(filtered);
  });

  // ברירת מחדל: הצג רק לא מושלמים
  $("#show-completed-projects").prop("checked", false);
  // שאר הסינון יבוצע ב-successCB כשהנתונים יגיעו מהשרת

  // פתיחת טופס יצירה
  $('a[href="#new-project-form"]').on("click", function (e) {
    e.preventDefault();
    $("#project-form").removeData("projectid").removeData("image")[0].reset();
    $("#project-image-thumb").hide();
    $("#new-project-form h2").text("📝 יצירת פרויקט חדש");
    $("#project-form .btn-submit").text("📤 שמור פרויקט");
    $("#project-form")
      .off("submit")
      .on("submit", function (e) {
        e.preventDefault();
        handleCreateProject();
      });
    $.fancybox.open({ src: "#new-project-form", type: "inline" });
  });

  // הטמעת הגשת העריכה (מתוייגת על ידי data('projectid'))
  $(document).on("submit", "#project-form.editing", function (e) {
    e.preventDefault();
    const finalImg = $(this).data("image") || "";
    submitProjectEdit(finalImg);
  });
});

function LoadProject() {
  const userId = CurrentUser?.id;

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating projects URL...");
  const apiUrl = apiConfig.createApiUrl(
    `Projects/GetProjectByUserId/${userId}`
  );
  console.log("📂 Projects URL:", apiUrl);

  ajaxCall("GET", apiUrl, "", successCB, ErrorCB);
}

function successCB(response) {
  allProjects = response;

  // נפעיל את הפונקציה שמסננת רק פרויקטים שלא הושלמו
  filterAndRenderActiveProjects();

  PushInfoToProjectDone(response);
}

function ErrorCB(xhr, status, error) {
  console.error("שגיאה בטעינת הפרויקטים:", error);
}

function renderProjects(projects) {
  CardsDiv.innerHTML = "";

  if (projects.length === 0) {
    CardsDiv.innerHTML = `
      <div class="no-results-msg wow fadeIn">
        <p>לא נמצאו פרויקטים התואמים לחיפוש.</p>
      </div>`;
    return;
  }

  projects.forEach((project) => {
    const statusHtml = project.isDone
      ? '<span class="status">הושלם!</span>'
      : "";
    const card = document.createElement("div");
    card.className = "project-card wow bounceInUp";
    card.setAttribute("projectId", project.ProjectID);
    card.style.backgroundImage = `url('${
      project.Image || "./images/def/proj-def.jpg"
    }')`;

    // בדיקה אם המשתמש הוא מנהל הפרויקט או חבר צוות
    const clientDisplayElement = document.createElement("p");
    clientDisplayElement.className = "project-client-name";

    if (project.Role === "TeamMember") {
      // אם המשתמש הוא חבר צוות, נטען את שם מנהל הפרויקט
      clientDisplayElement.textContent = "טוען מנהל פרויקט...";
      loadProjectManagerForCard(project.ProjectID, clientDisplayElement);
    } else {
      // אם המשתמש הוא מנהל הפרויקט, נציג את שם הלקוח
      clientDisplayElement.textContent = project.CompanyName;
    }

    card.innerHTML = `
      <div class="project-content">
        ${statusHtml}
        <h2>${project.ProjectName}</h2>
        <p class="project-client-placeholder">${
          project.Role === "TeamMember"
            ? "טוען מנהל פרויקט..."
            : project.CompanyName
        }</p>
      </div>
      <div class="client-actions">
        <i class="fas fa-edit edit-icon" title="ערוך פרויקט"></i>
        <i class="fas fa-trash delete-icon" title="מחק פרויקט"></i>
      </div>
    `;
    CardsDiv.appendChild(card);

    // אם המשתמש הוא חבר צוות, נטען את שם מנהל הפרויקט
    if (project.Role === "TeamMember") {
      const placeholder = card.querySelector(".project-client-placeholder");
      loadProjectManagerForCard(project.ProjectID, placeholder);
    }
  });

  // פונקציה לטעינת שם מנהל הפרויקט לכרטיס פרויקט
  function loadProjectManagerForCard(projectId, element) {
    // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
    console.log("🌐 Creating team URL for project card manager...");
    const url = apiConfig.createApiUrl(
      `Projects/GetProjectTeam?ProjectID=${projectId}`
    );
    console.log("👥 Team URL for card manager:", url);

    ajaxCall(
      "GET",
      url,
      "",
      (members) => {
        // חיפוש מנהל הפרויקט מתוך רשימת חברי הצוות
        const projectManager = members.find(
          (member) => member.Role === "ProjectManager"
        );

        if (projectManager) {
          // הצגת שם מנהל הפרויקט
          element.textContent = `מנהל: ${projectManager.FullName}`;
        } else {
          // במקרה שלא נמצא מנהל פרויקט, נציג "מנהל לא זמין"
          element.textContent = "מנהל לא זמין";
        }
      },
      (err) => {
        console.error("❌ שגיאה בשליפת נתוני מנהל הפרויקט לכרטיס:", err);
        // במקרה של שגיאה, נציג הודעת שגיאה
        element.textContent = "שגיאה בטעינת מנהל";
      }
    );
  }

  // bind אירועים לעריכה ומחיקה
  $(".edit-icon")
    .off()
    .on("click", function (e) {
      e.stopPropagation();
      const projectId = $(this).closest(".project-card").attr("projectId");
      const project = allProjects.find((p) => p.ProjectID == projectId);
      openEditPopup(project);
    });

  $(".delete-icon")
    .off()
    .on("click", function (e) {
      e.stopPropagation();
      const projectId = $(this).closest(".project-card").attr("projectId");
      const project = allProjects.find((p) => p.ProjectID == projectId);
      checkSessionsBeforeDelete(project);
    });
}

function openEditPopup(project) {
  $("#projectName").val(project.ProjectName);
  $("#projectDesc").val(project.Description);
  $("#hourlyRate").val(project.HourlyRate);
  $("#clientId").val(project.ClientID);
  $("#durationGoal").val(project.DurationGoal);
  $("#new-project-form h2").text("✏️ עדכון פרויקט");
  $("#project-form .btn-submit").text("עדכן");

  const form = $("#project-form");
  form
    .data("projectid", project.ProjectID)
    .data("image", project.Image)
    .addClass("editing");
  $("#projectImageFile").val("");

  $("#project-image-thumb")
    .attr("src", project.Image || "./images/def/proj-def.jpg")
    .show();

  $.fancybox.open({ src: "#new-project-form", type: "inline" });
}

function submitProjectEdit(finalImage) {
  const updated = {
    projectid: $("#project-form").data("projectid"),
    projectname: $("#projectName").val(),
    description: $("#projectDesc").val(),
    hourlyrate: Number($("#hourlyRate").val()),
    image: finalImage,
    clientid: Number($("#clientId").val()),
    durationGoal: Number($("#durationGoal").val()),
  };

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating update project URL...");
  const updateUrl = apiConfig.createApiUrl("Projects/update_project");
  console.log("🔄 Update URL:", updateUrl);

  $.ajax({
    url: updateUrl,
    type: "PUT",
    contentType: "application/json",
    data: JSON.stringify(updated),
    success: function () {
      showSuccessNotification("הפרויקט עודכן בהצלחה! ✨");
      $.fancybox.close();
      LoadProject();
    },
    error: function () {
      alert("אירעה שגיאה בעדכון.");
    },
  });
}

function checkSessionsBeforeDelete(project) {
  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating sessions URL...");
  const url = apiConfig.createApiUrl(
    `Session/GetAllSessionsByUserAndProject?userID=${CurrentUser.id}&projectID=${project.ProjectID}`
  );
  console.log("⏱️ Sessions URL:", url);

  $.get(url)
    .done((sessions) => {
      const msg =
        sessions.length > 0
          ? `לפרויקט "${project.ProjectName}" קיימים ${sessions.length} סשנים. האם למחוק בכל זאת?`
          : `האם אתה בטוח שברצונך למחוק את הפרויקט "${project.ProjectName}"?`;
      confirmDeleteProject(msg, project.ProjectID);
    })
    .fail(() => {
      alert("שגיאה בבדיקת סשנים.");
    });
}

function confirmDeleteProject(message, projectId) {
  const popupHtml = `
    <div style="max-width: 400px; text-align: center; font-family: Assistant; padding: 20px;">
      <h3>מחיקת פרויקט</h3>
      <p>${message}</p>
      <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
        <button class="gradient-button" id="confirmDeleteBtn" style="background: linear-gradient(135deg, #d50000, #ff4e50); color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(255, 78, 80, 0.3);">כן, מחק</button>
        <button class="gradient-button" onclick="$.fancybox.close()">ביטול</button>
      </div>
    </div>
  `;

  $.fancybox.open({ src: popupHtml, type: "html", smallBtn: false });
  $(document)
    .off("click", "#confirmDeleteBtn")
    .on("click", "#confirmDeleteBtn", function () {
      deleteProject(projectId);
      $.fancybox.close();
    });
}

function deleteProject(projectId) {
  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating delete project URL...");
  const deleteUrl = apiConfig.createApiUrl(
    `Projects/delete_project?ProjectId=${projectId}`
  );
  console.log("🗑️ Delete URL:", deleteUrl);

  $.ajax({
    url: deleteUrl,
    type: "PUT",
    success: function () {
      showSuccessNotification("הפרויקט נמחק בהצלחה! 🗑️");
      LoadProject();
    },
    error: function () {
      alert("שגיאה במחיקת הפרויקט.");
    },
  });
}

function loadClients() {
  const userId = CurrentUser?.id;
  if (!userId) return;

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating clients URL...");
  const apiUrl = apiConfig.createApiUrl(
    `Client/GetAllClientsByUserID?userID=${userId}`
  );
  console.log("👥 Clients URL:", apiUrl);

  ajaxCall(
    "GET",
    apiUrl,
    null,
    populateClientDropdown,
    function (xhr, status, error) {
      console.error("שגיאה בטעינת הלקוחות:", error);
    }
  );
}

function populateClientDropdown(clients) {
  const clientDropdown = $("#clientId");
  clientDropdown.empty();
  clientDropdown.append('<option value="">בחר לקוח</option>');
  clients.forEach((client) => {
    clientDropdown.append(
      `<option value="${client.clientID}">${client.companyName}</option>`
    );
  });
  clientDropdown.append(
    '<option value="add-new-client" style="color: #0072ff; font-weight: bold;">➕ הוסף לקוח חדש</option>'
  );

  // הוספת event listener לטיפול בבחירת "הוסף לקוח חדש"
  clientDropdown.off("change.addClient").on("change.addClient", function () {
    if ($(this).val() === "add-new-client") {
      openNewClientForm();
      $(this).val(""); // איפוס הבחירה
    }
  });
}

function PushInfoToProjectDone(ProjArray) {
  const last = ProjArray[ProjArray.length - 1].Stats;
  document.getElementById(
    "doneText"
  ).innerText = `סיימת ${last.DoneCount} פרויקטים, ועוד ${last.NotDoneCount} מחכים לכישרון שלך!`;
}

CardsDiv.addEventListener("click", function (event) {
  const card = event.target.closest(".project-card");
  if (!card) return;

  const projectId = card.getAttribute("projectId");
  const selectedProject = allProjects.find((p) => p.ProjectID == projectId);

  localStorage.setItem("CurrentProject", JSON.stringify(selectedProject));
  window.location.href = "./projectPage.html";
});

// פונקציה שמסננת ומציגה רק פרויקטים פעילים (שלא הושלמו)
function filterAndRenderActiveProjects() {
  const filtered = allProjects
    .slice(0, -1)
    .filter((p) => !p.isDone && !p.IsDone);
  renderProjects(filtered);
}

// פונקציות לטיפול בהוספת לקוח חדש
function openNewClientForm() {
  // איפוס הטופס
  $("#client-form-projects")[0].reset();
  $("#client-image-thumb-projects").hide();

  // הוספת event listener לטופס
  $("#client-form-projects")
    .off("submit")
    .on("submit", handleCreateClientFromProjects);

  // פתיחת הפופ-אפ
  $.fancybox.open({
    src: "#new-client-form-projects",
    type: "inline",
    beforeClose: function () {
      // איפוס הבחירה ב-dropdown של הלקוח
      $("#clientId").val("");
    },
  });
}

function handleCreateClientFromProjects(e) {
  e.preventDefault();
  const files = $("#clientImageFile-projects")[0].files;
  if (files.length > 0) {
    const formData = new FormData();
    formData.append("files", files[0]);

    // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
    console.log("🌐 Creating client upload URL...");
    const uploadUrl = apiConfig.createApiUrl("Upload");
    console.log("📡 Client Upload URL:", uploadUrl);

    $.ajax({
      url: uploadUrl,
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: function (paths) {
        createClientFromProjects(paths[0]);
      },
      error: function () {
        alert("שגיאה בהעלאת התמונה.");
      },
    });
  } else {
    createClientFromProjects(null);
  }
}

function createClientFromProjects(imagePath) {
  const newClient = {
    userID: CurrentUser.id,
    companyName: $("#companyName-projects").val().trim(),
    contactPerson: $("#contactPerson-projects").val().trim(),
    email: $("#email-projects").val().trim(),
    contactPersonPhone: $("#contactPersonPhone-projects").val().trim(),
    officePhone: $("#officePhone-projects").val().trim(),
    image: imagePath || "./images/def/client-def.jpg",
  };

  // ✨ שימוש ב-API Config לזיהוי אוטומטי של הסביבה
  console.log("🌐 Creating add client URL...");
  const addClientUrl = apiConfig.createApiUrl("Client/Add Client");
  console.log("👥 Add Client URL:", addClientUrl);

  $.ajax({
    url: addClientUrl,
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(newClient),
    success: function (response) {
      showSuccessMessage("הלקוח נוסף בהצלחה!");
      $.fancybox.close();

      // רענון רשימת הלקוחות ובחירה אוטומטית של הלקוח החדש
      loadClients();

      // המתנה קצרה לטעינת הלקוח החדש ואז בחירה שלו
      setTimeout(() => {
        // מציאת הלקוח החדש לפי שם החברה
        const newClientName = newClient.companyName;
        $("#clientId option").each(function () {
          if ($(this).text() === newClientName) {
            $("#clientId").val($(this).val());
            return false; // יציאה מהלולאה
          }
        });
      }, 1000);
    },
    error: function (xhr, status, errorThrown) {
      console.error("Add Client error:", status, errorThrown, xhr.responseText);
      alert("אירעה שגיאה בהוספת הלקוח:\n" + xhr.responseText);
    },
  });
}

function showSuccessMessage(message) {
  // יצירת הודעת הצלחה זמנית
  const notification = $(`
    <div class="save-notification show" style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background-color: #4CAF50; color: white; padding: 15px 25px; border-radius: 8px; z-index: 10000; font-family: 'Assistant', sans-serif;">
      <i class="fas fa-check-circle" style="margin-left: 8px;"></i>
      ${message}
    </div>
  `);

  $("body").append(notification);

  // הסרת ההודעה אחרי 3 שניות
  setTimeout(() => {
    notification.fadeOut(500, function () {
      $(this).remove();
    });
  }, 3000);
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
