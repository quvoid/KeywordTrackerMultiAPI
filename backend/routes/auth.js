const express = require("express");
const router = express.Router();

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);

    const user = await User.create({
      email: req.body.email,
      password: hashed
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(req.body.password, user.password);

    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ token, userId: user._id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= SAVE API KEYS =================
router.post("/save-keys", async (req, res) => {
  try {
    const { userId, api_keys } = req.body;

    if (!userId || !api_keys) {
      return res.status(400).json({ error: "Missing data" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { api_keys },
      { new: true }
    );

    res.json(user);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;