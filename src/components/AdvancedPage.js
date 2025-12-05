import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import db from '../firebaseConfig';
import SpreadsheetImporter from './SpreadsheetImporter';

function AdvancedPage() {
    // State for managing duplicates
    const [duplicates, setDuplicates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    useEffect(() => {
        checkForDuplicates();
    }, []);

    return (
        <div className="min-h-screen p-8 bg-gray-100">
            <div className="max-w-md mx-auto">
                <div className="admin-panel">
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
                </div>
            </div>
        </div>
    );
}

export default AdvancedPage;
