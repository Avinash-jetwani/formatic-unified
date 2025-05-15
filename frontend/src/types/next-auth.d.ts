import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string | null;
    role: 'SUPER_ADMIN' | 'CLIENT';
  }

  interface Session {
    user: User & {
      id: string;
      role: 'SUPER_ADMIN' | 'CLIENT';
    };
  }
} 