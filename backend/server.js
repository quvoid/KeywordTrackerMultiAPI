require("dotenv").config()
const express = require("express");
const app = express();
require("./db");

app.use(express.json());
app.use(require("cors")());

app.use("/auth", require("./routes/auth"));
app.use("/project", require("./routes/project"));
app.use("/tracker", require("./routes/tracker"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>