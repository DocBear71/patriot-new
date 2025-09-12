'use client';

// file: src/app/dashboard/page.jsx v2 - Main dashboard page with fresh verification status check

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navigation from '../../components/layout/Navigation';
import EmailVerificationBanner from '../../components/auth/EmailVerificationBanner';

export default function Dashboard() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [recentBusinesses, setRecentBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userVerificationStatus, setUserVerificationStatus] = useState(null);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
            return;
        }

        // Fetch recent businesses and check verification status
        fetchDashboardData();
    }, [session, status, router]);

    const fetchDashboardData = async () => {
        try {
            // Fetch recent businesses
            const businessResponse = await fetch('/api/businesses?limit=6');
            const businessData = await businessResponse.json();
            if (businessResponse.ok) {
                setRecentBusinesses(businessData.businesses || []);
            }

            // Check fresh verification status from database
            if (session?.user?.email) {
                await checkFreshVerificationStatus();
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkFreshVerificationStatus = async () => {
        try {
            const response = await fetch('/api/user/verification-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: session.user.email }),
            });

            const data = await response.json();

            if (response.ok && data.isVerified !== undefined) {
                setUserVerificationStatus(data.isVerified);

                // If database shows verified but session shows unverified, update session
                if (data.isVerified && !session.user.isVerified) {
                    console.log('🔄 Updating session with fresh verification status');
                    await update({
                        ...session,
                        user: {
                            ...session.user,
                            isVerified: true
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Failed to check verification status:', error);
        }
    };

    if (status === 'loading' || loading) {
        return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
        );
    }

    if (!session) {
        return null;
    }

    const getServiceTypeLabel = (status) => {
        const types = {
            'VT': 'Veteran',
            'AD': 'Active Duty',
            'FR': 'First Responder',
            'SP': 'Spouse',
            'BO': 'Business Owner',
            'SU': 'Supporter'
        };
        return types[status] || status;
    };

    // Use fresh verification status if available, otherwise fall back to session
    const isUserVerified = userVerificationStatus !== null ? userVerificationStatus : session.user.isVerified;

    return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />

                <div className="pt-20 pb-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Email Verification Banner - only show if not verified */}
                        {!isUserVerified && (
                                <EmailVerificationBanner
                                        user={{
                                            ...session.user,
                                            isVerified: isUserVerified
                                        }}
                                        onDismiss={() => {
                                            // Optionally refresh verification status when dismissed
                                            checkFreshVerificationStatus();
                                        }}
                                />
                        )}

                        {/* Welcome Header */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        Welcome back, {session.user.fname}!
                                    </h1>
                                    <p className="text-gray-600 mt-2">
                                        Service Type: <span className="font-medium">{getServiceTypeLabel(session.user.status)}</span>
                                        {session.user.level && (
                                                <span className="ml-3">
                                                    Access Level: <span className="font-medium">{session.user.level}</span>
                                                </span>
                                        )}
                                        {isUserVerified && (
                                                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                ✓ Verified
                                            </span>
                                        )}
                                    </p>
                                </div>
                                {session.user.isAdmin && (
                                        <div className="bg-red-600 text-white px-4 py-2 rounded-md">
                                            <span className="font-medium">Administrator</span>
                                        </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center">
                                    <div className="bg-blue-800 text-white p-3 rounded-full">
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Search Businesses</h3>
                                        <p className="text-gray-600">Find local businesses with discounts</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <a href="/search" className="text-blue-500 hover:text-blue-900 font-medium">
                                        Start searching →
                                    </a>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center">
                                    <div className="bg-red-600 text-white p-3 rounded-full">
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-semibold text-gray-900">My Profile</h3>
                                        <p className="text-gray-600">Update your information</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <a href="/profile" className="text-blue-500 hover:text-blue-900 font-medium">
                                        View profile →
                                    </a>
                                </div>
                            </div>

                            {session.user.isAdmin && (
                                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                                        <div className="flex items-center">
                                            <div className="bg-yellow-400 text-white p-3 rounded-full">
                                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="ml-4">
                                                <h3 className="text-lg font-semibold text-gray-900">Admin Dashboard</h3>
                                                <p className="text-gray-600">Manage businesses and users</p>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <a href="/admin/dashboard" className="text-blue-500 hover:text-blue-900 font-medium">
                                                Open admin panel →
                                            </a>
                                        </div>
                                    </div>
                            )}
                        </div>

                        {/* Recent Businesses */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Businesses</h2>

                            {recentBusinesses.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {recentBusinesses.map((business) => (
                                                <div key={business._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <h3 className="font-semibold text-gray-900 mb-2">{business.bname}</h3>
                                                    <p className="text-sm text-gray-600 mb-1">{business.city}, {business.state}</p>
                                                    <p className="text-sm text-gray-500">{business.type}</p>
                                                </div>
                                        ))}
                                    </div>
                            ) : (
                                    <p className="text-gray-600">No businesses available.</p>
                            )}

                            <div className="mt-6 text-center">
                                <a
                                        href="/search"
                                        className="bg-blue-800 text-white px-6 py-2 rounded-md hover:bg-blue-700 inline-block"
                                >
                                    View All Businesses
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    );
}