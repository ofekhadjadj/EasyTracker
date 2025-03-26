let mainD = document.getElementById("main");
let inputPrice = document.getElementById("inp-price");
let inputRank = document.getElementById("inp-rank");
let btnPrice = document.getElementById("btn-price");
let btnRank = document.getElementById("btn-rank");
let userOBJ = JSON.parse(localStorage.getItem("user"));
let logoutbt = document.getElementById("logout");
logoutbt.addEventListener("click", (e) => {
  localStorage.setItem("user", "");
  window.location.href =
    "https://proj.ruppin.ac.il/igroup4/test2/tar4/index.html";
});
let gretting = (document.getElementById(
  "gretting"
).innerHTML = `Hello ${userOBJ[0].name}`);

const apiGet = `https://proj.ruppin.ac.il/igroup4/test2/tar1/api/Games/GetGamesByUserID/${userOBJ[0].id}`;
function ajaxBringGames() {
  // inputPrice.value = "";
  // inputRank.value = "";

  ajaxCall("GET", apiGet, "", getGameSCB, getGameECB, {
    "Content-Type": "application/json",
  });
  function getGameSCB(data) {
    //   console.log(data);
    renderMyGames(data);
  }
  function getGameECB(err) {
    console.log(err.responseText);
  }
}

ajaxBringGames();

function renderMyGames(mygames) {
  mainD.innerHTML = "";

  mygames.forEach((mygame, index) => {
    //date care
    let gdate = new Date(mygame.releaseDate).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const gameDiv = document.createElement("div");
    gameDiv.classList.add("card");
    //combine all to one innerHtml

    gameDiv.innerHTML += `<img src="${mygame.headerImage}">`;
    gameDiv.innerHTML += `<h3>${mygame.name}</h3>`;
    gameDiv.innerHTML += `<h4>${gdate}</h4>`;
    gameDiv.innerHTML += `<h4>${mygame.publisher}</h4>`;
    gameDiv.innerHTML += `<h4>rank: ${mygame.scoreRank}</h4>`;
    gameDiv.innerHTML += `<h4>${mygame.price}$</h4>`;
    gameDiv.innerHTML += `<h4>Purchases:${mygame.numberOfPurchases}</h4>`;
    gameDiv.innerHTML += `<button type="button" id="${mygame.appID}">DELETE</button>
      `;
    mainD.appendChild(gameDiv);
  });
}
mainD.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    const gameCard = e.target.parentElement;
    let apiToDelete = `https://proj.ruppin.ac.il/igroup4/test2/tar1/api/UserGame/RemoveFromUserGameConnection?id=${userOBJ[0].id}&appID=${e.target.id}`;

    ajaxCall("DELETE", apiToDelete, "", deleteGameSCB, deleteGameECB, {
      "Content-Type": "application/json",
    });
    function deleteGameSCB(status) {
      ajaxBringGames();
    }
    function deleteGameECB(err) {
      console.log(err);
    }
    alertify.success("The game is deleted");
  }
});
//get by price
btnPrice.addEventListener("click", () => {
  ajaxBringGamesByPrice();
});

function ajaxBringGamesByPrice() {
  let apiGetByPrice = `https://proj.ruppin.ac.il/igroup4/test2/tar1/api/Games/GetGameByMinPrice/id/${userOBJ[0].id}/minPrice/${inputPrice.value}`;
  if (inputPrice.value == "") {
    ajaxBringGames();
    return true;
  }
  ajaxCall("GET", apiGetByPrice, "", getGamePriceSCB, getGamePriceECB, {
    "Content-Type": "application/json",
  });
  function getGamePriceSCB(data) {
    renderMyGames(data);
  }
  function getGamePriceECB(err) {
    console.log(err.responseText);
  }
}

//get by rank

btnRank.addEventListener("click", () => {
  ajaxBringGamesByRank();
});

function ajaxBringGamesByRank() {
  let apiGetByRank = `https://proj.ruppin.ac.il/igroup4/test2/tar1/api/Games/GetGameByMinRank/id/${userOBJ[0].id}/minRank/${inputRank.value}`;
  console.log(apiGetByRank);

  if (inputRank.value == "") {
    ajaxBringGames();
    return true;
  }
  ajaxCall("GET", apiGetByRank, "", getGameRankSCB, getGameRankECB, {
    "Content-Type": "application/json",
  });
  function getGameRankSCB(data) {
    renderMyGames(data);
  }
  function getGameRankECB(err) {
    console.log(err.responseText);
  }
}
