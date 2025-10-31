import { Hono } from "hono";
import { config } from "dotenv";
config();

import apiRouter from "./api";

const app = new Hono();

app.route("/api", apiRouter);
app.get("/health", (c) => {
  return c.json("ok");
});

export default app;
