const express = require("express");
const cors = require("cors");
const bfhlRouter = require("./routes/bfhl");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/bfhl", bfhlRouter);

// Health check
app.get("/", (req, res) => res.json({ status: "Hierarchy Lab API running" }));

module.exports = app;