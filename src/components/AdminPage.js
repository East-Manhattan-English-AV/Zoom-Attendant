import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import db from '../firebaseConfig';
import SpreadsheetImporter from './SpreadsheetImporter';
import EditAttendant from './EditAttendant';  // Import the editing component

function AdminPage() {
    // State for managing duplicates (existing)
    const [duplicates, setDuplicates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingParticipant, setEditingParticipant] = useState(null);
    const [otherDuplicates, setOtherDuplicates] = useState([]);

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
    const closeEditModal = () => {
        setEditingParticipant(null);
        setOtherDuplicates([]);
    };

    // Save updated participant (existing)
    const saveParticipant = async () => {
        if (!editingParticipant) return;
        try {
            const participantRef = doc(db, 'participants', editingParticipant.id);
            await updateDoc(participantRef, editingParticipant);
            checkForDuplicates();
            closeEditModal();
        } catch (err) {
            setError('Error saving participant: ' + err.message);
        }
    };

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
                <h2>Import Participants</h2>
                <p>Upload a spreadsheet to import participants. Note: Ensure the spreadsheet is formatted correctly. Supported formats: .xlsx, .csv.</p>
                <SpreadsheetImporter /> 
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

            {/* Modal for editing participant */}
            {editingParticipant && (
                <div
                    className="modal-overlay"
                    onClick={closeEditModal} // Close modal when clicking outside
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()} // Prevent click events from propagating to the overlay
                    >
                        <div className="modal-header">
                            <button className="close-button" onClick={closeEditModal}>Cancel</button>
                            <h3>Edit Participant</h3>
                            <button className="save-button" onClick={saveParticipant}>Save</button>
                        </div>
                        <div className="modal-body">
                            <form>
                                <label>
                                    Name:
                                    <input
                                        type="text"
                                        value={editingParticipant?.name || ''}
                                        onChange={(e) =>
                                            setEditingParticipant({ ...editingParticipant, name: e.target.value })
                                        }
                                    />
                                </label>
                                {/* <label>
                                    Phone:
                                    <input
                                        type="text"
                                        value={editingParticipant?.phone || ''}
                                        onChange={(e) =>
                                            setEditingParticipant({ ...editingParticipant, phone: e.target.value })
                                        }
                                    />
                                </label>
                                <label>
                                    Device:
                                    <input
                                        type="text"
                                        value={editingParticipant?.device || ''}
                                        onChange={(e) =>
                                            setEditingParticipant({ ...editingParticipant, device: e.target.value })
                                        }
                                    />
                                </label>
                                <label>
                                    Notes:
                                    <textarea
                                        value={editingParticipant?.notes || ''}
                                        onChange={(e) =>
                                            setEditingParticipant({ ...editingParticipant, notes: e.target.value })
                                        }
                                    />
                                </label> */}
                            </form>
                            <h4>Other Duplicates:</h4>
                            <ul>
                                {otherDuplicates.map((duplicate) => (
                                    <li key={duplicate.id}>
                                        {duplicate.name} - {duplicate.phone} - {duplicate.device} - {duplicate.notes}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
            {editAttendant && (
                <div
                    className="modal-overlay"
                    onClick={closeEditAttendantModal}
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3>Edit Attendant</h3>
                        </div>
                        <div className="modal-body">
                            <EditAttendant
                                attendant={stableAttendant} // Pass the memoized object
                                onCancel={closeEditAttendantModal}
                                onUpdate={handleAttendantUpdate}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;