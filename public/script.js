const setScheduleButton = document.getElementById("setScheduleButton");
const timeInputs = document.querySelectorAll(".lock-time");
const status = document.getElementById("status");

// UI Rendering Functions
function renderPrayerTimes(data) {
  const prayerTimesDiv = document.getElementById("prayerTimes");
  const prayerPeriods = calculatePrayerPeriods(data.timings);

  prayerTimesDiv.innerHTML = `
    <div class="bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-xl h-full px-2">
      ${renderHeader(data)}
      <div class="grid gap-2 sm:gap-4 mt-4 sm:mt-6">
        ${renderPrayerSections(data.timings, prayerPeriods)}
      </div>
      ${renderFooter(data.meta)}
    </div>
  `;
}

function renderHeader(data) {
  return `
    <div class="text-center space-y-1 sm:space-y-2">
      <h2 class="text-xl sm:text-2xl font-semibold text-emerald-400">Today's Prayer Times</h2>
      <div class="text-xs sm:text-sm text-gray-400 space-y-0.5">
        <p>${data.date.readable}</p>
        <p>${data.date.hijri.date} ${data.date.hijri.month.en} ${data.date.hijri.year}</p>
        <p class="text-xs">${data.meta.timezone}</p>
      </div>
    </div>
  `;
}

function renderPrayerSections(timings, periods) {
  const prayers = [
    { name: "Fajr", icon: "🌅" },
    { name: "Sunrise", icon: "☀️" },
    { name: "Dhuhr", icon: "🌞" },
    { name: "Asr", icon: "🌇" },
    { name: "Maghrib", icon: "🌆" },
    { name: "Isha", icon: "🌙" },
  ];

  return prayers
    .map(({ name, icon }) =>
      renderPrayerSection(
        name,
        timings[name],
        periods[name.toLowerCase()],
        icon
      )
    )
    .join("");
}

function renderPrayerSection(name, time, period, icon) {
  return `
    <div class="bg-gray-700/30 rounded-xl p-3 sm:p-4 hover:bg-gray-700/40 transition-all">
      <div class="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <span class="text-lg sm:text-xl min-w-[24px]" title="${name}">${icon}</span>
          <div>
            <h3 class="font-medium text-sm sm:text-base text-gray-100">${name}</h3>
            <p class="text-xs sm:text-sm text-emerald-400">${formatTime(
              time
            )}</p>
          </div>
        </div>
        <div class="pl-8 sm:pl-0">
          <div class="text-xs text-gray-400">${period}</div>
        </div>
      </div>
    </div>
  `;
}

function renderFooter(meta) {
  return `
    <div class="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-700">
      <div class="text-[11px] sm:text-xs text-gray-500 space-y-1">
        <p>Calculation Method: ${meta.method.name}</p>
        <p class="flex flex-wrap gap-x-2">
          <span>School: ${meta.school}</span>
          <span>•</span>
          <span>Lat: ${meta.latitude}°</span>
          <span>•</span>
          <span>Long: ${meta.longitude}°</span>
        </p>
      </div>
    </div>
  `;
}

function renderStatus(data) {
  const statusDiv = document.getElementById("status");
  const template =
    data.status === "locked"
      ? renderLockedStatus(data.unlockIn)
      : renderUnlockedStatus(data);

  statusDiv.innerHTML = template;
}

function renderLockedStatus(unlockIn) {
  return `
    <div class="flex items-center justify-center space-x-2 text-red-400">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <span>Screen Locked - Unlocking in ${unlockIn}</span>
    </div>
  `;
}

function renderUnlockedStatus(data) {
  return `
    <div class="flex items-center justify-center space-x-2 text-emerald-400">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
      <span>${
        data.nextPrayer
          ? `Next Prayer: ${data.nextPrayer} in ${data.timeUntil}`
          : "No upcoming prayers today"
      }</span>
    </div>
  `;
}

// Utility Functions
function calculatePrayerPeriods(timings) {
  return {
    fajr: `${formatTime(timings.Fajr)} - ${formatTime(timings.Sunrise)}`,
    sunrise: `Forbidden: ${formatTime(timings.Sunrise)} - ${addMinutes(
      timings.Sunrise,
      15
    )}`,
    dhuhr: `${formatTime(timings.Dhuhr)} - ${formatTime(timings.Asr)}`,
    asr: `${formatTime(timings.Asr)} - ${formatTime(timings.Maghrib)}`,
    maghrib: `${formatTime(timings.Maghrib)} - ${formatTime(timings.Isha)}`,
    isha: `${formatTime(timings.Isha)} - ${formatTime(timings.Fajr)}`,
  };
}

function formatTime(timeStr) {
  return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function addMinutes(time, minutes) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, hour, minute + minutes);
  return formatTime(date.toTimeString());
}

// API Functions
async function updatePrayerTimes() {
  try {
    const response = await fetch("/prayer-times");
    if (!response.ok) throw new Error("Failed to fetch prayer times");
    const data = await response.json();
    renderPrayerTimes(data);
  } catch (error) {
    console.error("Failed to fetch prayer times:", error);
  }
}

async function updateStatus() {
  try {
    const response = await fetch("/status");
    if (!response.ok) throw new Error("Failed to fetch status");
    const data = await response.json();
    renderStatus(data);
  } catch (error) {
    console.error("Failed to fetch status:", error);
  }
}

// Event Listeners
setScheduleButton.addEventListener("click", async () => {
  const prayers = Array.from(timeInputs)
    .filter((input) => input.value)
    .map((input) => ({
      name: input.id.charAt(0).toUpperCase() + input.id.slice(1),
      time: input.value,
    }));

  if (prayers.length === 0) {
    status.textContent = "Please specify at least one prayer time";
    status.className = "text-center text-sm text-red-400";
    return;
  }

  setScheduleButton.disabled = true;
  setScheduleButton.innerHTML = `
    <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Setting schedule...
  `;

  try {
    const response = await fetch("/set-lock-times", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prayers }),
    });

    const data = await response.json();
    status.textContent = data.error || data.message;
    status.className = `text-center text-sm ${
      data.error ? "text-red-400" : "text-emerald-400"
    }`;
  } catch (err) {
    console.error("Error setting lock times:", err);
    status.textContent = "Failed to set schedule. Please try again.";
    status.className = "text-center text-sm text-red-400";
  } finally {
    setScheduleButton.disabled = false;
    setScheduleButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      Set Lock Schedule
    `;
  }
});

// Add this helper function
function getPrayerDescription(prayer) {
  const descriptions = {
    Fajr: "Dawn Prayer",
    Dhuhr: "Noon Prayer",
    Asr: "Afternoon Prayer",
    Maghrib: "Sunset Prayer",
    Isha: "Night Prayer",
  };
  return descriptions[prayer] || "";
}

async function loadSavedPrayerTimes() {
  try {
    const response = await fetch("/prayer-lock-times");
    if (!response.ok) throw new Error("Failed to fetch saved prayer times");
    const prayers = await response.json();

    // Set the input values
    prayers.forEach((prayer) => {
      const input = document.getElementById(prayer.name.toLowerCase());
      if (input) {
        input.value = prayer.time;
      }
    });
  } catch (error) {
    console.error("Failed to load saved prayer times:", error);
  }
}

// Initialize
setInterval(updatePrayerTimes, 60000);
setInterval(updateStatus, 10000);
loadSavedPrayerTimes();
updatePrayerTimes();
updateStatus();
