const CardsDiv = document.getElementById("projects");
const CurrentUser = JSON.parse(localStorage.getItem("user")) || {};
const SelectedClientID = localStorage.getItem("SelectedClientID");
let SelectedClientProjects =
  JSON.parse(localStorage.getItem("SelectedClientProjects")) || [];
const ProjectSummaries =
  JSON.parse(localStorage.getItem("ProjectSummaries")) || [];

$(document).ready(() => {
  const avatarImg = document.querySelector(".avatar-img");
  if (avatarImg)
    avatarImg.src = CurrentUser?.image || "./images/def/user-def.png";

  const profName = document.getElementById("menu-prof-name");
  if (profName) profName.innerText = CurrentUser.firstName;

  renderBreadcrumbAndTitle();
  renderClientSummary();
  renderProjects(SelectedClientProjects, true);

  $("#search-client").on("input", function () {
    const term = $(this).val().toLowerCase().trim();
    const filtered = SelectedClientProjects.filter((p) =>
      p.ProjectName.toLowerCase().includes(term)
    );
    renderProjects(filtered, false);
  });

  $("#project-form")
    .off("submit")
    .on("submit", function (e) {
      e.preventDefault();
      const fileInput = $("#projectImageFile")[0];
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
          success: function (paths) {
            const uploadedImage = paths[0];
            submitProjectEdit(uploadedImage);
          },
          error: function () {
            alert("שגיאה בהעלאת תמונה.");
          },
        });
      } else {
        const currentImg = $("#project-form").data("image") || "";
        submitProjectEdit(currentImg);
      }
    });
});

function renderBreadcrumbAndTitle() {
  const titleEl = document.getElementById("client-title");
  const breadcrumbEl = document.getElementById("breadcrumb-client");

  if (!SelectedClientProjects.length) {
    titleEl.innerText = "לא נמצאו פרויקטים";
    return;
  }

  const clientName = SelectedClientProjects[0].CompanyName?.trim() || "לקוח";
  titleEl.innerText = `הפרויקטים של ${clientName}`;
  breadcrumbEl.innerHTML = `<a href="clients.html">לקוחות</a> &gt; <span>${clientName}</span>`;
}

function renderClientSummary() {
  const count = SelectedClientProjects.length;
  const totalIncome = SelectedClientProjects.reduce((sum, p) => {
    const match = ProjectSummaries.find((s) => s.projectID === p.ProjectID);
    return sum + (match?.projectIncome || 0);
  }, 0);
  const summaryText = `סה\"כ פרויקטים: ${count} | סה\"כ הכנסות: ₪${totalIncome.toFixed(
    2
  )}`;
  const summaryEl = document.getElementById("client-summary-text");
  if (summaryEl) summaryEl.innerText = summaryText;
}

