'use client';

// file: /src/pages/thank-you.jsx v2 - Thank you page for contact form submissions with proper Footer component

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '../components/legal/Footer';

export default function ThankYouPage() {
    const [contactData, setContactData] = useState(null);

    useEffect(() => {
        // Retrieve form data from session storage
        const storedData = sessionStorage.getItem('contactFormData');
        if (storedData) {
            try {
                const formData = JSON.parse(storedData);
                setContactData(formData);
                // Clear the session storage to avoid showing the data if the page is refreshed
                sessionStorage.removeItem('contactFormData');
            } catch (error) {
                console.error('Error parsing contact form data:', error);
            }
        }
    }, []);

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
                                    <h2 className="text-lg text-gray-600">Thank You!</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        {/* Success Header */}
                        <div className="bg-blue-600 px-6 py-8 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="bg-white rounded-full p-3">
                                    <svg className="h-8 w-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Thank You for Reaching Out to Us!
                            </h1>
                            <p className="text-blue-100 text-lg">
                                Your message has been received and we'll get back to you soon.
                            </p>
                        </div>

                        {/* Message Details */}
                        <div className="px-6 py-8">
                            {contactData ? (
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3">
                                            Message Details
                                        </h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">
                                                        {contactData.firstname} {contactData.lastname}
                                                    </dd>
                                                </div>

                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">
                                                        {contactData.email}
                                                    </dd>
                                                </div>

                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Subject</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">
                                                        {contactData.subject}
                                                    </dd>
                                                </div>
                                            </div>

                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Message</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                                                        {contactData.message}
                                                    </div>
                                                </dd>
                                            </div>
                                        </div>

                                        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-green-800">
                                                        What's Next?
                                                    </h3>
                                                    <div className="mt-2 text-sm text-green-700">
                                                        <p>
                                                            We've received your message and will review it carefully.
                                                            Our team typically responds within 24-48 hours during business days.
                                                            You should receive a confirmation email shortly.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                            ) : (
                                    <div className="text-center py-8">
                                        <div className="mb-4">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">No message details available</h3>
                                        <p className="mt-2 text-sm text-gray-500">
                                            You may have refreshed the page or accessed it directly.
                                            If you just submitted a contact form, your message was still received.
                                        </p>
                                    </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                                <Link
                                        href="/"
                                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                >
                                    <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L8 5.414V17a1 1 0 102 0V5.414l6.293 6.293a1 1 0 001.414-1.414l-9-9z"/>
                                    </svg>
                                    Return to Home
                                </Link>

                                <Link
                                        href="/contact"
                                        className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                >
                                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Send Another Message
                                </Link>

                                <Link
                                        href="/business-search"
                                        className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                >
                                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Find Businesses
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="mt-8 bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            While You're Here
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h4 className="mt-2 text-sm font-medium text-gray-900">Explore Businesses</h4>
                                <p className="mt-1 text-sm text-gray-500">
                                    Discover local businesses that offer discounts to veterans and service members.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <h4 className="mt-2 text-sm font-medium text-gray-900">Support Our Mission</h4>
                                <p className="mt-1 text-sm text-gray-500">
                                    Learn about ways to support veterans and service members in your community.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="mx-auto h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h4 className="mt-2 text-sm font-medium text-gray-900">Stay Connected</h4>
                                <p className="mt-1 text-sm text-gray-500">
                                    Follow us on social media for updates and community stories.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <Footer />
            </div>
    );
}