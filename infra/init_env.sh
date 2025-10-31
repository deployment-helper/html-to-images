#!/bin/bash

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
