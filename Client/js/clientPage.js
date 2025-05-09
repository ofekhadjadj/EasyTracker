const CardsDiv = document.getElementById("projects");
const CurrentUser = JSON.parse(localStorage.getItem("user")) || {};
const SelectedClientID = localStorage.getItem("SelectedClientID");
let SelectedClientProjects =
  JSON.parse(localStorage.getItem("SelectedClientProjects")) || [];
const ProjectSummaries =
  JSON.parse(localStorage.getItem("ProjectSummaries")) || [];

document.addEventListener("DOMContentLoaded", () => {
  const avatarImg = document.querySelector(".avatar-img");
  if (CurrentUser?.image && avatarImg) avatarImg.src = CurrentUser.image;

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

  if (breadcrumbEl) {
    breadcrumbEl.innerHTML = `<a href="clients.html">לקוחות</a> &gt; <span>${clientName}</span>`;
  }
}

function renderClientSummary() {
  const count = SelectedClientProjects.length;

  const totalIncome = SelectedClientProjects.reduce((sum, p) => {
    const match = ProjectSummaries.find((s) => s.projectID === p.ProjectID);
    return sum + (match?.projectIncome || 0);
  }, 0);

  const summaryText = `סה"כ פרויקטים: ${count} | סה"כ הכנסות: ₪${totalIncome.toFixed(
    2
  )}`;

  const summaryEl = document.getElementById("client-summary-text");
  if (summaryEl) summaryEl.innerText = summaryText;
}

function renderProjects(projects, withAnimation = true) {
  CardsDiv.innerHTML = "";

  if (!projects.length) {
    CardsDiv.innerHTML = `
      <div class="no-results-msg">לא נמצאו פרויקטים התואמים לחיפוש.</div>
    `;
    return;
  }

  projects.forEach((project) => {
    const statusHtml = project.isDone
      ? '<span class="status">הושלם!</span>'
      : "";
    const imageUrl = project.Image || "./images/project-image-demo.jpg";

    const income =
      ProjectSummaries.find((p) => p.projectID === project.ProjectID)
        ?.projectIncome || 0; // 💡 מתוקן לשם שדה באות קטנה

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
    `;

    card.addEventListener("click", () => {
      localStorage.setItem("CurrentProject", JSON.stringify(project));
      window.location.href = "projectPage.html";
    });

    CardsDiv.appendChild(card);
  });

  if (withAnimation && typeof WOW === "function") new WOW().init();
}
