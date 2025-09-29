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
          console.log('=== AUTH CONTEXT ROLE LOADING ===');
          console.log('User email:', user.email);
          console.log('User UID:', user.uid);

          // Check for pending roles first
          console.log('Checking for pending roles...');
          const pendingRole = await UserService.applyPendingRole(user.email!, user.uid);
          console.log('Pending role result:', pendingRole);

          // Initialize or get user profile from Firestore
          console.log('Getting/creating user profile...');
          const userProfile = await UserService.initializeUserProfile(user);
          console.log('User profile:', userProfile);

          // Use pending role if applied, otherwise use profile role
          const finalRole = pendingRole || userProfile.role;
          console.log('Final role:', finalRole);
          setUserRole(finalRole);

          // Update profile if pending role was applied
          if (pendingRole && pendingRole !== userProfile.role) {
            console.log('Updating profile with pending role...');
            await UserService.updateUserProfile(user.uid, { role: pendingRole });
          }
          console.log('=== AUTH CONTEXT ROLE LOADING COMPLETE ===');

        } catch (error) {
          console.error('Error loading user profile:', error);
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
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase Auth no está configurado. Verifica la configuración.');
    }
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserRole = async (role: 'consulta' | 'digitador' | 'administrador') => {
    if (user) {
      try {
        // Update user role using UserService
        await UserService.updateUserRole(user.uid, role);
        setUserRole(role);
      } catch (error) {
        console.error('Error updating user role:', error);
        // Fallback to localStorage
        localStorage.setItem(`userRole_${user.uid}`, role);
        setUserRole(role);
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

      } catch (error) {
        console.error('Error refreshing user role:', error);
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