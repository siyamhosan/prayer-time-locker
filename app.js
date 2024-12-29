const { exec } = require("child_process");
const schedule = require("node-schedule");
const { getStore, updateStore } = require("./store");
const os = require("os");

let lockJobs = [];
const platform = os.platform();

let lockProccess;

function getLockCommand() {
  switch (platform) {
    case "win32":
      return "rundll32.exe user32.dll,LockWorkStation";
    case "linux":
      return "xtrlock";
    case "darwin":
      return "/System/Library/CoreServices/Menu\\ Extras/User.menu/Contents/Resources/CGSession -suspend";
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

function getUnlockCommand() {
  switch (platform) {
    case "win32":
      return null; // Windows handles unlock via user input
    case "linux":
      return "pkill xtrlock";
    case "darwin":
      return null; // MacOS handles unlock via user input
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
function scheduleLocks(times) {
  // Clear existing schedules
  lockJobs.forEach((job) => job.cancel());
  lockJobs = [];

  // Save times to store
  const store = getStore();
  store.prayers = times;
  updateStore(store);

  // Schedule new locks
  times.forEach(({ time }) => {
    const [hour, minute] = time.split(":").map(Number);
    const job = schedule.scheduleJob({ hour, minute }, () => {
      lockScreen();
    });
    lockJobs.push(job);
  });

  console.log("Scheduled lock times:", times);
}

function lockScreen() {
  console.log("Locking the screen...");
  const store = getStore();
  store.isLocked = true;
  store.lastLockTime = new Date().toISOString();
  store.unlockTime = new Date(Date.now() + 1 * 60 * 1000).toISOString();
  updateStore(store);

  try {
    const lockCommand = getLockCommand();
    lockProccess = exec(lockCommand, (err) => {
      if (err) {
        console.error("Failed to lock screen:", err.message);
        store.isLocked = false;
        updateStore(store);
      }
    });
    console.log("Screen locked. Unlocking in 15 minutes...");
    if (platform === "linux") {
      // Only auto-unlock on Linux
      setTimeout(unlockScreen, 1 * 60 * 1000);
    }
  } catch (error) {
    console.error("Error locking screen:", error.message);
    store.isLocked = false;
    updateStore(store);
  }
}

function unlockScreen() {
  if (platform !== "linux") {
    console.log("Auto-unlock not supported on this platform");
    return;
  }

  console.log("Attempting to unlock the screen...");
  const store = getStore();

  try {
    lockProccess.kill();
    console.log("Screen unlocked.");
    store.isLocked = false;
    store.unlockTime = null;
    updateStore(store);
  } catch (error) {
    console.error("Error unlocking screen:", error.message);
  }
}

module.exports = { scheduleLocks };
