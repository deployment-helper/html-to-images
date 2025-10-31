
terraform {
  backend "gcs" {
    prefix = "html_to_images"
    bucket = "vm-terraform-state-file"
  }
}
