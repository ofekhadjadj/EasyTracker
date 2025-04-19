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
  console.log(apiUrl);
  const ProfName = document.getElementById("menu-prof-name");
  ProfName.innerText = CurrentUser.firstName;

  ajaxCall("GET", apiUrl, "", successCB, ErrorCB);
}
function successCB(response) {
  renderProjects(response);
  PushInfoToProjectDone(response);
}

function ErrorCB(xhr, status, error) {
  console.error("שגיאה בטעינת הפרויקטים:", error);
}

function renderProjects(projects) {
  allProjects = projects;
  console.log(projects);

  const onlyProjects = projects.slice(0, -1); // 🔥 מדלג על האובייקט האחרון (סטטיסטיקות)

  onlyProjects.forEach((project) => {
    // let html = `
    //     <div class="project-card" style="background-image: url('${project.Image}');">
    //                         <div class="project-content">
    //                         <span class="status">הושלם!</span>
    //                         <h2>${project.ProjectName}</h2>
    //                         <p>${project.CompanyName}</p>
    //                         </div>
    //                     </div>

    //     `;

    let statusHtml = project.isDone ? '<span class="status">הושלם!</span>' : ""; // אם isDone true, הצג "הושלם!", אחרת ריק
    let html = `
  <div class="project-card" projectId="${project.ProjectID}" style="background-image: url('${project.Image}');">
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

// $(document).ready(function () {
//   // שליחה של הטופס
//   $("#project-form").on("submit", function (e) {
//     e.preventDefault(); // מניעת ריענון הדף

//     // שליפת הנתונים מהטופס
//     const projectData = {
//       projectname: $("#projectName").val(),
//       description: $("#projectDesc").val(),
//       hourlyrate: $("#hourlyRate").val(),
//       image: $("#projectImage").val(),
//       clientid: $("#clientName").val(),
//       createdbyuserid: $("#creator").val(),
//     };

//     const apiUrl = "https://localhost:7198/api/Projects/addNewProject";

//     const data = JSON.stringify(projectData);
//     console.log("נתוני פרויקט:", data);

//     ajaxCall(
//       "POST",
//       apiUrl,
//       data,
//       function (response) {
//         console.log("הוספת פרויקט הצליחה:", response);

//         if (response === 1) {
//           console.log("הרשמה הצליחה!");
//           // אפשר לשמור נתונים ב-localStorage אם יש, או פשוט לעבור עמוד
//           // window.location.href = "dashboard.html";
//           // window.location.href = "login.html";
//         } else {
//           alert("הרשמה נכשלה. ייתכן שהמשתמש כבר קיים.");
//         }
//       },
//       function (xhr, status, error) {
//         console.error("שגיאת התחברות:", error);
//         alert("אירעה שגיאה בשרת. נסה שוב מאוחר יותר.");
//       }
//     );

//     console.log("✅ פרויקט נוסף בהצלחה:", projectData);

//     // סגירת הפופ-אפ לאחר השמירה
//     $.fancybox.close();

//     CardsDiv.innerHTML = "";
//     LoadProject();
//   });
// });

$(document).ready(function () {
  // קריאת לקוחות וטעינתם ל-Dropdown בעת טעינת הדף
  loadClients();

  // שליחה של הטופס
  $("#project-form").on("submit", function (e) {
    e.preventDefault(); // מניעת ריענון הדף

    // שליפת הנתונים מהטופס
    const projectData = {
      projectname: $("#projectName").val(),
      description: $("#projectDesc").val(),
      hourlyrate: $("#hourlyRate").val(),
      image: $("#projectImage").val(),
      clientid: $("#clientId").val(), // clientId מכיל את ה-ID של הלקוח
      createdbyuserid: JSON.parse(localStorage.getItem("user"))?.id || null,
      durationGoal: $("#durationGoal").val(), // הוספת משך הזמן המיועד
    };
    console.log(projectData);

    const apiUrl = "https://localhost:7198/api/Projects/addNewProject";

    const data = JSON.stringify(projectData);
    console.log("נתוני פרויקט:", data);

    ajaxCall(
      "POST",
      apiUrl,
      data,
      function (response) {
        console.log("הוספת פרויקט הצליחה:", response);
      },
      function (xhr, status, error) {
        console.error("שגיאת התחברות:", error);
        alert("אירעה שגיאה בשרת. נסה שוב מאוחר יותר.");
      }
    );

    console.log("✅ פרויקט נוסף בהצלחה:", projectData);

    // סגירת הפופ-אפ לאחר השמירה
    $.fancybox.close();

    CardsDiv.innerHTML = "";
    LoadProject();
  });
});

// קריאת API כדי לטעון את הלקוחות ל-Dropdown
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
    function (response) {
      console.log("לקוחות נטענו בהצלחה:", response);
      populateClientDropdown(response);
    },
    function (xhr, status, error) {
      console.error("שגיאה בטעינת הלקוחות:", error);
    }
  );
}

// מילוי רשימת הלקוחות לתוך ה-Select
function populateClientDropdown(clients) {
  const clientDropdown = $("#clientId");
  clientDropdown.empty(); // נקה את התוכן הקיים
  clientDropdown.append('<option value="">בחר לקוח</option>');

  clients.forEach((client) => {
    clientDropdown.append(
      `<option value="${client.clientID}">${client.companyName}</option>`
    );
  });
}

CardsDiv.addEventListener("click", function (event) {
  const card = event.target.closest(".project-card"); // חפש את ה-div עם class="project-card" מהאלמנט שנלחץ עליו
  if (card) {
    const projectId = card.getAttribute("projectId");
    console.log("נלחץ על פרויקט עם ID:", projectId);
    const selectedProject = allProjects.find((p) => p.ProjectID == projectId);
    console.log("פרויקט שנבחר:", selectedProject);

    localStorage.setItem("CurrentProject", JSON.stringify(selectedProject)); // שמור את ה-ID של הפרויקט ב-localStorage
    window.location.href = "./projectPage.html"; // העבר לעמוד הפרויקט
  }
});
//

function PushInfoToProjectDone(ProjArray) {
  let done = ProjArray[ProjArray.length - 1].Stats.DoneCount;
  let notDone = ProjArray[ProjArray.length - 1].Stats.NotDoneCount;
  console.log(done, notDone);

  let textForTitleDone = `
  סיימת ${done} פרויקטים, ועוד ${notDone} מחכים לכישרון שלך!
  `;
  document.getElementById("doneText").innerText = textForTitleDone;
}
