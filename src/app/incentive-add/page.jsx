'use client';
// file: /src/app/incentive-add/page.jsx v1 - React/Next.js version of incentive-add.html

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/layout/Navigation';

export default function IncentiveAddPage() {
    const router = useRouter();

    // State management
    const [searchForm, setSearchForm] = useState({
        businessName: '',
        address: ''
    });

    const [searchResults, setSearchResults] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [showBusinessInfo, setShowBusinessInfo] = useState(false);
    const [showIncentiveForm, setShowIncentiveForm] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const [incentiveForm, setIncentiveForm] = useState({
        incentiveAvailable: 'true',
        incentiveType: '',
        discountType: 'percentage',
        incentiveAmount: '',
        incentiveInfo: '',
        otherTypeDescription: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Enhanced useEffect to handle form field enabling/disabling (simple-incentive-fix equivalent)
    useEffect(() => {
        console.log('Form field states updated based on availability:', incentiveForm.incentiveAvailable);
        // React handles the field enabling/disabling through conditional rendering and state
    }, [incentiveForm.incentiveAvailable]);

    // Enhanced useEffect to handle "Other" type description field visibility
    useEffect(() => {
        console.log('Incentive type changed:', incentiveForm.incentiveType);
        // React handles this through conditional rendering
    }, [incentiveForm.incentiveType]);

    // Handle business search
    const handleSearch = async (e) => {
        e.preventDefault();

        if (!searchForm.businessName.trim() && !searchForm.address.trim()) {
            setMessage({ type: 'error', text: 'Please enter either a business name or address to search.' });
            return;
        }

        setIsSearching(true);
        setSearchResults([]);

        try {
            const queryParams = new URLSearchParams();
            if (searchForm.businessName.trim()) {
                queryParams.append('business_name', searchForm.businessName.trim());
            }
            if (searchForm.address.trim()) {
                queryParams.append('address', searchForm.address.trim());
            }
            queryParams.append('operation', 'business');

            const response = await fetch(`/api/combined-api?${queryParams}`);

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

    // Handle business selection
    const handleBusinessSelect = (business) => {
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
        setShowIncentiveForm(true);
        setSearchResults([]);
        setMessage({ type: '', text: '' });
    };

    // Check if user is admin (you'll need to implement this based on your auth system)
    const checkIfUserIsAdmin = () => {
        // This should check your authentication system
        // For now, returning false - implement based on your auth logic
        try {
            const sessionData = localStorage.getItem('patriotThanksSession');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                return session?.user?.level === 'Admin' || session?.user?.isAdmin === true;
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
        }
        return false;
    };

    // Handle incentive form submission
    const handleIncentiveSubmit = async (e) => {
        e.preventDefault();

        if (!selectedBusiness) {
            setMessage({ type: 'error', text: 'Please select a business first.' });
            return;
        }

        // Validate required fields when incentive is available
        if (incentiveForm.incentiveAvailable === 'true') {
            if (!incentiveForm.incentiveType) {
                setMessage({ type: 'error', text: 'Please select an incentive type.' });
                return;
            }
            if (!incentiveForm.incentiveAmount) {
                setMessage({ type: 'error', text: 'Please enter an incentive amount.' });
                return;
            }
            if (!incentiveForm.incentiveInfo.trim()) {
                setMessage({ type: 'error', text: 'Please enter incentive information.' });
                return;
            }
            if (incentiveForm.incentiveType === 'OT' && !incentiveForm.otherTypeDescription.trim()) {
                setMessage({ type: 'error', text: 'Please describe the "Other" incentive type.' });
                return;
            }
        }

        setLoading(true);

        try {
            const incentiveData = {
                business_id: selectedBusiness._id,
                is_available: incentiveForm.incentiveAvailable === 'true',
                type: incentiveForm.incentiveType,
                discount_type: incentiveForm.discountType,
                amount: parseFloat(incentiveForm.incentiveAmount) || 0,
                information: incentiveForm.incentiveInfo,
                ...(incentiveForm.incentiveType === 'OT' && { other_description: incentiveForm.otherTypeDescription })
            };

            // Get user info for created_by field
            const sessionData = localStorage.getItem('patriotThanksSession');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                if (session?.user?._id) {
                    incentiveData.created_by = session.user._id;
                }
            }

            const response = await fetch('/api/combined-api?operation=admin-incentives&action=add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(incentiveData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add incentive');
            }

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Incentive added successfully!' });

                // Reset form after successful submission
                setTimeout(() => {
                    setSelectedBusiness(null);
                    setShowBusinessInfo(false);
                    setShowIncentiveForm(false);
                    setIncentiveForm({
                        incentiveAvailable: 'true',
                        incentiveType: '',
                        discountType: 'percentage',
                        incentiveAmount: '',
                        incentiveInfo: '',
                        otherTypeDescription: ''
                    });
                    setSearchForm({ businessName: '', address: '' });
                    setMessage({ type: '', text: '' });
                }, 2000);
            } else {
                throw new Error(data.message || 'Failed to add incentive');
            }
        } catch (error) {
            console.error('Error adding incentive:', error);
            setMessage({ type: 'error', text: 'Error adding incentive: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    // Handle start over functionality
    const handleStartOver = () => {
        setSelectedBusiness(null);
        setShowBusinessInfo(false);
        setShowIncentiveForm(false);
        setSearchResults([]);
        setSearchForm({ businessName: '', address: '' });
        setIncentiveForm({
            incentiveAvailable: 'true',
            incentiveType: '',
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
                            <h4 style={{ margin: '0', color: '#666' }}>Add a Business Incentive</h4>
                        </div>
                    </div>
                </header>

                <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                    <section>
                        <h2>Add an incentive for a business to our database</h2>
                        <p style={{ marginBottom: '30px' }}>
                            In Patriot Thanks, you can add an incentive for a business within your local
                            area that offers discounts and/or incentives for "active-duty, veterans, first responders, and their
                            spouses." If you know of a business that offers discounts and/or incentives, Please add the incentives/discounts here.
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

                                {/* Chain warning */}
                                {selectedBusiness.chain_id && (
                                        <div style={{
                                            backgroundColor: '#fff3cd',
                                            border: '1px solid #ffeaa7',
                                            borderRadius: '4px',
                                            padding: '10px',
                                            marginBottom: '20px'
                                        }}>
                                            <p><strong>{selectedBusiness.bname}</strong> is part of a national chain.</p>
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

                    {/* Step 3: Incentive Information */}
                    {showIncentiveForm && (
                            <fieldset style={{ marginBottom: '30px', padding: '20px', border: '2px solid #ddd', borderRadius: '8px' }}>
                                <legend>
                                    <h3 style={{ color: '#003366', margin: '0 10px' }}>Step 3: Add Incentive Information</h3>
                                </legend>

                                <form onSubmit={handleIncentiveSubmit}>
                                    {/* Incentive Available Radio Buttons */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ marginBottom: '10px' }}>
                                            <label style={{ marginRight: '20px' }}>
                                                <input
                                                        type="radio"
                                                        name="incentiveAvailable"
                                                        value="true"
                                                        checked={incentiveForm.incentiveAvailable === 'true'}
                                                        onChange={(e) => setIncentiveForm(prev => ({ ...prev, incentiveAvailable: e.target.value }))}
                                                        style={{ marginRight: '5px' }}
                                                />
                                                Incentive Available <span style={{ color: 'red' }}>*</span>
                                            </label>
                                        </div>
                                        <div>
                                            <label>
                                                <input
                                                        type="radio"
                                                        name="incentiveAvailable"
                                                        value="false"
                                                        checked={incentiveForm.incentiveAvailable === 'false'}
                                                        onChange={(e) => setIncentiveForm(prev => ({ ...prev, incentiveAvailable: e.target.value }))}
                                                        style={{ marginRight: '5px' }}
                                                />
                                                Incentive NOT Available <span style={{ color: 'red' }}>*</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Show form fields only if incentive is available */}
                                    {incentiveForm.incentiveAvailable === 'true' && (
                                            <>
                                                {/* Incentive Type */}
                                                <div style={{ marginBottom: '20px' }}>
                                                    <label htmlFor="incentiveType" style={{ display: 'block', marginBottom: '5px' }}>
                                                        Incentive Type <span style={{ color: 'red' }}>*</span>
                                                    </label>
                                                    <select
                                                            id="incentiveType"
                                                            value={incentiveForm.incentiveType}
                                                            onChange={(e) => setIncentiveForm(prev => ({ ...prev, incentiveType: e.target.value }))}
                                                            required={incentiveForm.incentiveAvailable === 'true'}
                                                            style={{ padding: '8px', width: '200px', border: '1px solid #ccc', borderRadius: '4px' }}
                                                    >
                                                        <option value="">Select an Incentive Type</option>
                                                        <option value="VT">Veteran</option>
                                                        <option value="AD">Active-Duty</option>
                                                        <option value="FR">First Responder</option>
                                                        <option value="SP">Spouse</option>
                                                        <option value="OT">Other (please describe)</option>
                                                    </select>
                                                </div>

                                                {/* Other Type Description */}
                                                {incentiveForm.incentiveType === 'OT' && (
                                                        <div style={{ marginBottom: '20px' }}>
                                                            <label htmlFor="otherTypeDescription" style={{ display: 'block', marginBottom: '5px' }}>
                                                                Please Describe <span style={{ color: 'red' }}>*</span>
                                                            </label>
                                                            <input
                                                                    type="text"
                                                                    id="otherTypeDescription"
                                                                    value={incentiveForm.otherTypeDescription}
                                                                    onChange={(e) => setIncentiveForm(prev => ({ ...prev, otherTypeDescription: e.target.value }))}
                                                                    placeholder="Describe the incentive type..."
                                                                    style={{ padding: '8px', width: '400px', border: '1px solid #ccc', borderRadius: '4px' }}
                                                            />
                                                        </div>
                                                )}

                                                {/* Discount Type */}
                                                <div style={{ marginBottom: '20px' }}>
                                                    <label style={{ display: 'block', marginBottom: '10px' }}>Discount Type</label>
                                                    <div style={{ marginBottom: '10px' }}>
                                                        <label style={{ marginRight: '20px' }}>
                                                            <input
                                                                    type="radio"
                                                                    name="discountType"
                                                                    value="percentage"
                                                                    checked={incentiveForm.discountType === 'percentage'}
                                                                    onChange={(e) => setIncentiveForm(prev => ({ ...prev, discountType: e.target.value }))}
                                                                    style={{ marginRight: '5px' }}
                                                            />
                                                            Percentage (%)
                                                        </label>
                                                    </div>
                                                    <div>
                                                        <label>
                                                            <input
                                                                    type="radio"
                                                                    name="discountType"
                                                                    value="dollar"
                                                                    checked={incentiveForm.discountType === 'dollar'}
                                                                    onChange={(e) => setIncentiveForm(prev => ({ ...prev, discountType: e.target.value }))}
                                                                    style={{ marginRight: '5px' }}
                                                            />
                                                            Dollar Amount ($)
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Incentive Amount */}
                                                <div style={{ marginBottom: '20px' }}>
                                                    <label htmlFor="incentiveAmount" style={{ display: 'block', marginBottom: '5px' }}>
                                                        Incentive Amount as a {incentiveForm.discountType === 'percentage' ? '%' : '$'} <span style={{ color: 'red' }}>*</span>
                                                    </label>
                                                    <input
                                                            type="number"
                                                            id="incentiveAmount"
                                                            value={incentiveForm.incentiveAmount}
                                                            onChange={(e) => setIncentiveForm(prev => ({ ...prev, incentiveAmount: e.target.value }))}
                                                            min="0"
                                                            max={incentiveForm.discountType === 'percentage' ? '100' : '9999'}
                                                            step="0.1"
                                                            required={incentiveForm.incentiveAvailable === 'true'}
                                                            style={{ padding: '8px', width: '200px', border: '1px solid #ccc', borderRadius: '4px' }}
                                                    />
                                                </div>

                                                {/* Incentive Information */}
                                                <div style={{ marginBottom: '20px' }}>
                                                    <label htmlFor="incentiveInfo" style={{ display: 'block', marginBottom: '5px' }}>
                                                        Incentive Information <span style={{ color: 'red' }}>*</span>
                                                    </label>
                                                    <textarea
                                                            id="incentiveInfo"
                                                            value={incentiveForm.incentiveInfo}
                                                            onChange={(e) => setIncentiveForm(prev => ({ ...prev, incentiveInfo: e.target.value }))}
                                                            rows="4"
                                                            placeholder="Please enter information about the discount/incentive..."
                                                            required={incentiveForm.incentiveAvailable === 'true'}
                                                            style={{ padding: '8px', width: '100%', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
                                                    />
                                                </div>
                                            </>
                                    )}

                                    {/* Submit Button */}
                                    <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                        <button
                                                type="submit"
                                                disabled={loading}
                                                style={{
                                                    padding: '12px 30px',
                                                    backgroundColor: '#0000ff',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: loading ? 'not-allowed' : 'pointer',
                                                    opacity: loading ? 0.6 : 1,
                                                    fontSize: '16px',
                                                    marginRight: '10px'
                                                }}
                                        >
                                            {loading ? 'Adding Incentive...' : 'Add Incentive'}
                                        </button>

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
                                                    fontSize: '16px'
                                                }}
                                        >
                                            Start Over
                                        </button>
                                    </div>
                                </form>
                            </fieldset>
                    )}

                    {/* Required fields note */}
                    {showIncentiveForm && (
                            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
                                <p><span style={{ color: 'red' }}>*</span> indicates required fields</p>
                            </div>
                    )}
                </main>
            </div>
    );
}