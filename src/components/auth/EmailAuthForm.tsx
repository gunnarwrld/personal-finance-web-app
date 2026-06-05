import React, { useState } from 'react';
import { Mail, Lock, KeyRound, ArrowRight } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

type AuthMode = 'signin' | 'signup' | 'magiclink';

export const EmailAuthForm: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const { signInWithEmail, signUpWithEmail, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    if (!email) {
      setLocalError('Please enter your email address');
      return;
    }

    if (mode !== 'magiclink' && !password) {
      setLocalError('Please enter a password');
      return;
    }

    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password);
        setSuccessMsg('Success! Please check your email to confirm your account.');
      } else if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else if (mode === 'magiclink') {
        await signInWithEmail(email); // omitting password triggers magic link
        setSuccessMsg('Magic link sent! Please check your email.');
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'An error occurred during authentication');
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        {localError && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
            {localError}
          </div>
        )}
        
        {successMsg && (
          <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
            {successMsg}
          </div>
        )}

        <Input
          type="email"
          label="Email Address"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-5 w-5" />}
          className="w-full"
          required
        />

        {mode !== 'magiclink' && (
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-5 w-5" />}
            className="w-full"
            required
          />
        )}

        <Button
          type="submit"
          isLoading={isLoading}
          rightIcon={!isLoading && <ArrowRight className="h-4 w-4" />}
          className="w-full"
        >
          {mode === 'signin' && 'Sign In'}
          {mode === 'signup' && 'Create Account'}
          {mode === 'magiclink' && 'Send Magic Link'}
        </Button>
      </form>

      <div className="mt-4 flex flex-col space-y-2 text-sm text-center">
        {mode === 'signin' && (
          <>
            <button 
              onClick={() => { setMode('magiclink'); setLocalError(null); setSuccessMsg(null); }}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
            >
              Sign in with a Magic Link
            </button>
            <p className="text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <button 
                onClick={() => { setMode('signup'); setLocalError(null); setSuccessMsg(null); }}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
              >
                Sign Up
              </button>
            </p>
          </>
        )}

        {mode === 'signup' && (
          <p className="text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <button 
              onClick={() => { setMode('signin'); setLocalError(null); setSuccessMsg(null); }}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
            >
              Sign In
            </button>
          </p>
        )}

        {mode === 'magiclink' && (
          <button 
            onClick={() => { setMode('signin'); setLocalError(null); setSuccessMsg(null); }}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium flex items-center justify-center gap-1"
          >
            <KeyRound className="h-4 w-4" /> Use Password Instead
          </button>
        )}
      </div>
    </div>
  );
};
