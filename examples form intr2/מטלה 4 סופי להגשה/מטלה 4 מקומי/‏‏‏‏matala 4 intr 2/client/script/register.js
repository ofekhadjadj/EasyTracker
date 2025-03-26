let form = document.getElementById("regForm");
let nameForm = document.getElementById("name");
let userName = document.getElementById("username");
let pass = document.getElementById("password");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  let user = {
    id: 0,
    name: nameForm.value,
    email: userName.value,
    password: pass.value,
  };
  // to fix in the server problem that can register multiple times
  // const api = "https://proj.ruppin.ac.il/igroup4/test2/tar1/api/Users";

  //למשוך מהדאטה את טבלת משתמשים ולוודא שהמייל שהכניסו לא קיים בטבלה
  //אם לא קיים אז תתבצע פעולת פוסט, אם קיים תופיע שגיאה שכתובת המייל הזו כבר קיימת
  const api = "https://localhost:7198/api/Users/addNewUser";
  ajaxCall("POST", api, JSON.stringify(user), postLoginSCB, postLoginECB);

  function postLoginSCB(status) {
    console.log(status);
    if (status) {
      // window.location.href =
      //   "http://194.90.158.74/igroup4/test2/tar2/allgames.html";
      const GetUserApi = `https://localhost:7198/api/Users/email/${user.email}/password/${user.password}`;
      ajaxCall("GET", GetUserApi, "", GETLoginSCB, GETLoginECB);
      function GETLoginSCB(data) {
        localStorage.setItem("user", JSON.stringify(data));
        window.location.href = "http://127.0.0.1:5500/allgames.html";
      }
      function GETLoginECB(err) {
        console.log(err);
        alertify.error(
          "You entered an existing email. Please enter a unique email."
        );
      }

      // window.location.href = "http://127.0.0.1:5500/mygames.html";
    }
  }
  function postLoginECB(err) {
    alertify.alert("Please enter another email", function () {});
    console.log(err.responseText);
  }
});
