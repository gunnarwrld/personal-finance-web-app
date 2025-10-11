import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, TrendingUp, PiggyBank, Globe } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth';
import { useAuth } from '@/hooks/useAuth';

export const AuthPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your financial data is encrypted and stored securely',
    },
    {
      icon: TrendingUp,
      title: 'Track Spending',
      description: 'Monitor your expenses and income in real-time',
    },
    {
      icon: PiggyBank,
      title: 'Multiple Accounts',
      description: 'Manage all your accounts in one place',
    },
    {
      icon: Globe,
      title: 'Multi-Currency',
      description: 'Support for multiple currencies with live exchange rates',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left Side - Branding */}
            <div className="bg-gradient-to-br from-primary-600 to-secondary-600 p-8 md:p-12 text-white">
              <div className="flex flex-col h-full justify-between">
                <div>
                  {/* Logo */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg
                        className="w-7 h-7 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 8h18M3 12h12M3 16h8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle cx="19" cy="5" r="3" fill="currentColor" />
                      </svg>
                    </div>
                    <h1 className="text-2xl font-bold">FinanceTracker</h1>
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Take Control of Your Finances
                  </h2>
                  <p className="text-white/90 text-lg">
                    Track expenses, manage accounts, and gain insights into your spending habits.
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-3 mt-8">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <feature.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{feature.title}</h3>
                        <p className="text-white/80 text-xs">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - Sign In */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome Back
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Sign in to access your financial dashboard
                </p>

                {/* Google Sign In Button */}
                <div className="space-y-4">
                  <GoogleSignInButton />

                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  New to FinanceTracker? Your account will be created automatically on first sign-in.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-white/80 text-sm">
          <p>© 2024 FinanceTracker. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
