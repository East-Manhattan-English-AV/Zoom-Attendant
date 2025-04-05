import React, { useState } from 'react';
import db from '../firebaseConfig';

function SearchPage({ user }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [participants, setParticipants] = useState([]);
    const [error, setError] = useState('');

    // Query the 'participants' collection based on the search term
    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            // Here we assume that the search should check the 'name' field for simplicity.
            // Adjust the field or add additional filters as needed.
            const querySnapshot = await db
                .collection('participants')
                .orderBy('device', 'asc')
                .where('name', '>=', searchTerm)
                .where('name', '<=', searchTerm + '\uf8ff')
                .get();

            const results = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setParticipants(results);
        } catch (err) {
            setError('Search error: ' + err.message);
        }
    };

    return (
        <div className="search-container">
            <h2>Welcome, {user.name || 'Attendant'}!</h2>
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search Participants by Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit">Search</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div className="results">
                <h3>Results</h3>
                {participants.length > 0 ? (
                    <ul>
                        {participants.map((p) => (
                            <li key={p.id}>
                                <strong>{p.name}</strong> - Device: {p.device}
                                {/* Optionally, add other fields like phoneNumber, notes, etc. */}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No results found.</p>
                )}
            </div>
        </div>
    );
}

export default SearchPage;