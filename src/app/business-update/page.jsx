'use client';

// file: /src/app/business-update/page.jsx v2 - Fixed localStorage SSR issue

import { useState, useEffect } from 'react';
import Navigation from '../../components/layout/Navigation';

export default function BusinessUpdatePage() {
    const [searchData, setSearchData] = useState({
        businessName: '',
        address: ''
    });

    const [formData, setFormData] = useState({
        bname: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        type: '',
        status: 'active'
    });

    const [searchResults, setSearchResults] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [hasAccess, setHasAccess] = useState(false);
    const [userLevel, setUserLevel] = useState('Free');
    const [hasSearched, setHasSearched] = useState(false);
    const [isClient, setIsClient] = useState(false); // Add client-side check

    // Business types from the original HTML
    const businessTypes = [
        { value: '', label: 'Select a Business Type' },
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

    // US States
    const states = [
        { value: '', label: 'Select a State' },
        { value: 'AL', label: 'Alabama' },
        { value: 'AK', label: 'Alaska' },
        { value: 'AZ', label: 'Arizona' },
        { value: 'AR', label: 'Arkansas' },
        { value: 'CA', label: 'California' },
        { value: 'CO', label: 'Colorado' },
        { value: 'CT', label: 'Connecticut' },
        { value: 'DE', label: 'Delaware' },
        { value: 'DC', label: 'District Of Columbia' },
        { value: 'FL', label: 'Florida' },
        { value: 'GA', label: 'Georgia' },
        { value: 'HI', label: 'Hawaii' },
        { value: 'ID', label: 'Idaho' },
        { value: 'IL', label: 'Illinois' },
        { value: 'IN', label: 'Indiana' },
        { value: 'IA', label: 'Iowa' },
        { value: 'KS', label: 'Kansas' },
        { value: 'KY', label: 'Kentucky' },
        { value: 'LA', label: 'Louisiana' },
        { value: 'ME', label: 'Maine' },
        { value: 'MD', label: 'Maryland' },
        { value: 'MA', label: 'Massachusetts' },
        { value: 'MI', label: 'Michigan' },
        { value: 'MN', label: 'Minnesota' },
        { value: 'MS', label: 'Mississippi' },
        { value: 'MO', label: 'Missouri' },
        { value: 'MT', label: 'Montana' },
        { value: 'NE', label: 'Nebraska' },
        { value: 'NV', label: 'Nevada' },
        { value: 'NH', label: 'New Hampshire' },
        { value: 'NJ', label: 'New Jersey' },
        { value: 'NM', label: 'New Mexico' },
        { value: 'NY', label: 'New York' },
        { value: 'NC', label: 'North Carolina' },
        { value: 'ND', label: 'North Dakota' },
        { value: 'OH', label: 'Ohio' },
        { value: 'OK', label: 'Oklahoma' },
        { value: 'OR', label: 'Oregon' },
        { value: 'PA', label: 'Pennsylvania' },
        { value: 'RI', label: 'Rhode Island' },
        { value: 'SC', label: 'South Carolina' },
        { value: 'SD', label: 'South Dakota' },
        { value: 'TN', label: 'Tennessee' },
        { value: 'TX', label: 'Texas' },
        { value: 'UT', label: 'Utah' },
        { value: 'VT', label: 'Vermont' },
        { value: 'VA', label: 'Virginia' },
        { value: 'WA', label: 'Washington' },
        { value: 'WV', label: 'West Virginia' },
        { value: 'WI', label: 'Wisconsin' },
        { value: 'WY', label: 'Wyoming' }
    ];

    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending Review' }
    ];

    // FIXED: Set client-side flag and check membership access after component mounts
    useEffect(() => {
        setIsClient(true);
        checkMembershipAccess();
    }, []);

    // FIXED: Membership access check function with client-side guard
    const checkMembershipAccess = () => {
        // Only access localStorage on client-side
        if (typeof window === 'undefined') {
            return;
        }

        // Check if user is logged in
        const userToken = localStorage.getItem('userToken');
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const level = userData.level || 'Free';

        setUserLevel(level);

        // Business update requires Premium level or higher
        const requiredLevel = 'Premium';
        const levels = ['Free', 'Basic', 'Premium', 'VIP', 'Admin'];
        const hasRequiredLevel = levels.indexOf(level) >= levels.indexOf(requiredLevel);

        if (!userToken) {
            setHasAccess(false);
            setMessage({
                type: 'error',
                content: 'You must be logged in to update businesses. Please sign in to continue.'
            });
        } else if (!hasRequiredLevel) {
            setHasAccess(false);
            setMessage({
                type: 'warning',
                content: `Updating businesses requires a ${requiredLevel} membership or higher. Your current level: ${level}`
            });
        } else {
            setHasAccess(true);
        }
    };

    // Show premium feature message
    const showPremiumFeatureMessage = () => {
        return (
                <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <div className="pt-20 pb-12">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <div className="mb-6">
                                    <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Premium Feature</h1>
                                    <p className="text-lg text-gray-600 mb-2">
                                        Updating businesses requires a Premium membership or higher.
                                    </p>
                                    <p className="text-md text-gray-500 mb-6">
                                        Current membership level: <span className="font-semibold">{userLevel}</span>
                                    </p>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Coming Soon!</h3>
                                    <p className="text-blue-800">
                                        We're currently working on implementing premium memberships.
                                        For now, you can support us through donations!
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <a
                                            href="/donate"
                                            className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 font-medium"
                                    >
                                        Support Us
                                    </a>
                                    <a
                                            href="/search"
                                            className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 font-medium"
                                    >
                                        Back to Search
                                    </a>
                                </div>

                                {/* FIXED: Client-side check before accessing localStorage */}
                                {isClient && !localStorage.getItem('userToken') && (
                                        <div className="mt-6 pt-6 border-t">
                                            <p className="text-gray-600">
                                                Don't have an account?
                                                <a href="/register" className="text-red-600 hover:text-red-800 font-medium ml-1">
                                                    Sign up here
                                                </a>
                                            </p>
                                        </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
        );
    };

    // Handle search input changes
    const handleSearchInputChange = (e) => {
        const { name, value } = e.target;
        setSearchData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form input changes
    const handleFormInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // FIXED: Handle business search with client-side check
    const handleSearch = async (e) => {
        e.preventDefault();

        if (!hasAccess || !isClient) {
            return;
        }

        if (!searchData.businessName.trim() && !searchData.address.trim()) {
            setMessage({
                type: 'error',
                content: 'Please enter either a business name or address to search.'
            });
            return;
        }

        setSearchLoading(true);
        setHasSearched(true);
        setMessage({ type: '', content: '' });

        try {
            const params = new URLSearchParams();
            if (searchData.businessName) params.append('businessName', searchData.businessName);
            if (searchData.address) params.append('address', searchData.address);

            const response = await fetch(`/api/business?operation=search&${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setSearchResults(data.results || []);
                if (data.results.length === 0) {
                    setMessage({
                        type: 'info',
                        content: 'No businesses found matching your search criteria.'
                    });
                }
            } else {
                setMessage({
                    type: 'error',
                    content: 'Search failed. Please try again.'
                });
                setSearchResults([]);
            }
        } catch (error) {
            setMessage({
                type: 'error',
                content: 'Network error. Please check your connection and try again.'
            });
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    // Select business for editing
    const selectBusiness = (business) => {
        setSelectedBusiness(business);
        setFormData({
            bname: business.bname || '',
            address1: business.address1 || '',
            address2: business.address2 || '',
            city: business.city || '',
            state: business.state || '',
            zip: business.zip || '',
            phone: business.phone || '',
            type: business.type || '',
            status: business.status || 'active'
        });
        setMessage({ type: '', content: '' });
    };

    // Validate form data
    const validateForm = () => {
        const errors = [];

        if (!formData.bname.trim()) errors.push('Business Name');
        if (!formData.address1.trim()) errors.push('Address Line 1');
        if (!formData.city.trim()) errors.push('City');
        if (!formData.state) errors.push('State');
        if (!formData.zip.trim() || !/^\d{5}(-\d{4})?$/.test(formData.zip)) {
            errors.push('Zip Code (format: 12345 or 12345-6789)');
        }
        if (!formData.phone.trim() || !/^\d{3}-\d{3}-\d{4}$/.test(formData.phone)) {
            errors.push('Phone Number (format: 123-456-7890)');
        }
        if (!formData.type) errors.push('Business Type');
        if (!formData.status) errors.push('Status');

        return errors;
    };

    // FIXED: Handle form submission with client-side check
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!hasAccess || !selectedBusiness || !isClient) {
            return;
        }

        const errors = validateForm();
        if (errors.length > 0) {
            setMessage({
                type: 'error',
                content: `Please complete the following required fields: ${errors.join(', ')}`
            });
            return;
        }

        setLoading(true);
        setMessage({ type: '', content: '' });

        try {
            const response = await fetch(`/api/business?operation=update-business`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                },
                body: JSON.stringify({ businessId: selectedBusiness._id, ...formData })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({
                    type: 'success',
                    content: 'Business updated successfully! Thank you for keeping our database current.'
                });

                // Update the business in search results
                setSearchResults(prev =>
                        prev.map(business =>
                                business._id === selectedBusiness._id
                                        ? { ...business, ...formData }
                                        : business
                        )
                );
            } else {
                setMessage({
                    type: 'error',
                    content: data.message || 'Failed to update business. Please try again.'
                });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                content: 'Network error. Please check your connection and try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    // FIXED: Show loading or premium message while checking client-side access
    if (!isClient) {
        return (
                <div className="min-h-screen bg-gray-50">
                    <Navigation />
                    <div className="pt-20 pb-12">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading...</p>
                            </div>
                        </div>
                    </div>
                </div>
        );
    }

    // If no access, show premium message
    if (!hasAccess) {
        return showPremiumFeatureMessage();
    }

    return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />

                <div className="pt-20 pb-12">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                Update a Business
                            </h1>
                            <p className="text-lg text-gray-600">
                                This allows you to correct or update details for businesses that offer discounts and incentives
                                for active-duty, veterans, first responders, and their spouses.
                            </p>
                        </div>

                        {/* Message Display */}
                        {message.content && (
                                <div className={`mb-6 p-4 rounded-md ${
                                        message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                                                message.type === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-800' :
                                                        message.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
                                                                'bg-red-50 border border-red-200 text-red-800'
                                }`}>
                                    {message.content}
                                </div>
                        )}

                        {/* Step 1: Search for Business */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Step 1: Search for a Business</h2>
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                                            Business Name
                                        </label>
                                        <input
                                                type="text"
                                                id="businessName"
                                                name="businessName"
                                                value={searchData.businessName}
                                                onChange={handleSearchInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Business name..."
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                                            Address
                                        </label>
                                        <input
                                                type="text"
                                                id="address"
                                                name="address"
                                                value={searchData.address}
                                                onChange={handleSearchInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Street address, city, state, or zip..."
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-center">
                                    <button
                                            type="submit"
                                            disabled={searchLoading}
                                            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 font-medium"
                                    >
                                        {searchLoading ? 'Searching...' : 'Search Business'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Search Results */}
                        {hasSearched && (
                                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Search Results</h2>
                                    {searchLoading ? (
                                            <div className="text-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                                <p className="mt-2 text-gray-600">Searching...</p>
                                            </div>
                                    ) : searchResults.length > 0 ? (
                                            <div className="space-y-4">
                                                {searchResults.map((business) => (
                                                        <div
                                                                key={business._id}
                                                                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                                                        selectedBusiness?._id === business._id
                                                                                ? 'border-blue-500 bg-blue-50'
                                                                                : 'border-gray-200 hover:border-gray-300'
                                                                }`}
                                                                onClick={() => selectBusiness(business)}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                                        {business.bname}
                                                                    </h3>
                                                                    <p className="text-gray-600">
                                                                        {business.address1}
                                                                        {business.address2 && `, ${business.address2}`}
                                                                    </p>
                                                                    <p className="text-gray-600">
                                                                        {business.city}, {business.state} {business.zip}
                                                                    </p>
                                                                    {business.phone && (
                                                                            <p className="text-gray-600">📞 {business.phone}</p>
                                                                    )}
                                                                </div>
                                                                <div className="text-right">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                            business.status === 'active' ? 'bg-green-100 text-green-800' :
                                                                    business.status === 'inactive' ? 'bg-red-100 text-red-800' :
                                                                            'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {business.status || 'active'}
                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                ))}
                                            </div>
                                    ) : (
                                            <p className="text-gray-500 text-center py-8">
                                                No businesses found. Try adjusting your search criteria.
                                            </p>
                                    )}
                                </div>
                        )}

                        {/* Step 2: Update Business Information */}
                        {selectedBusiness && (
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Step 2: Update Business Information</h2>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label htmlFor="bname" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Business Name *
                                                </label>
                                                <input
                                                        type="text"
                                                        id="bname"
                                                        name="bname"
                                                        value={formData.bname}
                                                        onChange={handleFormInputChange}
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Business name..."
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Address Line 1 *
                                                </label>
                                                <input
                                                        type="text"
                                                        id="address1"
                                                        name="address1"
                                                        value={formData.address1}
                                                        onChange={handleFormInputChange}
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Street address..."
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Address Line 2
                                                </label>
                                                <input
                                                        type="text"
                                                        id="address2"
                                                        name="address2"
                                                        value={formData.address2}
                                                        onChange={handleFormInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Apartment, suite, etc..."
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                                                    City *
                                                </label>
                                                <input
                                                        type="text"
                                                        id="city"
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleFormInputChange}
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="City..."
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                                                    State *
                                                </label>
                                                <select
                                                        id="state"
                                                        name="state"
                                                        value={formData.state}
                                                        onChange={handleFormInputChange}
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    {states.map(state => (
                                                            <option key={state.value} value={state.value}>
                                                                {state.label}
                                                            </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Zip Code *
                                                </label>
                                                <input
                                                        type="text"
                                                        id="zip"
                                                        name="zip"
                                                        value={formData.zip}
                                                        onChange={handleFormInputChange}
                                                        required
                                                        pattern="^\d{5}(-\d{4})?$"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="12345 or 12345-6789"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Phone Number *
                                                </label>
                                                <input
                                                        type="tel"
                                                        id="phone"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleFormInputChange}
                                                        required
                                                        pattern="^\d{3}-\d{3}-\d{4}$"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="123-456-7890"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Business Type *
                                                </label>
                                                <select
                                                        id="type"
                                                        name="type"
                                                        value={formData.type}
                                                        onChange={handleFormInputChange}
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    {businessTypes.map(type => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Status *
                                                </label>
                                                <select
                                                        id="status"
                                                        name="status"
                                                        value={formData.status}
                                                        onChange={handleFormInputChange}
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    {statusOptions.map(status => (
                                                            <option key={status.value} value={status.value}>
                                                                {status.label}
                                                            </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="flex justify-center pt-6">
                                            <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="bg-red-600 text-white px-8 py-3 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 font-medium"
                                            >
                                                {loading ? 'Updating Business...' : 'Update Business'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                        )}
                    </div>
                </div>
            </div>
    );
}