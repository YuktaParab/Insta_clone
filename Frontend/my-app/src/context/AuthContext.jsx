import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      if (userAuth) {
        try {
          // Fetch additional user metadata from Firestore
          const userDocRef = doc(db, 'users', userAuth.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const tempUserObj = {
              uid: userAuth.uid,
              email: userAuth.email,
              ...userDocSnap.data()
            };
            setCurrentUser(tempUserObj);
            // Optionally persist to localStorage for ultra-fast perceived reloads
            localStorage.setItem('instavibe_user_cache', JSON.stringify(tempUserObj));
          } else {
            setCurrentUser({ uid: userAuth.uid, email: userAuth.email });
          }
        } catch (error) {
          console.error("Error fetching Firestore user context:", error);
          setCurrentUser({ uid: userAuth.uid, email: userAuth.email });
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('instavibe_user_cache');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (username, email, password) => {
    try {
      // 1. Create User in Firebase
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      const firestorePayload = {
        username: username,
        email: email,
        bio: "Hello! Welcome to my profile. 🌟 Capturing moments.",
        createdAt: new Date().toISOString()
      };

      // 2. Write metadata beautifully to Firestore `users`
      await setDoc(doc(db, "users", user.uid), firestorePayload);
      
      // 3. Immediately inject complete profile to state perfectly syncing the DB
      setCurrentUser({
        uid: user.uid,
        ...firestorePayload
      });
      
      return { success: true };
    } catch (error) {
      let message = error.message;
      if (error.code === 'auth/email-already-in-use') message = 'Email is already registered.';
      if (error.code === 'auth/weak-password') message = 'Password should be at least 6 characters.';
      return { success: false, message: message.replace('Firebase:', '').trim() };
    }
  };

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      let message = 'Invalid email or password.';
      if (error.code === 'auth/user-not-found') message = 'No account found with this email.';
      if (error.code === 'auth/wrong-password') message = 'Incorrect password.';
      return { success: false, message: message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, signup, logout, loading }}>
        {!loading && children}
    </AuthContext.Provider>
  );
};
