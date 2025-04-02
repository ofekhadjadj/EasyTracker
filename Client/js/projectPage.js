let interval = null;
let seconds = 0;
let isRunning = false;

const timeDisplay = document.getElementById("time");
const toggleBtn = document.getElementById("toggle-btn");
const toggleText = document.getElementById("toggle-text");
const toggleIcon = document.getElementById("toggle-icon");
const stopBtn = document.getElementById("stop-btn");
const circle = document.querySelector(".circle-progress");
const circumference = 2 * Math.PI * 100;

// 🟦 בר התקדמות
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");

// 🕒 יעד בזמן (בשעות) — אתה יכול לשנות לכמה שתרצה
const goalHours = 0.01;
const goalInSeconds = goalHours * 3600;

circle.style.strokeDasharray = circumference;
circle.style.strokeDashoffset = circumference;

function updateTime() {
  seconds++;

  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  timeDisplay.textContent = `${h}:${m}:${s}`;

  // 🟦 עדכון עיגול
  const progress = (seconds % 3600) / 3600;
  circle.style.strokeDashoffset = circumference * (1 - progress);

  // 🟦 עדכון בר התקדמות
  const progressPercent = Math.min((seconds / goalInSeconds) * 100, 100);
  progressFill.style.width = `${progressPercent}%`;
  progressText.textContent = `${Math.floor(progressPercent)}%`;

  // שינוי צבע הרקע לפי אחוז ההתקדמות
  if (progressPercent >= 90) {
    progressFill.style.background =
      "linear-gradient(to right, #ff4e50, #f00000)"; // אדום
  } else if (progressPercent >= 80) {
    progressFill.style.background =
      "linear-gradient(to right, #ff9900, #ff6600)"; // כתום
  } else {
    progressFill.style.background =
      "linear-gradient(to right, #00c6ff, #0072ff)"; // כחול רגיל
  }

  // שינוי צבע הטקסט לפי אחוזים
  if (progressPercent <= 10) {
    progressText.style.color = "#000"; // שחור
  } else {
    progressText.style.color = "#fff"; // לבן
  }
}

toggleBtn.addEventListener("click", () => {
  if (isRunning) {
    clearInterval(interval);
    isRunning = false;
    toggleText.textContent = "התחל";
    toggleIcon.src = "./images/play-icon.png";
  } else {
    interval = setInterval(updateTime, 1000);
    isRunning = true;
    toggleText.textContent = "השהה";
    toggleIcon.src = "./images/puse icon.png";
  }
});

stopBtn.addEventListener("click", () => {
  clearInterval(interval);
  isRunning = false;
  toggleText.textContent = "התחל";
  toggleIcon.src = "./images/play-icon.png";
  console.log("⏱️ זמן כולל בשניות:", seconds);

  // איפוס סטופר
  seconds = 0;
  timeDisplay.textContent = "00:00:00";
  circle.style.strokeDashoffset = circumference;
  progressFill.style.width = `0%`;
  progressText.textContent = `0%`;
});
