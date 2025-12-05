import React, { useState, useEffect } from 'react';
import db from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import EditParticipant from './EditParticipant';

function SearchPage({ userAccess }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [allParticipants, setAllParticipants] = useState([]); // Store all participants
    const [filteredParticipants, setFilteredParticipants] = useState([]); // Store filtered participants
    const [error, setError] = useState('');
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [isEditingParticipant, setIsEditingParticipant] = useState(false);

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
                <div className="search-input-container" style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search Participants…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{ paddingRight: searchTerm ? '40px' : '12px' }}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '20px',
                                color: '#6b7280',
                                padding: '0 5px',
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
                {searchTerm && (
                    <p style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        marginTop: '4px',
                        marginBottom: '0'
                    }}>
                        Keyboard shortcut: Press Shift + Delete/Backspace to quickly remove all text
                    </p>
                )}
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div className="results">
                {filteredParticipants.length > 0 ? (
                    <ul className="participant-list">
                        {filteredParticipants.map((p) => (
                            <li
                                key={p.id}
                                className="participant-item"
                                onClick={() => handleParticipantClick(p)}
                                style={{ cursor: userAccess === 'admin' ? 'pointer' : 'default' }}
                            >
                                <div className="participant-header">
                                    <span className="participant-name">
                                        {highlightText(p.name || '', searchTerm)}
                                    </span>
                                    <span className="participant-info">
                                        {highlightText(p.phone || '', searchTerm)} | {highlightText(p.device || '', searchTerm)}
                                        {!p.allow && (
                                            <span className="red-pill">NOT ALLOWED</span>
                                        )}
                                    </span>
                                </div>
                                <div className="participant-overseer">
                                    Overseer: {highlightText(p.overseer || 'N/A', searchTerm)}
                                </div>
                                <div className="participant-notes">
                                    Notes: {highlightText(p.notes || 'No notes available', searchTerm)}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Nothing to show…</p>
                )}
            </div>
        </div>
    );
}

export default SearchPage;