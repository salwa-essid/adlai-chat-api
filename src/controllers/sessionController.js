const sessionModel = require("../models/sessionModel");
const messageModel = require("../models/messageModel");

async function createSession(req, res) {
    try {
        console.log("BODY =", req.body);
        const { user_id,title } = req.body;
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
        const sessions = await sessionModel.getSessionsByUser(user_id);
        res.json(sessions);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

async function getSession(req, res) {
    try {
        const { id } = req.params;
        const session = await sessionModel.getSessionById(id);
        if (!session) {
            return res.status(404).json({error: "Session not found"});
        }
        const messages = await messageModel.getMessagesBySession(id);
        res.json({...session, messages});

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

async function deleteSession(req, res) {
    try {
        const { id } = req.params;
        await sessionModel.deleteSession(id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

module.exports = {
    createSession,
    getSessions,
    getSession,
    deleteSession
};