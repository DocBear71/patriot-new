'use client';
// file: /src/app/my-donations/page.jsx v1 - User's donation history page

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navigation from '../../components/layout/Navigation';

export default function MyDonationsPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        totalAmount: 0,
        thisYear: 0,
        recurring: 0
    });

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email) {
            fetchUserDonations();
        } else if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, session, router]);

    const fetchUserDonations = async () => {
        try {
            setLoading(true);

            // NEW: Use the user-donations operation instead of querying directly
            const response = await fetch(`/api/donations?operation=user-donations&email=${encodeURIComponent(session.user.email)}`);

            if (response.ok) {
                const data = await response.json();

                // Check if the response has the expected structure
                if (data.success && data.donations) {
                    const userDonations = data.donations;

                    // Sort by date (newest first)
                    userDonations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                    setDonations(userDonations);
                    calculateStats(userDonations);
                    console.log('✅ Loaded', userDonations.length, 'donations for user');
                } else {
                    console.error('Unexpected response format:', data);
                    setDonations([]);
                    calculateStats([]);
                }
            } else {
                const errorData = await response.json();
                console.error('Failed to fetch donations:', response.status, errorData);
                setDonations([]);
                calculateStats([]);
            }
        } catch (error) {
            console.error('Error fetching donations:', error);
            setDonations([]);
            calculateStats([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (userDonations) => {
        const completed = userDonations.filter(d => d.status === 'completed');
        const totalAmount = completed.reduce((sum, d) => sum + (d.amount || 0), 0);

        const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1);
        const thisYearAmount = completed
        .filter(d => new Date(d.created_at) >= firstDayOfYear)
        .reduce((sum, d) => sum + (d.amount || 0), 0);

        const recurringCount = completed.filter(d => d.recurring).length;

        setStats({
            total: completed.length,
            totalAmount,
            thisYear: thisYearAmount,
            recurring: recurringCount
        });
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'completed':
                return { bg: '#d4edda', color: '#155724', border: '#c3e6cb' };
            case 'pending':
                return { bg: '#fff3cd', color: '#856404', border: '#ffeeba' };
            case 'failed':
                return { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' };
            default:
                return { bg: '#e2e3e5', color: '#383d41', border: '#d6d8db' };
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPaymentMethodDisplay = (method) => {
        const methods = {
            'paypal': '💳 PayPal',
            'stripe': '💳 Credit Card',
            'card': '💳 Credit Card'
        };
        return methods[method?.toLowerCase()] || method;
    };

    // Show loading state while checking authentication
    if (status === 'loading' || loading) {
        return (
                <div style={{ paddingTop: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div style={{
                        display: 'inline-block',
                        width: '50px',
                        height: '50px',
                        border: '5px solid #f3f3f3',
                        borderTop: '5px solid #007bff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                </div>
        );
    }

    // Redirect if not authenticated
    if (status === 'unauthenticated') {
        return null;
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
                        <div>
                            <h1 style={{ margin: 0, color: '#003366' }}>My Donations</h1>
                            <h4 style={{ margin: '5px 0 0 0', color: '#666' }}>
                                Your Support History
                            </h4>
                        </div>
                    </div>
                </header>

                <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Stats Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '25px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            borderLeft: '4px solid #007bff'
                        }}>
                            <h5 style={{ color: '#666', marginBottom: '10px', fontSize: '14px', textTransform: 'uppercase' }}>
                                Total Donations
                            </h5>
                            <h2 style={{ color: '#003366', margin: 0, fontSize: '32px' }}>{stats.total}</h2>
                        </div>

                        <div style={{
                            backgroundColor: 'white',
                            padding: '25px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            borderLeft: '4px solid #28a745'
                        }}>
                            <h5 style={{ color: '#666', marginBottom: '10px', fontSize: '14px', textTransform: 'uppercase' }}>
                                Total Amount
                            </h5>
                            <h2 style={{ color: '#003366', margin: 0, fontSize: '32px' }}>
                                ${stats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                        </div>

                        <div style={{
                            backgroundColor: 'white',
                            padding: '25px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            borderLeft: '4px solid #ffc107'
                        }}>
                            <h5 style={{ color: '#666', marginBottom: '10px', fontSize: '14px', textTransform: 'uppercase' }}>
                                This Year
                            </h5>
                            <h2 style={{ color: '#003366', margin: 0, fontSize: '32px' }}>
                                ${stats.thisYear.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                        </div>

                        <div style={{
                            backgroundColor: 'white',
                            padding: '25px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            borderLeft: '4px solid #dc3545'
                        }}>
                            <h5 style={{ color: '#666', marginBottom: '10px', fontSize: '14px', textTransform: 'uppercase' }}>
                                Recurring
                            </h5>
                            <h2 style={{ color: '#003366', margin: 0, fontSize: '32px' }}>
                                {stats.recurring}
                            </h2>
                        </div>
                    </div>

                    {/* Thank You Message */}
                    <div style={{
                        backgroundColor: '#e8f5e9',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '30px',
                        border: '2px solid #4caf50'
                    }}>
                        <h4 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>
                            Thank you for your support, {session.user.fname}!
                        </h4>
                        <p style={{ margin: 0, color: '#555', lineHeight: '1.6' }}>
                            Your generosity helps us maintain and grow Patriot Thanks, connecting veterans,
                            active-duty military, first responders, and their families with businesses that
                            honor their service.
                        </p>
                    </div>

                    {/* Donations List */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '20px',
                            borderBottom: '1px solid #e0e0e0',
                            backgroundColor: '#f8f9fa'
                        }}>
                            <h3 style={{ margin: 0, color: '#003366' }}>Donation History</h3>
                        </div>

                        {donations.length === 0 ? (
                                <div style={{
                                    padding: '60px 20px',
                                    textAlign: 'center',
                                    color: '#666'
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}>
                                        💝
                                    </div>
                                    <h4 style={{ marginBottom: '10px' }}>No Donations Yet</h4>
                                    <p style={{ marginBottom: '20px' }}>
                                        You haven't made any donations to Patriot Thanks yet.
                                    </p>
                                    <a
                                            href="/donate"
                                            style={{
                                                display: 'inline-block',
                                                padding: '12px 30px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                textDecoration: 'none',
                                                borderRadius: '6px',
                                                fontWeight: 'bold'
                                            }}
                                    >
                                        Make Your First Donation
                                    </a>
                                </div>
                        ) : (
                                <div style={{ padding: '20px' }}>
                                    {donations.map((donation, index) => {
                                        const statusColors = getStatusBadgeColor(donation.status);
                                        return (
                                                <div
                                                        key={donation._id || index}
                                                        style={{
                                                            padding: '20px',
                                                            border: '1px solid #e0e0e0',
                                                            borderRadius: '8px',
                                                            marginBottom: '15px',
                                                            backgroundColor: '#fafafa',
                                                            transition: 'box-shadow 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                                >
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'flex-start',
                                                        flexWrap: 'wrap',
                                                        gap: '15px'
                                                    }}>
                                                        <div style={{ flex: 1, minWidth: '250px' }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                marginBottom: '10px',
                                                                gap: '10px'
                                                            }}>
                                                                <h4 style={{
                                                                    margin: 0,
                                                                    color: '#003366',
                                                                    fontSize: '24px',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    ${donation.amount.toFixed(2)}
                                                                </h4>
                                                                <span style={{
                                                                    padding: '4px 12px',
                                                                    backgroundColor: statusColors.bg,
                                                                    color: statusColors.color,
                                                                    border: `1px solid ${statusColors.border}`,
                                                                    borderRadius: '4px',
                                                                    fontSize: '12px',
                                                                    fontWeight: 'bold',
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                        {donation.status}
                                                    </span>
                                                                {donation.recurring && (
                                                                        <span style={{
                                                                            padding: '4px 12px',
                                                                            backgroundColor: '#fff3cd',
                                                                            color: '#856404',
                                                                            border: '1px solid #ffeeba',
                                                                            borderRadius: '4px',
                                                                            fontSize: '12px',
                                                                            fontWeight: 'bold'
                                                                        }}>
                                                            RECURRING
                                                        </span>
                                                                )}
                                                            </div>

                                                            <p style={{
                                                                margin: '0 0 8px 0',
                                                                color: '#666',
                                                                fontSize: '14px'
                                                            }}>
                                                                {formatDate(donation.created_at)}
                                                            </p>

                                                            <p style={{
                                                                margin: '0 0 8px 0',
                                                                color: '#555',
                                                                fontSize: '14px'
                                                            }}>
                                                                <strong>Payment Method:</strong> {getPaymentMethodDisplay(donation.paymentMethod)}
                                                            </p>

                                                            {donation.paymentIntentId && (
                                                                    <p style={{
                                                                        margin: '0 0 8px 0',
                                                                        color: '#999',
                                                                        fontSize: '12px',
                                                                        fontFamily: 'monospace'
                                                                    }}>
                                                                        ID: {donation.paymentIntentId}
                                                                    </p>
                                                            )}

                                                            {donation.message && (
                                                                    <div style={{
                                                                        marginTop: '15px',
                                                                        padding: '12px',
                                                                        backgroundColor: 'white',
                                                                        borderRadius: '6px',
                                                                        borderLeft: '3px solid #007bff'
                                                                    }}>
                                                                        <strong style={{ fontSize: '12px', color: '#666' }}>
                                                                            Your Message:
                                                                        </strong>
                                                                        <p style={{
                                                                            margin: '5px 0 0 0',
                                                                            fontStyle: 'italic',
                                                                            color: '#555'
                                                                        }}>
                                                                            "{donation.message}"
                                                                        </p>
                                                                    </div>
                                                            )}
                                                        </div>

                                                        <div style={{ textAlign: 'right' }}>
                                                            {donation.anonymous && (
                                                                    <div style={{
                                                                        padding: '8px 12px',
                                                                        backgroundColor: '#e3f2fd',
                                                                        borderRadius: '6px',
                                                                        marginBottom: '8px'
                                                                    }}>
                                                        <span style={{ fontSize: '12px', color: '#1976d2' }}>
                                                            🔒 Anonymous
                                                        </span>
                                                                    </div>
                                                            )}
                                                            {donation.showOnRecognitionPage && !donation.anonymous && (
                                                                    <div style={{
                                                                        padding: '8px 12px',
                                                                        backgroundColor: '#e8f5e9',
                                                                        borderRadius: '6px',
                                                                        marginBottom: '8px'
                                                                    }}>
                                                        <span style={{ fontSize: '12px', color: '#2e7d32' }}>
                                                            ⭐ On Recognition Page
                                                        </span>
                                                                    </div>
                                                            )}
                                                            {donation.showAmount && (
                                                                    <div style={{
                                                                        padding: '8px 12px',
                                                                        backgroundColor: '#fff3e0',
                                                                        borderRadius: '6px'
                                                                    }}>
                                                        <span style={{ fontSize: '12px', color: '#e65100' }}>
                                                            💰 Amount Shown
                                                        </span>
                                                                    </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                        );
                                    })}
                                </div>
                        )}
                    </div>

                    {/* Call to Action */}
                    {donations.length > 0 && (
                            <div style={{
                                marginTop: '40px',
                                textAlign: 'center',
                                padding: '30px',
                                backgroundColor: '#003366',
                                borderRadius: '8px',
                                color: 'white'
                            }}>
                                <h3 style={{ marginBottom: '15px' }}>Want to Support Us Again?</h3>
                                <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
                                    Every donation makes a difference!
                                </p>
                                <a
                                        href="/donate"
                                        style={{
                                            display: 'inline-block',
                                            padding: '12px 30px',
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            textDecoration: 'none',
                                            borderRadius: '6px',
                                            fontWeight: 'bold',
                                            fontSize: '16px'
                                        }}
                                >
                                    Make Another Donation
                                </a>
                            </div>
                    )}
                </main>

                <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            </div>
    );
}