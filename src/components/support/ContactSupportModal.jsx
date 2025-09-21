// file: src/components/support/ContactSupportModal.jsx v1 - Patriot Thanks contact support modal for account integration

import React, { useState } from 'react';
import { apiPost } from '@/lib/api-config';

export default function ContactSupportModal({ isOpen, onClose, userSubscription }) {
    const [formData, setFormData] = useState({
        subject: '',
        category: '',
        message: '',
        urgency: 'normal'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const response = await apiPost('/api/contact', {
                ...formData,
                userTier: userSubscription?.tier || 'free',
                userId: userSubscription?.userId
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitStatus('success');
                setFormData({
                    subject: '',
                    category: '',
                    message: '',
                    urgency: 'normal'
                });

                // Auto-close after success
                setTimeout(() => {
                    onClose();
                    setSubmitStatus(null);
                }, 2000);
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setFormData({
                subject: '',
                category: '',
                message: '',
                urgency: 'normal'
            });
            setSubmitStatus(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    const categories = [
        { value: '', label: 'Select a category...' },
        { value: 'verification-help', label: 'Verification Help' },
        { value: 'discount-issue', label: 'Discount Issue' },
        { value: 'business-suggestion', label: 'Business Suggestion' },
        { value: 'account-support', label: 'Account Support' },
        { value: 'technical-support', label: 'Technical Support' },
        { value: 'business-partnership', label: 'Business Partnership' },
        { value: 'billing-support', label: 'Billing Support' },
        { value: 'general-feedback', label: 'General Feedback' },
        { value: 'bug-report', label: 'Bug Report' },
        { value: 'feature-request', label: 'Feature Request' },
        { value: 'other', label: 'Other' }
    ];

    const urgencyLevels = [
        { value: 'low', label: 'Low - General question', color: 'text-green-600' },
        { value: 'normal', label: 'Normal - Standard support', color: 'text-blue-600' },
        { value: 'high', label: 'High - Account issue', color: 'text-orange-600' },
        { value: 'urgent', label: 'Urgent - Service disruption', color: 'text-red-600' }
    ];

    return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-600 to-blue-600 text-white p-6 rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Contact Support</h2>
                                <p className="text-red-100 mt-1">🇺🇸 We're here to help service members and businesses</p>
                            </div>
                            <button
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    className="text-white hover:text-gray-200 text-2xl font-bold p-1"
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Support Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start space-x-3">
                                <div className="text-blue-600 text-xl">ℹ️</div>
                                <div>
                                    <h3 className="font-semibold text-blue-800 mb-1">Support Information</h3>
                                    <div className="text-blue-700 text-sm space-y-1">
                                        <p>• <strong>Response Time:</strong> Within 2 business days</p>
                                        <p>• <strong>Priority Support:</strong> Available for premium users</p>
                                        <p>• <strong>Emergency Support:</strong> Use "Urgent" for service disruptions</p>
                                        <p>• <strong>Business Hours:</strong> Monday-Friday, 9 AM - 5 PM CST</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Messages */}
                        {submitStatus === 'success' && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-center text-green-800">
                                        <span className="text-xl mr-3">✅</span>
                                        <div>
                                            <div className="font-semibold">Message sent successfully!</div>
                                            <div className="text-sm text-green-700">We'll respond within 2 business days. Check your email for updates.</div>
                                        </div>
                                    </div>
                                </div>
                        )}

                        {submitStatus === 'error' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-center text-red-800">
                                        <span className="text-xl mr-3">❌</span>
                                        <div>
                                            <div className="font-semibold">Failed to send message</div>
                                            <div className="text-sm text-red-700">Please try again or contact us directly at privacy@patriotthanks.com</div>
                                        </div>
                                    </div>
                                </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Category */}
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <select
                                        id="category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {categories.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject *
                                </label>
                                <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Brief description of your issue or question"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Urgency */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Urgency Level *
                                </label>
                                <div className="space-y-2">
                                    {urgencyLevels.map(level => (
                                            <label key={level.value} className="flex items-center">
                                                <input
                                                        type="radio"
                                                        name="urgency"
                                                        value={level.value}
                                                        checked={formData.urgency === level.value}
                                                        onChange={handleInputChange}
                                                        className="mr-3 text-blue-600"
                                                />
                                                <span className={`${level.color} font-medium`}>{level.label}</span>
                                            </label>
                                    ))}
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                    Detailed Message *
                                </label>
                                <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required
                                        rows="6"
                                        placeholder="Please provide as much detail as possible about your issue, including:
• Steps you took before the issue occurred
• What you expected to happen
• What actually happened
• Any error messages you saw
• Your device/browser information (if relevant)"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                                />
                            </div>

                            {/* User Info Display */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-2">Account Information</h4>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p><strong>Account Type:</strong> {userSubscription?.tier?.charAt(0).toUpperCase() + userSubscription?.tier?.slice(1) || 'Free'}</p>
                                    <p><strong>Status:</strong> {userSubscription?.isTrialActive ? 'Trial Active' : userSubscription?.status || 'Active'}</p>
                                    {userSubscription?.tier && userSubscription.tier !== 'free' && (
                                            <p className="text-green-600"><strong>Priority Support:</strong> Eligible</p>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200">
                                <button
                                        type="button"
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                        type="submit"
                                        disabled={isSubmitting || !formData.category || !formData.subject || !formData.message}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                                >
                                    {isSubmitting ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Sending...
                                            </div>
                                    ) : (
                                            'Send Message'
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Additional Resources */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h4 className="font-medium text-gray-900 mb-3">Other Ways to Get Help</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="font-medium text-gray-900 mb-1">📧 Email Support</div>
                                    <div className="text-gray-600">privacy@patriotthanks.com</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="font-medium text-gray-900 mb-1">🌐 Company Website</div>
                                    <div className="text-gray-600">www.docbear-ent.com</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="font-medium text-gray-900 mb-1">📍 Business Address</div>
                                    <div className="text-gray-600">5249 N Park Pl NE, PMB 4011<br/>Cedar Rapids, IA 52402</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="font-medium text-gray-900 mb-1">⏰ Business Hours</div>
                                    <div className="text-gray-600">Mon-Fri: 9 AM - 5 PM CST</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    );
}