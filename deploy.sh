#!/bin/bash

# VidStream Deployment Script

echo "🚀 Starting VidStream deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ to continue."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm to continue."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local file not found. Please create it with your Firebase configuration."
    echo "📋 Copy .env.local.example to .env.local and add your Firebase config."
    cp .env.local.example .env.local
    echo "✅ Created .env.local template. Please update it with your Firebase configuration."
fi

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "🎉 VidStream is ready to deploy!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Set up your Firebase project and add configuration to .env.local"
    echo "   2. Deploy Cloud Functions: cd functions && npm install && cd .. && firebase deploy --only functions"
    echo "   3. Deploy to Vercel: vercel --prod"
    echo "   4. Or deploy to Firebase: firebase deploy --only hosting"
    echo ""
    echo "🌐 For local development: npm run dev"
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi