import React, { useState } from 'react';
import db from '../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';

function LoginPage({ onLoginSuccess }) {
    const [loginData, setLoginData] = useState({ id: '', congregationID: '' });
    const [isRegistering, setIsRegistering] = useState(false);
    const [registerData, setRegisterData] = useState({
        name: '',
        emailAddress: '',
        congregationName: '',
        congregationID: '',
        id: '',
        status: 'pending',
        dateSubmitted: new Date(),
        dateApproved: '',
        dateRejected: '',
        rejectionReason: '',
        approvedBy: '',
        rejectedBy: '',
        notes: '',
    });
    const [error, setError] = useState('');

    // Handle login submission by checking the 'attendants' collection
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const attendantQuery = await db
                .collection('attendants')
                .where('id', '==', loginData.id)
                .where('congregationID', '==', loginData.congregationID)
                .get();

            if (!attendantQuery.empty) {
                // Login successful: You can set the logged-in user
                onLoginSuccess(attendantQuery.docs[0].data());
            } else {
                setError('Login failed. Please check your credentials or register.');
            }
        } catch (err) {
            setError('Error during login: ' + err.message);
        }
    };

    // Handle registration by writing to the 'pendingRegistrants' collection
    const handleRegister = async (e) => {
        e.preventDefault();
        console.log('Register button clicked');
        try {
            const id = uuidv4(); // Generate a unique ID for the registrant
            const updatedData = { ...registerData, id: id };
            await db.collection('pendingRegistrants').add(updatedData);
            console.log('Registration submitted successfully:', registerData);
            alert('Registration submitted! Please wait for approval.');
            setIsRegistering(false);
        } catch (err) {
            console.error('Registration error:', err);
            setError('Registration error: ' + err.message);
        }
    };

    return (
        <div className="login-container">
            {isRegistering ? (
                <form onSubmit={handleRegister}>
                    <h2>Register</h2>
                    <input
                        type="text"
                        placeholder="Name"
                        value={registerData.name}
                        onChange={(e) =>
                            setRegisterData({ ...registerData, name: e.target.value })
                        }
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={registerData.emailAddress}
                        onChange={(e) =>
                            setRegisterData({ ...registerData, emailAddress: e.target.value })
                        }
                        required
                    />
                    <input
                        type="text"
                        placeholder="Congregation Name"
                        value={registerData.congregationName}
                        onChange={(e) =>
                            setRegisterData({ ...registerData, congregationName: e.target.value })
                        }
                        required
                    />
                    <input
                        type="text"
                        placeholder="Congregation ID"
                        value={registerData.congregationID}
                        onChange={(e) =>
                            setRegisterData({ ...registerData, congregationID: e.target.value })
                        }
                        required
                    />
                    <button type="submit">Register</button>
                    <button type="button" onClick={() => setIsRegistering(false)}>
                        Back to Login
                    </button>
                </form>
            ) : (
                <form onSubmit={handleLogin}>
                    <h2>Login</h2>
                    <input
                        type="text"
                        placeholder="ID"
                        value={loginData.id}
                        onChange={(e) => setLoginData({ ...loginData, id: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Congregation ID"
                        value={loginData.congregationID}
                        onChange={(e) =>
                            setLoginData({ ...loginData, congregationID: e.target.value })
                        }
                        required
                    />
                    <button type="submit">Login</button>
                    <button type="button" onClick={() => setIsRegistering(true)}>
                        Register
                    </button>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                </form>
            )}
        </div>
    );
}

export default LoginPage;