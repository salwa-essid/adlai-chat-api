const pool = require("../config/db");

async function createSession(userId, title) {
    const result = await pool.query(
        `INSERT INTO sessions (user_id, title)
         VALUES ($1, $2)
         RETURNING *`,
        [userId, title]
    );

    return result.rows[0];
}

async function getSessionById(id) {
    const result = await pool.query(
        "SELECT * FROM sessions WHERE id = $1",
        [id]
    );

    return result.rows[0];
}

async function getSessionsByUser(userId) {
    const result = await pool.query(
        "SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
    );

    return result.rows;
}

async function deleteSession(id) {
    await pool.query(
        "DELETE FROM sessions WHERE id = $1",
        [id]
    );
}

module.exports = {
    createSession,
    getSessionById,
    getSessionsByUser,
    deleteSession,
};