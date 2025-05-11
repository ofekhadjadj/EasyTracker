document.addEventListener("DOMContentLoaded", function () {
  const path = window.location.pathname;
  const page = path.split("/").pop().toLowerCase();

  // התאמה ידנית של עמודים לדף-אב
  const pageMap = {
    "projectpage.html": "projects.html",
    "clientpage.html": "clients.html",
    // אפשר להוסיף גם future pages פה...
  };

  const effectivePage = pageMap[page] || page; // אם יש התאמה - נשתמש בה, אחרת נשתמש בדף עצמו

  document.querySelectorAll(".sidbar ul li a").forEach((link) => {
    const href = link.getAttribute("href")?.toLowerCase();
    if (href === effectivePage) {
      link.classList.add("active");
    }
  });
});

/*
document.addEventListener("DOMContentLoaded", function () {
  const page = window.location.pathname.split("/").pop().toLowerCase();
  document.querySelectorAll(".sidbar ul li a").forEach((link) => {
    const href = link.getAttribute("href")?.toLowerCase();
    if (href === page) {
      link.classList.add("active");
    }
  });
});*/
