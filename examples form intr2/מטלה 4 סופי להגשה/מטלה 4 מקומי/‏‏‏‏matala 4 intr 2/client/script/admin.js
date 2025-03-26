const dataTable = new DataTable("#datatbl");
let userstbl = document.getElementById("datatbl");
let mainToggle = document.getElementById("main-toggle");
let logoutbt = document.getElementById("logout");
let userOBJ = JSON.parse(localStorage.getItem("user"));

logoutbt.addEventListener("click", (e) => {
  localStorage.setItem("user", "");
  window.location.href = "http://127.0.0.1:5500/index.html";
});
let gretting = (document.getElementById(
  "gretting"
).innerHTML = `Hello ${userOBJ[0].name}`);

// let UsersTblWarp = document.getElementById("datatbl_wrapper");
// let GamessTblWarp = document.getElementById("datatblgames_wrapper");
// console.log(UsersTblWarp);
// console.log(GamessTblWarp);

// document.addEventListener("DOMContentLoaded", function () {
//   let UsersTblWarp = document.getElementById("datatbl_wrapper");
//   let GamessTblWarp = document.getElementById("datatblgames_wrapper");
//   console.log(UsersTblWarp);
//   console.log(GamessTblWarp);
// });

// מערך המשתמשים

const GetUsersApi = `https://localhost:7198/api/Users/GetUsersWithGameStats
`;
ajaxCall("GET", GetUsersApi, "", GETUsersSCB, GETUsersECB);
function GETUsersSCB(data) {
  console.log(data);

  // הוספת הנתונים לטבלה באמצעות DataTables
  data.forEach((user) => {
    dataTable.row
      .add([
        user.UserID,
        user.UserName,
        user.NumberOfGamesBought,
        user.TotalAmountSpent,
        `<label class="toggle-switch">
  <input class="checkb" id="${user.UserID}" type="checkbox" ${
          user.IsActive ? "checked" : ""
        } />
  <span class="toggle-slider"></span>
</label>`,
      ])
      .draw(); // draw מעדכן את הטבלה
  });
}
function GETUsersECB(err) {
  console.log(err);
}

userstbl.addEventListener("click", (e) => {
  if (e.target.tagName === "INPUT" && e.target.type === "checkbox") {
    // קבלת המצב החדש של ה-checkbox
    const isChecked = e.target.checked;
    console.log(`Checkbox clicked. Checked: ${isChecked}`);
    //מחזיר טרו סימנתי
    //מחזיר פאלס הורדתי סימון

    let SetActiveUrl = `https://localhost:7198/api/Users/userID/${e.target.id}/isActive/${isChecked}`;
    console.log(SetActiveUrl);
    ajaxCall("POST", SetActiveUrl, "", SetActiveSCB, SetActiveECB);
    function SetActiveSCB(data) {
      console.log(data);
      alertify.success("Account status changed successfully.");
    }
    function SetActiveECB(err) {
      console.log(err);
    }
  }
});

//games table

const dataTableGames = new DataTable("#datatblgames");
const GetGamesApi = `https://localhost:7198/api/Games/GetGamesWithStats`;
ajaxCall("GET", GetGamesApi, "", GetGamesSCB, GetGamesECB);
function GetGamesSCB(data) {
  console.log(data);

  // הוספת הנתונים לטבלה באמצעות DataTables
  data.forEach((user) => {
    dataTableGames.row
      .add([user.AppID, user.Name, user.NumberOfDownloads, user.TotalRevenue])
      .draw(); // draw מעדכן את הטבלה
  });
}
function GetGamesECB(err) {
  console.log(err);
}

// mainToggle.addEventListener("click", (e) => {
//   console.log(mainToggle.checked);
//   if (!mainToggle.checked) {
//     console.log("need to show users");
//     GamesTblWarp.style.display = "none";
//     UsersTblWarp.style.display = "block";
//   } else {
//     console.log("need to show games");
//     UsersTblWarp.style.display = "none";
//     GamesTblWarp.style.display = "block";
//   }
// });

// איתור האלמנטים
// let mainToggle = document.getElementById("mainToggle");
let UsersTblWarp = document.getElementById("datatbl_wrapper");
let GamessTblWarp = document.getElementById("datatblgames_wrapper");

// הגדרת פונקציית שינוי
function handleToggleChange() {
  if (mainToggle.checked) {
    // אם הטוגל מסומן, מציגים רק את GamessTblWarp
    UsersTblWarp.style.display = "none";
    GamessTblWarp.style.display = "block";
  } else {
    // אם הטוגל לא מסומן, מציגים רק את UsersTblWarp
    UsersTblWarp.style.display = "block";
    GamessTblWarp.style.display = "none";
  }
}

// הוספת מאזין אירועים לטוגל
mainToggle.addEventListener("change", handleToggleChange);

// מצב ברירת מחדל בעת טעינת הדף
handleToggleChange();

// document.addEventListener("DOMContentLoaded", function () {
//   let AdminActiveBt = document.getElementById("12");
//   AdminActiveBt.disabled = true;
//   console.log(AdminActiveBt.disabled);
// });

// document.addEventListener("DOMContentLoaded", function () {
//   // let AdminActiveBt = document.getElementById("12");
//   // if (AdminActiveBt) {
//   //   AdminActiveBt.disabled = true;
//   //   console.log(AdminActiveBt.disabled);
//   // } else {
//   //   console.error("Element with id '12' not found.");

//   // }

// });

document.addEventListener("DOMContentLoaded", function () {
  let interval = setInterval(function () {
    let AdminActiveBt = document.getElementById("12");
    if (AdminActiveBt) {
      AdminActiveBt.disabled = true;
      console.log(AdminActiveBt.disabled);
      clearInterval(interval);
    }
  }, 100); // בודק כל 100ms
});
