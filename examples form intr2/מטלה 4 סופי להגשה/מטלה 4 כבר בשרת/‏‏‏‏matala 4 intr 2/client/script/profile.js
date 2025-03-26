let editform = document.getElementById("regForm");
let nameForm = document.getElementById("name");
let userName = document.getElementById("username");
let pass = document.getElementById("password");
let userOBJ = JSON.parse(localStorage.getItem("user"));
let gretting = (document.getElementById(
  "gretting"
).innerHTML = `Hello ${userOBJ[0].name}`);

let logoutbt = document.getElementById("logout");
logoutbt.addEventListener("click", (e) => {
  localStorage.setItem("user", "");
  window.location.href =
    "https://proj.ruppin.ac.il/igroup4/test2/tar4/index.html";
});

nameForm.value = userOBJ[0].name;
userName.value = userOBJ[0].email;
pass.value = userOBJ[0].password;

editform.addEventListener("submit", (e) => {
  e.preventDefault();
  let user = {
    id: userOBJ[0].id,
    name: nameForm.value,
    email: userName.value,
    password: pass.value,
  };

  //למשוך מהדאטה את טבלת משתמשים ולוודא שהמייל שהכניסו לא קיים בטבלה
  //אם לא קיים אז תתבצע פעולת פוט, אם קיים תופיע שגיאה שכתובת המייל הזו כבר קיימת
  const api = `https://proj.ruppin.ac.il/igroup4/test2/tar1/api/Users/${userOBJ[0].id}`;
  ajaxCall("PUT", api, JSON.stringify(user), putProfilenSCB, putProfileECB);
});

function putProfilenSCB(status) {
  alertify.success("The profile is updated");
  // window.location.href = "http://127.0.0.1:5500/mygames.html";
  let newUser = {
    id: userOBJ[0].id,
    name: nameForm.value,
    email: userName.value,
    password: pass.value,
  };

  console.log(newUser);

  localStorage.setItem("user", JSON.stringify([newUser]));
  document.getElementById("gretting").innerHTML = `Hello ${newUser.name}`;
}
function putProfileECB(err) {
  console.log(err);
  alertify.error("You entered an existing email. Please enter a unique email.");
}
