'use client';

// file: /src/app/auth/verify-new-email/page.jsx v1 - New email verification page

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import Navigation from '../../../components/layout/Navigation';

function VerifyNewEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [verificationToken, setVerificationToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const email = searchParams.get('email') || '';
    const tokenFromUrl = searchParams.get('token') || '';

    useEffect(() => {
        // Auto-verify if token is in URL
        if (tokenFromUrl) {
            setVerificationToken(tokenFromUrl);
            handleVerify(tokenFromUrl);
        }
    }, [tokenFromUrl]);

    const handleVerify = async (token = verificationToken) => {
        if (!token || token.length !== 6) {
            setError('Please enter a valid 6-digit verification code');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await fetch('/api/auth/verify-new-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Email verified successfully! You will be signed out to complete the change.');

                // Sign out after 3 seconds to force re-authentication with new email
                setTimeout(async () => {
                    await signOut({ redirect: false });
                    router.push('/auth/signin?message=email-updated');
                }, 3000);
            } else {
                setError(data.error || 'Verification failed. Please try again.');
            }
        } catch (error) {
            console.error('Verification error:', error);
            setError('Network error. Please try again.');
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
                            Verify Your New Email
                        </h2>
                        <p className="text-blue-100">
                            Patriot Thanks - Email Update Verification
                        </p>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-xl">
                        {!tokenFromUrl && (
                                <>
                                    <div className="text-center mb-6">
                                        <div className="text-6xl mb-4">📧</div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            Check Your New Email
                                        </h3>
                                        {email && (
                                                <p className="text-sm text-gray-600 mb-4">
                                                    We sent a verification code to:<br />
                                                    <strong>{email}</strong>
                                                </p>
                                        )}
                                    </div>

                                    {error && (
                                            <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">
                                                {error}
                                            </div>
                                    )}

                                    {success && (
                                            <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-green-700">
                                                {success}
                                            </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                                                Enter 6-Digit Verification Code
                                            </label>
                                            <input
                                                    type="text"
                                                    id="token"
                                                    value={verificationToken}
                                                    onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    maxLength={6}
                                                    placeholder="000000"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-center text-2xl tracking-widest focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <button
                                                onClick={() => handleVerify()}
                                                disabled={loading || verificationToken.length !== 6}
                                                className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                        >
                                            {loading ? 'Verifying...' : 'Verify Email'}
                                        </button>

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                                            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                                                <li>Enter the 6-digit code from your email</li>
                                                <li>Your email will be updated immediately</li>
                                                <li>You'll be signed out automatically</li>
                                                <li>Sign back in with your new email address</li>
                                            </ul>
                                        </div>
                                    </div>
                                </>
                        )}

                        {tokenFromUrl && (
                                <div className="text-center py-8">
                                    {!success && !error && (
                                            <>
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                                <p className="text-gray-600">Verifying your new email...</p>
                                            </>
                                    )}

                                    {success && (
                                            <div className="text-green-600">
                                                <svg className="h-16 w-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-lg font-medium">{success}</p>
                                            </div>
                                    )}

                                    {error && (
                                            <div className="text-red-600">
                                                <p className="text-lg font-medium mb-4">{error}</p>
                                                <Link
                                                        href="/auth/update-email"
                                                        className="text-blue-600 hover:text-blue-700 underline"
                                                >
                                                    Try updating your email again
                                                </Link>
                                            </div>
                                    )}
                                </div>
                        )}
                    </div>
                </div>
            </div>
    );
}

export default function VerifyNewEmailPage() {
    return (
            <Suspense fallback={
                <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                        <div className="text-lg text-white">Loading...</div>
                    </div>
                </div>
            }>
                <VerifyNewEmailContent />
            </Suspense>
    );
}