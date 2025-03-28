const CardsDiv = document.getElementById("projects");

document.addEventListener("DOMContentLoaded", LoadProject);

function LoadProject() {
  const userId = JSON.parse(localStorage.getItem("user"))?.id || null;
  const apiUrl = `https://localhost:7198/api/Projects/GetProjectByUserId/${userId}`;
  console.log(apiUrl);

  ajaxCall("GET", apiUrl, "", successCB, ErrorCB);
}
function successCB(response) {
  renderProjects(response);
}

function ErrorCB(xhr, status, error) {
  console.error("שגיאה בטעינת הפרויקטים:", error);
}

function renderProjects(projects) {
  console.log(projects);

  projects.forEach((project) => {
    let html = `
        <div class="project-card" style="background-image: url('${project.image}');">
                            <div class="project-content">
                            <span class="status">הושלם!</span>
                            <h2>${project.projectname}</h2>
                            <p>שם לקוח</p>
                            </div>
                        </div>
        
        `;

    CardsDiv.innerHTML += html;
  });
}
