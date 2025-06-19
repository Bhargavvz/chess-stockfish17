# Quick Deployment Guide for Oracle VM

## 🚀 Quick Start

### 1. Upload Files to Oracle VM
```bash
# Method 1: Using SCP
scp -i your-key.pem -r chess-stockfish17/ ubuntu@your-vm-ip:/home/ubuntu/

# Method 2: Using Git (recommended)
ssh -i your-key.pem ubuntu@your-vm-ip
git clone https://github.com/yourusername/chess-stockfish17.git
cd chess-stockfish17
```

### 2. Run Automated Deployment
```bash
# Make script executable
chmod +x deploy.sh

# Choose your deployment method:

# Option A: Simple static deployment (recommended for beginners)
./deploy.sh static

# Option B: Production deployment with PM2 (recommended for production)
./deploy.sh pm2

# Option C: Docker deployment (for containerized environments)
./deploy.sh docker
```

### 3. Configure Oracle Cloud Security
1. Go to Oracle Cloud Console
2. Navigate to your VCN → Security Lists
3. Add Ingress Rules:
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: `TCP`
   - Destination Port: `80`
   - Destination Port: `443` (if using SSL)

### 4. Access Your Application
- Open browser: `http://your-vm-ip`
- Or with domain: `http://your-domain.com`

## 🔧 Manual Steps (if needed)

### Update System
```bash
sudo apt update && sudo apt upgrade -y  # Ubuntu
sudo yum update -y                      # CentOS/RHEL
```

### Install Node.js (if not installed)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Build Application
```bash
cd chess-stockfish17
npm install
npm run build
```

## 🔒 SSL Certificate (Optional)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

## 📊 Monitoring Commands
```bash
# Check service status
sudo systemctl status nginx
pm2 status                    # If using PM2
docker ps                     # If using Docker

# View logs
sudo tail -f /var/log/nginx/access.log
pm2 logs chess-app           # PM2 logs
docker logs chess-app-container  # Docker logs

# Check application health
curl http://localhost/health  # Health check
```

## 🐛 Troubleshooting

### Common Issues:
1. **Port 80 not accessible**: Check Oracle Cloud security lists
2. **Permission denied**: Run `sudo chown -R $USER:$USER /path/to/app`
3. **Build fails**: Check Node.js version: `node --version` (should be 16+)
4. **Nginx fails to start**: Check config: `sudo nginx -t`

### Reset and Redeploy:
```bash
# Stop services
sudo systemctl stop nginx
pm2 stop all

# Clean and redeploy
rm -rf build/ node_modules/
npm install
npm run build
./deploy.sh pm2
```

## 📈 Performance Tips
1. Enable Gzip compression (included in configs)
2. Set up CloudFlare for CDN
3. Monitor with `htop` and `pm2 monit`
4. Use Oracle Cloud Load Balancer for high traffic

Your chess application will be live at your Oracle VM's public IP address! 🎉
