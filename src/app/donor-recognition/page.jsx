'use client';
// file: /src/app/donor-recognition/page.jsx v1 - Donor recognition page displaying recent donors

import { useState, useEffect } from 'react';
import Navigation from '../../components/layout/Navigation';

export default function DonorRecognitionPage() {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, month, year
    const [stats, setStats] = useState({
        totalDonors: 0,
        totalAmount: 0,
        thisMonth: 0,
        thisYear: 0
    });

    useEffect(() => {
        fetchDonors();
    }, [filter]);

    const fetchDonors = async () => {
        try {
            setLoading(true);

            // Build query params based on filter
            let queryParams = '?status=completed&showOnRecognitionPage=true';

            if (filter === 'month') {
                const firstDayOfMonth = new Date();
                firstDayOfMonth.setDate(1);
                firstDayOfMonth.setHours(0, 0, 0, 0);
                queryParams += `&startDate=${firstDayOfMonth.toISOString()}`;
            } else if (filter === 'year') {
                const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1);
                queryParams += `&startDate=${firstDayOfYear.toISOString()}`;
            }

            const response = await fetch(`/api/donations${queryParams}`);

            if (response.ok) {
                const data = await response.json();

                // Filter out anonymous donations that shouldn't be shown
                const visibleDonors = (data.donations || []).filter(d =>
                        d.showOnRecognitionPage && !d.anonymous
                );

                setDonors(visibleDonors);

                // Calculate stats
                calculateStats(data.donations || []);
            } else {
                console.error('Failed to fetch donors');
            }
        } catch (error) {
            console.error('Error fetching donors:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (allDonations) => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

        const completed = allDonations.filter(d => d.status === 'completed');

        const totalAmount = completed.reduce((sum, d) => sum + (d.amount || 0), 0);
        const thisMonthAmount = completed
        .filter(d => new Date(d.created_at) >= firstDayOfMonth)
        .reduce((sum, d) => sum + (d.amount || 0), 0);
        const thisYearAmount = completed
        .filter(d => new Date(d.created_at) >= firstDayOfYear)
        .reduce((sum, d) => sum + (d.amount || 0), 0);

        setStats({
            totalDonors: completed.length,
            totalAmount,
            thisMonth: thisMonthAmount,
            thisYear: thisYearAmount
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
            <div style={{ paddingTop: '70px' }} id="page_layout">
                <Navigation />

                <header style={{ padding: '20px', borderBottom: '1px solid #ddd', backgroundColor: '#f8f9fa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ marginRight: '20px' }}>
                            <img
                                    src="/images/patriotthankslogo6-13-2025.png"
                                    alt="Patriot Thanks logo"
                                    style={{ height: '60px' }}
                            />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, color: '#003366' }}>Donor Recognition</h1>
                            <h4 style={{ margin: '5px 0 0 0', color: '#666' }}>
                                Honoring Those Who Support Our Mission
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
                        marginBottom: '40px'
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            borderLeft: '4px solid #007bff'
                        }}>
                            <h5 style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>
                                TOTAL DONORS
                            </h5>
                            <h2 style={{ color: '#003366', margin: 0 }}>{stats.totalDonors}</h2>
                        </div>

                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            borderLeft: '4px solid #28a745'
                        }}>
                            <h5 style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>
                                TOTAL RAISED
                            </h5>
                            <h2 style={{ color: '#003366', margin: 0 }}>
                                ${stats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                        </div>

                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            borderLeft: '4px solid #ffc107'
                        }}>
                            <h5 style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>
                                THIS MONTH
                            </h5>
                            <h2 style={{ color: '#003366', margin: 0 }}>
                                ${stats.thisMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                        </div>

                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            borderLeft: '4px solid #dc3545'
                        }}>
                            <h5 style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>
                                THIS YEAR
                            </h5>
                            <h2 style={{ color: '#003366', margin: 0 }}>
                                ${stats.thisYear.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                        </div>
                    </div>

                    {/* Thank You Message */}
                    <div style={{
                        backgroundColor: '#e3f2fd',
                        padding: '30px',
                        borderRadius: '8px',
                        marginBottom: '30px',
                        textAlign: 'center',
                        border: '2px solid #2196f3'
                    }}>
                        <h3 style={{ color: '#003366', marginBottom: '15px' }}>
                            Thank You to Our Generous Donors
                        </h3>
                        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#555', maxWidth: '800px', margin: '0 auto' }}>
                            Your support helps us connect veterans, active-duty military, first responders, and their
                            families with businesses that honor their service. Every donation makes a difference in
                            building and maintaining this valuable community resource.
                        </p>
                    </div>

                    {/* Filter Controls */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        marginBottom: '20px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                            <h3 style={{ margin: 0, color: '#003366' }}>Our Donors</h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                        onClick={() => setFilter('all')}
                                        style={{
                                            padding: '8px 20px',
                                            backgroundColor: filter === 'all' ? '#007bff' : 'white',
                                            color: filter === 'all' ? 'white' : '#007bff',
                                            border: '2px solid #007bff',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                >
                                    All Time
                                </button>
                                <button
                                        onClick={() => setFilter('year')}
                                        style={{
                                            padding: '8px 20px',
                                            backgroundColor: filter === 'year' ? '#007bff' : 'white',
                                            color: filter === 'year' ? 'white' : '#007bff',
                                            border: '2px solid #007bff',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                >
                                    This Year
                                </button>
                                <button
                                        onClick={() => setFilter('month')}
                                        style={{
                                            padding: '8px 20px',
                                            backgroundColor: filter === 'month' ? '#007bff' : 'white',
                                            color: filter === 'month' ? 'white' : '#007bff',
                                            border: '2px solid #007bff',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                >
                                    This Month
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Donors List */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {loading ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div style={{
                                        display: 'inline-block',
                                        width: '40px',
                                        height: '40px',
                                        border: '4px solid #f3f3f3',
                                        borderTop: '4px solid #007bff',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
                                    <p style={{ marginTop: '15px', color: '#666' }}>Loading donors...</p>
                                </div>
                        ) : donors.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                    <p>No donors to display for the selected time period.</p>
                                </div>
                        ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: '20px'
                                }}>
                                    {donors.map((donor, index) => (
                                            <div
                                                    key={donor._id || index}
                                                    style={{
                                                        padding: '20px',
                                                        border: '1px solid #e0e0e0',
                                                        borderRadius: '8px',
                                                        backgroundColor: '#f8f9fa',
                                                        transition: 'transform 0.2s, box-shadow 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '10px' }}>
                                                    <div style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#007bff',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '20px',
                                                        fontWeight: 'bold',
                                                        marginRight: '15px',
                                                        flexShrink: 0
                                                    }}>
                                                        {donor.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <h4 style={{ margin: '0 0 5px 0', color: '#003366', fontSize: '18px' }}>
                                                            {donor.name}
                                                        </h4>
                                                        {donor.showAmount && (
                                                                <p style={{
                                                                    margin: '0 0 5px 0',
                                                                    color: '#28a745',
                                                                    fontWeight: 'bold',
                                                                    fontSize: '16px'
                                                                }}>
                                                                    ${donor.amount.toFixed(2)}
                                                                </p>
                                                        )}
                                                        <p style={{
                                                            margin: 0,
                                                            color: '#666',
                                                            fontSize: '14px'
                                                        }}>
                                                            {formatDate(donor.created_at)}
                                                        </p>
                                                        {donor.recurring && (
                                                                <span style={{
                                                                    display: 'inline-block',
                                                                    marginTop: '8px',
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#ffc107',
                                                                    color: '#000',
                                                                    fontSize: '12px',
                                                                    borderRadius: '4px',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                    Monthly Donor
                                                </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {donor.message && (
                                                        <p style={{
                                                            margin: '10px 0 0 0',
                                                            padding: '10px',
                                                            backgroundColor: 'white',
                                                            borderRadius: '4px',
                                                            fontSize: '14px',
                                                            fontStyle: 'italic',
                                                            color: '#555',
                                                            borderLeft: '3px solid #007bff'
                                                        }}>
                                                            "{donor.message}"
                                                        </p>
                                                )}
                                            </div>
                                    ))}
                                </div>
                        )}
                    </div>

                    {/* Call to Action */}
                    <div style={{
                        marginTop: '40px',
                        textAlign: 'center',
                        padding: '40px',
                        backgroundColor: '#003366',
                        borderRadius: '8px',
                        color: 'white'
                    }}>
                        <h3 style={{ marginBottom: '15px' }}>Join Our Community of Supporters</h3>
                        <p style={{ fontSize: '1.1rem', marginBottom: '25px', maxWidth: '600px', margin: '0 auto 25px' }}>
                            Your donation helps us continue our mission to honor and support those who serve our country.
                        </p>
                        <a
                                href="/donate"
                                style={{
                                    display: 'inline-block',
                                    padding: '15px 40px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 'bold',
                                    fontSize: '18px',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                        >
                            Make a Donation
                        </a>
                    </div>
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