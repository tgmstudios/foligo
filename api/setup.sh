#!/bin/bash

# Foligo API Setup Script
# This script sets up the development environment for the Foligo API

set -e

echo "🚀 Setting up Foligo API..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before continuing"
    echo "   - Set DATABASE_URL to your PostgreSQL connection string"
    echo "   - Set REDIS_URL to your Redis connection string"
    echo "   - Set JWT_SECRET to a secure random string"
    echo ""
    read -p "Press Enter after you've configured .env file..."
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Check if PostgreSQL is available
echo "🗄️  Checking database connection..."
if npm run db:migrate 2>/dev/null; then
    echo "✅ Database migrations completed"
else
    echo "⚠️  Database migration failed. Please ensure PostgreSQL is running and DATABASE_URL is correct."
    echo "   You can run 'npm run db:migrate' manually after fixing the connection."
fi

# Check if Redis is available
echo "🔴 Checking Redis connection..."
if node -e "
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL || 'redis://localhost:6379');
client.connect().then(() => {
    console.log('✅ Redis connection successful');
    client.disconnect();
    process.exit(0);
}).catch(() => {
    console.log('⚠️  Redis connection failed. Please ensure Redis is running.');
    process.exit(1);
});
" 2>/dev/null; then
    echo "✅ Redis connection successful"
else
    echo "⚠️  Redis connection failed. Please ensure Redis is running."
fi

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads

# Seed database (optional)
echo ""
read -p "Would you like to seed the database with sample data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npm run db:seed
    echo "✅ Database seeded with sample data"
    echo ""
    echo "🔑 Sample login credentials:"
    echo "   Email: john@example.com, Password: password123"
    echo "   Email: jane@example.com, Password: password123"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Start the development server: npm run dev"
echo "   2. Visit API documentation: http://localhost:3000/api-docs"
echo "   3. Test the health endpoint: http://localhost:3000/health"
echo ""
echo "🔧 Available commands:"
echo "   npm run dev          - Start development server"
echo "   npm start            - Start production server"
echo "   npm run db:migrate   - Run database migrations"
echo "   npm run db:seed      - Seed database with sample data"
echo "   npm test             - Run tests"
echo "   npm run lint         - Run ESLint"
echo ""
echo "🐳 Docker alternative:"
echo "   docker-compose up -d  - Start all services with Docker"
echo ""
echo "Happy coding! 🚀"
