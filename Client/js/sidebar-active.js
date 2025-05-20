// document.addEventListener("DOMContentLoaded", function () {
//   const path = window.location.pathname;
//   const page = path.split("/").pop().toLowerCase();

//   // התאמה ידנית של עמודים לדף-אב
//   const pageMap = {
//     "projectpage.html": "projects.html",
//     "clientpage.html": "clients.html",
//     "TeamWorkTracking.html": "stats.html",
//     // אפשר להוסיף גם future pages פה...
//   };

//   const effectivePage = pageMap[page] || page; // אם יש התאמה - נשתמש בה, אחרת נשתמש בדף עצמו

//   document.querySelectorAll(".sidbar ul li a").forEach((link) => {
//     const href = link.getAttribute("href")?.toLowerCase();
//     if (href === effectivePage) {
//       link.classList.add("active");
//     }
//   });
// });
document.addEventListener("DOMContentLoaded", () => {
  // קבלת שם הקובץ הנוכחי (ללא נתיב) באותיות קטנות
  const path = window.location.pathname;
  const page = path.split("/").pop().toLowerCase();

  // מיפוי של דפים ייחודיים אל העמוד הראשי שיש לסמן בו 'active'
  const pageMap = {
    "projectpage.html": "projects.html",
    "chat.html": "projects.html",
    "clientpage.html": "clients.html",
    "teamworktracking.html": "stats.html",
    // בעתיד: הוסף כאן עוד מיפויים במידת הצורך
  };

  // אם נמצא מיפוי, נשתמש בו; אחרת נשים את העמוד המקורי
  const effectivePage = pageMap[page] || page;

  // נקודת הכניסה אל כל הקישורים בסיידבר
  document.querySelectorAll(".sidbar .main-nav a").forEach((link) => {
    const href = (link.getAttribute("href") || "").toLowerCase();
    // תחילה נוריד לכל הקישורים מחלקת active
    link.classList.remove("active");
    // אם href תואם לדף ה'יעד' – נסמן אותו
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
