import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import db from '../firebaseConfig';
import EditAttendant from './EditAttendant';

function AdminPage() {
    // State for managing duplicates (existing)
    const [duplicates, setDuplicates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // State for fetching all attendants and editing one
    const [attendants, setAttendants] = useState([]);
    const [selectedAttendant, setSelectedAttendant] = useState(null);
    const [isEditingAttendant, setIsEditingAttendant] = useState(false);

    // Function to fetch attendants from Firestore
    const fetchAttendants = async () => {
        try {
            const attendantsRef = collection(db, 'authorizedUsers');
            const snapshot = await getDocs(attendantsRef);
            const attendantsData = [];
            snapshot.forEach((doc) => {
                attendantsData.push({ id: doc.id, ...doc.data() });
            });
            setAttendants(attendantsData);
        } catch (err) {
            setError('Error fetching attendants: ' + err.message);
        }
    };

    // Function to check for duplicates in Firestore (existing)
    const checkForDuplicates = async () => {
        setLoading(true);
        setError('');
        try {
            const participantsRef = collection(db, 'participants');
            const snapshot = await getDocs(participantsRef);
            const participants = [];
            snapshot.forEach((doc) => {
                participants.push({ id: doc.id, ...doc.data() });
            });
            const duplicatesMap = {};
            participants.forEach((participant) => {
                const key = `${participant.name}-${participant.phone}-${participant.device}`;
                if (duplicatesMap[key]) {
                    duplicatesMap[key].push(participant);
                } else {
                    duplicatesMap[key] = [participant];
                }
            });
            const duplicateEntries = Object.values(duplicatesMap).filter((entries) => entries.length > 1);
            setDuplicates(duplicateEntries);
        } catch (err) {
            setError('Error checking for duplicates: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Close the participant modal (existing)
    // const closeEditModal = () => {
    //     setEditingParticipant(null);
    //     // setOtherDuplicates([]);
    // };

    // Save updated participant (existing)
    // const saveParticipant = async () => {
    //     if (!editingParticipant) return;
    //     try {
    //         const participantRef = doc(db, 'participants', editingParticipant.id);
    //         await updateDoc(participantRef, editingParticipant);
    //         checkForDuplicates();
    //         closeEditModal();
    //     } catch (err) {
    //         setError('Error saving participant: ' + err.message);
    //     }
    // };

    // Handle attendant row click to navigate to edit view
    const handleEditAttendant = (attendant) => {
        setSelectedAttendant(attendant);
        setIsEditingAttendant(true);
    };

    // Navigate back to admin list
    const handleBackToAdmin = () => {
        setSelectedAttendant(null);
        setIsEditingAttendant(false);
    };

    // Callback after updating attendant
    const handleAttendantUpdate = () => {
        handleBackToAdmin();
        fetchAttendants();
    };

    useEffect(() => {
        checkForDuplicates();
        fetchAttendants();
    }, []);

    // Render edit view if editing, otherwise render admin list view
    if (isEditingAttendant && selectedAttendant) {
        return (
            <EditAttendant
                attendant={selectedAttendant}
                onCancel={handleBackToAdmin}
                onUpdate={handleAttendantUpdate}
            />
        );
    }

    return (
        <div className="min-h-screen p-8 bg-gray-100">
            <div className="max-w-md mx-auto">
                <div className="admin-panel">
                    <section>
                        <h2>Attendants</h2>
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                        {attendants.length > 0 ? (
                            <ul className="participant-list">
                                {attendants.map((attendant) => (
                                    <li
                                        key={attendant.id}
                                        className="participant-item"
                                        onClick={() => handleEditAttendant(attendant)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="participant-header">
                                            <span className="participant-name">
                                                {attendant.name}
                                                <span style={{ color: '#6b7280', fontWeight: 'normal', marginLeft: '8px' }}>
                                                    {attendant.access}
                                                </span>
                                                <span style={{ color: '#6b7280', fontWeight: 'normal', marginLeft: '8px' }}>
                                                    {attendant.email}
                                                </span>
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No attendants found.</p>
                        )}
                    </section>

                    <section>
                        <h2>Duplicate Entries</h2>
                        {loading && <p>Loading...</p>}
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                        {duplicates.length > 0 ? (
                            <ul>
                                {duplicates.map((group, index) => (
                                    <li key={index}>
                                        <p><strong>Duplicate Group:</strong></p>
                                        <ul>
                                            {group.map((participant) => (
                                                <li key={participant.id}>
                                                    {participant.name} - {participant.phone} - {participant.device}
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            !loading && <p>No duplicate entries found.</p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;