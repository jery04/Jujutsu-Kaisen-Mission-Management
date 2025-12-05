const fs = require('fs');
const path = require('path');

// Loads mission progression config from file and applies env overrides
function loadRawConfig() {
  const cfgPath = path.join(__dirname, '..', '..', 'config', 'mission.progress.config.json');
  let base = { probabilities: { daily: { success: 0.5, fail: 0.2 } }, delay: { startDays: 2 } };
  try {
    const txt = fs.readFileSync(cfgPath, 'utf8');
    const parsed = JSON.parse(txt);
    base = Object.assign(base, parsed);
  } catch (_) {}
  return base;
}

function getProbabilities() {
  const raw = loadRawConfig();
  const success = Number(process.env.MISSION_P_SUCCESS || raw.probabilities?.daily?.success || 0.5);
  const fail = Number(process.env.MISSION_P_FAIL || raw.probabilities?.daily?.fail || 0.2);
  const continueP = Math.max(0, 1 - (success + fail));
  return { daily: { success, fail, continue: continueP } };
}

function getDelays() {
  const raw = loadRawConfig();
  const startDays = Number(process.env.MISSION_START_DELAY_DAYS || raw.delay?.startDays || 2);
  return { startDays };
}

module.exports = { getProbabilities, getDelays };
