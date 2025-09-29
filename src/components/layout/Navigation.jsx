'use client';

// file: src/components/layout/Navigation.jsx v4 - Added Incentive management links for authenticated users

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Navigation() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut({ redirect: false });
        router.push('/');
    };

    return (
            <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-12">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center space-x-5">
                                <Image
                                        src="/images/patriot-thanks-logo.png"
                                        alt="Patriot Thanks"
                                        width={40}
                                        height={20}
                                        className="object-contain"
                                />
                                <span className="text-xl font-bold text-blue-800">Patriot Thanks</span>
                            </Link>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-6">
                            <Link href="/search" className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md">
                                Search Businesses
                            </Link>

                            <Link href="/donate" className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md">
                                Support Our Mission
                            </Link>

                            {/* Show Incentive View for everyone */}
                            <Link href="/incentive-view" className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md">
                                View Incentives
                            </Link>

                            {/* Business Management Links - Only show for authenticated users */}
                            {session && (
                                    <div className="flex items-center space-x-4">
                                        <div className="relative group">
                                            <button className="flex items-center text-gray-700 hover:text-blue-500 px-3 py-2 rounded-md">
                                                <span>Manage Businesses</span>
                                                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                                <Link
                                                        href="/business-add"
                                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>Add Business</span>
                                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Basic+</span>
                                                    </div>
                                                </Link>
                                                <Link
                                                        href="/business-update"
                                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>Update Business</span>
                                                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Premium+</span>
                                                    </div>
                                                </Link>

                                                {/* Separator */}
                                                <div className="border-t border-gray-100 my-1"></div>

                                                <Link
                                                        href="/incentive-add"
                                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>Add Incentive</span>
                                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Basic+</span>
                                                    </div>
                                                </Link>
                                                <Link
                                                        href="/incentive-update"
                                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>Update Incentive</span>
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Premium+</span>
                                                    </div>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                            )}

                            {status === 'loading' ? (
                                    <div className="animate-pulse">Loading...</div>
                            ) : session ? (
                                    <div className="flex items-center space-x-4">
                                        {session.user.isAdmin && (
                                                <Link
                                                        href="/admin/dashboard"
                                                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                                                >
                                                    Admin
                                                </Link>
                                        )}
                                        <Link
                                                href="/dashboard"
                                                className="text-gray-700 hover:text-blue-500"
                                        >
                                            Dashboard
                                        </Link>
                                        <div className="relative group">
                                            <button className="flex items-center text-gray-700 hover:text-blue-500">
                                                <span>{session.user.fname} {session.user.lname}</span>
                                                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                                <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                    Profile
                                                </Link>
                                                <button
                                                        onClick={handleSignOut}
                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                            ) : (
                                    <div className="flex items-center space-x-4">
                                        <Link
                                                href="/auth/signin"
                                                className="text-blue-500 hover:text-bg-blue-900"
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                                href="/auth/signup"
                                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                                        >
                                            Sign Up
                                        </Link>
                                    </div>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="text-gray-500 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isMenuOpen ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                            <div className="md:hidden">
                                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
                                    <Link href="/search" className="block px-3 py-2 text-gray-700 hover:text-blue-500">
                                        Search Businesses
                                    </Link>

                                    <Link href="/donate" className="block px-3 py-2 text-gray-700 hover:text-blue-500">
                                        Support Our Mission
                                    </Link>

                                    {/* Show Incentive View for everyone */}
                                    <Link href="/incentive-view" className="block px-3 py-2 text-gray-700 hover:text-blue-500">
                                        View Incentives
                                    </Link>

                                    {/* Mobile Business Management Links - Only show for authenticated users */}
                                    {session && (
                                            <>
                                                <div className="px-3 py-2">
                                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                        Manage Businesses
                                                    </h3>
                                                </div>
                                                <Link href="/business-add" className="block px-3 py-2 text-gray-700 hover:text-blue-500 ml-4">
                                                    <div className="flex items-center justify-between">
                                                        <span>Add Business</span>
                                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Basic+</span>
                                                    </div>
                                                </Link>
                                                <Link href="/business-update" className="block px-3 py-2 text-gray-700 hover:text-blue-500 ml-4">
                                                    <div className="flex items-center justify-between">
                                                        <span>Update Business</span>
                                                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Premium+</span>
                                                    </div>
                                                </Link>

                                                {/* Mobile Incentive Management Links */}
                                                <div className="px-3 py-2 mt-4">
                                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                        Manage Incentives
                                                    </h3>
                                                </div>
                                                <Link href="/incentive-add" className="block px-3 py-2 text-gray-700 hover:text-blue-500 ml-4">
                                                    <div className="flex items-center justify-between">
                                                        <span>Add Incentive</span>
                                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Basic+</span>
                                                    </div>
                                                </Link>
                                                <Link href="/incentive-update" className="block px-3 py-2 text-gray-700 hover:text-blue-500 ml-4">
                                                    <div className="flex items-center justify-between">
                                                        <span>Update Incentive</span>
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Premium+</span>
                                                    </div>
                                                </Link>
                                            </>
                                    )}

                                    {session ? (
                                            <>
                                                <Link href="/dashboard" className="block px-3 py-2 text-gray-700 hover:text-blue-500">
                                                    Dashboard
                                                </Link>
                                                {session.user.isAdmin && (
                                                        <Link href="/admin/dashboard" className="block px-3 py-2 text-red-500 hover:text-red-700">
                                                            Admin Dashboard
                                                        </Link>
                                                )}
                                                <Link href="/profile" className="block px-3 py-2 text-gray-700 hover:text-blue-500">
                                                    Profile
                                                </Link>
                                                <button
                                                        onClick={handleSignOut}
                                                        className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-500"
                                                >
                                                    Sign Out
                                                </button>
                                            </>
                                    ) : (
                                            <>
                                                <Link href="/auth/signin" className="block px-3 py-2 text-blue-500 hover:text-bg-blue-900">
                                                    Sign In
                                                </Link>
                                                <Link href="/auth/signup" className="block px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                                                    Sign Up
                                                </Link>
                                            </>
                                    )}
                                </div>
                            </div>
                    )}
                </div>
            </nav>
    );
}