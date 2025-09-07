'use client';

// file: src/app/auth/signin/page.js v5 - Final NextAuth implementation for Patriot Thanks

import { useState, useEffect, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../../components/layout/Navigation';

function SignInContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [redirecting, setRedirecting] = useState(false);
    const [showResendVerification, setShowResendVerification] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState('');

    useEffect(() => {
        // Handle URL parameters for messages and errors
        const urlError = searchParams.get('error');
        const urlMessage = searchParams.get('message');

        if (urlError) {
            switch (urlError) {
                case 'email-not-verified':
                    setError('Please verify your email address before signing in.');
                    setShowResendVerification(true);
                    break;
                case 'CredentialsSignin':
                    setError('Invalid email or password. Please try again.');
                    break;
                default:
                    setError('An error occurred. Please try again.');
            }
        }

        if (urlMessage) {
            switch (urlMessage) {
                case 'email-verified':
                    setMessage('Email verified successfully! You can now sign in to your account.');
                    break;
                case 'signed-out':
                    setMessage('You have been signed out successfully.');
                    break;
                default:
                    setMessage(urlMessage);
            }
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        setShowResendVerification(false);

        console.log('=== PATRIOT THANKS NEXTAUTH LOGIN ===');
        console.log('Email:', formData.email);

        // Basic validation
        if (!formData.email || !formData.email.includes('@')) {
            setError('Please enter a valid email address.');
            setLoading(false);
            return;
        }

        if (!formData.password || formData.password.length < 3) {
            setError('Please enter your password.');
            setLoading(false);
            return;
        }

        try {
            console.log('🔐 Attempting Patriot Thanks sign in...');

            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            console.log('📋 NextAuth sign in result:', result);

            if (result?.error) {
                console.log('❌ Sign in error:', result.error);

                if (result.error === 'email-not-verified' ||
                    result.error === 'EMAIL_NOT_VERIFIED' ||
                    result.error.includes('verify')) {
                    setError('Please verify your email before signing in.');
                    setShowResendVerification(true);
                    setUnverifiedEmail(formData.email);
                } else if (result.error === 'CredentialsSignin') {
                    setError('Invalid email or password. Please try again.');
                } else {
                    setError('Sign in failed. Please try again.');
                }
            } else if (result?.ok) {
                console.log('✅ Patriot Thanks sign in successful!');
                setRedirecting(true);

                // Get the session to check user role and redirect appropriately
                try {
                    const session = await getSession();
                    console.log('📋 Patriot Thanks session data:', session);

                    if (session?.user) {
                        console.log('👤 User authenticated:', {
                            id: session.user.id,
                            email: session.user.email,
                            fname: session.user.fname,
                            lname: session.user.lname,
                            isAdmin: session.user.isAdmin,
                            level: session.user.level,
                            status: session.user.status
                        });

                        // Redirect based on user type
                        if (session.user.isAdmin) {
                            console.log('🔐 Admin user, redirecting to admin dashboard');
                            router.push('/admin/dashboard');
                        } else {
                            console.log('👤 Regular user, redirecting to dashboard');
                            router.push('/dashboard');
                        }
                    } else {
                        console.warn('⚠️ No session found after successful login');
                        router.push('/dashboard');
                    }
                } catch (sessionError) {
                    console.error('❌ Error getting session:', sessionError);
                    router.push('/dashboard');
                }
            } else {
                setError('Sign in failed. Please try again.');
            }
        } catch (error) {
            console.error('❌ Sign-in exception:', error);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setTimeout(() => {
                if (!redirecting) {
                    setLoading(false);
                }
            }, 100);
        }
    };

    const handleResendVerification = async () => {
        if (!unverifiedEmail) return;

        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: unverifiedEmail
                })
            });

            const data = await response.json();

            if (response.ok) {
                setError('');
                setMessage('Verification email sent! Please check your inbox and spam folder.');
                setShowResendVerification(false);
            } else {
                setError(data.error || 'Failed to resend verification email');
            }
        } catch (error) {
            console.error('Resend verification error:', error);
            setError('Network error. Please try again.');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Navigation />
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold text-white">
                        Welcome Back to Patriot Thanks
                    </h2>
                    <p className="mt-2 text-center text-sm text-blue-100">
                        Sign in to find military discounts and support local businesses
                    </p>
                </div>

                <form className="mt-8 space-y-6 bg-white rounded-lg p-6 shadow-xl" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                            {showResendVerification && (
                                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <span className="text-orange-600 mr-2">⚠️</span>
                                        <span className="text-sm font-medium text-orange-800">Email Not Verified</span>
                                    </div>
                                    <p className="text-sm text-orange-700 mb-3">
                                        Please check your email for a verification link.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleResendVerification}
                                        className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors"
                                    >
                                        Resend Verification Email
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                            {message}
                        </div>
                    )}

                    {redirecting && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                            Login successful! Redirecting to dashboard...
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Link href="/auth/forgot-password" className="text-sm text-blue-500 hover:text-blue-700">
                            Forgot your password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || redirecting}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : redirecting ? 'Redirecting...' : 'Sign In'}
                    </button>

                    <div className="text-center">
                        <span className="text-sm text-gray-600">Don&#39;t have an account? </span>
                        <Link href="/auth/signup" className="text-sm font-medium text-blue-500 hover:text-blue-700">
                            Sign up here
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function SignIn() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <div className="text-lg text-white">Loading...</div>
                </div>
            </div>
        }>
            <SignInContent />
        </Suspense>
    );
}