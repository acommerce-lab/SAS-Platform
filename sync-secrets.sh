#!/bin/bash

# Simple script to sync local .env secrets to GitHub Repository Secrets automatically.
# Required: GitHub CLI (gh) installed and logged in (gh auth login).

if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed. Please install it first: https://cli.github.com"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "❌ Error: You are not logged in to GitHub CLI. Please run: gh auth login"
    exit 1
fi

if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Please make sure .env is in the root directory."
    exit 1
fi

echo "🚀 Starting to sync secrets to GitHub Repository..."

while IFS= read -r line || [ -n "$line" ]; do
    # Skip comments and empty lines
    if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ -n "$line" ]]; then
        # Extract key and value
        key=$(echo "$line" | cut -d'=' -f1 | tr -d '[:space:]')
        val=$(echo "$line" | cut -d'=' -f2- | sed -e 's/^[[:space:]]*"//' -e 's/"[[:space:]]*$//')
        
        if [ -n "$key" ] && [ -n "$val" ]; then
            echo "🔑 Uploading $key..."
            # Set GitHub secret
            if echo -n "$val" | gh secret set "$key"; then
                echo "✅ $key set successfully."
            else
                echo "❌ Failed to set $key."
            fi
        fi
    fi
done < .env

echo "🎉 All secrets have been synced to GitHub!"
