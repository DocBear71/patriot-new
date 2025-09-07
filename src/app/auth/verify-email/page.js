// file: /src/app/auth/verify-email/page.js v1 - Email verification page for Patriot Thanks
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../../components/layout/Navigation';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [verificationStatus, setVerificationStatus] = useState('verifying'); // 'verifying', 'success', 'error', 'expired', 'already-verified'
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        const emailParam = searchParams.get('email');

        if (emailParam) {
            setEmail(emailParam);
        }

        if (token) {
            verifyEmail(token);
        } else {
            setVerificationStatus('error');
            setMessage('Invalid verification link. Please check your email for the correct link.');
        }
    }, [searchParams]);

    const verifyEmail = async (token) => {
        try {
            setLoading(true);

            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (response.ok) {
                setVerificationStatus('success');
                setMessage('Your email has been verified successfully! You now have access to all Patriot Thanks features.');

                // Redirect to sign-in page after 4 seconds
                setTimeout(() => {
                    router.push('/auth/signin?message=email-verified');
                }, 4000);
            } else {
                if (data.error === 'TOKEN_EXPIRED') {
                    setVerificationStatus('expired');
                    setMessage('This verification link has expired. Please request a new one below.');
                } else if (data.error === 'ALREADY_VERIFIED') {
                    setVerificationStatus('already-verified');
                    setMessage('Your email is already verified! You can sign in to your account.');
                    setTimeout(() => {
                        router.push('/auth/signin');
                    }, 3000);
                } else if (data.error === 'INVALID_TOKEN') {
                    setVerificationStatus('error');
                    setMessage('Invalid verification link. Please check your email for the correct link or request a new one.');
                } else {
                    setVerificationStatus('error');
                    setMessage(data.message || 'Email verification failed. Please try again.');
                }
            }
        } catch (error) {
            console.error('Verification error:', error);
            setVerificationStatus('error');
            setMessage('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!email) {
            setMessage('Email address is required to resend verification.');
            return;
        }

        try {
            setLoading(true);

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

    const getStatusIcon = () => {
        switch (verificationStatus) {
            case 'verifying':
                return '🔄';
            case 'success':
                return '✅';
            case 'already-verified':
                return '✅';
            case 'expired':
                return '⏰';
            case 'error':
            default:
                return '❌';
        }
    };

    const getStatusColor = () => {
        switch (verificationStatus) {
            case 'verifying':
                return 'text-blue-600';
            case 'success':
            case 'already-verified':
                return 'text-green-600';
            case 'expired':
                return 'text-yellow-600';
            case 'error':
            default:
                return 'text-red-600';
        }
    };

    const getBackgroundColor = () => {
        switch (verificationStatus) {
            case 'verifying':
                return 'bg-blue-50 border-blue-200';
            case 'success':
            case 'already-verified':
                return 'bg-green-50 border-green-200';
            case 'expired':
                return 'bg-yellow-50 border-yellow-200';
            case 'error':
            default:
                return 'bg-red-50 border-red-200';
        }
    };

    const getTitle = () => {
        switch (verificationStatus) {
            case 'verifying':
                return 'Verifying Your Email...';
            case 'success':
                return 'Email Verified Successfully!';
            case 'already-verified':
                return 'Email Already Verified!';
            case 'expired':
                return 'Verification Link Expired';
            case 'error':
            default:
                return 'Verification Failed';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Navigation />

            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Email Verification
                    </h2>
                    <p className="text-blue-100">
                        Patriot Thanks - Connecting Service Members with Appreciative Businesses
                    </p>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-xl">
                    <div className={`${getBackgroundColor()} border rounded-lg p-6 text-center`}>
                        <div className="text-4xl mb-4">
                            {getStatusIcon()}
                        </div>

                        <h3 className={`text-lg font-semibold mb-2 ${getStatusColor()}`}>
                            {getTitle()}
                        </h3>

                        <p className="text-gray-700 mb-4">
                            {message}
                        </p>

                        {loading && verificationStatus === 'verifying' && (
                            <div className="flex justify-center mb-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 space-y-4">
                        {(verificationStatus === 'success' || verificationStatus === 'already-verified') && (
                            <div className="text-center">
                                <Link
                                    href="/auth/signin"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Sign In Now
                                </Link>
                                <p className="text-sm text-gray-500 mt-2">
                                    You'll be redirected automatically in a few seconds...
                                </p>
                            </div>
                        )}

                        {(verificationStatus === 'expired' || verificationStatus === 'error') && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-900 mb-2">Need a new verification email?</h4>
                                    <p className="text-sm text-blue-800 mb-3">
                                        Enter your email address below and we'll send you a fresh verification link.
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter your email address"
                                    />
                                </div>
                                <button
                                    onClick={handleResendVerification}
                                    disabled={loading || !email}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        'Send New Verification Email'
                                    )}
                                </button>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-sm text-yellow-800">
                                        <strong>📧 Check your spam folder</strong> - Sometimes emails end up there.
                                        You can send up to 3 verification emails per hour.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="text-center space-y-2 pt-4 border-t border-gray-200">
                            <Link
                                href="/auth/signin"
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                Back to Sign In
                            </Link>
                            <br />
                            <Link
                                href="/auth/signup"
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                Create New Account
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <div className="text-lg text-white">Loading...</div>
                </div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}