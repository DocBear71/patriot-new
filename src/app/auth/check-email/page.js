// file: /src/app/auth/check-email/page.js v1 - Verification instructions page for Patriot Thanks
'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../../components/layout/Navigation';

function CheckEmailContent() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const email = searchParams.get('email') || '';

    const handleResendVerification = async () => {
        if (!email) {
            setMessage('Email address is required to resend verification.');
            return;
        }

        try {
            setLoading(true);
            setMessage('');

            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Verification email sent! Please check your inbox and spam folder.');
            } else {
                setMessage(data.error || 'Failed to resend verification email. Please try again.');
            }
        } catch (error) {
            console.error('Resend verification error:', error);
            setMessage('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Navigation />

            <div className="max-w-lg w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Check Your Email
                    </h2>
                    <p className="text-blue-100">
                        Patriot Thanks - Connecting Service Members with Appreciative Businesses
                    </p>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-xl">
                    <div className="text-center mb-6">
                        <div className="text-6xl mb-4">📧</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Account Created Successfully!
                        </h3>
                        <p className="text-gray-600 mb-4">
                            We&#39;ve sent a verification email to help secure your account.
                        </p>
                        {message && (
                            <div className={`mb-4 p-3 rounded ${
                                message.includes('sent') || message.includes('sent!')
                                    ? 'bg-green-50 border border-green-200 text-green-700'
                                    : 'bg-red-50 border border-red-200 text-red-700'
                            }`}>
                                {message}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
                            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                                <li>Check your email inbox for a message from Patriot Thanks</li>
                                <li>Look in your spam/junk folder if you don&#39;t see it</li>
                                <li>Click the verification link in the email</li>
                                <li>Return here to sign in with full access</li>
                            </ol>
                        </div>

                        {email && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600">
                                    <strong>Email sent to:</strong> {email}
                                </p>
                            </div>
                        )}

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-semibold text-yellow-900 mb-2">Didn&#39;t receive the email?</h4>
                            <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1 mb-3">
                                <li>Check your spam/junk folder</li>
                                <li>Make sure you entered the correct email address</li>
                                <li>Wait a few minutes, emails can take time to arrive</li>
                                <li>You can request up to 3 verification emails per hour</li>
                            </ul>

                            <button
                                onClick={handleResendVerification}
                                disabled={loading || !email}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending...
                                    </>
                                ) : (
                                    'Resend Verification Email'
                                )}
                            </button>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-semibold text-green-900 mb-2">Why verify your email?</h4>
                            <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                                <li>Access all Patriot Thanks features</li>
                                <li>Receive important account notifications</li>
                                <li>Secure your account from unauthorized access</li>
                                <li>Get updates about new discounts in your area</li>
                            </ul>
                        </div>

                        <div className="text-center space-y-3 pt-4 border-t border-gray-200">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                                <p className="text-sm font-medium text-blue-900 mb-2">
                                    ✅ You can sign in now with limited access
                                </p>
                                <p className="text-xs text-blue-700">
                                    While unverified, you can search businesses, view discounts, and update your profile.
                                    Full access will be granted after email verification.
                                </p>
                            </div>

                            <Link
                                href="/auth/signin"
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Sign In With Limited Access
                            </Link>

                            <br />

                            <Link
                                href="/auth/signup"
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                Create a different account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <div className="text-lg text-white">Loading...</div>
                </div>
            </div>
        }>
            <CheckEmailContent />
        </Suspense>
    );
}