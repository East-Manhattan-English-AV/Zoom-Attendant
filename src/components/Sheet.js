import { useRef, useEffect } from 'react';

// Sheet component that handles animation and positioning
export default function Sheet({ isOpen, onClose, children }) {
    const overlayRef = useRef(null);

    // Handle click outside to close
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (overlayRef.current === e.target) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
            // Prevent scrolling of background content and scroll to top
            document.body.style.overflow = 'hidden';
            window.scrollTo(0, 0);
        }

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    // Handle escape key to close
    useEffect(() => {
        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center transition-opacity duration-300"
            ref={overlayRef}
            aria-modal="true"
            role="dialog"
            style={{
                backdropFilter: 'blur(2px)'
            }}
        >
            {children}
        </div>
    );
};