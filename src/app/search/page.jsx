'use client';

// file: /src/app/search/page.jsx v3 - Temporarily disabled Google Maps functionality

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/layout/Navigation';
import Footer from '../../components/legal/Footer';
import SearchLoadingModal from '../../components/search/SearchLoadingModal';

export default function SearchPage() {
    const router = useRouter();
    const [searchData, setSearchData] = useState({
        businessName: '',
        address: '',
        query: '',
        cityState: '',  // Combined city and state
        category: ''  // Category filter
    });
    const [showOnlyWithIncentives, setShowOnlyWithIncentives] = useState(true); // Hide businesses without incentives by default
    const [filteredResults, setFilteredResults] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [loadingStep, setLoadingStep] = useState(1);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('Please wait while we find the best results...');
    const [gettingLocation, setGettingLocation] = useState(false);
    // COMMENTED OUT: Map-related state for future implementation
    const [mapInitialized, setMapInitialized] = useState(false);
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [infoWindow, setInfoWindow] = useState(null);


    const businessTypes = [
        { value: '', label: 'All Categories' },
        { value: 'AUTO', label: 'Automotive' },
        { value: 'BEAU', label: 'Beauty' },
        { value: 'BOOK', label: 'Bookstore' },
        { value: 'CLTH', label: 'Clothing' },
        { value: 'CONV', label: 'Convenience Store/Gas Station' },
        { value: 'DEPT', label: 'Department Store' },
        { value: 'ELEC', label: 'Electronics' },
        { value: 'ENTR', label: 'Entertainment' },
        { value: 'FURN', label: 'Furniture' },
        { value: 'FUEL', label: 'Fuel Station/Truck Stop' },
        { value: 'GIFT', label: 'Gift Shop' },
        { value: 'GROC', label: 'Grocery' },
        { value: 'HARDW', label: 'Hardware' },
        { value: 'HEAL', label: 'Health' },
        { value: 'HOTEL', label: 'Hotel/Motel' },
        { value: 'JEWL', label: 'Jewelry' },
        { value: 'OTHER', label: 'Other' },
        { value: 'RX', label: 'Pharmacy' },
        { value: 'REST', label: 'Restaurant' },
        { value: 'RETAIL', label: 'Retail' },
        { value: 'SERV', label: 'Service' },
        { value: 'SPEC', label: 'Specialty' },
        { value: 'SPRT', label: 'Sporting Goods' },
        { value: 'TECH', label: 'Technology' },
        { value: 'TOYS', label: 'Toys' }
    ];

    // Get service type label
    const getServiceTypeLabel = (type) => {
        const labels = {
            'VT': 'Veterans',
            'AD': 'Active Duty',
            'FR': 'First Responders',
            'SP': 'Military Spouses',
            'MR': 'Military Rate',
            'NC': 'No Chain Incentives',
            'WS': 'WeSalute',
            'OT': 'Other',
            'NA': 'Not Available'
        };
        return labels[type] || type;
    };


    // COMMENTED OUT: Google Maps configuration for future implementation
    const mapConfig = {
        center: { lat: 41.9778, lng: -91.6656 }, // Cedar Rapids, IA
        zoom: 11,
        mapId: 'ebe8ec43a7bc252d', // Your map ID from the existing implementation
        markerColors: {
            primary: '#EA4335',    // RED - Primary search results (database)
            database: '#28a745',   // GREEN - Nearby database businesses
            nearby: '#4285F4',     // BLUE - Google Places results
            chain: '#FF9800'       // ORANGE - Chain indicators
        }
    };

    // COMMENTED OUT: Initialize Google Maps using the same approach as the original HTML
    useEffect(() => {
        // Set up the same window.appConfig as the original
        window.appConfig = {
            googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
            googleMapsMapId: 'ebe8ec43a7bc252d',
            environment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'development'
                    : 'production',
            debug: true,
        };

        // Define the initGoogleMap callback that matches the original
        window.initGoogleMap = function() {
            console.log('Google Maps callback executed');
            initMap();
            setMapInitialized(true);
        };

        const initializeGoogleMaps = () => {
            if (window.google?.maps) {
                window.initGoogleMap();
                return;
            }

            // Get API key and mapId from runtime config (matching original)
            const apiKey = window.appConfig.googleMapsApiKey;
            const mapId = window.appConfig.googleMapsMapId;

            console.log('Loading Google Maps with Map ID:', mapId);

            // Create and insert the Google Maps script with all recommended parameters (matching original)
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&map_ids=${mapId}&libraries=places,geometry,marker&callback=initGoogleMap&loading=async&v=weekly`;
            script.async = true;
            script.defer = true;

            script.onerror = function() {
                console.error('Google Maps API failed to load. Check your API key.');
                const mapContainer = document.getElementById('map');
                if (mapContainer) {
                    mapContainer.innerHTML = `
                        <div style="text-align: center; padding: 20px; background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; border-radius: 4px;">
                            <p><strong>Error loading Google Maps</strong></p>
                            <p>Please check your internet connection and try again.</p>
                        </div>
                    `;
                } else {
                    alert('Error loading Google Maps. Please try again later.');
                }
            };

            document.head.appendChild(script);
        };

        initializeGoogleMaps();
    }, []);

    // COMMENTED OUT: All Google Maps functions for future implementation

    // Initialize the map
    const initMap = async () => {
        try {
            const mapContainer = document.getElementById('map');
            if (!mapContainer || !window.google) return;

            const newMap = new window.google.maps.Map(mapContainer, {
                center: mapConfig.center,
                zoom: mapConfig.zoom,
                mapId: mapConfig.mapId,
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                scaleControl: true,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: true
                // Note: POI visibility is controlled via the Cloud Console for maps with mapId
            });

            const newInfoWindow = new window.google.maps.InfoWindow({
                maxWidth: 320,
                disableAutoPan: false,
                pixelOffset: new window.google.maps.Size(0, -10)
            });

            setMap(newMap);
            setInfoWindow(newInfoWindow);
            setMapInitialized(true);

            // ADD THIS: Listen for clicks on Google's built-in Place markers
            if (newMap && newInfoWindow) {
                newMap.addListener('click', async (event) => {
                    // Check if a Place was clicked
                    const placeId = event.placeId;

                    if (placeId) {
                        console.log('🗺️ Google Place clicked:', placeId);
                        event.stop(); // Prevent default info window

                        try {
                            // Use the NEW Places API (not deprecated)
                            const { Place } = await window.google.maps.importLibrary("places");

                            // Create a Place instance
                            const place = new Place({
                                id: placeId,
                                requestedLanguage: 'en'
                            });

                            // Fetch place details
                            await place.fetchFields({
                                fields: [
                                    'displayName',
                                    'formattedAddress',
                                    'location',
                                    'id',
                                    'internationalPhoneNumber',
                                    'nationalPhoneNumber',
                                    'websiteURI',
                                    'addressComponents'
                                ]
                            });

                            console.log('✅ Place details fetched:', place);

                            // Call handler with BOTH the place AND the infoWindow
                            handleGooglePlaceClickWithWindow(place, newInfoWindow, newMap);

                        } catch (error) {
                            console.error('Error fetching place details:', error);

                            // Fallback to basic info window
                            if (newInfoWindow) {
                                const basicContent = `
                        <div style="padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                            <div style="padding: 10px; background: #fff3cd; border-left: 3px solid #ffc107; margin-bottom: 12px; border-radius: 4px;">
                                <strong>ℹ️ Not in Database</strong>
                                <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">
                                    This business is from Google Maps and not yet in the Patriot Thanks database.
                                </p>
                            </div>
                            <p style="margin: 8px 0; color: #666;">Click the business name for more details.</p>
                        </div>
                    `;
                                newInfoWindow.setContent(basicContent);
                                newInfoWindow.setPosition(event.latLng);
                                newInfoWindow.open(newMap);
                            }
                        }
                    }
                });
            }

            console.log('Google Map initialized successfully');
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    };

    // Clear existing markers
    const clearMarkers = () => {
        markers.forEach(marker => {
            if (marker.setMap) {
                marker.setMap(null);
            }
        });
        setMarkers([]);
    };

    // Create marker for a business
    const createBusinessMarker = async (business, businessType) => {
        if (!map || !business) return null;

        try {
            // Get coordinates
            let lat, lng;
            if (business.coordinates?.lat && business.coordinates?.lng) {
                lat = parseFloat(business.coordinates.lat);
                lng = parseFloat(business.coordinates.lng);
            } else if (business.lat && business.lng) {
                lat = parseFloat(business.lat);
                lng = parseFloat(business.lng);
            } else if (business.location?.coordinates) {
                lng = parseFloat(business.location.coordinates[0]);
                lat = parseFloat(business.location.coordinates[1]);
            } else {
                console.warn(`No coordinates for business: ${business.bname}`);
                return null;
            }

            // Validate coordinates
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                console.warn(`Invalid coordinates for ${business.bname}: ${lat}, ${lng}`);
                return null;
            }

            const position = { lat, lng };

            // Determine marker color based on business properties
            let markerColor, markerClass;

            // Priority order: chain > primary > nearby > database > default
            if (business.markerColor === 'chain' || (business.chain_id && !business.isPrimaryResult)) {
                markerColor = mapConfig.markerColors.chain; // ORANGE
                markerClass = 'chain';
                console.log(`🟠 ORANGE marker for: ${business.bname} (Chain)`);
            } else if (business.markerColor === 'primary' || business.isPrimaryResult) {
                markerColor = mapConfig.markerColors.primary; // RED
                markerClass = 'primary';
                console.log(`🔴 RED marker for: ${business.bname} (Primary)`);
            } else if (business.markerColor === 'nearby' || business.isGooglePlace || business.isRelevantPlaces) {
                markerColor = mapConfig.markerColors.nearby; // BLUE
                markerClass = 'nearby';
                console.log(`🔵 BLUE marker for: ${business.bname} (Google Places)`);
            } else if (business.markerColor === 'database' || business.isNearbyDatabase) {
                markerColor = mapConfig.markerColors.database; // GREEN
                markerClass = 'database';
                console.log(`🟢 GREEN marker for: ${business.bname} (Nearby Database)`);
            } else {
                markerColor = mapConfig.markerColors.primary; // Default to RED
                markerClass = 'primary';
                console.log(`⚠️ DEFAULT RED marker for: ${business.bname}`);
            }

            // ALWAYS try to use AdvancedMarkerElement with custom HTML
            try {
                // Import the marker library if not already imported
                if (!window.google.maps.marker) {
                    await window.google.maps.importLibrary("marker");
                }

                const { AdvancedMarkerElement } = window.google.maps.marker;

                // Create custom HTML pin element with icon and rotation
                const pinElement = document.createElement('div');
                pinElement.className = `custom-marker-pin ${markerClass}`;
                pinElement.style.cssText = `
                position: relative;
                width: 40px;
                height: 48px;
                cursor: pointer;
                transform-origin: center center;
            `;

                pinElement.innerHTML = `
                    <div style="
                        position: absolute;
                        width: 40px;
                        height: 48px;
                        background-color: ${markerColor};
                        border: 3px solid white;
                        border-radius: 50% 50% 50% 0;
                        transform: rotate(-45deg);
                        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <div style="
                            transform: rotate(45deg);
                            font-size: 18px;
                            color: white;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                            margin-top: -4px;
                            margin-left: -4px;
                        ">🏢</div>
                    </div>
                `;

                // Create the advanced marker
                const marker = new AdvancedMarkerElement({
                    position: position,
                    map: map,
                    title: business.bname,
                    content: pinElement,
                    gmpClickable: true
                });

                // Add click listener to the pin element
                pinElement.addEventListener('click', () => {
                    showBusinessInfo(business, marker, position);
                });

                console.log(`✅ Created custom AdvancedMarker with icon for ${business.bname}`);
                return marker;

            } catch (advancedError) {
                console.warn('AdvancedMarkerElement not available, using fallback:', advancedError);

                // Fallback to standard markers with custom SVG icon
                const svgMarker = {
                    path: 'M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z',
                    fillColor: markerColor,
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#ffffff',
                    rotation: 0,
                    scale: 1.5,
                    anchor: new window.google.maps.Point(12, 24)
                };

                const marker = new window.google.maps.Marker({
                    position: position,
                    map: map,
                    title: business.bname,
                    icon: svgMarker
                });

                marker.addListener('click', () => {
                    showBusinessInfo(business, marker, position);
                });

                console.log(`✅ Created fallback SVG marker for ${business.bname}`);
                return marker;
            }
        } catch (error) {
            console.error(`Error creating marker for ${business.bname}:`, error);
            return null;
        }
    };

    // Show business information in info window
    const showBusinessInfo = (business, marker, position) => {
        if (!infoWindow) return;

        const isGooglePlace = business.isGooglePlace || !business._id || business._id?.toString().startsWith('google_');
        const isFromDatabase = business.isFromDatabase || (!isGooglePlace && business._id);

        const incentivesHtml = business.incentives && business.incentives.length > 0
                ? business.incentives.map(incentive => `
            <div style="padding: 8px; background: #e8f5e9; border-radius: 4px; margin: 4px 0;">
                <strong>${getServiceTypeLabel(incentive.type)}: ${incentive.amount}% off</strong>
                <br><small>${incentive.information}</small>
            </div>
        `).join('')
                : '<div style="padding: 8px; color: #666; font-style: italic;">No specific incentives listed</div>';

        // Status badge for Google Places
        const statusBadge = isGooglePlace
                ? `<div style="padding: 8px; background: #fff3cd; border-left: 3px solid #ffc107; margin-bottom: 12px; border-radius: 4px;">
            <strong>ℹ️ Not in Database</strong>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">This business is from Google Maps and not yet in the Patriot Thanks database.</p>
           </div>`
                : `<div style="padding: 8px; background: #d4edda; border-left: 3px solid #28a745; margin-bottom: 12px; border-radius: 4px;">
            <strong>✓ In Database</strong>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">This business is in the Patriot Thanks database.</p>
           </div>`;

        // Add to database button for Google Places
        const addToDbButton = isGooglePlace
                ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
            <button 
                id="add-to-db-btn-${business.placeId || 'temp'}"
                style="width: 100%; padding: 10px; background: #2196f3; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;"
                onmouseover="this.style.background='#1976d2'"
                onmouseout="this.style.background='#2196f3'"
            >
                ➕ Add to Database
            </button>
           </div>`
                : '';

        const content = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 300px;">
            ${statusBadge}
            <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #333;">${business.bname}</h3>
            <div style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 12px;">
                <p style="margin: 2px 0;">${business.address1}</p>
                ${business.address2 ? `<p style="margin: 2px 0;">${business.address2}</p>` : ''}
                <p style="margin: 2px 0;">${business.city}, ${business.state} ${business.zip}</p>
                ${business.phone ? `<p style="margin: 6px 0 0 0;">📞 ${business.phone}</p>` : ''}
            </div>
            ${isFromDatabase ? `
                <div style="margin-top: 12px;">
                    <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">Available Incentives:</h4>
                    ${incentivesHtml}
                </div>
            ` : ''}
            ${addToDbButton}
        </div>
    `;

        infoWindow.setContent(content);
        infoWindow.setPosition(position);
        infoWindow.open(map);

        // Add click handler for "Add to Database" button
        if (isGooglePlace) {
            setTimeout(() => {
                const addBtn = document.getElementById(`add-to-db-btn-${business.placeId || 'temp'}`);
                if (addBtn) {
                    addBtn.addEventListener('click', () => {
                        // Prepare data for business-add page
                        const businessData = {
                            bname: business.bname,
                            address1: business.address1,
                            address2: business.address2 || '',
                            city: business.city,
                            state: business.state,
                            zip: business.zip,
                            phone: business.phone || '',
                            lat: business.coordinates?.lat || business.lat,
                            lng: business.coordinates?.lng || business.lng,
                            placeId: business.placeId || ''
                        };

                        // Store in sessionStorage to pre-fill the form
                        sessionStorage.setItem('prefillBusinessData', JSON.stringify(businessData));

                        // Redirect to add business page
                        router.push('/business-add');
                    });
                }
            }, 100);
        }
    };

    // Search for matching chain and get incentives
    // Search for matching chain and get incentives
    const searchForChainMatch = async (businessName) => {
        try {
            console.log('🔍 Searching for chain match:', businessName);

            // Clean up the business name for better matching
            // Step 1: Remove common business type suffixes
            let cleanName = businessName
            .replace(/\s+(Grocery Store|Store|Shop|Location|Market|Supermarket|Gas Station|Restaurant|Cafe|Coffee|Pizza|Pharmacy|Hotel|Motel)$/i, '')
            .trim();

            // Step 2: Remove trailing numbers (like "Store #123" or "Location 5")
            cleanName = cleanName.replace(/\s+#?\d+$/, '').trim();

            // Step 3: Remove anything in parentheses at the end (like "McDonald's (Main St)")
            cleanName = cleanName.replace(/\s*\([^)]*\)$/, '').trim();

            // Step 4: If the name still contains a dash, only remove the part after the dash if it looks like a location
            // (e.g., "Subway - Downtown" -> "Subway", but "Hy-Vee" stays as "Hy-Vee")
            if (cleanName.includes(' - ')) {
                const parts = cleanName.split(' - ');
                // Only use the first part if the second part looks like a location descriptor
                if (parts[1] && /^(Downtown|Uptown|Main|North|South|East|West|Store|Location|\d+)/.test(parts[1])) {
                    cleanName = parts[0].trim();
                }
            }

            console.log('🧹 Cleaned name for search:', cleanName);

            // Search chains API
            const response = await fetch(`/api/chains?operation=search&name=${encodeURIComponent(cleanName)}`);

            if (!response.ok) {
                console.log('⚠️ Chain search API returned non-OK status');
                return null;
            }

            const data = await response.json();
            console.log('📊 Chain search response:', data);

            if (data.results && data.results.length > 0) {
                const matchedChain = data.results[0];
                console.log('✅ Found chain match:', matchedChain.chain_name);

                // Get chain incentives
                const incentivesResponse = await fetch(`/api/combined-api?operation=get_chain_incentives&chain_id=${matchedChain._id}`);

                if (incentivesResponse.ok) {
                    const incentivesData = await incentivesResponse.json();
                    console.log('📋 Chain incentives:', incentivesData);

                    if (incentivesData.success && incentivesData.incentives && incentivesData.incentives.length > 0) {
                        return {
                            chain: matchedChain,
                            incentives: incentivesData.incentives
                        };
                    }
                }
            }

            console.log('❌ No chain match found');
            return null;

        } catch (error) {
            console.error('❌ Error searching for chain match:', error);
            return null;
        }
    };


    // Handle clicks on Google Places POI markers (not in our database)
    const handleGooglePlaceClickWithWindow = async (place, infoWindowRef, mapRef) => {
        if (!infoWindowRef || !place) {
            console.error('❌ No infoWindow or place:', {infoWindow: infoWindowRef, place});
            return;
        }

        console.log('📍 Processing Google Place click with infoWindow:', infoWindowRef);

        // Extract data from the new Place object - it's nested in place.Cg
        const placeData = place.Cg || place;

        const businessName = placeData.displayName || 'Business';
        const address = placeData.formattedAddress || '';
        const phone = placeData.internationalPhoneNumber || placeData.nationalPhoneNumber || '';
        const website = placeData.websiteURI || '';

        console.log('📋 Extracted place data:', {businessName, address, phone, website});

        // Parse address components for city/state/zip
        let city = '';
        let state = '';
        let zip = '';

        if (placeData.addressComponents) {
            placeData.addressComponents.forEach(component => {
                if (component.types.includes('locality')) {
                    city = component.longText || component.long_name || '';
                }
                if (component.types.includes('administrative_area_level_1')) {
                    state = component.shortText || component.short_name || '';
                }
                if (component.types.includes('postal_code')) {
                    zip = component.longText || component.long_name || '';
                }
            });
        }

        // ========== CHECK IF BUSINESS ALREADY EXISTS IN DATABASE ==========
        console.log('🔍 DUPLICATE CHECK: Starting database query for:', businessName);

        const normalizedPlaceName = businessName.toLowerCase().trim();
        const normalizedPlaceAddress = address.toLowerCase().trim();
        const normalizedPlacePhone = phone.replace(/\D/g, ''); // Remove non-digits
        const placeId = placeData.id || place.id || '';

        console.log('🔍 Search criteria:', {
            name: normalizedPlaceName,
            address: normalizedPlaceAddress.substring(0, 50) + '...',
            phone: normalizedPlacePhone,
            placeId: placeId
        });

        // Query the database directly to check for duplicates
        try {
            const checkParams = new URLSearchParams();

            // Try searching by Place ID first (most reliable)
            if (placeId) {
                checkParams.append('google_place_id', placeId);
            } else {
                // Fall back to name and address search
                checkParams.append('businessName', businessName);
                if (city) checkParams.append('city', city);
                if (state) checkParams.append('state', state);
            }

            console.log('🔍 Querying API with params:', checkParams.toString());

            const checkResponse = await fetch(`/api/business?operation=search&${checkParams}`);
            const checkData = await checkResponse.json();

            console.log('📊 API Response:', checkData);

            if (checkResponse.ok && checkData.results && checkData.results.length > 0) {
                // We found potential matches, now do detailed comparison
                console.log(`🔍 Found ${checkData.results.length} potential matches, doing detailed comparison`);

                const existingBusiness = checkData.results.find(business => {
                    const dbName = (business.bname || '').toLowerCase().trim();
                    const dbAddress = (business.address1 || '').toLowerCase().trim();
                    const dbPhone = (business.phone || '').replace(/\D/g, '');
                    const dbPlaceId = business.google_place_id || '';

                    console.log(`  🔍 Comparing with: ${business.bname}`);

                    // Check 1: Google Place ID match (most reliable)
                    if (placeId && dbPlaceId && placeId === dbPlaceId) {
                        console.log('     ✅ MATCH: Place ID exact match!');
                        return true;
                    }

                    // Check 2: Exact name match with address confirmation
                    if (dbName === normalizedPlaceName) {
                        const placeAddressStart = normalizedPlaceAddress.split(',')[0];
                        if (dbAddress.includes(placeAddressStart) || placeAddressStart.includes(dbAddress)) {
                            console.log('     ✅ MATCH: Exact name and address match!');
                            return true;
                        }
                    }

                    // Check 3: Name match with phone confirmation
                    if (dbName === normalizedPlaceName && normalizedPlacePhone && dbPhone === normalizedPlacePhone) {
                        console.log('     ✅ MATCH: Name and phone match!');
                        return true;
                    }

                    console.log('     ❌ No match');
                    return false;
                });

                if (existingBusiness) {
                    console.log('✅ DUPLICATE FOUND - Business already in database:', existingBusiness.bname);
                    console.log('   ID:', existingBusiness._id);

                    // Get position from place data
                    const position = placeData.location ?
                            new window.google.maps.LatLng(placeData.location.lat, placeData.location.lng) :
                            (place.Gg ? new window.google.maps.LatLng(place.Gg.lat(), place.Gg.lng()) : null);

                    if (!position) {
                        console.error('❌ No position available for info window');
                        return;
                    }

                    console.log('📍 Building info window for existing business');

                    // Build info window content for existing business
                    const incentivesHtml = existingBusiness.incentives && existingBusiness.incentives.length > 0
                            ? existingBusiness.incentives.map(incentive => `
                            <div style="padding: 8px; background: #e8f5e9; border-radius: 4px; margin: 4px 0;">
                                <strong>${getServiceTypeLabel(incentive.type)}: ${incentive.amount}% off</strong>
                                <br><small>${incentive.information}</small>
                            </div>
                        `).join('')
                            : '<div style="padding: 8px; color: #666; font-style: italic;">No specific incentives listed</div>';

                    const existingBusinessContent = `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 300px;">
                            <div style="padding: 10px; background: #d4edda; border-left: 3px solid #28a745; margin-bottom: 12px; border-radius: 4px;">
                                <strong>✓ In Database</strong>
                                <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">This business is in the Patriot Thanks database.</p>
                            </div>
                            
                            <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #333;">${existingBusiness.bname}</h3>
                            
                            <div style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 12px;">
                                <p style="margin: 2px 0;">${existingBusiness.address1}</p>
                                ${existingBusiness.address2 ? `<p style="margin: 2px 0;">${existingBusiness.address2}</p>` : ''}
                                <p style="margin: 2px 0;">${existingBusiness.city}, ${existingBusiness.state} ${existingBusiness.zip}</p>
                                ${existingBusiness.phone ? `<p style="margin: 6px 0 0 0;">📞 ${existingBusiness.phone}</p>` : ''}
                            </div>
                            
                            <div style="margin-top: 12px;">
                                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">Available Incentives:</h4>
                                ${incentivesHtml}
                            </div>
                            
                            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
                                <a href="/business/${existingBusiness._id}" target="_blank" style="display: inline-block; padding: 8px 16px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                                    View Full Details →
                                </a>
                            </div>
                        </div>
                    `;

                    // Show the info window
                    if (infoWindowRef && mapRef) {
                        infoWindowRef.setContent(existingBusinessContent);
                        infoWindowRef.setPosition(position);
                        infoWindowRef.open(mapRef);
                        console.log('✅ Info window opened for existing business');
                    } else {
                        console.error('❌ Missing infoWindow or map reference');
                    }

                    return; // Exit early - don't show "add to database" option
                }
            }

            console.log('❌ NO DUPLICATE FOUND - Business not in database, showing add option');

        } catch (error) {
            console.error('⚠️ Error checking for duplicates:', error);
            // Continue to show add option if there's an error
        }
        // ========== END DUPLICATE CHECK ==========

        // ========== CHAIN INCENTIVE CHECK ==========
        console.log('🔗 Checking for chain match...');
        let chainMatchInfo = null;

        try {
            chainMatchInfo = await searchForChainMatch(businessName);

            if (chainMatchInfo) {
                console.log('✅ Chain match found with incentives!');
            } else {
                console.log('ℹ️ No chain match or no chain incentives available');
            }
        } catch (chainError) {
            console.error('⚠️ Error checking for chain match:', chainError);
            // Continue without chain info if there's an error
        }
        // ========== END CHAIN INCENTIVE CHECK ==========

        // Build chain incentives HTML if available
        let chainIncentivesHtml = '';
        if (chainMatchInfo && chainMatchInfo.incentives && chainMatchInfo.incentives.length > 0) {
            const incentivesListHtml = chainMatchInfo.incentives.map(incentive => {
                // Handle both eligible_categories (new) and type (old) for backward compatibility
                const categories = incentive.eligible_categories || [incentive.type];
                const categoryLabels = categories.map(cat => getServiceTypeLabel(cat)).join(', ');

                return `
                <div style="background: #e8f5e9; border-left: 3px solid #28a745; border-radius: 4px; padding: 8px; margin: 4px 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 12px; font-weight: 600; color: #155724;">
                            ${categoryLabels}
                        </span>
                        <span style="font-size: 14px; font-weight: bold; color: #28a745;">
                            ${incentive.amount}% off
                        </span>
                    </div>
                    ${incentive.information ? `<p style="margin: 0; font-size: 11px; color: #666;">${incentive.information}</p>` : ''}
                </div>
            `;
            }).join('');

            chainIncentivesHtml = `
            <div style="margin-top: 12px; padding: 12px; background: #f0f8ff; border: 2px solid #4CAF50; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                    <span style="font-size: 18px;">🎯</span>
                    <strong style="color: #1976d2; font-size: 14px;">Possible Chain Match!</strong>
                </div>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">
                    This may be part of <strong>"${chainMatchInfo.chain.chain_name}"</strong> which offers:
                </p>
                ${incentivesListHtml}
                <p style="margin: 8px 0 0 0; font-size: 11px; color: #1976d2; font-weight: 500;">
                    💡 Add to database to confirm and access these incentives
                </p>
            </div>
        `;
        }

        const content = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 320px; padding: 4px;">
            <div style="padding: 10px; background: #fff3cd; border-left: 3px solid #ffc107; margin-bottom: 12px; border-radius: 4px;">
                <strong>ℹ️ Not in Database</strong>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">
                    This business is from Google Maps and not yet in the Patriot Thanks database.
                </p>
            </div>
            
            <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #333;">
                ${businessName}
            </h3>
            
            <div style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 12px;">
                ${address ? `<p style="margin: 2px 0;">${address}</p>` : ''}
                ${phone ? `<p style="margin: 6px 0 0 0;">📞 ${phone}</p>` : ''}
            </div>

            ${chainIncentivesHtml}

            <div style="margin-top: 12px; padding: 10px; background: #f0f8ff; border-radius: 6px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">
                    ${chainMatchInfo ? '✨ Add this business to access chain incentives!' : '💡 Want to add this business to Patriot Thanks?'}
                </p>
                <button 
                    id="add-google-place-btn"
                    style="width: 100%; padding: 10px; background: #2196f3; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;"
                    onmouseover="this.style.background='#1976d2'"
                    onmouseout="this.style.background='#2196f3'"
                >
                    ➕ Add to Database
                </button>
            </div>

            ${website ? `
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
                    <a href="${website}" target="_blank" style="color: #2196f3; font-size: 13px; text-decoration: none;">
                        🔗 Visit Website
                    </a>
                </div>
            ` : ''}
        </div>
    `;

        // Get location from place - it's nested in place.Cg.location or place.Gg
        let position;

        if (placeData.location) {
            // The location has lat/lng properties
            position = new window.google.maps.LatLng(
                    placeData.location.lat,
                    placeData.location.lng
            );
        } else if (place.Gg) {
            // Fallback to Gg object which has lat() and lng() functions
            position = new window.google.maps.LatLng(
                    place.Gg.lat(),
                    place.Gg.lng()
            );
        }

        console.log('📍 Setting info window at position:', position);

        if (position && mapRef) {
            infoWindowRef.setContent(content);
            infoWindowRef.setPosition(position);
            infoWindowRef.open(mapRef);

            console.log('✅ Info window opened successfully!');

            // Add click handler for "Add to Database" button after DOM renders
            setTimeout(() => {
                const addBtn = document.getElementById('add-google-place-btn');
                if (addBtn) {
                    addBtn.addEventListener('click', () => {
                        // Prepare data for business-add page
                        const businessData = {
                            bname: businessName,
                            address1: address,
                            address2: '',
                            city: city,
                            state: state,
                            zip: zip,
                            phone: phone,
                            lat: placeData.location?.lat || '',
                            lng: placeData.location?.lng || '',
                            placeId: placeData.id || place.id || '',
                            website: website,
                            // Add chain info if found
                            chainId: chainMatchInfo?.chain?._id || '',
                            chainName: chainMatchInfo?.chain?.chain_name || ''
                        };

                        console.log('📝 Preparing to add Google Place:', businessData);

                        // Store in sessionStorage to pre-fill the form
                        sessionStorage.setItem('prefillBusinessData', JSON.stringify(businessData));

                        // Redirect to add business page
                        router.push('/business-add');
                    });
                }
            }, 100);
        } else {
            console.error('❌ Could not open info window - missing position or map:', {position, map: mapRef});
        }
    };


    // Display businesses on map
    const displayBusinessesOnMap = async (businesses) => {
        if (!map || !businesses.length) return;

        clearMarkers();
        const newMarkers = [];
        const bounds = new window.google.maps.LatLngBounds();

        console.log('📍 Displaying businesses on map:', businesses.length);
        console.log('🔍 Search criteria:', {
            businessName: searchData.businessName,
            address: searchData.address
        });

        for (const business of businesses) {
            // ENHANCED: Determine business type based on search context
            let businessType = 'primary';

            // Check if this is a primary search result (name match from backend)
            const isPrimarySearchResult = business.nameMatches || business.isNameMatch;

            if (isPrimarySearchResult) {
                // This business matches the search criteria - ALWAYS RED (primary)
                businessType = 'primary'; // RED
                business.isPrimaryResult = true;
                business.markerColor = 'primary';
            } else if (searchData.businessName && searchData.businessName.trim()) {
                // Searching by name but this doesn't match - nearby database
                businessType = 'database'; // GREEN
                business.isNearbyDatabase = true;
                business.markerColor = 'database';
            } else {
                // No business name search - determine by type
                if (business.chain_id) {
                    businessType = 'chain'; // ORANGE
                    business.markerColor = 'chain';
                } else {
                    businessType = 'database'; // GREEN
                    business.isNearbyDatabase = true;
                    business.markerColor = 'database';
                }
            }

            // Override with Google Places color if from Google (lowest priority)
            if (business.isGooglePlace || business._id?.toString().startsWith('google_')) {
                businessType = 'nearby'; // BLUE
                business.markerColor = 'nearby';
            }

            console.log(`🎨 ${business.bname}: ${businessType.toUpperCase()} marker (${business.markerColor}) - Primary: ${business.isPrimaryResult || false}, Chain: ${!!business.chain_id}, NameMatch: ${business.nameMatches || false}`);

            const marker = await createBusinessMarker(business, businessType);
            if (marker) {
                newMarkers.push(marker);

                // Add to bounds
                let position;
                if (marker.position) {
                    position = marker.position;
                } else if (business.coordinates?.lat && business.coordinates?.lng) {
                    position = new window.google.maps.LatLng(
                            parseFloat(business.coordinates.lat),
                            parseFloat(business.coordinates.lng)
                    );
                } else if (business.lat && business.lng) {
                    position = new window.google.maps.LatLng(
                            parseFloat(business.lat),
                            parseFloat(business.lng)
                    );
                }

                if (position) {
                    bounds.extend(position);
                }
            }
        }

        setMarkers(newMarkers);

        // Fit map to show all markers
        if (newMarkers.length > 0) {
            if (newMarkers.length === 1) {
                map.setCenter(bounds.getCenter());
                map.setZoom(15);
            } else {
                map.fitBounds(bounds);

                // Ensure zoom isn't too close
                window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
                    if (map.getZoom() > 16) {
                        map.setZoom(16);
                    }
                });
            }
        }

        console.log('✅ Map display complete:', newMarkers.length, 'markers created');
    };

    // Reset map view
    const resetMapView = () => {
        if (map) {
            map.setCenter(mapConfig.center);
            map.setZoom(mapConfig.zoom);
        }
    };

    // Geocode an address to get coordinates
    const geocodeAddress = async (addressString) => {
        try {
            console.log('🗺️ Geocoding address:', addressString);

            const geocoder = new google.maps.Geocoder();

            return new Promise((resolve, reject) => {
                geocoder.geocode({ address: addressString }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const location = results[0].geometry.location;
                        const coords = {
                            lat: location.lat(),
                            lng: location.lng()
                        };
                        console.log('✅ Geocoded to:', coords);
                        resolve(coords);
                    } else {
                        console.warn('❌ Geocoding failed:', status);
                        resolve(null);
                    }
                });
            });
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    };

    // Handle "Use My Location" button
    const handleUseMyLocation = async () => {
        setGettingLocation(true);

        try {
            // Check if geolocation is supported
            if (!navigator.geolocation) {
                alert('Geolocation is not supported by your browser. Please enter your location manually.');
                setGettingLocation(false);
                return;
            }

            // Request user's location
            navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        console.log('📍 Got user location:', { latitude, longitude });

                        // Reverse geocode to get address
                        try {
                            if (window.google && window.google.maps) {
                                const geocoder = new window.google.maps.Geocoder();
                                const latlng = { lat: latitude, lng: longitude };

                                geocoder.geocode({ location: latlng }, async (results, status) => {
                                    if (status === 'OK' && results[0]) {
                                        // Extract city, state, and zip from the result
                                        let city = '';
                                        let state = '';
                                        let zip = '';

                                        results[0].address_components.forEach(component => {
                                            if (component.types.includes('locality')) {
                                                city = component.long_name;
                                            }
                                            if (component.types.includes('administrative_area_level_1')) {
                                                state = component.short_name;
                                            }
                                            if (component.types.includes('postal_code')) {
                                                zip = component.long_name;
                                            }
                                        });

                                        // Format as "City, State Zip" or just use formatted_address
                                        const formattedLocation = city && state
                                                ? `${city}, ${state}${zip ? ' ' + zip : ''}`
                                                : results[0].formatted_address;

                                        console.log('✅ Reverse geocoded to:', formattedLocation);

                                        // Update the address field
                                        setSearchData(prev => ({
                                            ...prev,
                                            address: formattedLocation
                                        }));

                                        setGettingLocation(false);

                                        // Optionally auto-trigger search
                                        // Uncomment the next line if you want to automatically search after getting location
                                        // document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                                    } else {
                                        console.error('Reverse geocoding failed:', status);
                                        alert('Could not determine your address. Please enter it manually.');
                                        setGettingLocation(false);
                                    }
                                });
                            } else {
                                console.error('Google Maps not loaded');
                                alert('Maps service not ready. Please try again or enter your location manually.');
                                setGettingLocation(false);
                            }
                        } catch (error) {
                            console.error('Reverse geocoding error:', error);
                            alert('Error determining your address. Please enter it manually.');
                            setGettingLocation(false);
                        }
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        let errorMessage = 'Could not get your location. ';

                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage += 'Please enable location permissions in your browser settings.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage += 'Location information is unavailable.';
                                break;
                            case error.TIMEOUT:
                                errorMessage += 'Location request timed out.';
                                break;
                            default:
                                errorMessage += 'Please enter your location manually.';
                        }

                        alert(errorMessage);
                        setGettingLocation(false);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
            );
        } catch (error) {
            console.error('Error getting location:', error);
            alert('Error accessing location services. Please enter your location manually.');
            setGettingLocation(false);
        }
    };

    // Handle search
    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setHasSearched(true);
        setLoadingStep(1);
        setLoadingProgress(0);
        setLoadingMessage('Finding location for your address...');

        try {
            const params = new URLSearchParams();

            // Primary search fields
            if (searchData.businessName) params.append('businessName', searchData.businessName);

            // Parse and geocode the address field
            if (searchData.address && searchData.address.trim()) {
                const addressValue = searchData.address.trim();

                // Pattern 1: "City, State Zip" or "City State Zip" (e.g., "Cedar Rapids, IA 52402")
                const cityStateZipPattern = /^(.+?)[,\s]+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i;
                const cityStateZipMatch = addressValue.match(cityStateZipPattern);

                // Pattern 2: "City, State" or "City State" (e.g., "Cedar Rapids, IA")
                const cityStatePattern = /^(.+?)[,\s]+([A-Z]{2})$/i;
                const cityStateMatch = addressValue.match(cityStatePattern);

                // Pattern 3: Just zip code (e.g., "52402")
                const zipPattern = /^\d{5}(?:-\d{4})?$/;
                const isZipOnly = zipPattern.test(addressValue);

                let addressForGeocoding = addressValue;

                if (cityStateZipMatch) {
                    // Format: "City, State Zip"
                    const city = cityStateZipMatch[1].trim();
                    const state = cityStateZipMatch[2].trim().toUpperCase();
                    const zip = cityStateZipMatch[3].trim();
                    params.append('city', city);
                    params.append('state', state);
                    params.append('zip', zip);
                    addressForGeocoding = `${city}, ${state} ${zip}`;
                    console.log('Parsed as City/State/Zip:', city, state, zip);
                } else if (cityStateMatch) {
                    // Format: "City, State"
                    const city = cityStateMatch[1].trim();
                    const state = cityStateMatch[2].trim().toUpperCase();
                    params.append('city', city);
                    params.append('state', state);
                    addressForGeocoding = `${city}, ${state}`;
                    console.log('Parsed as City/State:', city, state);
                } else if (isZipOnly) {
                    // Format: Just zip code
                    params.append('zip', addressValue);
                    addressForGeocoding = addressValue;
                    console.log('Sent as zip:', addressValue);
                } else {
                    // Not a recognized format - send as address search
                    params.append('address', addressValue);
                    addressForGeocoding = addressValue;
                    console.log('Sent as address:', addressValue);
                }

                // Geocode the address to get coordinates for proximity search
                if (window.google && window.google.maps) {
                    setLoadingMessage('Finding location coordinates...');
                    const coords = await geocodeAddress(addressForGeocoding);

                    if (coords) {
                        params.append('lat', coords.lat);
                        params.append('lng', coords.lng);
                        params.append('radius', '25'); // 25 miles radius
                        console.log('✅ Added coordinates for proximity search:', coords);
                    } else {
                        console.warn('⚠️ Could not geocode address, will search without proximity');
                    }
                }
            }

            // Legacy/additional search fields for backward compatibility
            if (searchData.query) params.append('q', searchData.query);
            if (searchData.category) params.append('category', searchData.category);
            // Note: Service type filter removed - all service types shown by default

            // Step 2: Searching Database
            setLoadingStep(2);
            setLoadingProgress(25);
            setLoadingMessage('Searching our database for businesses...');

            const response = await fetch(`/api/search?${params}`);
            const data = await response.json();

            if (response.ok) {
                const allResults = data.results || [];
                setResults(allResults);

                // Step 3: Finding Additional Locations
                setLoadingStep(3);
                setLoadingProgress(65);
                setLoadingMessage('Finding additional locations from Google Maps...');

                // Simulate additional search time
                await new Promise(resolve => setTimeout(resolve, 500));

                // Step 4: Organizing Results
                setLoadingStep(4);
                setLoadingProgress(90);
                setLoadingMessage('Organizing and preparing results...');

                // Sort results: exact category matches first, then nearby businesses
                const sortedResults = sortResultsByRelevance(allResults, searchData.category);
                // Apply filter based on toggle
                filterResults(sortedResults, showOnlyWithIncentives);

                // COMMENTED OUT: Display results on map
                if (mapInitialized) {
                    await displayBusinessesOnMap(data.results || []);
                }
            } else {
                console.error('Search error:', data.error);
                setResults([]);
                setFilteredResults([]);
            }
            // Complete
            setLoadingProgress(100);
            setLoadingMessage('Search completed successfully!');

            // Brief delay to show completion
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setLoading(false);
            setLoading(false);
            setLoadingStep(1);
            setLoadingProgress(0);

            // Auto-scroll to results after search completes
            setTimeout(() => {
                const resultsElement = document.getElementById('search-results');
                if (resultsElement) {
                    resultsElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                        inline: 'nearest'
                    });
                }
            }, 100);
        }
    };

    // Sort results by relevance: exact category matches first, then others
    // Also mark businesses by zip code for display separators
    const sortResultsByRelevance = (results, selectedCategory) => {
        if (!results || results.length === 0) return results;

        // Determine the primary search zip (most common zip in first few results)
        const searchZip = searchData.address && /^\d{5}/.test(searchData.address.trim())
                ? searchData.address.trim().match(/^\d{5}/)[0]
                : null;

        // Mark businesses based on criteria
        results.forEach((business, index) => {
            // Mark if it matches the category filter
            business.isExactMatch = selectedCategory && business.type === selectedCategory;

            // Mark if it matches the search zip
            business.isInSearchZip = searchZip && business.zip && business.zip.startsWith(searchZip);

            // Mark if it's a name match (backend provides this)
            business.isNameMatch = business.nameMatches || false;
        });

        if (!selectedCategory || selectedCategory === '') {
            // No category filter - just return with zip markings
            return results;
        }

        // Separate exact category matches from nearby businesses
        const exactMatches = results.filter(b => b.isExactMatch);
        const nearbyBusinesses = results.filter(b => !b.isExactMatch);

        // Return exact matches first, then nearby businesses
        return [...exactMatches, ...nearbyBusinesses];
    };

    // Filter results based on incentives toggle
    const filterResults = (resultsToFilter, onlyWithIncentives) => {
        if (onlyWithIncentives) {
            const filtered = resultsToFilter.filter(business =>
                    business.incentives && business.incentives.length > 0
            );
            setFilteredResults(filtered);
        } else {
            setFilteredResults(resultsToFilter);
        }
    };

    // Update filtered results when toggle changes
    useEffect(() => {
        if (results.length > 0) {
            filterResults(results, showOnlyWithIncentives);
        }
    }, [showOnlyWithIncentives, results]);

    const handleInputChange = (e) => {
        setSearchData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
            <>
                {/* COMMENTED OUT: Map-related CSS - Keep for future implementation */}
                <style jsx global>{`
                    #map-container {
                        width: 90%;
                        margin: 20px auto;
                        clear: both;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        padding: 1.5rem;
                        margin-bottom: 2rem;
                    }

                    .map-controls {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                        padding: 0 5px;
                    }

                    .caveat {
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: #1f2937;
                        margin: 0;
                    }

                    .btn {
                        padding: 0.5rem 1rem;
                        border-radius: 0.375rem;
                        font-weight: 500;
                        text-align: center;
                        cursor: pointer;
                        border: none;
                        transition: all 0.2s ease;
                    }

                    .btn-secondary {
                        background-color: #6b7280;
                        color: white;
                    }

                    .btn-secondary:hover {
                        background-color: #4b5563;
                    }

                    .btn-sm {
                        padding: 0.375rem 0.75rem;
                        font-size: 0.875rem;
                    }

                    #map {
                        width: 100%;
                        height: 800px !important;
                        min-height: 800px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        margin: 10px 0;
                        position: relative;
                    }

                    // Map Legend Styles - Matching Original
                    .map-legend {
                        display: flex;
                        justify-content: center;
                        gap: 20px;
                        margin-top: 10px;
                        padding: 10px;
                        background-color: #f8f9fa;
                        border-radius: 4px;
                        border: 1px solid #dee2e6;
                    }

                    .legend-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 14px;
                    }

                    .legend-color {
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        border: 2px solid white;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                    }

                    .legend-color.primary {
                        background-color: #EA4335;
                    }

                    .legend-color.database {
                        background-color: #28a745;
                    }

                    .legend-color.nearby {
                        background-color: #4285F4;
                    }

                    .legend-color.chain {
                        background-color: #FF9800;
                    }

                    // Custom Marker Styles - Matching Original Implementation
                    .custom-marker {
                        cursor: pointer;
                        z-index: 100;
                    }

                    .marker-pin {
                        width: 24px;
                        height: 30px;
                        border-radius: 50% 50% 50% 0;
                        transform: rotate(-45deg);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        border: 2px solid white;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                    }

                    .marker-icon {
                        transform: rotate(45deg);
                        font-size: 12px;
                    }

                    // Enhanced marker styles for better visibility
                    .enhanced-custom-marker {
                        cursor: pointer;
                        z-index: 100;
                    }

                    .enhanced-marker-container {
                        position: relative;
                        width: 36px;
                        height: 46px;
                    }

                    .enhanced-marker-pin {
                        width: 32px;
                        height: 40px;
                        border-radius: 50% 50% 50% 0;
                        transform: rotate(-45deg);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
                        position: absolute;
                        top: 0;
                        left: 2px;
                        border: 2px solid white;
                    }

                    .enhanced-marker-pin.primary {
                        background: linear-gradient(45deg, #EA4335, #FF6B6B);
                    }

                    .enhanced-marker-pin.database {
                        background: linear-gradient(45deg, #28a745, #4caf50);
                    }

                    .enhanced-marker-pin.nearby {
                        background: linear-gradient(45deg, #4285F4, #64B5F6);
                    }

                    .enhanced-marker-pin.chain {
                        background: linear-gradient(45deg, #FF9800, #FFB74D);
                    }

                    .enhanced-marker-icon {
                        transform: rotate(45deg);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 20px;
                        height: 20px;
                        font-size: 16px;
                        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
                    }

                    .enhanced-marker-shadow {
                        position: absolute;
                        bottom: -2px;
                        left: 8px;
                        width: 20px;
                        height: 8px;
                        background: radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%);
                        border-radius: 50%;
                        filter: blur(1px);
                    }

                    // Info window styles
                    .info-window-content {
                        padding: 10px;
                        max-width: 300px;
                    }

                    .info-window-content h3 {
                        margin: 0 0 10px 0;
                        color: #333;
                        font-size: 16px;
                    }

                    .business-address p {
                        margin: 2px 0;
                        color: #666;
                        font-size: 14px;
                    }

                    .business-incentives h4 {
                        margin: 10px 0 5px 0;
                        color: #333;
                        font-size: 14px;
                    }

                    .incentive-item {
                        background: #e8f5e8;
                        border: 1px solid #c3e6c3;
                        border-radius: 4px;
                        padding: 5px;
                        margin: 5px 0;
                        font-size: 12px;
                    }

                    .no-incentives {
                        color: #666;
                        font-style: italic;
                        font-size: 12px;
                    }

                    // Responsive adjustments
                    @media (max-width: 768px) {
                        #map-container {
                            width: 95%;
                            padding: 1rem;
                        }

                        #map {
                            height: 400px !important;
                            min-height: 400px;
                        }

                        .map-controls {
                            flex-direction: column;
                            gap: 10px;
                            text-align: center;
                        }

                        .map-legend {
                            flex-direction: column;
                            gap: 10px;
                        }
                    }

                    @media (max-width: 480px) {
                        #map {
                            height: 300px !important;
                            min-height: 300px;
                        }
                    }
                `}</style>

                <div className="min-h-screen bg-gray-50">
                    <SearchLoadingModal
                            isVisible={loading}
                            currentStep={loadingStep}
                            progress={loadingProgress}
                            message={loadingMessage}
                            onCancel={() => {
                                setLoading(false);
                                setLoadingStep(1);
                                setLoadingProgress(0);
                            }}
                    />
                    <Navigation />

                    <div className="pt-20 pb-12">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            {/* Header */}
                            <div className="text-center mb-12">
                                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                                    Find Businesses That Support Our Heroes
                                </h1>
                                <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
                                    Search for local businesses offering discounts and incentives to military personnel, veterans, and first responders.
                                </p>

                                {/* Search Tips */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-4xl mx-auto">
                                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Quick Search Tips: Must include include at least one search item </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                                        <div>
                                            <strong>Business Name:</strong> "Olive Garden", "McDonald's", "Home Depot"
                                        </div>
                                        <div>
                                            <strong>Location:</strong> "Cedar Rapids IA", "52402", "Portland OR 97201", or Select "Near Me"
                                        </div>
                                        <div>
                                            <strong>Keywords:</strong> "restaurant", "automotive", "grocery store"
                                        </div>
                                        <div>
                                            <strong>Category:</strong> Use the dropdown to filter by specific business types
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Search Form */}
                            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                                <form onSubmit={handleSearch} className="space-y-6">
                                    {/* Primary Search Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                                                Business Name
                                            </label>
                                            <input
                                                    type="text"
                                                    id="businessName"
                                                    name="businessName"
                                                    value={searchData.businessName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="e.g. Olive Garden, McDonald's, Home Depot"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Search for specific business names or chains</p>
                                        </div>

                                        <div>
                                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                                                Address, City & State, or Zip Code
                                            </label>
                                            <div className="relative">
                                                <input
                                                        type="text"
                                                        id="address"
                                                        name="address"
                                                        value={searchData.address}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 pr-32 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="e.g. 52402, Cedar Rapids IA, Portland OR, 1234 Main St"
                                                />
                                                <button
                                                        type="button"
                                                        onClick={handleUseMyLocation}
                                                        disabled={loading}
                                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                                        title="Use my current location"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    Near Me
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Street address, city with state (Portland OR), or zip code</p>
                                        </div>
                                    </div>

                                    {/* Filter Options */}
                                    <div className="border-t pt-4">
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">Filter Options</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Keywords
                                                </label>
                                                <input
                                                        type="text"
                                                        id="query"
                                                        name="query"
                                                        value={searchData.query}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="restaurant, automotive, grocery, etc."
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Search by business type (e.g., restaurant, automotive, hotel)</p>
                                            </div>

                                            <div>
                                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Category
                                                </label>
                                                <select
                                                        id="category"
                                                        name="category"
                                                        value={searchData.category}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    {businessTypes.map(type => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-gray-500 mt-1">Select a specific business category</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                                            <p className="text-xs text-blue-800">
                                                <strong>Note:</strong> All service types (Veterans, Active Duty, First Responders, and Spouses) are shown by default.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-center">
                                        <button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-red-600 text-white px-8 py-3 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 font-medium"
                                        >
                                            {loading ? 'Searching...' : 'Search Businesses'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* COMMENTED OUT: Google Maps Container - Keep for future implementation */}

                            <div id="map-container">
                                <div className="map-controls">
                                    <div>
                                        <h3 className="caveat">Business Map</h3>
                                    </div>
                                    <div>
                                        <button
                                                id="reset-map"
                                                className="btn btn-sm btn-secondary"
                                                onClick={resetMapView}
                                        >
                                            Reset Map View
                                        </button>
                                    </div>
                                </div>
                                <div id="map" style={{height: '800px', minHeight: '800px'}}></div>

                                <div className="map-legend" style={{
                                    background: 'white',
                                    padding: '20px',
                                    margin: '15px 0',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
                                }}>
                                    {/* Header */}
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        marginBottom: '15px',
                                        color: '#333',
                                        paddingBottom: '10px',
                                        borderBottom: '2px solid #e0e0e0'
                                    }}>
                                        📍 Patriot Thanks Database Markers (Custom Pins)
                                    </div>

                                    {/* Red Pin */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '12px',
                                        fontSize: '14px'
                                    }}>
                                        <div style={{
                                            width: '24px',
                                            height: '30px',
                                            marginRight: '12px',
                                            position: 'relative',
                                            flexShrink: 0
                                        }}>
                                            <div style={{
                                                width: '24px',
                                                height: '30px',
                                                borderRadius: '50% 50% 50% 0',
                                                background: '#EA4335',
                                                transform: 'rotate(-45deg)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                            }}></div>
                                        </div>
                                        <span style={{ lineHeight: '1.4' }}>
            <strong style={{ color: '#EA4335' }}>Red Pin:</strong> Primary Search Results
        </span>
                                    </div>

                                    {/* Green Pin */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '12px',
                                        fontSize: '14px'
                                    }}>
                                        <div style={{
                                            width: '24px',
                                            height: '30px',
                                            marginRight: '12px',
                                            position: 'relative',
                                            flexShrink: 0
                                        }}>
                                            <div style={{
                                                width: '24px',
                                                height: '30px',
                                                borderRadius: '50% 50% 50% 0',
                                                background: '#28a745',
                                                transform: 'rotate(-45deg)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                            }}></div>
                                        </div>
                                        <span style={{ lineHeight: '1.4' }}>
            <strong style={{ color: '#28a745' }}>Green Pin:</strong> Nearby Database Businesses
        </span>
                                    </div>

                                    {/* Blue Pin */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '12px',
                                        fontSize: '14px'
                                    }}>
                                        <div style={{
                                            width: '24px',
                                            height: '30px',
                                            marginRight: '12px',
                                            position: 'relative',
                                            flexShrink: 0
                                        }}>
                                            <div style={{
                                                width: '24px',
                                                height: '30px',
                                                borderRadius: '50% 50% 50% 0',
                                                background: '#4285F4',
                                                transform: 'rotate(-45deg)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                            }}></div>
                                        </div>
                                        <span style={{ lineHeight: '1.4' }}>
            <strong style={{ color: '#4285F4' }}>Blue Pin:</strong> Additional Locations Found
        </span>
                                    </div>

                                    {/* Orange Pin */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '12px',
                                        fontSize: '14px'
                                    }}>
                                        <div style={{
                                            width: '24px',
                                            height: '30px',
                                            marginRight: '12px',
                                            position: 'relative',
                                            flexShrink: 0
                                        }}>
                                            <div style={{
                                                width: '24px',
                                                height: '30px',
                                                borderRadius: '50% 50% 50% 0',
                                                background: '#FF9800',
                                                transform: 'rotate(-45deg)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                            }}></div>
                                        </div>
                                        <span style={{ lineHeight: '1.4' }}>
            <strong style={{ color: '#FF9800' }}>Orange Pin:</strong> Chain Businesses
        </span>
                                    </div>

                                    {/* Divider */}
                                    <div style={{
                                        height: '1px',
                                        background: '#e0e0e0',
                                        margin: '15px 0'
                                    }}></div>

                                    {/* Google Maps Header */}
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        marginBottom: '15px',
                                        color: '#333',
                                        paddingBottom: '10px',
                                        borderBottom: '2px solid #e0e0e0'
                                    }}>
                                        ⭕ Google Maps Markers (Round Icons)
                                    </div>

                                    {/* Google Round Marker */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '12px',
                                        fontSize: '14px'
                                    }}>
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            marginRight: '12px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)',
                                            border: '2px solid white',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                            flexShrink: 0
                                        }}></div>
                                        <span style={{ lineHeight: '1.4' }}>
            Businesses from Google Maps (not in our database yet)
        </span>
                                    </div>

                                    {/* Note */}
                                    <div style={{
                                        marginTop: '15px',
                                        padding: '12px',
                                        background: '#f0f8ff',
                                        borderLeft: '3px solid #4285F4',
                                        fontSize: '13px',
                                        color: '#666',
                                        borderRadius: '4px',
                                        lineHeight: '1.5'
                                    }}>
                                        💡 <em>Click any Google Maps marker to add that business to our database!</em>
                                    </div>
                                </div>
                            </div>

                            {/* Placeholder for Map - Shows when Maps would be displayed */}
                            {/*
                            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                                <div className="text-center py-12">
                                    <div className="text-gray-400 mb-4">
                                        <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Map View Coming Soon</h3>
                                    <p className="text-gray-600">Interactive map functionality will be available in a future update.</p>
                                </div>
                            </div>
                            */}
                            {/* Results */}
                            {hasSearched && (
                                    <div id="search-results">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    Search Results
                                                </h2>
                                                <span className="text-gray-600">
                                                    {filteredResults.length} of {results.length} businesses shown
                                                    {showOnlyWithIncentives && filteredResults.length === 0 && results.length > 0 && (
                                                            <span className="block text-amber-600 font-medium mt-1">
                                                                No businesses with incentives available
                                                            </span>
                                                    )}
                                                    {/* Show message when name matches exist but are filtered out */}
                                                    {showOnlyWithIncentives &&
                                                            searchData.businessName &&
                                                            results.some(b => b.nameMatches) &&
                                                            !filteredResults.some(b => b.isNameMatch) && (
                                                                    <span className="block text-blue-600 font-medium mt-1">
                                                                        💡 {searchData.businessName} locations found but don't offer incentives. Toggle off "Only show businesses with incentives" to see them.
                                                                    </span>
                                                            )}
                                                    {/* Helpful tip for category-only searches */}
                                                    {searchData.category && !searchData.address && !searchData.businessName && results.length > 0 && (
                                                            <span className="block text-blue-600 font-medium mt-1">
                                                                💡 Tip: Add a location (zip code or city) to find {businessTypes.find(t => t.value === searchData.category)?.label.toLowerCase() || 'businesses'} near you
                                                            </span>
                                                    )}
                                                </span>
                                            </div>

                                            {/* Toggle for businesses with/without incentives */}
                                            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-gray-300 shadow-sm">
                                                <span className="text-sm font-medium text-gray-700">
                                                    Only show businesses with incentives
                                                </span>
                                                <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={showOnlyWithIncentives}
                                                        onClick={() => setShowOnlyWithIncentives(!showOnlyWithIncentives)}
                                                        className="relative inline-flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                                        style={{
                                                            width: '44px',
                                                            height: '24px',
                                                            backgroundColor: showOnlyWithIncentives ? '#16a34a' : '#d1d5db',
                                                            transition: 'background-color 200ms'
                                                        }}
                                                >
                                                    <span
                                                            className="inline-block rounded-full bg-white shadow-lg"
                                                            style={{
                                                                width: '16px',
                                                                height: '16px',
                                                                transform: showOnlyWithIncentives ? 'translateX(24px)' : 'translateX(4px)',
                                                                transition: 'transform 200ms'
                                                            }}
                                                    />
                                                </button>
                                            </div>
                                        </div>


                                        {loading ? (
                                                <div className="text-center py-12">
                                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                                                    <p className="mt-4 text-gray-600">Searching...</p>
                                                </div>
                                        ) : filteredResults.length > 0 ? (
                                                <div>
                                                    {/* Helper function to determine if we need a zip separator */}
                                                    {(() => {
                                                        const showZipSeparator = (index) => {
                                                            if (index === 0) return false;
                                                            const current = filteredResults[index];
                                                            const previous = filteredResults[index - 1];

                                                            // Show separator when transitioning from search zip to other zips
                                                            return previous.isInSearchZip && !current.isInSearchZip;
                                                        };

                                                        return null; // This is just to define the function
                                                    })()}

                                                    {/* Show exact category matches first */}
                                                    {searchData.category && filteredResults.some(b => b.isExactMatch) && (
                                                            <>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                                                    {filteredResults.filter(b => b.isExactMatch).map((business) => (
                                                                            <div
                                                                                    key={business._id}
                                                                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                                                                    onClick={() => router.push(`/business/${business._id}`)}
                                                                                    style={{ cursor: 'pointer' }}
                                                                            >
                                                                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                                                    {business.bname}
                                                                                </h3>

                                                                                <div className="text-gray-600 mb-4">
                                                                                    <p>{business.address1}</p>
                                                                                    {business.address2 && <p>{business.address2}</p>}
                                                                                    <p>{business.city}, {business.state} {business.zip}</p>
                                                                                    {business.phone && <p className="mt-1">📞 {business.phone}</p>}
                                                                                </div>

                                                                                {business.incentives && business.incentives.length > 0 && (
                                                                                        <div className="border-t pt-4">
                                                                                            <h4 className="font-semibold text-gray-900 mb-2">Available Incentives:</h4>
                                                                                            {business.incentives.map((incentive, index) => (
                                                                                                    <div key={index} className="bg-green-50 border border-green-200 rounded-md p-3 mb-2">
                                                                                                        <div className="flex items-center justify-between mb-1">
                                                                                                            <span className="text-sm font-medium text-green-800">
                                                                                                                {incentive.type === 'VT' && 'Veterans'}
                                                                                                                {incentive.type === 'AD' && 'Active Duty'}
                                                                                                                {incentive.type === 'FR' && 'First Responders'}
                                                                                                                {incentive.type === 'SP' && 'Spouses'}
                                                                                                            </span>
                                                                                                            <span className="text-lg font-bold text-green-700">
                                                                                                                {incentive.amount}% off
                                                                                                            </span>
                                                                                                        </div>
                                                                                                        <p className="text-sm text-gray-700">{incentive.information}</p>
                                                                                                    </div>
                                                                                            ))}
                                                                                        </div>
                                                                                )}

                                                                                {(!business.incentives || business.incentives.length === 0) && (
                                                                                        <div className="border-t pt-4">
                                                                                            <p className="text-gray-500 text-sm">No specific incentives listed</p>
                                                                                        </div>
                                                                                )}
                                                                                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
                                                                                    <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                router.push(`/business/${business._id}`);
                                                                                            }}
                                                                                            style={{
                                                                                                width: '100%',
                                                                                                padding: '10px',
                                                                                                backgroundColor: '#007bff',
                                                                                                color: 'white',
                                                                                                border: 'none',
                                                                                                borderRadius: '6px',
                                                                                                cursor: 'pointer',
                                                                                                fontWeight: 'bold',
                                                                                                fontSize: '14px'
                                                                                            }}
                                                                                    >
                                                                                        View Details →
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                    ))}
                                                                </div>

                                                                {/* Separator for nearby businesses */}
                                                                {filteredResults.some(b => !b.isExactMatch) && (
                                                                        <div className="my-8">
                                                                            <div className="relative">
                                                                                <div className="absolute inset-0 flex items-center">
                                                                                    <div className="w-full border-t-2 border-gray-300"></div>
                                                                                </div>
                                                                                <div className="relative flex justify-center">
                                                                                    <span className="bg-gray-50 px-6 py-2 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                                                                        Additional Nearby Businesses
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                )}
                                                            </>
                                                    )}

                                                    {/* Show all businesses if no category filter, or nearby businesses after exact matches */}
                                                    {(() => {
                                                        const businessesToShow = filteredResults.filter(b => !searchData.category || !b.isExactMatch);

                                                        // Separate name-matching businesses from other businesses
                                                        const nameMatches = businessesToShow.filter(b => b.isNameMatch);
                                                        const otherBusinesses = businessesToShow.filter(b => !b.isNameMatch);

                                                        // Check if we should show the separator
                                                        // Show it if: (1) we have both name matches AND other businesses, OR
                                                        //             (2) we searched for a business name and have other businesses (even if name matches are filtered out)
                                                        const hasNameMatchesInFullResults = searchData.businessName && results.some(b => b.nameMatches);
                                                        const showSeparator = (nameMatches.length > 0 && otherBusinesses.length > 0) ||
                                                                (hasNameMatchesInFullResults && otherBusinesses.length > 0 && nameMatches.length === 0);

                                                        return (
                                                                <>
                                                                    {/* Name-matching businesses first */}
                                                                    {nameMatches.length > 0 && (
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                                                                {nameMatches.map((business) => (
                                                                                        <div
                                                                                                key={business._id}
                                                                                                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                                                                                onClick={() => router.push(`/business/${business._id}`)}
                                                                                                style={{ cursor: 'pointer' }}
                                                                                        >
                                                                                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                                                                {business.bname}
                                                                                            </h3>

                                                                                            <div className="text-gray-600 mb-4">
                                                                                                <p>{business.address1}</p>
                                                                                                {business.address2 && <p>{business.address2}</p>}
                                                                                                <p>{business.city}, {business.state} {business.zip}</p>
                                                                                                {business.phone && <p className="mt-1">📞 {business.phone}</p>}
                                                                                                {business.distanceFromSearch && (
                                                                                                        <p className="mt-1 text-sm text-blue-600">
                                                                                                            📍 {business.distanceFromSearch.toFixed(1)} miles away
                                                                                                        </p>
                                                                                                )}
                                                                                            </div>

                                                                                            {business.incentives && business.incentives.length > 0 && (
                                                                                                    <div className="border-t pt-4">
                                                                                                        <h4 className="font-semibold text-gray-900 mb-2">Available Incentives:</h4>
                                                                                                        {business.incentives.map((incentive, idx) => (
                                                                                                                <div key={idx} className="bg-green-50 border border-green-200 rounded-md p-3 mb-2">
                                                                                                                    <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-green-800">
                                                    {incentive.type === 'VT' && 'Veterans'}
                                                    {incentive.type === 'AD' && 'Active Duty'}
                                                    {incentive.type === 'FR' && 'First Responders'}
                                                    {incentive.type === 'SP' && 'Spouses'}
                                                </span>
                                                                                                                        <span className="text-lg font-bold text-green-700">
                                                    {incentive.amount}% off
                                                </span>
                                                                                                                    </div>
                                                                                                                    <p className="text-sm text-gray-700">{incentive.information}</p>
                                                                                                                </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                            )}

                                                                                            {(!business.incentives || business.incentives.length === 0) && (
                                                                                                    <div className="border-t pt-4">
                                                                                                        <p className="text-gray-500 text-sm">No specific incentives listed</p>
                                                                                                    </div>
                                                                                            )}

                                                                                            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
                                                                                                <button
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            router.push(`/business/${business._id}`);
                                                                                                        }}
                                                                                                        style={{
                                                                                                            width: '100%',
                                                                                                            padding: '10px',
                                                                                                            backgroundColor: '#007bff',
                                                                                                            color: 'white',
                                                                                                            border: 'none',
                                                                                                            borderRadius: '6px',
                                                                                                            cursor: 'pointer',
                                                                                                            fontWeight: 'bold',
                                                                                                            fontSize: '14px'
                                                                                                        }}
                                                                                                >
                                                                                                    View Details →
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                ))}
                                                                            </div>
                                                                    )}

                                                                    {/* Separator between name matches and other businesses */}
                                                                    {showSeparator && (
                                                                            <div className="my-8">
                                                                                <div className="relative">
                                                                                    <div className="absolute inset-0 flex items-center">
                                                                                        <div className="w-full border-t-2 border-gray-300"></div>
                                                                                    </div>
                                                                                    <div className="relative flex justify-center">
                            <span className="bg-gray-50 px-6 py-2 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                Other Nearby Businesses
                            </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                    )}

                                                                    {/* Other nearby businesses */}
                                                                    {otherBusinesses.length > 0 && (
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                                                {otherBusinesses.map((business) => (
                                                                                        <div
                                                                                                key={business._id}
                                                                                                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                                                                                onClick={() => router.push(`/business/${business._id}`)}
                                                                                                style={{ cursor: 'pointer' }}
                                                                                        >
                                                                                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                                                                {business.bname}
                                                                                            </h3>

                                                                                            <div className="text-gray-600 mb-4">
                                                                                                <p>{business.address1}</p>
                                                                                                {business.address2 && <p>{business.address2}</p>}
                                                                                                <p>{business.city}, {business.state} {business.zip}</p>
                                                                                                {business.phone && <p className="mt-1">📞 {business.phone}</p>}
                                                                                                {business.distanceFromSearch && (
                                                                                                        <p className="mt-1 text-sm text-blue-600">
                                                                                                            📍 {business.distanceFromSearch.toFixed(1)} miles away
                                                                                                        </p>
                                                                                                )}
                                                                                            </div>

                                                                                            {business.incentives && business.incentives.length > 0 && (
                                                                                                    <div className="border-t pt-4">
                                                                                                        <h4 className="font-semibold text-gray-900 mb-2">Available Incentives:</h4>
                                                                                                        {business.incentives.map((incentive, idx) => (
                                                                                                                <div key={idx} className="bg-green-50 border border-green-200 rounded-md p-3 mb-2">
                                                                                                                    <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-green-800">
                                                    {incentive.type === 'VT' && 'Veterans'}
                                                    {incentive.type === 'AD' && 'Active Duty'}
                                                    {incentive.type === 'FR' && 'First Responders'}
                                                    {incentive.type === 'SP' && 'Spouses'}
                                                </span>
                                                                                                                        <span className="text-lg font-bold text-green-700">
                                                    {incentive.amount}% off
                                                </span>
                                                                                                                    </div>
                                                                                                                    <p className="text-sm text-gray-700">{incentive.information}</p>
                                                                                                                </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                            )}

                                                                                            {(!business.incentives || business.incentives.length === 0) && (
                                                                                                    <div className="border-t pt-4">
                                                                                                        <p className="text-gray-500 text-sm">No specific incentives listed</p>
                                                                                                    </div>
                                                                                            )}

                                                                                            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
                                                                                                <button
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            router.push(`/business/${business._id}`);
                                                                                                        }}
                                                                                                        style={{
                                                                                                            width: '100%',
                                                                                                            padding: '10px',
                                                                                                            backgroundColor: '#007bff',
                                                                                                            color: 'white',
                                                                                                            border: 'none',
                                                                                                            borderRadius: '6px',
                                                                                                            cursor: 'pointer',
                                                                                                            fontWeight: 'bold',
                                                                                                            fontSize: '14px'
                                                                                                        }}
                                                                                                >
                                                                                                    View Details →
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                ))}
                                                                            </div>
                                                                    )}
                                                                </>
                                                        );
                                                    })()}
                                                </div>
                                        ) : (
                                                <div className="text-center py-12">
                                                    <div className="text-gray-400 mb-4">
                                                        <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                        </svg>
                                                    </div>
                                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                        {results.length > 0 ? 'No businesses match your filter' : 'No businesses found'}
                                                    </h3>
                                                    <p className="text-gray-600">
                                                        {results.length > 0
                                                                ? 'Try toggling the incentive filter to see all results.'
                                                                : 'Try adjusting your search criteria or browse all businesses.'
                                                        }
                                                    </p>
                                                </div>
                                        )}
                                    </div>
                            )}
                        </div>
                    </div>
                    <Footer />
                </div>
            </>
    );
}