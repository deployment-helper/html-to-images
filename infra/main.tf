
# Example GitHub repository
resource "github_repository" "html_to_images" {
  name        = "html-to-images"
  description = "A service for converting HTML to images"

  visibility = var.github_repo_visibility

  has_issues   = true
  has_projects = true
  has_wiki     = true

  auto_init = false

  license_template = "mit"

  vulnerability_alerts = false
}

resource "google_pubsub_topic" "topic1" {
  name = "html-to-image-task"
  labels = {
    "terraform" : true
  }
  message_retention_duration = "36000s"
}

resource "google_pubsub_subscription" "topic1_subscription" {
  topic = google_pubsub_topic.topic1.name
  name  = "gcp-pipeline"
  labels = {
    "terraform" : true
  }
  depends_on = [google_pubsub_topic.topic1]
}


resource "github_repository_environment" "gcp" {
  repository  = github_repository.html_to_images.name
  environment = "gcp"
}
resource "github_actions_environment_variable" "topic1" {
  repository    = github_repository.html_to_images.name
  environment   = github_repository_environment.gcp.environment
  value         = google_pubsub_topic.topic1.id
  variable_name = "TOPIC1"
  depends_on    = [github_repository_environment.gcp, google_pubsub_topic.topic1]
}

resource "github_actions_environment_variable" "subscription1" {
  repository    = github_repository.html_to_images.name
  environment   = github_repository_environment.gcp.environment
  value         = google_pubsub_subscription.topic1_subscription.id
  variable_name = "SUBSCRIPTION1"
  depends_on    = [github_repository_environment.gcp]
}


