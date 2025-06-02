module.exports = {
  apps : [{
    name   : "frontend",
    script : "npm",
    args   : "run start",
    cwd    : "/home/ec2-user/formatic-unified/frontend",
    watch  : false,
    instances: 1,
    exec_mode: 'fork',
    env_production: {
      NODE_ENV: "production",
      PORT: 3000
    }
  },{
    name   : "backend",
    script : "npm",
    args   : "run start:prod",
    cwd    : "/home/ec2-user/formatic-unified/backend",
    watch  : false,
    instances: 1,
    exec_mode: 'fork',
    env_production: {
      NODE_ENV: "production",
      PORT: 3001
    }
  }]
} 