const mongoose = require("mongoose");

const rankingSchema = new mongoose.Schema({
  project_id: String,
  keyword: String,
  rank: Number,
  date: String
});

module.exports = mongoose.model("Ranking", rankingSchema);