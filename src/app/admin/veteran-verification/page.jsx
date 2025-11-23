'use client';

// file: src/app/admin/veteran-verification/page.jsx v1 - Admin verification review dashboard

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../../components/layout/AdminLayout';

export default function VeteranVerificationAdmin() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [pendingVerifications, setPendingVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (session && !session.user?.isAdmin) {
            router.push('/');
        } else if (session) {
            fetchPendingVerifications();
        }
    }, [session, status, router]);

    const fetchPendingVerifications = async () => {
        try {
            const response = await fetch('/api/admin/veteran-verification/pending');
            const data = await response.json();
            setPendingVerifications(data.users || []);
        } catch (error) {
            console.error('Error fetching verifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (userId, action) => {
        if (!confirm(`Are you sure you want to ${action} this verification?`)) {
            return;
        }

        setProcessing(true);

        try {
            const response = await fetch('/api/admin/veteran-verification/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    action, // 'approve' or 'deny'
                    notes: reviewNotes
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Verification ${action}d successfully!`);
                setSelectedUser(null);
                setReviewNotes('');
                fetchPendingVerifications();
            } else {
                alert(data.error || 'Action failed');
            }
        } catch (error) {
            alert('Error processing review');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
                <AdminLayout>
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                </AdminLayout>
        );
    }

    return (
            <AdminLayout>
                <div className="max-w-7xl mx-auto p-6">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            🇺🇸 Veteran Verification Review
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Review and approve veteran business owner verification requests
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="text-yellow-800 font-semibold">Pending Review</div>
                            <div className="text-3xl font-bold text-yellow-900 mt-2">
                                {pendingVerifications.length}
                            </div>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="text-green-800 font-semibold">Verified This Month</div>
                            <div className="text-3xl font-bold text-green-900 mt-2">
                                {/* Add stat from API */}
                                0
                            </div>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="text-red-800 font-semibold">Denied This Month</div>
                            <div className="text-3xl font-bold text-red-900 mt-2">
                                {/* Add stat from API */}
                                0
                            </div>
                        </div>
                    </div>

                    {/* Pending Verifications List */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        {pendingVerifications.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="text-gray-400 text-5xl mb-4">✓</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        All caught up!
                                    </h3>
                                    <p className="text-gray-600">
                                        No pending verification requests at this time.
                                    </p>
                                </div>
                        ) : (
                                <div className="divide-y divide-gray-200">
                                    {pendingVerifications.map((user) => (
                                            <div key={user._id} className="p-6 hover:bg-gray-50">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {user.fname} {user.lname}
                                                        </h3>
                                                        <p className="text-gray-600 text-sm mt-1">
                                                            {user.email}
                                                        </p>
                                                        <div className="mt-3 flex items-center gap-4 text-sm">
                                                <span className="text-gray-600">
                                                    Service Type: <span className="font-medium">{user.serviceType}</span>
                                                </span>
                                                            <span className="text-gray-600">
                                                    Branch: <span className="font-medium">{user.militaryBranch}</span>
                                                </span>
                                                            <span className="text-gray-600">
                                                    Submitted: <span className="font-medium">
                                                        {new Date(user.veteranBusinessOwner?.verificationDocuments[0]?.uploadedAt).toLocaleDateString()}
                                                    </span>
                                                </span>
                                                        </div>

                                                        {/* Documents */}
                                                        <div className="mt-4">
                                                            <h4 className="font-medium text-gray-900 mb-2">Uploaded Documents:</h4>
                                                            <div className="flex gap-3">
                                                                {user.veteranBusinessOwner?.verificationDocuments?.map((doc, index) => (
                                                                    <a key={index}
                                                                    href={doc.documentUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                                                                    >
                                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                                    </svg>
                                                                {doc.documentType.replace('_', ' ').toUpperCase()}
                                                                    </a>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="ml-6 flex-shrink-0">
                                                        {selectedUser === user._id ? (
                                                                <div className="space-y-3">
                                                    <textarea
                                                            placeholder="Review notes (optional)..."
                                                            value={reviewNotes}
                                                            onChange={(e) => setReviewNotes(e.target.value)}
                                                            className="w-64 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                                            rows="3"
                                                    />
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                                onClick={() => handleReview(user._id, 'approve')}
                                                                                disabled={processing}
                                                                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
                                                                        >
                                                                            ✓ Approve
                                                                        </button>
                                                                        <button
                                                                                onClick={() => handleReview(user._id, 'deny')}
                                                                                disabled={processing}
                                                                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm disabled:opacity-50"
                                                                        >
                                                                            ✗ Deny
                                                                        </button>
                                                                    </div>
                                                                    <button
                                                                            onClick={() => {
                                                                                setSelectedUser(null);
                                                                                setReviewNotes('');
                                                                            }}
                                                                            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                        ) : (
                                                                <button
                                                                        onClick={() => setSelectedUser(user._id)}
                                                                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                                >
                                                                    Review
                                                                </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                    ))}
                                </div>
                            )}
                    </div>
                </div>
            </AdminLayout>
    );
}