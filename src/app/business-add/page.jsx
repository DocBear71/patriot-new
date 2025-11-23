'use client';

// file: /src/app/business-add/page.jsx v3 - Fixed for NextAuth authentication

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navigation from '../../components/layout/Navigation';
import Footer from '../../components/legal/Footer';
import Link from 'next/link';

export default function BusinessAddPage() {
    const { data: session, status } = useSession();

    const [formData, setFormData] = useState({
        bname: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        type: '',
        chainId: '',
        chainName: '',
        isChainLocation: false,
        latitude: '',
        longitude: '',
        placeId: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [hasAccess, setHasAccess] = useState(false);
    const [userLevel, setUserLevel] = useState('Free');

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

    // Helper to show which fields were auto-filled
    const [autoFilledFields, setAutoFilledFields] = useState([]);

    useEffect(() => {
        const prefillData = sessionStorage.getItem('prefillBusinessData');
        if (prefillData) {
            setAutoFilledFields(['bname', 'address1', 'city', 'state', 'zip', 'phone', 'website']);
        }
    }, []);

    // Helper function to check if field was auto-filled
    const isAutoFilled = (fieldName) => autoFilledFields.includes(fieldName);

    // Check membership access when session changes
    useEffect(() => {
        if (status === 'loading') return; // Still loading session
        checkMembershipAccess();
    }, [session, status]);

    // Auto-populate form from Google Places data (when redirected from map)
    useEffect(() => {
        const prefillData = sessionStorage.getItem('prefillBusinessData');

        if (prefillData) {
            try {
                const businessData = JSON.parse(prefillData);
                console.log('📝 Auto-populating form with Google Places data:', businessData);

                // Parse the address to extract street address from full formatted address
                let streetAddress = businessData.address1;

                // If address1 contains the full formatted address, try to extract just the street
                if (streetAddress && streetAddress.includes(',')) {
                    // Split by comma and take the first part (street address)
                    streetAddress = streetAddress.split(',')[0].trim();
                }

                // Clean phone number - remove +1 and format for US
                let cleanPhone = businessData.phone || '';
                if (cleanPhone) {
                    // Remove country code +1 and any spaces/special chars except digits and dashes
                    cleanPhone = cleanPhone.replace(/^\+1\s*/, ''); // Remove +1 at start
                    cleanPhone = cleanPhone.replace(/[^\d-]/g, ''); // Keep only digits and dashes

                    // If it's just digits, format it as XXX-XXX-XXXX
                    if (/^\d{10}$/.test(cleanPhone.replace(/-/g, ''))) {
                        const digits = cleanPhone.replace(/-/g, '');
                        cleanPhone = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
                    }

                    console.log('📞 Cleaned phone number:', businessData.phone, '→', cleanPhone);
                }

                // Set form data with Google Places information INCLUDING coordinates
                setFormData(prev => ({
                    ...prev,
                    bname: businessData.bname || '',
                    address1: streetAddress || '',
                    address2: businessData.address2 || '',
                    city: businessData.city || '',
                    state: businessData.state || '',
                    zip: businessData.zip || '',
                    phone: cleanPhone,
                    latitude: businessData.lat || '',
                    longitude: businessData.lng || '',
                    placeId: businessData.placeId || ''
                }));

                // Store the Google Place ID for reference (if needed later)
                if (businessData.placeId) {
                    console.log('📍 Google Place ID:', businessData.placeId);
                }

                // Clear session storage after loading
                sessionStorage.removeItem('prefillBusinessData');

                // Show success message to user
                setMessage({
                    text: '✅ Business information auto-filled from Google Maps! Please verify the details and add incentive information.',
                    type: 'success'
                });

                console.log('✅ Form auto-populated successfully with coordinates:', {
                    lat: businessData.lat,
                    lng: businessData.lng
                });

            } catch (error) {
                console.error('❌ Error parsing prefill data:', error);
                sessionStorage.removeItem('prefillBusinessData');
                setMessage({
                    text: 'Error loading business data. Please fill in the form manually.',
                    type: 'error'
                });
            }
        }
    }, []);

    // FIXED: NextAuth-based membership access check
    const checkMembershipAccess = () => {
        console.log('Checking access with NextAuth session:', session);
        console.log('Session status:', status);

        if (status === 'loading') {
            return; // Still loading
        }

        if (status === 'unauthenticated' || !session?.user) {
            setHasAccess(false);
            setUserLevel('Free');
            setMessage({
                type: 'error',
                content: 'You must be logged in to add businesses. Please sign in to continue.'
            });
            return;
        }

        const user = session.user;
        const level = user.level || 'Free';
        setUserLevel(level);

        console.log('User access check:', {
            level: user.level,
            isAdmin: user.isAdmin,
            email: user.email
        });

        // FIXED: Admin should have universal access
        if (user.isAdmin === true || user.level === 'Admin') {
            console.log('Admin access granted');
            setHasAccess(true);
            return;
        }

        // Business add requires Basic level or higher
        const requiredLevel = 'Basic';
        const levels = ['Free', 'Basic', 'Premium', 'VIP', 'Admin'];
        const hasRequiredLevel = levels.indexOf(level) >= levels.indexOf(requiredLevel);

        if (hasRequiredLevel) {
            setHasAccess(true);
        } else {
            setHasAccess(false);
            setMessage({
                type: 'warning',
                content: `Adding businesses requires a ${requiredLevel} membership or higher. Your current level: ${level}`
            });
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
                                    <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Premium Feature</h1>
                                    <p className="text-lg text-gray-600 mb-2">
                                        Adding businesses requires a Basic membership or higher.
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

                                {status === 'unauthenticated' && (
                                        <div className="mt-6 pt-6 border-t">
                                            <p className="text-gray-600">
                                                Don't have an account?
                                                <a href="/auth/signup" className="text-red-600 hover:text-red-800 font-medium ml-1">
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

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
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

        return errors;
    };

    // FIXED: Handle form submission with NextAuth
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!hasAccess || status !== 'authenticated') {
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
            // Prepare data for your business API
            const businessData = {
                name: formData.bname,  // Use 'name' field for the business-management API
                address1: formData.address1,
                address2: formData.address2,
                city: formData.city,
                state: formData.state,
                zip: formData.zip,
                phone: formData.phone,
                type: formData.type,
                chain_id: formData.chainId || null,
                lat: formData.latitude || null,
                lng: formData.longitude || null,
                google_place_id: formData.placeId || null,
                created_by: session.user.id || session.user._id
            };

            // Use your business-management API with 'add' operation
            const response = await fetch('/api/business-management?operation=add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(businessData)
            });

            const data = await response.json();

            if (response.ok) {
                // Reset form first
                setFormData({
                    bname: '',
                    address1: '',
                    address2: '',
                    city: '',
                    state: '',
                    zip: '',
                    phone: '',
                    type: '',
                    chainId: '',
                    chainName: '',
                    isChainLocation: false,
                    latitude: '',
                    longitude: '',
                    placeId: ''
                });

                // Set success message
                setMessage({
                    type: 'success',
                    content: 'Business added successfully! Thank you for contributing to our database.'
                });

                // Scroll to top to show success message
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                setMessage({
                    type: 'error',
                    content: data.message || 'Failed to add business. Please try again.'
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

    // Show loading while checking session
    if (status === 'loading') {
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
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div id="page-top" className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                Add a Business
                            </h1>
                            <p className="text-lg text-gray-600">
                                If you know of a business that offers discounts and/or incentives, please add them here.
                            </p>
                            {/* Debug info for admin */}
                            {session?.user?.isAdmin && (
                                    <div className="mt-4 p-2 bg-green-100 border border-green-200 rounded text-sm">
                                        Admin Access: Logged in as {session.user.fname} {session.user.lname} ({session.user.level})
                                    </div>
                            )}
                        </div>

                        {/* Message Display */}
                        {message.content && (
                                <div className={`mb-6 p-4 rounded-md ${
                                        message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                                                message.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
                                                        'bg-red-50 border border-red-200 text-red-800'
                                }`}>
                                    {message.content}
                                </div>
                        )}

                        {/* Business Form */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Chain Information */}
                                <div className="border-b pb-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Chain Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="chainName" className="block text-sm font-medium text-gray-700 mb-2">
                                                Chain Name (if applicable)
                                            </label>
                                            <input
                                                    type="text"
                                                    id="chainName"
                                                    name="chainName"
                                                    value={formData.chainName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="e.g. McDonald's, Walmart"
                                            />
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                    type="checkbox"
                                                    id="isChainLocation"
                                                    name="isChainLocation"
                                                    checked={formData.isChainLocation}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="isChainLocation" className="ml-2 block text-sm text-gray-900">
                                                This is a chain location
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
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
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Business name..."
                                            />
                                            {isAutoFilled('bname') && (
                                                    <p className="text-xs text-blue-600 mt-1">✓ Auto-filled from Google Maps</p>
                                            )}
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
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Street address..."
                                            />
                                            {isAutoFilled('address1') && (
                                                    <p className="text-xs text-blue-600 mt-1">✓ Auto-filled from Google Maps</p>
                                            )}
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
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Apartment, suite, etc..."
                                            />
                                            {isAutoFilled('address2') && (
                                                    <p className="text-xs text-blue-600 mt-1">✓ Auto-filled from Google Maps</p>
                                            )}
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
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="City..."
                                            />
                                            {isAutoFilled('city') && (
                                                    <p className="text-xs text-blue-600 mt-1">✓ Auto-filled from Google Maps</p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                                                State *
                                            </label>
                                            <select
                                                    id="state"
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                {states.map(state => (
                                                        <option key={state.value} value={state.value}>
                                                            {state.label}
                                                        </option>
                                                ))}
                                            </select>
                                            {isAutoFilled('state') && (
                                                    <p className="text-xs text-blue-600 mt-1">✓ Auto-filled from Google Maps</p>
                                            )}
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
                                                    onChange={handleInputChange}
                                                    required
                                                    pattern="^\d{5}(-\d{4})?$"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="12345 or 12345-6789"
                                            />
                                            {isAutoFilled('zip') && (
                                                    <p className="text-xs text-blue-600 mt-1">✓ Auto-filled from Google Maps</p>
                                            )}
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
                                                    onChange={handleInputChange}
                                                    required
                                                    pattern="^\d{3}-\d{3}-\d{4}$"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="123-456-7890"
                                            />
                                            {isAutoFilled('phone') && (
                                                    <p className="text-xs text-blue-600 mt-1">✓ Auto-filled from Google Maps</p>
                                            )}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                                                Business Type *
                                            </label>
                                            <select
                                                    id="type"
                                                    name="type"
                                                    value={formData.type}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                {businessTypes.map(type => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                ))}
                                            </select>
                                            {isAutoFilled('type') && (
                                                    <p className="text-xs text-blue-600 mt-1">✓ Auto-filled from Google Maps</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Veteran-Owned Business Section - NEW */}
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                        <span>🇺🇸</span>
                                        Is This a Veteran-Owned Business?
                                    </h3>

                                    <div className="space-y-4">
                                        {/* Check if current user is VBO */}
                                        {session?.user?.serviceType === 'VBO' && session?.user?.veteranBusinessOwner?.verificationStatus === 'verified' ? (
                                                <>
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                        <label className="flex items-start gap-3">
                                                            <input
                                                                    type="checkbox"
                                                                    checked={formData.veteranOwned?.isVeteranOwned || false}
                                                                    onChange={(e) => setFormData({
                                                                        ...formData,
                                                                        veteranOwned: {
                                                                            isVeteranOwned: e.target.checked,
                                                                            verificationStatus: e.target.checked ? 'verified' : 'self_attested',
                                                                            primaryOwnerId: e.target.checked ? session.user.id : null,
                                                                            displayBadge: e.target.checked,
                                                                            priority: {
                                                                                isPriority: e.target.checked,
                                                                                priorityScore: e.target.checked ? 10 : 0
                                                                            }
                                                                        }
                                                                    })}
                                                                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                            />
                                                            <div>
                                                    <span className="font-medium text-gray-900">
                                                        I am adding my own veteran-owned business
                                                    </span>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    Your verified status will automatically apply the Veteran-Owned badge and priority placement.
                                                                </p>
                                                            </div>
                                                        </label>
                                                    </div>

                                                    {formData.veteranOwned?.isVeteranOwned && (
                                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                                <div className="flex items-start gap-3">
                                                                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                    </svg>
                                                                    <div>
                                                                        <h4 className="font-medium text-green-900">✓ Veteran-Owned Benefits Active</h4>
                                                                        <ul className="mt-2 text-sm text-green-800 space-y-1">
                                                                            <li>• Display verified Veteran-Owned badge</li>
                                                                            <li>• Priority placement in search results</li>
                                                                            <li>• Featured in Veteran Business Directory</li>
                                                                            <li>• Increased visibility to customers</li>
                                                                        </ul>
                                                                        <div className="mt-3 inline-flex items-center gap-2 bg-white border border-green-300 rounded-full px-3 py-1.5">
                                                                            <span className="text-red-600 font-bold">🇺🇸</span>
                                                                            <span className="text-xs font-semibold text-red-700">Verified Veteran-Owned</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                    )}
                                                </>
                                        ) : session?.user?.serviceType === 'VBO' && session?.user?.veteranBusinessOwner?.verificationStatus === 'pending' ? (
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                    <div className="flex items-start gap-3">
                                                        <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        <div>
                                                            <h4 className="font-medium text-yellow-900">Verification Pending</h4>
                                                            <p className="text-sm text-yellow-800 mt-1">
                                                                Your veteran status is under review. Once verified, you can add veteran-owned businesses with the verified badge.
                                                            </p>
                                                            <Link
                                                                    href="/veteran-verification"
                                                                    className="text-sm text-yellow-900 underline hover:text-yellow-700 mt-2 inline-block"
                                                            >
                                                                Check status →
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                        ) : session?.user?.serviceType === 'VBO' ? (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                    <div className="flex items-start gap-3">
                                                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                        </svg>
                                                        <div>
                                                            <h4 className="font-medium text-blue-900">Complete Verification First</h4>
                                                            <p className="text-sm text-blue-800 mt-1">
                                                                Verify your veteran status to add businesses with the official Veteran-Owned badge.
                                                            </p>
                                                            <Link
                                                                    href="/veteran-verification"
                                                                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium mt-3"
                                                            >
                                                                Start Verification
                                                                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                        ) : session ? (
                                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                    <p className="text-sm text-gray-700">
                                                        <strong>Are you a veteran business owner?</strong>
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-2">
                                                        Register as a Veteran Business Owner to display the verified badge and get priority placement.
                                                    </p>
                                                    <Link
                                                            href="/profile"
                                                            className="text-sm text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                                                    >
                                                        Update your profile to VBO →
                                                    </Link>
                                                </div>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-center pt-6">
                                    <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-red-600 text-white px-8 py-3 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 font-medium"
                                    >
                                        {loading ? 'Adding Business...' : 'Submit Business'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
    );
}