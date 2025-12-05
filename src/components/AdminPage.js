import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import db from '../firebaseConfig';
import EditAttendant from './EditAttendant';
import Sheet from './Sheet';
import SheetContent from './SheetContent';

function AdminPage() {
    // State for managing duplicates (existing)
    const [duplicates, setDuplicates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // const [editingParticipant, setEditingParticipant] = useState(null);
    // const [otherDuplicates, setOtherDuplicates] = useState([]);

    // NEW: State for fetching all attendants and editing one
    const [attendants, setAttendants] = useState([]);
    const [editingAttendantRecord, setEditingAttendantRecord] = useState(null);
    const [editAttendant, setEditAttendant] = useState(false);

    // Use useMemo to stabilize the editingAttendantRecord object
    const stableAttendant = useMemo(() => editingAttendantRecord, [editingAttendantRecord]);

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

    // Callback to close the EditAttendant modal
    const closeEditAttendantModal = () => {
        setEditingAttendantRecord(null);
        setEditAttendant(false);
    };

    const handleEditAttendant = (attendant) => {
        setEditingAttendantRecord(attendant);
        setEditAttendant(true);
    };

    // Callback to update attendant in Firestore is handled inside EditAttendant.
    // Here we simply re-fetch attendants after the update.
    const handleAttendantUpdate = () => {
        closeEditAttendantModal();
        fetchAttendants();
    };

    useEffect(() => {
        checkForDuplicates();
        fetchAttendants();
    }, []);

    return (
        <div className="min-h-screen p-8 bg-gray-100">
            <div className="max-w-md mx-auto">
                <div className="admin-panel">
                    <section>
                        <h2>Attendants</h2>
                        {error && <p style={{ color: 'red' }}>{error}</p>}
                        {attendants.length > 0 ? (
                            <ul>
                                {attendants.map((attendant) => (
                                    <li key={attendant.id}>
                                        <button key={attendant.id} onClick={() => handleEditAttendant(attendant)}>
                                            {attendant.name} - {attendant.email} - {attendant.access}
                                        </button>
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
                    <Sheet isOpen={editAttendant} onClose={closeEditAttendantModal}>
                        <SheetContent>
                            <EditAttendant
                                attendant={stableAttendant}
                                onCancel={closeEditAttendantModal}
                                onUpdate={handleAttendantUpdate}
                            />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>    
        </div>
    );
};

export default AdminPage;