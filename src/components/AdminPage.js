import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import db from '../firebaseConfig';
import SpreadsheetImporter from './SpreadsheetImporter';

function AdminPage () {
    const [participants, setParticipants] = useState([]);
    const [duplicates, setDuplicates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingParticipant, setEditingParticipant] = useState(null); // Participant being edited
    const [otherDuplicates, setOtherDuplicates] = useState([]); // Other duplicates in the group

    // Function to check for duplicates in Firestore
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
            setParticipants(participants);

            // Find duplicates based on specific fields (e.g., name, phone, or device)
            const duplicatesMap = {};
            participants.forEach((participant) => {
                const key = `${participant.name}-${participant.phone}-${participant.device}`; // Combine fields to create a unique key
                if (duplicatesMap[key]) {
                    duplicatesMap[key].push(participant);
                } else {
                    duplicatesMap[key] = [participant];
                }
            });

            // Filter out keys with only one entry (no duplicates)
            const duplicateEntries = Object.values(duplicatesMap).filter((entries) => entries.length > 1);

            setDuplicates(duplicateEntries);
        } catch (err) {
            setError('Error checking for duplicates: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Open the modal to edit a participant
    const openEditModal = (participant, group) => {
        setEditingParticipant(participant);
        setOtherDuplicates(group.filter((p) => p.id !== participant.id)); // Exclude the selected participant
    };

    // Close the modal
    const closeEditModal = () => {
        setEditingParticipant(null);
        setOtherDuplicates([]);
    };

    // Save the updated participant information
    const saveParticipant = async () => {
        if (!editingParticipant) return;

        try {
            const participantRef = doc(db, 'participants', editingParticipant.id);
            await updateDoc(participantRef, editingParticipant);

            // Refresh duplicates after saving
            checkForDuplicates();
            closeEditModal();
        } catch (err) {
            setError('Error saving participant: ' + err.message);
        }
    };

    useEffect(() => {
        checkForDuplicates();
    }, []);

    return (
        <div className="admin-panel">
            <section>
                <h2>Import Participants</h2>
                <p>Upload a spreadsheet to import participants.</p>
                <p>Note: Ensure the spreadsheet is formatted correctly.</p>
                <p>Supported formats: .xlsx, .csv</p>
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
                                            <button onClick={() => openEditModal(participant, group)}>
                                                Edit
                                            </button>
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
        </div>
    );
};

export default AdminPage;