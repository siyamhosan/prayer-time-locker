const fs = require("fs");
const path = require("path");

const STORE_PATH = path.join(__dirname, "data.json");

const defaultData = {
  prayers: [],
  lastLockTime: null,
  unlockTime: null,
  isLocked: false,
};

function initStore() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(defaultData));
  }
}

function getStore() {
  initStore();
  return JSON.parse(fs.readFileSync(STORE_PATH));
}

function updateStore(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

module.exports = { getStore, updateStore };
