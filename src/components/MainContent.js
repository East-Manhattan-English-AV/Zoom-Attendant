import React, { useState } from 'react';
import SearchPage from './SearchPage';
import NavBar from './NavBar';
import AdvancedPage from './AdvancedPage';
import AttendantsPage from './AttendantsPage';
// import ZoomMtgEmbedded from '@zoom/meetingsdk/embedded';

const MainContent = ({ user, userAccess, onLogout }) => {
    const allTabs = [
        { key: 'search', label: 'Participants' },
        { key: 'attendants', label: 'Attendants' },
        { key: 'advanced', label: 'Advanced' },
    ]

    // const authEndpoint = "https://zoom-meeting-sdk-auth-sample-tcz5.onrender.com";
    // const sdkKey = "IHOzSYcT0OCno8mVQvVRA";
    // const role = 0;
    // const userName = "Zoom Attendant";
    const [showZoomForm, setShowZoomForm] = useState(false);
    const [meetingID, setMeetingID] = useState('');
    const [passcode, setPasscode] = useState('');
    // const [zoomConnected, setZoomConnected] = useState(false);
    // const client = ZoomMtgEmbedded.createClient();

    // Filter tabs based on userRole
    const availableTabs = allTabs.filter((tab) => {
        if (tab.key === 'attendants') {
            return userAccess === 'admin'; // Only show attendants tab for admin users
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
        // connectZoom(); // Call the connectZoom function to initialize the Zoom client
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
                return <SearchPage user={user} userAccess={userAccess} />
            case 'attendants':
                return <AttendantsPage />
            case 'advanced':
                return <AdvancedPage />
            default:
                // If the current view doesn't match any tab, return null or a default component
                return null;
        }
    };

    // const connectZoom = async () => {
    //     const getSignature = async () => {
    //         try {
    //             const req = await fetch(authEndpoint, {
    //                 method: "POST",
    //                 headers: { "Content-Type": "application/json" },
    //                 body: JSON.stringify({
    //                     meetingNumber: meetingID,
    //                     role: role,
    //                 }),
    //             });
    //             const res = await req.json()
    //             const signature = res.signature;
    //             startMeeting(signature)
    //         } catch (e) {
    //             console.log(e);
    //         }
    //     };
    //     getSignature();
    // };

    // const disconnectZoom = async () => {
    //     try {
    //         // Use the client.leave() method to disconnect
    //         await client.leaveMeeting();
    //         setZoomConnected(false);
    //         console.log('Left meeting successfully!');
    //     } catch (error) {
    //         console.log('Error disconnecting from meeting:', error);
    //     }
    // };

    // const startMeeting = async (signature) => {
    //     const meetingPassWord = passcode;
    //     const meetingSDKElement = document.getElementById('meetingSDKElement');
    //     const meetingSDKChatElement = document.getElementById('meetingSDKChatElement');
    //     const meetingSDKParticipantsElement = document.getElementById('meetingSDKParticipantsElement')
    //     try {
    //         await client.init({
    //             zoomAppRoot: meetingSDKElement,
    //             language: 'en-US',
    //             customize: {
    //                 video: {
    //                     popper: {
    //                         disableDraggable: false
    //                     }
    //                 },
    //                 participants: {
    //                     popper: {
    //                         disableDraggable: false,
    //                         anchorElement: meetingSDKParticipantsElement,
    //                         placement: 'bottom'
    //                     }
    //                 },
    //                 chat: {
    //                     popper: {
    //                         disableDraggable: false,
    //                         anchorElement: meetingSDKChatElement,
    //                         placement: 'bottom'
    //                     }
    //                 }
    //             }
    //         });
    //         await client.join({
    //             sdkKey: sdkKey,
    //             signature: signature,
    //             meetingNumber: meetingID,
    //             password: meetingPassWord,
    //             userName: userName
    //         });
    //         setZoomConnected(true);
    //         console.log('Joined meeting successfully!');
    //     } catch (error) {
    //         setZoomConnected(false);
    //         console.log('Error joining meeting:', error);
    //     }
    // };

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
                {/* <button onClick={() => {
                    if (zoomConnected) {
                        disconnectZoom(); // Disconnect if already connected
                    } else {
                        setShowZoomForm(true); // Show form to connect if not connected
                    }
                }}>
                    {zoomConnected ? "Disconnect Zoom" : "Connect Zoom"}
                </button> */}
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