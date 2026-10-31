import React from 'react';
import { Apple } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export const AppleSignInButton: React.FC = () => {
  const { signInWithApple, isLoading } = useAuth();
  const { error: showError } = useToast();

  const handleClick = async () => {
    try {
      await signInWithApple();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to sign in with Apple');
    }
  };

  return (
    <Button
      onClick={handleClick}
      isLoading={isLoading}
      leftIcon={!isLoading && <Apple className="h-5 w-5" />}
      size="lg"
      className="w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
    >
      {isLoading ? 'Signing in...' : 'Continue with Apple'}
    </Button>
  );
};