function renderProjects(projects, withAnimation = true) {
  CardsDiv.innerHTML = "";
  if (!projects.length) {
    CardsDiv.innerHTML = `<div class="no-results-msg">לא נמצאו פרויקטים התואמים לחיפוש.</div>`;
    return;
  }

  projects.forEach((project) => {
    const statusHtml = project.isDone
      ? '<span class="status">הושלם!</span>'
      : "";
    const imageUrl = project.Image || "./images/def/proj-def.jpg";
    const income =
      ProjectSummaries.find((p) => p.projectID === project.ProjectID)
        ?.projectIncome || 0;

    const card = document.createElement("div");
    card.className = "project-card";
    if (withAnimation) card.classList.add("wow", "bounceInUp");
    card.setAttribute("projectId", project.ProjectID);
    card.style.backgroundImage = `url('${imageUrl}')`;

    card.innerHTML = `
      <div class="project-content">
        ${statusHtml}
        <h2>${project.ProjectName}</h2>
        <p>${project.CompanyName}</p>
        <p><strong>הכנסה:</strong> ₪${income.toFixed(2)}</p>
      </div>
      <div class="client-actions">
        <i class="fas fa-edit edit-icon" title="ערוך פרויקט"></i>
        <i class="fas fa-trash delete-icon" title="מחק פרויקט"></i>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("edit-icon") ||
        e.target.classList.contains("delete-icon")
      )
        return;
      localStorage.setItem("CurrentProject", JSON.stringify(project));
      window.location.href = "projectPage.html";
    });

    CardsDiv.appendChild(card);
  });

  if (withAnimation && typeof WOW === "function") new WOW().init();

  $(".edit-icon")
    .off()
    .on("click", function (e) {
      e.stopPropagation();
      const id = $(this).closest(".project-card").attr("projectId");
      const project = SelectedClientProjects.find((p) => p.ProjectID == id);
      openEditPopup(project);
    });

  $(".delete-icon")
    .off()
    .on("click", function (e) {
      e.stopPropagation();
      const id = $(this).closest(".project-card").attr("projectId");
      const project = SelectedClientProjects.find((p) => p.ProjectID == id);
      checkSessionsBeforeDelete(project);
    });
}

function openEditPopup(project) {
  $("#projectName").val(project.ProjectName);
  $("#projectDesc").val(project.Description);
  $("#hourlyRate").val(project.HourlyRate);
  $("#clientId").val(project.ClientID);
  $("#durationGoal").val(project.DurationGoal);
  $("#project-form h2").text("✏️ עדכון פרויקט");
  $(".btn-submit").text("עדכן");
  $("#project-form").data("projectid", project.ProjectID);
  $("#project-form").data("image", project.Image);
  $("#projectImageFile").val("");

  // ✅ הצגת תמונה ממוזערת קיימת או דיפולטיבית
  $("#project-image-thumb")
    .attr("src", project.Image || "./images/def/proj-def.jpg")
    .show();

  $.fancybox.open({
    src: "#new-project-form",
    type: "inline",
  });
}

function loadClientsIntoDropdown(callback) {
  const userId = CurrentUser.id;
  const apiUrl = `https://localhost:7198/api/Client/GetAllClientsByUserID?userID=${userId}`;

  $.get(apiUrl)
    .done((clients) => {
      const clientDropdown = $("#clientId");
      clientDropdown.empty();
      clientDropdown.append('<option value="">בחר לקוח</option>');
      clients.forEach((client) => {
        clientDropdown.append(
          `<option value="${client.clientID}">${client.companyName}</option>`
        );
      });
      if (callback) callback();
    })
    .fail(() => {
      alert("שגיאה בטעינת רשימת הלקוחות.");
    });
}

function submitProjectEdit(imagePath) {
  const id = $("#project-form").data("projectid");
  const data = {
    projectid: id,
    projectname: $("#projectName").val(),
    description: $("#projectDesc").val(),
    hourlyrate: Number($("#hourlyRate").val()),
    image: imagePath,
    clientid: Number($("#clientId").val()),
    durationGoal: Number($("#durationGoal").val()),
  };
  $.ajax({
    url: "https://localhost:7198/api/Projects/update_project",
    type: "PUT",
    contentType: "application/json",
    data: JSON.stringify(data),
    success: function () {
      alert("הפרויקט עודכן בהצלחה.");
      $.fancybox.close();

      // 🔄 עדכון מיידי ברשימה בלי לרענן דף
      const index = SelectedClientProjects.findIndex((p) => p.ProjectID === id);
      if (index !== -1) {
        SelectedClientProjects[index] = {
          ...SelectedClientProjects[index],
          ProjectName: data.projectname,
          Description: data.description,
          HourlyRate: data.hourlyrate,
          Image: data.image,
          ClientID: data.clientid,
          DurationGoal: data.durationGoal,
        };
        renderProjects(SelectedClientProjects, false);
      }
    },
    error: function () {
      alert("שגיאה בעדכון הפרויקט.");
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
    .fail(() => alert("שגיאה בבדיקת סשנים"));
}

function confirmDeleteProject(message, projectId) {
  const html = `
    <div style="max-width: 400px; text-align: center; font-family: Assistant; padding: 20px;">
      <h3>מחיקת פרויקט</h3>
      <p>${message}</p>
      <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
        <button class="gradient-button" id="confirmDeleteBtn">כן, מחק</button>
        <button class="gradient-button" onclick="$.fancybox.close()">ביטול</button>
      </div>
    </div>
  `;
  $.fancybox.open({ src: html, type: "html", smallBtn: false });
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
      SelectedClientProjects = SelectedClientProjects.filter(
        (p) => p.ProjectID !== projectId
      );
      renderProjects(SelectedClientProjects, false);
    },
    error: function () {
      alert("שגיאה במחיקת הפרויקט.");
    },
  });
}
