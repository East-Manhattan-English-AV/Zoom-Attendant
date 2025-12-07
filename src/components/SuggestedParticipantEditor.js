import React, { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import db from '../firebaseConfig';

function SuggestedParticipantEditor({ participant, onCancel, onUpdate }) {
    const auth = getAuth();
    const [editingParticipant, setEditingParticipant] = useState({
        name: '',
        device: '',
        phone: '',
        notes: '',
        overseer: '',
        allow: true
    });

    // Update editing state when the participant prop changes
    useEffect(() => {
        if (participant) {
            setEditingParticipant({
                name: participant.name || '',
                device: participant.device || '',
                phone: participant.phone || '',
                notes: participant.notes || '',
                overseer: participant.overseer || '',
                allow: participant.allow !== undefined ? participant.allow : true
            });
        }
    }, [participant]);

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

    const handleDeny = async () => {
        if (!participant?.id) return;

        const confirmDeny = window.confirm(
            `Are you sure you want to deny ${participant.name || 'this participant'}?`
        );
        if (!confirmDeny) return;

        try {
            const participantRef = doc(db, 'suggestedParticipants', participant.id);
            await updateDoc(participantRef, {
                status: 'denied',
                deniedAt: new Date().toISOString(),
                deniedBy: auth.currentUser?.email || 'Unknown'
            });
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error denying participant:', error);
        }
    };

    const handleAccept = async () => {
        if (!participant?.id) return;

        const confirmAccept = window.confirm(
            `Are you sure you want to accept ${editingParticipant.name || 'this participant'}?`
        );
        if (!confirmAccept) return;

        try {
            // Add to participants collection with edited data
            await addDoc(collection(db, 'participants'), {
                ...editingParticipant,
                approvedAt: new Date().toISOString(),
                approvedBy: auth.currentUser?.email || 'Unknown'
            });

            // Delete from suggestedParticipants collection
            await deleteDoc(doc(db, 'suggestedParticipants', participant.id));

            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error accepting participant:', error);
        }
    };

    const handleDelete = async () => {
        if (!participant?.id) return;

        const confirmDelete = window.confirm(
            `Are you sure you want to delete ${participant.name || 'this suggestion'}? This action cannot be undone.`
        );
        if (!confirmDelete) return;

        try {
            await deleteDoc(doc(db, 'suggestedParticipants', participant.id));
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error deleting suggested participant:', error);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Scrollable content area */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
                <h2 style={{ padding: '20px', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    Review Suggested Participant
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
                        Delete Suggestion
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
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        onClick={handleDeny}
                        style={{
                            padding: '10px 24px',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '25px',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#fecaca'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#fee2e2'}
                    >
                        Deny
                    </button>
                    <button
                        type="button"
                        onClick={handleAccept}
                        style={{
                            padding: '10px 24px',
                            backgroundColor: '#dcfce7',
                            color: '#16a34a',
                            border: 'none',
                            borderRadius: '25px',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#bbf7d0'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#dcfce7'}
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SuggestedParticipantEditor;
