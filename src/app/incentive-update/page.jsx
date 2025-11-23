'use client';
// file: /src/app/incentive-update/page.jsx v1 - React/Next.js version of incentive-update.html

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navigation from '../../components/layout/Navigation';

export default function IncentiveUpdatePage() {
    const router = useRouter();
    const { data: session } = useSession();

    // State management
    const [searchForm, setSearchForm] = useState({
        businessName: '',
        address: ''
    });

    const [searchResults, setSearchResults] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [showBusinessInfo, setShowBusinessInfo] = useState(false);
    const [incentives, setIncentives] = useState([]);
    const [showIncentivesList, setShowIncentivesList] = useState(false);
    const [selectedIncentive, setSelectedIncentive] = useState(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingIncentives, setIsLoadingIncentives] = useState(false);

    const [editForm, setEditForm] = useState({
        incentiveAvailable: 'true',
        eligibleCategories: [], // Changed from incentiveType
        discountType: 'percentage',
        incentiveAmount: '',
        incentiveInfo: '',
        otherTypeDescription: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Handle business search
    const handleSearch = async (e) => {
        e.preventDefault();

        if (!searchForm.businessName.trim() && !searchForm.address.trim()) {
            setMessage({ type: 'error', text: 'Please enter either a business name or address to search.' });
            return;
        }

        setIsSearching(true);
        setSearchResults([]);
        resetToSearchState();

        try {
            const queryParams = new URLSearchParams();
            queryParams.append('operation', 'search');

            if (searchForm.businessName.trim()) {
                queryParams.append('business_name', searchForm.businessName.trim());
            }
            if (searchForm.address.trim()) {
                queryParams.append('address', searchForm.address.trim());
            }

            console.log('Searching businesses with URL:', `/api/business?${queryParams}`);
            const response = await fetch(`/api/business?${queryParams}`);

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.results) {
                setSearchResults(data.results);
                if (data.results.length === 0) {
                    setMessage({ type: 'info', text: 'No businesses found matching your search criteria.' });
                }
            } else {
                setMessage({ type: 'error', text: 'No businesses found.' });
            }
        } catch (error) {
            console.error('Search error:', error);
            setMessage({ type: 'error', text: 'Error searching for businesses: ' + error.message });
        } finally {
            setIsSearching(false);
        }
    };

    // Reset to search state
    const resetToSearchState = () => {
        setShowBusinessInfo(false);
        setShowIncentivesList(false);
        setShowEditForm(false);
        setSelectedBusiness(null);
        setSelectedIncentive(null);
        setIncentives([]);
    };

    // Handle business selection and load incentives
    const handleBusinessSelect = async (business) => {
        // Check if business is a chain parent and user is not admin
        if (business.is_chain && !checkIfUserIsAdmin()) {
            setMessage({
                type: 'error',
                text: 'Chain businesses can only be modified by administrators. Please select a specific location instead.'
            });
            return;
        }

        setSelectedBusiness(business);
        setShowBusinessInfo(true);
        setSearchResults([]);
        setMessage({ type: '', text: '' });

        // Load incentives for the selected business
        await loadIncentives(business._id, business.bname);
    };

    // Check if user is admin
    const checkIfUserIsAdmin = () => {
        return session?.user?.level === 'Admin' || session?.user?.isAdmin === true;
    };

    // Load incentives for a business with enhanced chain support
    const loadIncentives = async (businessId, businessName) => {
        setIsLoadingIncentives(true);
        setShowIncentivesList(false);
        setShowEditForm(false);

        try {
            // Check if this is a chain location
            const isChainLocation = selectedBusiness?.chain_id ? true : false;
            const chainId = selectedBusiness?.chain_id;

            console.log('Enhanced incentive loading for update:', {
                businessId,
                businessName,
                isChainLocation,
                chainId
            });

            let allIncentives = [];

            // Fetch local incentives
            const localResponse = await fetch(`/api/combined-api?operation=incentives&business_id=${businessId}`);

            if (localResponse.ok) {
                const localData = await localResponse.json();
                if (localData.success && localData.results) {
                    // Mark as local incentives
                    const localIncentives = localData.results.map(incentive => ({
                        ...incentive,
                        is_chain_wide: false,
                        scope: 'Local'
                    }));
                    allIncentives = [...allIncentives, ...localIncentives];
                    console.log(`Added ${localIncentives.length} local incentives for update`);
                }
            }

            // Fetch chain incentives if this is a chain location
            if (isChainLocation && chainId) {
                try {
                    const chainResponse = await fetch(`/api/chains?operation=get_incentives&chain_id=${chainId}`);

                    if (chainResponse.ok) {
                        const chainData = await chainResponse.json();
                        if (chainData.success && chainData.incentives) {
                            // Convert chain incentives to standard format and mark as chain-wide
                            const chainIncentives = chainData.incentives
                            .filter(incentive => incentive.is_active !== false)
                            .map(incentive => ({
                                _id: `chain_${incentive._id || Math.random()}`,
                                is_available: incentive.is_active !== false,
                                type: incentive.type,
                                amount: incentive.amount,
                                information: incentive.information || incentive.description,
                                other_description: incentive.other_description,
                                discount_type: incentive.discount_type || 'percentage',
                                is_chain_wide: true,
                                scope: 'Chain-wide',
                                created_at: incentive.created_date || new Date().toISOString()
                            }));
                            allIncentives = [...allIncentives, ...chainIncentives];
                            console.log(`Added ${chainIncentives.length} chain incentives for update`);
                        }
                    }
                } catch (chainError) {
                    console.warn('Error fetching chain incentives for update:', chainError);
                    // Don't fail the whole operation if chain incentives fail
                }
            }

            setIncentives(allIncentives);
            setShowIncentivesList(true);

            if (allIncentives.length === 0) {
                setMessage({
                    type: 'info',
                    text: `No incentives found for ${businessName}. You can add incentives using the "Add Incentive" page.`
                });
            } else {
                setMessage({ type: '', text: '' });
            }
        } catch (error) {
            console.error('Error loading incentives for update:', error);
            setMessage({ type: 'error', text: 'Error loading incentives: ' + error.message });
            setIncentives([]);
            setShowIncentivesList(true);
        } finally {
            setIsLoadingIncentives(false);
        }
    };

    // Handle incentive selection for editing with enhanced fixes
    const handleIncentiveSelect = (incentive) => {
        // Check if this is a chain-wide incentive and user is not admin
        if (incentive.is_chain_wide && !checkIfUserIsAdmin()) {
            setMessage({ type: 'error', text: 'Only administrators can edit chain-wide incentives.' });
            return;
        }

        console.log('Simple fix: Preparing to load incentive:', incentive);

        setSelectedIncentive(incentive);

        // Populate edit form with current incentive data - ENHANCED WITH FIXES
        // Handle both old format (type) and new format (eligible_categories)
        const categories = incentive.eligible_categories || (incentive.type ? [incentive.type] : []);

        const formData = {
            incentiveAvailable: incentive.is_available ? 'true' : 'false',
            eligibleCategories: categories,
            discountType: incentive.discount_type || 'percentage',
            incentiveAmount: incentive.amount || '',
            incentiveInfo: incentive.information || '',
            otherTypeDescription: incentive.other_description || ''
        };

        console.log('Simple fix: Setting form data:', formData);

        setEditForm(formData);
        setShowEditForm(true);
        setMessage({ type: '', text: '' });

        // Apply fixes after form is rendered
        setTimeout(() => {
            applyIncentiveFormFixes(incentive);
        }, 50);
    };

    // Apply the equivalent of simple-incentive-fix.js fixes
    const applyIncentiveFormFixes = (incentive) => {
        console.log('Simple fix: Applying fixes for incentive:', incentive);

        // The React form state should already handle most of this,
        // but we can add any additional logic here if needed

        console.log('Simple fix: Set incentive available to', incentive.is_available);
        console.log('Simple fix: Set discount type to', incentive.discount_type);
        console.log('Simple fix: Completed applying fixes');
    };

    // Enhanced useEffect to handle form field enabling/disabling
    useEffect(() => {
        // This handles the equivalent of the field enabling/disabling logic
        if (showEditForm) {
            console.log('Form field states updated based on availability:', editForm.incentiveAvailable);
        }
    }, [editForm.incentiveAvailable, showEditForm]);

    // Handle incentive form submission
    const handleIncentiveUpdate = async (e) => {
        e.preventDefault();

        if (!selectedIncentive) {
            setMessage({ type: 'error', text: 'Please select an incentive to update.' });
            return;
        }

        // Validate required fields when incentive is available
        if (editForm.incentiveAvailable === 'true') {
            if (!editForm.eligibleCategories || editForm.eligibleCategories.length === 0) {
                setMessage({ type: 'error', text: 'Please select at least one eligible category.' });
                return;
            }
            if (!editForm.incentiveAmount) {
                setMessage({ type: 'error', text: 'Please enter an incentive amount.' });
                return;
            }
            if (!editForm.incentiveInfo.trim()) {
                setMessage({ type: 'error', text: 'Please enter incentive information.' });
                return;
            }
            if (editForm.eligibleCategories.includes('OT') && !editForm.otherTypeDescription.trim()) {
                setMessage({ type: 'error', text: 'Please describe the "Other" category.' });
                return;
            }
        }

        setLoading(true);

        try {
            const incentiveData = {
                incentiveId: selectedIncentive._id,
                business_id: selectedBusiness._id,
                is_available: editForm.incentiveAvailable === 'true',
                // If not available, set categories to ['NA'], otherwise use selected categories
                eligible_categories: editForm.incentiveAvailable === 'false'
                        ? ['NA']
                        : editForm.eligibleCategories,
                discount_type: editForm.discountType,
                amount: parseFloat(editForm.incentiveAmount) || 0,
                information: editForm.incentiveInfo,
                ...(editForm.eligibleCategories.includes('OT') && { other_description: editForm.otherTypeDescription })
            };

            // Get user info for updated_by field from NextAuth session
            if (session?.user?.id) {
                incentiveData.updated_by = session.user.id;
            }

            // Get auth token for admin operations
            const token = getAuthToken();
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/combined-api?operation=admin-incentives&action=update', {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(incentiveData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update incentive');
            }

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Incentive updated successfully!' });

                // Reload incentives to show updated data
                await loadIncentives(selectedBusiness._id, selectedBusiness.bname);

                // Reset edit form
                setShowEditForm(false);
                setSelectedIncentive(null);
            } else {
                throw new Error(data.message || 'Failed to update incentive');
            }
        } catch (error) {
            console.error('Error updating incentive:', error);
            setMessage({ type: 'error', text: 'Error updating incentive: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    // Get auth token - NextAuth uses session-based auth, not tokens
    // This is kept for API compatibility but returns null
    const getAuthToken = () => {
        return null;
    };

    // Handle start over functionality
    const handleStartOver = () => {
        setSelectedBusiness(null);
        setSelectedIncentive(null);
        setShowBusinessInfo(false);
        setShowIncentivesList(false);
        setShowEditForm(false);
        setSearchResults([]);
        setIncentives([]);
        setSearchForm({ businessName: '', address: '' });
        setEditForm({
            incentiveAvailable: 'true',
            eligibleCategories: [],
            discountType: 'percentage',
            incentiveAmount: '',
            incentiveInfo: '',
            otherTypeDescription: ''
        });
        setMessage({ type: '', text: '' });
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
            'OT': 'Other'
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
            return `${amount}`;
        }
        return `${amount}%`;
    };

    return (
            <div style={{ paddingTop: '70px' }} id="page_layout">
                <Navigation />

                <header style={{ padding: '20px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                        <div style={{ marginRight: '20px' }}>
                            <img
                                    src="/images/patriotthankslogo6-13-2025.png"
                                    alt="Patriot Thanks Logo"
                                    style={{ height: '60px', cursor: 'pointer' }}
                                    onClick={() => router.push('/')}
                            />
                        </div>
                        <div>
                            <h1 style={{ margin: '0', color: '#003366' }}>Patriot Thanks</h1>
                            <hr style={{ margin: '5px 0' }} />
                            <h4 style={{ margin: '0', color: '#666' }}>Update an Incentive</h4>
                        </div>
                    </div>
                </header>

                <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                    <section>
                        <h2>Update an incentive in our database</h2>
                        <p style={{ marginBottom: '30px' }}>
                            Find a business and update its incentives in the Patriot Thanks database.
                            This allows you to correct or update details about discounts offered for active-duty, veterans,
                            first responders, and their spouses.
                        </p>
                    </section>

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
                                        message.type === 'error' ? '#f5c6cb' : '#bee5eb'}`
                            }}>
                                {message.text}
                            </div>
                    )}

                    {/* Step 1: Search for a business */}
                    <fieldset style={{ marginBottom: '30px', padding: '20px', border: '2px solid #ddd', borderRadius: '8px' }}>
                        <legend>
                            <h3 style={{ color: '#003366', margin: '0 10px' }}>Step 1: Search for a Business</h3>
                        </legend>

                        <form onSubmit={handleSearch}>
                            <div style={{ marginBottom: '15px' }}>
                                <label htmlFor="business-name" style={{ display: 'inline-block', width: '200px' }}>
                                    Name Search
                                </label>
                                <input
                                        type="text"
                                        id="business-name"
                                        value={searchForm.businessName}
                                        onChange={(e) => setSearchForm(prev => ({ ...prev, businessName: e.target.value }))}
                                        placeholder="Business Name..."
                                        style={{ padding: '8px', width: '300px', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label htmlFor="address" style={{ display: 'inline-block', width: '200px' }}>
                                    Address Search
                                </label>
                                <input
                                        type="text"
                                        id="address"
                                        value={searchForm.address}
                                        onChange={(e) => setSearchForm(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder="Street Address, city, state, or zip..."
                                        style={{ padding: '8px', width: '300px', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                            </div>

                            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                <button
                                        type="submit"
                                        disabled={isSearching}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#0000ff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: isSearching ? 'not-allowed' : 'pointer',
                                            opacity: isSearching ? 0.6 : 1
                                        }}
                                >
                                    {isSearching ? 'Searching...' : 'Search Business'}
                                </button>

                                {(showBusinessInfo || showIncentivesList || showEditForm) && (
                                        <button
                                                type="button"
                                                onClick={handleStartOver}
                                                style={{
                                                    padding: '10px 20px',
                                                    backgroundColor: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    marginLeft: '10px'
                                                }}
                                        >
                                            Start Over
                                        </button>
                                )}
                            </div>
                        </form>
                    </fieldset>

                    {/* Display search results */}
                    {searchResults.length > 0 && (
                            <div style={{ marginBottom: '30px' }}>
                                <h3>Search Results</h3>
                                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                                    {searchResults.map((business, index) => (
                                            <div
                                                    key={business._id || index}
                                                    onClick={() => handleBusinessSelect(business)}
                                                    style={{
                                                        padding: '15px',
                                                        borderBottom: index < searchResults.length - 1 ? '1px solid #eee' : 'none',
                                                        cursor: 'pointer',
                                                        backgroundColor: 'white',
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                            >
                                                <strong>{business.bname || 'N/A'}</strong>
                                                {business.is_chain && <span style={{ color: '#007bff', fontSize: '12px', marginLeft: '10px' }}>[Chain]</span>}
                                                {business.chain_id && <span style={{ color: '#28a745', fontSize: '12px', marginLeft: '10px' }}>[Chain Location]</span>}
                                                <br />
                                                <small style={{ color: '#666' }}>
                                                    {formatAddress(business)} | {formatCityState(business)}
                                                    {business.phone && ` | ${business.phone}`}
                                                </small>
                                            </div>
                                    ))}
                                </div>
                            </div>
                    )}

                    {/* Step 2: Business Information */}
                    {showBusinessInfo && selectedBusiness && (
                            <fieldset style={{ marginBottom: '30px', padding: '20px', border: '2px solid #ddd', borderRadius: '8px' }}>
                                <legend>
                                    <h3 style={{ color: '#003366', margin: '0 10px' }}>Step 2: Confirm Business Information</h3>
                                </legend>

                                {/* Chain information */}
                                {selectedBusiness.is_chain && (
                                        <div style={{
                                            backgroundColor: '#fff3cd',
                                            border: '1px solid #ffeaa7',
                                            borderRadius: '4px',
                                            padding: '10px',
                                            marginBottom: '20px'
                                        }}>
                                            <p><strong>{selectedBusiness.bname}</strong> is a national chain parent business.</p>
                                            <p>Chain businesses can only be modified by administrators.</p>
                                        </div>
                                )}

                                {selectedBusiness.chain_id && (
                                        <div style={{
                                            backgroundColor: '#d1ecf1',
                                            border: '1px solid #bee5eb',
                                            borderRadius: '4px',
                                            padding: '10px',
                                            marginBottom: '20px'
                                        }}>
                                            <p><strong>{selectedBusiness.bname}</strong> is part of the <strong>{selectedBusiness.chain_name || 'chain'}</strong> chain.</p>
                                            <p>This location may have chain-wide incentives that apply automatically.</p>
                                        </div>
                                )}

                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <div>
                                        <span style={{ fontWeight: 'bold', display: 'inline-block', width: '150px' }}>Business Name:</span>
                                        <span>{selectedBusiness.bname || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span style={{ fontWeight: 'bold', display: 'inline-block', width: '150px' }}>Address:</span>
                                        <span>{formatAddress(selectedBusiness) || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span style={{ fontWeight: 'bold', display: 'inline-block', width: '150px' }}>City, State Zip:</span>
                                        <span>{formatCityState(selectedBusiness) || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span style={{ fontWeight: 'bold', display: 'inline-block', width: '150px' }}>Phone:</span>
                                        <span>{selectedBusiness.phone || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span style={{ fontWeight: 'bold', display: 'inline-block', width: '150px' }}>Type:</span>
                                        <span>{selectedBusiness.type || 'N/A'}</span>
                                    </div>
                                </div>
                            </fieldset>
                    )}

                    {/* Step 3: Incentives List */}
                    {showIncentivesList && (
                            <fieldset style={{ marginBottom: '30px', padding: '20px', border: '2px solid #ddd', borderRadius: '8px' }}>
                                <legend>
                                    <h3 style={{ color: '#003366', margin: '0 10px' }}>Step 3: Select Incentive to Update</h3>
                                </legend>

                                {isLoadingIncentives ? (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>
                                            <p>Loading incentives...</p>
                                        </div>
                                ) : incentives.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>
                                            <p>No incentives found for this business.</p>
                                            <button
                                                    onClick={() => router.push('/incentive-add')}
                                                    style={{
                                                        padding: '10px 20px',
                                                        backgroundColor: '#28a745',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        marginTop: '10px'
                                                    }}
                                            >
                                                Add Incentive for this Business
                                            </button>
                                        </div>
                                ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                border: '1px solid #ddd'
                                            }}>
                                                <thead>
                                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                                    <th style={{
                                                        padding: '12px',
                                                        textAlign: 'left',
                                                        borderBottom: '2px solid #ddd',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        Available
                                                    </th>
                                                    <th style={{
                                                        padding: '12px',
                                                        textAlign: 'left',
                                                        borderBottom: '2px solid #ddd',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        Type
                                                    </th>
                                                    <th style={{
                                                        padding: '12px',
                                                        textAlign: 'left',
                                                        borderBottom: '2px solid #ddd',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        Amount
                                                    </th>
                                                    <th style={{
                                                        padding: '12px',
                                                        textAlign: 'left',
                                                        borderBottom: '2px solid #ddd',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        Information
                                                    </th>
                                                    <th style={{
                                                        padding: '12px',
                                                        textAlign: 'center',
                                                        borderBottom: '2px solid #ddd',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        Scope
                                                    </th>
                                                    <th style={{
                                                        padding: '12px',
                                                        textAlign: 'center',
                                                        borderBottom: '2px solid #ddd',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        Action
                                                    </th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {incentives.map((incentive, index) => (
                                                        <tr key={incentive._id || index} style={{
                                                            backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                                                        }}>
                                                            <td style={{
                                                                padding: '12px',
                                                                borderBottom: '1px solid #ddd'
                                                            }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        backgroundColor: incentive.is_available ? '#d4edda' : '#f8d7da',
                                                        color: incentive.is_available ? '#155724' : '#721c24'
                                                    }}>
                                                        {incentive.is_available ? 'Yes' : 'No'}
                                                    </span>
                                                            </td>
                                                            <td style={{
                                                                padding: '12px',
                                                                borderBottom: '1px solid #ddd'
                                                            }}>
                                                                {getCategoriesLabel(incentive)}
                                                                {(incentive.eligible_categories?.includes('OT') || incentive.type === 'OT') && incentive.other_description && (
                                                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
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
                                                                            marginLeft: '5px'
                                                                        }}>
                                                            Chain-wide
                                                        </span>
                                                                )}
                                                            </td>
                                                            <td style={{
                                                                padding: '12px',
                                                                borderBottom: '1px solid #ddd'
                                                            }}>
                                                                {incentive.is_available ?
                                                                        formatIncentiveAmount(incentive.amount, incentive.discount_type) :
                                                                        'N/A'
                                                                }
                                                            </td>
                                                            <td style={{
                                                                padding: '12px',
                                                                borderBottom: '1px solid #ddd',
                                                                maxWidth: '200px',
                                                                wordWrap: 'break-word'
                                                            }}>
                                                                {incentive.information || 'N/A'}
                                                            </td>
                                                            <td style={{
                                                                padding: '12px',
                                                                borderBottom: '1px solid #ddd',
                                                                textAlign: 'center'
                                                            }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        backgroundColor: incentive.is_chain_wide ? '#4285F4' : '#28a745',
                                                        color: 'white'
                                                    }}>
                                                        {incentive.scope || (incentive.is_chain_wide ? 'Chain-wide' : 'Local')}
                                                    </span>
                                                            </td>
                                                            <td style={{
                                                                padding: '12px',
                                                                borderBottom: '1px solid #ddd',
                                                                textAlign: 'center'
                                                            }}>
                                                                <button
                                                                        onClick={() => handleIncentiveSelect(incentive)}
                                                                        style={{
                                                                            padding: '6px 12px',
                                                                            backgroundColor: incentive.is_chain_wide && !checkIfUserIsAdmin()
                                                                                    ? '#6c757d' : '#ffc107',
                                                                            color: incentive.is_chain_wide && !checkIfUserIsAdmin()
                                                                                    ? 'white' : '#212529',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            cursor: incentive.is_chain_wide && !checkIfUserIsAdmin()
                                                                                    ? 'not-allowed' : 'pointer',
                                                                            fontSize: '12px',
                                                                            opacity: incentive.is_chain_wide && !checkIfUserIsAdmin()
                                                                                    ? 0.6 : 1
                                                                        }}
                                                                        disabled={incentive.is_chain_wide && !checkIfUserIsAdmin()}
                                                                        title={incentive.is_chain_wide && !checkIfUserIsAdmin()
                                                                                ? 'Admin access required for chain incentives' : 'Edit this incentive'}
                                                                >
                                                                    {incentive.is_chain_wide && !checkIfUserIsAdmin() ? 'Admin Only' : 'Edit'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                )}
                            </fieldset>
                    )}

                    {/* Step 4: Update Incentive Form */}
                    {showEditForm && selectedIncentive && (
                            <fieldset style={{ marginBottom: '30px', padding: '20px', border: '2px solid #ddd', borderRadius: '8px' }}>
                                <legend>
                                    <h3 style={{ color: '#003366', margin: '0 10px' }}>Step 4: Update Incentive Information</h3>
                                </legend>

                                <form onSubmit={handleIncentiveUpdate}>
                                    {/* Incentive Available Radio Buttons */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ marginBottom: '10px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input
                                                        type="radio"
                                                        name="incentiveAvailable"
                                                        value="true"
                                                        checked={editForm.incentiveAvailable === 'true'}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, incentiveAvailable: e.target.value }))}
                                                        style={{ marginRight: '10px', cursor: 'pointer' }}
                                                />
                                                <span>Incentive Available <span style={{ color: 'red' }}>*</span></span>
                                            </label>
                                        </div>
                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input
                                                        type="radio"
                                                        name="incentiveAvailable"
                                                        value="false"
                                                        checked={editForm.incentiveAvailable === 'false'}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, incentiveAvailable: e.target.value }))}
                                                        style={{ marginRight: '10px', cursor: 'pointer' }}
                                                />
                                                <span>Incentive NOT Available <span style={{ color: 'red' }}>*</span></span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Hidden field for NA when incentive is not available */}
                                    {editForm.incentiveAvailable === 'false' && (
                                            <div style={{
                                                marginBottom: '20px',
                                                padding: '15px',
                                                backgroundColor: '#f8f9fa',
                                                border: '1px solid #dee2e6',
                                                borderRadius: '4px'
                                            }}>
                                                <p style={{ margin: 0, color: '#666' }}>
                                                    ℹ️ This business does not offer incentives. The category will be set to "Not Available (NA)".
                                                </p>
                                            </div>
                                    )}

                                    {/* Show form fields only if incentive is available */}
                                    {editForm.incentiveAvailable === 'true' && (
                                            <>
                                                {/* Eligible Categories - Checkboxes */}
                                                <div style={{ marginBottom: '20px' }}>
                                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                                                        Eligible Categories <span style={{ color: 'red' }}>*</span>
                                                    </label>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '10px' }}>
                                                        {[
                                                            { value: 'VT', label: 'Veterans' },
                                                            { value: 'AD', label: 'Active Duty' },
                                                            { value: 'FR', label: 'First Responders' },
                                                            { value: 'SP', label: 'Military Spouses' },
                                                            { value: 'OT', label: 'Other (please describe)' }
                                                        ].map(category => (
                                                                <label key={category.value} style={{ display: 'flex', alignItems: 'center', cursor: editForm.incentiveAvailable === 'false' ? 'not-allowed' : 'pointer', opacity: editForm.incentiveAvailable === 'false' ? 0.5 : 1 }}>
                                                                    <input
                                                                            type="checkbox"
                                                                            value={category.value}
                                                                            checked={editForm.eligibleCategories.includes(category.value)}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                setEditForm(prev => ({
                                                                                    ...prev,
                                                                                    eligibleCategories: e.target.checked
                                                                                            ? [...prev.eligibleCategories, value]
                                                                                            : prev.eligibleCategories.filter(cat => cat !== value)
                                                                                }));
                                                                                console.log('Simple fix: Categories changed to', e.target.checked ? [...editForm.eligibleCategories, value] : editForm.eligibleCategories.filter(cat => cat !== value));
                                                                            }}
                                                                            disabled={editForm.incentiveAvailable === 'false'}
                                                                            style={{ marginRight: '10px', width: '18px', height: '18px', cursor: editForm.incentiveAvailable === 'false' ? 'not-allowed' : 'pointer' }}
                                                                    />
                                                                    <span>{category.label}</span>
                                                                </label>
                                                        ))}
                                                    </div>
                                                    {editForm.incentiveAvailable === 'true' && editForm.eligibleCategories.length === 0 && (
                                                            <small style={{ color: '#dc3545', display: 'block', marginTop: '5px' }}>
                                                                Please select at least one category
                                                            </small>
                                                    )}
                                                </div>

                                                {/* Other Type Description */}
                                                {editForm.eligibleCategories.includes('OT') && (
                                                        <div style={{ marginBottom: '20px' }}>
                                                            <label htmlFor="otherTypeDescription" style={{ display: 'block', marginBottom: '5px' }}>
                                                                Please Describe <span style={{ color: 'red' }}>*</span>
                                                            </label>
                                                            <input
                                                                    type="text"
                                                                    id="otherTypeDescription"
                                                                    value={editForm.otherTypeDescription}
                                                                    onChange={(e) => {
                                                                        setEditForm(prev => ({ ...prev, otherTypeDescription: e.target.value }));
                                                                        console.log('Simple fix: Other description changed to', e.target.value);
                                                                    }}
                                                                    placeholder="Describe the incentive type..."
                                                                    style={{
                                                                        padding: '8px',
                                                                        width: '400px',
                                                                        border: '1px solid #ccc',
                                                                        borderRadius: '4px',
                                                                        backgroundColor: editForm.incentiveAvailable === 'false' ? '#f5f5f5' : 'white',
                                                                        cursor: editForm.incentiveAvailable === 'false' ? 'not-allowed' : 'text'
                                                                    }}
                                                                    disabled={editForm.incentiveAvailable === 'false'}
                                                            />
                                                        </div>
                                                )}

                                                {/* Discount Type */}
                                                <div style={{ marginBottom: '20px' }}>
                                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Discount Type</label>
                                                    <div style={{ marginBottom: '10px' }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', cursor: editForm.incentiveAvailable === 'false' ? 'not-allowed' : 'pointer', opacity: editForm.incentiveAvailable === 'false' ? 0.5 : 1 }}>
                                                            <input
                                                                    type="radio"
                                                                    name="discountType"
                                                                    value="percentage"
                                                                    checked={editForm.discountType === 'percentage'}
                                                                    onChange={(e) => {
                                                                        setEditForm(prev => ({ ...prev, discountType: e.target.value }));
                                                                        console.log('Simple fix: Discount type changed to', e.target.value);
                                                                    }}
                                                                    style={{ marginRight: '10px', cursor: editForm.incentiveAvailable === 'false' ? 'not-allowed' : 'pointer' }}
                                                                    disabled={editForm.incentiveAvailable === 'false'}
                                                            />
                                                            <span>Percentage (%)</span>
                                                        </label>
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'flex', alignItems: 'center', cursor: editForm.incentiveAvailable === 'false' ? 'not-allowed' : 'pointer', opacity: editForm.incentiveAvailable === 'false' ? 0.5 : 1 }}>
                                                            <input
                                                                    type="radio"
                                                                    name="discountType"
                                                                    value="dollar"
                                                                    checked={editForm.discountType === 'dollar'}
                                                                    onChange={(e) => {
                                                                        setEditForm(prev => ({ ...prev, discountType: e.target.value }));
                                                                        console.log('Simple fix: Discount type changed to', e.target.value);
                                                                    }}
                                                                    style={{ marginRight: '10px', cursor: editForm.incentiveAvailable === 'false' ? 'not-allowed' : 'pointer' }}
                                                                    disabled={editForm.incentiveAvailable === 'false'}
                                                            />
                                                            <span>Dollar Amount ($)</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Incentive Amount */}
                                                <div style={{ marginBottom: '20px' }}>
                                                    <label htmlFor="incentiveAmount" style={{ display: 'block', marginBottom: '5px' }}>
                                                        Incentive Amount as a {editForm.discountType === 'percentage' ? '%' : ''} <span style={{ color: 'red' }}>*</span>
                                                        </label>
                                                        <input
                                                        type="number"
                                                        id="incentiveAmount"
                                                        value={editForm.incentiveAmount}
                                                           onChange={(e) => {
                                                               setEditForm(prev => ({ ...prev, incentiveAmount: e.target.value }));
                                                               console.log('Simple fix: Amount changed to', e.target.value);
                                                           }}
                                                           min="0"
                                                           max={editForm.discountType === 'percentage' ? '100' : '9999'}
                                                           step="0.1"
                                                           required={editForm.incentiveAvailable === 'true'}
                                                           style={{
                                                               padding: '8px',
                                                               width: '200px',
                                                               border: '1px solid #ccc',
                                                               borderRadius: '4px',
                                                               backgroundColor: editForm.incentiveAvailable === 'false' ? '#f5f5f5' : 'white',
                                                               cursor: editForm.incentiveAvailable === 'false' ? 'not-allowed' : 'text'
                                                           }}
                                                           disabled={editForm.incentiveAvailable === 'false'}
                                                    />
                                                </div>

                                                {/* Incentive Information */}
                                                <div style={{ marginBottom: '20px' }}>
                                                    <label htmlFor="incentiveInfo" style={{ display: 'block', marginBottom: '5px' }}>
                                                        Incentive Information <span style={{ color: 'red' }}>*</span>
                                                    </label>
                                                    <textarea
                                                            id="incentiveInfo"
                                                            value={editForm.incentiveInfo}
                                                            onChange={(e) => {
                                                                setEditForm(prev => ({ ...prev, incentiveInfo: e.target.value }));
                                                                console.log('Simple fix: Info changed to', e.target.value);
                                                            }}
                                                            rows="4"
                                                            placeholder="Please enter information about the discount/incentive..."
                                                            required={editForm.incentiveAvailable === 'true'}
                                                            style={{
                                                                padding: '8px',
                                                                width: '100%',
                                                                border: '1px solid #ccc',
                                                                borderRadius: '4px',
                                                                resize: 'vertical',
                                                                backgroundColor: editForm.incentiveAvailable === 'false' ? '#f5f5f5' : 'white',
                                                                cursor: editForm.incentiveAvailable === 'false' ? 'not-allowed' : 'text'
                                                            }}
                                                            disabled={editForm.incentiveAvailable === 'false'}
                                                    />
                                                </div>
                                            </>
                                        )}

                                    {/* Submit Buttons */}
                                    <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                        <button
                                                type="submit"
                                                disabled={loading}
                                                style={{
                                                    padding: '12px 30px',
                                                    backgroundColor: '#ffc107',
                                                    color: '#212529',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: loading ? 'not-allowed' : 'pointer',
                                                    opacity: loading ? 0.6 : 1,
                                                    fontSize: '16px',
                                                    marginRight: '10px'
                                                }}
                                        >
                                            {loading ? 'Updating...' : 'Update Incentive'}
                                        </button>

                                        <button
                                                type="button"
                                                onClick={() => {
                                                    setShowEditForm(false);
                                                    setSelectedIncentive(null);
                                                    setMessage({ type: '', text: '' });
                                                }}
                                                style={{
                                                    padding: '12px 30px',
                                                    backgroundColor: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '16px'
                                                }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </fieldset>
                        )}

                    {/* Required fields note */}
                    {showEditForm && (
                            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
                                <p><span style={{ color: 'red' }}>*</span> indicates required fields</p>
                            </div>
                    )}
                </main>
            </div>
);
}