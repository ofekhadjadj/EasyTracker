// Global variables
let CurrentUser = null;
let sessionsTable = null;
let allProjects = [];
let selectedProject = null;
let selectedTeamMember = null;

// Initialize the page when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 TeamWorkSessions page loaded");

  // Check if user is logged in
  checkUserLogin();

  // Initialize components
  initializeComponents();

  // Load user's projects
  loadUserProjects();

  // Setup event listeners
  setupEventListeners();
});

// Check if user is logged in
function checkUserLogin() {
  CurrentUser = JSON.parse(localStorage.getItem("user"));

  if (!CurrentUser || !CurrentUser.id) {
    console.log("❌ אין משתמש מחובר - הפניה לדף התחברות");
    window.location.href = "login.html";
    return;
  }

  console.log("✅ משתמש מחובר:", CurrentUser);

  // Update profile display
  const profileName = document.getElementById("menu-prof-name");
  if (profileName) {
    profileName.textContent = CurrentUser.firstName || "משתמש";
  }

  // Update avatar
  const avatarImg = document.querySelector(".avatar-img");
  if (avatarImg && CurrentUser.image) {
    avatarImg.src = CurrentUser.image;
  }
}

// Initialize components
function initializeComponents() {
  console.log("🔧 Initializing components...");

  // Initialize DataTable
  if ($.fn.DataTable) {
    console.log("📊 Initializing DataTable...");
    sessionsTable = $("#teamSessionsTable").DataTable({
      responsive: true,
      language: {
        search: "חיפוש:",
        lengthMenu: "הצג _MENU_ שורות",
        info: "מציג _START_ עד _END_ מתוך _TOTAL_ רשומות",
        infoEmpty: "מציג 0 עד 0 מתוך 0 רשומות",
        infoFiltered: "(מסונן מתוך _MAX_ רשומות)",
        paginate: {
          first: "ראשון",
          last: "אחרון",
          next: "הבא",
          previous: "קודם",
        },
        emptyTable: "אין נתונים זמינים בטבלה",
        zeroRecords: "לא נמצאו רשומות תואמות",
      },
      order: [[1, "desc"]], // Sort by date descending
      columnDefs: [
        {
          targets: 0,
          className: "details-control",
          orderable: false,
          data: null,
          defaultContent:
            '<button class="details-control"><i class="fas fa-info-circle"></i></button>',
        },
        {
          targets: [2, 3], // Start time and end time columns
          type: "time",
        },
        {
          targets: [5, 7], // Work time and earnings columns
          className: "text-center",
        },
      ],
      pageLength: 5,
      lengthMenu: [5, 10, 25, 50, 100],
    });
    console.log("✅ DataTable initialized successfully");

    // Add event listener for details control
    $("#teamSessionsTable tbody").on(
      "click",
      "button.details-control",
      function () {
        const tr = $(this).closest("tr");
        const row = sessionsTable.row(tr);

        if (row.child.isShown()) {
          row.child.hide();
          tr.removeClass("shown");
        } else {
          const sessionData = row.data();
          if (sessionData && sessionData.length > 8) {
            const description = sessionData[8] || "אין תיאור";
            row.child(format(description)).show();
            tr.addClass("shown");
          }
        }
      }
    );
  } else {
    console.error("❌ DataTable library not found!");
  }
}

// Format description for child row
function format(description) {
  return `
        <div class="details-row">
            <div>
                <div>
                    <div style="text-align: center; margin-bottom: 15px;">
                        <strong>תיאור הסשן:</strong>
                    </div>
                    <div style="text-align: center; line-height: 1.6; padding: 10px;">${description}</div>
                </div>
            </div>
        </div>
    `;
}

// Load user's projects
function loadUserProjects() {
  const userId = CurrentUser.id;
  const apiUrl = `https://localhost:7198/api/Projects/GetProjectByUserId/${userId}`;

  console.log("📋 Loading projects for user:", userId);

  ajaxCall(
    "GET",
    apiUrl,
    "",
    function (projects) {
      console.log("✅ Projects loaded:", projects);
      console.log("📝 First project structure:", projects[0]);
      allProjects = projects;
      populateProjectsDropdown(projects);
    },
    function (error) {
      console.error("❌ Error loading projects:", error);
      showNotification("שגיאה בטעינת הפרויקטים", "error");
    }
  );
}

