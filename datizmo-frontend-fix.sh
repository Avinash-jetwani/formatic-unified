#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Frontend Fix Script${NC}"

# Make sure we're in the project root
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📁 Project root: ${PROJECT_ROOT}${NC}"

# Create a simplified next.config.js file that works
echo -e "${BLUE}📝 Creating simplified Next.js configuration...${NC}"

cat > frontend/next.config.js << EOL
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['formatic-uploads-dev.s3.amazonaws.com', 'formatic-uploads-dev.s3.eu-west-2.amazonaws.com'],
  },
  // Simplified configuration - just what's needed to run
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
EOL

echo -e "${GREEN}✅ Next.js config simplified${NC}"

# Create a server.js file for custom server to avoid static generation issues
echo -e "${BLUE}📝 Creating custom server.js file...${NC}"

cat > frontend/server.js << EOL
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = 3000

// Create the Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true)
      const { pathname, query } = parsedUrl

      // Special handling for reset-password route
      if (pathname === '/reset-password') {
        app.render(req, res, '/reset-password-fixed', query)
      } else {
        // Let Next.js handle the request
        await handle(req, res, parsedUrl)
      }
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(
        \`> Ready on http://\${hostname}:\${port} - env \${process.env.NODE_ENV}\`
      )
    })
})
EOL

echo -e "${GREEN}✅ Custom server created${NC}"

# Update package.json with custom server script
echo -e "${BLUE}📝 Updating package.json scripts...${NC}"
cd frontend
cp package.json package.json.bak
sed -i 's/"start-dynamic": "next start -H 0.0.0.0"/"start-dynamic": "node server.js"/g' package.json
echo -e "${GREEN}✅ Updated package.json with custom server script${NC}"

# Create a development build instead of production build
echo -e "${BLUE}🔧 Creating development build for increased compatibility...${NC}"
# Replace the build script to use development mode
cat > build-with-memory-limit.js << EOL
const { execSync } = require('child_process');

console.log('Starting Next.js development build with memory limits...');

// Run build with reduced memory limit and development mode
try {
  execSync('NODE_OPTIONS="--max-old-space-size=512" NODE_ENV=development next build', {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
EOL

echo -e "${GREEN}✅ Development build script created${NC}"

# Return to project root
cd "$PROJECT_ROOT"

# Restart services
echo -e "${BLUE}🔄 Restarting services with fixed configuration...${NC}"
cd frontend
if pm2 list | grep -q "datizmo-frontend"; then
  pm2 stop datizmo-frontend
  pm2 delete datizmo-frontend
fi
pm2 start npm --name datizmo-frontend -- run start-dynamic

# Return to project root
cd "$PROJECT_ROOT"

echo -e "${GREEN}🎉 Frontend fixes complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${BLUE}1. Check if services are running: pm2 list${NC}"
echo -e "${BLUE}2. Check frontend logs: pm2 logs datizmo-frontend${NC}"
echo -e "${BLUE}3. Save PM2 config: pm2 save${NC}" 