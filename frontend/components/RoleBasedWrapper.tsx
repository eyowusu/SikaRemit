import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';

type RoleBasedWrapperProps = {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
};

export function RoleBasedWrapper({ 
  children, 
  allowedRoles,
  fallback = null 
}: RoleBasedWrapperProps) {
  const { data: session } = useSession();
  
  if (!session || !allowedRoles.includes(session.user.role)) {
    return fallback;
  }
  
  return <>{children}</>;
}

// Example usage:
/*
<RoleBasedWrapper allowedRoles={['admin']}>
  <AdminControls />
</RoleBasedWrapper>
*/
