'use client';
// file: /src/app/admin-business/page.jsx v1 - Admin Business Management for Patriot Thanks

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/layout/Navigation';
import { useAdminAuth } from '../../hooks/useAdminAuth';

export default function AdminBusinessPage() {
    const { session, isAdmin, isLoading, user } = useAdminAuth();
    const router = useRouter();
    const [businesses, setBusinesses] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalBusinesses, setTotalBusinesses] = useState(0);
    const [itemsPerPage] = useState(10);
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        status: '',
        veteranOwned: ''
    });
    const [showBusinessModal, setShowBusinessModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingBusiness, setEditingBusiness] = useState(null);
    const [businessToDelete, setBusinessToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Business form state
    const [businessForm, setBusinessForm] = useState({
        bname: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        type: '',
        status: 'active',
        veteranOwned: {
            isVeteranOwned: false,
            verificationStatus: 'unverified',
            priority: {
                isFeatured: false,
                searchBoost: 0
            }
        }
    });

    // Business types/categories
    const businessTypes = [
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

    const states = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];

    // useEffect(() => {
    //     checkAdminAccess();
    // }, []);

    useEffect(() => {
        if (isAdmin) {
            loadBusinesses();
        }
    }, [isAdmin, currentPage, filters]);

    // const checkAdminAccess = async () => {
    //     try {
    //         const sessionData = localStorage.getItem('patriotThanksSession');
    //         if (!sessionData) {
    //             router.push('../../auth/signin');
    //             return;
    //         }
    //
    //         const session = JSON.parse(sessionData);
    //         if (!session.user.isAdmin && session.user.level !== 'Admin') {
    //             alert('Admin access required');
    //             router.push('/');
    //             return;
    //         }
    //
    //         setIsAdmin(true);
    //     } catch (error) {
    //         console.error('Error checking admin access:', error);
    //         router.push('../../auth/signin');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const loadBusinesses = async () => {
        try {

            const params = new URLSearchParams({
                operation: 'admin-list-businesses',
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                ...filters
            });

            const response = await fetch(`/api/business-admin?${params}`);

            if (response.ok) {
                const data = await response.json();
                setBusinesses(data.businesses || []);
                setTotalPages(data.totalPages || 0);
                setTotalBusinesses(data.total || 0);
            } else {
                throw new Error('Failed to load businesses');
            }
        } catch (error) {
            console.error('Error loading businesses:', error);
            setMessage({ type: 'error', text: 'Failed to load businesses' });
        }
    };

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
        setCurrentPage(1); // Reset to first page when filtering
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            category: '',
            status: '',
            veteranOwned: ''
        });
        setCurrentPage(1);
    };

    const openBusinessModal = (business = null) => {
        if (business) {
            setEditingBusiness(business);
            setBusinessForm({
                bname: business.bname || '',
                address1: business.address1 || '',
                address2: business.address2 || '',
                city: business.city || '',
                state: business.state || '',
                zip: business.zip || '',
                phone: business.phone || '',
                type: business.type || '',
                status: business.status || 'active',
                veteranOwned: {
                    isVeteranOwned: business.veteranOwned?.isVeteranOwned || false,
                    verificationStatus: business.veteranOwned?.verificationStatus || 'unverified',
                    priority: {
                        isFeatured: business.veteranOwned?.priority?.isFeatured || false,
                        searchBoost: business.veteranOwned?.priority?.searchBoost || 0
                    }
                }
            });
        } else {
            setEditingBusiness(null);
            setBusinessForm({
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
        }
        setShowBusinessModal(true);
    };

    const handleBusinessFormChange = (e) => {
        const { name, value } = e.target;
        setBusinessForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validatePhoneNumber = (phone) => {
        const phoneRegex = /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/;
        return phoneRegex.test(phone);
    };

    const validateZipCode = (zip) => {
        const zipRegex = /^[0-9]{5}(-[0-9]{4})?$/;
        return zipRegex.test(zip);
    };

    const handleBusinessSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Validate required fields
        const requiredFields = ['bname', 'address1', 'city', 'state', 'zip', 'phone', 'type'];
        const invalidFields = [];

        requiredFields.forEach(field => {
            if (!businessForm[field] || !businessForm[field].trim()) {
                invalidFields.push(field);
            }
        });

        // Validate phone format
        if (businessForm.phone && !validatePhoneNumber(businessForm.phone)) {
            invalidFields.push('phone format (123-456-7890)');
        }

        // Validate zip format
        if (businessForm.zip && !validateZipCode(businessForm.zip)) {
            invalidFields.push('zip format (12345 or 12345-6789)');
        }

        if (invalidFields.length > 0) {
            setMessage({
                type: 'error',
                text: `Please check the following fields: ${invalidFields.join(', ')}`
            });
            setIsSubmitting(false);
            return;
        }

        try {
            // ❌ REMOVE THESE LINES:
            // const sessionData = localStorage.getItem('patriotThanksSession');
            // const session = JSON.parse(sessionData);

            const businessData = {
                ...businessForm,
                ...(editingBusiness && { _id: editingBusiness._id })
            };

            // Build URL with operation parameter
            const operation = editingBusiness ? 'admin-update-business' : 'admin-create-business';
            const url = `/api/business-admin?operation=${operation}`;

            const response = await fetch(url, {
                method: editingBusiness ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(businessData)
            });

            if (response.ok) {
                setMessage({
                    type: 'success',
                    text: `Business ${editingBusiness ? 'updated' : 'created'} successfully!`
                });
                setShowBusinessModal(false);
                loadBusinesses();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save business');
            }
        } catch (error) {
            console.error('Error saving business:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteModal = (business) => {
        setBusinessToDelete(business);
        setShowDeleteModal(true);
    };

    const handleDeleteBusiness = async () => {
        if (!businessToDelete) return;

        setIsSubmitting(true);

        try {
            // ❌ REMOVE THESE LINES:
            // const sessionData = localStorage.getItem('patriotThanksSession');
            // const session = JSON.parse(sessionData);

            // ✅ UPDATED FETCH CALL (removed Authorization header):
            const response = await fetch('/api/business-admin', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    operation: 'delete-business',
                    businessId: businessToDelete._id
                })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Business deleted successfully!' });
                setShowDeleteModal(false);
                setBusinessToDelete(null);
                loadBusinesses();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete business');
            }
        } catch (error) {
            console.error('Error deleting business:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getBusinessTypeLabel = (type) => {
        const businessType = businessTypes.find(bt => bt.value === type);
        return businessType ? businessType.label : type;
    };

    const getStatusBadgeColor = (status) => {
        return status === 'active' ? '#28a745' : '#6c757d';
    };

    const generatePageNumbers = () => {
        const pages = [];
        const delta = 2;
        const start = Math.max(1, currentPage - delta);
        const end = Math.min(totalPages, currentPage + delta);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    };

    if (isLoading) {
        return (
                <div style={{ paddingTop: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div>Loading admin businesses...</div>
                </div>
        );
    }

    if (!isAdmin) {
        return (
                <div style={{ paddingTop: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div>Access denied. Admin privileges required.</div>
                </div>
        );
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
                        <div style={{ flex: 1 }}>
                            <h1 style={{ margin: 0, color: '#003366' }}>Patriot Thanks</h1>
                            <h4 style={{ margin: '5px 0 0 0', color: '#666' }}>Admin Dashboard - Business Management</h4>
                        </div>
                        <div>
                            <button
                                    onClick={() => router.push('/admin/dashboard')}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        marginRight: '10px'
                                    }}
                            >
                                Return to Dashboard
                            </button>
                            <button
                                    onClick={() => openBusinessModal()}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                            >
                                Add New Business
                            </button>
                        </div>
                    </div>
                </header>

                <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px'
                    }}>
                        <h2 style={{ margin: 0, color: '#003366' }}>
                            Business Management
                            <span style={{
                                backgroundColor: '#28a745',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                marginLeft: '10px'
                            }}>
                            {totalBusinesses} total
                        </span>
                        </h2>
                    </div>

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

                    {/* Filters */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        marginBottom: '20px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '15px',
                        alignItems: 'end'
                    }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Search Businesses
                            </label>
                            <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    placeholder="Search by name or location..."
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Category
                            </label>
                            <select
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                            >
                                <option value="">All Categories</option>
                                {businessTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Status
                            </label>
                            <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div>
                            <button
                                    onClick={resetFilters}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>

                    {/* Businesses Table */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f8f9fa' }}>
                                <tr>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Name</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Location</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Category</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Phone</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Status</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Created</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {businesses.length > 0 ? (
                                        businesses.map((business, index) => (
                                                <tr key={business._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                    <td style={{ padding: '15px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            <div style={{ fontWeight: 'bold' }}>
                                                                {business.bname}
                                                            </div>
                                                            {business.veteranOwned?.isVeteranOwned && (
                                                                    <span style={{
                                                                        padding: '2px 8px',
                                                                        backgroundColor: '#fecaca',
                                                                        color: '#991b1b',
                                                                        borderRadius: '12px',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: '500',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}>
                                                                    🇺🇸 VBO
                                                                </span>
                                                            )}
                                                            {business.veteranOwned?.priority?.isFeatured && (
                                                                    <span style={{
                                                                        padding: '2px 8px',
                                                                        backgroundColor: '#fef3c7',
                                                                        color: '#92400e',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: '500',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}>
                                                                    ⭐ Featured
                                                                </span>
                                                            )}
                                                        </div>
                                                        {business.is_chain && (
                                                                <span style={{
                                                                    padding: '2px 6px',
                                                                    backgroundColor: '#6f42c1',
                                                                    color: 'white',
                                                                    borderRadius: '3px',
                                                                    fontSize: '0.7rem',
                                                                    marginTop: '4px',
                                                                    display: 'inline-block'
                                                                }}>
                                                                Chain
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        <div>{business.address1}</div>
                                                        {business.address2 && (
                                                                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                                                    {business.address2}
                                                                </div>
                                                        )}
                                                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                                            {business.city}, {business.state} {business.zip}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        {getBusinessTypeLabel(business.type)}
                                                    </td>
                                                    <td style={{ padding: '15px' }}>{business.phone}</td>
                                                    <td style={{ padding: '15px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    backgroundColor: getStatusBadgeColor(business.status),
                                                    color: 'white'
                                                }}>
                                                    {business.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        {business.created_at ? new Date(business.created_at).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                            <button
                                                                    onClick={() => openBusinessModal(business)}
                                                                    style={{
                                                                        padding: '4px 8px',
                                                                        backgroundColor: '#17a2b8',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.8rem'
                                                                    }}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                    onClick={() => openDeleteModal(business)}
                                                                    style={{
                                                                        padding: '4px 8px',
                                                                        backgroundColor: '#dc3545',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.8rem'
                                                                    }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                        ))
                                ) : (
                                        <tr>
                                            <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
                                                No businesses found
                                            </td>
                                        </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginTop: '20px',
                                gap: '5px'
                            }}>
                                <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        style={{
                                            padding: '8px 12px',
                                            backgroundColor: currentPage === 1 ? '#f8f9fa' : '#007bff',
                                            color: currentPage === 1 ? '#6c757d' : 'white',
                                            border: '1px solid #dee2e6',
                                            borderRadius: '4px',
                                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                        }}
                                >
                                    Previous
                                </button>

                                {generatePageNumbers().map(pageNum => (
                                        <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                style={{
                                                    padding: '8px 12px',
                                                    backgroundColor: currentPage === pageNum ? '#007bff' : 'white',
                                                    color: currentPage === pageNum ? 'white' : '#007bff',
                                                    border: '1px solid #007bff',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                        >
                                            {pageNum}
                                        </button>
                                ))}

                                <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        style={{
                                            padding: '8px 12px',
                                            backgroundColor: currentPage === totalPages ? '#f8f9fa' : '#007bff',
                                            color: currentPage === totalPages ? '#6c757d' : 'white',
                                            border: '1px solid #dee2e6',
                                            borderRadius: '4px',
                                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                                        }}
                                >
                                    Next
                                </button>
                            </div>
                    )}
                </main>

                {/* Business Modal */}
                {showBusinessModal && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000
                        }}>
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                width: '90%',
                                maxWidth: '700px',
                                maxHeight: '90vh',
                                overflow: 'auto'
                            }}>
                                <div style={{
                                    padding: '20px',
                                    borderBottom: '1px solid #dee2e6',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <h3 style={{ margin: 0 }}>
                                        {editingBusiness ? 'Edit Business' : 'Add New Business'}
                                    </h3>
                                    <button
                                            onClick={() => setShowBusinessModal(false)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                fontSize: '24px',
                                                cursor: 'pointer',
                                                color: '#6c757d'
                                            }}
                                    >
                                        ×
                                    </button>
                                </div>

                                <form onSubmit={handleBusinessSubmit} style={{ padding: '20px' }}>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Business Name *
                                        </label>
                                        <input
                                                type="text"
                                                name="bname"
                                                value={businessForm.bname}
                                                onChange={handleBusinessFormChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px'
                                                }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Address Line 1 *
                                        </label>
                                        <input
                                                type="text"
                                                name="address1"
                                                value={businessForm.address1}
                                                onChange={handleBusinessFormChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px'
                                                }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Address Line 2
                                        </label>
                                        <input
                                                type="text"
                                                name="address2"
                                                value={businessForm.address2}
                                                onChange={handleBusinessFormChange}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px'
                                                }}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px', gap: '15px', marginBottom: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                City *
                                            </label>
                                            <input
                                                    type="text"
                                                    name="city"
                                                    value={businessForm.city}
                                                    onChange={handleBusinessFormChange}
                                                    required
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                State *
                                            </label>
                                            <select
                                                    name="state"
                                                    value={businessForm.state}
                                                    onChange={handleBusinessFormChange}
                                                    required
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                            >
                                                <option value="">Select State</option>
                                                {states.map(state => (
                                                        <option key={state} value={state}>{state}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                ZIP Code *
                                            </label>
                                            <input
                                                    type="text"
                                                    name="zip"
                                                    value={businessForm.zip}
                                                    onChange={handleBusinessFormChange}
                                                    required
                                                    pattern="[0-9]{5}(-[0-9]{4})?"
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Phone Number *
                                            </label>
                                            <input
                                                    type="tel"
                                                    name="phone"
                                                    value={businessForm.phone}
                                                    onChange={handleBusinessFormChange}
                                                    required
                                                    placeholder="123-456-7890"
                                                    pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                            />
                                            <small style={{ color: '#666' }}>Format: 123-456-7890</small>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Status
                                            </label>
                                            <select
                                                    name="status"
                                                    value={businessForm.status}
                                                    onChange={handleBusinessFormChange}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Veteran-Owned Business
                                            </label>
                                            <select
                                                    value={businessForm.veteranOwned?.isVeteranOwned ? 'true' : 'false'}
                                                    onChange={(e) => setBusinessForm(prev => ({
                                                        ...prev,
                                                        veteranOwned: {
                                                            ...prev.veteranOwned,
                                                            isVeteranOwned: e.target.value === 'true'
                                                        }
                                                    }))}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                            >
                                                <option value="false">No</option>
                                                <option value="true">Yes - Veteran-Owned</option>
                                            </select>
                                        </div>

                                        {businessForm.veteranOwned?.isVeteranOwned && (
                                                <>
                                                    <div style={{ marginBottom: '15px' }}>
                                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                            Verification Status
                                                        </label>
                                                        <select
                                                                value={businessForm.veteranOwned?.verificationStatus || 'unverified'}
                                                                onChange={(e) => setBusinessForm(prev => ({
                                                                    ...prev,
                                                                    veteranOwned: {
                                                                        ...prev.veteranOwned,
                                                                        verificationStatus: e.target.value
                                                                    }
                                                                }))}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '8px',
                                                                    border: '1px solid #ddd',
                                                                    borderRadius: '4px'
                                                                }}
                                                        >
                                                            <option value="unverified">Unverified</option>
                                                            <option value="pending">Pending Verification</option>
                                                            <option value="verified">Verified</option>
                                                        </select>
                                                    </div>

                                                    <div style={{ marginBottom: '15px' }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <input
                                                                    type="checkbox"
                                                                    checked={businessForm.veteranOwned?.priority?.isFeatured || false}
                                                                    onChange={(e) => setBusinessForm(prev => ({
                                                                        ...prev,
                                                                        veteranOwned: {
                                                                            ...prev.veteranOwned,
                                                                            priority: {
                                                                                ...prev.veteranOwned.priority,
                                                                                isFeatured: e.target.checked
                                                                            }
                                                                        }
                                                                    }))}
                                                                    style={{
                                                                        width: '18px',
                                                                        height: '18px'
                                                                    }}
                                                            />
                                                            <span style={{ fontWeight: 'bold' }}>⭐ Feature this business</span>
                                                        </label>
                                                        <small style={{ color: '#666', marginLeft: '26px', display: 'block' }}>
                                                            Featured businesses appear first in search results
                                                        </small>
                                                    </div>
                                                </>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Business Type *
                                        </label>
                                        <select
                                                name="type"
                                                value={businessForm.type}
                                                onChange={handleBusinessFormChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px'
                                                }}
                                        >
                                            <option value="">Select a Business Type</option>
                                            {businessTypes.map(type => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                        <button
                                                type="button"
                                                onClick={() => setShowBusinessModal(false)}
                                                style={{
                                                    padding: '10px 20px',
                                                    backgroundColor: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                style={{
                                                    padding: '10px 20px',
                                                    backgroundColor: isSubmitting ? '#6c757d' : '#28a745',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                                                }}
                                        >
                                            {isSubmitting ? 'Saving...' : (editingBusiness ? 'Update Business' : 'Create Business')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && businessToDelete && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000
                        }}>
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                width: '90%',
                                maxWidth: '500px',
                                padding: '30px'
                            }}>
                                <h3 style={{ marginTop: 0, color: '#dc3545' }}>Confirm Delete Business</h3>
                                <p style={{ marginBottom: '20px' }}>
                                    Are you sure you want to delete <strong>{businessToDelete.bname}</strong>?
                                    This action cannot be undone and will also remove all associated incentives.
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button
                                            onClick={() => {
                                                setShowDeleteModal(false);
                                                setBusinessToDelete(null);
                                            }}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                            onClick={handleDeleteBusiness}
                                            disabled={isSubmitting}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: isSubmitting ? '#6c757d' : '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: isSubmitting ? 'not-allowed' : 'pointer'
                                            }}
                                    >
                                        {isSubmitting ? 'Deleting...' : 'Delete Business'}
                                    </button>
                                </div>
                            </div>
                        </div>
                )}
            </div>
    );
}