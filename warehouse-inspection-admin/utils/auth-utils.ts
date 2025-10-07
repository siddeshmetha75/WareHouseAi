import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';

export function useRequireRole(requiredRole: string, redirectPath = '/unauthorized') {
  const { isAuthenticated, isLoading, hasRole, user } = useAuth();
  const router = useRouter();
  const [accessGranted, setAccessGranted] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Redirect to login with return URL
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (!hasRole(requiredRole)) {
      router.push(redirectPath);
      return;
    }

    setAccessGranted(true);
  }, [isAuthenticated, isLoading, hasRole, requiredRole, redirectPath, router]);

  return {
    isAuthorized: accessGranted,
    isLoading,
    user,
    hasRole: hasRole(requiredRole)
  };
}
