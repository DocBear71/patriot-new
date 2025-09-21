'use client';

// file: /src/pages/forgot-password.jsx v1 - Forgot password page with email reset functionality

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setMessageType('');

        try {
            const response = await fetch('/api/auth?operation=forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('If this email is registered, a reset link has been sent. Please check your email and spam folder.');
                setMessageType('success');
                setEmail(''); // Clear the form
            } else {
                setMessage(data.message || 'There was a problem processing your request. Please try again.');
                setMessageType('error');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('There was a problem processing your request. Please try again.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center">
                        <Link href="/">
                            <img
                                    src="/images/patriotthankslogo6-13-2025.png"
                                    alt="Patriot Thanks Logo"
                                    className="h-16 w-auto"
                            />
                        </Link>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Forgot Your Password?
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your email address below, and we'll send you a link to reset your password.
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        {/* Alert Messages */}
                        {message && (
                                <div className={`mb-4 p-4 rounded-md ${
                                        messageType === 'success'
                                                ? 'bg-green-50 border border-green-200 text-green-800'
                                                : 'bg-red-50 border border-red-200 text-red-800'
                                }`}>
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            {messageType === 'success' ? (
                                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                            ) : (
                                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                            )}
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm">{message}</p>
                                        </div>
                                    </div>
                                </div>
                        )}

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <div className="mt-1">
                                    <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="address@company.com"
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Sending...
                                            </>
                                    ) : (
                                            'Send Reset Link'
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Or</span>
                                </div>
                            </div>

                            <div className="mt-6 text-center space-y-2">
                                <p className="text-sm text-gray-600">
                                    Remember your password?{' '}
                                    <Link href="../../auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                                        Sign in
                                    </Link>
                                </p>
                                <p className="text-sm text-gray-600">
                                    Don't have an account?{' '}
                                    <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                                        Create account
                                    </Link>
                                </p>
                                <p className="text-sm text-gray-600">
                                    <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
                                        Return to home
                                    </Link>
                                </p>
                            </div>
                        </div>

                        {/* Emergency Reset Information */}
                        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        Need Help?
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p>
                                            If you don't receive an email within a few minutes, please check your spam folder.
                                            If you're still having trouble, please{' '}
                                            <Link href="/contact" className="font-medium underline text-yellow-800 hover:text-yellow-900">
                                                contact us
                                            </Link>{' '}
                                            for assistance.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    );
}