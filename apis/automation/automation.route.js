const express = require("express");
const { autoseed } = require("../../seed/autoSeed");
const router = express.Router();

router.get("/", async (req, res) => {
  await autoseed();
  res.json({ message: "Automation route is working!" });
});

module.exports = router;
