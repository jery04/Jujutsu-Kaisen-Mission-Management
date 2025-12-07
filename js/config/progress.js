const fs = require('fs');
const path = require('path');

// Loads mission progression config from file
function loadRawConfig() {
  const cfgPath = path.join(__dirname, '..', '..', 'config', 'mission.progress.config.json');
  let base = { probabilities: { daily: { success: 0.5, fail: 0.2, death: 0.05 } }, delay: { startDays: 2 } };
  try {
    const txt = fs.readFileSync(cfgPath, 'utf8');
    const parsed = JSON.parse(txt);
    base = Object.assign(base, parsed);
  } catch (_) {}
  return base;
}

function getProbabilities() {
  const raw = loadRawConfig();
  const success = Number(raw.probabilities?.daily?.success ?? 0.5);
  const death = Number(raw.probabilities?.daily?.death ?? 0.05);
  const continueP = Math.max(0, 1 - success);
  return { daily: { success, continue: continueP, death } };
}

function getDelays() {
  const raw = loadRawConfig();
  const startDays = Number(raw.delay?.startDays ?? 2);
  return { startDays };
}

module.exports = { getProbabilities, getDelays };
