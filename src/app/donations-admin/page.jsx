'use client';
// file: /src/app/donations-admin/page.jsx v1 - Donations Admin Management for Patriot Thanks

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navigation from '../../components/layout/Navigation';

export default function DonationsAdminPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [donations, setDonations] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalDonations, setTotalDonations] = useState(0);
    const [itemsPerPage] = useState(10);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        dateRange: ''
    });
    const [stats, setStats] = useState({
        totalDonations: 0,
        totalAmount: 0,
        thisMonthAmount: 0,
        thisMonthDonations: 0,
        recurringDonations: 0
    });
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        checkAdminAccess();
    }, []);

    useEffect(() => {
        if (isAdmin) {
            loadDonations();
            loadStats();
        }
    }, [isAdmin, currentPage, filters]);

    const checkAdminAccess = async () => {
        try {
            // Handle loading state
            if (status === 'loading') {
                return <div>Loading...</div>;
            }

            // Handle unauthenticated
            if (status === 'unauthenticated' || !session) {
                router.push('/auth/signin');
                return null;
            }

            // Handle non-admin users
            if (!session.user.isAdmin && session.user.level !== 'Admin') {
                alert('Admin access required');
                router.push('/');
                return null;
            }

            setIsAdmin(true);
        } catch (error) {
            console.error('Error checking admin access:', error);
            router.push('../../auth/signin');
        } finally {
            setIsLoading(false);
        }
    };

    const loadDonations = async () => {
        try {
            if (status === 'loading') return;
            if (!session || (!session.user.isAdmin && session.user.level !== 'Admin')) {
                router.push('/auth/signin');
                return;
            }

            const params = new URLSearchParams({
                operation: 'list',
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                ...filters
            });

            const response = await fetch(`/api/donations?${params}`, {
                credentials: 'include'
            });


            if (response.ok) {
                const data = await response.json();
                setDonations(data.donations || []);
                setTotalPages(data.totalPages || 0);
                setTotalDonations(data.total || 0);
            } else {
                throw new Error('Failed to load donations');
            }
        } catch (error) {
            console.error('Error loading donations:', error);
            // Show mock data for demo
            const mockDonations = [
                {
                    _id: 'mock1',
                    amount: 25.00,
                    name: 'John Smith',
                    email: 'john.smith@email.com',
                    paymentMethod: 'paypal',
                    status: 'completed',
                    recurring: false,
                    anonymous: false,
                    message: 'Thank you for your service!',
                    created_at: new Date('2025-01-15'),
                    transactionId: 'TXN-12345'
                },
                {
                    _id: 'mock2',
                    amount: 50.00,
                    name: 'Anonymous',
                    email: 'donor@email.com',
                    paymentMethod: 'card',
                    status: 'completed',
                    recurring: true,
                    anonymous: true,
                    message: '',
                    created_at: new Date('2025-01-10'),
                    transactionId: 'TXN-12346'
                },
                {
                    _id: 'mock3',
                    amount: 100.00,
                    name: 'Sarah Johnson',
                    email: 'sarah.j@email.com',
                    paymentMethod: 'paypal',
                    status: 'pending',
                    recurring: false,
                    anonymous: false,
                    message: 'Keep up the great work!',
                    created_at: new Date('2025-01-08'),
                    transactionId: null
                }
            ];
            setDonations(mockDonations);
            setTotalDonations(mockDonations.length);
        }
    };

    const loadStats = async () => {
        try {
            if (status === 'loading') return;
            if (!session || (!session.user.isAdmin && session.user.level !== 'Admin')) {
                router.push('/auth/signin');
                return;
            }

            const response = await fetch('/api/donations?operation=stats', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            } else {
                throw new Error('Failed to load stats');
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            // Show mock stats for demo
            setStats({
                totalDonations: 127,
                totalAmount: 3250.00,
                thisMonthAmount: 425.00,
                thisMonthDonations: 18,
                recurringDonations: 12
            });
        }
    };

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
        setCurrentPage(1); // Reset to first page when filtering
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            status: '',
            dateRange: ''
        });
        setCurrentPage(1);
    };

    const openDetailsModal = (donation) => {
        setSelectedDonation(donation);
        setShowDetailsModal(true);
    };

    const sendReceiptEmail = async (donationId) => {
        try {
            if (status === 'loading') return;
            if (!session || (!session.user.isAdmin && session.user.level !== 'Admin')) {
                router.push('/auth/signin');
                return;
            }

            const response = await fetch('/api/donations?operation=send-receipt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ donationId })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Receipt email sent successfully!' });
            } else {
                throw new Error('Failed to send receipt');
            }
        } catch (error) {
            console.error('Error sending receipt:', error);
            setMessage({ type: 'error', text: 'Failed to send receipt email' });
        }
    };

    const cancelRecurringDonation = async (donationId) => {
        if (!confirm('Are you sure you want to cancel this recurring donation? This action cannot be undone.')) {
            return;
        }

        try {
            if (status === 'loading') return;
            if (!session || (!session.user.isAdmin && session.user.level !== 'Admin')) {
                router.push('/auth/signin');
                return;
            }

            const response = await fetch('/api/donations?operation=cancel-recurring', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ donationId })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Recurring donation cancelled successfully!' });
                loadDonations();
            } else {
                throw new Error('Failed to cancel recurring donation');
            }
        } catch (error) {
            console.error('Error canceling recurring donation:', error);
            setMessage({ type: 'error', text: 'Failed to cancel recurring donation' });
        }
    };

    const exportDonations = async () => {
        setIsExporting(true);
        try {
            if (status === 'loading') return;
            if (!session || (!session.user.isAdmin && session.user.level !== 'Admin')) {
                router.push('/auth/signin');
                return;
            }

            const params = new URLSearchParams({
                operation: 'export',
                format: 'csv',
                ...filters
            });

            const response = await fetch(`/api/donations?${params}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `donations-export-${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                setMessage({ type: 'success', text: 'Donations exported successfully!' });
            } else {
                throw new Error('Failed to export donations');
            }
        } catch (error) {
            console.error('Error exporting donations:', error);
            setMessage({ type: 'error', text: 'Failed to export donations' });
        } finally {
            setIsExporting(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadgeColor = (status) => {
        const colors = {
            'completed': '#28a745',
            'pending': '#ffc107',
            'failed': '#dc3545'
        };
        return colors[status] || '#6c757d';
    };

    const getPaymentMethodIcon = (method) => {
        switch (method) {
            case 'paypal':
                return '🅿️ PayPal';
            case 'card':
                return '💳 Card';
            default:
                return method;
        }
    };

    if (isLoading) {
        return (
                <div style={{ paddingTop: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div>Loading donations admin...</div>
                </div>
        );
    }

    if (!isAdmin) {
        return (
                <div style={{ paddingTop: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div>Access denied. Admin privileges required.</div>
                </div>
        );
    }

    return (
            <div style={{ paddingTop: '70px' }} id="page_layout">
                <Navigation />

                <header style={{ padding: '20px', borderBottom: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ marginRight: '20px' }}>
                            <img
                                    src="/images/patriotthankslogo6-13-2025.png"
                                    alt="Patriot Thanks logo"
                                    style={{ height: '60px' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h1 style={{ margin: 0, color: '#003366' }}>Patriot Thanks</h1>
                            <h4 style={{ margin: '5px 0 0 0', color: '#666' }}>Donation Management</h4>
                        </div>
                        <div>
                            <button
                                    onClick={() => router.push('/admin/dashboard')}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                </header>

                <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                    {message.text && (
                            <div style={{
                                padding: '15px',
                                marginBottom: '20px',
                                borderRadius: '4px',
                                backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                                border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                                color: message.type === 'success' ? '#155724' : '#721c24'
                            }}>
                                {message.text}
                            </div>
                    )}

                    {/* Stats Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                            color: 'white',
                            padding: '25px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            <h5 style={{ margin: '0 0 10px 0', opacity: 0.9 }}>Total Donations</h5>
                            <h2 style={{ margin: '10px 0', fontWeight: 'bold' }}>{stats.totalDonations}</h2>
                            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>All time</p>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)',
                            color: 'white',
                            padding: '25px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            <h5 style={{ margin: '0 0 10px 0', opacity: 0.9 }}>Total Amount</h5>
                            <h2 style={{ margin: '10px 0', fontWeight: 'bold' }}>{formatCurrency(stats.totalAmount)}</h2>
                            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>All donations</p>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
                            color: 'white',
                            padding: '25px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            <h5 style={{ margin: '0 0 10px 0', opacity: 0.9 }}>This Month</h5>
                            <h2 style={{ margin: '10px 0', fontWeight: 'bold' }}>{formatCurrency(stats.thisMonthAmount)}</h2>
                            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>{stats.thisMonthDonations} donations</p>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
                            color: '#212529',
                            padding: '25px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            <h5 style={{ margin: '0 0 10px 0', opacity: 0.8 }}>Recurring</h5>
                            <h2 style={{ margin: '10px 0', fontWeight: 'bold' }}>{stats.recurringDonations}</h2>
                            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>Active subscriptions</p>
                        </div>
                    </div>

                    {/* Filters and Controls */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        marginBottom: '20px'
                    }}>
                        <h5 style={{ marginBottom: '20px' }}>Donation List</h5>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '15px',
                            alignItems: 'end'
                        }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Search
                                </label>
                                <input
                                        type="text"
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        placeholder="Search by name or email..."
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Status
                                </label>
                                <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="completed">Completed</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Date Range
                                </label>
                                <select
                                        value={filters.dateRange}
                                        onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                >
                                    <option value="">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="year">This Year</option>
                                </select>
                            </div>

                            <div>
                                <button
                                        onClick={resetFilters}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            marginRight: '10px'
                                        }}
                                >
                                    Reset
                                </button>
                                <button
                                        onClick={exportDonations}
                                        disabled={isExporting}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: isExporting ? '#6c757d' : '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: isExporting ? 'not-allowed' : 'pointer'
                                        }}
                                >
                                    {isExporting ? 'Exporting...' : '📥 Export'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Donations Table */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f8f9fa' }}>
                                <tr>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Date</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Name</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Email</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Amount</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Payment</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Status</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Recurring</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {donations.length > 0 ? (
                                        donations.map((donation, index) => (
                                                <tr key={donation._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                    <td style={{ padding: '15px' }}>
                                                        {formatDate(donation.created_at)}
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        {donation.anonymous ? 'Anonymous' : donation.name}
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        {donation.email}
                                                    </td>
                                                    <td style={{ padding: '15px', fontWeight: 'bold' }}>
                                                        {formatCurrency(donation.amount)}
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        {getPaymentMethodIcon(donation.paymentMethod)}
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                backgroundColor: getStatusBadgeColor(donation.status),
                                                color: 'white'
                                            }}>
                                                {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                                            </span>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        {donation.recurring ? (
                                                                <span style={{
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.8rem',
                                                                    backgroundColor: '#17a2b8',
                                                                    color: 'white'
                                                                }}>
                                                    🔄 Monthly
                                                </span>
                                                        ) : (
                                                                <span style={{
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.8rem',
                                                                    backgroundColor: '#f8f9fa',
                                                                    color: '#333'
                                                                }}>
                                                    One-time
                                                </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                            <button
                                                                    onClick={() => openDetailsModal(donation)}
                                                                    title="View Details"
                                                                    style={{
                                                                        padding: '4px 8px',
                                                                        backgroundColor: '#007bff',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.8rem'
                                                                    }}
                                                            >
                                                                👁️
                                                            </button>
                                                            {donation.status === 'completed' && (
                                                                    <button
                                                                            onClick={() => sendReceiptEmail(donation._id)}
                                                                            title="Send Receipt"
                                                                            style={{
                                                                                padding: '4px 8px',
                                                                                backgroundColor: '#28a745',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                borderRadius: '4px',
                                                                                cursor: 'pointer',
                                                                                fontSize: '0.8rem'
                                                                            }}
                                                                    >
                                                                        📧
                                                                    </button>
                                                            )}
                                                            {donation.recurring && (
                                                                    <button
                                                                            onClick={() => cancelRecurringDonation(donation._id)}
                                                                            title="Cancel Recurring"
                                                                            style={{
                                                                                padding: '4px 8px',
                                                                                backgroundColor: '#dc3545',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                borderRadius: '4px',
                                                                                cursor: 'pointer',
                                                                                fontSize: '0.8rem'
                                                                            }}
                                                                    >
                                                                        ❌
                                                                    </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                        ))
                                ) : (
                                        <tr>
                                            <td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
                                                No donations found
                                            </td>
                                        </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '20px'
                            }}>
                                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalDonations)} of {totalDonations} entries
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            style={{
                                                padding: '8px 12px',
                                                backgroundColor: currentPage === 1 ? '#f8f9fa' : '#007bff',
                                                color: currentPage === 1 ? '#6c757d' : 'white',
                                                border: '1px solid #dee2e6',
                                                borderRadius: '4px',
                                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                            }}
                                    >
                                        ← Previous
                                    </button>

                                    <span style={{ margin: '0 10px', fontSize: '0.9rem' }}>
                            Page {currentPage} of {totalPages}
                        </span>

                                    <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            style={{
                                                padding: '8px 12px',
                                                backgroundColor: currentPage === totalPages ? '#f8f9fa' : '#007bff',
                                                color: currentPage === totalPages ? '#6c757d' : 'white',
                                                border: '1px solid #dee2e6',
                                                borderRadius: '4px',
                                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                                            }}
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                    )}
                </main>

                {/* Donation Details Modal */}
                {showDetailsModal && selectedDonation && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000
                        }}>
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                width: '90%',
                                maxWidth: '600px',
                                maxHeight: '90vh',
                                overflow: 'auto'
                            }}>
                                <div style={{
                                    padding: '20px',
                                    borderBottom: '1px solid #dee2e6',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <h3 style={{ margin: 0 }}>Donation Details</h3>
                                    <button
                                            onClick={() => setShowDetailsModal(false)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                fontSize: '24px',
                                                cursor: 'pointer',
                                                color: '#6c757d'
                                            }}
                                    >
                                        ×
                                    </button>
                                </div>

                                <div style={{ padding: '20px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <div>
                                            <p style={{ margin: '0 0 8px 0' }}>
                                                <strong>Donation ID:</strong><br />
                                                <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '3px' }}>
                                                    {selectedDonation._id}
                                                </code>
                                            </p>
                                            <p style={{ margin: '0 0 8px 0' }}>
                                                <strong>Date:</strong><br />
                                                {formatDate(selectedDonation.created_at)}
                                            </p>
                                            <p style={{ margin: '0 0 8px 0' }}>
                                                <strong>Amount:</strong><br />
                                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>
                                        {formatCurrency(selectedDonation.amount)}
                                    </span>
                                            </p>
                                            <p style={{ margin: '0 0 8px 0' }}>
                                                <strong>Status:</strong><br />
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.9rem',
                                                    backgroundColor: getStatusBadgeColor(selectedDonation.status),
                                                    color: 'white'
                                                }}>
                                        {selectedDonation.status.charAt(0).toUpperCase() + selectedDonation.status.slice(1)}
                                    </span>
                                            </p>
                                        </div>
                                        <div>
                                            <p style={{ margin: '0 0 8px 0' }}>
                                                <strong>Name:</strong><br />
                                                {selectedDonation.anonymous ? 'Anonymous' : selectedDonation.name}
                                            </p>
                                            <p style={{ margin: '0 0 8px 0' }}>
                                                <strong>Email:</strong><br />
                                                {selectedDonation.email}
                                            </p>
                                            <p style={{ margin: '0 0 8px 0' }}>
                                                <strong>Recurring:</strong><br />
                                                {selectedDonation.recurring ? (
                                                        <span style={{ color: '#17a2b8', fontWeight: 'bold' }}>
                                            🔄 Monthly Subscription
                                        </span>
                                                ) : (
                                                        'One-time donation'
                                                )}
                                            </p>
                                            <p style={{ margin: '0 0 8px 0' }}>
                                                <strong>Payment Method:</strong><br />
                                                {getPaymentMethodIcon(selectedDonation.paymentMethod)}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedDonation.transactionId && (
                                            <div style={{ marginBottom: '20px' }}>
                                                <p style={{ margin: '0 0 8px 0' }}>
                                                    <strong>Transaction ID:</strong><br />
                                                    <code style={{ backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '3px' }}>
                                                        {selectedDonation.transactionId}
                                                    </code>
                                                </p>
                                            </div>
                                    )}

                                    {selectedDonation.message && (
                                            <div style={{
                                                marginBottom: '20px',
                                                padding: '15px',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: '6px',
                                                borderLeft: '4px solid #007bff'
                                            }}>
                                                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Donor Message:</p>
                                                <p style={{ margin: 0, fontStyle: 'italic' }}>"{selectedDonation.message}"</p>
                                            </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                        {selectedDonation.status === 'completed' && (
                                                <button
                                                        onClick={() => {
                                                            sendReceiptEmail(selectedDonation._id);
                                                            setShowDetailsModal(false);
                                                        }}
                                                        style={{
                                                            padding: '10px 20px',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                >
                                                    📧 Send Receipt
                                                </button>
                                        )}
                                        {selectedDonation.recurring && (
                                                <button
                                                        onClick={() => {
                                                            cancelRecurringDonation(selectedDonation._id);
                                                            setShowDetailsModal(false);
                                                        }}
                                                        style={{
                                                            padding: '10px 20px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                >
                                                    ❌ Cancel Recurring
                                                </button>
                                        )}
                                        <button
                                                onClick={() => setShowDetailsModal(false)}
                                                style={{
                                                    padding: '10px 20px',
                                                    backgroundColor: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                )}
            </div>
    );
}