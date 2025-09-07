'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../../components/layout/Navigation';
import TermsOfUseModal from '../../../components/legal/TermsOfUseModal';
import PrivacyPolicyModal from '../../../components/legal/PrivacyPolicyModal';

export default function SignUp() {
    const [formData, setFormData] = useState({
        fname: '',
        lname: '',
        email: '',
        password: '',
        confirmPassword: '',
        serviceType: 'SU', // Default to Supporter
        militaryBranch: '',
        level: 'Free', // Add access level
        address1: '',
        city: '',
        state: '',
        zip: '',
        termsAccepted: false
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const router = useRouter();

    const serviceTypes = [
        { value: 'VT', label: 'Veteran' },
        { value: 'AD', label: 'Active-Duty' },
        { value: 'FR', label: 'First Responder' },
        { value: 'SP', label: 'Spouse' },
        { value: 'BO', label: 'Business Owner' },
        { value: 'SU', label: 'Supporter' }
    ];

    const militaryBranches = [
        { value: 'army', label: 'Army' },
        { value: 'navy', label: 'Navy' },
        { value: 'air_force', label: 'Air Force' },
        { value: 'marines', label: 'Marines' },
        { value: 'coast_guard', label: 'Coast Guard' },
        { value: 'space_force', label: 'Space Force' },
        { value: 'national_guard', label: 'National Guard' },
        { value: 'reserves', label: 'Reserves' },
        { value: 'police', label: 'Police' },
        { value: 'fire', label: 'Fire Department' },
        { value: 'ems', label: 'EMS' },
        { value: 'other', label: 'Other' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (!formData.termsAccepted) {
            setError('You must accept the terms and conditions');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fname: formData.fname,
                    lname: formData.lname,
                    email: formData.email,
                    password: formData.password,
                    serviceType: formData.serviceType,
                    militaryBranch: formData.militaryBranch,
                    address1: formData.address1,
                    city: formData.city,
                    state: formData.state,
                    zip: formData.zip,
                    termsAccepted: formData.termsAccepted
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Redirect to check email page with email parameter
                router.push(`/auth/check-email?email=${encodeURIComponent(formData.email)}`);
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const requiresBranch = ['VT', 'AD', 'FR', 'SP'].includes(formData.serviceType);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-900 py-12 px-4 sm:px-6 lg:px-8">
            <Navigation />
            <br/>
            <br/>
            <div className="max-w-2xl mx-auto mt-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white">
                        Join Patriot Thanks
                    </h2>
                    <p className="mt-2 text-blue-100">
                        Connect with businesses that support our service members
                    </p>
                </div>

                <form className="bg-white rounded-lg p-6 shadow-xl space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="fname" className="block text-sm font-medium text-gray-700">
                                First Name *
                            </label>
                            <input
                                type="text"
                                id="fname"
                                name="fname"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={formData.fname}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="lname" className="block text-sm font-medium text-gray-700">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                id="lname"
                                name="lname"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={formData.lname}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email Address *
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Service Information */}
                    <div>
                        <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">
                            Service Type *
                        </label>
                        <select
                            id="serviceType"
                            name="serviceType"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={formData.serviceType}
                            onChange={handleChange}
                        >
                            {serviceTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {requiresBranch && (
                        <div>
                            <label htmlFor="militaryBranch" className="block text-sm font-medium text-gray-700">
                                Branch/Service *
                            </label>
                            <select
                                id="militaryBranch"
                                name="militaryBranch"
                                required={requiresBranch}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={formData.militaryBranch}
                                onChange={handleChange}
                            >
                                <option value="">Select Branch/Service</option>
                                {militaryBranches.map(branch => (
                                    <option key={branch.value} value={branch.value}>
                                        {branch.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Password */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password *
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                minLength="6"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password *
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Address (Optional) */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Address (Optional)</h3>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="address1" className="block text-sm font-medium text-gray-700">
                                    Street Address
                                </label>
                                <input
                                    type="text"
                                    id="address1"
                                    name="address1"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.address1}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.city}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                                        State
                                    </label>
                                    <input
                                        type="text"
                                        id="state"
                                        name="state"
                                        maxLength="2"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.state}
                                        onChange={handleChange}
                                        placeholder="CA"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
                                        ZIP Code
                                    </label>
                                    <input
                                        type="text"
                                        id="zip"
                                        name="zip"
                                        maxLength="10"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.zip}
                                        onChange={handleChange}
                                        placeholder="12345"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="flex items-center">
                        <input
                            id="termsAccepted"
                            name="termsAccepted"
                            type="checkbox"
                            required
                            className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                            checked={formData.termsAccepted}
                            onChange={handleChange}
                        />
                        <label htmlFor="termsAccepted" className="ml-2 block text-sm text-gray-900">
                            I accept the{' '}
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(true)}
                                className="text-blue-500 hover:text-blue-700 underline cursor-pointer"
                            >
                                Terms and Conditions
                            </button>{' '}
                            and{' '}
                            <button
                                type="button"
                                onClick={() => setShowPrivacyModal(true)}
                                className="text-blue-500 hover:text-blue-700 underline cursor-pointer"
                            >
                                Privacy Policy
                            </button>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>

                    <div className="text-center">
                        <span className="text-sm text-gray-600">Already have an account? </span>
                        <Link href="/auth/signin" className="text-sm font-medium text-blue-500 hover:text-bg-blue-900">
                            Sign in here
                        </Link>
                    </div>
                </form>
            </div>

            {/* Modals */}
            <TermsOfUseModal
                isOpen={showTermsModal}
                onClose={() => setShowTermsModal(false)}
            />
            <PrivacyPolicyModal
                isOpen={showPrivacyModal}
                onClose={() => setShowPrivacyModal(false)}
            />

        </div>
    );
}