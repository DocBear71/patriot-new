'use client';

// file: /src/pages/reset-password.jsx v1 - Password reset page with token validation and new password form

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [validationState, setValidationState] = useState({
        lowercase: false,
        uppercase: false,
        number: false,
        length: false,
        special: false,
        match: false
    });

    useEffect(() => {
        const resetToken = searchParams.get('token');
        if (resetToken) {
            setToken(resetToken);
        } else {
            setMessage('Reset token is missing. Please go back to the forgot password page and try again.');
            setMessageType('warning');
        }
    }, [searchParams]);

    useEffect(() => {
        // Validate password requirements
        const validation = {
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /\d/.test(password),
            length: password.length >= 8,
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            match: password === confirmPassword && password.length > 0
        };
        setValidationState(validation);
    }, [password, confirmPassword]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setMessageType('');

        // Validate all requirements are met
        const allValid = Object.values(validationState).every(valid => valid);
        if (!allValid) {
            setMessage('Please ensure all password requirements are met.');
            setMessageType('error');
            setIsLoading(false);
            return;
        }

        if (!token) {
            setMessage('Reset token is missing. Please use the link from your email.');
            setMessageType('error');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth?operation=reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Your password has been reset successfully! You can now sign in with your new password.');
                setMessageType('success');
                // Redirect to login page after 3 seconds
                setTimeout(() => {
                    router.push('../../auth/signin');
                }, 3000);
            } else {
                setMessage(data.message || 'There was a problem resetting your password. The link may be invalid or expired.');
                setMessageType('error');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('There was a problem resetting your password. Please try again.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const getValidationIcon = (isValid) => {
        return isValid ? (
                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
        ) : (
                <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
        );
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
                        Reset Your Password
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Your password must meet the requirements listed below.
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        {/* Alert Messages */}
                        {message && (
                                <div className={`mb-6 p-4 rounded-md ${
                                        messageType === 'success'
                                                ? 'bg-green-50 border border-green-200 text-green-800'
                                                : messageType === 'warning'
                                                        ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                                                        : 'bg-red-50 border border-red-200 text-red-800'
                                }`}>
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            {messageType === 'success' ? (
                                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                            ) : messageType === 'warning' ? (
                                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                            ) : (
                                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                            )}
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm">
                                                {message}
                                                {messageType === 'warning' && (
                                                        <>
                                                            {' '}
                                                            <Link href="/forgot-password" className="font-medium underline hover:text-yellow-900">
                                                                Go to forgot password page
                                                            </Link>
                                                        </>
                                                )}
                                                {messageType === 'success' && (
                                                        <>
                                                            {' '}
                                                            <Link href="../../auth/signin" className="font-medium underline hover:text-green-900">
                                                                Sign in now
                                                            </Link>
                                                        </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Password Form */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">New Password</h3>
                                <form className="space-y-6" onSubmit={handleSubmit}>
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                            Password
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                    id="password"
                                                    name="password"
                                                    type="password"
                                                    autoComplete="new-password"
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    disabled={isLoading || !token}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                            Confirm Password
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                    id="confirmPassword"
                                                    name="confirmPassword"
                                                    type="password"
                                                    autoComplete="new-password"
                                                    required
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    disabled={isLoading || !token}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <button
                                                type="submit"
                                                disabled={isLoading || !token || !Object.values(validationState).every(valid => valid)}
                                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Resetting...
                                                    </>
                                            ) : (
                                                    'Reset Password'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Password Requirements */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Password Requirements</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        {getValidationIcon(validationState.lowercase)}
                                        <span className={`text-sm ${validationState.lowercase ? 'text-green-700' : 'text-red-600'}`}>
                                        A <strong>lowercase</strong> letter
                                    </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {getValidationIcon(validationState.uppercase)}
                                        <span className={`text-sm ${validationState.uppercase ? 'text-green-700' : 'text-red-600'}`}>
                                        A <strong>capital (uppercase)</strong> letter
                                    </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {getValidationIcon(validationState.number)}
                                        <span className={`text-sm ${validationState.number ? 'text-green-700' : 'text-red-600'}`}>
                                        A <strong>number</strong>
                                    </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {getValidationIcon(validationState.length)}
                                        <span className={`text-sm ${validationState.length ? 'text-green-700' : 'text-red-600'}`}>
                                        Minimum <strong>8 characters</strong>
                                    </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {getValidationIcon(validationState.special)}
                                        <span className={`text-sm ${validationState.special ? 'text-green-700' : 'text-red-600'}`}>
                                        A <strong>special character</strong> (!@#$%^&*)
                                    </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {getValidationIcon(validationState.match)}
                                        <span className={`text-sm ${validationState.match ? 'text-green-700' : 'text-red-600'}`}>
                                        Passwords <strong>match</strong>
                                    </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-600">
                                Remember your password?{' '}
                                <Link href="../../auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
    );
}