import { useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore } from '@/store/useStore';
import { generateKeyPair, storePrivateKey, removePrivateKey } from '@/utils/encryption';
import type { User } from '@/types';

export function useAuth() {
  const { setCurrentUser, setUserPassword } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('[useAuth] User authenticated:', firebaseUser.uid);
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as User);

          // Restore password from sessionStorage if available
          const storedPassword = sessionStorage.getItem(`lingo_session_${firebaseUser.uid}`);
          console.log('[useAuth] Restoring password from sessionStorage:', {
            hasPassword: !!storedPassword,
            userId: firebaseUser.uid
          });
          if (storedPassword) {
            setUserPassword(storedPassword);
            console.log('[useAuth] Password restored successfully');
          } else {
            console.warn('[useAuth] No password found in sessionStorage - user may need to sign in again');
          }
        }
      } else {
        setCurrentUser(null);
        setUserPassword(null);
      }
    });

    return () => unsubscribe();
  }, [setCurrentUser, setUserPassword]);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { publicKey, privateKey } = generateKeyPair();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName });

      const userData: User = {
        id: user.uid,
        email: user.email!,
        displayName,
        publicKey,
        createdAt: Date.now(),
        lastSeen: Date.now(),
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      // Store encrypted private key and get recovery code
      const recoveryCode = await storePrivateKey(user.uid, privateKey, password);

      // Store password in memory and sessionStorage for this session
      setUserPassword(password);
      sessionStorage.setItem(`lingo_session_${user.uid}`, password);
      console.log('[useAuth] Password stored in sessionStorage for user:', user.uid);
      setCurrentUser(userData);

      return { success: true, recoveryCode };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

      if (userDoc.exists()) {
        // Store password in memory and sessionStorage for this session
        setUserPassword(password);
        sessionStorage.setItem(`lingo_session_${userCredential.user.uid}`, password);
        console.log('[useAuth] Sign-in successful, password stored for user:', userCredential.user.uid);
        setCurrentUser(userDoc.data() as User);
        return { success: true };
      }

      return { success: false, error: 'User data not found' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      if (auth.currentUser) {
        removePrivateKey(auth.currentUser.uid);
        // Clear session password
        sessionStorage.removeItem(`lingo_session_${auth.currentUser.uid}`);
      }
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserPassword(null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return { signUp, signIn, signOut };
}
