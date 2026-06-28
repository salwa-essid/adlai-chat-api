const pool = require("../config/db");

async function createMessage(sessionId, role, content, citations = null
) {
    const result = await pool.query(
        `INSERT INTO messages
        (session_id, role, content, citations)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [sessionId, role, content,  citations ? JSON.stringify(citations) : null]
    );
    return result.rows[0];
}
async function getMessagesBySession(sessionId) {
    const result = await pool.query(
        `SELECT *
         FROM messages
         WHERE session_id = $1
         ORDER BY created_at ASC`,
        [sessionId]
    );

    return result.rows;
}

async function deleteMessagesBySession(sessionId) {
    await pool.query(
        `DELETE FROM messages
         WHERE session_id = $1`,
        [sessionId]
    );
}

module.exports = {
    createMessage,
    getMessagesBySession,
    deleteMessagesBySession
};