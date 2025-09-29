import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  getDocs,
  where,
  orderBy
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'consulta' | 'digitador' | 'administrador';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  displayName?: string;
  role?: 'consulta' | 'digitador' | 'administrador';
}

export interface UpdateUserData {
  displayName?: string;
  role?: 'consulta' | 'digitador' | 'administrador';
  isActive?: boolean;
}

export class UserService {
  private static readonly COLLECTION_NAME = 'userProfiles';
  private static readonly PENDING_ROLES_COLLECTION = 'pendingRoles';

  // Get current authenticated user profile
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    return this.getUserProfile(currentUser.uid);
  }

  // Get user profile by UID
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Get all user profiles (admin only)
  static async getAllUserProfiles(): Promise<UserProfile[]> {
    try {
      // Check if Firestore is available
      if (!db) {
        console.warn('Firestore not configured, returning empty user list');
        return [];
      }

      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const profiles: UserProfile[] = [];

      querySnapshot.forEach((doc) => {
        profiles.push(doc.data() as UserProfile);
      });

      return profiles;
    } catch (error) {
      console.error('Error getting all user profiles:', error);
      // Return empty array instead of throwing to allow the app to work in demo mode
      return [];
    }
  }

  // Get all Firebase Auth users (requires Cloud Function for production)
  // For now, we'll work with users that have signed in and have profiles
  static async getAllAuthUsers(): Promise<UserProfile[]> {
    try {
      // In a production app, this would call a Cloud Function
      // For now, we'll return users that have profiles in Firestore
      // This represents users that have signed in at least once

      console.warn('Firebase Auth listUsers requires Cloud Functions for security. Using Firestore profiles as proxy.');

      // Return all user profiles as they represent authenticated users
      return this.getAllUserProfiles();
    } catch (error) {
      console.error('Error getting auth users:', error);
      return [];
    }
  }

  // Create a user profile for an existing Firebase Auth user (admin invitation)
  static async createProfileForExistingUser(email: string, role: 'consulta' | 'digitador' | 'administrador' = 'consulta', createdBy?: string): Promise<UserProfile | null> {
    try {
      if (!db) {
        throw new Error('Firestore not configured');
      }

      // Check if profile already exists
      const existingProfiles = await this.getAllUserProfiles();
      const existingProfile = existingProfiles.find(p => p.email === email);

      if (existingProfile) {
        // Update existing profile
        await this.updateUserProfile(existingProfile.uid, { role });
        return { ...existingProfile, role };
      }

      // For existing Firebase Auth users, we can't get their UID from client side
      // In production, this would be done via Cloud Functions
      // For now, we'll create a placeholder that will be updated when user signs in

      console.warn('Cannot create profile for existing Firebase Auth user from client side. Use Cloud Functions for production.');

      // Return null to indicate this operation needs server-side implementation
      return null;

    } catch (error) {
      console.error('Error creating profile for existing user:', error);
      throw error;
    }
  }

  // Create new user with profile
  static async createUser(userData: CreateUserData, createdBy?: string): Promise<UserProfile> {
    try {
      // Check if Firebase Auth is available
      if (!auth) {
        throw new Error('Firebase Auth no está configurado. Configure las variables de entorno REACT_APP_FIREBASE_* para habilitar la creación de usuarios.');
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const user = userCredential.user;

      // Update display name if provided
      if (userData.displayName) {
        await updateProfile(user, {
          displayName: userData.displayName
        });
      }

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role || 'consulta',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy
      };

      if (db) {
        await setDoc(doc(db, this.COLLECTION_NAME, user.uid), userProfile);
      }

      // Sign out the newly created user (admin stays logged in)
      await firebaseSignOut(auth);

      return userProfile;
    } catch (error: any) {
      console.error('Error creating user:', error);

      // Provide more specific error messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Este email ya está registrado en el sistema.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('La contraseña es muy débil. Debe tener al menos 6 caracteres.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('El email proporcionado no es válido.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('La creación de usuarios no está habilitada. Contacte al administrador del sistema.');
      } else if (error.code === 'permission-denied') {
        throw new Error('No tiene permisos para crear usuarios. Solo administradores pueden crear nuevos usuarios.');
      } else if (!auth) {
        throw new Error('Firebase Auth no está configurado. Configure las variables de entorno REACT_APP_FIREBASE_* para habilitar la creación de usuarios.');
      } else {
        throw new Error(`Error al crear usuario: ${error.message || 'Error desconocido'}`);
      }
    }
  }

  // Update user profile
  static async updateUserProfile(uid: string, updateData: UpdateUserData): Promise<void> {
    try {
      const updatePayload: Partial<UserProfile> = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, this.COLLECTION_NAME, uid), updatePayload);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Delete user (admin only)
  static async deleteUser(uid: string): Promise<void> {
    try {
      // Delete from Firestore first
      await deleteDoc(doc(db, this.COLLECTION_NAME, uid));

      // Note: Firebase Auth user deletion requires re-authentication
      // This would typically be done via Cloud Functions for security
      console.warn('Firebase Auth user deletion should be handled via Cloud Functions for security');

    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Toggle user active status
  static async toggleUserStatus(uid: string): Promise<void> {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      await this.updateUserProfile(uid, {
        isActive: !userProfile.isActive
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }

  // Update user role
  static async updateUserRole(uid: string, newRole: 'consulta' | 'digitador' | 'administrador'): Promise<void> {
    try {
      await this.updateUserProfile(uid, { role: newRole });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // Update last login timestamp
  static async updateLastLogin(uid: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION_NAME, uid), {
        lastLogin: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Check if user has admin role
  static async isUserAdmin(uid: string): Promise<boolean> {
    try {
      const userProfile = await this.getUserProfile(uid);
      return userProfile?.role === 'administrador' || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Check if user is active
  static async isUserActive(uid: string): Promise<boolean> {
    try {
      const userProfile = await this.getUserProfile(uid);
      return userProfile?.isActive !== false; // Default to true if not set
    } catch (error) {
      console.error('Error checking user status:', error);
      return false;
    }
  }

  // Initialize user profile on first login
  static async initializeUserProfile(user: FirebaseUser): Promise<UserProfile> {
    try {
      // Check if profile already exists
      const existingProfile = await this.getUserProfile(user.uid);
      if (existingProfile) {
        // Update last login
        await this.updateLastLogin(user.uid);
        return existingProfile;
      }

      // Create new profile for existing user
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || undefined,
        role: 'consulta', // Default role
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      await setDoc(doc(db, this.COLLECTION_NAME, user.uid), userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error initializing user profile:', error);
      throw error;
    }
  }

  // Get users by role
  static async getUsersByRole(role: 'admin' | 'user'): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('role', '==', role),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const profiles: UserProfile[] = [];

      querySnapshot.forEach((doc) => {
        profiles.push(doc.data() as UserProfile);
      });

      return profiles;
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }

  // Get active users only
  static async getActiveUsers(): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const profiles: UserProfile[] = [];

      querySnapshot.forEach((doc) => {
        profiles.push(doc.data() as UserProfile);
      });

      return profiles;
    } catch (error) {
      console.error('Error getting active users:', error);
      throw error;
    }
  }

  // Assign role to email (for users that haven't signed in yet)
  static async assignRoleToEmail(email: string, role: 'consulta' | 'digitador' | 'administrador', assignedBy?: string): Promise<void> {
    try {
      // Try Firebase first
      if (db) {
        try {
          // Check if user already has a profile
          const existingProfiles = await this.getAllUserProfiles();
          const existingProfile = existingProfiles.find(p => p.email === email);

          if (existingProfile) {
            // Update existing profile
            await this.updateUserProfile(existingProfile.uid, { role });
            return;
          }

          // Create pending role assignment
          const pendingRoleData = {
            email: email.toLowerCase(),
            role,
            assignedBy,
            assignedAt: new Date().toISOString(),
            status: 'pending' // pending, applied, expired
          };

          await setDoc(doc(db, this.PENDING_ROLES_COLLECTION, email.toLowerCase()), pendingRoleData);
          return;
        } catch (firebaseError) {
          console.warn('Firebase role assignment failed, using localStorage fallback:', firebaseError);
        }
      }

      // Fallback: Store in localStorage
      console.warn('Using localStorage fallback for role assignment');
      const localKey = `pending_role_${email.toLowerCase()}`;
      const pendingRoleData = {
        email: email.toLowerCase(),
        role,
        assignedBy,
        assignedAt: new Date().toISOString(),
        status: 'pending',
        storage: 'localStorage' // Mark as localStorage fallback
      };

      localStorage.setItem(localKey, JSON.stringify(pendingRoleData));

      // Also store in a master list for easier retrieval
      const masterListKey = 'pending_roles_list';
      const existingList = JSON.parse(localStorage.getItem(masterListKey) || '[]');
      const updatedList = [...existingList.filter((item: any) => item.email !== email.toLowerCase()), pendingRoleData];
      localStorage.setItem(masterListKey, JSON.stringify(updatedList));

    } catch (error) {
      console.error('Error assigning role to email:', error);
      throw error;
    }
  }

  // Get all pending role assignments
  static async getPendingRoleAssignments(): Promise<Array<{email: string, role: 'consulta' | 'digitador' | 'administrador', assignedAt: string, assignedBy?: string}>> {
    const pendingRoles: Array<{email: string, role: 'consulta' | 'digitador' | 'administrador', assignedAt: string, assignedBy?: string}> = [];

    try {
      // Try Firebase first
      if (db) {
        try {
          const q = query(
            collection(db, this.PENDING_ROLES_COLLECTION),
            where('status', '==', 'pending'),
            orderBy('assignedAt', 'desc')
          );

          const querySnapshot = await getDocs(q);

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Handle migration from old role types to new ones
            let role: 'consulta' | 'digitador' | 'administrador' = 'consulta';
            if (data.role === 'admin') role = 'administrador';
            else if (data.role === 'user') role = 'consulta';
            else role = data.role as 'consulta' | 'digitador' | 'administrador';

            pendingRoles.push({
              email: data.email,
              role,
              assignedAt: data.assignedAt,
              assignedBy: data.assignedBy
            });
          });
        } catch (firebaseError) {
          console.warn('Firebase pending roles query failed, using localStorage fallback:', firebaseError);
        }
      }

      // Always check localStorage as fallback/additional source
      try {
        const masterListKey = 'pending_roles_list';
        const localPendingRoles = JSON.parse(localStorage.getItem(masterListKey) || '[]');

        // Add localStorage roles that aren't already in the Firebase results
        localPendingRoles.forEach((localRole: any) => {
          const existsInFirebase = pendingRoles.some(fbRole => fbRole.email === localRole.email);
          if (!existsInFirebase && localRole.status === 'pending') {
            pendingRoles.push({
              email: localRole.email,
              role: localRole.role,
              assignedAt: localRole.assignedAt,
              assignedBy: localRole.assignedBy
            });
          }
        });
      } catch (localStorageError) {
        console.warn('Error reading localStorage pending roles:', localStorageError);
      }

      // Sort by assignedAt descending
      return pendingRoles.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());

    } catch (error) {
      console.error('Error getting pending role assignments:', error);
      return [];
    }
  }

  // Check and apply pending role when user signs in
  static async applyPendingRole(email: string, uid: string): Promise<'consulta' | 'digitador' | 'administrador' | null> {
    const emailKey = email.toLowerCase();

    console.log('=== APPLY PENDING ROLE ===');
    console.log('Email:', email);
    console.log('Email key:', emailKey);
    console.log('UID:', uid);

    try {
      // Try Firebase first
      if (db) {
        try {
          console.log('Checking Firebase for pending role...');
          const pendingRoleRef = doc(db, this.PENDING_ROLES_COLLECTION, emailKey);
          const pendingRoleSnap = await getDoc(pendingRoleRef);
          console.log('Pending role document exists:', pendingRoleSnap.exists());

          if (pendingRoleSnap.exists()) {
            const pendingRoleData = pendingRoleSnap.data();
            console.log('Pending role data:', pendingRoleData);

            // Update the user's profile with the assigned role
            console.log('Updating user profile with pending role...');
            const userProfile = await this.getUserProfile(uid);
            console.log('Current user profile:', userProfile);
            if (userProfile) {
              await this.updateUserProfile(uid, { role: pendingRoleData.role });
              console.log('User profile updated successfully');
            }

            // Mark pending role as applied
            console.log('Marking pending role as applied...');
            await updateDoc(pendingRoleRef, {
              status: 'applied',
              appliedAt: new Date().toISOString(),
              appliedToUid: uid
            });
            console.log('Pending role marked as applied');

            console.log('Returning pending role:', pendingRoleData.role);
            return pendingRoleData.role;
          } else {
            console.log('No pending role found in Firebase');
          }
        } catch (firebaseError) {
          console.warn('Firebase pending role application failed, trying localStorage:', firebaseError);
        }
      }

      // Try localStorage fallback
      try {
        console.log('Checking localStorage for pending role...');
        const localKey = `pending_role_${emailKey}`;
        const localPendingRole = JSON.parse(localStorage.getItem(localKey) || 'null');
        console.log('Local pending role:', localPendingRole);

        if (localPendingRole && localPendingRole.status === 'pending') {
          console.log('Found pending role in localStorage, applying...');
          // Update the user's profile with the assigned role
          const userProfile = await this.getUserProfile(uid);
          console.log('Current user profile for localStorage:', userProfile);
          if (userProfile) {
            await this.updateUserProfile(uid, { role: localPendingRole.role });
            console.log('User profile updated with localStorage role');
          }

          // Mark as applied in localStorage
          localPendingRole.status = 'applied';
          localPendingRole.appliedAt = new Date().toISOString();
          localPendingRole.appliedToUid = uid;
          localStorage.setItem(localKey, JSON.stringify(localPendingRole));
          console.log('LocalStorage pending role marked as applied');

          // Update master list
          const masterListKey = 'pending_roles_list';
          const existingList = JSON.parse(localStorage.getItem(masterListKey) || '[]');
          const updatedList = existingList.map((item: any) =>
            item.email === emailKey ? localPendingRole : item
          );
          localStorage.setItem(masterListKey, JSON.stringify(updatedList));

          console.log('Returning localStorage role:', localPendingRole.role);
          return localPendingRole.role;
        } else {
          console.log('No valid pending role in localStorage');
        }
      } catch (localStorageError) {
        console.warn('Error applying localStorage pending role:', localStorageError);
      }

      console.log('No pending role found, returning null');
      return null;
    } catch (error) {
      console.error('Error applying pending role:', error);
      return null;
    }
  }

  // Remove pending role assignment
  static async removePendingRole(email: string): Promise<void> {
    const emailKey = email.toLowerCase();

    try {
      // Try Firebase first
      if (db) {
        try {
          await deleteDoc(doc(db, this.PENDING_ROLES_COLLECTION, emailKey));
        } catch (firebaseError) {
          console.warn('Firebase pending role removal failed:', firebaseError);
        }
      }

      // Always try to remove from localStorage
      try {
        const localKey = `pending_role_${emailKey}`;
        localStorage.removeItem(localKey);

        // Also remove from master list
        const masterListKey = 'pending_roles_list';
        const existingList = JSON.parse(localStorage.getItem(masterListKey) || '[]');
        const updatedList = existingList.filter((item: any) => item.email !== emailKey);
        localStorage.setItem(masterListKey, JSON.stringify(updatedList));
      } catch (localStorageError) {
        console.warn('Error removing localStorage pending role:', localStorageError);
      }

    } catch (error) {
      console.error('Error removing pending role:', error);
      throw error;
    }
  }

  // Get all manageable users (both registered and pending)
  static async getAllManageableUsers(): Promise<{
    registered: UserProfile[],
    pending: Array<{email: string, role: 'consulta' | 'digitador' | 'administrador', assignedAt: string, assignedBy?: string}>
  }> {
    try {
      const [registered, pending] = await Promise.all([
        this.getAllUserProfiles(),
        this.getPendingRoleAssignments()
      ]);

      return { registered, pending };
    } catch (error) {
      console.error('Error getting manageable users:', error);
      return { registered: [], pending: [] };
    }
  }

  // Debug function to manually test pending role application
  static async debugPendingRoleApplication(email: string): Promise<void> {
    console.log('=== DEBUG PENDING ROLE APPLICATION ===');
    console.log('Testing email:', email);

    try {
      // Check if pending role exists in Firebase
      if (db) {
        const emailKey = email.toLowerCase();
        const pendingRoleRef = doc(db, this.PENDING_ROLES_COLLECTION, emailKey);
        const pendingRoleSnap = await getDoc(pendingRoleRef);

        console.log('Firebase pending role exists:', pendingRoleSnap.exists());
        if (pendingRoleSnap.exists()) {
          console.log('Firebase pending role data:', pendingRoleSnap.data());
        }
      }

      // Check localStorage
      const localKey = `pending_role_${email.toLowerCase()}`;
      const localPendingRole = localStorage.getItem(localKey);
      console.log('localStorage key exists:', !!localPendingRole);
      if (localPendingRole) {
        console.log('localStorage pending role data:', JSON.parse(localPendingRole));
      }

      // Check master list
      const masterListKey = 'pending_roles_list';
      const masterList = localStorage.getItem(masterListKey);
      console.log('Master list exists:', !!masterList);
      if (masterList) {
        const parsedList = JSON.parse(masterList);
        const foundInMaster = parsedList.find((item: any) => item.email === email.toLowerCase());
        console.log('Found in master list:', !!foundInMaster);
        if (foundInMaster) {
          console.log('Master list item:', foundInMaster);
        }
      }

      console.log('=== DEBUG COMPLETE ===');
    } catch (error) {
      console.error('Error in debug function:', error);
    }
  }
}

export default UserService;