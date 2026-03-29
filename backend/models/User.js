const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  api_keys: {
    serper: String,
    serpapi: String,
    serpstack: String,
    zenserp: String
  }
});

module.exports = mongoose.model("User", userSchema);