// Populate projects dropdown
function populateProjectsDropdown(projects) {
  const projectSelect = document.getElementById("projectFilter");

  // Clear existing options except first one
  projectSelect.innerHTML = '<option value="">בחר פרויקט</option>';

  projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.ProjectID;
    option.textContent = project.ProjectName;
    projectSelect.appendChild(option);
  });
}

// Load team members for selected project
function loadTeamMembers(projectId) {
  console.log("👥 Loading team members for project:", projectId);

  const apiUrl = `https://localhost:7198/api/Projects/GetProjectTeam?ProjectID=${projectId}`;

  ajaxCall(
    "GET",
    apiUrl,
    "",
    function (teamMembers) {
      console.log("✅ Team members loaded:", teamMembers);
      populateTeamMembersDropdown(teamMembers);
    },
    function (error) {
      console.error("❌ Error loading team members:", error);
      showNotification("שגיאה בטעינת חברי הצוות", "error");

      // Reset team members dropdown
      const teamMemberSelect = document.getElementById("teamMemberFilter");
      teamMemberSelect.innerHTML =
        '<option value="">שגיאה בטעינת חברי הצוות</option>';
      teamMemberSelect.disabled = true;
    }
  );
}

// Populate team members dropdown
function populateTeamMembersDropdown(teamMembers) {
  const teamMemberSelect = document.getElementById("teamMemberFilter");

  // Clear existing options
  teamMemberSelect.innerHTML = '<option value="">בחר איש צוות</option>';

  // Add team members
  teamMembers.forEach((member) => {
    const option = document.createElement("option");
    option.value = member.UserID;
    option.textContent = member.FullName;
    option.dataset.email = member.Email;
    teamMemberSelect.appendChild(option);
  });

  // Enable the dropdown
  teamMemberSelect.disabled = false;
}

// Load sessions for selected user and project
function loadSessions(userId, projectId) {
  console.log("📊 Loading sessions for user:", userId, "project:", projectId);

  const apiUrl = `https://localhost:7198/api/Session/GetAllSessionsByUserAndProject?userID=${userId}&projectID=${projectId}`;
  console.log("🔗 API URL:", apiUrl);

  ajaxCall(
    "GET",
    apiUrl,
    "",
    function (sessions) {
      console.log("✅ Sessions loaded:", sessions);
      console.log("📝 Sessions count:", sessions.length);
      if (sessions.length > 0) {
        console.log("📝 First session structure:", sessions[0]);
      }
      displaySessions(sessions);
    },
    function (error) {
      console.error("❌ Error loading sessions:", error);
      console.error("❌ Error details:", error.responseText || error);
      showNotification(
        "שגיאה בטעינת הסשנים: " +
          (error.responseText || error.message || "Unknown error"),
        "error"
      );
      showNoDataMessage();
    }
  );
}

