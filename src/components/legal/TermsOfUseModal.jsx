// file: /src/components/legal/TermsOfUseModal.jsx v1 - Modal wrapper for Terms of Use
'use client';

import React from 'react';
import TermsOfUse from './TermsOfUse';

const TermsOfUseModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
            <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                    onClick={handleBackdropClick}
            >
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Modal Header */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Terms of Use</h2>
                        <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                                aria-label="Close modal"
                        >
                            &times;
                        </button>
                    </div>

                    {/* Modal Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-0">
                        <TermsOfUse />
                    </div>

                    {/* Modal Footer */}
                    <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50">
                        <button
                                onClick={onClose}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
    );
};

export default TermsOfUseModal;