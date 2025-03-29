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
  <div class="project-card" style="background-image: url('${project.Image}');">
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
  // שליחה של הטופס
  $("#project-form").on("submit", function (e) {
    e.preventDefault(); // מניעת ריענון הדף

    // שליפת הנתונים מהטופס
    const projectData = {
      projectname: $("#projectName").val(),
      description: $("#projectDesc").val(),
      hourlyrate: $("#hourlyRate").val(),
      image: $("#projectImage").val(),
      clientid: $("#clientName").val(),
      createdbyuserid: $("#creator").val(),
    };

    const apiUrl = "https://localhost:7198/api/Projects/addNewProject";

    const data = JSON.stringify(projectData);
    console.log("נתוני פרויקט:", data);

    ajaxCall(
      "POST",
      apiUrl,
      data,
      function (response) {
        console.log("הוספת פרויקט הצליחה:", response);

        if (response === 1) {
          console.log("הרשמה הצליחה!");
          // אפשר לשמור נתונים ב-localStorage אם יש, או פשוט לעבור עמוד
          // window.location.href = "dashboard.html";
          // window.location.href = "login.html";
        } else {
          alert("הרשמה נכשלה. ייתכן שהמשתמש כבר קיים.");
        }
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
