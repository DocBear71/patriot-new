'use client';

// file: src/app/page.js v1 - Updated Patriot Thanks homepage with integrated legal footer

import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/legal/Footer';

export default function HomePage() {
    return (
            <div className="min-h-screen">
                <Navigation />

                {/* Hero Section with Background */}
                <div
                        className="relative pt-12 pb-16 bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: "linear-gradient(rgba(30, 64, 175, 0.8), rgba(30, 58, 138, 0.8)), url('/images/backgroundNew.webp')"
                        }}
                >
                    <br/>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            {/* Logo */}
                            <div className="mb-6">
                                <Image
                                        src="/images/patriot-thanks-logo.png"
                                        alt="Patriot Thanks Logo"
                                        width={200}
                                        height={100}
                                        className="mx-auto"
                                        priority
                                />
                            </div>

                            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                                Patriot Thanks
                            </h1>
                            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
                                Supporting Those Who Serve Our Communities
                            </p>
                            <p className="text-lg text-blue-200 mb-12 max-w-2xl mx-auto">
                                Connect with local businesses that offer discounts and incentives for military personnel, veterans, first responders, and their families.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                        href="/search"
                                        className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors shadow-lg"
                                >
                                    Find Businesses
                                </Link>
                                <Link
                                        href="/auth/signup"
                                        className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-800 transition-colors"
                                >
                                    Join Today
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Military Branches Section */}
                <div className="bg-white py-16">
                    <br/>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                Honoring All Who Serve
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                We support military personnel, veterans, first responders, and their families from all branches of service
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div>
                                <Image
                                        src="/images/military_branches_middle.jpg"
                                        alt="Military Branches"
                                        width={500}
                                        height={300}
                                        className="rounded-lg shadow-lg"
                                />
                            </div>
                            <div>
                                <Image
                                        src="/images/military_flags_middle.png"
                                        alt="Military Flags"
                                        width={500}
                                        height={300}
                                        className="rounded-lg shadow-lg"
                                />
                            </div>
                        </div>
                        <br/>
                    </div>
                </div>

                {/* How It Works Section */}
                <div className="bg-gray-50 py-16">
                    <br/>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                How Patriot Thanks Works
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Connecting service members with businesses that appreciate their sacrifice
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center bg-white p-6 rounded-lg shadow-md">
                                <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Search</h3>
                                <p className="text-gray-600">
                                    Find local businesses in your area that offer military and first responder discounts
                                </p>
                            </div>

                            <div className="text-center bg-white p-6 rounded-lg shadow-md">
                                <div className="bg-red-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Verify</h3>
                                <p className="text-gray-600">
                                    View verified discounts and incentives available for your service type
                                </p>
                            </div>

                            <div className="text-center bg-white p-6 rounded-lg shadow-md">
                                <div className="bg-yellow-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Save</h3>
                                <p className="text-gray-600">
                                    Enjoy exclusive discounts and support businesses that support our heroes
                                </p>
                            </div>
                            <br/>
                        </div>
                    </div>
                </div>

                {/* Freedom Section with backgroundNew.webp */}
                <div
                        className="relative py-16 bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/images/backgroundNew.webp')"
                        }}
                >
                    <br/>
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Freedom Isn&#39;t Free
                        </h2>
                        <p className="text-xl text-gray-200 mb-8">
                            We honor the sacrifices made by our service members and their families.
                            Local businesses across America stand ready to show their appreciation.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                    href="/auth/signup"
                                    className="bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors shadow-lg"
                            >
                                Create Free Account
                            </Link>
                            <Link
                                    href="/search"
                                    className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                            >
                                Browse Businesses
                            </Link>
                        </div>
                        <br/>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="bg-white py-16">
                    <br/>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                Growing Community
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Join thousands of service members and hundreds of businesses in our appreciation network
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                                <div className="text-4xl font-bold text-blue-600 mb-2">37+</div>
                                <div className="text-gray-700 font-medium">Local Businesses</div>
                                <div className="text-sm text-gray-500 mt-1">Partners in appreciation</div>
                            </div>
                            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                                <div className="text-4xl font-bold text-red-600 mb-2">13+</div>
                                <div className="text-gray-700 font-medium">Active Incentives</div>
                                <div className="text-sm text-gray-500 mt-1">Exclusive discounts available</div>
                            </div>
                            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                                <div className="text-4xl font-bold text-yellow-600 mb-2">209+</div>
                                <div className="text-gray-700 font-medium">Chain Partners</div>
                                <div className="text-sm text-gray-500 mt-1">National brand supporters</div>
                            </div>
                        </div>
                        <br/>
                    </div>
                </div>

                {/* Call to Action Section */}
                <div className="bg-gradient-to-r from-blue-600 to-red-600 py-16">
                    <br/>
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Ready to Get Started?
                        </h2>
                        <p className="text-xl text-blue-100 mb-8">
                            Join Patriot Thanks today and start connecting with businesses that appreciate your service
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                    href="/auth/signup"
                                    className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                            >
                                Sign Up Free
                            </Link>
                            <Link
                                    href="/auth/signup"
                                    className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                            >
                                List Your Business
                            </Link>
                        </div>
                    </div>
                    <br/>
                </div>

                {/* Replace the old footer with the new integrated Footer component */}
                <Footer />
            </div>
    );
}