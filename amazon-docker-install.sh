#!/bin/bash

# Update system packages
sudo yum update -y

# Install Docker
sudo amazon-linux-extras install docker -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Verify installations
echo "Docker version:"
docker --version
echo "Docker Compose version:"
docker-compose --version

echo "Installation complete! You may need to log out and back in for group changes to take effect."
echo "Please run: exit and then reconnect to your EC2 instance." 