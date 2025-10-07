import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserService } from '../services/userService';
import logger, { logAuthEvent, logError } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: 'consulta' | 'digitador' | 'administrador' | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserRole: (role: 'consulta' | 'digitador' | 'administrador') => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'consulta' | 'digitador' | 'administrador' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
         try {
           logger.debug('Loading user role and profile', { email: user.email, uid: user.uid });

           // Check for pending roles first
           const pendingRole = await UserService.applyPendingRole(user.email!, user.uid);
           logger.debug('Pending role applied', { pendingRole });

           // Initialize or get user profile from Firestore
           const userProfile = await UserService.initializeUserProfile(user);
           logger.debug('User profile loaded', { role: userProfile.role });

           // Use pending role if applied, otherwise use profile role
           const finalRole = pendingRole || userProfile.role;
           setUserRole(finalRole);

           // Update profile if pending role was applied
           if (pendingRole && pendingRole !== userProfile.role) {
             await UserService.updateUserProfile(user.uid, { role: pendingRole });
             logger.info('User profile updated with pending role', { uid: user.uid, newRole: pendingRole });
           }

           logAuthEvent('User profile loaded successfully', { role: finalRole });

         } catch (error) {
           logError(error as Error, 'AuthContext - loading user profile');
           // Fallback to localStorage or default role
           const storedRole = localStorage.getItem(`userRole_${user.uid}`);
           const defaultRole = user.email === 'admin@columbito.com' ? 'administrador' : 'consulta';
           setUserRole(storedRole as 'consulta' | 'digitador' | 'administrador' || defaultRole);
         }
      } else {
        setUserRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      logAuthEvent('User login successful', { email });
    } catch (error) {
      logError(error as Error, 'AuthContext - login');
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      if (!auth) {
        throw new Error('Firebase Auth no está configurado. Verifica la configuración.');
      }
      await createUserWithEmailAndPassword(auth, email, password);
      logAuthEvent('User registration successful', { email });
    } catch (error) {
      logError(error as Error, 'AuthContext - register');
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      logAuthEvent('Google login successful');
    } catch (error) {
      logError(error as Error, 'AuthContext - loginWithGoogle');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      logAuthEvent('User logout successful');
    } catch (error) {
      logError(error as Error, 'AuthContext - logout');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      logger.info('Password reset email sent', { email });
    } catch (error) {
      logError(error as Error, 'AuthContext - resetPassword');
      throw error;
    }
  };

  const updateUserRole = async (role: 'consulta' | 'digitador' | 'administrador') => {
    if (user) {
      try {
        // Update user role using UserService
        await UserService.updateUserRole(user.uid, role);
        setUserRole(role);
        logAuthEvent('User role updated', { newRole: role });
      } catch (error) {
        logError(error as Error, 'AuthContext - updateUserRole');
        // Fallback to localStorage
        localStorage.setItem(`userRole_${user.uid}`, role);
        setUserRole(role);
        logger.warn('User role updated in localStorage due to service error', { role });
      }
    }
  };

  const refreshUserRole = async () => {
    if (user) {
      try {
        // Check for pending roles first
        const pendingRole = await UserService.applyPendingRole(user.email!, user.uid);

        // Get user profile from Firestore
        const userProfile = await UserService.getUserProfile(user.uid);

        // Use pending role if applied, otherwise use profile role
        const finalRole = pendingRole || userProfile?.role;
        setUserRole(finalRole || 'consulta');

        // Update profile if pending role was applied
        if (pendingRole && pendingRole !== userProfile?.role && userProfile) {
          await UserService.updateUserProfile(user.uid, { role: pendingRole });
        }

        logger.debug('User role refreshed successfully', { finalRole });

      } catch (error) {
        logError(error as Error, 'AuthContext - refreshUserRole');
        // Fallback to localStorage or default role
        const storedRole = localStorage.getItem(`userRole_${user.uid}`);
        const defaultRole = user.email === 'admin@columbito.com' ? 'administrador' : 'consulta';
        setUserRole(storedRole as 'consulta' | 'digitador' | 'administrador' || defaultRole);
      }
    }
  };


  const value = {
    user,
    loading,
    userRole,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserRole,
    refreshUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};