import React, { useState, useEffect, useRef } from 'react';
import './NavBar.css';

const NavBar = ({ activeTab, onTabChange, tabs }) => {
    return (
        <div className="top-nav">
            <nav className="navbar">
                <div className="tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => onTabChange(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default NavBar;
