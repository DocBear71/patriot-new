'use client';
// file: /src/app/my-favorites/page.jsx v1 - User's favorites page

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navigation from '../../components/layout/Navigation';

export default function MyFavoritesPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [favorites, setFavorites] = useState({ businesses: [], incentives: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('businesses'); // 'businesses' or 'incentives'
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (status === 'authenticated') {
            fetchFavorites();
        } else if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/favorites?type=all');

            if (response.ok) {
                const data = await response.json();
                setFavorites(data.favorites || { businesses: [], incentives: [] });
            } else {
                console.error('Failed to fetch favorites');
            }
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (itemId, type) => {
        try {
            const response = await fetch(`/api/favorites?itemId=${itemId}&type=${type}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setMessage({ type: 'success', text: `${type} removed from favorites` });
                // Refresh favorites
                await fetchFavorites();
                // Clear message after 3 seconds
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: 'Failed to remove favorite' });
            }
        } catch (error) {
            console.error('Error removing favorite:', error);
            setMessage({ type: 'error', text: 'Error removing favorite' });
        }
    };

    const getIncentiveTypeLabel = (type) => {
        const types = {
            'VT': 'Veteran',
            'AD': 'Active Duty',
            'FR': 'First Responder',
            'SP': 'Spouse'
        };
        return types[type] || type;
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
                            <h1 style={{ margin: 0, color: '#003366' }}>My Favorites</h1>
                            <h4 style={{ margin: '5px 0 0 0', color: '#666' }}>
                                Your Saved Businesses and Incentives
                            </h4>
                        </div>
                    </div>
                </header>

                <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Message Alert */}
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

                    {/* Stats Summary */}
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
                                Favorite Businesses
                            </h5>
                            <h2 style={{ color: '#003366', margin: 0, fontSize: '32px' }}>
                                {favorites.businesses?.length || 0}
                            </h2>
                        </div>

                        <div style={{
                            backgroundColor: 'white',
                            padding: '25px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            borderLeft: '4px solid #28a745'
                        }}>
                            <h5 style={{ color: '#666', marginBottom: '10px', fontSize: '14px', textTransform: 'uppercase' }}>
                                Favorite Incentives
                            </h5>
                            <h2 style={{ color: '#003366', margin: 0, fontSize: '32px' }}>
                                {favorites.incentives?.length || 0}
                            </h2>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            display: 'flex',
                            borderBottom: '2px solid #e0e0e0',
                            backgroundColor: '#f8f9fa'
                        }}>
                            <button
                                    onClick={() => setActiveTab('businesses')}
                                    style={{
                                        flex: 1,
                                        padding: '15px',
                                        backgroundColor: activeTab === 'businesses' ? '#007bff' : 'transparent',
                                        color: activeTab === 'businesses' ? 'white' : '#666',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                    }}
                            >
                                Businesses ({favorites.businesses?.length || 0})
                            </button>
                            <button
                                    onClick={() => setActiveTab('incentives')}
                                    style={{
                                        flex: 1,
                                        padding: '15px',
                                        backgroundColor: activeTab === 'incentives' ? '#007bff' : 'transparent',
                                        color: activeTab === 'incentives' ? 'white' : '#666',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                    }}
                            >
                                Incentives ({favorites.incentives?.length || 0})
                            </button>
                        </div>

                        <div style={{ padding: '30px' }}>
                            {/* Businesses Tab */}
                            {activeTab === 'businesses' && (
                                    <div>
                                        {favorites.businesses?.length === 0 ? (
                                                <div style={{
                                                    textAlign: 'center',
                                                    padding: '60px 20px',
                                                    color: '#666'
                                                }}>
                                                    <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}>
                                                        🏢
                                                    </div>
                                                    <h4 style={{ marginBottom: '10px' }}>No Favorite Businesses Yet</h4>
                                                    <p style={{ marginBottom: '20px' }}>
                                                        Start exploring and save your favorite businesses!
                                                    </p>
                                                    <a
                                                            href="/search"
                                                            style={{
                                                                display: 'inline-block',
                                                                padding: '12px 30px',
                                                                backgroundColor: '#007bff',
                                                                color: 'white',
                                                                textDecoration: 'none',
                                                                borderRadius: '6px',
                                                                fontWeight: 'bold'
                                                            }}
                                                    >
                                                        Search Businesses
                                                    </a>
                                                </div>
                                        ) : (
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                                    gap: '20px'
                                                }}>
                                                    {favorites.businesses.map((business) => (
                                                            <div
                                                                    key={business._id}
                                                                    style={{
                                                                        padding: '20px',
                                                                        border: '1px solid #e0e0e0',
                                                                        borderRadius: '8px',
                                                                        backgroundColor: '#fafafa',
                                                                        transition: 'box-shadow 0.2s',
                                                                        position: 'relative'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                                            >
                                                                <button
                                                                        onClick={() => removeFavorite(business._id, 'business')}
                                                                        style={{
                                                                            position: 'absolute',
                                                                            top: '10px',
                                                                            right: '10px',
                                                                            backgroundColor: '#dc3545',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '50%',
                                                                            width: '30px',
                                                                            height: '30px',
                                                                            cursor: 'pointer',
                                                                            fontSize: '18px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            transition: 'background-color 0.2s'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                                                                        title="Remove from favorites"
                                                                >
                                                                    ×
                                                                </button>

                                                                <h4 style={{
                                                                    margin: '0 0 10px 0',
                                                                    color: '#003366',
                                                                    fontSize: '18px',
                                                                    paddingRight: '40px'
                                                                }}>
                                                                    {business.bname}
                                                                </h4>

                                                                <p style={{
                                                                    margin: '0 0 8px 0',
                                                                    color: '#666',
                                                                    fontSize: '14px'
                                                                }}>
                                                                    📍 {business.address1}
                                                                </p>

                                                                <p style={{
                                                                    margin: '0 0 15px 0',
                                                                    color: '#666',
                                                                    fontSize: '14px'
                                                                }}>
                                                                    {business.city}, {business.state} {business.zip}
                                                                </p>

                                                                {business.phone && (
                                                                        <p style={{
                                                                            margin: '0 0 15px 0',
                                                                            color: '#007bff',
                                                                            fontSize: '14px'
                                                                        }}>
                                                                            📞 {business.phone}
                                                                        </p>
                                                                )}

                                                                <div style={{
                                                                    display: 'flex',
                                                                    gap: '10px',
                                                                    flexWrap: 'wrap'
                                                                }}>
                                                                    <a
                                                                            href={`/business/${business._id}`}
                                                                            style={{
                                                                                flex: 1,
                                                                                padding: '8px 15px',
                                                                                backgroundColor: '#007bff',
                                                                                color: 'white',
                                                                                textDecoration: 'none',
                                                                                borderRadius: '4px',
                                                                                textAlign: 'center',
                                                                                fontSize: '14px',
                                                                                fontWeight: 'bold'
                                                                            }}
                                                                    >
                                                                        View Details
                                                                    </a>
                                                                </div>
                                                            </div>
                                                    ))}
                                                </div>
                                        )}
                                    </div>
                            )}

                            {/* Incentives Tab */}
                            {activeTab === 'incentives' && (
                                    <div>
                                        {favorites.incentives?.length === 0 ? (
                                                <div style={{
                                                    textAlign: 'center',
                                                    padding: '60px 20px',
                                                    color: '#666'
                                                }}>
                                                    <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}>
                                                        🎁
                                                    </div>
                                                    <h4 style={{ marginBottom: '10px' }}>No Favorite Incentives Yet</h4>
                                                    <p style={{ marginBottom: '20px' }}>
                                                        Browse incentives and save your favorites!
                                                    </p>
                                                    <a
                                                            href="/incentive-view"
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
                                                        View Incentives
                                                    </a>
                                                </div>
                                        ) : (
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                                    gap: '20px'
                                                }}>
                                                    {favorites.incentives.map((incentive) => (
                                                            <div
                                                                    key={incentive._id}
                                                                    style={{
                                                                        padding: '20px',
                                                                        border: '1px solid #e0e0e0',
                                                                        borderRadius: '8px',
                                                                        backgroundColor: '#fafafa',
                                                                        transition: 'box-shadow 0.2s',
                                                                        position: 'relative'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                                            >
                                                                <button
                                                                        onClick={() => removeFavorite(incentive._id, 'incentive')}
                                                                        style={{
                                                                            position: 'absolute',
                                                                            top: '10px',
                                                                            right: '10px',
                                                                            backgroundColor: '#dc3545',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '50%',
                                                                            width: '30px',
                                                                            height: '30px',
                                                                            cursor: 'pointer',
                                                                            fontSize: '18px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            transition: 'background-color 0.2s'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                                                                        title="Remove from favorites"
                                                                >
                                                                    ×
                                                                </button>

                                                                {/* Business Name */}
                                                                {incentive.business && (
                                                                        <div style={{
                                                                            marginBottom: '15px',
                                                                            paddingBottom: '10px',
                                                                            borderBottom: '2px solid #e0e0e0'
                                                                        }}>
                                                                            <h4 style={{
                                                                                margin: '0 0 5px 0',
                                                                                color: '#003366',
                                                                                fontSize: '18px',
                                                                                paddingRight: '40px'
                                                                            }}>
                                                                                {incentive.business.bname}
                                                                            </h4>
                                                                            <p style={{
                                                                                margin: 0,
                                                                                color: '#666',
                                                                                fontSize: '14px'
                                                                            }}>
                                                                                {incentive.business.city}, {incentive.business.state}
                                                                            </p>
                                                                        </div>
                                                                )}

                                                                {/* Incentive Type Badge */}
                                                                <div style={{ marginBottom: '12px' }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '6px 12px',
                                                        backgroundColor: '#007bff',
                                                        color: 'white',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {getIncentiveTypeLabel(incentive.type)}
                                                    </span>
                                                                </div>

                                                                {/* Amount */}
                                                                {incentive.amount && (
                                                                        <p style={{
                                                                            margin: '0 0 12px 0',
                                                                            color: '#28a745',
                                                                            fontSize: '20px',
                                                                            fontWeight: 'bold'
                                                                        }}>
                                                                            {incentive.amount}% OFF
                                                                        </p>
                                                                )}

                                                                {/* Information */}
                                                                <p style={{
                                                                    margin: '0 0 15px 0',
                                                                    color: '#555',
                                                                    fontSize: '14px',
                                                                    lineHeight: '1.5'
                                                                }}>
                                                                    {incentive.information}
                                                                </p>

                                                                {/* Other Description */}
                                                                {incentive.other_description && (
                                                                        <p style={{
                                                                            margin: '0 0 15px 0',
                                                                            padding: '10px',
                                                                            backgroundColor: '#fff3cd',
                                                                            borderRadius: '4px',
                                                                            color: '#856404',
                                                                            fontSize: '13px',
                                                                            fontStyle: 'italic'
                                                                        }}>
                                                                            {incentive.other_description}
                                                                        </p>
                                                                )}

                                                                {/* View Business Button */}
                                                                {incentive.business && (
                                                                        <a
                                                                                href={`/business/${incentive.business_id}`}
                                                                                style={{
                                                                                    display: 'block',
                                                                                    padding: '10px',
                                                                                    backgroundColor: '#28a745',
                                                                                    color: 'white',
                                                                                    textDecoration: 'none',
                                                                                    borderRadius: '4px',
                                                                                    textAlign: 'center',
                                                                                    fontSize: '14px',
                                                                                    fontWeight: 'bold'
                                                                                }}
                                                                        >
                                                                            View Business
                                                                        </a>
                                                                )}
                                                            </div>
                                                    ))}
                                                </div>
                                        )}
                                    </div>
                            )}
                        </div>
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