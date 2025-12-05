import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import db from '../firebaseConfig';

function AddAttendant({ onCancel, onUpdate }) {
    const auth = getAuth();
    const [newAttendant, setNewAttendant] = useState({
        name: '',
        email: '',
        congregationCode: '',
        accessCode: ''
    });
    const [loading, setLoading] = useState(true);

    // Generate a random access code
    const generateAccessCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    // Fetch current user's congregation code
    useEffect(() => {
        const fetchUserCongregationCode = async () => {
            try {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    const userDoc = await getDoc(doc(db, 'authorizedUsers', currentUser.uid));
                    if (userDoc.exists()) {
                        const congregationCode = userDoc.data().congregationCode || '';
                        setNewAttendant({
                            name: '',
                            email: '',
                            congregationCode: congregationCode,
                            accessCode: generateAccessCode()
                        });
                    }
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching congregation code:', error);
                setLoading(false);
            }
        };

        fetchUserCongregationCode();
    }, [auth]);

    // Check if all fields are filled
    const hasContent =
        newAttendant.name.trim() !== '' &&
        newAttendant.email.trim() !== '' &&
        newAttendant.congregationCode.trim() !== '' &&
        newAttendant.accessCode.trim() !== '';

    // Handle Escape key to cancel
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && onCancel) {
                onCancel();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onCancel]);

    // Handle form submission: add new attendant to validatedPendingAttendants
    const handleSubmit = async () => {
        if (!hasContent) return;

        try {
            const collectionRef = collection(db, 'validatedPendingAttendants');
            await addDoc(collectionRef, {
                name: newAttendant.name,
                email: newAttendant.email,
                congregationCode: newAttendant.congregationCode,
                accessCode: newAttendant.accessCode,
                createdOn: new Date(),
                createdBy: auth.currentUser?.email || 'Unknown'
            });
            if (onUpdate) onUpdate(); // Navigate back after adding
        } catch (error) {
            console.error('Error adding attendant:', error);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Scrollable content area */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
                <h2 style={{ padding: '20px', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    Add Validated Attendant
                </h2>
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
                ) : (
                    <form className="edit-attendant-form" style={{ padding: '0 20px' }} onSubmit={(e) => e.preventDefault()}>
                        <div className="form-group">
                            <label htmlFor="attendant-name">Name</label>
                            <input
                                type="text"
                                id="attendant-name"
                                value={newAttendant.name}
                                onChange={(e) =>
                                    setNewAttendant({ ...newAttendant, name: e.target.value })
                                }
                                placeholder="Enter name"
                                style={{ backgroundColor: '#f0edee', color: '#000000', borderRadius: '25px', border: 'none', padding: '12px', fontSize: '16px' }}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="attendant-email">Email</label>
                            <input
                                type="email"
                                id="attendant-email"
                                value={newAttendant.email}
                                onChange={(e) =>
                                    setNewAttendant({ ...newAttendant, email: e.target.value })
                                }
                                placeholder="Enter email"
                                style={{ backgroundColor: '#f0edee', color: '#000000', borderRadius: '25px', border: 'none', padding: '12px', fontSize: '16px' }}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="attendant-congregation">Congregation Code</label>
                            <input
                                type="text"
                                id="attendant-congregation"
                                value={newAttendant.congregationCode}
                                onChange={(e) =>
                                    setNewAttendant({ ...newAttendant, congregationCode: e.target.value })
                                }
                                placeholder="Congregation code"
                                style={{ backgroundColor: '#f0edee', color: '#000000', borderRadius: '25px', border: 'none', padding: '12px', fontSize: '16px' }}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="attendant-access-code">Access Code</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    id="attendant-access-code"
                                    value={newAttendant.accessCode}
                                    onChange={(e) =>
                                        setNewAttendant({ ...newAttendant, accessCode: e.target.value })
                                    }
                                    placeholder="Access code"
                                    style={{ flex: 1, backgroundColor: '#f0edee', color: '#000000', borderRadius: '25px', border: 'none', padding: '12px', fontSize: '16px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setNewAttendant({ ...newAttendant, accessCode: generateAccessCode() })}
                                    style={{
                                        padding: '12px 20px',
                                        backgroundColor: '#2563eb',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '25px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    Regenerate
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {/* Fixed bottom section with instruction text and buttons */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    borderTop: '1px solid #e5e7eb',
                    zIndex: 10
                }}
            >
                {/* Instruction text - only show when all fields are filled */}
                {hasContent && (
                    <div style={{ padding: '12px 20px 8px 20px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
                        Once created, {newAttendant.name.trim()} will need to register with the correct email address, congregation code, and access code.
                    </div>
                )}

                {/* Buttons */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: hasContent ? '8px 20px 16px 20px' : '16px 20px'
                    }}
                >
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            padding: '10px 24px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '25px',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!hasContent}
                        style={{
                            padding: '10px 24px',
                            backgroundColor: hasContent ? '#2563eb' : '#d1d5db',
                            color: hasContent ? '#ffffff' : '#9ca3af',
                            border: 'none',
                            borderRadius: '25px',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: hasContent ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s'
                        }}
                    >
                        Add Attendant
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddAttendant;
