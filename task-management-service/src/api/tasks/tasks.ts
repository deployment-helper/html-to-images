import { Hono } from "hono";

const router = new Hono();

// Add your API routes here
router.get("/", (c) => {
  return c.json({ message: "API Router" });
});

router.post("/", (c) => {
  return c.json("POST call");
});

export default router;
