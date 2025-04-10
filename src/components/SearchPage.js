import React, { useState, useEffect } from 'react';
import db from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

function SearchPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [allParticipants, setAllParticipants] = useState([]); // Store all participants
    const [filteredParticipants, setFilteredParticipants] = useState([]); // Store filtered participants
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAllParticipants = async () => {
            try {
                const q = query(collection(db, "participants"), orderBy('device', 'asc'));
                onSnapshot(q, (querySnapshot) => {
                    console.log("Current participants fetched.")
                    const participants = [];
                    querySnapshot.forEach((doc) => {
                        participants.push(doc.data().name);
                    });
                    console.log("Participants: ", participants);
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

    return (
        <div className="search-container">
            <form onSubmit={(e) => e.preventDefault()}>
                <div className="search-input-container">
                    <input
                        type="text"
                        placeholder="Search Participants…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div className="results">
                {filteredParticipants.length > 0 ? (
                    <ul className="participant-list">
                        {filteredParticipants.map((p) => (
                            <li key={p.id} className="participant-item">
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