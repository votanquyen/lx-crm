#!/bin/bash

# Neon PostgreSQL Setup Script
# Automated setup for Lộc Xanh CRM with Neon database

set -e

echo "🚀 Neon PostgreSQL Setup for Lộc Xanh CRM"
echo "=========================================="
echo ""

# Check if DATABASE_URL is set
if [ -f .env ]; then
    echo "✅ .env file found"
else
    echo "⚠️  .env file not found"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
fi

echo ""
echo "📋 Setup Steps:"
echo "1. Create Neon account at https://neon.tech"
echo "2. Create a new project (PostgreSQL 17)"
echo "3. Copy the connection string"
echo ""

# Prompt for DATABASE_URL
read -p "📌 Paste your Neon DATABASE_URL (or press Enter to skip): " DATABASE_URL

if [ ! -z "$DATABASE_URL" ]; then
    # Update .env file
    if grep -q "^DATABASE_URL=" .env; then
        # Replace existing DATABASE_URL
        sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
        echo "✅ DATABASE_URL updated in .env"
    else
        # Add DATABASE_URL
        echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
        echo "✅ DATABASE_URL added to .env"
    fi

    echo ""
    echo "🔍 Testing database connection..."

    # Test connection
    if bunx prisma db execute --sql "SELECT 1 as test" > /dev/null 2>&1; then
        echo "✅ Database connection successful!"
    else
        echo "❌ Database connection failed"
        echo "⚠️  Please check your DATABASE_URL"
        exit 1
    fi

    echo ""
    echo "📦 Enabling PostGIS extension..."

    # Enable PostGIS
    if bunx prisma db execute --sql "CREATE EXTENSION IF NOT EXISTS postgis" > /dev/null 2>&1; then
        echo "✅ PostGIS enabled"
    else
        echo "⚠️  PostGIS extension may already be enabled or requires manual setup"
    fi

    echo ""
    echo "🔄 Running database migrations..."

    # Run migrations
    if bun run db:migrate; then
        echo "✅ Migrations applied successfully"
    else
        echo "❌ Migration failed"
        echo "⚠️  Please check the error above and try manually:"
        echo "   bun run db:migrate"
        exit 1
    fi

    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Start development server: bun dev"
    echo "2. Open Prisma Studio: bun run db:studio"
    echo "3. (Optional) Seed database: bun run db:seed"
    echo ""
    echo "📚 Full guide: docs/neon-setup-guide.md"

else
    echo ""
    echo "⏭️  Skipped automatic setup"
    echo ""
    echo "Manual setup instructions:"
    echo "1. Create Neon account: https://neon.tech"
    echo "2. Copy connection string"
    echo "3. Update DATABASE_URL in .env file"
    echo "4. Run: bun run db:migrate"
    echo ""
    echo "📚 Full guide: docs/neon-setup-guide.md"
fi

echo ""
echo "✨ Done!"
