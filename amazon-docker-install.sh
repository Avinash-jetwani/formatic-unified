#!/bin/bash

# Update system packages
sudo dnf update -y

# Install Docker
sudo dnf install docker -y

# Start and enable Docker
sudo systemctl enable docker
sudo systemctl start docker

# Create docker group if it doesn't exist
sudo groupadd -f docker

# Add user to docker group
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

echo "Docker and Docker Compose installed! You may need to log out and log back in for group changes to take effect."
echo "Run 'exit' and reconnect to your EC2 instance." 