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
    $.ajax({
      url: "https://localhost:7198/api/Upload",
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
    Image: imagePath,
    ClientID: Number($("#clientId").val()),
    DurationGoal: Number($("#durationGoal").val()),
  };
  $.ajax({
    url: "https://localhost:7198/api/Projects/addNewProject",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(newProj),
    success: function () {
      alert("הפרויקט נוסף בהצלחה.");
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
  if (CurrentUser?.image && avatarImg) avatarImg.src = CurrentUser.image;
  const ProfName = document.getElementById("menu-prof-name");
  ProfName.innerText = CurrentUser.firstName;

  // --- סינון פרויקטים שהושלמו ---
  let showCompleted = false;
  $(document).on("change", "#show-completed-projects", function () {
    showCompleted = this.checked;
    applyProjectFilters();
  });

  // חיפוש דינמי לפי שם פרויקט
  $(".search-input").on("input", function () {
    applyProjectFilters();
  });

  function applyProjectFilters() {
    const searchTerm = $(".search-input").val()?.trim().toLowerCase() || "";
    let filtered = allProjects.slice(0, -1);
    if (!showCompleted) {
      filtered = filtered.filter((p) => !p.isDone && !p.IsDone);
    }
    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.ProjectName.toLowerCase().includes(searchTerm)
      );
    }
    renderProjects(filtered);
  }

  // ברירת מחדל: הצג רק לא מושלמים
  setTimeout(() => {
    $("#show-completed-projects").prop("checked", false);
    showCompleted = false;
    applyProjectFilters();
  }, 0);

  // פתיחת טופס יצירה
  $('a[href="#new-project-form"]').on("click", function () {
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
  const apiUrl = `https://localhost:7198/api/Projects/GetProjectByUserId/${userId}`;
  ajaxCall("GET", apiUrl, "", successCB, ErrorCB);
}

function successCB(response) {
  allProjects = response;
  // במקום renderProjects(response.slice(0, -1));
  // נפעיל את applyProjectFilters כדי שהסינון יתבצע תמיד
  if (typeof applyProjectFilters === "function") {
    applyProjectFilters();
  } else {
    renderProjects(response.slice(0, -1));
  }
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
    card.style.backgroundImage = `url('${project.Image}')`;
    card.innerHTML = `
      <div class="project-content">
        ${statusHtml}
        <h2>${project.ProjectName}</h2>
        <p>${project.CompanyName}</p>
      </div>
      <div class="client-actions">
        <i class="fas fa-edit edit-icon" title="ערוך פרויקט"></i>
        <i class="fas fa-trash delete-icon" title="מחק פרויקט"></i>
      </div>
    `;
    CardsDiv.appendChild(card);
  });

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

  if (project.Image) {
    $("#project-image-thumb").attr("src", project.Image).show();
  } else {
    $("#project-image-thumb").hide();
  }

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

  $.ajax({
    url: "https://localhost:7198/api/Projects/update_project",
    type: "PUT",
    contentType: "application/json",
    data: JSON.stringify(updated),
    success: function () {
      alert("הפרויקט עודכן בהצלחה.");
      $.fancybox.close();
      LoadProject();
    },
    error: function () {
      alert("אירעה שגיאה בעדכון.");
    },
  });
}

function checkSessionsBeforeDelete(project) {
  const url = `https://localhost:7198/api/Session/GetAllSessionsByUserAndProject?userID=${CurrentUser.id}&projectID=${project.ProjectID}`;
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
        <button class="gradient-button" id="confirmDeleteBtn">כן, מחק</button>
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
  $.ajax({
    url: `https://localhost:7198/api/Projects/delete_project?ProjectId=${projectId}`,
    type: "PUT",
    success: function () {
      alert("הפרויקט נמחק.");
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
  const apiUrl = `https://localhost:7198/api/Client/GetAllClientsByUserID?userID=${userId}`;
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
