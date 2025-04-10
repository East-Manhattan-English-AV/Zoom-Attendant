import React, { useState } from 'react';
import SearchPage from './SearchPage';
import NavBar from './NavBar';
import AdminPage from './AdminPage';

const MainContent = ({ user, userAccess, onLogout }) => {
    const allTabs = [
        { key: 'search', label: 'Search' },
        { key: 'admin', label: 'Admin' },
    ]

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

    // Render the component that matches the current view
    const renderView = () => {
        switch (currentView) {
            case 'search':
                return <SearchPage user={user} />;
            case 'admin':
                return <AdminPage />
            default:
                // If the current view doesn't match any tab, return null or a default component
                return null;
        }
    };

    return (
        <div className="main-content-container">
            <div className="header">
                <span className="user-name">Hi, {user.name || 'Attendant'}!</span>
                <div className="tab-bar">
                    <NavBar user={user} activeTab={currentView} onTabChange={handleViewChange} tabs={availableTabs} />
                </div>
                <button className="logout-button" onClick={onLogout}>
                    Logout
                </button>
            </div>
            
            <div className="main-content">
                {renderView()}
            </div>
        </div>
    );
}

export default MainContent;