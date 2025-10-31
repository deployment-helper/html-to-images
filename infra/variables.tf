
# Google Cloud Platform variables
variable "gcp_project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "gcp_project_number" {
  description = "The GCP project number"
  type        = string
}

variable "gcp_region" {
  description = "The GCP region for resources"
  type        = string
  default     = "us-central1"
}

variable "gcp_zone" {
  description = "The GCP zone for resources"
  type        = string
  default     = "us-central1-a"
}

# GitHub variables
variable "github_token" {
  description = "GitHub personal access token"
  type        = string
  sensitive   = true
}

variable "github_owner" {
  description = "GitHub username or organization name"
  type        = string
}

variable "github_repo_visibility" {
  description = "GitHub repository visibility"
  type        = string
}

# General variables
variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

# Project-specific variables
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "html-to-images"
}
