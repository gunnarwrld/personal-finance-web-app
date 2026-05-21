import React from 'react';
import { Chrome } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export const GoogleSignInButton: React.FC = () => {
  const { signInWithGoogle, isLoading } = useAuth();

  return (
    <Button
      onClick={signInWithGoogle}
      isLoading={isLoading}
      leftIcon={!isLoading && <Chrome className="h-5 w-5" />}
      size="lg"
      className="w-full sm:w-auto"
    >
      {isLoading ? 'Signing in...' : 'Continue with Google'}
    </Button>
  );
};
