'use client';

// file: /src/app/chain-management/page.jsx v2 - Updated to use NextAuth session

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Footer from '../../components/legal/Footer';

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

export default function ChainManagementPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [chains, setChains] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12); // Show 12 chains per page
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

    const [showIncentivesModal, setShowIncentivesModal] = useState(false);
    const [chainIncentives, setChainIncentives] = useState([]);
    const [showEditIncentiveModal, setShowEditIncentiveModal] = useState(false);
    const [selectedIncentive, setSelectedIncentive] = useState(null);
    const [newIncentive, setNewIncentive] = useState({
        eligibleCategories: [],
        discountType: 'percentage',
        amount: '',
        information: '',
        otherDescription: ''
    });

    // Auto-fill and lock information field for special categories
    useEffect(() => {
        const categories = newIncentive.eligibleCategories;

        // Check if any special category is selected
        if (categories.includes('NC')) {
            setNewIncentive(prev => ({
                ...prev,
                information: 'No chainwide incentives available, check your local location for available discounts and/or incentives'
            }));
        } else if (categories.includes('WS')) {
            setNewIncentive(prev => ({
                ...prev,
                information: 'Discounts only available through the paid service of WeSalute.com. Memberships start at $9.99 a month or $119.88 for a year. Discounts and multi-year options also available. Go to WeSalute.com for more details.'
            }));
        } else if (categories.includes('MR')) {
            setNewIncentive(prev => ({
                ...prev,
                information: 'Military Rate discounts available at participating locations. Save a percentage off the Best Flex Rate. Military ID required at check-in. Discount amount varies by location and availability. Terms and conditions apply.'
            }));
        }
    }, [newIncentive.eligibleCategories]);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/auth/signin?redirect=/chain-management');
            return;
        }

        if (!session.user?.isAdmin) {
            router.push('/dashboard');
            return;
        }

        loadChains();
    }, [session, status, router]);

    const loadChains = async () => {
        try {
            const response = await fetch('/api/chains?operation=list');

            if (response.ok) {
                const data = await response.json();
                console.log('Raw chain data from API:', data);

                // Map the API fields to match frontend expectations
                const mappedChains = (data.chains || []).map(chain => {
                    // Count active incentives from the incentives array
                    const incentiveCount = chain.incentives
                            ? chain.incentives.filter(inc => inc.is_active !== false).length
                            : 0;

                    console.log(`Chain: ${chain.chain_name}, Incentives: ${incentiveCount}, Locations: ${chain.location_count}`);

                    return {
                        _id: chain._id,
                        name: chain.chain_name,
                        category: chain.business_type,
                        description: chain.corporate_info?.description || '',
                        website: chain.corporate_info?.website || '',
                        isActive: chain.status === 'active',
                        locationCount: chain.location_count || 0,
                        incentiveCount: incentiveCount,
                        createdAt: chain.created_date
                    };
                });

                console.log('Mapped chains:', mappedChains);
                setChains(mappedChains);
            } else {
                console.error('Failed to load chains:', response.status);
            }
        } catch (error) {
            console.error('Error loading chains:', error);
        }
    };

    const loadChainIncentives = async (chainId) => {
        try {
            const response = await fetch(`/api/chains?operation=get_incentives&chain_id=${chainId}`);

            if (response.ok) {
                const data = await response.json();
                setChainIncentives(data.incentives || []);
            } else {
                console.error('Failed to load chain incentives:', response.status);
                setChainIncentives([]);
            }
        } catch (error) {
            console.error('Error loading chain incentives:', error);
            setChainIncentives([]);
        }
    };

    const getBusinessTypeLabel = (typeCode) => {
        const type = businessTypes.find(t => t.value === typeCode);
        return type ? type.label : typeCode;
    };

    const handleAddChainIncentive = async (e) => {
        e.preventDefault();

        if (!selectedChain) {
            alert('Please select a chain first');
            return;
        }

        if (newIncentive.eligibleCategories.length === 0) {
            alert('Please select at least one eligible category');
            return;
        }

        try {
            const incentiveData = {
                chain_id: selectedChain._id,
                eligible_categories: newIncentive.eligibleCategories,
                discount_type: newIncentive.discountType,
                amount: parseFloat(newIncentive.amount),
                information: newIncentive.information,
                ...(newIncentive.eligibleCategories.includes('OT') && {
                    other_description: newIncentive.otherDescription
                })
            };

            const response = await fetch('/api/chains?operation=add_incentive', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(incentiveData)
            });

            if (response.ok) {
                // Reset form
                setNewIncentive({
                    eligibleCategories: [],
                    discountType: 'percentage',
                    amount: '',
                    information: '',
                    otherDescription: ''
                });

                // Reload incentives
                await loadChainIncentives(selectedChain._id);
                alert('Incentive added successfully');
            } else {
                const data = await response.json();
                alert(data.message || 'Error adding incentive');
            }
        } catch (error) {
            console.error('Error adding incentive:', error);
            alert('Error adding incentive');
        }
    };

    const handleAddChain = async (e) => {
        e.preventDefault();
        try {
            // Map frontend fields to API fields
            const chainData = {
                chain_name: newChain.name,
                business_type: newChain.category,
                corporate_info: {
                    description: newChain.description,
                    website: newChain.website
                },
                status: newChain.isActive ? 'active' : 'inactive'
            };

            const response = await fetch('/api/chains?operation=create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(chainData)
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
            // Map frontend fields to API fields
            const updateData = {
                _id: chainId,
                ...(updates.name && { chain_name: updates.name }),
                ...(updates.category && { business_type: updates.category }),
                ...(updates.isActive !== undefined && { status: updates.isActive ? 'active' : 'inactive' }),
                ...((updates.description || updates.website) && {
                    corporate_info: {
                        ...(updates.description && { description: updates.description }),
                        ...(updates.website && { website: updates.website })
                    }
                })
            };

            const response = await fetch('/api/chains?operation=update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
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
            const response = await fetch('/api/chains?operation=delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ _id: chainId })
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

        // Special case: if NA is the only category
        if (categories.length === 1 && categories[0] === 'NA') {
            return 'Not Available';
        }

        return categories.map(cat => categoryLabels[cat] || cat).join(', ');
    };

    // Filter chains by search term
    const filteredChains = chains.filter(chain =>
            (chain.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (chain.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

// Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentChains = filteredChains.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredChains.length / itemsPerPage);

// Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    if (status === 'loading') {
        return (
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                </div>
        );
    }

    if (!session || !session.user?.isAdmin) {
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
                                <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
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
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                        <div className="flex-1">
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
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <button
                                    onClick={() => setShowAddModal(true)}
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Chain
                            </button>
                        </div>
                    </div>

                    {/* Chains Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentChains.map((chain) => (
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
                                            <strong>Category:</strong> {getBusinessTypeLabel(chain.category)}
                                        </p>

                                        {chain.description && (
                                                <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                                                    {chain.description}
                                                </p>
                                        )}

                                        <div className="text-sm text-gray-500 mb-4">
                                            <p><strong>Locations:</strong> {chain.locationCount || 0}</p>
                                            <p><strong>Incentives:</strong> {chain.incentiveCount || 0}</p>
                                            <p><strong>Created:</strong> {new Date(chain.createdAt).toLocaleDateString()}</p>
                                        </div>

                                        {chain.website && (
                                            <a href={chain.website}
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
                                                onClick={async () => {
                                                    setSelectedChain(chain);
                                                    await loadChainIncentives(chain._id);
                                                    setShowIncentivesModal(true);
                                                }}
                                                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                                        >
                                            Incentives
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

                    {currentChains.length === 0 && (
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

                    {/* Pagination Controls */}
                    {filteredChains.length > itemsPerPage && (
                            <div className="mt-8 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
                                <div className="flex flex-1 justify-between sm:hidden">
                                    <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                                                    currentPage === 1
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        Previous
                                    </button>
                                    <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                                                    currentPage === totalPages
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                                            <span className="font-medium">
                                            {Math.min(indexOfLastItem, filteredChains.length)}
                                        </span>{' '}
                                            of <span className="font-medium">{filteredChains.length}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                            <button
                                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                                                            currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''
                                                    }`}
                                            >
                                                <span className="sr-only">Previous</span>
                                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                                </svg>
                                            </button>

                                            {[...Array(totalPages)].map((_, index) => {
                                                const pageNumber = index + 1;
                                                // Show first page, last page, current page, and pages around current
                                                if (
                                                        pageNumber === 1 ||
                                                        pageNumber === totalPages ||
                                                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                                ) {
                                                    return (
                                                            <button
                                                                    key={pageNumber}
                                                                    onClick={() => setCurrentPage(pageNumber)}
                                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                                                            currentPage === pageNumber
                                                                                    ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                                                                    }`}
                                                            >
                                                                {pageNumber}
                                                            </button>
                                                    );
                                                } else if (
                                                        pageNumber === currentPage - 2 ||
                                                        pageNumber === currentPage + 2
                                                ) {
                                                    return (
                                                            <span key={pageNumber} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                                                        ...
                                                    </span>
                                                    );
                                                }
                                                return null;
                                            })}

                                            <button
                                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                                                            currentPage === totalPages ? 'cursor-not-allowed opacity-50' : ''
                                                    }`}
                                            >
                                                <span className="sr-only">Next</span>
                                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </nav>
                                    </div>
                                </div>
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
                                        {businessTypes.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                        ))}
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
                                        {businessTypes.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                        ))}
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
                {/* Manage Chain Incentives Modal */}
                {showIncentivesModal && selectedChain && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
                                <div className="mt-3">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            Manage Incentives: {selectedChain.name}
                                        </h3>
                                        <button
                                                onClick={() => setShowIncentivesModal(false)}
                                                className="text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Current Incentives */}
                                    <div className="mb-6">
                                        <h4 className="text-md font-medium text-gray-700 mb-3">Current Chain Incentives</h4>
                                        {chainIncentives.length === 0 ? (
                                                <p className="text-gray-500">No incentives found for this chain.</p>
                                        ) : (
                                                <div className="space-y-2">
                                                    {chainIncentives.map((incentive, index) => (
                                                            <div key={incentive._id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                                                                <div>
                                                                    <span className="font-medium">{getCategoriesLabel(incentive)}</span>
                                                                    {(incentive.eligible_categories?.includes('OT') || incentive.type === 'OT') && incentive.other_description && (
                                                                            <span className="text-sm text-gray-600 ml-2">({incentive.other_description})</span>
                                                                    )}
                                                                    <span className="mx-2">-</span>
                                                                    <span className="text-blue-600">
                                                        {incentive.discount_type === 'dollar' ? '$' : ''}{incentive.amount}{incentive.discount_type === 'percentage' ? '%' : ''}
                                                    </span>
                                                                    {incentive.information && (
                                                                            <p className="text-sm text-gray-600 mt-1">{incentive.information}</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex space-x-2">
                                                                    <button
                                                                            onClick={() => {
                                                                                // Edit functionality - we'll add this next
                                                                                alert('Edit functionality coming soon');
                                                                            }}
                                                                            className="text-sm text-blue-600 hover:text-blue-800"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                            onClick={async () => {
                                                                                if (confirm('Are you sure you want to remove this incentive?')) {
                                                                                    try {
                                                                                        const response = await fetch('/api/chains?operation=remove_incentive', {
                                                                                            method: 'DELETE',
                                                                                            headers: { 'Content-Type': 'application/json' },
                                                                                            body: JSON.stringify({
                                                                                                chain_id: selectedChain._id,
                                                                                                incentive_id: incentive._id
                                                                                            })
                                                                                        });
                                                                                        if (response.ok) {
                                                                                            await loadChainIncentives(selectedChain._id);
                                                                                        }
                                                                                    } catch (error) {
                                                                                        console.error('Error removing incentive:', error);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className="text-sm text-red-600 hover:text-red-800"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                    ))}
                                                </div>
                                        )}
                                    </div>

                                    {/* Add New Incentive Form */}
                                    <div className="border-t pt-4">
                                        <h4 className="text-md font-medium text-gray-700 mb-3">Add New Incentive</h4>
                                        <form onSubmit={handleAddChainIncentive} className="space-y-4">
                                            {/* Eligible Categories - Checkboxes */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Eligible Categories <span className="text-red-500">*</span>
                                                </label>
                                                <div className="space-y-2">
                                                    {[
                                                        { value: 'VT', label: 'Veterans' },
                                                        { value: 'AD', label: 'Active Duty' },
                                                        { value: 'FR', label: 'First Responders' },
                                                        { value: 'SP', label: 'Military Spouses' },
                                                        { value: 'MR', label: 'Military Rate (Variable Discount)' },
                                                        { value: 'NC', label: 'No Chainwide Incentives' },
                                                        { value: 'WS', label: 'WeSalute' },
                                                        { value: 'OT', label: 'Other (please describe)' }
                                                    ].map(category => (
                                                            <label key={category.value} className="flex items-center">
                                                                <input
                                                                        type="checkbox"
                                                                        value={category.value}
                                                                        checked={newIncentive.eligibleCategories.includes(category.value)}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            setNewIncentive(prev => ({
                                                                                ...prev,
                                                                                eligibleCategories: e.target.checked
                                                                                        ? [...prev.eligibleCategories, value]
                                                                                        : prev.eligibleCategories.filter(cat => cat !== value)
                                                                            }));
                                                                        }}
                                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                />
                                                                <span className="ml-2 text-sm text-gray-700">{category.label}</span>
                                                            </label>
                                                    ))}
                                                </div>
                                                {newIncentive.eligibleCategories.length === 0 && (
                                                        <p className="text-sm text-red-500 mt-1">Please select at least one category</p>
                                                )}
                                            </div>

                                            {/* Other Description */}
                                            {newIncentive.eligibleCategories.includes('OT') && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Other Description *</label>
                                                        <input
                                                                type="text"
                                                                value={newIncentive.otherDescription}
                                                                onChange={(e) => setNewIncentive({...newIncentive, otherDescription: e.target.value})}
                                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="Describe the other category..."
                                                                required
                                                        />
                                                    </div>
                                            )}

                                            {/* Discount Type */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Discount Type *</label>
                                                <select
                                                        value={newIncentive.discountType}
                                                        onChange={(e) => setNewIncentive({...newIncentive, discountType: e.target.value})}
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="percentage">Percentage (%)</option>
                                                    <option value="dollar">Dollar Amount ($)</option>
                                                </select>
                                            </div>

                                            {/* Amount */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Amount ({newIncentive.discountType === 'percentage' ? '%' : '$'}) *
                                                </label>
                                                <input
                                                        type="number"
                                                        value={newIncentive.amount}
                                                        onChange={(e) => setNewIncentive({...newIncentive, amount: e.target.value})}
                                                        min="0"
                                                        max={newIncentive.discountType === 'percentage' ? '100' : '9999'}
                                                        step="0.01"
                                                        required
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            {/* Information */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Additional Information
                                                    {(newIncentive.eligibleCategories.includes('NC') ||
                                                            newIncentive.eligibleCategories.includes('WS') ||
                                                            newIncentive.eligibleCategories.includes('MR')) && (
                                                            <span className="text-sm text-gray-500 ml-2">(Auto-filled - Standard Text)</span>
                                                    )}
                                                </label>
                                                <textarea
                                                        value={newIncentive.information}
                                                        onChange={(e) => setNewIncentive({...newIncentive, information: e.target.value})}
                                                        rows={3}
                                                        disabled={
                                                                newIncentive.eligibleCategories.includes('NC') ||
                                                                newIncentive.eligibleCategories.includes('WS') ||
                                                                newIncentive.eligibleCategories.includes('MR')
                                                        }
                                                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                                                                (newIncentive.eligibleCategories.includes('NC') ||
                                                                        newIncentive.eligibleCategories.includes('WS') ||
                                                                        newIncentive.eligibleCategories.includes('MR'))
                                                                        ? 'bg-gray-100 cursor-not-allowed'
                                                                        : ''
                                                        }`}
                                                        placeholder="Enter any restrictions or additional details..."
                                                />
                                            </div>

                                            <div className="flex justify-end space-x-3 pt-4">
                                                <button
                                                        type="button"
                                                        onClick={() => setShowIncentivesModal(false)}
                                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    Close
                                                </button>
                                                <button
                                                        type="submit"
                                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                                >
                                                    Add Incentive
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                )}
                <Footer />
            </div>
    );
}