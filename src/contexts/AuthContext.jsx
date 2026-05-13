import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
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
        setLoading(true);
        if (user) {
          try {
            // (RS) Primary Lookup by UID (Standard)
            let userData = await readData(`users/${user.uid}`);
            
            // (RS) Bridge Logic: If not found by UID, check by SafeEmail (Legacy)
            if (!userData) {
              const safeId = user.email.replace(/[@.]/g, '_');
              const legacyData = await readData(`users/${safeId}`);
              if (legacyData) {
                // Migrate to UID-based structure immediately
                userData = { ...legacyData, uid: user.uid };
                await writeData(`users/${user.uid}`, userData);
                // Optional: Delete legacy record once UID is stable
              }
            }

            const isOwner = user.email === 'boiketloramoabi@gmail.com' || user.email === 'boiketloramoabi@gmail.com';
            
            if (userData) {
              setCurrentUser({ ...user, ...userData, role: isOwner ? 'superAdmin' : userData.role });
            } else if (isOwner) {
              // Superadmin Provisioning: Create record if missing
              const newOwner = {
                uid: user.uid,
                email: user.email,
                name: 'System',
                surname: 'Owner',
                role: 'superAdmin',
                companyId: 'master',
                createdAt: new Date().toISOString()
              };
              await writeData(`users/${user.uid}`, newOwner);
              setCurrentUser({ ...user, ...newOwner });
            } else {
              setCurrentUser(user);
            }
          } catch (error) {
            console.error("Auth Synchronization Error:", error);
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
      const users = getData('users') || [];
      const user = users.find(u => u.email === email);
      if (user) {
        saveData('currentUser', user);
        setCurrentUser(user);
        return user;
      } else {
        throw new Error('Identity not found in demo records.');
      }
    } else if (auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Immediate authority verification
        const isOwner = user.email === 'boiketloramaobi@gmail.com' || user.email === 'boiketloramoabi@gmail.com';
        const safeId = user.email.replace(/[@.]/g, '_');
        let userData = await readData(`users/${safeId}`);
        
        // SELF-PROVISIONING BYPASS: If this is the owner email and no record exists, CREATE it.
        if (!userData && isOwner) {
          userData = {
            id: safeId,
            name: 'System',
            surname: 'Owner',
            email: user.email,
            role: 'admin',
            createdAt: new Date().toISOString()
          };
          await writeData(`users/${safeId}`, userData);
        }
        
        if (!userData && !isOwner) {
          await signOut(auth);
          throw new Error('Account verified, but no operational profile (Role) was found. Please contact an Administrator to assign your permissions.');
        }
        
        return userCredential;
      } catch (error) {
        throw error;
      }
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

  const resetPassword = async (email) => {
    if (isDemo) {
      throw new Error("Password reset is not available in Demo Mode.");
    } else if (auth) {
      return sendPasswordResetEmail(auth, email);
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
    resetPassword,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
