# HTML to Images - Infrastructure

This Terraform project manages the infrastructure for the HTML to Images project, including GitHub repository setup and Google Cloud Platform resources.

## Prerequisites

1. **Terraform**: Install Terraform >= 1.0
2. **Google Cloud SDK**: Install and authenticate with `gcloud auth application-default login`
3. **GitHub Token**: Create a GitHub Personal Access Token with appropriate permissions

## Setup

### 1. Configure Variables

Edit `terraform.tfvars` with your specific values:

```hcl
gcp_project_id = "your-actual-gcp-project-id"
github_owner   = "your-github-username"
# ... other variables
```

### 2. Set Environment Variables

For sensitive values, use environment variables:

```bash
export TF_VAR_github_token="your-github-token"
```

### 3. Initialize Terraform

```bash
# Initialize with GCS backend
terraform init -backend-config="bucket=your-terraform-state-bucket"
```

### 4. Plan and Apply

```bash
# Review the planned changes
terraform plan

# Apply the changes (this will create the GitHub repository!)
terraform apply
```

## GitHub Repository Creation

The Terraform configuration includes a `github_repository` resource that will create the `html-to-images` repository on GitHub when you run `terraform apply`. The repository will be created with:

- Private visibility (configurable via `github_repo_visibility` variable)
- Issues, Projects, and Wiki enabled
- MIT license
- Terraform gitignore template
- Auto-initialization

Make sure your GitHub token has the necessary permissions to create repositories.

## Resources Created

- **Google Cloud Storage Bucket**: For application storage with lifecycle management
- **GitHub Repository**: The `html-to-images` repository with standard configuration (created via Terraform)

## Providers Used

- **Google Cloud Provider**: For GCP resources
- **GitHub Provider**: For GitHub repository management

## Backend Configuration

This project uses Google Cloud Storage (GCS) as the Terraform backend for state management. Configure the bucket during initialization:

```bash
terraform init -backend-config="bucket=your-terraform-state-bucket"
```

## File Structure

- `main.tf`: Main Terraform configuration with providers and resources
- `variables.tf`: Variable definitions
- `outputs.tf`: Output definitions
- `terraform.tfvars`: Default variable values (customize this file)

## Security Notes

- Never commit `terraform.tfvars` with real sensitive values
- Use environment variables for sensitive data like tokens
- Ensure your GCS state bucket has proper access controls