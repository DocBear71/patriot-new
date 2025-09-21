// file: /src/pages/completed.jsx v1 - Donation completion success page

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CompletedPage() {
    const searchParams = useSearchParams();
    const [transactionData, setTransactionData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get transaction details from URL parameters or session storage
        const transactionId = searchParams.get('transaction_id') || searchParams.get('txn_id');
        const amount = searchParams.get('amount');
        const email = searchParams.get('email');

        // Check session storage for donation data
        const storedData = sessionStorage.getItem('donationData');

        if (storedData) {
            try {
                const donationData = JSON.parse(storedData);
                setTransactionData({
                    ...donationData,
                    transactionId: transactionId || donationData.transactionId,
                    date: new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                });
                // Clear session storage after use
                sessionStorage.removeItem('donationData');
            } catch (error) {
                console.error('Error parsing donation data:', error);
            }
        } else if (transactionId || amount) {
            // Fallback: create basic transaction data from URL params
            setTransactionData({
                transactionId: transactionId || 'N/A',
                amount: amount || 'N/A',
                email: email || 'N/A',
                date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            });
        }

        setIsLoading(false);
    }, [searchParams]);

    if (isLoading) {
        return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                </div>
        );
    }

    return (
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-6">
                            <div className="flex items-center">
                                <Link href="/">
                                    <img
                                            src="/images/patriotthankslogo6-13-2025.png"
                                            alt="Patriot Thanks Logo"
                                            className="h-12 w-auto"
                                    />
                                </Link>
                                <div className="ml-4">
                                    <h1 className="text-2xl font-bold text-gray-900">Patriot Thanks</h1>
                                    <h2 className="text-lg text-gray-600">Donation Complete</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        {/* Success Header */}
                        <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-8 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="bg-white rounded-full p-4">
                                    <svg className="h-12 w-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-4">
                                Thank You for Your Support!
                            </h1>
                            <p className="text-xl text-blue-100">
                                Your donation was successful
                            </p>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-8">
                            <div className="text-center mb-8">
                                <p className="text-lg text-gray-700 mb-4">
                                    Thank you for supporting Patriot Thanks. Your generosity helps us continue our mission
                                    of connecting heroes with businesses that appreciate their service.
                                </p>
                            </div>

                            {/* Transaction Details */}
                            {transactionData && (
                                    <div className="bg-gray-50 rounded-lg p-6 mb-8">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Transaction Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Transaction ID</p>
                                                <p className="text-lg text-gray-900 font-mono">
                                                    {transactionData.transactionId}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Date</p>
                                                <p className="text-lg text-gray-900">
                                                    {transactionData.date}
                                                </p>
                                            </div>
                                            {transactionData.amount && transactionData.amount !== 'N/A' && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Amount</p>
                                                        <p className="text-lg text-gray-900 font-semibold">
                                                            ${transactionData.amount}
                                                        </p>
                                                    </div>
                                            )}
                                            {transactionData.email && transactionData.email !== 'N/A' && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Email</p>
                                                        <p className="text-lg text-gray-900">
                                                            {transactionData.email}
                                                        </p>
                                                    </div>
                                            )}
                                        </div>
                                    </div>
                            )}

                            {/* Email Confirmation Notice */}
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-8">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800">
                                            Confirmation Email
                                        </h3>
                                        <div className="mt-2 text-sm text-blue-700">
                                            <p>
                                                A confirmation email with your donation details has been sent to your email address.
                                                If you don't see it, please check your spam folder.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Impact Statement */}
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Impact</h3>
                                <p className="text-gray-700 mb-4">
                                    Your contribution makes a real difference in helping us maintain and improve our platform.
                                    We're committed to providing the best service possible to our community of veterans,
                                    active-duty military, first responders, and supporting businesses.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
                                <Link
                                        href="/"
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                >
                                    <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L8 5.414V17a1 1 0 102 0V5.414l6.293 6.293a1 1 0 001.414-1.414l-9-9z"/>
                                    </svg>
                                    Return to Home
                                </Link>

                                <Link
                                        href="/business-search"
                                        className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                >
                                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Find Businesses
                                </Link>

                                <Link
                                        href="/contact"
                                        className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                >
                                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Contact Us
                                </Link>
                            </div>

                            {/* Social Share */}
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-4">Share your support:</p>
                                <div className="flex justify-center space-x-4">
                                    <a
                                            href="https://www.facebook.com/sharer/sharer.php?u=https://patriotthanks.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                                            title="Share on Facebook"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                                        </svg>
                                    </a>

                                    <a
                                            href="https://twitter.com/intent/tweet?text=I just supported Patriot Thanks! They help connect veterans and service members with businesses that appreciate their service."
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-400 text-white hover:bg-blue-500 transition-colors duration-200"
                                            title="Share on Twitter"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/>
                                        </svg>
                                    </a>

                                    <a
                                            href="https://www.linkedin.com/sharing/share-offsite/?url=https://patriotthanks.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-700 text-white hover:bg-blue-800 transition-colors duration-200"
                                            title="Share on LinkedIn"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-gray-800">
                    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                        <div className="text-center text-gray-300">
                            <p>&copy; 2024 Doc Bear Enterprises, LLC. All rights reserved.</p>
                            <div className="mt-2 space-x-4">
                                <Link href="/terms" className="text-gray-400 hover:text-white">
                                    Terms of Use
                                </Link>
                                <span className="text-gray-600">|</span>
                                <Link href="/privacy" className="text-gray-400 hover:text-white">
                                    Privacy Policy
                                </Link>
                                <span className="text-gray-600">|</span>
                                <Link href="/contact" className="text-gray-400 hover:text-white">
                                    Contact Us
                                </Link>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
    );
}