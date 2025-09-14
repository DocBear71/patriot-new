'use client';

// file: /src/pages/chain-management.jsx v1 - Admin page for managing business chains and locations

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '../components/legal/Footer';

export default function ChainManagementPage() {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [chains, setChains] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChain, setSelectedChain] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newChain, setNewChain] = useState({
        name: '',
        description: '',
        website: '',
        category: '',
        isActive: true
    });

    useEffect(() => {
        checkAdminStatus();
        loadChains();
    }, []);

    const checkAdminStatus = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                router.push('../../auth/signin?redirect=/chain-management');
                return;
            }

            const response = await fetch('/api/admin-access', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.isAdmin) {
                    setIsAdmin(true);
                } else {
                    router.push('/');
                }
            } else {
                router.push('../../auth/signin?redirect=/chain-management');
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            router.push('/');
        } finally {
            setIsLoading(false);
        }
    };

    const loadChains = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/chain-management', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setChains(data.chains || []);
            }
        } catch (error) {
            console.error('Error loading chains:', error);
        }
    };

    const handleAddChain = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/chain-management', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newChain)
            });

            if (response.ok) {
                setShowAddModal(false);
                setNewChain({
                    name: '',
                    description: '',
                    website: '',
                    category: '',
                    isActive: true
                });
                loadChains();
            } else {
                const data = await response.json();
                alert(data.message || 'Error adding chain');
            }
        } catch (error) {
            console.error('Error adding chain:', error);
            alert('Error adding chain');
        }
    };

    const handleUpdateChain = async (chainId, updates) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/chain-management', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ chainId, ...updates })
            });

            if (response.ok) {
                loadChains();
            } else {
                const data = await response.json();
                alert(data.message || 'Error updating chain');
            }
        } catch (error) {
            console.error('Error updating chain:', error);
            alert('Error updating chain');
        }
    };

    const handleDeleteChain = async (chainId) => {
        if (!confirm('Are you sure you want to delete this chain? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/chain-management', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ chainId })
            });

            if (response.ok) {
                loadChains();
            } else {
                const data = await response.json();
                alert(data.message || 'Error deleting chain');
            }
        } catch (error) {
            console.error('Error deleting chain:', error);
            alert('Error deleting chain');
        }
    };

    const filteredChains = chains.filter(chain =>
            chain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            chain.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
            <div className="min-h-screen bg-gray-100">
                {/* Header */}
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-6">
                            <div className="flex items-center">
                                <Link href="/">
                                    <img
                                            src="/images/patriotthankslogo6-13-2025.png"
                                            alt="Patriot Thanks Logo"
                                            className="h-12 w-auto"
                                    />
                                </Link>
                                <div className="ml-4">
                                    <h1 className="text-2xl font-bold text-gray-900">Chain Management</h1>
                                    <p className="text-sm text-gray-500">Manage business chains and locations</p>
                                </div>
                            </div>
                            <nav className="flex space-x-4">
                                <Link href="/admin-dashboard" className="text-gray-600 hover:text-gray-900">
                                    Dashboard
                                </Link>
                                <Link href="/admin-business" className="text-gray-600 hover:text-gray-900">
                                    Businesses
                                </Link>
                                <Link href="/admin-users" className="text-gray-600 hover:text-gray-900">
                                    Users
                                </Link>
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Controls */}
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="max-w-lg">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                            type="text"
                                            placeholder="Search chains..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 sm:mt-0 sm:ml-4">
                            <button
                                    onClick={() => setShowAddModal(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Chain
                            </button>
                        </div>
                    </div>

                    {/* Chains Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredChains.map((chain) => (
                                <div key={chain._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                {chain.name}
                                            </h3>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    chain.isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                        {chain.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                        </div>

                                        <p className="text-sm text-gray-600 mb-2">
                                            <strong>Category:</strong> {chain.category}
                                        </p>

                                        {chain.description && (
                                                <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                                                    {chain.description}
                                                </p>
                                        )}

                                        <div className="text-sm text-gray-500 mb-4">
                                            <p><strong>Locations:</strong> {chain.locationCount || 0}</p>
                                            <p><strong>Created:</strong> {new Date(chain.createdAt).toLocaleDateString()}</p>
                                        </div>

                                        {chain.website && (
                                                <a
                                                        href={chain.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    Visit Website →
                                                </a>
                                        )}
                                    </div>

                                    <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                                        <button
                                                onClick={() => {
                                                    setSelectedChain(chain);
                                                    setShowEditModal(true);
                                                }}
                                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                                onClick={() => handleUpdateChain(chain._id, { isActive: !chain.isActive })}
                                                className={`text-sm font-medium ${
                                                        chain.isActive
                                                                ? 'text-red-600 hover:text-red-800'
                                                                : 'text-green-600 hover:text-green-800'
                                                }`}
                                        >
                                            {chain.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                                onClick={() => handleDeleteChain(chain._id)}
                                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                        ))}
                    </div>

                    {filteredChains.length === 0 && (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No chains found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new chain.'}
                                </p>
                            </div>
                    )}
                </main>

                {/* Add Chain Modal */}
                {showAddModal && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                                <div className="mt-3">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Chain</h3>
                                    <form onSubmit={handleAddChain} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Name *</label>
                                            <input
                                                    type="text"
                                                    required
                                                    value={newChain.name}
                                                    onChange={(e) => setNewChain({...newChain, name: e.target.value})}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Category *</label>
                                            <select
                                                    required
                                                    value={newChain.category}
                                                    onChange={(e) => setNewChain({...newChain, category: e.target.value})}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">Select category</option>
                                                <option value="Restaurant">Restaurant</option>
                                                <option value="Retail">Retail</option>
                                                <option value="Automotive">Automotive</option>
                                                <option value="Healthcare">Healthcare</option>
                                                <option value="Fitness">Fitness</option>
                                                <option value="Entertainment">Entertainment</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Website</label>
                                            <input
                                                    type="url"
                                                    value={newChain.website}
                                                    onChange={(e) => setNewChain({...newChain, website: e.target.value})}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="https://example.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Description</label>
                                            <textarea
                                                    value={newChain.description}
                                                    onChange={(e) => setNewChain({...newChain, description: e.target.value})}
                                                    rows={3}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                    type="checkbox"
                                                    checked={newChain.isActive}
                                                    onChange={(e) => setNewChain({...newChain, isActive: e.target.checked})}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label className="ml-2 block text-sm text-gray-900">
                                                Active
                                            </label>
                                        </div>

                                        <div className="flex justify-end space-x-3 pt-4">
                                            <button
                                                    type="button"
                                                    onClick={() => setShowAddModal(false)}
                                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                    type="submit"
                                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                Add Chain
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                )}

                {/* Edit Chain Modal */}
                {showEditModal && selectedChain && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                                <div className="mt-3">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Chain</h3>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        handleUpdateChain(selectedChain._id, selectedChain);
                                        setShowEditModal(false);
                                    }} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Name *</label>
                                            <input
                                                    type="text"
                                                    required
                                                    value={selectedChain.name}
                                                    onChange={(e) => setSelectedChain({...selectedChain, name: e.target.value})}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Category *</label>
                                            <select
                                                    required
                                                    value={selectedChain.category}
                                                    onChange={(e) => setSelectedChain({...selectedChain, category: e.target.value})}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">Select category</option>
                                                <option value="Restaurant">Restaurant</option>
                                                <option value="Retail">Retail</option>
                                                <option value="Automotive">Automotive</option>
                                                <option value="Healthcare">Healthcare</option>
                                                <option value="Fitness">Fitness</option>
                                                <option value="Entertainment">Entertainment</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Website</label>
                                            <input
                                                    type="url"
                                                    value={selectedChain.website || ''}
                                                    onChange={(e) => setSelectedChain({...selectedChain, website: e.target.value})}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="https://example.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Description</label>
                                            <textarea
                                                    value={selectedChain.description || ''}
                                                    onChange={(e) => setSelectedChain({...selectedChain, description: e.target.value})}
                                                    rows={3}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                    type="checkbox"
                                                    checked={selectedChain.isActive}
                                                    onChange={(e) => setSelectedChain({...selectedChain, isActive: e.target.checked})}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label className="ml-2 block text-sm text-gray-900">
                                                Active
                                            </label>
                                        </div>

                                        <div className="flex justify-end space-x-3 pt-4">
                                            <button
                                                    type="button"
                                                    onClick={() => setShowEditModal(false)}
                                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                    type="submit"
                                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                Update Chain
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                )}
                <Footer />
            </div>
    );
}