// Display sessions in the table
function displaySessions(sessions) {
  if (!sessions || sessions.length === 0) {
    showNoSessionsMessage();
    return;
  }

  // Show sessions container
  document.getElementById("sessions-container").style.display = "block";

  // Sort sessions by date (newest first)
  sessions.sort((a, b) => new Date(b.StartDate) - new Date(a.StartDate));

  // Clear existing data
  sessionsTable.clear();

  // Calculate totals and count valid sessions
  let totalDurationSeconds = 0;
  let totalEarnings = 0;
  let validSessionsCount = 0;

  // Add sessions to table
  sessions.forEach((session) => {
    // Skip sessions with null or invalid data
    if (!session.StartDate || session.DurationSeconds === null) {
      return;
    }

    // Count only valid sessions that are actually displayed
    validSessionsCount++;

    const earnings = calculateEarnings(
      session.HourlyRate || 0,
      session.DurationSeconds || 0
    );
    totalDurationSeconds += session.DurationSeconds || 0;
    totalEarnings += parseFloat(earnings);

    const formattedDateTime = formatDateTime(session.StartDate);
    const endDateTime = session.EndDate
      ? formatDateTime(session.EndDate)
      : { formattedTime: "-" };
    const labelName = session.LabelName || "ללא תווית";
    const labelColor = session.LabelColor || "#6c757d";

    const rowData = [
      "", // Details control button
      formattedDateTime.formattedDate,
      formattedDateTime.formattedTime,
      endDateTime.formattedTime,
      `<span style="background-color: ${labelColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">${labelName}</span>`,
      formatSecondsToHHMMSS(session.DurationSeconds || 0),
      `₪${(session.HourlyRate || 0).toFixed(2)}`,
      `₪${earnings}`,
      session.Description || "אין תיאור", // Hidden column for details
    ];

    sessionsTable.row.add(rowData);
  });

  // Draw the table
  sessionsTable.draw();

  // Update totals in footer
  document.getElementById(
    "total-worktime"
  ).innerHTML = `<strong style="display: block; text-align: center">${formatSecondsToHHMMSS(
    totalDurationSeconds
  )}</strong>`;
  document.getElementById(
    "total-earnings"
  ).innerHTML = `<strong style="display: block; text-align: center">₪${totalEarnings.toFixed(
    2
  )}</strong>`;

  // Update sessions title with statistics
  const selectedMemberName =
    document.getElementById("teamMemberFilter").selectedOptions[0].textContent;
  const selectedProjectName =
    document.getElementById("projectFilter").selectedOptions[0].textContent;

  const totalHours = Math.floor(totalDurationSeconds / 3600);
  const totalMinutes = Math.floor((totalDurationSeconds % 3600) / 60);
  const formattedTotalTime = `${totalHours}:${totalMinutes
    .toString()
    .padStart(2, "0")}`;

  document.getElementById("sessions-title").innerHTML = `
    <span dir="rtl">סשנים של ${selectedMemberName} בפרויקט</span> <span dir="auto">${selectedProjectName}</span>
    <span style="color: #0072ff; font-weight: normal; margin-right: 20px; font-size: 16px;" dir="rtl">
      ${validSessionsCount} סשנים | ${formattedTotalTime} שעות | ₪${totalEarnings.toFixed(
    2
  )}
    </span>
  `;
}

// Show no data message
function showNoDataMessage() {
  document.getElementById("sessions-container").style.display = "none";
  // No data message div was removed
}

// Show no sessions message for selected user
function showNoSessionsMessage() {
  document.getElementById("sessions-container").style.display = "none";

  const selectedMemberName =
    document.getElementById("teamMemberFilter").selectedOptions[0]
      ?.textContent || "איש הצוות";
  const selectedProjectName =
    document.getElementById("projectFilter").selectedOptions[0]?.textContent ||
    "הפרויקט";

  showNotification(
    `לא נמצאו סשנים עבור ${selectedMemberName} בפרויקט ${selectedProjectName}`,
    "info"
  );
}

