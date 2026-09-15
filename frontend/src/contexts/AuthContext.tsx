import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { API_BASE } from '../services/api';

type User = {
  id: number;
  name: string;
  email: string;
  firebase_uid?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log(`[AUTH] onAuthStateChanged fired. firebaseUser exists:`, !!firebaseUser);
      if (firebaseUser) {
        try {
          console.log(`[AUTH] Sync started from onAuthStateChanged...`);
          const token = await firebaseUser.getIdToken();
          const response = await fetch(`${API_BASE}/api/auth/sync`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!response.ok) {
            const errText = await response.text();
            console.log(`[AUTH] Sync failed with status:`, response.status, errText);
            throw new Error(`Failed to sync user: ${errText}`);
          }
          
          const profile = await response.json();
          console.log(`[AUTH] Sync succeeded! profile:`, profile);
          setUser(profile);
        } catch (error) {
          console.error("[AUTH] Failed to fetch user profile", error);
          setUser(null);
        }
      } else {
        console.log(`[AUTH] Firebase user signed out.`);
        setUser(null);
      }
      console.log(`[AUTH] Setting loading=false`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const syncUser = async (firebaseUser: FirebaseUser) => {
    const token = await firebaseUser.getIdToken();
    const response = await fetch(`${API_BASE}/api/auth/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const errText = await response.text();
      console.log(`[AUTH] syncUser helper failed: ${errText}`);
      throw new Error(`Failed to sync user: ${errText}`);
    }
    const profile = await response.json();
    setUser(profile);
  };

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (cred.user) await syncUser(cred.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      await syncUser(cred.user);
    }
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    if (cred.user) await syncUser(cred.user);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      loginWithGoogle,
      logout,
      isAuthenticated: !!user
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
