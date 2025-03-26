let form = document.getElementById("loginForm");
let userName = document.getElementById("username");
let pass = document.getElementById("password");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  let user = {
    id: 0,
    name: "",
    email: userName.value,
    password: pass.value,
  };

  const GetUserApi = `https://proj.ruppin.ac.il/igroup4/test2/tar1/api/Users/email/${user.email}/password/${user.password}`;
  // console.log(user);

  ajaxCall("GET", GetUserApi, "", GETLoginSCB, GETLoginECB);
  function GETLoginSCB(data) {
    if (data.length != 0) {
      // console.log("GOOD" + data);

      //להחזיר אחרי בדיקות
      localStorage.setItem("user", JSON.stringify(data));
      if (data[0].email == "admin@admin.com") {
        window.location.href = "./adminPage.html";
      } else {
        window.location.href = "./allgames.html";
      }
    }
    // else {
    //   alertify.alert("Password or Email is wrong", function () {});
    // }
  }
  function GETLoginECB(err) {
    if (err.responseText.includes("Incorrect login details")) {
      alertify.alert("Wrong email or password.", function () {});
    } else {
      alertify.alert("Your account is inactive.", function () {});
    }
  }

  // const api = "https://proj.ruppin.ac.il/igroup4/test2/tar1/api/Users/login";
  // ajaxCall("POST", api, JSON.stringify(user), postLoginSCB, postLoginECB);

  // function postLoginSCB(status) {
  //   if (status == true) {
  //     window.location.href =
  //       "http://194.90.158.74/igroup4/test2/tar2/allgames.html";
  //   } else {
  //     console.log(status);

  //     alertify.alert("Password or Email is wrong", function () {});
  //   }
  // }
  // function postLoginECB(err) {
  //   console.log(err.responseText);
  // }
});
