import React, { useState, useEffect } from 'react';
import db from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import EditParticipant from './EditParticipant';
import AddParticipant from './AddParticipant';

function SearchPage({ userAccess }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [allParticipants, setAllParticipants] = useState([]); // Store all participants
    const [filteredParticipants, setFilteredParticipants] = useState([]); // Store filtered participants
    const [error, setError] = useState('');
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [isEditingParticipant, setIsEditingParticipant] = useState(false);
    const [isAddingParticipant, setIsAddingParticipant] = useState(false);

    useEffect(() => {
        const fetchAllParticipants = async () => {
            try {
                const q = query(collection(db, "participants"), orderBy('device', 'asc'));
                onSnapshot(q, (querySnapshot) => {
                    const participants = [];
                    querySnapshot.forEach((doc) => {
                        participants.push(doc.data().name);
                    });
                    const allParticipants = querySnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setAllParticipants(allParticipants);
                });
            } catch (err) {
                setError('Error fetching participants: ' + err.message);
            }
        };

        fetchAllParticipants();
    }, []);

    // Filter participants based on the search term
    useEffect(() => {
        const filtered = allParticipants
            .filter((participant) =>
                String(participant.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(participant.device || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(participant.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(participant.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(participant.overseer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(participant.allowInfo || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                const nameA = String(a.name || '').toLowerCase();
                const nameB = String(b.name || '').toLowerCase();

                // If both names are empty, sort by device
                if (!nameA && !nameB) {
                    const deviceA = String(a.device || '').toLowerCase();
                    const deviceB = String(b.device || '').toLowerCase();
                    return deviceA.localeCompare(deviceB);
                }

                // If one name is empty, prioritize the non-empty name
                if (!nameA) return 1;
                if (!nameB) return -1;

                // Otherwise, sort by name
                return nameA.localeCompare(nameB);
            });

        setFilteredParticipants(filtered);
    }, [searchTerm, allParticipants]);

    // Function to highlight matching text
    const highlightText = (text, searchTerm) => {
        if (!searchTerm) return text;

        // Ensure `text` is always a string
        const safeText = String(text || ''); // Explicitly convert `text` to a string

        // Escape special characters in the search term
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters

        const regex = new RegExp(`(${escapedSearchTerm})`, 'gi'); // Match search term case-insensitively
        return safeText.split(regex).map((part, index) =>
            part.toLowerCase() === searchTerm.toLowerCase() ? (
                <span key={index} className="highlight">{part}</span>
            ) : (
                part
            )
        );
    };

    // Handle participant row click to navigate to edit view (only if user is admin)
    const handleParticipantClick = (participant) => {
        if (userAccess === 'admin') {
            setSelectedParticipant(participant);
            setIsEditingParticipant(true);
        }
    };

    // Navigate back to search list
    const handleBackToSearch = () => {
        setSelectedParticipant(null);
        setIsEditingParticipant(false);
        setIsAddingParticipant(false);
    };

    // Navigate to add participant view
    const handleAddParticipant = () => {
        setIsAddingParticipant(true);
    };

    // Callback after updating participant
    const handleParticipantUpdate = () => {
        handleBackToSearch();
        // Participants list updates automatically via onSnapshot
    };

    // Clear search text
    const clearSearch = () => {
        setSearchTerm('');
    };

    // Handle keyboard shortcut: Shift + Delete/Backspace to clear search
    const handleKeyDown = (e) => {
        if (e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) {
            e.preventDefault();
            clearSearch();
        }
    };

    // Render add participant view if adding
    if (isAddingParticipant) {
        return (
            <AddParticipant
                initialName={searchTerm}
                userAccess={userAccess}
                onCancel={handleBackToSearch}
                onUpdate={handleParticipantUpdate}
            />
        );
    }

    // Render edit view if editing, otherwise render search view
    if (isEditingParticipant && selectedParticipant) {
        return (
            <EditParticipant
                participant={selectedParticipant}
                onCancel={handleBackToSearch}
                onUpdate={handleParticipantUpdate}
            />
        );
    }

    return (
        <div className="search-container">
            <form onSubmit={(e) => e.preventDefault()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            type="text"
                            placeholder="Search Participants…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{
                                width: '100%',
                                padding: searchTerm ? '12px 40px 12px 12px' : '12px',
                                fontSize: '16px',
                                border: 'none',
                                borderRadius: '25px',
                                outline: 'none',
                                backgroundColor: '#f0edee',
                                boxSizing: 'border-box'
                            }}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    color: '#6b7280',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                aria-label="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleAddParticipant}
                        style={{
                            padding: '12px 16px',
                            backgroundColor: 'transparent',
                            color: 'black',
                            border: 'none',
                            borderRadius: '25px',
                            fontSize: '20px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '48px'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#a9adb2';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                        }}
                    >
                        +
                    </button>
                </div>
                {searchTerm && (
                    <p style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        marginTop: '4px',
                        marginBottom: '0',
                        paddingLeft: '10px'
                    }}>
                        Keyboard shortcut: Press Shift + Delete/Backspace to quickly remove all text
                    </p>
                )}
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div className="results">
                {filteredParticipants.length > 0 ? (
                    <ul className="participant-list">
                        {filteredParticipants.map((p) => {
                            const overseer = p.overseer || '';
                            const notes = p.notes || '';
                            const phone = p.phone || '';
                            const device = p.device || '';

                            const shouldShowOverseer = overseer && overseer !== '-' && overseer.toLowerCase() !== 'n/a';
                            const shouldShowNotes = notes && notes !== '-' && notes.toLowerCase() !== 'n/a' && notes.toLowerCase() !== 'no notes available';

                            // Check if phone and device should be displayed
                            const hasPhone = phone && phone !== '-';
                            const hasDevice = device && device !== '-';

                            // Build contact info string
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
                                    style={{ cursor: userAccess === 'admin' ? 'pointer' : 'default' }}
                                >
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
                                            {highlightText(p.name || '', searchTerm)}
                                            {contactInfo && (
                                                <span style={{ color: '#6b7280', fontWeight: 'normal', marginLeft: '8px' }}>
                                                    {highlightText(contactInfo, searchTerm)}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    {shouldShowOverseer && (
                                        <div className="participant-overseer">
                                            Overseer: {highlightText(overseer, searchTerm)}
                                        </div>
                                    )}
                                    {shouldShowNotes && (
                                        <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                                            {highlightText(notes, searchTerm)}
                                        </div>
                                    )}
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
                        <p>No results. Check your entry or suggest an entry for review</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SearchPage;