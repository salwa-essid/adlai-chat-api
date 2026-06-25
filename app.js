require("dotenv").config();
const express = require("express");
const app = express();


app.use(express.json());
app.use("/sessions", require("./src/routes/sessionRoutes"));
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});
// Global error handler
app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err.message);
    res.status(500).json({ error: "Internal server error." });
});


module.exports = app;