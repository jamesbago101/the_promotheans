#!/bin/bash

# Deployment script for The Prometheans website
# Usage: ./deploy.sh [VPS_USER@VPS_IP] [DEPLOY_PATH]

VPS_HOST="${1:-user@your-vps-ip}"
DEPLOY_PATH="${2:-/var/www/theprometheans}"

echo "🚀 Starting deployment to VPS..."
echo "📍 Target: $VPS_HOST:$DEPLOY_PATH"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if rsync is available
if ! command -v rsync &> /dev/null; then
    echo -e "${RED}❌ rsync is not installed. Please install it first.${NC}"
    exit 1
fi

# Exclude unnecessary files
EXCLUDE_FILE=$(mktemp)
cat > "$EXCLUDE_FILE" << EOF
node_modules/
.git/
.gitignore
*.md
DEPLOYMENT.md
deploy.sh
package.json
package-lock.json
EOF

echo -e "${YELLOW}📦 Syncing files...${NC}"

# Sync files to VPS
rsync -avz --progress \
    --exclude-from="$EXCLUDE_FILE" \
    --delete \
    ./ "$VPS_HOST:$DEPLOY_PATH/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Files synced successfully!${NC}"
    
    # Reload Nginx on remote server
    echo -e "${YELLOW}🔄 Reloading Nginx...${NC}"
    ssh "$VPS_HOST" "sudo systemctl reload nginx"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Nginx reloaded successfully!${NC}"
        echo -e "${GREEN}🎉 Deployment completed!${NC}"
    else
        echo -e "${RED}❌ Failed to reload Nginx. Please check manually.${NC}"
    fi
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi

# Cleanup
rm "$EXCLUDE_FILE"

