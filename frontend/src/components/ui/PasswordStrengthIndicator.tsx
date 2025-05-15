import React from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const calculateStrength = (password: string): { score: number; feedback: string } => {
    let score = 0;
    let feedback = '';

    if (!password) {
      return { score: 0, feedback: 'Enter a password' };
    }

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[A-Z]/.test(password)) score += 1; // Has uppercase
    if (/[a-z]/.test(password)) score += 1; // Has lowercase
    if (/[0-9]/.test(password)) score += 1; // Has number
    if (/[^A-Za-z0-9]/.test(password)) score += 1; // Has special char

    // Determine feedback based on score
    if (score <= 2) {
      feedback = 'Weak - Add more variety and length';
    } else if (score <= 4) {
      feedback = 'Moderate - Consider adding more complexity';
    } else {
      feedback = 'Strong - Good password!';
    }

    return { score: Math.min(score, 6), feedback };
  };

  const { score, feedback } = calculateStrength(password);
  const maxScore = 6;
  const percentage = (score / maxScore) * 100;

  const getStrengthColor = (score: number): string => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="mt-2">
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getStrengthColor(score)} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className={`text-sm mt-1 ${score <= 2 ? 'text-red-500' : score <= 4 ? 'text-yellow-500' : 'text-green-500'}`}>
        {feedback}
      </p>
    </div>
  );
} 