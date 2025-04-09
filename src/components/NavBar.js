import React, { useState, useEffect, useRef } from 'react';
import './NavBar.css';

const NavBar = ({ activeTab, onTabChange, tabs }) => {
    return (
        <div className="top-nav">
            <nav className="navbar">
                <div className="tabs">
                    {tabs.map((tab, index) => (
                        <React.Fragment key={tab.key}>
                            <button
                                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                                onClick={() => onTabChange(tab.key)}
                            >
                                {tab.label}
                            </button>
                            {index < tabs.length - 1 && <div className="tab-divider" />}
                        </React.Fragment>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default NavBar;
