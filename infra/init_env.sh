#!/bin/bash

# HTML to Images - Terraform Infrastructure Setup Script
# This script helps initialize the Terraform environment

set -e

echo "🚀 HTML to Images - Terraform Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed. Please install Terraform first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Terraform is installed${NC}"


# Script to export variables from .env file as environment variables in the current shell session
# Usage: source export_tf_vars.sh

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found in the current directory."
    exit 1
fi

while IFS= read -r line; do
    # Skip empty lines and lines starting with #
    [[ -z "$line" || "$line" =~ ^# ]] && continue
    echo "Exporting: $line"
    export "$line"
done < "$ENV_FILE"

echo "Exported variables from $ENV_FILE"

# Check if required variables are set
if [ -z "$TF_VAR_github_token" ]; then
    echo -e "${YELLOW}⚠️  GitHub token not set. Please export TF_VAR_github_token${NC}"
    echo "   export TF_VAR_github_token='your-github-token'"
fi

if [ -z "$TF_VAR_gcp_project_id" ]; then
    echo -e "${YELLOW}⚠️  GCP Project ID not set in terraform.tfvars or environment${NC}"
    echo "   Either update terraform.tfvars or export TF_VAR_gcp_project_id='your-project-id'"
fi

echo ""
echo "📋 Next steps:"
echo "1. Update terraform.tfvars with your actual values"
echo "2. Set your GitHub token: export TF_VAR_github_token='your-token'"
echo "3. Initialize Terraform: terraform init -backend-config='bucket=your-state-bucket'"
echo "4. Plan: terraform plan"
echo "5. Apply: terraform apply"
echo ""
echo "The GitHub repository 'html-to-images' will be created by Terraform!"

# Check if gcloud is authenticated
if command -v gcloud &> /dev/null; then
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null; then
        echo -e "${GREEN}✅ Google Cloud SDK is authenticated${NC}"
    else
        echo -e "${YELLOW}⚠️  Google Cloud SDK not authenticated. Run: gcloud auth application-default login${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Google Cloud SDK not found. Install it if you plan to use GCP resources.${NC}"
fi


