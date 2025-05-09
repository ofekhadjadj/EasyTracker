const CardsDiv = document.getElementById("projects");
let allProjects = [];
let CurrentUser = JSON.parse(localStorage.getItem("user"));

document.addEventListener("DOMContentLoaded", LoadProject);

document.addEventListener("DOMContentLoaded", function () {
  const user = JSON.parse(localStorage.getItem("user"));
  const avatarImg = document.querySelector(".avatar-img");

  if (user?.image && avatarImg) {
    avatarImg.src = user.image;
  }
});

function LoadProject() {
  const userId = JSON.parse(localStorage.getItem("user"))?.id || null;
  const apiUrl = `https://localhost:7198/api/Projects/GetProjectByUserId/${userId}`;
  const ProfName = document.getElementById("menu-prof-name");
  ProfName.innerText = CurrentUser.firstName;

  ajaxCall("GET", apiUrl, "", successCB, ErrorCB);
}

function successCB(response) {
  allProjects = response;
  renderProjects(response.slice(0, -1)); // בלי האובייקט האחרון (סטטיסטיקה)
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
    let statusHtml = project.isDone ? '<span class="status">הושלם!</span>' : "";
    let html = `
      <div class="project-card wow bounceInUp" projectId="${project.ProjectID}" style="background-image: url('${project.Image}')">
        <div class="project-content">
          ${statusHtml}
          <h2>${project.ProjectName}</h2>
          <p>${project.CompanyName}</p>
        </div>
      </div>
    `;
    CardsDiv.innerHTML += html;
  });
}

$(document).ready(function () {
  loadClients();

  $("#project-form").on("submit", function (e) {
    e.preventDefault();

    const fileInput = $("#projectImageFile").get(0);
    const files = fileInput.files;

    if (files.length === 0) {
      alert("אנא בחר תמונה לפני שמירת הפרויקט.");
      return;
    }

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

        const projectData = {
          projectname: $("#projectName").val(),
          description: $("#projectDesc").val(),
          hourlyrate: $("#hourlyRate").val(),
          image: uploadedImage,
          clientid: $("#clientId").val(),
          createdbyuserid: JSON.parse(localStorage.getItem("user"))?.id || null,
          durationGoal: $("#durationGoal").val(),
        };

        const data = JSON.stringify(projectData);

        ajaxCall(
          "POST",
          "https://localhost:7198/api/Projects/addNewProject",
          data,
          function () {
            $.fancybox.close();
            CardsDiv.innerHTML = "";
            LoadProject();
          },
          function (xhr, status, error) {
            console.error("שגיאה בשמירת פרויקט:", error);
            alert("אירעה שגיאה.");
          }
        );
      },
      error: function () {
        alert("שגיאה בהעלאת התמונה.");
      },
    });
  });

  // ✅ חיפוש פרויקטים לפי שם בלבד
  $(".search-input").on("input", function () {
    const searchTerm = $(this).val().trim().toLowerCase();
    const filtered = allProjects
      .slice(0, -1)
      .filter((p) => p.ProjectName.toLowerCase().includes(searchTerm));
    renderProjects(filtered);
  });
});

function loadClients() {
  const userId = JSON.parse(localStorage.getItem("user"))?.id || null;

  if (!userId) {
    console.error("שגיאה: לא נמצא userID ב-localStorage.");
    return;
  }

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

CardsDiv.addEventListener("click", function (event) {
  const card = event.target.closest(".project-card");
  if (!card) return;

  const projectId = card.getAttribute("projectId");
  const selectedProject = allProjects.find((p) => p.ProjectID == projectId);

  localStorage.setItem("CurrentProject", JSON.stringify(selectedProject));
  window.location.href = "./projectPage.html";
});

function PushInfoToProjectDone(ProjArray) {
  let done = ProjArray[ProjArray.length - 1].Stats.DoneCount;
  let notDone = ProjArray[ProjArray.length - 1].Stats.NotDoneCount;

  let textForTitleDone = `
    סיימת ${done} פרויקטים, ועוד ${notDone} מחכים לכישרון שלך!
  `;
  document.getElementById("doneText").innerText = textForTitleDone;
}
