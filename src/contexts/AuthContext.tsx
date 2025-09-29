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
  userRole: 'admin' | 'user' | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserRole: (role: 'admin' | 'user') => Promise<void>;
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
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        try {
          // Initialize or get user profile from Firestore
          const userProfile = await UserService.initializeUserProfile(user);
          setUserRole(userProfile.role);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Fallback to localStorage or default role
          const storedRole = localStorage.getItem(`userRole_${user.uid}`);
          const defaultRole = user.email === 'admin@columbito.com' ? 'admin' : 'user';
          setUserRole(storedRole as 'admin' | 'user' || defaultRole);
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

  const updateUserRole = async (role: 'admin' | 'user') => {
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


  const value = {
    user,
    loading,
    userRole,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};