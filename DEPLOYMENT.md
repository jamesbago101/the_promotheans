# VPS Deployment Guide for The Prometheans

This guide will help you deploy your static website to a VPS using Nginx.

## Prerequisites

- A VPS with Ubuntu/Debian (or similar Linux distribution)
- SSH access to your VPS
- A domain name (optional but recommended)
- Basic command line knowledge

## Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

## Step 2: Install Nginx

```bash
# Update package list
sudo apt update

# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

## Step 3: Create Website Directory

```bash
# Create directory for your website
sudo mkdir -p /var/www/theprometheans

# Set proper permissions
sudo chown -R $USER:$USER /var/www/theprometheans
sudo chmod -R 755 /var/www/theprometheans
```

## Step 4: Transfer Files to VPS

### Option A: Using SCP (from your local machine)

```bash
# From your local machine (Windows), use PowerShell or Git Bash
scp -r * username@your-vps-ip:/var/www/theprometheans/

# Or using WinSCP (GUI tool for Windows)
```

### Option B: Using Git (Recommended)

```bash
# On your VPS
cd /var/www/theprometheans
git clone https://github.com/jamesbago101/the_promotheans.git .

# Or if you want to set up auto-deploy
git clone https://github.com/jamesbago101/the_promotheans.git /var/www/theprometheans
```

### Option C: Using rsync (from your local machine)

```bash
# From your local machine
rsync -avz --exclude 'node_modules' --exclude '.git' ./ username@your-vps-ip:/var/www/theprometheans/
```

## Step 5: Configure Nginx

Create Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/theprometheans
```

Add the following configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name your-domain.com www.your-domain.com;
    # Or use your VPS IP if no domain: server_name _;
    
    root /var/www/theprometheans;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|webp|ttf|otf|mp3|MP3)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/theprometheans /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 6: Set Up SSL with Let's Encrypt (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Or if using IP only, skip SSL for now
```

Certbot will automatically update your Nginx config to use HTTPS.

## Step 7: Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

## Step 8: Test Your Website

Visit your domain or VPS IP in a browser:
- `http://your-domain.com` or `http://your-vps-ip`
- `https://your-domain.com` (if SSL is configured)

## Auto-Deploy Script (Optional)

Create a script to automatically pull updates from GitHub:

```bash
sudo nano /var/www/theprometheans/deploy.sh
```

Add:

```bash
#!/bin/bash
cd /var/www/theprometheans
git pull origin master
sudo systemctl reload nginx
echo "Deployment completed at $(date)"
```

Make it executable:

```bash
chmod +x /var/www/theprometheans/deploy.sh
```

## Troubleshooting

### Check Nginx logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check file permissions
```bash
ls -la /var/www/theprometheans
```

### Restart Nginx
```bash
sudo systemctl restart nginx
```

### Check if Nginx is running
```bash
sudo systemctl status nginx
```

## Maintenance

### Update website files
```bash
cd /var/www/theprometheans
git pull origin master
sudo systemctl reload nginx
```

### Renew SSL certificate (automatic, but you can test)
```bash
sudo certbot renew --dry-run
```

## Performance Optimization

1. **Enable Gzip** (already in config above)
2. **Use CDN** for static assets (Cloudflare, etc.)
3. **Optimize images** before uploading
4. **Enable browser caching** (already configured)

## Security Tips

1. Keep your VPS updated: `sudo apt update && sudo apt upgrade`
2. Use SSH keys instead of passwords
3. Regularly check logs for suspicious activity
4. Keep Nginx updated
5. Use strong passwords for all accounts

