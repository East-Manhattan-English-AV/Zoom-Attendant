import React, { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import db from '../firebaseConfig';

function EditParticipant({ participant, onCancel, onUpdate }) {
    const auth = getAuth();
    const [editingParticipant, setEditingParticipant] = useState({
        name: '',
        device: '',
        phone: '',
        notes: '',
        overseer: '',
        allow: true
    });
    const [originalParticipant, setOriginalParticipant] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Update editing state when the participant prop changes
    useEffect(() => {
        if (participant) {
            const initial = {
                name: participant.name || '',
                device: participant.device || '',
                phone: participant.phone || '',
                notes: participant.notes || '',
                overseer: participant.overseer || '',
                allow: participant.allow !== undefined ? participant.allow : true
            };
            setEditingParticipant(initial);
            setOriginalParticipant(initial);
        }
    }, [participant]);

    // Detect changes
    useEffect(() => {
        if (originalParticipant) {
            const changed =
                editingParticipant.name !== originalParticipant.name ||
                editingParticipant.device !== originalParticipant.device ||
                editingParticipant.phone !== originalParticipant.phone ||
                editingParticipant.notes !== originalParticipant.notes ||
                editingParticipant.overseer !== originalParticipant.overseer ||
                editingParticipant.allow !== originalParticipant.allow;
            setHasChanges(changed);
        }
    }, [editingParticipant, originalParticipant]);

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

    // Handle form submission: update the participant in Firestore
    const handleSubmit = async () => {
        if (!participant?.id) return;
        const participantRef = doc(db, 'participants', participant.id);
        try {
            await updateDoc(participantRef, {
                ...editingParticipant,
                updatedAt: new Date(),
                updatedBy: auth.currentUser?.email || 'Unknown'
            });
            if (onUpdate) onUpdate(); // Callback for successful update
        } catch (error) {
            console.error('Error updating participant:', error);
        }
    };

    // Handle delete: move participant to deletedParticipants collection
    const handleDelete = async () => {
        if (!participant?.id) return;

        // Show confirmation dialog
        const confirmDelete = window.confirm(
            `Are you sure you want to delete ${participant.name || 'this participant'}? This action will move them to the deleted participants collection.`
        );

        if (!confirmDelete) return;

        try {
            // Copy the participant data to deletedParticipants collection
            const deletedParticipantRef = doc(db, 'deletedParticipants', participant.id);
            await setDoc(deletedParticipantRef, {
                ...participant,
                deletedAt: new Date().toISOString()
            });

            // Delete from participants collection
            const participantRef = doc(db, 'participants', participant.id);
            await deleteDoc(participantRef);

            if (onUpdate) onUpdate(); // Navigate back after deletion
        } catch (error) {
            console.error('Error deleting participant:', error);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Scrollable content area */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
                <h2 style={{ padding: '20px', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    Edit Participant
                </h2>
                <form className="edit-attendant-form" style={{ padding: '0 20px' }} onSubmit={(e) => e.preventDefault()}>
                    <div className="form-group">
                        <label htmlFor="participant-name">Name</label>
                        <input
                            type="text"
                            id="participant-name"
                            value={editingParticipant.name}
                            onChange={(e) =>
                                setEditingParticipant({ ...editingParticipant, name: e.target.value })
                            }
                            placeholder="Enter name"
                            style={{ backgroundColor: '#f0edee', color: '#000000', borderRadius: '25px', border: 'none', padding: '12px', fontSize: '16px' }}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="participant-device">Device</label>
                        <input
                            type="text"
                            id="participant-device"
                            value={editingParticipant.device}
                            onChange={(e) =>
                                setEditingParticipant({ ...editingParticipant, device: e.target.value })
                            }
                            placeholder="Enter device"
                            style={{ backgroundColor: '#f0edee', color: '#000000', borderRadius: '25px', border: 'none', padding: '12px', fontSize: '16px' }}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="participant-phone">Phone</label>
                        <input
                            type="tel"
                            id="participant-phone"
                            value={editingParticipant.phone}
                            onChange={(e) =>
                                setEditingParticipant({ ...editingParticipant, phone: e.target.value })
                            }
                            placeholder="Enter phone"
                            style={{ backgroundColor: '#f0edee', color: '#000000', borderRadius: '25px', border: 'none', padding: '12px', fontSize: '16px' }}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="participant-overseer">Overseer</label>
                        <input
                            type="text"
                            id="participant-overseer"
                            value={editingParticipant.overseer}
                            onChange={(e) =>
                                setEditingParticipant({ ...editingParticipant, overseer: e.target.value })
                            }
                            placeholder="Enter overseer"
                            style={{ backgroundColor: '#f0edee', color: '#000000', borderRadius: '25px', border: 'none', padding: '12px', fontSize: '16px' }}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="participant-notes">Notes</label>
                        <textarea
                            id="participant-notes"
                            value={editingParticipant.notes}
                            onChange={(e) =>
                                setEditingParticipant({ ...editingParticipant, notes: e.target.value })
                            }
                            placeholder="Enter notes"
                            rows="4"
                            style={{ backgroundColor: '#f0edee', color: '#000000', borderRadius: '25px', border: 'none', padding: '12px', fontSize: '16px', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div className="form-group" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <label htmlFor="participant-allow" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                id="participant-allow"
                                checked={editingParticipant.allow}
                                onChange={(e) =>
                                    setEditingParticipant({ ...editingParticipant, allow: e.target.checked })
                                }
                                style={{ marginRight: '8px' }}
                            />
                            Allow participant
                        </label>
                    </div>
                </form>

                {/* Delete button - centered above bottom bar */}
                <div style={{ padding: '20px', textAlign: 'center', marginTop: '20px' }}>
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
                        Delete Participant
                    </button>
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

export default EditParticipant;
