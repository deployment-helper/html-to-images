# Google Cloud outputs
output "gcp_project_id" {
  description = "The GCP project ID"
  value       = var.gcp_project_id
}

output "gcp_region" {
  description = "The GCP region"
  value       = var.gcp_region
}


# GitHub outputs
output "github_repository_name" {
  description = "Name of the GitHub repository"
  value       = github_repository.html_to_images.name
}

output "github_repository_full_name" {
  description = "Full name of the GitHub repository"
  value       = github_repository.html_to_images.full_name
}


# General outputs
output "environment" {
  description = "Current environment"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}
