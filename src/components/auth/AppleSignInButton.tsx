import React from 'react';
import { Apple } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export const AppleSignInButton: React.FC = () => {
  const { signInWithApple, isLoading } = useAuth();

  return (
    <Button
      onClick={signInWithApple}
      isLoading={isLoading}
      leftIcon={!isLoading && <Apple className="h-5 w-5" />}
      size="lg"
      className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
    >
      {isLoading ? 'Signing in...' : 'Continue with Apple'}
    </Button>
  );
};
