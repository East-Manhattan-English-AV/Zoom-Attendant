import React, { useState } from 'react';
import SearchPage from './SearchPage';
import NavBar from './NavBar';
import AdminPage from './AdminPage';
import ZoomMtgEmbedded from '@zoom/meetingsdk/embedded';

const MainContent = ({ user, userAccess, onLogout }) => {
    const allTabs = [
        { key: 'search', label: 'Search' },
        { key: 'admin', label: 'Admin' },
    ]

    const authEndpoint = "https://zoom-attendant-meeting-auth.web.app";
    const sdkKey = "IHOzSYcT0OCno8mVQvVRA";
    const role = 0;
    const userName = "Zoom Attendant";
    const [showZoomForm, setShowZoomForm] = useState(false);
    const [meetingID, setMeetingID] = useState('');
    const [passcode, setPasscode] = useState('');
    const client = ZoomMtgEmbedded.createClient();

    // Filter tabs based on userRole
    const availableTabs = allTabs.filter((tab) => {
        if (tab.key === 'admin') {
            return userAccess === 'admin'; // Only show admin tab for admin users
        }
        return true;
    });

    // Manage the current view state. Default to first available tab.
    const [currentView, setCurrentView] = useState('search');

    // Handler to change the view when a tab is clicked
    const handleViewChange = (view) => {
        setCurrentView(view);
    };

    // Handler for the "Connect" button
    const handleConnect = async () => {
        console.log('Connecting to meeting:', meetingID, passcode);
        connectZoom(); // Call the connectZoom function to initialize the Zoom client
        setShowZoomForm(false); // Hide the form
    };

    // Handler for the "Cancel" button
    const handleCancel = () => {
        setShowZoomForm(false); // Hide the form without connecting
    };

    // Render the component that matches the current view
    const renderView = () => {
        switch (currentView) {
            case 'search':
                return (
                    <div className="content-container">
                        <div id="meetingSDKElement">
                            {/* <!-- Meeting SDK renders here when a user starts or joins a Zoom meeting --> */}
                        </div>
                        <div className="search-view">
                            <SearchPage user={user} />
                        </div>
                    </div>
                );
            case 'admin':
                return <AdminPage />
            default:
                // If the current view doesn't match any tab, return null or a default component
                return null;
        }
    };

    const connectZoom = async () => {
        const getSignature = async () => {
            try {
                const req = await fetch(authEndpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        meetingNumber: meetingID,
                        role: role,
                    }),
                });
                const res = await req.json()
                const signature = res.signature;
                startMeeting(signature)
            } catch (e) {
                console.log(e);
            }
        };
        getSignature();
    };

    const startMeeting = async (signature) => {
        const meetingSDKElement = document.getElementById('meetingSDKElement');
        try {
            await client.init({ zoomAppRoot: meetingSDKElement, language: 'en-US' })

            await client.join({
                signature: signature,
                sdkKey: sdkKey,
                meetingNumber: meetingID,
                userName: userName,
                passWord: passcode
            });
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="main-content-container">
            <div className="header">
                <span className="user-name">Hi, {user.name || 'Attendant'}!</span>
                <div className="tab-bar">
                    <NavBar
                        user={user}
                        activeTab={currentView}
                        onTabChange={handleViewChange}
                        tabs={availableTabs}
                    />
                </div>
                <button onClick={() => setShowZoomForm(true)}>Connect Zoom</button>
                <button className="logout-button" onClick={onLogout}>
                    Logout
                </button>
            </div>

            {showZoomForm && (
                <div className="zoom-form-overlay">
                    <h2>Join a Zoom Meeting</h2>
                    <form>
                        <div className="form-group">
                            <label htmlFor="meetingID">Meeting ID</label>
                            <input
                                type="text"
                                id="meetingID"
                                value={meetingID}
                                onChange={(e) => setMeetingID(e.target.value)}
                                placeholder="Enter Meeting ID"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="passcode">Passcode</label>
                            <input
                                type="password"
                                id="passcode"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder="Enter Passcode"
                            />
                        </div>
                        <div className="form-actions">
                            <button type="button" onClick={handleCancel} className="cancel-button">
                                Cancel
                            </button>
                            <button type="button" onClick={handleConnect} className="connect-button">
                                Connect
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="main-content">{renderView()}</div>
        </div>
    );
}

export default MainContent;