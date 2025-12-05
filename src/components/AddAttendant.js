import React, { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import db from '../firebaseConfig';

function AddAttendant({ onCancel, onUpdate }) {
    const [newAttendant, setNewAttendant] = useState({
        name: '',
        email: '',
        access: 'none'
    });

    // Check if any field has content
    const hasContent =
        newAttendant.name.trim() !== '' ||
        newAttendant.email.trim() !== '';

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

    // Handle form submission: add new attendant to Firestore
    const handleSubmit = async () => {
        if (!hasContent) return;

        try {
            const collectionRef = collection(db, 'authorizedUsers');
            await addDoc(collectionRef, newAttendant);
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
                    Add New Attendant
                </h2>
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
                        <label htmlFor="attendant-access">Access</label>
                        <select
                            id="attendant-access"
                            value={newAttendant.access}
                            onChange={(e) =>
                                setNewAttendant({ ...newAttendant, access: e.target.value })
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
    );
}

export default AddAttendant;
