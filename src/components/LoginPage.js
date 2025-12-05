import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import db from '../firebaseConfig';

function LoginPage() {
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [loginData, setLoginData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        accessCode: '',
        congregationCode: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = getAuth();

    // Handle login submission
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
                setError(error.message);
                setLoading(false);
            });
    };

    // Handle registration submission
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!loginData.name || !loginData.email || !loginData.password || !loginData.confirmPassword || !loginData.accessCode || !loginData.congregationCode) {
            setError('Please fill in all fields');
            return;
        }

        if (loginData.password !== loginData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (loginData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Check if user is pre-validated
            const validatedQuery = query(
                collection(db, 'validatedPendingAttendants'),
                where('congregationCode', '==', loginData.congregationCode),
                where('accessCode', '==', loginData.accessCode),
                where('email', '==', loginData.email)
            );

            const validatedSnapshot = await getDocs(validatedQuery);
            const isPreValidated = !validatedSnapshot.empty;

            const userCredential = await createUserWithEmailAndPassword(auth, loginData.email, loginData.password);

            if (isPreValidated) {
                // Auto-approve: add to authorizedUsers
                await setDoc(doc(db, 'authorizedUsers', userCredential.user.uid), {
                    name: loginData.name,
                    email: loginData.email,
                    access: 'basic', // Default access level
                    accessCode: loginData.accessCode,
                    congregationCode: loginData.congregationCode,
                    acceptedOn: new Date(),
                    acceptedBy: 'System (Auto-validated)'
                });

                // Add to pendingRegistrants with accepted status
                await setDoc(doc(db, 'pendingRegistrants', userCredential.user.uid), {
                    name: loginData.name,
                    email: loginData.email,
                    accessCode: loginData.accessCode,
                    congregationCode: loginData.congregationCode,
                    status: 'accepted',
                    dateSubmitted: new Date(),
                    acceptedOn: new Date(),
                    acceptedBy: 'System (Auto-validated)'
                });

                setLoading(false);
                setError('Registration successful! You can now log in.');
            } else {
                // Manual approval needed: add to pendingRegistrants
                await setDoc(doc(db, 'pendingRegistrants', userCredential.user.uid), {
                    name: loginData.name,
                    email: loginData.email,
                    accessCode: loginData.accessCode,
                    congregationCode: loginData.congregationCode,
                    status: 'pending',
                    dateSubmitted: new Date()
                });

                setLoading(false);
                setError('Registration submitted! Please wait for approval.');
            }
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegisterMode(!isRegisterMode);
        setError('');
        setLoginData({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            accessCode: '',
            congregationCode: ''
        });
    };

    return (
        <div className="login-container">
            <form onSubmit={isRegisterMode ? handleRegister : handleLogin}>
                <h2>{isRegisterMode ? 'Register' : 'Login'}</h2>
                {isRegisterMode && (
                    <>
                        <input
                            type="text"
                            placeholder="Name"
                            value={loginData.name}
                            onChange={(e) => setLoginData({ ...loginData, name: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Access Code"
                            value={loginData.accessCode}
                            onChange={(e) => setLoginData({ ...loginData, accessCode: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Congregation Code"
                            value={loginData.congregationCode}
                            onChange={(e) => setLoginData({ ...loginData, congregationCode: e.target.value })}
                            required
                        />
                    </>
                )}
                <input
                    type="email"
                    placeholder="Email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={loginData.password}
                    onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                    }
                    required
                />
                {isRegisterMode && (
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={loginData.confirmPassword}
                        onChange={(e) =>
                            setLoginData({ ...loginData, confirmPassword: e.target.value })
                        }
                        required
                    />
                )}
                <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? (isRegisterMode ? 'Registering…' : 'Logging in…') : (isRegisterMode ? 'Register' : 'Login')}
                </button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                    {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        type="button"
                        onClick={toggleMode}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#007bff',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontSize: 'inherit'
                        }}
                    >
                        {isRegisterMode ? 'Login' : 'Register'}
                    </button>
                </p>
            </form>
        </div>
    );
}

export default LoginPage;