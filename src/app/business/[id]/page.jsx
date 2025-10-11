'use client';
// file: /src/app/business/[id]/page.jsx v1 - Business detail page with favorites support

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navigation from '../../../components/layout/Navigation';
import FavoriteButton from '../../../components/common/FavoriteButton';

export default function BusinessDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { data: session } = useSession();
    const businessId = params.id;

    const [business, setBusiness] = useState(null);
    const [incentives, setIncentives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedServiceType, setSelectedServiceType] = useState('all');
    const [showShareTooltip, setShowShareTooltip] = useState(false);

    useEffect(() => {
        if (businessId) {
            fetchBusinessDetails();
        }
    }, [businessId]);

    const fetchBusinessDetails = async () => {
        try {
            setLoading(true);

            // Use the search endpoint to fetch business by ID
            const apiUrl = `/api/business?operation=search&_id=${businessId}`;

            const businessResponse = await fetch(apiUrl);

            if (!businessResponse.ok) {
                throw new Error('Business not found');
            }

            const businessData = await businessResponse.json();

            // The search endpoint returns results array
            if (!businessData.success || !businessData.results || businessData.results.length === 0) {
                throw new Error('Business not found');
            }

            // Get the first result (should be the only one since we're searching by ID)
            const business = businessData.results[0];
            setBusiness(business);

            // Fetch incentives
            await fetchIncentives(businessId, business);

        } catch (err) {
            console.error('Error fetching business:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchIncentives = async (businessId, businessData) => {
        try {
            // Fetch local incentives
            const localResponse = await fetch(`/api/combined-api?operation=incentives&business_id=${businessId}`);

            let allIncentives = [];

            if (localResponse.ok) {
                const localData = await localResponse.json();
                if (localData.success && localData.results) {
                    const localIncentives = localData.results.map(incentive => ({
                        ...incentive,
                        is_chain_wide: false,
                        scope: 'Location-Specific'
                    }));
                    allIncentives = [...allIncentives, ...localIncentives];
                }
            }

            // Fetch chain incentives if applicable
            if (businessData.chain_id) {
                try {
                    const chainResponse = await fetch(`/api/chains?operation=get_incentives&chain_id=${businessData.chain_id}`);

                    if (chainResponse.ok) {
                        const chainData = await chainResponse.json();
                        if (chainData.success && chainData.incentives) {
                            const chainIncentives = chainData.incentives
                            .filter(incentive => incentive.is_active !== false)
                            .map(incentive => ({
                                _id: `chain_${incentive._id}`,
                                is_available: true,
                                type: incentive.type,
                                amount: incentive.amount,
                                information: incentive.information || incentive.description,
                                other_description: incentive.other_description,
                                discount_type: incentive.discount_type || 'percentage',
                                is_chain_wide: true,
                                scope: 'Chain-Wide'
                            }));
                            allIncentives = [...allIncentives, ...chainIncentives];
                        }
                    }
                } catch (chainError) {
                    console.warn('Error fetching chain incentives:', chainError);
                }
            }

            setIncentives(allIncentives);
        } catch (err) {
            console.error('Error fetching incentives:', err);
        }
    };

    const getServiceTypeLabel = (type) => {
        const types = {
            'VT': 'Veterans',
            'AD': 'Active Duty',
            'FR': 'First Responders',
            'SP': 'Spouses',
            'OT': 'Other'
        };
        return types[type] || type;
    };

    const getServiceTypeBadgeColor = (type) => {
        const colors = {
            'VT': { bg: '#1e40af', text: 'white' },
            'AD': { bg: '#059669', text: 'white' },
            'FR': { bg: '#dc2626', text: 'white' },
            'SP': { bg: '#7c3aed', text: 'white' },
            'OT': { bg: '#6b7280', text: 'white' }
        };
        return colors[type] || colors['OT'];
    };

    const filteredIncentives = selectedServiceType === 'all'
            ? incentives
            : incentives.filter(inc => inc.type === selectedServiceType);

    const handleShare = async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: business.bname,
                    text: `Check out ${business.bname} on Patriot Thanks`,
                    url: url
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    copyToClipboard(url);
                }
            }
        } else {
            copyToClipboard(url);
        }
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setShowShareTooltip(true);
            setTimeout(() => setShowShareTooltip(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (loading) {
        return (
                <div style={{ paddingTop: '70px' }}>
                    <Navigation />
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '70vh'
                    }}>
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
                    <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
                </div>
        );
    }

    if (error || !business) {
        return (
                <div style={{ paddingTop: '70px' }}>
                    <Navigation />
                    <div style={{
                        maxWidth: '800px',
                        margin: '40px auto',
                        padding: '20px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}>
                            🏢
                        </div>
                        <h2 style={{ color: '#333', marginBottom: '10px' }}>Business Not Found</h2>
                        <p style={{ color: '#666', marginBottom: '30px' }}>
                            {error || 'The business you\'re looking for doesn\'t exist or has been removed.'}
                        </p>
                        <button
                                onClick={() => router.push('/search')}
                                style={{
                                    padding: '12px 30px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                        >
                            Search Businesses
                        </button>
                    </div>
                </div>
        );
    }

    const localIncentives = incentives.filter(i => !i.is_chain_wide);
    const chainIncentives = incentives.filter(i => i.is_chain_wide);

    return (
            <div style={{ paddingTop: '70px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
                <Navigation />

                <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                    {/* Breadcrumb */}
                    <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
                        <a href="/" style={{ color: '#007bff', textDecoration: 'none' }}>Home</a>
                        {' > '}
                        <a href="/search" style={{ color: '#007bff', textDecoration: 'none' }}>Search</a>
                        {' > '}
                        <span>{business.bname}</span>
                    </div>

                    {/* Main Content */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                        {/* Left Column - Business Info & Incentives */}
                        <div>
                            {/* Business Header */}
                            <div style={{
                                backgroundColor: 'white',
                                padding: '30px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                marginBottom: '20px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div style={{ flex: 1 }}>
                                        <h1 style={{ margin: '0 0 10px 0', color: '#003366', fontSize: '32px' }}>
                                            {business.bname}
                                        </h1>

                                        {/* Chain Badges */}
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
                                            {business.is_chain && (
                                                    <span style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: '#007bff',
                                                        color: 'white',
                                                        borderRadius: '6px',
                                                        fontSize: '13px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                🏢 Chain Parent
                                            </span>
                                            )}
                                            {business.chain_id && (
                                                    <span style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: '#28a745',
                                                        color: 'white',
                                                        borderRadius: '6px',
                                                        fontSize: '13px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                📍 Chain Location
                                                        {business.chain_name && ` - ${business.chain_name}`}
                                            </span>
                                            )}
                                            {business.type && (
                                                    <span style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: '#f8f9fa',
                                                        color: '#495057',
                                                        border: '1px solid #dee2e6',
                                                        borderRadius: '6px',
                                                        fontSize: '13px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                {business.type}
                                            </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                                        <FavoriteButton
                                                itemId={business._id}
                                                type="business"
                                                style={{ width: '200px', justifyContent: 'center' }}
                                        />
                                        <div style={{ position: 'relative' }}>
                                            <button
                                                    onClick={handleShare}
                                                    style={{
                                                        width: '200px',
                                                        padding: '8px 12px',
                                                        backgroundColor: 'white',
                                                        color: '#495057',
                                                        border: '2px solid #dee2e6',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px'
                                                    }}
                                            >
                                                <span style={{ fontSize: '16px' }}>🔗</span>
                                                Share
                                            </button>
                                            {showShareTooltip && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '-40px',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        backgroundColor: '#333',
                                                        color: 'white',
                                                        padding: '8px 12px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        whiteSpace: 'nowrap',
                                                        zIndex: 1000
                                                    }}>
                                                        Link copied!
                                                    </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div style={{
                                    padding: '20px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px',
                                    marginBottom: '20px'
                                }}>
                                    <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333' }}>
                                        Contact Information
                                    </h3>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                            <span style={{ fontSize: '20px' }}>📍</span>
                                            <div>
                                                <div>{business.address1}</div>
                                                {business.address2 && <div>{business.address2}</div>}
                                                <div>{business.city}, {business.state} {business.zip}</div>
                                            </div>
                                        </div>

                                        {business.phone && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '20px' }}>📞</span>
                                                    <a
                                                            href={`tel:${business.phone}`}
                                                            style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}
                                                    >
                                                        {business.phone}
                                                    </a>
                                                </div>
                                        )}
                                    </div>
                                </div>

                                {/* Map Placeholder */}
                                <div style={{
                                    padding: '40px',
                                    backgroundColor: '#e9ecef',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    border: '2px dashed #dee2e6'
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '10px', opacity: 0.5 }}>
                                        🗺️
                                    </div>
                                    <p style={{ margin: 0, color: '#666' }}>
                                        Interactive map coming soon
                                    </p>
                                </div>
                            </div>

                            {/* Incentives Section */}
                            <div style={{
                                backgroundColor: 'white',
                                padding: '30px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '20px',
                                    flexWrap: 'wrap',
                                    gap: '15px'
                                }}>
                                    <h2 style={{ margin: 0, color: '#003366' }}>
                                        Available Incentives ({filteredIncentives.length})
                                    </h2>

                                    {/* Service Type Filter */}
                                    <select
                                            value={selectedServiceType}
                                            onChange={(e) => setSelectedServiceType(e.target.value)}
                                            style={{
                                                padding: '8px 12px',
                                                border: '2px solid #dee2e6',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                cursor: 'pointer'
                                            }}
                                    >
                                        <option value="all">All Service Types</option>
                                        <option value="VT">Veterans</option>
                                        <option value="AD">Active Duty</option>
                                        <option value="FR">First Responders</option>
                                        <option value="SP">Spouses</option>
                                    </select>
                                </div>

                                {/* Incentive Summary */}
                                {(localIncentives.length > 0 || chainIncentives.length > 0) && (
                                        <div style={{
                                            padding: '15px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px',
                                            marginBottom: '20px',
                                            display: 'flex',
                                            gap: '20px',
                                            flexWrap: 'wrap'
                                        }}>
                                            {localIncentives.length > 0 && (
                                                    <div>
                                            <span style={{
                                                padding: '4px 8px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                marginRight: '8px'
                                            }}>
                                                Location-Specific
                                            </span>
                                                        <span>{localIncentives.length} incentive{localIncentives.length !== 1 ? 's' : ''}</span>
                                                    </div>
                                            )}
                                            {chainIncentives.length > 0 && (
                                                    <div>
                                            <span style={{
                                                padding: '4px 8px',
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                marginRight: '8px'
                                            }}>
                                                Chain-Wide
                                            </span>
                                                        <span>{chainIncentives.length} incentive{chainIncentives.length !== 1 ? 's' : ''}</span>
                                                    </div>
                                            )}
                                        </div>
                                )}

                                {/* Incentives List */}
                                {filteredIncentives.length === 0 ? (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '40px',
                                            color: '#666'
                                        }}>
                                            <div style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}>
                                                🎁
                                            </div>
                                            <h4 style={{ marginBottom: '10px' }}>
                                                No Incentives Available
                                            </h4>
                                            <p style={{ marginBottom: '20px' }}>
                                                {selectedServiceType === 'all'
                                                        ? 'This business doesn\'t have any incentives yet.'
                                                        : 'No incentives available for the selected service type.'
                                                }
                                            </p>
                                            {session && (
                                                    <button
                                                            onClick={() => router.push('/incentive-add')}
                                                            style={{
                                                                padding: '10px 20px',
                                                                backgroundColor: '#28a745',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                fontWeight: 'bold'
                                                            }}
                                                    >
                                                        Add Incentive
                                                    </button>
                                            )}
                                        </div>
                                ) : (
                                        <div style={{ display: 'grid', gap: '15px' }}>
                                            {filteredIncentives.map((incentive, index) => {
                                                const badgeColor = getServiceTypeBadgeColor(incentive.type);
                                                return (
                                                        <div
                                                                key={incentive._id || index}
                                                                style={{
                                                                    padding: '20px',
                                                                    border: '2px solid',
                                                                    borderColor: incentive.is_chain_wide ? '#007bff' : '#28a745',
                                                                    borderRadius: '8px',
                                                                    backgroundColor: '#fafafa'
                                                                }}
                                                        >
                                                            <div style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'flex-start',
                                                                marginBottom: '12px',
                                                                flexWrap: 'wrap',
                                                                gap: '10px'
                                                            }}>
                                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                        <span style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: badgeColor.bg,
                                                            color: badgeColor.text,
                                                            borderRadius: '6px',
                                                            fontSize: '14px',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {getServiceTypeLabel(incentive.type)}
                                                        </span>
                                                                    <span style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: incentive.is_chain_wide ? '#007bff' : '#28a745',
                                                                        color: 'white',
                                                                        borderRadius: '6px',
                                                                        fontSize: '12px',
                                                                        fontWeight: 'bold'
                                                                    }}>
                                                            {incentive.scope || (incentive.is_chain_wide ? 'Chain-Wide' : 'Location-Specific')}
                                                        </span>
                                                                </div>
                                                                <div style={{
                                                                    fontSize: '24px',
                                                                    fontWeight: 'bold',
                                                                    color: '#28a745'
                                                                }}>
                                                                    {incentive.amount}{incentive.discount_type === 'dollar' ? '' : '%'} OFF
                                                                </div>
                                                            </div>

                                                            <p style={{
                                                                margin: '0 0 10px 0',
                                                                fontSize: '16px',
                                                                lineHeight: '1.5',
                                                                color: '#333'
                                                            }}>
                                                                {incentive.information}
                                                            </p>

                                                            {incentive.other_description && (
                                                                    <p style={{
                                                                        margin: '10px 0 0 0',
                                                                        padding: '10px',
                                                                        backgroundColor: '#fff3cd',
                                                                        borderRadius: '6px',
                                                                        fontSize: '14px',
                                                                        color: '#856404',
                                                                        fontStyle: 'italic'
                                                                    }}>
                                                                        {incentive.other_description}
                                                                    </p>
                                                            )}

                                                            {/* Favorite Incentive Button */}
                                                            <div style={{ marginTop: '15px' }}>
                                                                <FavoriteButton
                                                                        itemId={incentive._id}
                                                                        type="incentive"
                                                                        style={{ fontSize: '13px', padding: '6px 10px' }}
                                                                />
                                                            </div>
                                                        </div>
                                                );
                                            })}
                                        </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Quick Actions */}
                        <div>
                            <div style={{
                                backgroundColor: 'white',
                                padding: '20px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                position: 'sticky',
                                top: '90px'
                            }}>
                                <h3 style={{ margin: '0 0 15px 0', color: '#003366' }}>Quick Actions</h3>

                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <button
                                            onClick={() => router.push('/search')}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                textAlign: 'left'
                                            }}
                                    >
                                        🔍 Search More Businesses
                                    </button>

                                    {session && (
                                            <>
                                                <button
                                                        onClick={() => {
                                                            sessionStorage.setItem('selectedBusinessForIncentive', JSON.stringify(business));
                                                            router.push('/incentive-add');
                                                        }}
                                                        style={{
                                                            padding: '10px',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                            textAlign: 'left'
                                                        }}
                                                >
                                                    ➕ Add Incentive
                                                </button>

                                                <button
                                                        onClick={() => router.push('/my-favorites')}
                                                        style={{
                                                            padding: '10px',
                                                            backgroundColor: '#ffc107',
                                                            color: '#000',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                            textAlign: 'left'
                                                        }}
                                                >
                                                    ⭐ View My Favorites
                                                </button>
                                            </>
                                    )}

                                    <button
                                            onClick={() => router.push('/contact')}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                textAlign: 'left'
                                            }}
                                    >
                                        📧 Report an Issue
                                    </button>
                                </div>

                                {/* Statistics */}
                                <div style={{
                                    marginTop: '20px',
                                    padding: '15px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px'
                                }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
                                        Statistics
                                    </h4>
                                    <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                                        <div>
                                            <strong>Total Incentives:</strong> {incentives.length}
                                        </div>
                                        {localIncentives.length > 0 && (
                                                <div>
                                                    <strong>Location-Specific:</strong> {localIncentives.length}
                                                </div>
                                        )}
                                        {chainIncentives.length > 0 && (
                                                <div>
                                                    <strong>Chain-Wide:</strong> {chainIncentives.length}
                                                </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
    );
}