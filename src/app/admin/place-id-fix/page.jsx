'use client';

// file: /src/app/admin/place-id-fix/page.jsx v1 - Admin tool to add Google Place IDs to existing businesses

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../../components/layout/Navigation';

export default function PlaceIdFixPage() {
    const router = useRouter();
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fixing, setFixing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [placeMatches, setPlaceMatches] = useState([]);
    const [searchingPlaces, setSearchingPlaces] = useState(false);

    // Load businesses without Google Place IDs
    useEffect(() => {
        loadBusinesses();
    }, []);

    // Load Google Maps script with new Places library
    useEffect(() => {
        if (typeof window === 'undefined' || window.google) return;

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker&loading=async&v=weekly`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        return () => {
            // Cleanup if needed
        };
    }, []);

    const loadBusinesses = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/business?operation=search');
            const data = await response.json();

            if (data.success && data.results) {
                // Filter businesses without google_place_id
                const needsPlaceId = data.results.filter(b => !b.google_place_id);
                setBusinesses(needsPlaceId);
                console.log(`Found ${needsPlaceId.length} businesses without Place IDs`);
            }
        } catch (error) {
            console.error('Error loading businesses:', error);
            alert('Failed to load businesses');
        } finally {
            setLoading(false);
        }
    };

    const searchGooglePlaces = async (business) => {
        if (!window.google?.maps?.places) {
            alert('Google Places API not loaded');
            return;
        }

        setSearchingPlaces(true);
        setPlaceMatches([]);

        try {
            // Create search query
            const query = `${business.bname} ${business.address1} ${business.city} ${business.state}`;

            console.log('🔍 Searching Google Places for:', query);

            // NEW API: Use searchByText instead of PlacesService
            const { Place } = await window.google.maps.importLibrary("places");

            const request = {
                textQuery: query,
                fields: ['id', 'displayName', 'formattedAddress', 'location', 'types'],
                locationBias: business.location?.coordinates ? {
                    lat: business.location.coordinates[1],
                    lng: business.location.coordinates[0]
                } : undefined
            };

            const { places } = await Place.searchByText(request);

            console.log('Places API response:', places);

            if (places && places.length > 0) {
                console.log(`Found ${places.length} potential matches`);

                // Convert to format matching old API and score
                const scoredMatches = places.map(place => {
                    const formattedPlace = {
                        place_id: place.id,
                        name: place.displayName,
                        formatted_address: place.formattedAddress,
                        geometry: {
                            location: place.location
                        }
                    };
                    const score = calculateMatchScore(business, formattedPlace);
                    return { ...formattedPlace, score };
                });

                // Sort by score (highest first)
                scoredMatches.sort((a, b) => b.score - a.score);

                setPlaceMatches(scoredMatches);
            } else {
                console.warn('No places found');
                setPlaceMatches([]);
                alert('No matching places found. Try a different business or search manually.');
            }

            setSearchingPlaces(false);
        } catch (error) {
            console.error('Error searching places:', error);
            alert('Error searching Google Places: ' + error.message);
            setSearchingPlaces(false);
        }
    };

    const calculateMatchScore = (business, place) => {
        let score = 0;

        const businessName = business.bname.toLowerCase();
        const placeName = place.name.toLowerCase();
        const placeAddress = place.formatted_address.toLowerCase();
        const businessAddress = `${business.address1} ${business.city} ${business.state}`.toLowerCase();

        // Name match (most important)
        if (businessName === placeName) {
            score += 50;
        } else if (placeName.includes(businessName) || businessName.includes(placeName)) {
            score += 30;
        } else {
            // Check word overlap
            const businessWords = businessName.split(' ').filter(w => w.length > 3);
            const placeWords = placeName.split(' ');
            const overlap = businessWords.filter(w => placeWords.some(pw => pw.includes(w)));
            score += overlap.length * 10;
        }

        // Address match
        if (placeAddress.includes(business.address1.toLowerCase())) {
            score += 30;
        }
        if (placeAddress.includes(business.city.toLowerCase())) {
            score += 10;
        }
        if (placeAddress.includes(business.state.toLowerCase())) {
            score += 5;
        }
        if (placeAddress.includes(business.zip)) {
            score += 10;
        }

        return score;
    };

    const handleSelectBusiness = async (business) => {
        setSelectedBusiness(business);
        setPlaceMatches([]);

        // Automatically search for places
        await searchGooglePlaces(business);
    };

    const handleAssignPlaceId = async (placeId, placeName, placeAddress) => {
        if (!selectedBusiness || !placeId) {
            alert('No Place ID to assign');
            return;
        }

        const confirmed = confirm(
                `Assign Place ID to ${selectedBusiness.bname}?\n\n` +
                `Matched Place: ${placeName}\n` +
                `Address: ${placeAddress}\n\n` +
                `Place ID: ${placeId}`
        );

        if (!confirmed) return;

        try {
            setFixing(true);

            const response = await fetch('/api/business?operation=update-business', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId: selectedBusiness._id,
                    google_place_id: placeId
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('✅ Place ID assigned successfully!');

                // Remove from list
                setBusinesses(prev => prev.filter(b => b._id !== selectedBusiness._id));
                setSelectedBusiness(null);
                setPlaceMatches([]);
            } else {
                alert('Failed to assign Place ID: ' + data.message);
            }
        } catch (error) {
            console.error('Error assigning Place ID:', error);
            alert('Error assigning Place ID');
        } finally {
            setFixing(false);
        }
    };

    const filteredBusinesses = businesses.filter(b =>
            b.bname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.address1.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
            <>
                <Navigation />
                <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '20px' }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>
                            🔗 Google Place ID Fix Utility
                        </h1>
                        <p style={{ color: '#666', marginBottom: '30px' }}>
                            Add Google Place IDs to existing businesses for better duplicate detection
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                            {/* Business List */}
                            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                                    Businesses Without Place IDs ({filteredBusinesses.length})
                                </h2>

                                <input
                                        type="text"
                                        placeholder="Search businesses..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            marginBottom: '15px'
                                        }}
                                />

                                {loading ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                            Loading...
                                        </div>
                                ) : filteredBusinesses.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                            ✅ All businesses have Place IDs!
                                        </div>
                                ) : (
                                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                            {filteredBusinesses.map((business) => (
                                                    <div
                                                            key={business._id}
                                                            onClick={() => handleSelectBusiness(business)}
                                                            style={{
                                                                padding: '12px',
                                                                border: selectedBusiness?._id === business._id ? '2px solid #2196f3' : '1px solid #e0e0e0',
                                                                borderRadius: '6px',
                                                                marginBottom: '10px',
                                                                cursor: 'pointer',
                                                                background: selectedBusiness?._id === business._id ? '#e3f2fd' : 'white',
                                                                transition: 'all 0.2s'
                                                            }}
                                                    >
                                                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                            {business.bname}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                                            {business.address1}<br />
                                                            {business.city}, {business.state} {business.zip}
                                                        </div>
                                                    </div>
                                            ))}
                                        </div>
                                )}
                            </div>

                            {/* Matches Panel */}
                            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                {selectedBusiness ? (
                                        <>
                                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                                                {selectedBusiness.bname}
                                            </h2>

                                            <div style={{ marginBottom: '20px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                                                <div style={{ marginBottom: '8px' }}>
                                                    <strong>Current Business:</strong><br />
                                                    {selectedBusiness.address1}<br />
                                                    {selectedBusiness.city}, {selectedBusiness.state} {selectedBusiness.zip}
                                                </div>
                                            </div>

                                            {searchingPlaces ? (
                                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                                        <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔍</div>
                                                        <div>Searching Google Places...</div>
                                                    </div>
                                            ) : placeMatches.length > 0 ? (
                                                    <>
                                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>
                                                            Potential Matches ({placeMatches.length})
                                                        </h3>
                                                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                                            {placeMatches.map((place, index) => (
                                                                    <div
                                                                            key={place.place_id}
                                                                            style={{
                                                                                padding: '15px',
                                                                                border: '1px solid #e0e0e0',
                                                                                borderRadius: '6px',
                                                                                marginBottom: '10px',
                                                                                background: index === 0 ? '#e8f5e9' : 'white'
                                                                            }}
                                                                    >
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                                                                            <div style={{ flex: 1 }}>
                                                                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                                                    {place.name}
                                                                                    {index === 0 && (
                                                                                            <span style={{ marginLeft: '8px', padding: '2px 8px', background: '#4caf50', color: 'white', borderRadius: '4px', fontSize: '11px' }}>
                                                                            BEST MATCH
                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                                                                    {place.formatted_address}
                                                                                </div>
                                                                                <div style={{ fontSize: '11px', color: '#999' }}>
                                                                                    Place ID: {place.place_id}
                                                                                </div>
                                                                                <div style={{ fontSize: '11px', color: '#2196f3', marginTop: '4px' }}>
                                                                                    Match Score: {place.score}%
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                                onClick={() => handleAssignPlaceId(place.place_id, place.name, place.formatted_address)}
                                                                                disabled={fixing}
                                                                                style={{
                                                                                    width: '100%',
                                                                                    padding: '8px',
                                                                                    background: fixing ? '#ccc' : '#2196f3',
                                                                                    color: 'white',
                                                                                    border: 'none',
                                                                                    borderRadius: '4px',
                                                                                    fontSize: '14px',
                                                                                    fontWeight: 'bold',
                                                                                    cursor: fixing ? 'not-allowed' : 'pointer'
                                                                                }}
                                                                        >
                                                                            {fixing ? 'Assigning...' : '✓ Assign This Place ID'}
                                                                        </button>
                                                                    </div>
                                                            ))}
                                                        </div>
                                                    </>
                                            ) : (
                                                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
                                                        <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                                                            No matches found
                                                        </div>
                                                        <button
                                                                onClick={() => searchGooglePlaces(selectedBusiness)}
                                                                style={{
                                                                    marginTop: '15px',
                                                                    padding: '10px 20px',
                                                                    background: '#2196f3',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer'
                                                                }}
                                                        >
                                                            🔄 Search Again
                                                        </button>
                                                    </div>
                                            )}
                                        </>
                                ) : (
                                        <div style={{ textAlign: 'center', padding: '100px 20px', color: '#999' }}>
                                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔗</div>
                                            <div style={{ fontSize: '18px' }}>
                                                Select a business from the list to find its Google Place ID
                                            </div>
                                        </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </>
    );
}