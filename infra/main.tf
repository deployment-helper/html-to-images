
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
}
