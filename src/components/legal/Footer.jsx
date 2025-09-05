// file: src/components/legal/Footer.jsx v1 - Patriot Thanks legal footer for account integration

import React, { useState } from 'react';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfUse from './TermsofUse';
import AboutUs from './AboutUs';
//import ContactSupportModal from '@/components/support/ContactSupportModal';
import { useSession } from 'next-auth/react';


export default function Footer() {
    const [showModal, setShowModal] = useState(null);
    const { data: session } = useSession();

    const openModal = (modalType) => {
        setShowModal(modalType);
    };

    const closeModal = () => {
        setShowModal(null);
    };

    const ModalWrapper = ({ children, title }) => (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl">
                    {/* Header - Fixed at top */}
                    <div className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-4 rounded-t-lg flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">{title}</h2>
                            <button
                                    onClick={closeModal}
                                    className="text-white hover:text-gray-200 text-2xl font-bold p-1 hover:bg-white hover:bg-opacity-20 rounded"
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto">
                        {children}
                    </div>
                </div>
            </div>
    );


    return (
            <>
                <footer className="bg-gradient-to-r from-red-600 to-blue-600 border-t border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                            {/* Company Info */}
                            <div className="text-center md:text-left">
                                <p className="text-gold-500 text-sm">
                                    © {new Date().getFullYear()} Doc Bear Enterprises, LLC. All rights reserved.
                                </p>
                                <p className="text-gold-500 text-xs mt-1">
                                    🇺🇸 Proudly serving veterans, active-duty military, and first responders
                                </p>
                            </div>

                            {/* Legal Links */}
                            <div className="flex flex-wrap justify-center md:justify-end gap-4 text-sm">
                                <button
                                        onClick={() => openModal('privacy')}
                                        className="text-gold-600 hover:text-blue-600 transition-colors"
                                >
                                    Privacy Policy
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                        onClick={() => openModal('terms')}
                                        className="text-gold-600 hover:text-blue-600 transition-colors"
                                >
                                    Terms of Use
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                        onClick={() => openModal('about')}
                                        className="text-gold-600 hover:text-blue-600 transition-colors"
                                >
                                    About Us
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                        onClick={() => openModal('contact')}
                                        className="text-gold-600 hover:text-blue-600 transition-colors"
                                >
                                    Contact Support
                                </button>
                                <span className="text-gray-300">|</span>
                                <a
                                        href="https://www.docbear-ent.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gold-600 hover:text-blue-600 transition-colors"
                                >
                                    Doc Bear Enterprises, LLC.
                                </a>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="mt-4 pt-4 border-t border-gray-100 text-center text-xs text-gold-500">
                            <p>
                                Patriot Thanks connects service members with appreciative local businesses.
                                Verification required for military and first responder discounts.
                            </p>
                        </div>
                    </div>
                </footer>

                {/* Modals */}
                {showModal === 'privacy' && (
                        <ModalWrapper title="Privacy Policy">
                            <PrivacyPolicy />
                        </ModalWrapper>
                )}

                {showModal === 'terms' && (
                        <ModalWrapper title="Terms of Use">
                            <TermsOfUse />
                        </ModalWrapper>
                )}

                {showModal === 'about' && (
                        <ModalWrapper title="About Patriot Thanks">
                            <AboutUs />
                        </ModalWrapper>
                )}

                <ContactSupportModal
                        isOpen={showModal === 'contact'}
                        onClose={closeModal}
                        userSubscription={{
                            tier: session?.user?.tier || 'free',
                            userId: session?.user?.id,
                            status: 'active'
                        }}
                />
            </>
    );
}