#!/bin/bash

# Create .env.local file for frontend
echo "Setting up frontend environment variables..."
cat > frontend/.env.local << EOL
NEXT_PUBLIC_API_URL=https://www.datizmo.com
NEXTAUTH_URL=https://www.datizmo.com
NEXTAUTH_SECRET=your-secure-secret-replace-this
EOL

echo "✅ Frontend environment setup complete"

# Create or update backend .env
echo "Setting up backend environment variables..."
cat > backend/.env << EOL
# Server configuration
PORT=4000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://your_db_user:your_db_password@localhost:5432/formatic

# JWT Secret
JWT_SECRET=your-secure-jwt-secret-replace-this

# Frontend URL
FRONTEND_URL=https://www.datizmo.com

# Email settings (if needed)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=user
MAIL_PASSWORD=password
MAIL_FROM=noreply@datizmo.com
EOL

echo "✅ Backend environment setup complete"

echo "🔄 Remember to update both files with your actual production credentials!"
echo "🚀 Run './restart.sh' or './force-restart.sh' to apply changes" 