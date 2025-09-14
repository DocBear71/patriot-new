'use client';
// file: /src/app/admin-users/page.jsx v2 - Updated to use NextAuth session instead of JWT tokens

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/layout/Navigation';
import { useAdminAuth } from '../../hooks/useAdminAuth';

export default function AdminUsersPage() {
    const { session, isAdmin, isLoading, user } = useAdminAuth();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [itemsPerPage] = useState(10);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        level: ''
    });
    const [showUserModal, setShowUserModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // User form state
    const [userForm, setUserForm] = useState({
        fname: '',
        lname: '',
        email: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        status: '',
        level: 'Free'
    });

    // Status and level options
    const statusOptions = [
        { value: 'VT', label: 'Veteran' },
        { value: 'AD', label: 'Active-Duty' },
        { value: 'FR', label: 'First Responder' },
        { value: 'SP', label: 'Spouse' },
        { value: 'BO', label: 'Business Owner' },
        { value: 'SU', label: 'Supporter' }
    ];

    const levelOptions = [
        { value: 'Free', label: 'Free' },
        { value: 'Basic', label: 'Basic' },
        { value: 'Premium', label: 'Premium' },
        { value: 'VIP', label: 'V.I.P.' },
        { value: 'Admin', label: 'Admin' }
    ];

    const states = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];

    useEffect(() => {
        if (isAdmin) {
            loadUsers();
        }
    }, [isAdmin, currentPage, filters]);

    const loadUsers = async () => {
        try {
            const params = new URLSearchParams({
                operation: 'list-users',
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                ...filters
            });

            const response = await fetch(`/api/auth?${params}`);

            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
                setTotalPages(data.totalPages || 0);
                setTotalUsers(data.total || data.totalUsers || 0);
            } else {
                throw new Error('Failed to load users');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            setMessage({ type: 'error', text: 'Failed to load users' });
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
            status: '',
            level: ''
        });
        setCurrentPage(1);
    };

    const openUserModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setUserForm({
                fname: user.fname || '',
                lname: user.lname || '',
                email: user.email || '',
                address1: user.address1 || '',
                address2: user.address2 || '',
                city: user.city || '',
                state: user.state || '',
                zip: user.zip || '',
                status: user.status || '',
                level: user.level || 'Free'
            });
        } else {
            setEditingUser(null);
            setUserForm({
                fname: '',
                lname: '',
                email: '',
                address1: '',
                address2: '',
                city: '',
                state: '',
                zip: '',
                status: '',
                level: 'Free'
            });
        }
        setShowUserModal(true);
    };

    const handleUserFormChange = (e) => {
        const { name, value } = e.target;
        setUserForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const userData = {
                ...userForm,
                ...(editingUser && { userId: editingUser._id })
            };

            const response = await fetch('/api/auth', {
                method: editingUser ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    operation: editingUser ? 'update-user' : 'register',
                    userData: editingUser ? userData : userForm
                })
            });

            if (response.ok) {
                setMessage({
                    type: 'success',
                    text: `User ${editingUser ? 'updated' : 'created'} successfully!`
                });
                setShowUserModal(false);
                loadUsers();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save user');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteModal = (user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/auth', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    operation: 'delete-user',
                    userId: userToDelete._id
                })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'User deleted successfully!' });
                setShowDeleteModal(false);
                setUserToDelete(null);
                loadUsers();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusLabel = (status) => {
        const option = statusOptions.find(opt => opt.value === status);
        return option ? option.label : status;
    };

    const getStatusBadgeColor = (status) => {
        const colors = {
            'VT': '#28a745',
            'AD': '#007bff',
            'FR': '#dc3545',
            'SP': '#ffc107',
            'BO': '#6f42c1',
            'SU': '#17a2b8'
        };
        return colors[status] || '#6c757d';
    };

    const getLevelBadgeColor = (level) => {
        const colors = {
            'Free': '#6c757d',
            'Basic': '#28a745',
            'Premium': '#007bff',
            'VIP': '#ffc107',
            'Admin': '#dc3545'
        };
        return colors[level] || '#6c757d';
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
                    <div>Loading admin users...</div>
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
                            <h4 style={{ margin: '5px 0 0 0', color: '#666' }}>Admin Dashboard - User Management</h4>
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
                                    onClick={() => openUserModal()}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                            >
                                Add New User
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
                            User Management
                            <span style={{
                                backgroundColor: '#17a2b8',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                marginLeft: '10px'
                            }}>
                        {totalUsers} total
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
                                Search Users
                            </label>
                            <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    placeholder="Search by name or email..."
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
                                {statusOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Level
                            </label>
                            <select
                                    value={filters.level}
                                    onChange={(e) => handleFilterChange('level', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                            >
                                <option value="">All Levels</option>
                                {levelOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                ))}
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

                    {/* Users Table */}
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
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Email</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Location</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Status</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Level</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Created</th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {users.length > 0 ? (
                                        users.map((user, index) => (
                                                <tr key={user._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                    <td style={{ padding: '15px' }}>
                                                        <div style={{ fontWeight: 'bold' }}>
                                                            {user.fname} {user.lname}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>{user.email}</td>
                                                    <td style={{ padding: '15px' }}>
                                                        {user.city && user.state ? `${user.city}, ${user.state}` : 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        backgroundColor: getStatusBadgeColor(user.status),
                                        color: 'white'
                                    }}>
                                        {getStatusLabel(user.status)}
                                    </span>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        backgroundColor: getLevelBadgeColor(user.level),
                                        color: 'white'
                                    }}>
                                        {user.level || 'Free'}
                                    </span>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                            <button
                                                                    onClick={() => openUserModal(user)}
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
                                                                    onClick={() => openDeleteModal(user)}
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
                                                No users found
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

                {/* User Modal */}
                {showUserModal && (
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
                                        {editingUser ? 'Edit User' : 'Add New User'}
                                    </h3>
                                    <button
                                            onClick={() => setShowUserModal(false)}
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

                                <form onSubmit={handleUserSubmit} style={{ padding: '20px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                First Name *
                                            </label>
                                            <input
                                                    type="text"
                                                    name="fname"
                                                    value={userForm.fname}
                                                    onChange={handleUserFormChange}
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
                                                Last Name *
                                            </label>
                                            <input
                                                    type="text"
                                                    name="lname"
                                                    value={userForm.lname}
                                                    onChange={handleUserFormChange}
                                                    required
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Email Address *
                                        </label>
                                        <input
                                                type="email"
                                                name="email"
                                                value={userForm.email}
                                                onChange={handleUserFormChange}
                                                required
                                                disabled={!!editingUser}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    backgroundColor: editingUser ? '#f8f9fa' : 'white'
                                                }}
                                        />
                                        {editingUser && (
                                                <small style={{ color: '#666' }}>Email cannot be changed</small>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Address Line 1
                                        </label>
                                        <input
                                                type="text"
                                                name="address1"
                                                value={userForm.address1}
                                                onChange={handleUserFormChange}
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
                                                value={userForm.address2}
                                                onChange={handleUserFormChange}
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
                                                City
                                            </label>
                                            <input
                                                    type="text"
                                                    name="city"
                                                    value={userForm.city}
                                                    onChange={handleUserFormChange}
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
                                                State
                                            </label>
                                            <select
                                                    name="state"
                                                    value={userForm.state}
                                                    onChange={handleUserFormChange}
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
                                                ZIP Code
                                            </label>
                                            <input
                                                    type="text"
                                                    name="zip"
                                                    value={userForm.zip}
                                                    onChange={handleUserFormChange}
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

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Status *
                                            </label>
                                            <select
                                                    name="status"
                                                    value={userForm.status}
                                                    onChange={handleUserFormChange}
                                                    required
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                            >
                                                <option value="">Select Status</option>
                                                {statusOptions.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Level
                                            </label>
                                            <select
                                                    name="level"
                                                    value={userForm.level}
                                                    onChange={handleUserFormChange}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                            >
                                                {levelOptions.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {!editingUser && (
                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                    Password *
                                                </label>
                                                <input
                                                        type="password"
                                                        name="password"
                                                        value={userForm.password || ''}
                                                        onChange={handleUserFormChange}
                                                        required={!editingUser}
                                                        style={{
                                                            width: '100%',
                                                            padding: '8px',
                                                            border: '1px solid #ddd',
                                                            borderRadius: '4px'
                                                        }}
                                                />
                                            </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                        <button
                                                type="button"
                                                onClick={() => setShowUserModal(false)}
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
                                            {isSubmitting ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && userToDelete && (
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
                                <h3 style={{ marginTop: 0, color: '#dc3545' }}>Confirm Delete User</h3>
                                <p style={{ marginBottom: '20px' }}>
                                    Are you sure you want to delete <strong>{userToDelete.fname} {userToDelete.lname}</strong>?
                                    This action cannot be undone.
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button
                                            onClick={() => {
                                                setShowDeleteModal(false);
                                                setUserToDelete(null);
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
                                            onClick={handleDeleteUser}
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
                                        {isSubmitting ? 'Deleting...' : 'Delete User'}
                                    </button>
                                </div>
                            </div>
                        </div>
                )}
            </div>
    );
}