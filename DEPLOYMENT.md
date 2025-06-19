# Deployment Guide for Oracle VM

This guide will help you deploy your Chess application on an Oracle VM instance.

## Prerequisites

- Oracle Cloud VM instance running Ubuntu/CentOS/RHEL
- SSH access to your VM
- Domain name (optional, but recommended)

## Deployment Options

### Option 1: Simple Static Deployment with Nginx

#### Step 1: Connect to Your Oracle VM
```bash
ssh -i your-private-key.pem ubuntu@your-vm-ip
# or for Oracle Linux
ssh -i your-private-key.pem opc@your-vm-ip
```

#### Step 2: Update System and Install Dependencies
```bash
# For Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx nodejs npm git

# For CentOS/RHEL/Oracle Linux
sudo yum update -y
sudo yum install -y nginx nodejs npm git
```

#### Step 3: Configure Firewall
```bash
# For Ubuntu (UFW)
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable

# For CentOS/RHEL/Oracle Linux (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

#### Step 4: Clone and Build Your Application
```bash
# Clone your repository (or upload files)
cd /home/ubuntu  # or /home/opc for Oracle Linux
git clone https://github.com/yourusername/chess-stockfish17.git
cd chess-stockfish17

# Install dependencies and build
npm install
npm run build

# Move build files to nginx directory
sudo cp -r build/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/  # For Ubuntu
# sudo chown -R nginx:nginx /var/www/html/     # For CentOS/RHEL
```

#### Step 5: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/chess-app  # Ubuntu
# sudo nano /etc/nginx/conf.d/chess-app.conf   # CentOS/RHEL
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com your-vm-ip;  # Replace with your domain/IP
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable the site (Ubuntu):
```bash
sudo ln -s /etc/nginx/sites-available/chess-app /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

Test and restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Option 2: Production Deployment with PM2 and Nginx

#### Step 1: Install PM2 for Process Management
```bash
sudo npm install -g pm2
```

#### Step 2: Create Production Server
Create a simple Express server to serve your React app:

```bash
cd /home/ubuntu/chess-stockfish17
nano server.js
```

Add this content to server.js:
```javascript
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// API routes (if any) would go here
app.get('/api/health', (req, res) => {
  res.json({ status: 'Chess app is running!' });
});

// Catch all handler: send back React's index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Chess app server running on port ${port}`);
});
```

Install Express:
```bash
npm install express
```

#### Step 3: Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

Add this content:
```javascript
module.exports = {
  apps: [{
    name: 'chess-app',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

#### Step 4: Start Application with PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### Step 5: Configure Nginx as Reverse Proxy
```bash
sudo nano /etc/nginx/sites-available/chess-app
```

Update configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com your-vm-ip;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

### Option 3: Docker Deployment

#### Step 1: Install Docker
```bash
# Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# CentOS/RHEL/Oracle Linux
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

#### Step 2: Create Dockerfile
```bash
cd /home/ubuntu/chess-stockfish17
nano Dockerfile
```

Add this content:
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Step 3: Create nginx.conf for Docker
```bash
nano nginx.conf
```

Add this content:
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

#### Step 4: Build and Run Docker Container
```bash
docker build -t chess-app .
docker run -d -p 80:80 --name chess-app-container chess-app
```

## SSL Certificate Setup (Optional but Recommended)

### Using Let's Encrypt with Certbot
```bash
# Ubuntu
sudo apt install -y certbot python3-certbot-nginx

# CentOS/RHEL/Oracle Linux
sudo yum install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## Oracle Cloud Specific Configuration

### Security List Rules
In Oracle Cloud Console:
1. Go to your VCN → Security Lists
2. Add Ingress Rules:
   - Source CIDR: 0.0.0.0/0
   - IP Protocol: TCP
   - Destination Port Range: 80
   - Destination Port Range: 443

### Monitoring and Logs
```bash
# View application logs
pm2 logs chess-app

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System monitoring
htop
df -h
free -h
```

## Troubleshooting

### Common Issues
1. **Port not accessible**: Check Oracle Cloud security lists and VM firewall
2. **Permission denied**: Ensure proper file permissions
3. **App not starting**: Check PM2 logs and Node.js version compatibility

### Useful Commands
```bash
# Check running services
sudo systemctl status nginx
pm2 status

# Restart services
sudo systemctl restart nginx
pm2 restart chess-app

# Check open ports
sudo netstat -tlnp
```

## Performance Optimization

1. Enable Gzip compression in Nginx
2. Set up proper caching headers
3. Use a CDN for static assets
4. Monitor resource usage with PM2

Your chess application should now be accessible at your Oracle VM's public IP address!
