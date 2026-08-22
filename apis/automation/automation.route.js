const express = require("express");
const { startAutoSeed } = require("../../seed/autoSeed");
const router = express.Router();
let activeRun = null;
let lastRun = null;

function triggerAutoSeed(req, res) {
  if (activeRun) {
    return res.status(409).json({
      success: false,
      error: "Automation is already running",
    });
  }

  lastRun = { status: "running", startedAt: new Date().toISOString() };
  activeRun = startAutoSeed()
    .then((result) => {
      lastRun = {
        status: result?.success ? "success" : "failed",
        finishedAt: new Date().toISOString(),
        result,
      };
    })
    .catch((error) => {
      lastRun = {
        status: "failed",
        finishedAt: new Date().toISOString(),
        error: error.message,
      };
      console.error("Automation run failed:", error);
    })
    .finally(() => {
      activeRun = null;
    });

  return res.status(202).json({
    success: true,
    message: "Automation started",
    status: "/automation/status",
  });
}

router.get("/", triggerAutoSeed);
router.post("/", triggerAutoSeed);
router.get("/status", (req, res) =>
  res.json({ success: true, running: Boolean(activeRun), lastRun }),
);

module.exports = router;
