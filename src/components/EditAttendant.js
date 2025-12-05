import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import db from '../firebaseConfig';

function EditAttendant({ attendant, onCancel, onUpdate }) {
    const [editingAttendant, setEditingAttendant] = useState({
        name: '',
        email: '',
        access: 'none'
    });

    // Update editing state when the attendant prop changes
    useEffect(() => {
        if (attendant) {
            setEditingAttendant({
                name: attendant.name || '',
                email: attendant.email || '',
                access: attendant.access || 'none'
            });
        }
    }, [attendant]);

    // Handle form submission: update the attendant in Firestore
    const handleSubmit = async () => {
        if (!attendant?.id) return;
        const attendantRef = doc(db, 'authorizedUsers', attendant.id);
        try {
            await updateDoc(attendantRef, editingAttendant);
            if (onUpdate) onUpdate(); // Callback for successful update
        } catch (error) {
            console.error('Error updating attendant:', error);
        }
    };

    return (
        <div>
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Edit Attendant</h2>
            </div>
            <form className="edit-attendant-form p-6" onSubmit={(e) => e.preventDefault()}>
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
                >
                    <option value="none">None</option>
                    <option value="basic">Basic</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            <div className="action-buttons">
                <button type="button" className="update-password-button">
                    Update password
                </button>
                <button type="button" className="delete-button">
                    Delete
                </button>
            </div>

            <hr />

            <div className="form-footer">
                <button type="button" onClick={onCancel} className="cancel-button">
                    Cancel
                </button>
                <button type="button" onClick={handleSubmit} className="submit-button">
                    Submit
                </button>
            </div>
            </form>
        </div>
    );
}

export default EditAttendant;