const router = require("express").Router();
const { createSession, getSessions, getSession, deleteSession } = require("../controllers/sessionController");
const { createMessage } = require("../controllers/messageController");

router.post("/",createSession);    // /sessions
router.get("/",getSessions);       // /sessions?user_id=...
router.get("/:id",getSession);      //  /sessions/:id
router.delete("/:id",deleteSession);   //  /sessions/:id
router.post("/:id/messages",createMessage); //  /sessions/:id/messages

module.exports = router;