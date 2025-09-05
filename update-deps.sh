#!/bin/bash

# Update package.json with latest versions
echo "Updating package.json with latest versions..."

# Install or update Node.js if needed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js v18 or higher and try again."
    exit 1
fi

# Install or update npm
echo "Updating npm to latest version..."
npm install -g npm@latest

# Install required global packages
echo "Installing required global packages..."
npm install -g npm-check-updates

# Update all dependencies to latest versions
echo "Updating all dependencies to latest versions..."
ncu -u

# Install all dependencies
echo "Installing updated dependencies..."
npm install

# Initialize Husky for git hooks
echo "Setting up Husky for git hooks..."
npx husky install

# Create .husky/pre-commit file
echo "Configuring pre-commit hook..."
mkdir -p .husky
cat > .husky/pre-commit << 'EOL'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
EOL

chmod +x .husky/pre-commit

echo ""
echo "✅  Dependencies have been updated and configured successfully!"
echo "🚀  You can now start the development server with: npm run dev"
