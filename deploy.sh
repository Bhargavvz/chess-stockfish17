#!/bin/bash

# Chess App Deployment Script for Oracle VM
# Usage: ./deploy.sh [option]
# Options: static, pm2, docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="chess-app"
APP_DIR="/home/$(whoami)/$APP_NAME"
DOMAIN="your-domain.com"  # Change this to your domain
VM_IP=$(curl -s http://checkip.amazonaws.com/ || echo "YOUR_VM_IP")

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
check_user() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
    fi
}

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
    else
        error "Cannot detect OS"
    fi
    log "Detected OS: $OS $VERSION"
}

# Install dependencies based on OS
install_dependencies() {
    log "Installing dependencies..."
    
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        sudo apt update
        sudo apt install -y nginx nodejs npm git curl
        NGINX_USER="www-data"
        NGINX_SITES_DIR="/etc/nginx/sites-available"
        NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
    elif [[ "$OS" == "centos" || "$OS" == "rhel" || "$OS" == "ol" ]]; then
        sudo yum update -y
        sudo yum install -y nginx nodejs npm git curl
        NGINX_USER="nginx"
        NGINX_SITES_DIR="/etc/nginx/conf.d"
        NGINX_ENABLED_DIR="/etc/nginx/conf.d"
    else
        error "Unsupported OS: $OS"
    fi
}

# Configure firewall
configure_firewall() {
    log "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        sudo ufw allow 80
        sudo ufw allow 443
        sudo ufw allow 22
        sudo ufw --force enable
    elif command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --reload
    else
        warn "No supported firewall found"
    fi
}

# Build application
build_app() {
    log "Building application..."
    
    if [ ! -d "$APP_DIR" ]; then
        error "Application directory not found: $APP_DIR"
    fi
    
    cd "$APP_DIR"
    npm install
    npm run build
}

# Deploy static files with Nginx
deploy_static() {
    log "Deploying static files..."
    
    build_app
    
    # Copy build files
    sudo cp -r "$APP_DIR/build/"* /var/www/html/
    sudo chown -R $NGINX_USER:$NGINX_USER /var/www/html/
    
    # Configure Nginx
    sudo tee "$NGINX_SITES_DIR/$APP_NAME.conf" > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN $VM_IP;
    root /var/www/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

    # Enable site (Ubuntu/Debian)
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        sudo ln -sf "$NGINX_SITES_DIR/$APP_NAME.conf" "$NGINX_ENABLED_DIR/"
        sudo rm -f "$NGINX_ENABLED_DIR/default"
    fi
    
    # Test and restart Nginx
    sudo nginx -t
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    log "Static deployment completed!"
}

# Deploy with PM2
deploy_pm2() {
    log "Deploying with PM2..."
    
    build_app
    
    # Install PM2 and additional dependencies
    sudo npm install -g pm2
    cd "$APP_DIR"
    npm install express compression helmet
    
    # Create logs directory
    mkdir -p "$APP_DIR/logs"
    
    # Start application with PM2
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
    
    # Configure Nginx as reverse proxy
    sudo tee "$NGINX_SITES_DIR/$APP_NAME.conf" > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN $VM_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable site (Ubuntu/Debian)
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        sudo ln -sf "$NGINX_SITES_DIR/$APP_NAME.conf" "$NGINX_ENABLED_DIR/"
        sudo rm -f "$NGINX_ENABLED_DIR/default"
    fi
    
    # Test and restart Nginx
    sudo nginx -t
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    log "PM2 deployment completed!"
}

# Deploy with Docker
deploy_docker() {
    log "Deploying with Docker..."
    
    # Install Docker
    if ! command -v docker &> /dev/null; then
        log "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        
        warn "Please log out and log back in for Docker permissions to take effect"
        warn "Then run: docker build -t $APP_NAME . && docker run -d -p 80:80 --name ${APP_NAME}-container $APP_NAME"
        return
    fi
    
    cd "$APP_DIR"
    
    # Build Docker image
    docker build -t $APP_NAME .
    
    # Stop existing container if running
    docker stop "${APP_NAME}-container" 2>/dev/null || true
    docker rm "${APP_NAME}-container" 2>/dev/null || true
    
    # Run new container
    docker run -d -p 80:80 --name "${APP_NAME}-container" --restart unless-stopped $APP_NAME
    
    log "Docker deployment completed!"
}

# Show deployment status
show_status() {
    log "Deployment Status:"
    echo "===================="
    echo "Application URL: http://$VM_IP"
    echo "Domain URL: http://$DOMAIN"
    echo ""
    
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx: Running"
    else
        echo "❌ Nginx: Not running"
    fi
    
    if command -v pm2 &> /dev/null && pm2 describe $APP_NAME &> /dev/null; then
        echo "✅ PM2: Running"
        pm2 status
    fi
    
    if command -v docker &> /dev/null && docker ps | grep -q "${APP_NAME}-container"; then
        echo "✅ Docker: Running"
        docker ps | grep "${APP_NAME}-container"
    fi
}

# Main deployment function
main() {
    check_user
    detect_os
    install_dependencies
    configure_firewall
    
    case "${1:-pm2}" in
        "static")
            deploy_static
            ;;
        "pm2")
            deploy_pm2
            ;;
        "docker")
            deploy_docker
            ;;
        *)
            echo "Usage: $0 {static|pm2|docker}"
            echo "  static - Deploy as static files with Nginx"
            echo "  pm2    - Deploy with PM2 and Nginx reverse proxy"
            echo "  docker - Deploy with Docker"
            exit 1
            ;;
    esac
    
    show_status
    log "Deployment completed successfully!"
}

# Run main function
main "$@"
