// file: /src/components/auth/EmailVerificationBanner.jsx v1 - Email verification reminder banner for Patriot Thanks
'use client';

import { useState } from 'react';

const EmailVerificationBanner = ({ user, onDismiss }) => {
    const [isResending, setIsResending] = useState(false);
    const [message, setMessage] = useState('');
    const [isDismissed, setIsDismissed] = useState(false);

    if (!user || user.isVerified || isDismissed) {
        return null;
    }

    const handleResendVerification = async () => {
        try {
            setIsResending(true);
            setMessage('');

            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: user.email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Verification email sent! Please check your inbox and spam folder.');
            } else {
                setMessage(data.error || 'Failed to send verification email. Please try again.');
            }
        } catch (error) {
            console.error('Resend verification error:', error);
            setMessage('Network error. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        if (onDismiss) {
            onDismiss();
        }
    };

    return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-yellow-800">
                            Email Not Verified
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                            <p>
                                Please verify your email address to access all Patriot Thanks features.
                                Check your inbox and spam folder for a verification email.
                            </p>
                            {message && (
                                    <div className={`mt-2 p-2 rounded text-sm ${
                                            message.includes('sent')
                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                    : 'bg-red-100 text-red-800 border border-red-200'
                                    }`}>
                                        {message}
                                    </div>
                            )}
                        </div>
                        <div className="mt-3 flex items-center space-x-3 flex-wrap gap-2">
                            <a
                            href="/auth/update-email"
                            className="inline-flex items-center px-3 py-1.5 border border-yellow-600 text-xs font-medium rounded text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                            >
                            Wrong Email? Update It
                        </a>
                        <button
                                onClick={handleResendVerification}
                                disabled={isResending}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >

                                {isResending ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Sending...
                                        </>
                                ) : (
                                        'Resend Verification Email'
                                )}
                            </button>
                            <span className="text-xs text-yellow-600">
                            Check spam/junk folder if not received
                        </span>
                        </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                        <button
                                onClick={handleDismiss}
                                className="inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none focus:text-yellow-600"
                                aria-label="Dismiss"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
    );
};

export default EmailVerificationBanner;