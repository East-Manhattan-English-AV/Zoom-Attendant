import React, { useState } from 'react';
import db from '../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import {
    collection,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

function LoginPage() {
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = getAuth();

    // Handle login submission by checking the 'attendants' collection
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!loginData.email || !loginData.password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        signInWithEmailAndPassword(auth, loginData.email, loginData.password)
            .then(() => {
                setLoading(false);
            })
            .catch((error) => {
                setError(error);
                setLoading(false);
            });
    };

    return (
        <div className="login-container">
            <form onSubmit={handleLogin}>
                <h2>Login</h2>
                <input
                    type="text"
                    placeholder="Email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Password"
                    value={loginData.password}
                    onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                    }
                    required
                />
                <button type="submit" className="login-btn" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
        </div>
    );
}

export default LoginPage;