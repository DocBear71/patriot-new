'use client';
// file: /src/app/incentive-view/page.jsx v1 - React/Next.js version of incentive-view.html

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import Navigation from '../../components/layout/Navigation';

export default function IncentiveViewPage() {
    const router = useRouter();

    // State management
    const [searchForm, setSearchForm] = useState({
        businessName: '',
        address: '',
    });

    const [searchResults, setSearchResults] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [showBusinessInfo, setShowBusinessInfo] = useState(false);
    const [incentives, setIncentives] = useState([]);
    const [showIncentives, setShowIncentives] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingIncentives, setIsLoadingIncentives] = useState(false);
    const [message, setMessage] = useState({type: '', text: ''});
    const [currentUrl, setCurrentUrl] = useState('Loading...');

    // Set current URL on client side
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUrl(window.location.href);
        }
    }, []);

    // Test API connectivity
    // const testAPIConnection = async () => {
    //     try {
    //         setMessage({type: 'info', text: 'Testing API connection...'});
    //         // Test with the default business API endpoint which should return available operations
    //         const response = await fetch('/api/business');
    //
    //         if (response.ok) {
    //             const data = await response.json();
    //             console.log('API test response:', data);
    //             setMessage({type: 'success', text: 'API connection successful! Business API is available.'});
    //         } else {
    //             const errorText = await response.text();
    //             console.error('API test error:', response.status, errorText);
    //             setMessage({type: 'error', text: `API test failed: ${response.status} - ${errorText}`});
    //         }
    //     } catch (error) {
    //         console.error('API connection test error:', error);
    //         setMessage({type: 'error', text: `API connection failed: ${error.message}`});
    //     }
    // };
    // // Test search functionality
    // const testSearchAPI = async () => {
    //     try {
    //         setMessage({type: 'info', text: 'Testing search API...'});
    //         const response = await fetch('/api/business?operation=search&business_name=Olive Garden');
    //
    //         console.log('Search test response status:', response.status);
    //
    //         if (response.ok) {
    //             const data = await response.json();
    //             console.log('Search test response:', data);
    //             setMessage({
    //                 type: 'success',
    //                 text: `Search API working! Found ${data.results?.length || 0} results for test.`,
    //             });
    //         } else {
    //             const errorText = await response.text();
    //             console.error('Search test error:', response.status, errorText);
    //             setMessage({type: 'error', text: `Search test failed: ${response.status} - ${errorText}`});
    //         }
    //     } catch (error) {
    //         console.error('Search test error:', error);
    //         setMessage({type: 'error', text: `Search test failed: ${error.message}`});
    //     }
    // };

    // Enhanced business search with flexible matching
    const handleSearch = async (e) => {
        e.preventDefault();

        const businessName = searchForm.businessName.trim();
        const address = searchForm.address.trim();

        if (!businessName && !address) {
            setMessage({type: 'error', text: 'Please enter either a business name or address to search.'});
            return;
        }

        console.log('Starting business search:', {businessName, address});

        setIsSearching(true);
        setSearchResults([]);
        setShowBusinessInfo(false);
        setShowIncentives(false);
        setMessage({type: '', text: ''});

        try {
            // Build the query parameters for flexible search using the correct Next.js app router endpoint
            const queryParams = new URLSearchParams();
            queryParams.append('operation', 'search');

            // Add business name if provided (supports partial matching)
            if (businessName) {
                queryParams.append('business_name', businessName);
            }

            // Add address if provided (supports partial matching - address, city, state, zip)
            if (address) {
                queryParams.append('address', address);
            }

            // Use the correct Next.js 13+ app router API endpoint
            const apiUrl = `/api/business?${queryParams}`;
            console.log('Search API URL:', apiUrl);

            const response = await fetch(apiUrl);

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Search API error:', response.status, errorText);

                // Provide more specific error messages
                if (response.status === 405) {
                    throw new Error(
                            `API endpoint not configured properly (405). Check that /api/business/route.js exists and handles GET requests.`);
                } else if (response.status === 404) {
                    throw new Error(`API endpoint not found (404). The /api/business route may not exist.`);
                } else {
                    throw new Error(`Search failed: ${response.status} - ${errorText}`);
                }
            }

            const data = await response.json();
            console.log('Search response:', data);

            if (data.success) {
                if (data.results && data.results.length > 0) {
                    setSearchResults(data.results);
                    console.log(`Found ${data.results.length} businesses`);
                    setMessage({
                        type: 'success',
                        text: `Found ${data.results.length} business${data.results.length !== 1 ? 'es' : ''}`,
                    });

                    // Auto-scroll to search results after they're rendered
                    setTimeout(() => {
                        const searchResultsHeading = document.querySelector('h3');
                        if (searchResultsHeading && searchResultsHeading.textContent.includes('Search Results')) {
                            searchResultsHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 100);
                } else {
                    setSearchResults([]);
                    setMessage({
                        type: 'info',
                        text: 'No businesses found matching your search criteria. Try broader search terms or check your spelling.',
                    });
                }
            } else {
                console.error('Search API returned unsuccessful:', data);
                setMessage({type: 'error', text: data.message || 'Search failed. Please try again.'});
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            setMessage({
                type: 'error',
                text: `Search error: ${error.message}. Please check your connection and try again.`,
            });
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Enhanced business selection that matches business-incentive-viewer.js functionality
    const handleBusinessSelect = async (business) => {
        console.log('viewBusinessIncentives called with business:', business);

        if (!business || !business._id) {
            setMessage({type: 'error', text: 'Invalid business selected. Please try again.'});
            return;
        }

        setSelectedBusiness(business);
        setShowBusinessInfo(true);
        setSearchResults([]);
        setMessage({type: 'info', text: `Loading incentives for ${business.bname}...`});

        // Populate business information (equivalent to populateBusinessInfo)
        console.log('Populating business info with:', business);

        // Load incentives for the selected business (equivalent to fetchIncentives)
        try {
            await loadIncentives(business._id, business.bname, business);
        } catch (error) {
            console.error('Error in handleBusinessSelect:', error);
            setMessage({type: 'error', text: `Error loading incentives: ${error.message}`});
        }
    };

    // Enhanced business information population (equivalent to populateBusinessInfo function)
    const populateBusinessInfo = (business) => {
        if (!business) {
            console.error('No business data provided to populateBusinessInfo');
            return;
        }

        console.log('Populating business info with:', business);

        // In React, this is handled by setting the selectedBusiness state
        // which then populates the business information display section

        console.log('Business info populated successfully');
    };

    // Enhanced load incentives function (equivalent to fetchIncentives and enhancedFetchIncentives)
    const loadIncentives = async (businessId, businessName, businessData = null) => {
        setIsLoadingIncentives(true);
        setShowIncentives(false);

        console.log(`Fetching incentives for business ID: ${businessId}`);
        console.log('Business data:', businessData || selectedBusiness);

        // Use the passed businessData or fall back to selectedBusiness
        const business = businessData || selectedBusiness;

        try {
            // Determine the base URL (matches the original logic)
            const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? `http://${window.location.host}`
                    : window.location.origin;

            // Check if this is a chain location
            const isChainLocation = business?.chain_id ? true : false;
            const chainId = business?.chain_id;

            console.log('Enhanced incentive loading:', {
                businessId,
                businessName,
                isChainLocation,
                chainId,
                baseURL,
            });

            let allIncentives = [];

            // Fetch local incentives using the correct Next.js app router API structure
            const localApiURL = `${baseURL}/api/combined-api?operation=incentives&business_id=${businessId}`;
            console.log('Fetching from:', localApiURL);

            const localResponse = await fetch(localApiURL);

            if (localResponse.ok) {
                const localData = await localResponse.json();
                console.log('Local incentives response:', localData);

                if (localData.success && localData.results) {
                    // Mark as local incentives and add created date formatting
                    const localIncentives = localData.results.map(incentive => ({
                        ...incentive,
                        is_chain_wide: false,
                        scope: 'Local',
                        // Format date similar to original: new Date(incentive.created_at).toLocaleDateString()
                        formatted_date: incentive.created_at ?
                                new Date(incentive.created_at).toLocaleDateString() :
                                'N/A',
                    }));
                    allIncentives = [...allIncentives, ...localIncentives];
                    console.log(`Added ${localIncentives.length} local incentives`);
                }
            }

            // Fetch chain incentives if this is a chain location (enhanced functionality)
            if (isChainLocation && chainId) {
                try {
                    const chainApiURL = `${baseURL}/api/chains?operation=get_incentives&chain_id=${chainId}`;
                    console.log('Fetching chain incentives from:', chainApiURL);

                    const chainResponse = await fetch(chainApiURL);

                    if (chainResponse.ok) {
                        const chainData = await chainResponse.json();
                        console.log('Chain incentives response:', chainData);

                        if (chainData.success && chainData.incentives) {
                            // Convert chain incentives to standard format and mark as chain-wide
                            const chainIncentives = chainData.incentives.filter(
                                    incentive => incentive.is_active !== false).map(incentive => ({
                                _id: `chain_${incentive._id || Math.random()}`,
                                is_available: incentive.is_active !== false,
                                type: incentive.type,
                                amount: incentive.amount,
                                information: incentive.information || incentive.description,
                                other_description: incentive.other_description,
                                discount_type: incentive.discount_type || 'percentage',
                                is_chain_wide: true,
                                scope: 'Chain-wide',
                                created_at: incentive.created_date || new Date().toISOString(),
                                formatted_date: incentive.created_date ?
                                        new Date(incentive.created_date).toLocaleDateString() :
                                        new Date().toLocaleDateString(),
                            }));
                            allIncentives = [...allIncentives, ...chainIncentives];
                            console.log(`Added ${chainIncentives.length} chain incentives`);
                        }
                    }
                } catch (chainError) {
                    console.warn('Error fetching chain incentives:', chainError);
                    // Don't fail the whole operation if chain incentives fail
                }
            }

            setIncentives(allIncentives);
            setShowIncentives(true);

            if (allIncentives.length === 0) {
                setMessage({
                    type: 'info',
                    text: `No incentives found for ${businessName}. You can add incentives using the "Add Incentive" page.`,
                });
            } else {
                setMessage({type: '', text: ''});

                // Add enhanced chain warning if applicable (matches original functionality)
                if (isChainLocation && allIncentives.some(i => i.is_chain_wide)) {
                    console.log('Chain incentives detected - enhanced display enabled');
                }
            }
        } catch (error) {
            console.error('Error loading incentives:', error);
            setMessage({type: 'error', text: 'Error loading incentives: ' + error.message});
            setIncentives([]);
            setShowIncentives(true);
        } finally {
            setIsLoadingIncentives(false);
        }
    };

    // Handle start over functionality
    const handleStartOver = () => {
        setSelectedBusiness(null);
        setShowBusinessInfo(false);
        setShowIncentives(false);
        setSearchResults([]);
        setIncentives([]);
        setSearchForm({businessName: '', address: ''});
        setMessage({type: '', text: ''});
    };

    const formatAddress = (business) => {
        const parts = [];
        if (business.address1) parts.push(business.address1);
        if (business.address2) parts.push(business.address2);
        return parts.join(', ');
    };

    const formatCityState = (business) => {
        const parts = [];
        if (business.city) parts.push(business.city);
        if (business.state) parts.push(business.state);
        if (business.zip) parts.push(business.zip);
        return parts.join(', ');
    };

    const getIncentiveTypeLabel = (type) => {
        const types = {
            'VT': 'Veteran',
            'AD': 'Active-Duty',
            'FR': 'First Responder',
            'SP': 'Spouse',
            'OT': 'Other',
        };
        return types[type] || type;
    };

    const getCategoriesLabel = (incentive) => {
        const categoryLabels = {
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

        // Handle both new format (eligible_categories) and old format (type)
        const categories = incentive.eligible_categories || (incentive.type ? [incentive.type] : []);

        if (categories.length === 0) return 'N/A';

        // Special case: if NA is the only category, just show "Not Available"
        if (categories.length === 1 && categories[0] === 'NA') {
            return 'Not Available';
        }

        return categories.map(cat => categoryLabels[cat] || cat).join(', ');
    };

    const formatIncentiveAmount = (amount, discountType) => {
        if (discountType === 'dollar') {
            return `$${amount}`;
        }
        return `${amount}%`;
    };

    return (
            <div style={{paddingTop: '70px'}} id="page_layout">
                <Navigation/>

                <header style={{padding: '20px 0'}}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        maxWidth: '1200px',
                        margin: '0 auto',
                        padding: '0 20px',
                    }}>
                        <div style={{marginRight: '20px'}}>
                            <img
                                    src="/images/patriotthankslogo6-13-2025.png"
                                    alt="Patriot Thanks Logo"
                                    style={{height: '60px', cursor: 'pointer'}}
                                    onClick={() => router.push('/')}
                            />
                        </div>
                        <div>
                            <h1 style={{margin: '0', color: '#003366'}}>Patriot Thanks</h1>
                            <hr style={{margin: '5px 0'}}/>
                            <h4 style={{margin: '0', color: '#666'}}>Search for an Incentive</h4>
                        </div>
                    </div>
                </header>

                <main style={{maxWidth: '1200px', margin: '0 auto', padding: '20px'}}>
                    <section>
                        <h2>Search for incentives at a business within our database</h2>
                        <p style={{marginBottom: '30px'}}>
                            In Patriot Thanks, you can search for the incentives and/or discounts at a business within
                            your local
                            area for "active-duty, veterans, first responders, and their
                            spouses." If you know of discounts and/or incentives for a business, Please add them in add
                            an Incentive section.
                        </p>
                    </section>

                    {/*/!* Debug section for troubleshooting *!/*/}
                    {/*{process.env.NODE_ENV === 'development' && (*/}
                    {/*        <div style={{*/}
                    {/*            marginBottom: '20px',*/}
                    {/*            padding: '10px',*/}
                    {/*            backgroundColor: '#fff3cd',*/}
                    {/*            border: '1px solid #ffeaa7',*/}
                    {/*            borderRadius: '4px',*/}
                    {/*        }}>*/}
                    {/*            <strong>Debug Info (Development Only):</strong>*/}
                    {/*            <div style={{marginTop: '10px'}}>*/}
                    {/*                <button*/}
                    {/*                        onClick={testAPIConnection}*/}
                    {/*                        style={{*/}
                    {/*                            padding: '5px 10px',*/}
                    {/*                            backgroundColor: '#17a2b8',*/}
                    {/*                            color: 'white',*/}
                    {/*                            border: 'none',*/}
                    {/*                            borderRadius: '3px',*/}
                    {/*                            cursor: 'pointer',*/}
                    {/*                            marginRight: '10px',*/}
                    {/*                        }}*/}
                    {/*                >*/}
                    {/*                    Test API*/}
                    {/*                </button>*/}
                    {/*                <button*/}
                    {/*                        onClick={testSearchAPI}*/}
                    {/*                        style={{*/}
                    {/*                            padding: '5px 10px',*/}
                    {/*                            backgroundColor: '#28a745',*/}
                    {/*                            color: 'white',*/}
                    {/*                            border: 'none',*/}
                    {/*                            borderRadius: '3px',*/}
                    {/*                            cursor: 'pointer',*/}
                    {/*                            marginRight: '10px',*/}
                    {/*                        }}*/}
                    {/*                >*/}
                    {/*                    Test Search*/}
                    {/*                </button>*/}
                    {/*                <small style={{color: '#666'}}>*/}
                    {/*                    Current URL: {currentUrl}*/}
                    {/*                </small>*/}
                    {/*            </div>*/}
                    {/*        </div>*/}
                    {/*)}*/}

                    {/* Message Display */}
                    {message.text && (
                            <div style={{
                                padding: '10px',
                                margin: '20px 0',
                                borderRadius: '4px',
                                backgroundColor: message.type === 'success' ? '#d4edda' :
                                        message.type === 'error' ? '#f8d7da' : '#d1ecf1',
                                color: message.type === 'success' ? '#155724' :
                                        message.type === 'error' ? '#721c24' : '#0c5460',
                                border: `1px solid ${message.type === 'success' ? '#c3e6cb' :
                                        message.type === 'error' ? '#f5c6cb' : '#bee5eb'}`,
                            }}>
                                {message.text}
                            </div>
                    )}

                    {/* Step 1: Search for a business */}
                    <fieldset style={{
                        marginBottom: '30px',
                        padding: '20px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                    }}>
                        <legend>
                            <h3 style={{color: '#003366', margin: '0 10px'}}>Step 1: Search for a Business</h3>
                        </legend>

                        <form onSubmit={handleSearch}>
                            <div style={{marginBottom: '15px'}}>
                                <label htmlFor="business-name"
                                       style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                                    Business Name Search
                                </label>
                                <input
                                        type="text"
                                        id="business-name"
                                        value={searchForm.businessName}
                                        onChange={(e) => setSearchForm(
                                                prev => ({...prev, businessName: e.target.value}))}
                                        placeholder="Enter full or partial business name (e.g., 'McDonald', 'Walmart', 'Home Depot')"
                                        style={{
                                            padding: '10px',
                                            width: '100%',
                                            maxWidth: '500px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                        }}
                                />
                                <small style={{color: '#666', fontSize: '12px'}}>
                                    💡 You can search with just part of the name
                                </small>
                            </div>

                            <div style={{marginBottom: '20px'}}>
                                <label htmlFor="address"
                                       style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                                    Address Search
                                </label>
                                <input
                                        type="text"
                                        id="address"
                                        value={searchForm.address}
                                        onChange={(e) => setSearchForm(prev => ({...prev, address: e.target.value}))}
                                        placeholder="Enter address, city, state, or zip (e.g., '123 Main St', 'Chicago', 'IL', '60601')"
                                        style={{
                                            padding: '10px',
                                            width: '100%',
                                            maxWidth: '500px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                        }}
                                />
                                <small style={{color: '#666', fontSize: '12px'}}>
                                    💡 You can search by street address, city, state, or just zip code
                                </small>
                            </div>

                            <div style={{
                                padding: '10px',
                                backgroundColor: '#e8f4fd',
                                borderRadius: '4px',
                                marginBottom: '20px',
                                border: '1px solid #bee5eb',
                            }}>
                                <strong>Search Tips:</strong>
                                <ul style={{margin: '5px 0', paddingLeft: '20px', fontSize: '13px'}}>
                                    <li>Enter either a business name OR address (or both for more specific results)</li>
                                    <li>Partial matches work - try "Star" instead of "Starbucks"</li>
                                    <li>For addresses, you can search by just the zip code or city name</li>
                                    <li>If you don't find what you're looking for, try simpler search terms</li>
                                </ul>
                            </div>

                            <div style={{textAlign: 'center', marginTop: '20px'}}>
                                <button
                                        type="submit"
                                        disabled={isSearching}
                                        style={{
                                            padding: '12px 30px',
                                            backgroundColor: isSearching ? '#6c757d' : '#0000ff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: isSearching ? 'not-allowed' : 'pointer',
                                            opacity: isSearching ? 0.6 : 1,
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                        }}
                                >
                                    {isSearching ? (
                                            <>
                                                <span style={{marginRight: '8px'}}>🔍</span>
                                                Searching...
                                            </>
                                    ) : (
                                            <>
                                                <span style={{marginRight: '8px'}}>🔍</span>
                                                Search for Businesses
                                            </>
                                    )}
                                </button>

                                {(showBusinessInfo || showIncentives) && (
                                        <button
                                                type="button"
                                                onClick={handleStartOver}
                                                style={{
                                                    padding: '12px 30px',
                                                    backgroundColor: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    marginLeft: '15px',
                                                    fontSize: '16px',
                                                }}
                                        >
                                            🔄 Start Over
                                        </button>
                                )}
                            </div>
                        </form>
                    </fieldset>

                    {/* Enhanced search results display */}
                    {searchResults.length > 0 && (
                            <div style={{marginBottom: '30px'}}>
                                <h3>Search Results ({searchResults.length} found)</h3>
                                <p style={{fontSize: '14px', color: '#666', marginBottom: '15px'}}>
                                    Click on a business to view its incentives
                                </p>
                                <div style={{
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    backgroundColor: '#fafafa',
                                }}>
                                    {searchResults.map((business, index) => {
                                        const fullAddress = [
                                            business.address1,
                                            business.address2,
                                            business.city,
                                            business.state,
                                            business.zip,
                                        ].filter(Boolean).join(', ');

                                        return (
                                                <div
                                                        key={business._id || index}
                                                        onClick={() => handleBusinessSelect(business)}
                                                        style={{
                                                            padding: '15px',
                                                            borderBottom: index < searchResults.length - 1 ?
                                                                    '1px solid #eee' :
                                                                    'none',
                                                            cursor: 'pointer',
                                                            backgroundColor: 'white',
                                                            transition: 'all 0.2s',
                                                            margin: '1px',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#e3f2fd';
                                                            e.currentTarget.style.borderLeft = '4px solid #2196F3';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = 'white';
                                                            e.currentTarget.style.borderLeft = 'none';
                                                        }}
                                                >
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'flex-start',
                                                    }}>
                                                        <div style={{flex: 1}}>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                marginBottom: '4px',
                                                            }}>
                                                                <strong style={{fontSize: '16px', color: '#333'}}>
                                                                    {business.bname || 'N/A'}
                                                                </strong>
                                                                {business.is_chain && (
                                                                        <span style={{
                                                                            color: '#007bff',
                                                                            fontSize: '12px',
                                                                            marginLeft: '10px',
                                                                            backgroundColor: '#e3f2fd',
                                                                            padding: '2px 6px',
                                                                            borderRadius: '3px',
                                                                        }}>
                                                            Chain Parent
                                                        </span>
                                                                )}
                                                                {business.chain_id && (
                                                                        <span style={{
                                                                            color: '#28a745',
                                                                            fontSize: '12px',
                                                                            marginLeft: '10px',
                                                                            backgroundColor: '#e8f5e8',
                                                                            padding: '2px 6px',
                                                                            borderRadius: '3px',
                                                                        }}>
                                                            Chain Location
                                                        </span>
                                                                )}
                                                            </div>

                                                            {fullAddress && (
                                                                    <div style={{
                                                                        color: '#666',
                                                                        fontSize: '14px',
                                                                        marginBottom: '4px',
                                                                    }}>
                                                                        📍 {fullAddress}
                                                                    </div>
                                                            )}

                                                            <div style={{
                                                                display: 'flex',
                                                                gap: '15px',
                                                                fontSize: '13px',
                                                                color: '#888',
                                                            }}>
                                                                {business.phone && (
                                                                        <span>📞 {business.phone}</span>
                                                                )}
                                                                {business.type && (
                                                                        <span>🏢 {business.type}</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div style={{
                                                            color: '#2196F3',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                            padding: '4px 8px',
                                                            backgroundColor: '#f0f8ff',
                                                            borderRadius: '3px',
                                                        }}>
                                                            Click to view incentives →
                                                        </div>
                                                    </div>
                                                </div>
                                        );
                                    })}
                                </div>

                                <div style={{
                                    textAlign: 'center',
                                    marginTop: '15px',
                                    padding: '10px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    color: '#666',
                                }}>
                                    💡 Tip: If you don't see your business, try searching with fewer or different
                                    keywords
                                </div>
                            </div>
                    )}

                    {/* Step 2: Business Information */}
                    {showBusinessInfo && selectedBusiness && (
                            <fieldset style={{
                                marginBottom: '30px',
                                padding: '20px',
                                border: '2px solid #ddd',
                                borderRadius: '8px',
                            }}>
                                <legend>
                                    <h3 style={{color: '#003366', margin: '0 10px'}}>Step 2: Business Information</h3>
                                </legend>

                                {/* Enhanced chain information (matches enhanceBusinessInfoDisplay functionality) */}
                                {selectedBusiness.is_chain && (
                                        <div style={{
                                            backgroundColor: '#fff3cd',
                                            border: '1px solid #ffeaa7',
                                            borderRadius: '4px',
                                            padding: '10px',
                                            marginBottom: '20px',
                                            className: 'chain-business-warning',
                                        }}>
                                            <p><strong>{selectedBusiness.bname}</strong> is a national chain parent
                                                business.</p>
                                            <p>Chain businesses can only be modified by administrators.</p>
                                        </div>
                                )}

                                {selectedBusiness.chain_id && (
                                        <div style={{
                                            backgroundColor: '#d1ecf1',
                                            border: '1px solid #bee5eb',
                                            borderRadius: '4px',
                                            padding: '10px',
                                            marginBottom: '20px',
                                        }}>
                                            <p><strong>{selectedBusiness.bname}</strong> is part of
                                                the <strong>{selectedBusiness.chain_name || 'chain'}</strong> chain.</p>
                                            <p>This location may have chain-wide incentives that apply
                                                automatically.</p>
                                        </div>
                                )}

                                <div style={{display: 'grid', gap: '10px'}}>
                                    <div>
                                        <span style={{fontWeight: 'bold', display: 'inline-block', width: '150px'}}>Business Name:</span>
                                        <span>{selectedBusiness.bname || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span style={{
                                            fontWeight: 'bold',
                                            display: 'inline-block',
                                            width: '150px',
                                        }}>Address:</span>
                                        <span>{formatAddress(selectedBusiness) || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span style={{fontWeight: 'bold', display: 'inline-block', width: '150px'}}>City, State Zip:</span>
                                        <span>{formatCityState(selectedBusiness) || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span style={{
                                            fontWeight: 'bold',
                                            display: 'inline-block',
                                            width: '150px',
                                        }}>Phone:</span>
                                        <span>{selectedBusiness.phone || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span style={{
                                            fontWeight: 'bold',
                                            display: 'inline-block',
                                            width: '150px',
                                        }}>Type:</span>
                                        <span>{selectedBusiness.type || 'N/A'}</span>
                                    </div>
                                </div>
                            </fieldset>
                    )}

                    {/* Step 3: Incentives Display */}
                    {showIncentives && (
                            <fieldset style={{
                                marginBottom: '30px',
                                padding: '20px',
                                border: '2px solid #ddd',
                                borderRadius: '8px',
                            }}>
                                <legend>
                                    <h3 style={{color: '#003366', margin: '0 10px'}}>Step 3: Available Incentives</h3>
                                </legend>

                                {isLoadingIncentives ? (
                                        <div style={{textAlign: 'center', padding: '20px'}}>
                                            <p>Loading incentives...</p>
                                        </div>
                                ) : incentives.length === 0 ? (
                                        <div style={{textAlign: 'center', padding: '20px'}}>
                                            <p>No incentives found for this business.</p>
                                            <button
                                                    onClick={() => {
                                                        // Store business context for incentive-add page
                                                        if (selectedBusiness) {
                                                            sessionStorage.setItem('selectedBusinessForIncentive', JSON.stringify(selectedBusiness));
                                                        }
                                                        router.push('/incentive-add');
                                                    }}
                                                    style={{
                                                        padding: '10px 20px',
                                                        backgroundColor: '#28a745',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        marginTop: '10px',
                                                    }}
                                            >
                                                Add Incentive for this Business
                                            </button>
                                        </div>
                                ) : (
                                        <div style={{overflowX: 'auto'}}>
                                            {/* Enhanced incentive summary (matches original functionality) */}
                                            {(() => {
                                                const localIncentives = incentives.filter(i => !i.is_chain_wide);
                                                const chainIncentives = incentives.filter(i => i.is_chain_wide);
                                                const hasLocalIncentives = localIncentives.length > 0;
                                                const hasChainIncentives = chainIncentives.length > 0;

                                                return (
                                                        <>
                                                            {(hasLocalIncentives || hasChainIncentives) && (
                                                                    <div style={{
                                                                        backgroundColor: '#f8f9fa',
                                                                        padding: '15px',
                                                                        borderRadius: '5px',
                                                                        marginBottom: '20px',
                                                                        border: '1px solid #dee2e6',
                                                                    }}>
                                                                        <h4 style={{
                                                                            margin: '0 0 10px 0',
                                                                            color: '#333',
                                                                        }}>Incentive Summary
                                                                            for {selectedBusiness.bname}</h4>
                                                                        <div style={{
                                                                            display: 'flex',
                                                                            gap: '20px',
                                                                            flexWrap: 'wrap',
                                                                        }}>
                                                                            {hasLocalIncentives && (
                                                                                    <div>
                                                                <span style={{
                                                                    backgroundColor: '#28a745',
                                                                    color: 'white',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '12px',
                                                                    marginRight: '8px',
                                                                }}>
                                                                    Location-specific
                                                                </span>
                                                                                        <span>{localIncentives.length} incentive{localIncentives.length !==
                                                                                        1 ? 's' : ''}</span>
                                                                                    </div>
                                                                            )}
                                                                            {hasChainIncentives && (
                                                                                    <div>
                                                                <span style={{
                                                                    backgroundColor: '#4285F4',
                                                                    color: 'white',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '12px',
                                                                    marginRight: '8px',
                                                                }}>
                                                                    Chain-wide
                                                                </span>
                                                                                        <span>{chainIncentives.length} incentive{chainIncentives.length !==
                                                                                        1 ? 's' : ''}</span>
                                                                                    </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                            )}
                                                        </>
                                                );
                                            })()}

                                            <table style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                border: '1px solid #ddd',
                                            }}>
                                                <thead>
                                                <tr style={{backgroundColor: '#f8f9fa'}}>
                                                    <th style={{
                                                        padding: '12px',
                                                        textAlign: 'left',
                                                        borderBottom: '2px solid #ddd',
                                                        fontWeight: 'bold',
                                                    }}>
                                                        Available
                                                    </th>
                                                    <th style={{
                                                        padding: '12px',
                                                        textAlign: 'left',
                                                        borderBottom: '2px solid #ddd',
                                                        fontWeight: 'bold',
                                                    }}>
                                                        Eligible For
                                                    </th>
                                                    <th style={{
                                                        padding: '12px',
                                                        textAlign: 'left',
                                                        borderBottom: '2px solid #ddd',
                                                        fontWeight: 'bold',
                                                    }}>
                                                        Information
                                                    </th>
                                                    <th style={{
                                                        padding: '12px',
                                                        textAlign: 'left',
                                                        borderBottom: '2px solid #ddd',
                                                        fontWeight: 'bold',
                                                    }}>
                                                        Scope
                                                    </th>
                                                    <th style={{
                                                        padding: '12px',
                                                        textAlign: 'left',
                                                        borderBottom: '2px solid #ddd',
                                                        fontWeight: 'bold',
                                                    }}>
                                                        Date Added
                                                    </th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {incentives.map((incentive, index) => (
                                                        <tr key={incentive._id || index} style={{
                                                            backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                                                        }}>
                                                            <td style={{
                                                                padding: '12px',
                                                                borderBottom: '1px solid #ddd',
                                                            }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        backgroundColor: incentive.is_available ? '#d4edda' : '#f8d7da',
                                                        color: incentive.is_available ? '#155724' : '#721c24',
                                                    }}>
                                                        {incentive.is_available ? 'Yes' : 'No'}
                                                    </span>
                                                            </td>
                                                            <td style={{
                                                                padding: '12px',
                                                                borderBottom: '1px solid #ddd',
                                                            }}>
                                                                {getCategoriesLabel(incentive)}
                                                                {(incentive.eligible_categories?.includes('OT') || incentive.type === 'OT') &&
                                                                        incentive.other_description && (
                                                                                <div style={{
                                                                                    fontSize: '12px',
                                                                                    color: '#666',
                                                                                    marginTop: '4px',
                                                                                }}>
                                                                                    ({incentive.other_description})
                                                                                </div>
                                                                        )}
                                                                {incentive.is_chain_wide && (
                                                                        <span style={{
                                                                            backgroundColor: '#4285F4',
                                                                            color: 'white',
                                                                            borderRadius: '4px',
                                                                            padding: '2px 5px',
                                                                            fontSize: '11px',
                                                                            marginLeft: '5px',
                                                                        }}>
                                                            Chain-wide
                                                        </span>
                                                                )}
                                                            </td>
                                                            <td style={{
                                                                padding: '12px',
                                                                borderBottom: '1px solid #ddd',
                                                            }}>
                                                                {incentive.is_available ?
                                                                        formatIncentiveAmount(incentive.amount,
                                                                                incentive.discount_type) :
                                                                        'N/A'
                                                                }
                                                            </td>
                                                            <td style={{
                                                                padding: '12px',
                                                                borderBottom: '1px solid #ddd',
                                                            }}>
                                                                {incentive.information || 'N/A'}
                                                            </td>
                                                            <td style={{
                                                                padding: '12px',
                                                                borderBottom: '1px solid #ddd',
                                                            }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        backgroundColor: incentive.is_chain_wide ?
                                                                '#4285F4' :
                                                                '#28a745',
                                                        color: 'white',
                                                    }}>
                                                        {incentive.scope ||
                                                                (incentive.is_chain_wide ? 'Chain-wide' : 'Local')}
                                                    </span>
                                                            </td>
                                                            <td style={{
                                                                padding: '12px',
                                                                borderBottom: '1px solid #ddd',
                                                            }}>
                                                                {incentive.formatted_date || (incentive.created_at ?
                                                                        new Date(
                                                                                incentive.created_at).toLocaleDateString() :
                                                                        'N/A')}
                                                            </td>
                                                        </tr>
                                                ))}
                                                </tbody>
                                            </table>

                                            {/* Action buttons */}
                                            <div style={{textAlign: 'center', marginTop: '20px'}}>
                                                <button
                                                        onClick={() => router.push(`/business/${selectedBusiness._id}`)}
                                                        style={{
                                                            padding: '10px 20px',
                                                            backgroundColor: '#007bff',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            marginRight: '10px',
                                                        }}
                                                >
                                                    View Full Business Details
                                                </button>
                                                <button
                                                        onClick={() => router.push('/incentive-add')}
                                                        style={{
                                                            padding: '10px 20px',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            marginRight: '10px',
                                                        }}
                                                >
                                                    Add New Incentive
                                                </button>

                                                <button
                                                        onClick={() => router.push('/incentive-update')}
                                                        style={{
                                                            padding: '10px 20px',
                                                            backgroundColor: '#ffc107',
                                                            color: '#212529',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                        }}
                                                >
                                                    Update Incentives
                                                </button>
                                            </div>
                                        </div>
                                )}
                            </fieldset>
                    )}
                </main>
            </div>
    );
}