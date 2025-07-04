// Mobile Projects JS - EasyTracker Mobile Version

// Global variables
let allProjects = [];
let CurrentUser = JSON.parse(localStorage.getItem("user"));

// Check if user data exists
if (!CurrentUser) {
  console.warn("No user found in localStorage");
}

// Mobile Menu Functions
function toggleMobileMenu() {
  const mobileMenu = document.getElementById("mobileMenu");
  mobileMenu.classList.toggle("active");
}

// Toast notification function for mobile
function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="toast-icon fas ${
      type === "success" ? "fa-check-circle" : "fa-exclamation-circle"
    }"></i>
    <span class="toast-message">${message}</span>
  `;

  toastContainer.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-50px)";
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Load projects from API
function LoadProjects() {
  const userId = CurrentUser?.id;
  if (!userId) {
    console.error("No user ID found");
    return;
  }

  const apiUrl = apiConfig.createApiUrl(
    `Projects/GetProjectByUserId/${userId}`
  );
  ajaxCall("GET", apiUrl, "", successCB, ErrorCB);
}

function successCB(response) {
  allProjects = response;

  // Update stats
  updateProjectsStats(response);

  // Filter and render active projects by default
  filterAndRenderActiveProjects();
}

function ErrorCB(error) {
  console.error("שגיאה בטעינת הפרויקטים:", error);
  const projectsGrid = document.getElementById("projectsGrid");
  projectsGrid.innerHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      <p>שגיאה בטעינת הפרויקטים</p>
      <button class="retry-btn" onclick="LoadProjects()">נסה שוב</button>
    </div>
  `;
}

// Update projects statistics
function updateProjectsStats(projects) {
  if (projects.length === 0) return;

  // Last item contains stats
  const stats = projects[projects.length - 1].Stats;
  document.getElementById("activeProjectsCount").textContent =
    stats.NotDoneCount || 0;
  document.getElementById("completedProjectsCount").textContent =
    stats.DoneCount || 0;
}

