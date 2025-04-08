import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import db from '../firebaseConfig';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    writeBatch
} from 'firebase/firestore';

const SpreadsheetImporter = () => {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);

    // Create a ref for the file input
    const fileInputRef = useRef(null);

    // Handle file selection
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setResults(null);
        }
    };

    // Trigger file input click
    const triggerFileSelect = () => {
        // Programmatically click the hidden file input
        fileInputRef.current.click();
    };

    // Map spreadsheet row to Firestore participant format
    const mapRowToParticipant = (row) => {
        const findKey = (row, keyName) => {
            // Find a key in the row object that matches the keyName (case-insensitively)
            return Object.keys(row).find((key) => key.toLowerCase().includes(keyName.toLowerCase()));
        };

        const nameKey = findKey(row, 'name');
        const phoneKey = findKey(row, 'phone');
        const deviceKey = findKey(row, 'device');
        const allowKey = findKey(row, 'allow');
        const allowInfoKey = findKey(row, 'admit info');
        const overseerKey = findKey(row, 'overseer');
        const notesKey = findKey(row, 'notes');

        return {
            name: nameKey ? row[nameKey] : '',
            phone: phoneKey ? row[phoneKey] : '',
            device: deviceKey ? row[deviceKey] : '',
            allow: allowKey ? (row[allowKey] === true || row[allowKey].toString().toLowerCase() === 'yes') : false,
            allowInfo: allowInfoKey ? row[allowInfoKey] : '',
            overseer: overseerKey ? row[overseerKey] : '',
            notes: notesKey ? row[notesKey] : ''
        };
        
        return {
            name: row['Name'] || row['name'] || row['Name (First, Last)'] || '',
            phone: row['Phone Number'] || row['phoneNumber'] || row['Phone'] || row['Phone/Add. Phone'] || '',
            device: row['Device'] || row['device'] || '',
            allow: row['Allowed'] === true || row['Can Be Admitted'] === 'Yes' || row['canBeAdmitted'] === true || false,
            allowInfo: row['Allowance Info'] || row['Admittance Info'] || row['admittanceInfo'] || '',
            overseer: row['Overseer'] || row['overseer'] || '',
            // approvedBy: row['Approved By'] || row['approvedBy'] || '',
            // dateAdded: row['Date Added'] ? new Date(row['Date Added']) : new Date(),
            notes: row['Notes'] || row['notes'] || row['Note'] || row['note'] || ''
        };
    };

    // Validate a participant entry
    const validateParticipant = (participant) => {
        const errors = [];

        if (!participant.device) errors.push('Device information is required');

        return errors;
    };

    // Process the spreadsheet and import to Firestore
    const handleImport = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setImporting(true);
        setError(null);
        setResults(null);
        setProgress(0);

        try {
            // Read the spreadsheet
            const data = await readSpreadsheet(file);
            if (!data || data.length === 0) {
                throw new Error('No data found in spreadsheet');
            }

            // Process the data
            const results = await processData(data);
            setResults(results);
        } catch (err) {
            console.error('Import error:', err);
            setError(err.message || 'An error occurred during import');
        } finally {
            setImporting(false);
            setProgress(100);
        }
    };

    // Read a spreadsheet file and convert to JSON
    const readSpreadsheet = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Get the first worksheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error(`Failed to parse spreadsheet: ${error.message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsArrayBuffer(file);
        });
    };

    // Process data for import
    const processData = async (data) => {
        const results = {
            total: data.length,
            successful: 0,
            failed: 0,
            updated: 0,
            created: 0,
            failures: []
        };

        // Use batch writes for better performance
        let batch = writeBatch(db);
        const participantsRef = collection(db, 'participants');

        // Get existing phone numbers to determine update vs. insert
        const existingParticipantsSnapshot = await getDocs(participantsRef);
        const existingParticipants = {};

        existingParticipantsSnapshot.forEach(doc => {
            const participant = doc.data();
            if (participant.device) {
                existingParticipants[participant.device] = {
                    id: doc.id,
                    ...participant
                };
            }
        });

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const participant = mapRowToParticipant(row);
            const validationErrors = validateParticipant(participant);

            // Update progress
            setProgress(Math.round((i / data.length) * 100));

            if (validationErrors.length > 0) {
                results.failed++;
                results.failures.push({
                    row: i + 1, // +2 for header row and 0-indexing
                    errors: validationErrors,
                    data: row
                });
                continue;
            }

            try {
                // Check if participant already exists
                if (participant.device && existingParticipants[participant.device]) {
                    // Update existing participant
                    const existingId = existingParticipants[participant.device].id;
                    const participantRef = doc(db, 'participants', existingId);
                    batch.update(participantRef, participant);
                    results.updated++;
                } else {
                    // Create new participant
                    const newDocRef = doc(participantsRef);
                    batch.set(newDocRef, participant);
                    results.created++;
                }

                results.successful++;
            } catch (error) {
                results.failed++;
                results.failures.push({
                    row: i + 2,
                    errors: [error.message],
                    data: row
                });
            }

            // Firebase batches are limited to 500 operations
            // If we're approaching that limit, commit the batch and start a new one
            if (i > 0 && i % 450 === 0) {
                await batch.commit();
                // Start a new batch
                batch = writeBatch(db);
            }
        }

        // Commit the final batch if there are any operations
        if (results.successful > 0) {
            await batch.commit();
        }

        return results;
    };

    // Download a template spreadsheet
    const downloadTemplate = () => {
        // Create a template worksheet
        const template = [
            {
                'Name': 'John Smith',
                'Phone Number': '123-456-7890',
                'Device': 'iPhone 13',
                'Can Be Admitted': 'Yes',
                'Admittance Info': 'Regular attendee',
                'Overseer': 'Elder Mike',
                // 'Approved By': 'Brother James',
                // 'Date Added': new Date().toISOString().split('T')[0],
                'Notes': 'Example participant'
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(template);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');

        // Generate and download the file
        XLSX.writeFile(workbook, 'participant_template.xlsx');
    };

    return (
        <div className="spreadsheet-importer">
            <body>Import Participants</body>

            <div className="import-controls">
                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    disabled={importing}
                    style={{ display: 'none' }}
                />

                <div className="button-group">
                    {/* Button to trigger file selection */}
                    <button
                        type="button"
                        onClick={triggerFileSelect}
                        disabled={importing}
                        className="file-select-button"
                    >
                        Select Spreadsheet
                    </button>

                    {/* Display selected filename */}
                    {file && (
                        <div className="selected-file">
                            Selected: <span className="filename">{file.name}</span>
                        </div>
                    )}

                    {/* Import button */}
                    <button
                        onClick={handleImport}
                        disabled={!file || importing}
                        className="import-button"
                    >
                        {importing ? 'Importing...' : 'Import Spreadsheet'}
                    </button>

                    {/* Template download button */}
                    {/* <button
                        onClick={downloadTemplate}
                        className="template-button"
                        disabled={importing}
                    >
                        Download Template
                    </button> */}
                </div>

                {/* Rest of your component */}
                {importing && (
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        ></div>
                        <span className="progress-text">{progress}%</span>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        Error: {error}
                    </div>
                )}

                {results && (
                    <div className="results-summary">
                        <h3>Import Results</h3>
                        <div className="results-stats">
                            <div>Total rows: {results.total}</div>
                            <div>Successfully processed: {results.successful}</div>
                            <div>New records: {results.created}</div>
                            <div>Updated records: {results.updated}</div>
                            <div>Failed: {results.failed}</div>
                        </div>

                        {results.failures.length > 0 && (
                            <div className="failures">
                                <h4>Failed Entries</h4>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Row</th>
                                            <th>Errors</th>
                                            <th>Data</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.failures.map((failure, index) => (
                                            <tr key={index}>
                                                <td>{failure.row}</td>
                                                <td>{failure.errors.join(', ')}</td>
                                                <td>{JSON.stringify(failure.data)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpreadsheetImporter;