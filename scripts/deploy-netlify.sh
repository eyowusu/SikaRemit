#!/bin/bash

# SikaRemit Netlify Deployment Script
echo "🚀 Deploying SikaRemit frontend to Netlify..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Check if logged in
if ! netlify whoami &> /dev/null; then
    echo "Please login to Netlify:"
    netlify login
fi

cd frontend

echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

# Deploy to Netlify
echo "Deploying to Netlify..."
netlify deploy --prod --dir=out

echo "✅ Frontend deployed successfully!"
echo "Note: Update your DNS settings with the provided Netlify domain"
