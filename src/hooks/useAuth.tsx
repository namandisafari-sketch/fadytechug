import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'staff' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole;
  pagePermissions: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
  hasPageAccess: (path: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [pagePermissions, setPagePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
    
    return data?.role as UserRole;
  };

  const fetchPagePermissions = async (userId: string) => {
    const { data, error } = await supabase
      .from('page_permissions')
      .select('page_path')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching page permissions:', error);
      return [];
    }
    
    return data?.map(p => p.page_path) || [];
  };

  const refreshPermissions = async () => {
    if (user) {
      const role = await fetchUserRole(user.id);
      setUserRole(role);
      
      if (role === 'staff') {
        const permissions = await fetchPagePermissions(user.id);
        setPagePermissions(permissions);
      } else {
        setPagePermissions([]);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetch to avoid deadlock
        if (session?.user) {
          setTimeout(async () => {
            if (!isMounted) return;
            const role = await fetchUserRole(session.user.id);
            if (isMounted) {
              setUserRole(role);
              
              // Fetch page permissions for staff
              if (role === 'staff') {
                const permissions = await fetchPagePermissions(session.user.id);
                if (isMounted) {
                  setPagePermissions(permissions);
                }
              }
              
              setLoading(false);
            }
          }, 0);
        } else {
          setUserRole(null);
          setPagePermissions([]);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        if (isMounted) {
          setUserRole(role);
          
          // Fetch page permissions for staff
          if (role === 'staff') {
            const permissions = await fetchPagePermissions(session.user.id);
            if (isMounted) {
              setPagePermissions(permissions);
            }
          }
          
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setPagePermissions([]);
  };

  const hasPageAccess = (path: string): boolean => {
    // Admins have access to all pages
    if (userRole === 'admin') return true;
    
    // Staff need specific page permissions
    if (userRole === 'staff') {
      // Check exact match or parent path
      return pagePermissions.some(p => 
        path === p || path.startsWith(p + '/')
      );
    }
    
    return false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userRole,
      pagePermissions,
      loading,
      signIn,
      signUp,
      signOut,
      isAdmin: userRole === 'admin',
      isStaff: userRole === 'staff' || userRole === 'admin',
      hasPageAccess,
      refreshPermissions
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
