import React, { useState, useEffect, useRef } from 'react';
import { FaUser } from 'react-icons/fa'; // Import the user icon
import './NavBar.css';

const NavBar = ({ user, activeTab, onTabChange, tabs }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const userMenuRef = useRef(null);

    const toggleDropdown = () => {
        setDropdownOpen((prev) => !prev);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

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
