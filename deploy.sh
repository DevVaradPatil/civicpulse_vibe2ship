#!/usr/bin/env bash
# CivicPulse → Google Cloud Run deploy (free-tier friendly).
# Usage: PROJECT_ID=your-project ./deploy.sh
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project)}"
REGION="${REGION:-us-central1}"   # Always-Free eligible region
SERVICE="${SERVICE:-civicpulse}"

echo "Deploying $SERVICE to project=$PROJECT_ID region=$REGION"

# One-time API enablement (safe to re-run):
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com --project "$PROJECT_ID"

# Build from source (Cloud Build uses our Dockerfile) and deploy.
gcloud run deploy "$SERVICE" \
  --source . \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --port 8080
# Env vars (Gemini key, Firebase, GCS) are added later via:
#   gcloud run services update civicpulse --update-env-vars KEY=VALUE ...