// Setup event listeners
function setupEventListeners() {
  console.log("🎯 Setting up event listeners...");

  // Project selection change
  const projectFilter = document.getElementById("projectFilter");
  if (projectFilter) {
    console.log("✅ Project filter element found");
    projectFilter.addEventListener("change", function () {
      console.log("📋 Project selection changed:", this.value);
      const projectId = this.value;
      const teamMemberSelect = document.getElementById("teamMemberFilter");
      const loadBtn = document.getElementById("load-sessions-btn");

      if (projectId) {
        selectedProject = allProjects.find((p) => p.ProjectID == projectId);
        console.log("✅ Selected project:", selectedProject);
        loadTeamMembers(projectId);

        // Reset team member selection
        teamMemberSelect.value = "";
        selectedTeamMember = null;

        // Keep load button disabled until team member is selected
        loadBtn.disabled = true;
      } else {
        // Reset everything
        teamMemberSelect.innerHTML =
          '<option value="">בחר תחילה פרויקט</option>';
        teamMemberSelect.disabled = true;
        loadBtn.disabled = true;
        selectedProject = null;
        selectedTeamMember = null;
        showNoDataMessage();
      }
    });
  } else {
    console.error("❌ Project filter element not found!");
  }

  // Team member selection change
  const teamMemberFilter = document.getElementById("teamMemberFilter");
  if (teamMemberFilter) {
    console.log("✅ Team member filter element found");
    teamMemberFilter.addEventListener("change", function () {
      console.log("👤 Team member selection changed:", this.value);
      const userId = this.value;
      const loadBtn = document.getElementById("load-sessions-btn");

      if (userId && selectedProject) {
        selectedTeamMember = {
          id: userId,
          name: this.selectedOptions[0].textContent,
          email: this.selectedOptions[0].dataset.email,
        };
        console.log("✅ Selected team member:", selectedTeamMember);
        loadBtn.disabled = false;
        console.log("✅ Load button enabled");
      } else {
        selectedTeamMember = null;
        loadBtn.disabled = true;
        console.log("❌ Load button disabled");
      }
    });
  } else {
    console.error("❌ Team member filter element not found!");
  }

  // Load sessions button click
  const loadBtn = document.getElementById("load-sessions-btn");
  if (loadBtn) {
    console.log("✅ Load sessions button found");
    loadBtn.addEventListener("click", function () {
      console.log("🔄 Load sessions button clicked");
      console.log("Selected project:", selectedProject);
      console.log("Selected team member:", selectedTeamMember);

      if (selectedProject && selectedTeamMember) {
        console.log("✅ Loading sessions with:", {
          userId: selectedTeamMember.id,
          projectId: selectedProject.ProjectID,
        });
        loadSessions(selectedTeamMember.id, selectedProject.ProjectID);
      } else {
        console.log("❌ Missing project or team member selection");
        showNotification("יש לבחור פרויקט ואיש צוות", "error");
      }
    });
  } else {
    console.error("❌ Load sessions button not found!");
  }

  console.log("✅ Event listeners setup completed");
}

// Utility functions
function formatDateTime(isoString) {
  const date = new Date(isoString);
  const formattedDate = date.toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return { formattedDate, formattedTime };
}

function formatSecondsToHHMMSS(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function calculateEarnings(hourlyRate, durationSeconds) {
  const hours = durationSeconds / 3600;
  const earnings = hours * hourlyRate;
  return earnings.toFixed(2);
}

function showNotification(message, type = "success") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = "save-notification";

  let backgroundColor, icon;
  if (type === "error") {
    backgroundColor = "#dc3545";
    icon = "✗";
  } else if (type === "info") {
    backgroundColor = "#0072ff";
    icon = "ℹ";
  } else {
    backgroundColor = "#28a745";
    icon = "✓";
  }

  notification.style.backgroundColor = backgroundColor;
  notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-message">${message}</div>
    `;

  document.body.appendChild(notification);

  // Show notification
  setTimeout(() => {
    notification.classList.add("show");
  }, 100);

  // Hide notification after delay
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, 3000);
}

// Add notification styles if not present
if (!document.querySelector("style[data-team-sessions-notifications]")) {
  const style = document.createElement("style");
  style.setAttribute("data-team-sessions-notifications", "true");
  style.textContent = `
        .save-notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translate(-50%, -100px);
            background-color: #28a745;
            color: white;
            padding: 15px 25px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            transition: transform 0.4s ease, opacity 0.4s ease;
            opacity: 0;
            font-family: 'Assistant', sans-serif;
            font-weight: 500;
            font-size: 16px;
            max-width: 90%;
        }
        
        .save-notification.show {
            transform: translate(-50%, 0);
            opacity: 1;
        }
        
        .notification-icon {
            width: 24px;
            height: 24px;
            background-color: rgba(255, 255, 255, 0.25);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        
        .notification-message {
            font-size: 16px;
            padding-right: 5px;
        }
    `;
  document.head.appendChild(style);
}
