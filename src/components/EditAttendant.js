import React, { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import db from '../firebaseConfig';

function EditAttendant({ attendant, onCancel, onUpdate }) {
    const auth = getAuth();
    const [editingAttendant, setEditingAttendant] = useState({
        name: '',
        email: '',
        access: 'none'
    });
    const [originalAttendant, setOriginalAttendant] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [resetMessage, setResetMessage] = useState('');

    // Update editing state when the attendant prop changes
    useEffect(() => {
        if (attendant) {
            const initial = {
                name: attendant.name || '',
                email: attendant.email || '',
                access: attendant.access || 'none'
            };
            setEditingAttendant(initial);
            setOriginalAttendant(initial);
        }
    }, [attendant]);

    // Detect changes
    useEffect(() => {
        if (originalAttendant) {
            const changed =
                editingAttendant.name !== originalAttendant.name ||
                editingAttendant.email !== originalAttendant.email ||
                editingAttendant.access !== originalAttendant.access;
            setHasChanges(changed);
        }
    }, [editingAttendant, originalAttendant]);

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

    // Handle form submission: update the attendant in Firestore
    const handleSubmit = async () => {
        if (!attendant?.id) return;
        const attendantRef = doc(db, 'authorizedUsers', attendant.id);
        try {
            await updateDoc(attendantRef, {
                ...editingAttendant,
                updatedAt: new Date(),
                updatedBy: auth.currentUser?.email || 'Unknown'
            });
            if (onUpdate) onUpdate(); // Callback for successful update
        } catch (error) {
            console.error('Error updating attendant:', error);
        }
    };

    // Handle delete: remove attendant from authorizedUsers collection
    const handleDelete = async () => {
        if (!attendant?.id) return;

        // Show confirmation dialog
        const confirmDelete = window.confirm(
            `Are you sure you want to delete ${attendant.name || 'this attendant'}? This action cannot be undone.`
        );

        if (!confirmDelete) return;

        try {
            // Delete from authorizedUsers collection
            const attendantRef = doc(db, 'authorizedUsers', attendant.id);
            await deleteDoc(attendantRef);

            if (onUpdate) onUpdate(); // Navigate back after deletion
        } catch (error) {
            console.error('Error deleting attendant:', error);
        }
    };

    // Handle password reset: send password reset email
    const handlePasswordReset = async () => {
        if (!editingAttendant.email) {
            setResetMessage('No email address available');
            return;
        }

        // Show confirmation dialog
        const confirmReset = window.confirm(
            `Send password reset email to ${editingAttendant.email}?`
        );

        if (!confirmReset) return;

        try {
            await sendPasswordResetEmail(auth, editingAttendant.email);
            setResetMessage('Password reset email sent successfully!');
            setTimeout(() => setResetMessage(''), 5000); // Clear message after 5 seconds
        } catch (error) {
            console.error('Error sending password reset email:', error);
            setResetMessage(`Error: ${error.message}`);
            setTimeout(() => setResetMessage(''), 5000);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Scrollable content area */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
                <h2 style={{ padding: '20px', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    Edit Attendant
                </h2>
                <form className="edit-attendant-form" style={{ padding: '0 20px' }} onSubmit={(e) => e.preventDefault()}>
                    <div className="form-group">
                        <label htmlFor="attendant-name">Name</label>
                        <input
                            type="text"
                            id="attendant-name"
                            value={editingAttendant.name}
                            onChange={(e) =>
                                setEditingAttendant({ ...editingAttendant, name: e.target.value })
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
                            value={editingAttendant.email}
                            onChange={(e) =>
                                setEditingAttendant({ ...editingAttendant, email: e.target.value })
                            }
                            placeholder="Enter email"
                            style={{ backgroundColor: '#f0edee', color: '#000000', borderRadius: '25px', border: 'none', padding: '12px', fontSize: '16px' }}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="attendant-access">Access</label>
                        <select
                            id="attendant-access"
                            value={editingAttendant.access}
                            onChange={(e) =>
                                setEditingAttendant({ ...editingAttendant, access: e.target.value })
                            }
                            style={{ backgroundColor: '#f0edee', color: '#000000', borderRadius: '25px', border: 'none', padding: '12px', fontSize: '16px' }}
                        >
                            <option value="none">None</option>
                            <option value="basic">Basic</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </form>

                {/* Action buttons - centered above bottom bar */}
                <div style={{ padding: '20px', textAlign: 'center', marginTop: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={handlePasswordReset}
                            style={{
                                padding: '10px 24px',
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '25px',
                                fontSize: '16px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                        >
                            Send Password Reset Email
                        </button>
                        {resetMessage && (
                            <p style={{
                                fontSize: '14px',
                                color: resetMessage.includes('Error') ? '#dc2626' : '#10b981',
                                margin: 0
                            }}>
                                {resetMessage}
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={handleDelete}
                            style={{
                                padding: '10px 24px',
                                backgroundColor: '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '25px',
                                fontSize: '16px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
                        >
                            Delete Attendant
                        </button>
                    </div>
                </div>
            </div>

            {/* Fixed bottom button bar */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    backgroundColor: '#fff',
                    borderTop: '1px solid #e5e7eb',
                    zIndex: 10
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
                    disabled={!hasChanges}
                    style={{
                        padding: '10px 24px',
                        backgroundColor: hasChanges ? '#2563eb' : '#d1d5db',
                        color: hasChanges ? '#ffffff' : '#9ca3af',
                        border: 'none',
                        borderRadius: '25px',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: hasChanges ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s'
                    }}
                >
                    Submit
                </button>
            </div>
        </div>
    );
}

export default EditAttendant;