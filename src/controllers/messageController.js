const messageModel = require("../models/messageModel");

async function createMessage(req, res) {
    try {
        const { id } = req.params;
        console.log('body',req.body)
        const { role, content, citations } = req.body;
        if (!role || !content) {
            return res.status(400).json({
                error: "role and content are required"
            });
        }
        if (!["user", "assistant"].includes(role)) {
            return res.status(400).json({
                error: "role must be user or assistant"
            });
        }
        if (
            typeof content !== "string"
        ) {
            return res.status(400).json({
                error: "content must be a string"
            });
        }
        if (
            citations !== undefined &&
            citations !== null &&
            !Array.isArray(citations)
        ) {
            return res.status(400).json({
                error: "citations must be an array"
            });
        }
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