import React, { useState, useEffect } from 'react';
import db from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { getAuth } from 'firebase/auth';
import SuggestedParticipantEditor from './SuggestedParticipantEditor';

function SuggestedParticipantsPage({ onBack }) {
    const auth = getAuth();
    const [suggestedParticipants, setSuggestedParticipants] = useState([]);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSuggestedParticipants = async () => {
            try {
                const q = query(collection(db, "suggestedParticipants"), orderBy('suggestedAt', 'desc'));
                onSnapshot(q, (querySnapshot) => {
                    const participants = querySnapshot.docs
                        .map((doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        }))
                        .filter(p => p.status === 'pending');
                    setSuggestedParticipants(participants);
                });
            } catch (err) {
                setError('Error fetching suggested participants: ' + err.message);
            }
        };

        fetchSuggestedParticipants();
    }, []);

    const handleParticipantClick = (participant) => {
        setSelectedParticipant(participant);
        setIsEditing(true);
    };

    const handleBackToList = () => {
        setSelectedParticipant(null);
        setIsEditing(false);
    };

    const handleDeny = async (participant, e) => {
        if (e) e.stopPropagation();

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
        } catch (error) {
            console.error('Error denying participant:', error);
        }
    };

    const handleAccept = async (participant, e) => {
        if (e) e.stopPropagation();

        const confirmAccept = window.confirm(
            `Are you sure you want to accept ${participant.name || 'this participant'}?`
        );
        if (!confirmAccept) return;

        try {
            // Add to participants collection
            const { id, suggestedAt, status, ...participantData } = participant;
            await addDoc(collection(db, 'participants'), {
                ...participantData,
                approvedAt: new Date().toISOString(),
                approvedBy: auth.currentUser?.email || 'Unknown'
            });

            // Delete from suggestedParticipants collection
            await deleteDoc(doc(db, 'suggestedParticipants', participant.id));
        } catch (error) {
            console.error('Error accepting participant:', error);
        }
    };

    if (isEditing && selectedParticipant) {
        return (
            <SuggestedParticipantEditor
                participant={selectedParticipant}
                onCancel={handleBackToList}
                onUpdate={handleBackToList}
            />
        );
    }

    return (
        <div className="search-container" style={{ padding: '0 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}>
                <button
                    type="button"
                    onClick={onBack}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '25px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                    }}
                >
                    Back
                </button>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                    Suggested Participants ({suggestedParticipants.length})
                </h2>
            </div>

            {error && <p style={{ color: 'red', padding: '10px' }}>{error}</p>}

            <div className="results">
                {suggestedParticipants.length > 0 ? (
                    <ul className="participant-list">
                        {suggestedParticipants.map((p) => {
                            const overseer = p.overseer || '';
                            const notes = p.notes || '';
                            const phone = p.phone || '';
                            const device = p.device || '';

                            const shouldShowOverseer = overseer && overseer !== '-' && overseer.toLowerCase() !== 'n/a';
                            const shouldShowNotes = notes && notes !== '-' && notes.toLowerCase() !== 'n/a' && notes.toLowerCase() !== 'no notes available';

                            const hasPhone = phone && phone !== '-';
                            const hasDevice = device && device !== '-';

                            let contactInfo = '';
                            if (hasPhone && hasDevice) {
                                contactInfo = `${phone} | ${device}`;
                            } else if (hasPhone) {
                                contactInfo = phone;
                            } else if (hasDevice) {
                                contactInfo = device;
                            }

                            return (
                                <li
                                    key={p.id}
                                    className="participant-item"
                                    onClick={() => handleParticipantClick(p)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div className="participant-header">
                                                <span className="participant-name">
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '20px',
                                                        height: '20px',
                                                        borderRadius: '50%',
                                                        backgroundColor: p.allow ? '#10b981' : '#ef4444',
                                                        color: '#ffffff',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        marginRight: '8px',
                                                        flexShrink: 0
                                                    }}>
                                                        {p.allow ? '✓' : '✕'}
                                                    </span>
                                                    {p.name || ''}
                                                    {contactInfo && (
                                                        <span style={{ color: '#6b7280', fontWeight: 'normal', marginLeft: '8px' }}>
                                                            {contactInfo}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            {shouldShowOverseer && (
                                                <div className="participant-overseer">
                                                    Overseer: {overseer}
                                                </div>
                                            )}
                                            {shouldShowNotes && (
                                                <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                                                    {notes}
                                                </div>
                                            )}
                                            {p.suggestedAt && (
                                                <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>
                                                    Suggested: {new Date(p.suggestedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeny(p, e)}
                                                style={{
                                                    padding: '6px 16px',
                                                    backgroundColor: '#fee2e2',
                                                    color: '#dc2626',
                                                    border: 'none',
                                                    borderRadius: '20px',
                                                    fontSize: '14px',
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
                                                onClick={(e) => handleAccept(p, e)}
                                                style={{
                                                    padding: '6px 16px',
                                                    backgroundColor: '#dcfce7',
                                                    color: '#16a34a',
                                                    border: 'none',
                                                    borderRadius: '20px',
                                                    fontSize: '14px',
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
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '300px',
                        textAlign: 'center',
                        color: '#6b7280',
                        fontSize: '16px'
                    }}>
                        <p>No pending suggested participants</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SuggestedParticipantsPage;
