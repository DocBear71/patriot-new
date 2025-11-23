'use client';

// file: src/components/layout/AdminLayout.jsx v1 - Admin dashboard layout with navigation

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Navigation from './Navigation';

export default function AdminLayout({ children }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (session && !session.user?.isAdmin) {
            router.push('/');
        }
    }, [session, status, router]);

    if (status === 'loading') {
        return (
                <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <div className="flex items-center justify-center h-screen">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                </div>
        );
    }

    if (!session?.user?.isAdmin) {
        return null;
    }

    const adminNavItems = [
        {
            name: 'Dashboard',
            href: '/admin',
            icon: '📊'
        },
        {
            name: 'Users',
            href: '/admin/users',
            icon: '👥'
        },
        {
            name: 'Businesses',
            href: '/admin/businesses',
            icon: '🏢'
        },
        {
            name: 'Incentives',
            href: '/admin/incentives',
            icon: '🎁'
        },
        {
            name: 'Veteran Verification',
            href: '/admin/veteran-verification',
            icon: '🇺🇸'
        },
        {
            name: 'Reports',
            href: '/admin/reports',
            icon: '📈'
        }
    ];

    return (
            <div className="min-h-screen bg-gray-50">
                {/* Main Navigation */}
                <Navigation />

                <div className="flex">
                    {/* Sidebar */}
                    <aside className="w-64 bg-white shadow-md min-h-screen pt-20">
                        <div className="p-4">
                            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                Admin Menu
                            </h2>
                            <nav className="space-y-1">
                                {adminNavItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                            <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`
                                            flex items-center px-4 py-3 text-sm font-medium rounded-md
                                            transition-colors duration-150
                                            ${isActive
                                                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                    }
                                        `}
                                            >
                                                <span className="mr-3 text-xl">{item.icon}</span>
                                                {item.name}
                                            </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Quick Stats */}
                        <div className="p-4 border-t mt-6">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Quick Stats
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Role:</span>
                                    <span className="font-semibold text-red-600">Admin</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Status:</span>
                                    <span className="font-semibold text-green-600">Active</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 pt-20">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
    );
}