'use client';

// file: /src/app/auth/update-email/page.jsx v1 - Email update page for Patriot Thanks

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../../components/layout/Navigation';

export default function UpdateEmailPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [formData, setFormData] = useState({
        newEmail: '',
        confirmEmail: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Redirect if not authenticated
    if (status === 'loading') {
        return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
        );
    }

    if (!session) {
        router.push('/auth/signin');
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validate emails match
        if (formData.newEmail !== formData.confirmEmail) {
            setError('Email addresses do not match');
            setLoading(false);
            return;
        }

        // Validate new email is different from current
        if (formData.newEmail.toLowerCase() === session.user.email.toLowerCase()) {
            setError('New email must be different from your current email');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/update-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newEmail: formData.newEmail,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message);
                setFormData({ newEmail: '', confirmEmail: '', password: '' });

                // Redirect to check email page after 3 seconds
                setTimeout(() => {
                    router.push('/auth/verify-new-email?email=' + encodeURIComponent(data.pendingEmail));
                }, 3000);
            } else {
                setError(data.error || 'Failed to update email');
            }
        } catch (error) {
            console.error('Update email error:', error);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />

                <div className="pt-20 pb-12">
                    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="mb-8">
                            <Link href="/profile" className="text-blue-600 hover:text-blue-700 flex items-center mb-4">
                                <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Profile
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900">Update Email Address</h1>
                            <p className="text-gray-600 mt-2">
                                Change the email address associated with your Patriot Thanks account
                            </p>
                        </div>

                        {/* Current Email Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start">
                                <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h3 className="text-sm font-medium text-blue-900">Current Email</h3>
                                    <p className="text-sm text-blue-700 mt-1">{session.user.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Update Form */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                            {error}
                                        </div>
                                )}

                                {success && (
                                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                                            <div className="flex items-start">
                                                <svg className="h-5 w-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div>
                                                    <p className="font-medium">{success}</p>
                                                    <p className="text-sm mt-1">Redirecting you to verify your new email...</p>
                                                </div>
                                            </div>
                                        </div>
                                )}

                                <div>
                                    <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-2">
                                        New Email Address
                                    </label>
                                    <input
                                            type="email"
                                            id="newEmail"
                                            name="newEmail"
                                            required
                                            value={formData.newEmail}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter your new email address"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="confirmEmail" className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm New Email Address
                                    </label>
                                    <input
                                            type="email"
                                            id="confirmEmail"
                                            name="confirmEmail"
                                            required
                                            value={formData.confirmEmail}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Confirm your new email address"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Current Password
                                    </label>
                                    <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter your current password"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Required to confirm your identity
                                    </p>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-yellow-900 mb-2">Important Notes:</h4>
                                    <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                                        <li>A verification email will be sent to your new email address</li>
                                        <li>Your current email will remain active until you verify the new one</li>
                                        <li>The verification link expires in 1 hour</li>
                                        <li>Check your spam folder if you don't see the email</li>
                                    </ul>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                            type="submit"
                                            disabled={loading || success !== ''}
                                            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        {loading ? 'Sending Verification...' : 'Update Email Address'}
                                    </button>
                                    <Link
                                            href="/profile"
                                            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 font-medium text-center"
                                    >
                                        Cancel
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
    );
}