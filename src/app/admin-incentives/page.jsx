'use client';
// file: /src/app/admin-incentives/page.jsx v2 - Updated to use NextAuth session instead of JWT tokens

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/layout/Navigation';
import { useAdminAuth } from '../../hooks/useAdminAuth';

export default function AdminIncentivesPage() {
    const { session, isAdmin, isLoading, user } = useAdminAuth();
    const router = useRouter();
    const [incentives, setIncentives] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalIncentives, setTotalIncentives] = useState(0);
    const [itemsPerPage] = useState(10);
    const [filters, setFilters] = useState({
        search: '',
        business: '',
        type: '',
        availability: ''
    });
    const [showIncentiveModal, setShowIncentiveModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingIncentive, setEditingIncentive] = useState(null);
    const [incentiveToDelete, setIncentiveToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Incentive form state
    const [incentiveForm, setIncentiveForm] = useState({
        business_id: '',
        is_available: true,
        type: '',
        amount: '',
        information: '',
        other_description: ''
    });

    // Incentive types
    const incentiveTypes = [
        { value: 'VT', label: 'Veteran' },
        { value: 'AD', label: 'Active-Duty' },
        { value: 'FR', label: 'First Responder' },
        { value: 'SP', label: 'Spouse' },
        { value: 'OT', label: 'Other' }
    ];

    useEffect(() => {
        if (isAdmin) {
            loadIncentives();
            loadBusinesses();
        }
    }, [isAdmin, currentPage, filters]);

    const loadIncentives = async () => {
        try {
            const params = new URLSearchParams({
                operation: 'admin-list-incentives',
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                ...filters
            });

            const response = await fetch(`/api/combined-api?${params}`);

            if (response.ok) {
                const data = await response.json();
                setIncentives(data.incentives || []);
                setTotalPages(data.totalPages || 0);
                setTotalIncentives(data.total || 0);
            } else {
                throw new Error('Failed to load incentives');
            }
        } catch (error) {
            console.error('Error loading incentives:', error);
            setMessage({ type: 'error', text: 'Failed to load incentives' });
        }
    };

    const loadBusinesses = async () => {
        try {
            const response = await fetch('/api/combined-api?operation=list-businesses-for-dropdown');

            if (response.ok) {
                const data = await response.json();
                setBusinesses(data.businesses || []);
            } else {
                throw new Error('Failed to load businesses');
            }
        } catch (error) {
            console.error('Error loading businesses:', error);
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
            business: '',
            type: '',
            availability: ''
        });
        setCurrentPage(1);
    };

    const openIncentiveModal = (incentive = null) => {
        if (incentive) {
            setEditingIncentive(incentive);
            setIncentiveForm({
                business_id: incentive.business_id || '',
                is_available: incentive.is_available !== false,
                type: incentive.type || '',
                amount: incentive.amount || '',
                information: incentive.information || '',
                other_description: incentive.other_description || ''
            });
        } else {
            setEditingIncentive(null);
            setIncentiveForm({
                business_id: '',
                is_available: true,
                type: '',
                amount: '',
                information: '',
                other_description: ''
            });
        }
        setShowIncentiveModal(true);
    };

    const handleIncentiveFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setIncentiveForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleIncentiveSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Validation
        const errors = [];
        if (!incentiveForm.business_id) errors.push('Please select a business');

        if (incentiveForm.is_available) {
            if (!incentiveForm.type) errors.push('Please select an incentive type');
            if (!incentiveForm.amount || isNaN(parseFloat(incentiveForm.amount))) {
                errors.push('Please enter a valid incentive amount');
            }
            if (!incentiveForm.information.trim()) errors.push('Please provide incentive information');
            if (incentiveForm.type === 'OT' && !incentiveForm.other_description.trim()) {
                errors.push('Please provide a description for the "Other" incentive type');
            }
        }

        if (errors.length > 0) {
            setMessage({ type: 'error', text: errors.join(', ') });
            setIsSubmitting(false);
            return;
        }

        try {
            const incentiveData = {
                ...incentiveForm,
                amount: parseFloat(incentiveForm.amount) || 0,
                ...(editingIncentive && { _id: editingIncentive._id })
            };

            const response = await fetch('/api/combined-api', {
                method: editingIncentive ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    operation: editingIncentive ? 'admin-update-incentive' : 'admin-create-incentive',
                    incentiveData
                })
            });

            if (response.ok) {
                setMessage({
                    type: 'success',
                    text: `Incentive ${editingIncentive ? 'updated' : 'created'} successfully!`
                });
                setShowIncentiveModal(false);
                loadIncentives();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save incentive');
            }
        } catch (error) {
            console.error('Error saving incentive:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteModal = (incentive) => {
        setIncentiveToDelete(incentive);
        setShowDeleteModal(true);
    };

    const handleDeleteIncentive = async () => {
        if (!incentiveToDelete) return;

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/combined-api', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    operation: 'admin-delete-incentive',
                    incentiveId: incentiveToDelete._id
                })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Incentive deleted successfully!' });
                setShowDeleteModal(false);
                setIncentiveToDelete(null);
                loadIncentives();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete incentive');
            }
        } catch (error) {
            console.error('Error deleting incentive:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getIncentiveTypeLabel = (type) => {
        const incentiveType = incentiveTypes.find(it => it.value === type);
        return incentiveType ? incentiveType.label : type;
    };

    const getBusinessName = (businessId) => {
        const business = businesses.find(b => b._id === businessId);
        return business ? business.bname : 'Unknown Business';
    };

    const getBusinessLocation = (businessId) => {
        const business = businesses.find(b => b._id === businessId);
        return business ? `${business.city}, ${business.state}` : 'N/A';
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
                    <div>Loading admin incentives...</div>
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
                            <h4 style={{ margin: '5px 0 0 0', color: '#666' }}>Admin Dashboard - Incentive Management</h4>
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
                                    onClick={() => openIncentiveModal()}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                            >
                                Add New Incentive
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
                            Incentive Management
                            <span style={{
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                marginLeft: '10px'
                            }}>
                        {totalIncentives} total
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
                                Search Incentives
                            </label>
                            <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    placeholder="Search by business or information..."
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
                                Business
                            </label>
                            <select
                                    value={filters.business}
                                    onChange={(e) => handleFilterChange('business', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                            >
                                <option value="">All Businesses</option>
                                {businesses.map(business => (
                                        <option key={business._id} value={business._id}>
                                            {business.bname}
                                        </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Type
                            </label>
                            <select
                                    value={filters.type}
                                    onChange={(e) => handleFilterChange('type', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                            >
                                <option value="">All Types</option>
                                {incentiveTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Availability
                            </label>
                            <select
                                    value={filters.availability}
                                    onChange={(e) => handleFilterChange('availability', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                            >
                                <option value="">All</option>
                                <option value="true">Available</option>
                                <option value="false">Not Available</option>
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

                    {/* Incentives Table */}
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
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Business</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Location</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Type</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Available</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Amount (%)</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Information</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Date Added</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {incentives.length > 0 ? (
                                        incentives.map((incentive, index) => (
                                                <tr key={incentive._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                    <td style={{ padding: '15px' }}>
                                                        <div style={{ fontWeight: 'bold' }}>
                                                            {getBusinessName(incentive.business_id)}
                                                        </div>
                                                        {incentive.is_chain_wide && (
                                                                <span style={{
                                                                    padding: '2px 6px',
                                                                    backgroundColor: '#6f42c1',
                                                                    color: 'white',
                                                                    borderRadius: '3px',
                                                                    fontSize: '0.7rem',
                                                                    marginTop: '4px',
                                                                    display: 'inline-block'
                                                                }}>
                                            Chain-wide
                                        </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        {getBusinessLocation(incentive.business_id)}
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        backgroundColor: '#007bff',
                                        color: 'white'
                                    }}>
                                        {getIncentiveTypeLabel(incentive.type)}
                                    </span>
                                                        {incentive.type === 'OT' && incentive.other_description && (
                                                                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                                                    {incentive.other_description}
                                                                </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        backgroundColor: incentive.is_available ? '#28a745' : '#dc3545',
                                        color: 'white'
                                    }}>
                                        {incentive.is_available ? 'Yes' : 'No'}
                                    </span>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        {incentive.is_available ? `${incentive.amount}%` : 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '15px', maxWidth: '200px' }}>
                                                        <div style={{
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {incentive.information || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        {incentive.created_at ? new Date(incentive.created_at).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                            <button
                                                                    onClick={() => openIncentiveModal(incentive)}
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
                                                                    onClick={() => openDeleteModal(incentive)}
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
                                            <td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
                                                No incentives found
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

                {/* Incentive Modal */}
                {showIncentiveModal && (
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
                                maxWidth: '600px',
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
                                        {editingIncentive ? 'Edit Incentive' : 'Add New Incentive'}
                                    </h3>
                                    <button
                                            onClick={() => setShowIncentiveModal(false)}
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

                                <form onSubmit={handleIncentiveSubmit} style={{ padding: '20px' }}>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Business *
                                        </label>
                                        <select
                                                name="business_id"
                                                value={incentiveForm.business_id}
                                                onChange={handleIncentiveFormChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px'
                                                }}
                                        >
                                            <option value="">Select a Business</option>
                                            {businesses.map(business => (
                                                    <option key={business._id} value={business._id}>
                                                        {business.bname} - {business.city}, {business.state}
                                                    </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                            Incentive Availability *
                                        </label>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input
                                                        type="radio"
                                                        name="is_available"
                                                        checked={incentiveForm.is_available === true}
                                                        onChange={() => handleIncentiveFormChange({ target: { name: 'is_available', value: true, type: 'radio' }})}
                                                        style={{ marginRight: '8px' }}
                                                />
                                                Available
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input
                                                        type="radio"
                                                        name="is_available"
                                                        checked={incentiveForm.is_available === false}
                                                        onChange={() => handleIncentiveFormChange({ target: { name: 'is_available', value: false, type: 'radio' }})}
                                                        style={{ marginRight: '8px' }}
                                                />
                                                Not Available
                                            </label>
                                        </div>
                                    </div>

                                    {incentiveForm.is_available && (
                                            <>
                                                <div style={{ marginBottom: '15px' }}>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                        Incentive Type *
                                                    </label>
                                                    <select
                                                            name="type"
                                                            value={incentiveForm.type}
                                                            onChange={handleIncentiveFormChange}
                                                            required={incentiveForm.is_available}
                                                            style={{
                                                                width: '100%',
                                                                padding: '8px',
                                                                border: '1px solid #ddd',
                                                                borderRadius: '4px'
                                                            }}
                                                    >
                                                        <option value="">Select Type</option>
                                                        {incentiveTypes.map(type => (
                                                                <option key={type.value} value={type.value}>
                                                                    {type.label}
                                                                </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {incentiveForm.type === 'OT' && (
                                                        <div style={{ marginBottom: '15px' }}>
                                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                                Other Description *
                                                            </label>
                                                            <input
                                                                    type="text"
                                                                    name="other_description"
                                                                    value={incentiveForm.other_description}
                                                                    onChange={handleIncentiveFormChange}
                                                                    placeholder="Describe the incentive type"
                                                                    required={incentiveForm.type === 'OT'}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '8px',
                                                                        border: '1px solid #ddd',
                                                                        borderRadius: '4px'
                                                                    }}
                                                            />
                                                        </div>
                                                )}

                                                <div style={{ marginBottom: '15px' }}>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                        Amount (%) *
                                                    </label>
                                                    <input
                                                            type="number"
                                                            name="amount"
                                                            value={incentiveForm.amount}
                                                            onChange={handleIncentiveFormChange}
                                                            placeholder="Enter percentage"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            required={incentiveForm.is_available}
                                                            style={{
                                                                width: '100%',
                                                                padding: '8px',
                                                                border: '1px solid #ddd',
                                                                borderRadius: '4px'
                                                            }}
                                                    />
                                                </div>

                                                <div style={{ marginBottom: '20px' }}>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                        Information *
                                                    </label>
                                                    <textarea
                                                            name="information"
                                                            value={incentiveForm.information}
                                                            onChange={handleIncentiveFormChange}
                                                            placeholder="Provide details about the incentive"
                                                            required={incentiveForm.is_available}
                                                            rows="4"
                                                            style={{
                                                                width: '100%',
                                                                padding: '8px',
                                                                border: '1px solid #ddd',
                                                                borderRadius: '4px',
                                                                resize: 'vertical'
                                                            }}
                                                    />
                                                </div>
                                            </>
                                    )}

                                    {!incentiveForm.is_available && (
                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                    Information
                                                </label>
                                                <textarea
                                                        name="information"
                                                        value={incentiveForm.information || 'No incentives available at this business.'}
                                                        onChange={handleIncentiveFormChange}
                                                        rows="3"
                                                        style={{
                                                            width: '100%',
                                                            padding: '8px',
                                                            border: '1px solid #ddd',
                                                            borderRadius: '4px',
                                                            resize: 'vertical'
                                                        }}
                                                />
                                            </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                        <button
                                                type="button"
                                                onClick={() => setShowIncentiveModal(false)}
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
                                            {isSubmitting ? 'Saving...' : (editingIncentive ? 'Update Incentive' : 'Create Incentive')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && incentiveToDelete && (
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
                                <h3 style={{ marginTop: 0, color: '#dc3545' }}>Confirm Delete Incentive</h3>
                                <p style={{ marginBottom: '20px' }}>
                                    Are you sure you want to delete this incentive for <strong>{getBusinessName(incentiveToDelete.business_id)}</strong>?
                                    <br />
                                    <br />
                                    <strong>Type:</strong> {getIncentiveTypeLabel(incentiveToDelete.type)}
                                    <br />
                                    <strong>Amount:</strong> {incentiveToDelete.amount}%
                                    <br />
                                    <br />
                                    This action cannot be undone.
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button
                                            onClick={() => {
                                                setShowDeleteModal(false);
                                                setIncentiveToDelete(null);
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
                                            onClick={handleDeleteIncentive}
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
                                        {isSubmitting ? 'Deleting...' : 'Delete Incentive'}
                                    </button>
                                </div>
                            </div>
                        </div>
                )}
            </div>
    );
}