// Render projects in mobile grid
function renderProjects(projects) {
  const projectsGrid = document.getElementById("projectsGrid");
  projectsGrid.innerHTML = "";

  if (projects.length === 0) {
    projectsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-folder-open"></i>
        <h3>אין פרויקטים להצגה</h3>
        <p>התחל בפרויקט החדש הראשון שלך!</p>
        <button class="btn-submit" onclick="openNewProjectModal()">
          <i class="fas fa-plus"></i>
          פרויקט חדש
        </button>
      </div>
    `;
    return;
  }

  projects.forEach((project) => {
    const projectCard = createProjectCard(project);
    projectsGrid.appendChild(projectCard);
  });
}

// Create project card element
function createProjectCard(project) {
  const card = document.createElement("div");
  card.className = "project-card";
  card.setAttribute("data-project-id", project.ProjectID);

  const statusClass = project.isDone || project.IsDone ? "completed" : "";
  const statusText = project.isDone || project.IsDone ? "הושלם" : "פעיל";

  card.innerHTML = `
    <img class="project-image" src="${
      project.Image || "../images/def/proj-def.jpg"
    }" alt="${project.ProjectName}" />
    <div class="project-actions">
      <button class="action-btn edit" onclick="editProject(${
        project.ProjectID
      })" title="ערוך">
        <i class="fas fa-edit"></i>
      </button>
      <button class="action-btn delete" onclick="deleteProject(${
        project.ProjectID
      })" title="מחק">
        <i class="fas fa-trash"></i>
      </button>
    </div>
    <div class="project-content">
      <div class="project-header">
        <h3 class="project-title">${project.ProjectName}</h3>
        <div class="project-status ${statusClass}">${statusText}</div>
      </div>
      <p class="project-client">${project.CompanyName || "ללא לקוח"}</p>
      <div class="project-stats">
        <span class="project-rate">₪${project.HourlyRate}/שעה</span>
        <span class="project-goal">${project.DurationGoal || 0} שעות</span>
      </div>
    </div>
  `;

  // Add click event to navigate to project page
  card.addEventListener("click", (e) => {
    // Don't navigate if clicking on action buttons
    if (e.target.closest(".project-actions")) return;

    localStorage.setItem("CurrentProject", JSON.stringify(project));
    window.location.href = "m-projectPage.html";
  });

  return card;
}

// Filter and render active projects only
function filterAndRenderActiveProjects() {
  const showCompleted = document.getElementById(
    "show-completed-projects"
  ).checked;
  let filtered = allProjects.slice(0, -1); // Remove stats object

  if (!showCompleted) {
    filtered = filtered.filter((p) => !p.isDone && !p.IsDone);
  }

  renderProjects(filtered);
}

// Search functionality
function setupSearch() {
  const searchInput = document.querySelector(".search-input");
  searchInput.addEventListener("input", function () {
    const searchTerm = this.value.trim().toLowerCase();
    const showCompleted = document.getElementById(
      "show-completed-projects"
    ).checked;
    let filtered = allProjects.slice(0, -1);

    // Filter by completion status
    if (!showCompleted) {
      filtered = filtered.filter((p) => !p.isDone && !p.IsDone);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.ProjectName.toLowerCase().includes(searchTerm) ||
          (p.CompanyName && p.CompanyName.toLowerCase().includes(searchTerm))
      );
    }

    renderProjects(filtered);
  });
}

// New project modal functions
function openNewProjectModal() {
  const modal = document.getElementById("newProjectModal");
  modal.classList.add("active");
  document.body.classList.add("modal-open");

  // Reset form
  document.getElementById("newProjectForm").reset();

  // Load clients for dropdown
  loadClients();
}

function closeNewProjectModal() {
  const modal = document.getElementById("newProjectModal");
  modal.classList.remove("active");
  document.body.classList.remove("modal-open");
}

// Load clients for dropdown
function loadClients() {
  const userId = CurrentUser?.id;
  if (!userId) return;

  const apiUrl = apiConfig.createApiUrl("Client/GetAllClientsByUserID", {
    userID: userId,
  });
  ajaxCall("GET", apiUrl, null, populateClientDropdown, function (error) {
    console.error("שגיאה בטעינת הלקוחות:", error);
  });
}

function populateClientDropdown(clients) {
  const clientDropdown = document.getElementById("clientId");
  clientDropdown.innerHTML = '<option value="">בחר לקוח</option>';

  clients.forEach((client) => {
    const option = document.createElement("option");
    option.value = client.clientID;
    option.textContent = client.companyName;
    clientDropdown.appendChild(option);
  });
}

// Create new project
function createProject() {
  const form = document.getElementById("newProjectForm");
  const formData = new FormData(form);

  const newProject = {
    CreatedByUserID: CurrentUser.id,
    ProjectName: formData.get("projectName").trim(),
    Description: formData.get("projectDesc").trim(),
    HourlyRate: Number(formData.get("hourlyRate")),
    Image: "./images/def/proj-def.jpg", // Default image for now
    ClientID: Number(formData.get("clientId")),
    DurationGoal: Number(formData.get("durationGoal")),
  };

  // Validate required fields
  if (
    !newProject.ProjectName ||
    !newProject.HourlyRate ||
    !newProject.ClientID ||
    !newProject.DurationGoal
  ) {
    showToast("אנא מלא את כל השדות הנדרשים", "error");
    return;
  }

  ajaxCall(
    "POST",
    apiConfig.createApiUrl("Projects/addNewProject"),
    JSON.stringify(newProject),
    function (response) {
      showToast("הפרויקט נוסף בהצלחה!");
      closeNewProjectModal();
      LoadProjects();
    },
    function (error) {
      console.error("Add Project error:", error);
      showToast("שגיאה ביצירת הפרויקט", "error");
    }
  );
}

// Edit project (placeholder - will implement when needed)
function editProject(projectId) {
  // Prevent event bubbling
  if (event) event.stopPropagation();

  console.log("Edit project:", projectId);
  showToast("עריכת פרויקט - בפיתוח", "info");
}

// Delete project
function deleteProject(projectId) {
  // Prevent event bubbling
  if (event) event.stopPropagation();

  const project = allProjects.find((p) => p.ProjectID == projectId);
  if (!project) {
    console.error("Project not found:", projectId);
    return;
  }

  if (
    confirm(`האם אתה בטוח שברצונך למחוק את הפרויקט "${project.ProjectName}"?`)
  ) {
    ajaxCall(
      "PUT",
      apiConfig.createApiUrl("Projects/delete_project", {
        ProjectId: projectId,
      }),
      "",
      function (response) {
        showToast("הפרויקט נמחק בהצלחה");
        LoadProjects();
      },
      function (error) {
        console.error("Delete Project error:", error);
        showToast("שגיאה במחיקת הפרויקט", "error");
      }
    );
  }
}

// Update user profile display
function updateUserProfile() {
  const userNameElement = document.getElementById("user-name");
  const avatarImg = document.querySelector(".avatar-img");

  if (CurrentUser) {
    userNameElement.textContent = CurrentUser.firstName || "משתמש";
    avatarImg.src = CurrentUser.image || "../images/def/user-def.png";
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Check if user is logged in
  if (!CurrentUser) {
    window.location.href = "../login.html";
    return;
  }

  // Update user profile display
  updateUserProfile();

  // Load projects
  LoadProjects();

  // Setup search functionality
  setupSearch();

  // Setup show completed projects toggle
  document
    .getElementById("show-completed-projects")
    .addEventListener("change", filterAndRenderActiveProjects);

  // Setup new project form submission
  document
    .getElementById("newProjectForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      createProject();
    });

  // Setup modal overlay clicks
  document
    .querySelector(".modal-overlay")
    .addEventListener("click", closeNewProjectModal);

  // Close modal on escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeNewProjectModal();
    }
  });
});
