'use client';

// file: src/components/veteran/VerificationDashboard.jsx v1 - Veteran verification management dashboard

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function VerificationDashboard() {
    const { data: session } = useSession();
    const [userData, setUserData] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState('');

    useEffect(() => {
        if (session?.user) {
            fetchUserData();
        }
    }, [session]);

    const fetchUserData = async () => {
        try {
            const response = await fetch('/api/user/profile');
            const data = await response.json();
            setUserData(data.user);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const handleFileUpload = async (e, documentType) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadError('');
        setUploadSuccess('');

        const formData = new FormData();
        formData.append('document', file);
        formData.append('documentType', documentType);

        try {
            const response = await fetch('/api/veteran-verification/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                setUploadSuccess(`${documentType} uploaded successfully!`);
                await fetchUserData(); // Refresh user data
                setTimeout(() => setUploadSuccess(''), 3000);
            } else {
                setUploadError(data.error || 'Upload failed');
            }
        } catch (error) {
            setUploadError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            not_applicable: { color: 'gray', text: 'Not Started' },
            pending: { color: 'yellow', text: 'Pending Review' },
            verified: { color: 'green', text: 'Verified' },
            denied: { color: 'red', text: 'Denied' }
        };

        const badge = badges[status] || badges.not_applicable;

        return (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${badge.color}-100 text-${badge.color}-800`}>
                {badge.text}
            </span>
        );
    };

    const verificationStatus = userData?.veteranBusinessOwner?.verificationStatus || 'not_applicable';
    const documents = userData?.veteranBusinessOwner?.verificationDocuments || [];

    return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    {/* Header */}
                    <div className="border-b pb-4 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="text-3xl">🇺🇸</span>
                            Veteran Business Owner Verification
                        </h2>
                        <p className="text-gray-600 mt-2">
                            Upload documentation to verify your veteran status and unlock premium features
                        </p>
                    </div>

                    {/* Current Status */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-blue-900">Current Verification Status</h3>
                                <p className="text-sm text-blue-700 mt-1">
                                    {verificationStatus === 'verified'
                                            ? 'Your veteran status has been verified!'
                                            : verificationStatus === 'pending'
                                                    ? 'Your documents are under review. This typically takes 2-3 business days.'
                                                    : 'Upload documents below to begin verification.'}
                                </p>
                            </div>
                            <div>
                                {getStatusBadge(verificationStatus)}
                            </div>
                        </div>
                    </div>

                    {/* Upload Errors/Success */}
                    {uploadError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                                {uploadError}
                            </div>
                    )}

                    {uploadSuccess && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                                {uploadSuccess}
                            </div>
                    )}

                    {/* Document Upload Section */}
                    {verificationStatus !== 'verified' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">Upload Verification Documents</h3>

                                {/* DD-214 Upload */}
                                <div className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">DD-214 (Discharge Papers)</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Member 4 copy showing honorable discharge
                                            </p>
                                        </div>
                                        <div>
                                            <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                {uploading ? 'Uploading...' : 'Upload'}
                                                <input
                                                        type="file"
                                                        className="hidden"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) => handleFileUpload(e, 'dd214')}
                                                        disabled={uploading}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    {documents.find(d => d.documentType === 'dd214') && (
                                            <div className="mt-3 flex items-center text-green-600 text-sm">
                                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Uploaded successfully
                                            </div>
                                    )}
                                </div>

                                {/* VA Card Upload */}
                                <div className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">VA ID Card</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Department of Veterans Affairs ID card
                                            </p>
                                        </div>
                                        <div>
                                            <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                {uploading ? 'Uploading...' : 'Upload'}
                                                <input
                                                        type="file"
                                                        className="hidden"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) => handleFileUpload(e, 'va_card')}
                                                        disabled={uploading}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    {documents.find(d => d.documentType === 'va_card') && (
                                            <div className="mt-3 flex items-center text-green-600 text-sm">
                                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Uploaded successfully
                                            </div>
                                    )}
                                </div>

                                {/* Business License (Optional) */}
                                <div className="border rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">Business License (Optional)</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Helps us verify business ownership faster
                                            </p>
                                        </div>
                                        <div>
                                            <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                Upload
                                                <input
                                                        type="file"
                                                        className="hidden"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) => handleFileUpload(e, 'business_license')}
                                                        disabled={uploading}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    {documents.find(d => d.documentType === 'business_license') && (
                                            <div className="mt-3 flex items-center text-green-600 text-sm">
                                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Uploaded successfully
                                            </div>
                                    )}
                                </div>
                            </div>
                    )}

                    {/* Benefits Preview */}
                    <div className="mt-8 bg-gradient-to-r from-red-50 to-blue-50 border border-red-200 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">🎖️ Veteran Business Owner Benefits</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                                    1
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">Priority Placement</h4>
                                    <p className="text-sm text-gray-600">Appear higher in search results</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                                    2
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">Verified Badge</h4>
                                    <p className="text-sm text-gray-600">Display trust badge on listings</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                                    3
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">Featured Listings</h4>
                                    <p className="text-sm text-gray-600">Get featured on homepage</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                                    4
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">Special Directory</h4>
                                    <p className="text-sm text-gray-600">Listed in veteran business directory</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* File Requirements */}
                    <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">📋 Document Requirements</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Accepted formats: PDF, JPG, PNG</li>
                            <li>• Maximum file size: 5MB per document</li>
                            <li>• Documents must be clear and legible</li>
                            <li>• Review typically takes 2-3 business days</li>
                            <li>• Personal information (SSN) should be redacted</li>
                        </ul>
                    </div>
                </div>
            </div>
    );
}