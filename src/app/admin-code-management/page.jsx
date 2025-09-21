'use client';
// file: /src/app/admin-code-management/page.jsx v1 - Admin Code Management for Patriot Thanks

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navigation from '../../components/layout/Navigation';

export default function AdminCodeManagementPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [codes, setCodes] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [codeToDelete, setCodeToDelete] = useState(null);
    const [showHelpSection, setShowHelpSection] = useState(false);
    const { data: session, status } = useSession();

    // Form state
    const [codeForm, setCodeForm] = useState({
        code: '',
        description: '',
        expirationDate: ''
    });

    useEffect(() => {
        checkAdminAccess();
    }, []);

    useEffect(() => {
        if (isAdmin) {
            loadExistingCodes();
        }
    }, [isAdmin]);

    const checkAdminAccess = async () => {
        try {
            // Handle loading state
            if (status === 'loading') {
                return <div>Loading...</div>;
            }

            // Handle unauthenticated
            if (status === 'unauthenticated' || !session) {
                router.push('/auth/signin');
                return null;
            }

            // Handle non-admin users
            if (!session.user.isAdmin && session.user.level !== 'Admin') {
                alert('Admin access required');
                router.push('/');
                return null;
            }

            setIsAdmin(true);
        } catch (error) {
            console.error('Error checking admin access:', error);
            router.push('../../auth/signin');
        } finally {
            setIsLoading(false);
        }
    };

    const loadExistingCodes = async () => {
        try {
            if (status === 'loading') return <div>Loading...</div>;
            if (!session || !session.user.isAdmin) {
                router.push('/auth/signin');
                return;
            }

            const response = await fetch('/api/admin-codes?operation=list', {
                headers: {
                    'Authorization': `Bearer ${session.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCodes(data.codes || []);
            } else {
                throw new Error('Failed to load admin codes');
            }
        } catch (error) {
            console.error('Error loading codes:', error);
            // Show mock data for development
            const mockCodes = [
                {
                    _id: 'mock1',
                    code: 'ADMIN123',
                    description: 'Development admin access code',
                    expiration: new Date('2026-12-31'),
                    created_at: new Date()
                },
                {
                    _id: 'mock2',
                    code: 'TEMPACCESS',
                    description: 'Temporary access for demo',
                    expiration: new Date('2025-06-30'),
                    created_at: new Date()
                },
                {
                    _id: 'mock3',
                    code: 'VETERAN2025',
                    description: 'Veteran admin registration',
                    expiration: null,
                    created_at: new Date()
                }
            ];
            setCodes(mockCodes);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setCodeForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCreateCode = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Validation
        if (!codeForm.code.trim() || !codeForm.description.trim()) {
            setMessage({ type: 'error', text: 'Please enter both a code and description' });
            setIsSubmitting(false);
            return;
        }

        try {
            if (status === 'loading') return <div>Loading...</div>;
            if (!session || !session.user.isAdmin) {
                router.push('/auth/signin');
                return;
            }

            const codeData = {
                code: codeForm.code.trim(),
                description: codeForm.description.trim(),
                expiration: codeForm.expirationDate || null
            };

            const response = await fetch('/api/admin-codes?operation=create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.token}`
                },
                body: JSON.stringify(codeData)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Access code created successfully!' });
                setCodeForm({ code: '', description: '', expirationDate: '' });
                loadExistingCodes();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create access code');
            }
        } catch (error) {
            console.error('Error creating code:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteModal = (code) => {
        setCodeToDelete(code);
        setShowDeleteModal(true);
    };

    const handleDeleteCode = async () => {
        if (!codeToDelete) return;

        setIsSubmitting(true);

        try {
            if (status === 'loading') return <div>Loading...</div>;
            if (!session || !session.user.isAdmin) {
                router.push('/auth/signin');
                return;
            }

            const response = await fetch('/api/admin-codes?operation=delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.token}`
                },
                body: JSON.stringify({ codeId: codeToDelete._id })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Access code deleted successfully!' });
                setShowDeleteModal(false);
                setCodeToDelete(null);
                loadExistingCodes();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete access code');
            }
        } catch (error) {
            console.error('Error deleting code:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Never expires';
        return new Date(date).toLocaleDateString();
    };

    const isExpired = (date) => {
        if (!date) return false;
        return new Date(date) < new Date();
    };

    if (isLoading) {
        return (
                <div style={{ paddingTop: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div>Loading admin code management...</div>
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
                            <h4 style={{ margin: '5px 0 0 0', color: '#666' }}>Admin Access Code Management</h4>
                        </div>
                        <div>
                            <button
                                    onClick={() => router.push('/admin-dashboard')}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                            >
                                ← Return to Dashboard
                            </button>
                        </div>
                    </div>
                </header>

                <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <h2 style={{ margin: 0, color: '#003366' }}>Admin Access Code Management</h2>
                        <p style={{ margin: '10px 0 0 0', color: '#666' }}>
                            Manage access codes that grant admin privileges to users. These codes can be used during registration
                            or by existing users to gain admin access.
                        </p>
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

                    {/* Create New Access Code */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '20px',
                        }}>
                            <span style={{ fontSize: '24px', marginRight: '10px' }}>➕</span>
                            <h3 style={{ margin: 0 }}>Create New Access Code</h3>
                        </div>

                        <form onSubmit={handleCreateCode}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                    Access Code:
                                </label>
                                <input
                                        type="text"
                                        name="code"
                                        value={codeForm.code}
                                        onChange={handleFormChange}
                                        placeholder="Enter a unique code"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '16px'
                                        }}
                                />
                                <small style={{ color: '#666', fontSize: '14px' }}>
                                    This is the code users will enter to get admin access
                                </small>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                    Description:
                                </label>
                                <input
                                        type="text"
                                        name="description"
                                        value={codeForm.description}
                                        onChange={handleFormChange}
                                        placeholder="What this code grants access to"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '16px'
                                        }}
                                />
                                <small style={{ color: '#666', fontSize: '14px' }}>
                                    Describe what this code is for and who should use it
                                </small>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                    Expiration Date:
                                </label>
                                <input
                                        type="date"
                                        name="expirationDate"
                                        value={codeForm.expirationDate}
                                        onChange={handleFormChange}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '16px'
                                        }}
                                />
                                <small style={{ color: '#666', fontSize: '14px' }}>
                                    Leave blank for no expiration
                                </small>
                            </div>

                            <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        padding: '12px 30px',
                                        backgroundColor: isSubmitting ? '#6c757d' : '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }}
                            >
                                {isSubmitting ? 'Creating...' : '💾 Create Access Code'}
                            </button>
                        </form>
                    </div>

                    {/* Existing Access Codes */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        overflow: 'hidden',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            padding: '20px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '24px', marginRight: '10px' }}>📋</span>
                            <h3 style={{ margin: 0 }}>Existing Access Codes</h3>
                        </div>

                        <div style={{ padding: '20px' }}>
                            {codes.length > 0 ? (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                                <th style={{
                                                    padding: '15px',
                                                    textAlign: 'left',
                                                    borderBottom: '2px solid #dee2e6',
                                                    fontWeight: 'bold'
                                                }}>
                                                    Access Code
                                                </th>
                                                <th style={{
                                                    padding: '15px',
                                                    textAlign: 'left',
                                                    borderBottom: '2px solid #dee2e6',
                                                    fontWeight: 'bold'
                                                }}>
                                                    Description
                                                </th>
                                                <th style={{
                                                    padding: '15px',
                                                    textAlign: 'left',
                                                    borderBottom: '2px solid #dee2e6',
                                                    fontWeight: 'bold'
                                                }}>
                                                    Expiration
                                                </th>
                                                <th style={{
                                                    padding: '15px',
                                                    textAlign: 'left',
                                                    borderBottom: '2px solid #dee2e6',
                                                    fontWeight: 'bold'
                                                }}>
                                                    Actions
                                                </th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {codes.map((code, index) => (
                                                    <tr key={code._id} style={{
                                                        borderBottom: '1px solid #dee2e6',
                                                        backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                                                    }}>
                                                        <td style={{ padding: '15px' }}>
                                                            <code style={{
                                                                backgroundColor: '#e9ecef',
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                fontFamily: 'monospace',
                                                                fontSize: '14px'
                                                            }}>
                                                                {code.code}
                                                            </code>
                                                        </td>
                                                        <td style={{ padding: '15px' }}>
                                                            {code.description}
                                                        </td>
                                                        <td style={{ padding: '15px' }}>
                                                    <span style={{
                                                        color: isExpired(code.expiration) ? '#dc3545' : '#28a745',
                                                        fontWeight: isExpired(code.expiration) ? 'bold' : 'normal'
                                                    }}>
                                                        {formatDate(code.expiration)}
                                                        {isExpired(code.expiration) && ' (EXPIRED)'}
                                                    </span>
                                                        </td>
                                                        <td style={{ padding: '15px' }}>
                                                            <button
                                                                    onClick={() => openDeleteModal(code)}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#dc3545',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '14px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '5px'
                                                                    }}
                                                            >
                                                                🗑️ Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                            ) : (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '40px',
                                        color: '#666',
                                        fontSize: '16px'
                                    }}>
                                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📝</div>
                                        <p>No access codes found. Create a new one to get started.</p>
                                    </div>
                            )}
                        </div>
                    </div>

                    {/* Help Section */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>
                        <div
                                style={{
                                    padding: '20px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setShowHelpSection(!showHelpSection)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: '24px', marginRight: '10px' }}>❓</span>
                                <h3 style={{ margin: 0 }}>Help & Information</h3>
                            </div>
                            <span style={{ fontSize: '18px' }}>
                            {showHelpSection ? '−' : '+'}
                        </span>
                        </div>

                        {showHelpSection && (
                                <div style={{ padding: '30px' }}>
                                    <div style={{ marginBottom: '30px' }}>
                                        <h4 style={{ color: '#007bff', marginBottom: '15px' }}>
                                            🔐 How do admin access codes work?
                                        </h4>
                                        <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
                                            Admin access codes grant users administrator privileges in Patriot Thanks. These codes can be used in two ways:
                                        </p>
                                        <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
                                            <li><strong>During registration:</strong> When a new user selects "Admin" as their account type, they'll be prompted to enter an access code.</li>
                                            <li><strong>By existing users:</strong> Current users can upgrade their account to admin status by entering a valid access code in their profile settings.</li>
                                        </ul>
                                        <p style={{ marginTop: '15px', lineHeight: '1.6' }}>
                                            Once a code is used, it remains valid for other users unless you delete it or it reaches its expiration date.
                                        </p>
                                    </div>

                                    <div style={{ marginBottom: '30px' }}>
                                        <h4 style={{ color: '#28a745', marginBottom: '15px' }}>
                                            🛡️ Best practices for access code security
                                        </h4>
                                        <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
                                            <li><strong>Use strong codes:</strong> Create complex, hard-to-guess access codes (include letters, numbers, and special characters).</li>
                                            <li><strong>Set expiration dates:</strong> For temporary admin access, always set an expiration date.</li>
                                            <li><strong>Delete unused codes:</strong> Remove access codes when they're no longer needed.</li>
                                            <li><strong>Share securely:</strong> When sharing access codes with users, use secure communication methods.</li>
                                            <li><strong>Audit regularly:</strong> Periodically review the list of active admin codes and remove any that are no longer needed.</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 style={{ color: '#ffc107', marginBottom: '15px' }}>
                                            📊 Tracking code usage
                                        </h4>
                                        <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
                                            Currently, Patriot Thanks does not track which users have used specific access codes.
                                            However, you can:
                                        </p>
                                        <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
                                            <li>Create unique, descriptive codes for different purposes or teams</li>
                                            <li>Use the description field to document the intended recipients</li>
                                            <li>Check the user management section to see all users with admin access</li>
                                        </ul>
                                        <p style={{ marginTop: '15px', lineHeight: '1.6' }}>
                                            We're working on adding usage tracking in a future update to provide better security and accountability.
                                        </p>
                                    </div>
                                </div>
                        )}
                    </div>
                </main>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && codeToDelete && (
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
                                <h3 style={{ marginTop: 0, color: '#dc3545' }}>🗑️ Confirm Delete Access Code</h3>
                                <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
                                    Are you sure you want to delete the access code <strong>"{codeToDelete.code}"</strong>?
                                    <br />
                                    <br />
                                    <strong>Description:</strong> {codeToDelete.description}
                                    <br />
                                    <br />
                                    This action cannot be undone and users will no longer be able to use this code to gain admin access.
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button
                                            onClick={() => {
                                                setShowDeleteModal(false);
                                                setCodeToDelete(null);
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
                                            onClick={handleDeleteCode}
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
                                        {isSubmitting ? 'Deleting...' : '🗑️ Delete Code'}
                                    </button>
                                </div>
                            </div>
                        </div>
                )}
            </div>
    );
}