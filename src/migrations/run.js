
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
async function runMigration() {
    try {
        const result = await pool.query("SELECT NOW()");
        console.log(result.rows[0]);
        const sql = fs.readFileSync(
            path.join(__dirname, "create_chat_tables.sql"),
            "utf8"
        );
        await pool.query(sql);
        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error.message);
        process.exit(1);
    }
}

runMigration();