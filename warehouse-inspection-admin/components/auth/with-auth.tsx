import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

type WithAuthProps = {
  allowedRoles?: string[];
  redirectTo?: string;
};

export function withAuth<T extends object>(WrappedComponent: React.ComponentType<T>, options: WithAuthProps = {}) {
  const { allowedRoles = [], redirectTo = '/login' } = options;

  const ComponentWithAuth = (props: T) => {
    const { isAuthenticated, isLoading, hasRole, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (isLoading) return;

      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        const returnUrl = window.location.pathname + window.location.search;
        router.push(`${redirectTo}?returnUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }

      // If roles are specified, check if user has any of the allowed roles
      if (allowedRoles.length > 0 && !allowedRoles.some(role => hasRole(role))) {
        router.push('/unauthorized');
      }
    }, [isAuthenticated, isLoading, hasRole, router]);

    // Show loading state while checking auth
    if (isLoading || !isAuthenticated) {
      return <div>Loading...</div>;
    }

    // If roles are specified and user doesn't have any of them, show unauthorized
    if (allowedRoles.length > 0 && !allowedRoles.some(role => hasRole(role))) {
      return <div>You don't have permission to access this page.</div>;
    }

    return <WrappedComponent {...props} />;
  };

  // Set display name for better debugging
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  ComponentWithAuth.displayName = `withAuth(${displayName})`;

  return ComponentWithAuth;
}
