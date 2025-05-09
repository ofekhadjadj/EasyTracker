const ClientsDiv = document.getElementById("clients");
let allClients = [];
let allProjects = [];
let clientSummaries = [];
let projectSummaries = [];
let initialLoadComplete = false;

const CurrentUser = JSON.parse(localStorage.getItem("user"));

$(document).ready(function () {
  const avatarImg = document.querySelector(".avatar-img");
  if (CurrentUser?.image && avatarImg) avatarImg.src = CurrentUser.image;
  const ProfName = document.getElementById("menu-prof-name");
  if (ProfName) ProfName.innerText = CurrentUser.firstName;

  fetchAllData();

  $("#client-form").on("submit", function (e) {
    e.preventDefault();

    const fileInput = $("#clientImageFile")[0];
    const files = fileInput.files;

    if (files.length > 0) {
      const formData = new FormData();
      formData.append("files", files[0]);

      $.ajax({
        url: "https://localhost:7198/api/Upload",
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: function (uploadedImagePaths) {
          const uploadedImage = uploadedImagePaths[0];
          sendClient(uploadedImage);
        },
        error: function () {
          alert("שגיאה בהעלאת תמונת הלקוח.");
        },
      });
    } else {
      sendClient(null);
    }
  });

  $("#search-client").on("input", function () {
    const term = $(this).val().toLowerCase().trim();
    if (term === "") {
      renderClients(allClients, false);
      return;
    }

    const filtered = allClients.filter((c) =>
      c.companyName.toLowerCase().includes(term)
    );

    if (filtered.length > 0) {
      renderClients(filtered, false);
    } else {
      ClientsDiv.innerHTML = `<div class="no-results-msg">לא נמצאו לקוחות תואמים</div>`;
    }
  });
});

function fetchAllData() {
  const userID = CurrentUser?.id;
  const urlClients = `https://localhost:7198/api/Client/GetAllClientsByUserID?userID=${userID}`;
  const urlSummaries = `https://localhost:7198/api/Client/GetClientSummariesByUserID?userID=${userID}`;
  const urlProjects = `https://localhost:7198/api/Projects/GetProjectByUserId/${userID}`;

  Promise.all([$.get(urlClients), $.get(urlSummaries), $.get(urlProjects)])
    .then(([clientsRes, summaryRes, projectsRes]) => {
      allClients = clientsRes;
      clientSummaries = summaryRes.clients;
      projectSummaries = summaryRes.projects;
      allProjects = projectsRes.slice(0, -1);

      renderClients(allClients, true);
      initialLoadComplete = true;
    })
    .catch((err) => {
      console.error("שגיאה בטעינת נתונים:", err);
    });
}

function renderClients(clients, withAnimation = false) {
  ClientsDiv.innerHTML = "";

  clients.forEach((client) => {
    const summary = clientSummaries.find(
      (s) => Number(s.clientID) === Number(client.clientID)
    );
    const projectCount = summary?.projectCount || 0;
    const income = summary?.totalClientIncome || 0;

    const clientProjects = allProjects.filter(
      (p) => Number(p.ClientID) === Number(client.clientID)
    );

    const card = document.createElement("div");
    card.className = "project-card client-card";
    if (withAnimation && !initialLoadComplete) {
      card.classList.add("wow", "bounceInUp");
    }

    card.setAttribute("data-client-id", client.clientID);
    card.style.backgroundImage = `url('${
      client.image || "./images/client-avatar.png"
    }')`;

    const content = document.createElement("div");
    content.className = "project-content";
    content.innerHTML = `
      <h2>${client.companyName}</h2>
      <p>${projectCount} פרויקטים</p>
      <p>₪${income.toFixed(2)} הכנסות</p>
    `;

    card.appendChild(content);
    ClientsDiv.appendChild(card);

    card.addEventListener("click", () => {
      localStorage.setItem("SelectedClientID", client.clientID);
      localStorage.setItem(
        "SelectedClientProjects",
        JSON.stringify(clientProjects)
      );
      localStorage.setItem("SelectedClientName", client.companyName);
      localStorage.setItem(
        "ProjectSummaries",
        JSON.stringify(projectSummaries)
      );
      window.location.href = "clientPage.html";
    });
  });

  if (withAnimation && !initialLoadComplete && typeof WOW === "function") {
    new WOW().init();
  }

  // ✅ עדכון הטקסט "יש לך X לקוחות"
  const doneText = document.getElementById("doneText");
  if (doneText) {
    doneText.innerText = `יש לך ${clients.length} לקוחות`;
  }
}
