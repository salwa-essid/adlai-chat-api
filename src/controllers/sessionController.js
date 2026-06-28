const sessionModel = require("../models/sessionModel");
const messageModel = require("../models/messageModel");

async function createSession(req, res) {
    try {
        const { user_id,title } = req.body;
        if(!user_id|| !title){
            return res.status(400).json({error: "user_id or title are required"});
        }
        if (
            typeof user_id !== "string" || typeof title !== "string"
        ) {
            return res.status(400).json({
                error: "user_id and title must be strings"
            });
        }

        const session = await sessionModel.createSession(
            user_id,
            title
        );
        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}
async function getSessions(req, res) {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({
                error: "user_id is required"
            });
        }
        const sessions = await sessionModel.getSessionsByUser(user_id);
        return res.json(sessions);

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
}
async function getSession(req, res) {
    try {
        const { id } = req.params;
        const session = await sessionModel.getSessionById(id);
        if (!session) {
            return res.status(404).json({
                error: "Session not found"
            });
        }
        const messages = await messageModel.getMessagesBySession(id);
        res.json({
            ...session,
            messages
        });

    } catch (error) {
        if (error.code === "22P02") {
            return res.status(400).json({
                error: "Invalid session ID format"
            });
        }

        console.error("getSession error:", error.message);

        res.status(500).json({
            error: "Failed to retrieve session"
        });
    }
}
async function deleteSession(req, res) {
    try {
        const { id } = req.params;
        const deleted = await sessionModel.deleteSession(id);
        if (!deleted) {
            return res.status(404).json({
                error: "Session not found."
            });
        }
        return res.sendStatus(204);
    } catch (err) {
        if (err.code === "22P02") {
            return res.status(400).json({
                error: "Invalid session ID format."
            });
        }
        console.error("deleteSession error:", err.message);
        return res.status(500).json({
            error: "Failed to delete session."
        });
    }
}


module.exports = {
    createSession,
    getSessions,
    getSession,
    deleteSession
};