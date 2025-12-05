import React from 'react';
import SpreadsheetImporter from './SpreadsheetImporter';

function AdvancedPage() {
    return (
        <div className="min-h-screen p-8 bg-gray-100">
            <div className="max-w-md mx-auto">
                <div className="admin-panel">
                    <section>
                        <h2>Import Participants</h2>
                        <p>Upload a spreadsheet to import participants. Note: Ensure the spreadsheet is formatted correctly. Supported formats: .xlsx, .csv.</p>
                        <SpreadsheetImporter />
                    </section>
                </div>
            </div>
        </div>
    );
}

export default AdvancedPage;
