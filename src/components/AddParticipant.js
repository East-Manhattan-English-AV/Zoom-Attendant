import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import db from '../firebaseConfig';

function AddParticipant({ initialName = '', userAccess, onCancel, onUpdate }) {
    const [newParticipant, setNewParticipant] = useState({
        name: initialName,
        device: '',
        phone: '',
        notes: '',
        overseer: '',
        allow: true
    });

    const isAdmin = userAccess === 'admin';

    // Check if any field has content
    const hasContent =
        newParticipant.name.trim() !== '' ||
        newParticipant.device.trim() !== '' ||
        newParticipant.phone.trim() !== '' ||
        newParticipant.notes.trim() !== '' ||
        newParticipant.overseer.trim() !== '';

    // Handle form submission: add new participant to Firestore
    const handleSubmit = async () => {
        if (!hasContent) return;

        try {
            // Add to different collections based on user access
            const collectionName = isAdmin ? 'participants' : 'suggestedParticipants';
            const collectionRef = collection(db, collectionName);

            // Add timestamp and status for suggestions
            const dataToAdd = isAdmin
                ? newParticipant
                : { ...newParticipant, suggestedAt: new Date().toISOString(), status: 'pending' };

            await addDoc(collectionRef, dataToAdd);
            if (onUpdate) onUpdate(); // Navigate back after adding
        } catch (error) {
            console.error('Error adding participant:', error);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Scrollable content area */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
                <h2 style={{ padding: '20px', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    {isAdmin ? 'Add New Participant' : 'Suggest New Participant'}
                </h2>
                <form className="edit-attendant-form" style={{ padding: '0 20px' }} onSubmit={(e) => e.preventDefault()}>
                    <div className="form-group">
                        <label htmlFor="participant-name">Name</label>
                        <input
                            type="text"
                            id="participant-name"
                            value={newParticipant.name}
                            onChange={(e) =>
                                setNewParticipant({ ...newParticipant, name: e.target.value })
                            }
                            placeholder="Enter name"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="participant-device">Device</label>
                        <input
                            type="text"
                            id="participant-device"
                            value={newParticipant.device}
                            onChange={(e) =>
                                setNewParticipant({ ...newParticipant, device: e.target.value })
                            }
                            placeholder="Enter device"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="participant-phone">Phone</label>
                        <input
                            type="tel"
                            id="participant-phone"
                            value={newParticipant.phone}
                            onChange={(e) =>
                                setNewParticipant({ ...newParticipant, phone: e.target.value })
                            }
                            placeholder="Enter phone"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="participant-overseer">Overseer</label>
                        <input
                            type="text"
                            id="participant-overseer"
                            value={newParticipant.overseer}
                            onChange={(e) =>
                                setNewParticipant({ ...newParticipant, overseer: e.target.value })
                            }
                            placeholder="Enter overseer"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="participant-notes">Notes</label>
                        <textarea
                            id="participant-notes"
                            value={newParticipant.notes}
                            onChange={(e) =>
                                setNewParticipant({ ...newParticipant, notes: e.target.value })
                            }
                            placeholder="Enter notes"
                            rows="4"
                        />
                    </div>
                    <div className="form-group" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <label htmlFor="participant-allow" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                id="participant-allow"
                                checked={newParticipant.allow}
                                onChange={(e) =>
                                    setNewParticipant({ ...newParticipant, allow: e.target.checked })
                                }
                                style={{ marginRight: '8px' }}
                            />
                            Allow participant
                        </label>
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
                        borderRadius: '6px',
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
                        borderRadius: '6px',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: hasContent ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s'
                    }}
                >
                    {isAdmin ? 'Add Participant' : 'Suggest'}
                </button>
            </div>
        </div>
    );
}

export default AddParticipant;
