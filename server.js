const express = require("express");
const path = require("path");
const axios = require("axios");
const bodyParser = require("body-parser");
const { scheduleLocks } = require("./app");
const { getStore } = require("./store");
const moment = require("moment");
require("dotenv").config();

function getTimeUntil(targetTime) {
  const now = moment();
  const [hour, minute] = targetTime.split(":");
  const target = moment().set({ hour, minute, second: 0 });

  if (target.isBefore(now)) {
    target.add(1, "day");
  }

  const duration = moment.duration(target.diff(now));

  if (duration.asHours() >= 1) {
    return `${Math.floor(duration.asHours())}h ${duration.minutes()}m`;
  } else if (duration.asMinutes() >= 1) {
    return `${duration.minutes()}m ${duration.seconds()}s`;
  } else {
    return `${duration.seconds()}s`;
  }
}

const app = express();
const PORT = process.env.PORT ?? 3133;
// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/prayer-lock-times", (req, res) => {
  const store = getStore();
  res.json(store.prayers);
});

// Endpoint to set lock times
app.post("/set-lock-times", (req, res) => {
  const { prayers } = req.body;
  if (
    !Array.isArray(prayers) ||
    prayers.some((p) => !p.time?.match(/^\d{2}:\d{2}$/) || !p.name)
  ) {
    return res.status(400).json({ error: "Invalid prayer format" });
  }
  scheduleLocks(prayers);
  res.json({ message: "Lock times scheduled successfully" });
});

app.get("/status", (req, res) => {
  const store = getStore();
  const now = new Date();

  if (store.isLocked && store.unlockTime) {
    const unlockIn = getTimeUntil(store.unlockTime);
    res.json({ status: "locked", unlockIn });
  } else {
    const today = now.toISOString().split("T")[0];
    const nextPrayer = store.prayers
      .sort((a, b) => {
        const timeA = new Date(`${today}T${a.time}`);
        const timeB = new Date(`${today}T${b.time}`);
        return timeA - timeB;
      })
      .filter((prayer) => {
        const time = new Date(`${today}T${prayer.time}`);
        return time > now;
      })[0];

    if (nextPrayer) {
      const timeUntil = getTimeUntil(nextPrayer.time);
      res.json({
        status: "unlocked",
        nextPrayer: nextPrayer.name,
        timeUntil,
      });
    } else {
      res.json({ status: "unlocked", message: "No upcoming prayers today" });
    }
  }
});

app.get("/prayer-times", async (_, res) => {
  try {
    const city = process.env.CITY ?? "Rajshahi";
    const response = await axios.get(
      "http://api.aladhan.com/v1/timingsByCity",
      {
        params: {
          city,
          country: "Bangladesh",
          method: 1,
        },
      }
    );

    // console.log("Fetched prayer times successfully");

    res.json(response.data.data);
  } catch (error) {
    // console.error("Failed to fetch prayer times:", error);
    res.status(500).json({ error: "Failed to fetch prayer times" });
  }
});
const colorsForPrayer = {
  Fajr: "#fadb5f",
  Dhuhr: "#f9a74b",
  Asr: "#f97b6c",
  Maghrib: "#f96d9e",
  Isha: "#b48bf2",
};

app.get("/status/embed", (req, res) => {
  const store = getStore();
  const now = new Date();

  if (store.isLocked && store.unlockTime) {
    const unlockIn = getTimeUntil(store.unlockTime);
    res.send(`🔒 Locked | ${unlockIn} remaining`);
  } else {
    const today = now.toISOString().split("T")[0];
    const nextPrayer = store.prayers
      .sort((a, b) => {
        const timeA = new Date(`${today}T${a.time}`);
        const timeB = new Date(`${today}T${b.time}`);
        return timeA - timeB;
      })
      .filter((prayer) => {
        const time = new Date(`${today}T${prayer.time}`);
        return time > now;
      })[0];
    if (nextPrayer) {
      const timeUntil = getTimeUntil(nextPrayer.time);
      res.send(`🔓 ${nextPrayer.name} in ${timeUntil}`);
    } else {
      res.send("🔓 No upcoming prayers");
    }
  }
});

app.get("/status/html", (req, res) => {
  const store = getStore();
  const now = new Date();
  res.setHeader("Content-Type", "text/html");

  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    padding: 8px 12px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;

  if (store.isLocked && store.unlockTime) {
    const unlockIn = getTimeUntil(store.unlockTime);
    res.send(`<div style="${baseStyle}; background: ${colorsForPrayer.Isha}33; color: ${colorsForPrayer.Isha}; border: 1px solid ${colorsForPrayer.Isha}66">
      <svg height="8" width="8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
      Locked | ${unlockIn}
    </div>`);
  } else {
    const today = now.toISOString().split("T")[0];
    const nextPrayer = store.prayers
      .sort((a, b) => {
        const timeA = new Date(`${today}T${a.time}`);
        const timeB = new Date(`${today}T${b.time}`);
        return timeA - timeB;
      })
      .filter((prayer) => {
        const time = new Date(`${today}T${prayer.time}`);
        return time > now;
      })[0];
    if (nextPrayer) {
      const timeUntil = getTimeUntil(nextPrayer.time);
      const prayerColor = colorsForPrayer[nextPrayer.name];
      res.send(`<div style="${baseStyle}; background: ${prayerColor}33; color: ${prayerColor}; border: 1px solid ${prayerColor}66">
        <svg height="8" width="8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
        ${nextPrayer.name} in ${timeUntil}
      </div>`);
    } else {
      res.send(`<div style="${baseStyle}; background: ${colorsForPrayer.Fajr}33; color: ${colorsForPrayer.Fajr}; border: 1px solid ${colorsForPrayer.Fajr}66">
        <svg height="8" width="8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
        No upcoming prayers
      </div>`);
    }
  }
});

app.get("/status/i3bar", (req, res) => {
  const store = getStore();
  const now = new Date();

  if (store.isLocked && store.unlockTime) {
    const unlockIn = getTimeUntil(store.unlockTime);
    res.json({
      locked: true,
      time: unlockIn,
      color: colorsForPrayer.Isha,
    });
  } else {
    const today = now.toISOString().split("T")[0];
    const nextPrayer = store.prayers
      .sort((a, b) => {
        const timeA = new Date(`${today}T${a.time}`);
        const timeB = new Date(`${today}T${b.time}`);
        return timeA - timeB;
      })
      .filter((prayer) => {
        const time = new Date(`${today}T${prayer.time}`);
        return time > now;
      })[0];

    if (nextPrayer) {
      const timeUntil = getTimeUntil(nextPrayer.time);
      res.json({
        locked: false,
        time: timeUntil,
        prayer: nextPrayer.name,
        color: colorsForPrayer[nextPrayer.name],
      });
    } else {
      res.json({
        locked: false,
        color: colorsForPrayer.Fajr,
      });
    }
  }
});

async function init() {
  await scheduleLocks(getStore().prayers);
}

init();

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
