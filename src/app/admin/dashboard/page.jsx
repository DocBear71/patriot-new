'use client';

// file: src/app/admin/dashboard/page.jsx v5 - Using session-based auth API endpoints

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navigation from '../../../components/layout/Navigation';
import Link from 'next/link';

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalBusinesses: 0,
        totalIncentives: 0,
        totalUsers: 0,
        recentBusinesses: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (status === 'loading') return;

        // Check if user is authenticated and is admin
        if (!session) {
            console.log('No session found, redirecting to signin');
            router.push('/auth/signin');
            return;
        }

        if (!session.user?.isAdmin) {
            console.log('User is not admin, redirecting to regular dashboard');
            router.push('/dashboard');
            return;
        }

        console.log('✅ Admin user authenticated:', session.user.email);
        fetchDashboardStats();
    }, [session, status, router]);

    const fetchDashboardStats = async () => {
        try {
            setError(null);
            console.log('📊 Fetching admin dashboard stats...');

            // Fetch admin stats from your migrated auth API
            console.log('📈 Fetching dashboard statistics...');
            const statsResponse = await fetch('/api/auth?operation=dashboard-stats');

            let statsData = {
                totalUsers: 0,
                totalBusinesses: 0,
                totalIncentives: 0
            };

            if (statsResponse.ok) {
                statsData = await statsResponse.json();
                console.log('✅ Dashboard stats fetched:', statsData);
            } else if (statsResponse.status === 401 || statsResponse.status === 403) {
                console.error('❌ Authentication failed for dashboard stats');
                router.push('../../auth/signin');
                return;
            } else {
                console.warn('⚠️ Failed to fetch dashboard stats:', statsResponse.status);
                const errorText = await statsResponse.text();
                console.warn('Error details:', errorText);
            }

            // Try to fetch business data (you'll need to create this endpoint or use existing)
            console.log('🏢 Trying to fetch recent businesses...');
            let recentBusinesses = [];

            try {
                // This would be your business API - you might need to create this
                const businessResponse = await fetch('/api/business-admin?operation=admin-list-businesses&limit=5');
                if (businessResponse.ok) {
                    const businessData = await businessResponse.json();
                    recentBusinesses = businessData.businesses || [];
                } else {
                    console.warn('⚠️ Could not fetch recent businesses');
                }
            } catch (businessError) {
                console.warn('⚠️ Business fetch error:', businessError);
            }

            // Update stats
            setStats({
                totalBusinesses: statsData.businessCount || 0,
                totalIncentives: statsData.incentiveCount || statsData.totalIncentives || 0,
                totalUsers: statsData.userCount || statsData.totalUsers || 0,
                recentBusinesses: recentBusinesses.slice(0, 5)
            });

            console.log('📈 Dashboard stats updated successfully:', {
                businesses: statsData.businessCount || 0,
                incentives: statsData.incentiveCount || statsData.totalIncentives || 0,
                users: statsData.userCount || statsData.totalUsers || 0,
                recentBusinesses: recentBusinesses.length
            });

        } catch (error) {
            console.error('❌ Failed to fetch dashboard stats:', error);
            setError('Failed to load dashboard data. Please try refreshing the page.');
        } finally {
            setLoading(false);
        }
    };

    // Handle retry
    const handleRetry = () => {
        setLoading(true);
        fetchDashboardStats();
    };

    if (status === 'loading' || loading) {
        return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading admin dashboard...</p>
                    </div>
                </div>
        );
    }

    if (!session) {
        return null; // Will redirect in useEffect
    }

    if (!session.user?.isAdmin) {
        return null; // Will redirect in useEffect
    }

    return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />

                <div className="pt-20 pb-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-gray-600 mt-2">
                                Welcome back, {session.user.fname} {session.user.lname}
                            </p>
                            <p className="text-sm text-gray-500">
                                Manage Patriot Thanks platform
                            </p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                <p>{error}</p>
                                            </div>
                                            <div className="mt-4">
                                                <button
                                                        onClick={handleRetry}
                                                        className="bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-200 rounded-md"
                                                >
                                                    Try Again
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                        )}

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="bg-blue-600 text-white p-3 rounded-full">
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Businesses</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalBusinesses}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="bg-red-600 text-white p-3 rounded-full">
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Incentives</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalIncentives}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="bg-yellow-500 text-white p-3 rounded-full">
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <Link
                                    href="/admin-business"
                                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center group"
                            >
                                <div className="text-blue-500 mb-2 group-hover:text-blue-600">
                                    <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-900">Manage Businesses</h3>
                            </Link>

                            <Link
                                    href="/admin-incentives"
                                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center group"
                            >
                                <div className="text-red-500 mb-2 group-hover:text-red-600">
                                    <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-red-900">Manage Incentives</h3>
                            </Link>

                            <Link
                                    href="/admin-users"
                                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center group"
                            >
                                <div className="text-yellow-500 mb-2 group-hover:text-yellow-600">
                                    <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-yellow-900">Manage Users</h3>
                            </Link>

                            <Link
                                    href="/chain-management"
                                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center group"
                            >
                                <div className="text-blue-900 mb-2 group-hover:text-blue-700">
                                    <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-800">Manage Chains</h3>
                            </Link>
                        </div>

                        {/* Additional Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <Link
                                    href="/admin-code-management"
                                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center group"
                            >
                                <div className="text-purple-500 mb-2 group-hover:text-purple-600">
                                    <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-purple-900">Admin Codes</h3>
                            </Link>

                            <Link
                                    href="/donations-admin"
                                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center group"
                            >
                                <div className="text-green-500 mb-2 group-hover:text-green-600">
                                    <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-green-900">Donations</h3>
                            </Link>

                            <Link
                                    href="#"
                                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center group"
                            >
                                <div className="text-gray-500 mb-2 group-hover:text-gray-600">
                                    <svg className="h-8 w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-gray-800">Analytics</h3>
                            </Link>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Businesses</h2>

                            {stats.recentBusinesses.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-2">Business Name</th>
                                                <th className="text-left py-2">Location</th>
                                                <th className="text-left py-2">Type</th>
                                                <th className="text-left py-2">Status</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {stats.recentBusinesses.map((business, index) => (
                                                    <tr key={business._id || index} className="border-b">
                                                        <td className="py-2 font-medium">{business.bname || business.name}</td>
                                                        <td className="py-2 text-gray-600">{business.city}, {business.state}</td>
                                                        <td className="py-2 text-gray-600">{business.type || business.category}</td>
                                                        <td className="py-2">
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                    {business.status || 'Active'}
                                                </span>
                                                        </td>
                                                    </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                            ) : (
                                    <div className="text-center py-8">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                                        <p className="mt-1 text-sm text-gray-500">Get started by adding some businesses to the platform.</p>
                                        <div className="mt-4">
                                            <Link
                                                    href="/admin/businesses"
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                Add Business
                                            </Link>
                                        </div>
                                    </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
    );
}