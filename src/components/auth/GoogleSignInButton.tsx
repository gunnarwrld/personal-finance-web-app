import React from 'react';
import { Chrome } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export const GoogleSignInButton: React.FC = () => {
  const { signInWithGoogle, isLoading } = useAuth();
  const { error: showError } = useToast();

  const handleClick = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    }
  };

  return (
    <Button
      onClick={handleClick}
      isLoading={isLoading}
      leftIcon={!isLoading && <Chrome className="h-5 w-5" />}
      size="lg"
      className="w-full"
    >
      {isLoading ? 'Signing in...' : 'Continue with Google'}
    </Button>
  );
};
