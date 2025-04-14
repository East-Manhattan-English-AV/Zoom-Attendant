import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import db from '../firebaseConfig';

function EditAttendant({ attendant, onCancel, onUpdate }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        access: 'none'
    });

    // Synchronize formData with the attendant prop only when the ID changes
    useEffect(() => {
        if (attendant?.id) {
            setFormData({
                name: attendant.name || '',
                email: attendant.email || '',
                access: attendant.access || 'none'
            });
        }
    }, [attendant?.id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        if (!attendant?.id) return;

        try {
            const attendantRef = doc(db, 'authorizedUsers', attendant.id);
            await updateDoc(attendantRef, formData);
            onUpdate?.();
        } catch (error) {
            console.error('Error updating attendant:', error);
        }
    };

    return (
        <form className="edit-attendant-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
                <label htmlFor="attendant-name">Name</label>
                <input
                    type="text"
                    id="attendant-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter name"
                />
            </div>
            <div className="form-group">
                <label htmlFor="attendant-email">Email</label>
                <input
                    type="email"
                    id="attendant-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                />
            </div>
            <div className="form-group">
                <label htmlFor="attendant-access">Access</label>
                <select
                    id="attendant-access"
                    name="access"
                    value={formData.access}
                    onChange={handleChange}
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
    );
}

export default EditAttendant;