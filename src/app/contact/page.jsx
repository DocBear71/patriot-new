'use client';

// file: /src/pages/contact.jsx v1 - Contact form page for user inquiries and support

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../components/layout/Navigation';
import Footer from '../../components/legal/Footer';

export default function ContactPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstname.trim()) {
            newErrors.firstname = 'First name is required';
        }

        if (!formData.lastname.trim()) {
            newErrors.lastname = 'Last name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.subject.trim()) {
            newErrors.subject = 'Subject is required';
        }

        if (!formData.message.trim()) {
            newErrors.message = 'Message is required';
        } else if (formData.message.trim().length < 10) {
            newErrors.message = 'Message must be at least 10 characters long';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                // Store form data in session storage for the thank you page
                sessionStorage.setItem('contactFormData', JSON.stringify(formData));

                // Redirect to thank you page
                router.push('/thank-you');
            } else {
                const data = await response.json();
                alert(`Error sending message: ${data.message || 'Please try again.'}`);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />
                {/* Header */}
                <header className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-6">
                            <div className="flex items-center">
                                <Link href="/">
                                    <img
                                            src="/images/patriotthankslogo6-13-2025.png"
                                            alt="Patriot Thanks Logo"
                                            className="h-12 w-auto"
                                    />
                                </Link>
                                <div className="ml-4">
                                    <h1 className="text-2xl font-bold text-gray-900">Patriot Thanks</h1>
                                    <h2 className="text-lg text-gray-600">Contact Us</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Contact Information */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Get in Touch</h2>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                            Our Mission
                                        </h3>
                                        <p className="mt-2 text-gray-700">
                                            Connecting veterans, active-duty military, and first responders
                                            with businesses that appreciate their service.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                            Response Time
                                        </h3>
                                        <p className="mt-2 text-gray-700">
                                            We typically respond within 24-48 hours during business days.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                            Support Topics
                                        </h3>
                                        <ul className="mt-2 text-gray-700 space-y-1">
                                            <li>• Business registration questions</li>
                                            <li>• Account and profile support</li>
                                            <li>• Technical issues</li>
                                            <li>• Partnership opportunities</li>
                                            <li>• General feedback</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Quick Links */}
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                                        Quick Links
                                    </h3>
                                    <div className="space-y-2">
                                        <Link
                                                href="/search"
                                                className="block text-blue-600 hover:text-blue-800"
                                        >
                                            Find Businesses
                                        </Link>
                                        <Link
                                                href="/auth/signup"
                                                className="block text-blue-600 hover:text-blue-800"
                                        >
                                            Create Account
                                        </Link>
                                        <Link
                                                href="/donate"
                                                className="block text-blue-600 hover:text-blue-800"
                                        >
                                            Support Our Mission
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="md:col-span-2">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Name Fields */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">
                                                First Name *
                                            </label>
                                            <input
                                                    type="text"
                                                    id="firstname"
                                                    name="firstname"
                                                    required
                                                    value={formData.firstname}
                                                    onChange={handleInputChange}
                                                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                                            errors.firstname ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Your first name"
                                            />
                                            {errors.firstname && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.firstname}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">
                                                Last Name *
                                            </label>
                                            <input
                                                    type="text"
                                                    id="lastname"
                                                    name="lastname"
                                                    required
                                                    value={formData.lastname}
                                                    onChange={handleInputChange}
                                                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                                            errors.lastname ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Your last name"
                                            />
                                            {errors.lastname && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.lastname}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                            Email Address *
                                        </label>
                                        <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                required
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                                        errors.email ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                                placeholder="your.email@example.com"
                                        />
                                        {errors.email && (
                                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                                            Subject *
                                        </label>
                                        <select
                                                id="subject"
                                                name="subject"
                                                required
                                                value={formData.subject}
                                                onChange={handleInputChange}
                                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                                        errors.subject ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">Select a subject</option>
                                            <option value="General Inquiry">General Inquiry</option>
                                            <option value="Business Registration">Business Registration</option>
                                            <option value="Account Support">Account Support</option>
                                            <option value="Technical Issue">Technical Issue</option>
                                            <option value="Partnership Opportunity">Partnership Opportunity</option>
                                            <option value="Feedback">Feedback</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        {errors.subject && (
                                                <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                                        )}
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                                            Message *
                                        </label>
                                        <textarea
                                                id="message"
                                                name="message"
                                                required
                                                rows={6}
                                                value={formData.message}
                                                onChange={handleInputChange}
                                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                                        errors.message ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                                placeholder="Please provide details about your inquiry..."
                                        />
                                        {errors.message && (
                                                <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                                        )}
                                        <p className="mt-1 text-sm text-gray-500">
                                            Minimum 10 characters ({formData.message.length}/10)
                                        </p>
                                    </div>

                                    {/* Submit Button */}
                                    <div>
                                        <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                    <>
                                                        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        Send Message
                                                    </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Required Fields Note */}
                                    <p className="text-sm text-gray-500">
                                        * Required fields
                                    </p>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="mt-12 bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Frequently Asked Questions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">
                                    How do I register my business?
                                </h4>
                                <p className="text-gray-700 text-sm">
                                    Business owners can register through our business portal. Contact us for
                                    assistance with the registration process and verification requirements.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">
                                    Who qualifies for discounts?
                                </h4>
                                <p className="text-gray-700 text-sm">
                                    Veterans, active-duty military, National Guard, Reserves, first responders,
                                    and in many cases, their spouses and dependents qualify for participating business discounts.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">
                                    Is there a cost to use the platform?
                                </h4>
                                <p className="text-gray-700 text-sm">
                                    Patriot Thanks is free for service members and their families.
                                    We're supported by donations and business partnerships.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">
                                    How can I support the mission?
                                </h4>
                                <p className="text-gray-700 text-sm">
                                    You can support us by spreading the word, making a donation,
                                    or partnering with us as a business that wants to give back to service members.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <Footer />
            </div>
    );
}