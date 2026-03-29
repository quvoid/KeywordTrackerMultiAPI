const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  user_id: String,
  domain: String,
  keywords: [String]
});

module.exports = mongoose.model("Project", projectSchema);