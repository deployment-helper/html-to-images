import { Hono } from "hono";

import { authMiddleware } from "./auth/auth";
import tasksRouter from "./tasks/tasks";

const apiRouter = new Hono();

// Apply authentication middleware to all routes
apiRouter.use(authMiddleware);

// Mount the tasks router under /tasks endpoint
apiRouter.route("/tasks", tasksRouter);

// Add your API routes here
apiRouter.get("/", (c) => {
  return c.json({ message: "API Router" });
});

export default apiRouter;
