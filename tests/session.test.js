process.env.NODE_ENV = "test";
require("dotenv").config();

const request = require("supertest");
const app     = require("../app");
const pool    = require("../src/config/db");

// cleanup helper
async function cleanup(ids = []) {
    if (ids.length === 0) return;
    await pool.query("DELETE FROM sessions WHERE id = ANY($1::uuid[])", [ids]);
}

// Health
describe("GET /health", () => {
    it("returns 200 ok", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
    });
});

// Full lifecycle
describe("Full lifecycle", () => {
    let sessionId;
    it("POST /sessions — creates session", async () => {
        const res = await request(app)
            .post("/sessions")
            .send({ user_id: "test-user", title: "Test Chat" });
        expect(res.status).toBe(201);
        expect(res.body.user_id).toBe("test-user");
        expect(res.body.id).toBeTruthy();
        sessionId = res.body.id;
    });

    it("GET /sessions?user_id= — lists sessions", async () => {
        const res = await request(app).get("/sessions?user_id=test-user");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it("POST /sessions/:id/messages — appends user message", async () => {
        const res = await request(app)
            .post(`/sessions/${sessionId}/messages`)
            .send({ role: "user", content: "What is Article 47?" });
        expect(res.status).toBe(201);
        expect(res.body.role).toBe("user");
    });

    it("POST /sessions/:id/messages — appends assistant message with citations", async () => {
        const res = await request(app)
            .post(`/sessions/${sessionId}/messages`)
            .send({
                role: "assistant",
                content: "Article 47 covers...",
                citations: [{ source: "UAE Labour Law", article: "47" }]
            });
        expect(res.status).toBe(201);
        expect(res.body.citations).toBeTruthy();
    });

    it("GET /sessions/:id — returns session with messages in order", async () => {
        const res = await request(app).get(`/sessions/${sessionId}`);
        expect(res.status).toBe(200);
        expect(res.body.messages.length).toBe(2);
        expect(res.body.messages[0].role).toBe("user");
        expect(res.body.messages[1].role).toBe("assistant");
    });

    it("DELETE /sessions/:id — deletes + cascades to messages", async () => {
        const del = await request(app).delete(`/sessions/${sessionId}`);
        expect(del.status).toBe(204);

        // session gone
        expect((await request(app).get(`/sessions/${sessionId}`)).status).toBe(404);

        // messages cascade-deleted
        const { rows } = await pool.query(
            "SELECT id FROM messages WHERE session_id = $1", [sessionId]
        );
        expect(rows.length).toBe(0);
    });
});

// ── Validation — 400 on bad input
describe("Input validation", () => {
    const ids = [];
    afterAll(() => cleanup(ids));

    it("POST /sessions missing user_id → 400", async () => {
        const res = await request(app).post("/sessions").send({ title: "oops" });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/user_id/i);
    });

    it("GET /sessions missing user_id → 400", async () => {
        const res = await request(app).get("/sessions");
        expect(res.status).toBe(400);
    });

    it("POST message invalid role → 400", async () => {
        const s = await request(app).post("/sessions").send({ user_id: "u" });
        ids.push(s.body.id);
        const res = await request(app)
            .post(`/sessions/${s.body.id}/messages`)
            .send({ role: "admin", content: "hack" });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/role/i);
    });

    it("POST message missing content → 400", async () => {
        const s = await request(app).post("/sessions").send({ user_id: "u" });
        ids.push(s.body.id);
        const res = await request(app)
            .post(`/sessions/${s.body.id}/messages`)
            .send({ role: "user" });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/content/i);
    });

    it("GET /sessions/bad-uuid → 400", async () => {
        const res = await request(app).get("/sessions/not-a-uuid");
        expect(res.status).toBe(400);
    });

    it("DELETE nonexistent session → 404", async () => {
        const res = await request(app).delete("/sessions/00000000-0000-0000-0000-000000000000");
        expect(res.status).toBe(404);
    });
});

afterAll(() => pool.end());
