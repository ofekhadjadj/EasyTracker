// api-config.js - ניהול אוטומטי של URLs לסביבות שונות

console.log("🔧 Loading API Config...");

// זיהוי אוטומטי של הסביבה
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// הגדרת ה-URLs בהתאם לסביבה
const config = {
  // סביבת פיתוח (localhost)
  development: {
    baseUrl: "https://localhost:7198/api",
  },
  // סביבת production (השרת)
  production: {
    baseUrl: "https://proj.ruppin.ac.il/igroup4/test2/tar1/api",
  },
};

// בחירת ה-config הנכון
const currentConfig = isLocalhost ? config.development : config.production;

console.log(
  `🌍 Environment detected: ${
    isLocalhost ? "Development (localhost)" : "Production (server)"
  }`
);
console.log(`🎯 Base URL: ${currentConfig.baseUrl}`);

// פונקציה ליצירת URL מלא
function createApiUrl(endpoint, params = {}) {
  let url = `${currentConfig.baseUrl}/${endpoint}`;

  // הוספת פרמטרים אם יש
  const paramString = Object.keys(params)
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");
  if (paramString) {
    url += `?${paramString}`;
  }

  console.log(`🔗 Generated URL: ${url}`);
  return url;
}

// חשיפה גלובלית
window.apiConfig = {
  baseUrl: currentConfig.baseUrl,
  createApiUrl: createApiUrl,
  isProduction: !isLocalhost,
  isDevelopment: isLocalhost,
};

console.log("✅ API Config loaded successfully!");
