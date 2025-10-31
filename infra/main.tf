terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
  zone    = var.gcp_zone
}

# Configure the GitHub Provider
provider "github" {
  token = var.github_token
  owner = var.github_owner
}


# Example GitHub repository
resource "github_repository" "html_to_images" {
  name        = "html-to-images"
  description = "A service for converting HTML to images"

  visibility = var.github_repo_visibility

  has_issues   = true
  has_projects = true
  has_wiki     = true

  auto_init = true

  gitignore_template = "node.js"
  license_template   = "mit"
}
