import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { readData } from '../lib/db';
import { APP_MODE } from '../config';
import { getData, saveData } from '../utils/localStorage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isDemo = APP_MODE === 'demo';

  useEffect(() => {
    if (isDemo) {
      // Demo Mode: LocalStorage Auth
      const savedUser = getData('currentUser');
      setCurrentUser(savedUser);
      setLoading(false);
    } else if (auth) {
      // Live Mode: Firebase Auth
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            // Standardized safeId: replace @ and . with _
            const safeId = user.email.replace(/[@.]/g, '_');
            const userData = await readData(`users/${safeId}`);
            
            if (userData) {
              setCurrentUser({ ...user, ...userData });
            } else {
              // User exists in Auth but not in Database record yet
              console.warn("User record not found in database for ID:", safeId);
              setCurrentUser(user);
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            setCurrentUser(user);
          }
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      setLoading(false);
      console.error("Firebase Auth not initialized. Check your credentials.");
    }
  }, [isDemo]);

  const login = async (email, password) => {
    if (isDemo) {
      // Fake Login Logic
      const users = getData('users') || [];
      const user = users.find(u => u.email === email);
      if (user) {
        saveData('currentUser', user);
        setCurrentUser(user);
        return user;
      } else {
        throw new Error('User not found in demo data.');
      }
    } else if (auth) {
      return signInWithEmailAndPassword(auth, email, password);
    } else {
      throw new Error("Firebase Auth is not initialized. Please configure your API key.");
    }
  };

  const signup = async (email, password) => {
    if (isDemo) {
      throw new Error("Signup is not available in Demo Mode.");
    } else if (auth) {
      return createUserWithEmailAndPassword(auth, email, password);
    } else {
      throw new Error("Firebase Auth is not initialized.");
    }
  };

  const logout = async () => {
    if (isDemo) {
      saveData('currentUser', null);
      setCurrentUser(null);
    } else if (auth) {
      return signOut(auth);
    }
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
