import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import db from '../firebaseConfig';
import EditAttendant from './EditAttendant';
import AddAttendant from './AddAttendant';

function AttendantsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [allAttendants, setAllAttendants] = useState([]);
    const [filteredAttendants, setFilteredAttendants] = useState([]);
    const [error, setError] = useState('');
    const [selectedAttendant, setSelectedAttendant] = useState(null);
    const [isEditingAttendant, setIsEditingAttendant] = useState(false);
    const [isAddingAttendant, setIsAddingAttendant] = useState(false);

    useEffect(() => {
        const fetchAllAttendants = async () => {
            try {
                const q = query(collection(db, 'authorizedUsers'), orderBy('name', 'asc'));
                onSnapshot(q, (querySnapshot) => {
                    const attendants = querySnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setAllAttendants(attendants);
                });
            } catch (err) {
                setError('Error fetching attendants: ' + err.message);
            }
        };

        fetchAllAttendants();
    }, []);

    // Filter attendants based on the search term
    useEffect(() => {
        const filtered = allAttendants
            .filter((attendant) =>
                String(attendant.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(attendant.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(attendant.access || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                const nameA = String(a.name || '').toLowerCase();
                const nameB = String(b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });

        setFilteredAttendants(filtered);
    }, [searchTerm, allAttendants]);

    // Function to highlight matching text
    const highlightText = (text, searchTerm) => {
        if (!searchTerm) return text;

        const safeText = String(text || '');
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
        return safeText.split(regex).map((part, index) =>
            part.toLowerCase() === searchTerm.toLowerCase() ? (
                <span key={index} className="highlight">{part}</span>
            ) : (
                part
            )
        );
    };

    // Handle attendant row click to navigate to edit view
    const handleAttendantClick = (attendant) => {
        setSelectedAttendant(attendant);
        setIsEditingAttendant(true);
    };

    // Navigate back to attendants list
    const handleBackToAttendants = () => {
        setSelectedAttendant(null);
        setIsEditingAttendant(false);
        setIsAddingAttendant(false);
    };

    // Navigate to add attendant view
    const handleAddAttendant = () => {
        setIsAddingAttendant(true);
    };

    // Callback after updating attendant
    const handleAttendantUpdate = () => {
        handleBackToAttendants();
        // Attendants list updates automatically via onSnapshot
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

    // Render add attendant view if adding
    if (isAddingAttendant) {
        return (
            <AddAttendant
                onCancel={handleBackToAttendants}
                onUpdate={handleAttendantUpdate}
            />
        );
    }

    // Render edit view if editing, otherwise render attendants list view
    if (isEditingAttendant && selectedAttendant) {
        return (
            <EditAttendant
                attendant={selectedAttendant}
                onCancel={handleBackToAttendants}
                onUpdate={handleAttendantUpdate}
            />
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Search bar */}
            <div className="search-input-container" style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <input
                        type="text"
                        placeholder="Search attendants..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                            width: '100%',
                            padding: '12px 40px 12px 12px',
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
                        >
                            ✕
                        </button>
                    )}
                </div>
                <button
                    onClick={handleAddAttendant}
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

            {/* Attendants list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {filteredAttendants.length > 0 ? (
                    <ul className="participant-list">
                        {filteredAttendants.map((attendant) => (
                            <li
                                key={attendant.id}
                                className="participant-item"
                                onClick={() => handleAttendantClick(attendant)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="participant-header">
                                    <span className="participant-name">
                                        {highlightText(attendant.name || '', searchTerm)}
                                        <span style={{ color: '#6b7280', fontWeight: 'normal', marginLeft: '8px' }}>
                                            {highlightText(attendant.access || '', searchTerm)}
                                        </span>
                                        <span style={{ color: '#6b7280', fontWeight: 'normal', marginLeft: '8px' }}>
                                            {highlightText(attendant.email || '', searchTerm)}
                                        </span>
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                        {searchTerm ? 'No attendants found.' : 'No attendants available.'}
                    </p>
                )}
            </div>
        </div>
    );
}

export default AttendantsPage;
