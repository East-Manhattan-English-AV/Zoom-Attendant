import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import Spinner from './components/Spinner';
import LoginPage from './components/LoginPage';
import SearchPage from './components/SearchPage';
import MainContent from './components/MainContent';

import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import {
  getDocs,
  getDoc,
  getDocFromServer,
  doc
} from 'firebase/firestore';
import db from './firebaseConfig';

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userAccess, setUserAccess] = useState('none');
  const [error, setError] = useState('');
  const auth = getAuth();

  const onLogout = () => {
    signOut(auth).then(() => {
      setUser(null);
      setUserAccess('none');
      console.log("User logged out");
    }).catch((error) => {
      setError(error);
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User is signed in.");
        // User is signed in, get user data from Firestore
        const docRef = doc(db, "authorizedUsers", user.uid);
        console.log("Fetching user data from Firestore...");
        try {
          const docSnap = await getDocFromServer(docRef);
          console.log("Document snapshot:", docSnap);
          // Check if the document exists
          if (docSnap.exists()) {
            const loggedInUser = docSnap.data();
            setUser(loggedInUser);
            setLoading(false);
            console.log("User logged in.");
          } else {
            setLoading(false);
            console.log("No such document!");
          }
        } catch (error) {
          setLoading(false);
          console.log("Error getting document:", error);
        }
      } else {
        // User is signed out.
        setLoading(false);
        setUser(null);
      }
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      console.log("User state changed");

      setUserAccess(user.access);

    } else {
      setUserAccess('none');
    }
  }, [user]);

  if (loading) {
    return <Spinner />;
  }
  
  if (!user) {
    return <LoginPage />
  }

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <MainContent user={user} userAccess={userAccess} onLogout={onLogout} />
    </div>
  );
}

export default App;
