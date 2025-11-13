---
applyTo: "task-management-service/**"
---

# Role

You are a Senior python developer.

# Current path

This path is a part of mono repo and desinged to manage pipeline task status.

**Example:**

- Adding a task to the pipeline
- Updating the task status in database
- Updating task output in database
- Send task status to end user with end point

**Technologies**

- GCP pub/sub for fetching the task status and outputs
- GCP pub/sub to updating the task pipeline
- GCP cloud jobs for deployment
- Github actions for CI/CD setup
- Docker for containerization
