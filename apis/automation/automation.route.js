const express = require("express");
const { startAutoSeed } = require("../../seed/autoSeed");
const router = express.Router();
let activeRun = null;
let lastRun = null;

async function triggerAutoSeed(req, res, next) {
  if (activeRun) {
    return res.status(409).json({
      success: false,
      error: "Automation is already running",
    });
  }

  lastRun = { status: "running", startedAt: new Date().toISOString() };
  activeRun = startAutoSeed();

  try {
    const result = await activeRun;
    lastRun = {
      status: result?.success ? "success" : "failed",
      finishedAt: new Date().toISOString(),
      result,
    };
    return res.status(result?.success ? 200 : 502).json({
      success: Boolean(result?.success),
      result,
    });
  } catch (error) {
    lastRun = {
      status: "failed",
      finishedAt: new Date().toISOString(),
      error: error.message,
    };
    return next(error);
  } finally {
    activeRun = null;
  }
}

router.get("/", triggerAutoSeed);
router.post("/", triggerAutoSeed);
router.get("/status", (req, res) =>
  res.json({ success: true, running: Boolean(activeRun), lastRun }),
);

module.exports = router;
