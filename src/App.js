import React, { useState, useEffect } from 'react';
import './App.css';
import Spinner from './components/Spinner';
import LoginPage from './components/LoginPage';
import MainContent from './components/MainContent';

import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import {
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
    }).catch((error) => {
      setError(error);
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, get user data from Firestore
        const docRef = doc(db, "authorizedUsers", user.uid);
        try {
          const docSnap = await getDocFromServer(docRef);
          // Check if the document exists
          if (docSnap.exists()) {
            const loggedInUser = docSnap.data();
            setUser(loggedInUser);
            setLoading(false);
          } else {
            setLoading(false);
          }
        } catch (error) {
          setLoading(false);
        }
      } else {
        // User is signed out.
        setLoading(false);
        setUser(null);
      }
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (user) {
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
