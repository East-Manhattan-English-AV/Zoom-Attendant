import React, { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import SearchPage from './components/SearchPage';

function App() {
  const [user, setUser] = useState(null); // user holds attendant info

  return (
    <div className="App">
      {user ? (
        <SearchPage user={user} />
      ) : (
        <LoginPage onLoginSuccess={setUser} />
      )}
    </div>
  );
}

export default App;
