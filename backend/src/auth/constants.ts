export const jwtConstants = {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
    expiresIn: '1d',
  };