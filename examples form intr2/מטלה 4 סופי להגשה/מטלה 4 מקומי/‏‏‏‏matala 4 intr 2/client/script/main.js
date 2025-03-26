let mainD = document.getElementById("main");
let userOBJ = JSON.parse(localStorage.getItem("user"));
let logoutbt = document.getElementById("logout");
logoutbt.addEventListener("click", (e) => {
  localStorage.setItem("user", "");
  window.location.href = "http://127.0.0.1:5500/index.html";
});

let gretting = (document.getElementById(
  "gretting"
).innerHTML = `Hello ${userOBJ[0].name}`);

const GetGamesApi = `https://localhost:7198/api/Games/GetGamesNotLinkedToUser/${userOBJ[0].id}`;
ajaxCall("GET", GetGamesApi, "", GETLoginSCB, GETLoginECB);
function GETLoginSCB(data) {
  data.forEach((game, index) => {
    const gameDiv = document.createElement("div");
    gameDiv.classList.add("card");
    //combine all to one innerHtml
    gameDiv.innerHTML += `<img src="${game.headerImage}">`;
    gameDiv.innerHTML += `<h3>${game.name}</h3>`;
    gameDiv.innerHTML += `<h4>${game.releaseDate}</h4>`;
    gameDiv.innerHTML += `<h4>${game.publisher}</h4>`;
    gameDiv.innerHTML += `<h4>${game.price}$</h4>`;
    gameDiv.innerHTML += `<h4>Purchases:${game.numberOfPurchases}</h4>`;
    gameDiv.innerHTML += `<button type="button" id="${game.appID}">Add to MyGAMES</button>
  `;

    mainD.appendChild(gameDiv);
  });
  console.log(data);

  mainD.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      data.forEach((game) => {
        if (game.appID == e.target.id) {
          let GameToPost = {
            appID: game.appID,
            name: game.name,
            releaseDate: game.releaseDate
              ? new Date(game.releaseDate).toISOString()
              : null,
            price: game.price,
            description: game.description,
            headerImage: game.headerImage,
            website: game.windows,
            windows: game.Windows == "TRUE",
            mac: game.mac == "TRUE",
            linux: game.linux == "TRUE",
            scoreRank: game.scoreRank,
            recommendations: game.recommendations,
            publisher: game.publisher,
          };

          const api = `https://localhost:7198/api/UserGame/userID/${userOBJ[0].id}/gameID/${GameToPost.appID}`;
          ajaxCall("POST", api, "", postGameSCB, postGameECB, {
            "Content-Type": "application/json",
          });
          function postGameSCB(status) {
            if (status) {
              alertify.success("The game is added");
              mainD.innerHTML = "";
              ajaxCall("GET", GetGamesApi, "", GETTLoginSCB, GETTLoginECB);
              function GETTLoginSCB(data) {
                data.forEach((game, index) => {
                  const gameDiv = document.createElement("div");
                  gameDiv.classList.add("card");
                  //combine all to one innerHtml
                  gameDiv.innerHTML += `<img src="${game.headerImage}">`;
                  gameDiv.innerHTML += `<h3>${game.name}</h3>`;
                  gameDiv.innerHTML += `<h4>${game.releaseDate}</h4>`;
                  gameDiv.innerHTML += `<h4>${game.publisher}</h4>`;
                  gameDiv.innerHTML += `<h4>${game.price}$</h4>`;
                  gameDiv.innerHTML += `<button type="button" id="${game.appID}">Add to MyGAMES</button>
                `;

                  mainD.appendChild(gameDiv);
                });
              }
              function GETTLoginECB(err) {
                console.log(err);
              }
            } else {
              alertify.error("Can't add same game twice");
            }
          }
          function postGameECB(err) {
            console.log(err);
          }
        }
      });
    }
  });
}
function GETLoginECB(err) {
  console.log(err);
}

//loop to load all games in sql

// const api = "https://localhost:7198/api/Games/addnewgame";

// GAME.forEach((igame) => {
//   let GameToPosti = {
//     appID: igame.AppID,
//     name: igame.Name,
//     releaseDate: igame.Release_date
//       ? new Date(igame.Release_date).toISOString()
//       : null,
//     price: igame.Price,
//     description: igame.description,
//     headerImage: igame.Header_image,
//     website: igame.Website,
//     windows: igame.Windows == "TRUE",
//     mac: igame.Mac == "TRUE",
//     linux: igame.Linux == "TRUE",
//     scoreRank: igame.Score_rank,
//     recommendations: igame.Recommendations,
//     publisher: igame.Developers,
//   };

//   ajaxCall("POST", api, JSON.stringify(GameToPosti), postGameSCB, postGameECB, {
//     "Content-Type": "application/json",
//   });
//   function postGameSCB(status) {
//     console.log(status);
//   }
//   function postGameECB(err) {
//     console.log(err.responseText);
//   }
// });
