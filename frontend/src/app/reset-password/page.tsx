'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState, FormEvent } from 'react';

// Define the actual form component content here
function ResetPasswordActualForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "Password has been reset successfully. You can now login.");
      } else {
        setError(data.error || "Failed to reset password.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error(err);
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input 
              id="confirm-password" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          {message && <p className="mt-2 text-xs text-green-500">{message}</p>}
          {message && (
            <Link href="/login" className="mt-2 text-xs text-center text-blue-600 hover:underline">
              Back to Login
            </Link>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

// This component uses useSearchParams and will be wrapped in Suspense
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center">Invalid or missing password reset token.</p>
          <p className="mt-2 text-center text-sm">
            Please request a new password reset link if needed.
          </p>
        </CardContent>
        <CardFooter>
            <Link href="/forgot-password" legacyBehavior passHref>
                <Button variant="outline" className="w-full">Request New Link</Button>
            </Link>
        </CardFooter>
      </Card>
    );
  }
  return <ResetPasswordActualForm token={token} />;
}

// The main page component for the route
export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Suspense fallback={<div className="text-center"><p>Loading...</p></div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
} 