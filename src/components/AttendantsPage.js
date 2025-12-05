import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import db from '../firebaseConfig';
import EditAttendant from './EditAttendant';
import AddAttendant from './AddAttendant';

function AttendantsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [allAttendants, setAllAttendants] = useState([]);
    const [filteredAttendants, setFilteredAttendants] = useState([]);
    const [pendingRegistrants, setPendingRegistrants] = useState([]);
    const [error, setError] = useState('');
    const [selectedAttendant, setSelectedAttendant] = useState(null);
    const [isEditingAttendant, setIsEditingAttendant] = useState(false);
    const [isAddingAttendant, setIsAddingAttendant] = useState(false);
    const auth = getAuth();

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

        const fetchPendingRegistrants = async () => {
            try {
                const q = query(collection(db, 'pendingRegistrants'));
                onSnapshot(q, (querySnapshot) => {
                    const pending = querySnapshot.docs
                        .map((doc) => ({
                            id: doc.id,
                            ...doc.data(),
                        }))
                        .filter(item => item.status === 'pending')
                        .sort((a, b) => {
                            if (!a.dateSubmitted || !b.dateSubmitted) return 0;
                            return a.dateSubmitted.toDate() - b.dateSubmitted.toDate();
                        });
                    console.log('Pending registrants:', pending);
                    setPendingRegistrants(pending);
                });
            } catch (err) {
                console.error('Error fetching pending registrants:', err);
                setError('Error fetching pending registrants: ' + err.message);
            }
        };

        fetchAllAttendants();
        fetchPendingRegistrants();
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

    // Handle approving a pending registrant
    const handleApprove = async (registrant) => {
        try {
            const currentUser = auth.currentUser;

            // Move to authorizedUsers collection
            await setDoc(doc(db, 'authorizedUsers', registrant.id), {
                name: registrant.name,
                email: registrant.email,
                access: 'basic', // Default access level
                accessCode: registrant.accessCode,
                congregationCode: registrant.congregationCode,
                approvedOn: new Date(),
                approvedBy: currentUser?.email || 'Unknown'
            });

            // Delete from pendingRegistrants
            await deleteDoc(doc(db, 'pendingRegistrants', registrant.id));
        } catch (error) {
            console.error('Error approving registrant:', error);
            setError('Error approving registrant: ' + error.message);
        }
    };

    // Handle denying a pending registrant
    const handleDeny = async (registrant) => {
        try {
            const currentUser = auth.currentUser;

            // Update status to denied
            await updateDoc(doc(db, 'pendingRegistrants', registrant.id), {
                status: 'denied',
                deniedOn: new Date(),
                deniedBy: currentUser?.email || 'Unknown'
            });
        } catch (error) {
            console.error('Error denying registrant:', error);
            setError('Error denying registrant: ' + error.message);
        }
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
        <div className="search-container" style={{ padding: '0 60px' }}>
            <form onSubmit={(e) => e.preventDefault()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            type="text"
                            placeholder="Search attendants..."
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
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleAddAttendant}
                        style={{
                            padding: '10px',
                            backgroundColor: 'transparent',
                            color: 'black',
                            border: 'none',
                            borderRadius: '50%',
                            fontSize: '28px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '48px',
                            height: '48px'
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
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* Attendants list */}
            <div className="results">
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

            {/* Pending Approval section */}
            {pendingRegistrants.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', paddingLeft: '10px' }}>
                        Pending Approval
                    </h3>
                    <ul className="participant-list">
                        {pendingRegistrants.map((registrant) => (
                            <li
                                key={registrant.id}
                                className="participant-item"
                                style={{ cursor: 'default' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <div className="participant-header" style={{ flex: 1 }}>
                                        <span className="participant-name">
                                            {registrant.name || 'Unknown'}
                                            <span style={{ color: '#6b7280', fontWeight: 'normal', marginLeft: '8px' }}>
                                                {registrant.email || ''}
                                            </span>
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                                        <button
                                            onClick={() => handleDeny(registrant)}
                                            style={{
                                                padding: '6px 16px',
                                                backgroundColor: '#dc2626',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '25px',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
                                            onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
                                        >
                                            Deny
                                        </button>
                                        <button
                                            onClick={() => handleApprove(registrant)}
                                            style={{
                                                padding: '6px 16px',
                                                backgroundColor: '#10b981',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '25px',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                                            onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                                        >
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default AttendantsPage;
