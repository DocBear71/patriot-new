'use client';

// file: /src/app/admin/coordinate-fix/page.jsx v1 - Admin tool to fix business coordinates

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../../components/layout/Navigation';

export default function CoordinateFixPage() {
    const router = useRouter();
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fixing, setFixing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);

    // Load businesses with potentially bad coordinates
    useEffect(() => {
        loadBusinesses();
    }, []);

    // Initialize Google Maps
    useEffect(() => {
        if (typeof window !== 'undefined' && window.google && !map) {
            const newMap = new window.google.maps.Map(document.getElementById('coordinate-map'), {
                center: { lat: 41.9778, lng: -91.6656 },
                zoom: 12
            });
            setMap(newMap);
        }
    }, [map]);

    const loadBusinesses = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/business?operation=search');
            const data = await response.json();

            if (data.success && data.results) {
                // Filter businesses with suspicious coordinates
                const suspicious = data.results.filter(b => {
                    const lat = parseFloat(b.lat);
                    const lng = parseFloat(b.lng);
                    return isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0 ||
                            Math.abs(lat) > 90 || Math.abs(lng) > 180;
                });
                setBusinesses(suspicious);
            }
        } catch (error) {
            console.error('Error loading businesses:', error);
            alert('Failed to load businesses');
        } finally {
            setLoading(false);
        }
    };

    const geocodeBusiness = async (business) => {
        if (!window.google) {
            alert('Google Maps not loaded');
            return null;
        }

        const address = `${business.address1}, ${business.city}, ${business.state} ${business.zip}`;
        const geocoder = new window.google.maps.Geocoder();

        return new Promise((resolve) => {
            geocoder.geocode({ address }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const location = results[0].geometry.location;
                    resolve({
                        lat: location.lat(),
                        lng: location.lng(),
                        formattedAddress: results[0].formatted_address
                    });
                } else {
                    console.error('Geocoding failed:', status);
                    resolve(null);
                }
            });
        });
    };

    const handleSelectBusiness = async (business) => {
        setSelectedBusiness(business);

        // Try to geocode
        const coords = await geocodeBusiness(business);

        if (coords && map) {
            const position = { lat: coords.lat, lng: coords.lng };
            map.setCenter(position);
            map.setZoom(16);

            // Remove old marker
            if (marker) {
                marker.setMap(null);
            }

            // Add new marker
            const newMarker = new window.google.maps.Marker({
                position: position,
                map: map,
                title: business.bname,
                draggable: true
            });

            setMarker(newMarker);

            // Update selected business with new coordinates
            setSelectedBusiness({
                ...business,
                suggestedLat: coords.lat,
                suggestedLng: coords.lng,
                formattedAddress: coords.formattedAddress
            });
        }
    };

    const handleFixCoordinates = async () => {
        if (!selectedBusiness || !selectedBusiness.suggestedLat) {
            alert('No coordinates to fix');
            return;
        }

        try {
            setFixing(true);

            // Get final position from marker if it was dragged
            let finalLat = selectedBusiness.suggestedLat;
            let finalLng = selectedBusiness.suggestedLng;

            if (marker) {
                const position = marker.getPosition();
                finalLat = position.lat();
                finalLng = position.lng();
            }

            const response = await fetch(`/api/business?operation=update-business`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId: selectedBusiness._id,
                    lat: finalLat,
                    lng: finalLng
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Coordinates updated successfully!');

                // Remove from list
                setBusinesses(businesses.filter(b => b._id !== selectedBusiness._id));
                setSelectedBusiness(null);

                if (marker) {
                    marker.setMap(null);
                    setMarker(null);
                }
            } else {
                alert('Failed to update coordinates: ' + data.message);
            }
        } catch (error) {
            console.error('Error fixing coordinates:', error);
            alert('Failed to update coordinates');
        } finally {
            setFixing(false);
        }
    };

    const filteredBusinesses = businesses.filter(b =>
            b.bname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
            <>
                <Navigation />
                <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '20px' }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>
                            🛠️ Coordinate Fix Utility
                        </h1>
                        <p style={{ color: '#666', marginBottom: '30px' }}>
                            Fix businesses with missing or invalid coordinates
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                            {/* Business List */}
                            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                                    Businesses Needing Fixes ({filteredBusinesses.length})
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
                                            ✅ All businesses have valid coordinates!
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
                                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                                            Current: {business.lat || 'N/A'}, {business.lng || 'N/A'}
                                                        </div>
                                                    </div>
                                            ))}
                                        </div>
                                )}
                            </div>

                            {/* Map and Details */}
                            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                {selectedBusiness ? (
                                        <>
                                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                                                {selectedBusiness.bname}
                                            </h2>

                                            <div style={{ marginBottom: '15px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                                                <div style={{ marginBottom: '8px' }}>
                                                    <strong>Address:</strong><br />
                                                    {selectedBusiness.address1}<br />
                                                    {selectedBusiness.city}, {selectedBusiness.state} {selectedBusiness.zip}
                                                </div>
                                                {selectedBusiness.formattedAddress && (
                                                        <div style={{ marginBottom: '8px' }}>
                                                            <strong>Geocoded Address:</strong><br />
                                                            {selectedBusiness.formattedAddress}
                                                        </div>
                                                )}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                    <div>
                                                        <strong>Current:</strong><br />
                                                        Lat: {selectedBusiness.lat || 'N/A'}<br />
                                                        Lng: {selectedBusiness.lng || 'N/A'}
                                                    </div>
                                                    {selectedBusiness.suggestedLat && (
                                                            <div>
                                                                <strong style={{ color: '#4caf50' }}>Suggested:</strong><br />
                                                                Lat: {selectedBusiness.suggestedLat?.toFixed(6)}<br />
                                                                Lng: {selectedBusiness.suggestedLng?.toFixed(6)}
                                                            </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div id="coordinate-map" style={{ height: '400px', marginBottom: '15px', borderRadius: '4px' }}></div>

                                            <div style={{ padding: '12px', background: '#fff3cd', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>
                                                💡 <strong>Tip:</strong> Drag the marker to fine-tune the exact location
                                            </div>

                                            <button
                                                    onClick={handleFixCoordinates}
                                                    disabled={fixing || !selectedBusiness.suggestedLat}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        background: fixing || !selectedBusiness.suggestedLat ? '#ccc' : '#4caf50',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '16px',
                                                        fontWeight: 'bold',
                                                        cursor: fixing || !selectedBusiness.suggestedLat ? 'not-allowed' : 'pointer'
                                                    }}
                                            >
                                                {fixing ? 'Updating...' : '✓ Fix Coordinates'}
                                            </button>
                                        </>
                                ) : (
                                        <div style={{ textAlign: 'center', padding: '100px 20px', color: '#999' }}>
                                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📍</div>
                                            <div style={{ fontSize: '18px' }}>
                                                Select a business from the list to fix its coordinates
                                            </div>
                                        </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Load Google Maps */}
                <script
                        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
                        async
                        defer
                />
            </>
    );
}