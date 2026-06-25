const messageModel = require("../models/messageModel");

async function createMessage(req, res) {
    try {
        const { id } = req.params;
        console.log('bodyyyyy',req.body)
        const { role, content, citations } = req.body;
        const message = await messageModel.createMessage(
            id,
            role,
            content,
            citations
        );

        res.status(201).json(message);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

module.exports = {
    createMessage
};