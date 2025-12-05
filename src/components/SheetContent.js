import { useRef, useEffect } from 'react';

// Content container for the sheet
export default function SheetContent({ children }) {
    const contentRef = useRef(null);

    // Focus trap and animation
    useEffect(() => {
        // Focus the content when opened
        if (contentRef.current) {
            contentRef.current.focus();
        }
    }, []);

    return (
        <div
            ref={contentRef}
            tabIndex={-1}
            className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-auto focus:outline-none"
            style={{
                animation: 'fadeInScale 0.2s ease-out forwards',
            }}
        >
            <style jsx>{`
                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
            {children}
        </div>
    );
};