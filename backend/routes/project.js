const express = require("express");
const router = express.Router();

const Project = require("../models/Project");

// ================= CREATE PROJECT =================
router.post("/add", async (req, res) => {
  try {
    const { user_id, domain, keywords } = req.body;

    if (!user_id || !domain || !keywords) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const project = await Project.create({
      user_id,
      domain,
      keywords
    });

    res.json(project);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= GET PROJECTS =================
router.get("/:user_id", async (req, res) => {
  try {
    const projects = await Project.find({
      user_id: req.params.user_id
    });

    res.json(projects);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;