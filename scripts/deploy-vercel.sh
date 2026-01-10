#!/bin/bash

# SikaRemit Vercel Deployment Script
echo "🚀 Deploying SikaRemit frontend to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "Please login to Vercel:"
    vercel login
fi

cd frontend

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "✅ Frontend deployed successfully!"
echo "Note: Update your DNS settings with the provided Vercel domain"
