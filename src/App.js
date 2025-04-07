import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import SearchPage from './components/SearchPage';

import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getDocs,
  getDoc,
  getDocFromServer,
  doc
} from 'firebase/firestore';
import db from './firebaseConfig';

function App() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const auth = getAuth();
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
            console.log("User logged in.");
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.log("Error getting document:", error);
        }
      } else {
        // User is signed out.
        setUser(null);
      }
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []);
  
  return (
    <div className="App">
      {user ? (
        <SearchPage user={user} />
      ) : (
        <LoginPage/>
      )}
    </div>
  );
}

export default App;
