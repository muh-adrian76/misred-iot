import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUser } from '@/providers/user-provider';
import { fetchFromBackend } from '@/lib/helper';

const OnboardingDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const isAuthenticated = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isAuthenticated || !user?.id) {
        setDebugInfo({
          isAuthenticated,
          user,
          message: 'User not authenticated or no user ID'
        });
        return;
      }

      try {
        const response = await fetchFromBackend(`/api/user/onboarding-progress/${user.id}`);
        const data = await response.json();
        
        setDebugInfo({
          isAuthenticated,
          user,
          response: response.ok,
          data,
          message: response.ok ? 'API call successful' : 'API call failed'
        });
      } catch (error) {
        setDebugInfo({
          isAuthenticated,
          user,
          error: error.message,
          message: 'API call error'
        });
      }
    };

    checkOnboarding();
  }, [isAuthenticated, user?.id]);

  return (
    <div className="fixed top-4 left-4 z-50 bg-white p-4 border rounded shadow-lg max-w-md">
      <h3 className="font-bold mb-2">Onboarding Debug</h3>
      <pre className="text-xs overflow-auto max-h-96">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};

export default OnboardingDebug;
