module.exports = {
  apps : [{
    name   : "frontend",
    script : "node",
    args   : ".next/standalone/server.js",
    cwd    : "/home/ec2-user/formatic-unified/frontend",
    watch  : false,
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',
    env_production: {
      NODE_ENV: "production",
      PORT: 3000,
      HOSTNAME: "0.0.0.0"
    }
  },{
    name   : "backend",
    script : "dist/src/main.js",
    cwd    : "/home/ec2-user/formatic-unified/backend", 
    watch  : false,
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '256M',
    env_production: {
      NODE_ENV: "production",
      PORT: 3001
    }
  }]
} 