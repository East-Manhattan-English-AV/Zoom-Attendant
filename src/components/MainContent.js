import React, { useState, useEffect, useRef } from 'react';
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
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const accountMenuRef = useRef(null);

    // Handler to change the view when a tab is clicked
    const handleViewChange = (view) => {
        setCurrentView(view);
    };

    // Close account menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
                setShowAccountMenu(false);
            }
        };

        if (showAccountMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAccountMenu]);

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
                <span className="user-name">Zoom Attendant</span>
                <div className="tab-bar">
                    <NavBar
                        user={user}
                        activeTab={currentView}
                        onTabChange={handleViewChange}
                        tabs={availableTabs}
                    />
                </div>
                <div style={{ position: 'relative' }} ref={accountMenuRef}>
                    <button
                        onClick={() => setShowAccountMenu(!showAccountMenu)}
                        style={{
                            padding: '8px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '24px',
                            transition: 'background-color 0.3s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        👤
                    </button>
                    {showAccountMenu && (
                        <div
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: '50px',
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                minWidth: '200px',
                                zIndex: 1000,
                                padding: '8px 0'
                            }}
                        >
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                                    {user.name || 'Attendant'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                    {user.email || ''}
                                </div>
                            </div>
                            <button
                                className="logout-button"
                                onClick={() => {
                                    setShowAccountMenu(false);
                                    onLogout();
                                }}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '12px 16px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: 0,
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: '#333',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
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