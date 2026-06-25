require("dotenv").config();
const express = require("express");
const app = express();


app.use(express.json());
app.use("/sessions", require("./src/routes/sessionRoutes"));
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

module.exports = app;