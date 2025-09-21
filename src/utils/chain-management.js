// file: /src/utils/chain-management.js v2 - Business chain management utility for admin dashboard (Fixed)

/**
 * Chain Management Utility
 * Handles CRUD operations for business chains and their locations
 */

// State management
let chainState = {
    chains: [],
    selectedChain: null,
    locations: [],
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 12,
    totalChains: 0,
    isLoading: false,
    filters: {
        search: '',
        category: '',
        status: 'all'
    },
    sortBy: 'name',
    sortOrder: 'asc'
};

/**
 * Get authentication token
 * @returns {string|null} Auth token
 */
function getAuthToken() {
    return localStorage.getItem('authToken') || localStorage.getItem('patriotThanksToken');
}

/**
 * Get base URL for API calls
 * @returns {string} Base URL
 */
function getBaseUrl() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `http://${window.location.host}`
        : window.location.origin;
}

/**
 * Show loading state
 * @param {boolean} isLoading Whether to show loading state
 */
function setLoadingState(isLoading) {
    chainState.isLoading = isLoading;
    const loadingElements = document.querySelectorAll('.chain-loading');
    const contentElements = document.querySelectorAll('.chain-content');

    loadingElements.forEach(el => {
        el.style.display = isLoading ? 'block' : 'none';
    });

    contentElements.forEach(el => {
        el.style.display = isLoading ? 'none' : 'block';
    });
}

/**
 * Display error message
 * @param {string} message Error message to display
 */
function showError(message) {
    console.error('Chain Management Error:', message);

    if (typeof window.showAlert === 'function') {
        window.showAlert(message, 'error');
    } else if (typeof window.showToast === 'function') {
        window.showToast(message, 'error');
    } else {
        alert('Error: ' + message);
    }
}

/**
 * Display success message
 * @param {string} message Success message to display
 */
function showSuccess(message) {
    console.log('Chain Management Success:', message);

    if (typeof window.showAlert === 'function') {
        window.showAlert(message, 'success');
    } else if (typeof window.showToast === 'function') {
        window.showToast(message, 'success');
    } else {
        alert(message);
    }
}

/**
 * Check admin access
 * @returns {Promise<boolean>} True if user has admin access
 */
async function checkAdminAccess() {
    try {
        if (typeof window.AdminAccess?.checkAdminStatus === 'function') {
            const result = await window.AdminAccess.checkAdminStatus();
            return result.isAdmin;
        }

        const token = getAuthToken();
        if (!token) return false;

        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/admin-access`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            return data.isAdmin === true;
        }
        return false;
    } catch (error) {
        console.error('Error checking admin access:', error);
        return false;
    }
}

/**
 * Load chains from the server
 * @param {object} options Loading options
 * @returns {Promise<object>} Chain data
 */
async function loadChains(options = {}) {
    const {
        page = chainState.currentPage,
        limit = chainState.itemsPerPage,
        search = chainState.filters.search,
        category = chainState.filters.category,
        status = chainState.filters.status,
        sortBy = chainState.sortBy,
        sortOrder = chainState.sortOrder
    } = options;

    setLoadingState(true);

    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const baseURL = getBaseUrl();
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sortBy,
            sortOrder
        });

        // Add filters if they have values
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (status && status !== 'all') params.append('status', status);

        const response = await fetch(`${baseURL}/api/chain-management?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();

        // Update state
        chainState.chains = data.chains || [];
        chainState.currentPage = data.currentPage || 1;
        chainState.totalPages = data.totalPages || 1;
        chainState.totalChains = data.totalChains || 0;

        console.log(`Loaded ${chainState.chains.length} chains`);
        return data;
    } catch (error) {
        console.error('Error loading chains:', error);
        showError(error.message);
        return { chains: [], totalChains: 0 };
    } finally {
        setLoadingState(false);
    }
}

/**
 * Create a new chain
 * @param {object} chainData Chain data to create
 * @returns {Promise<object>} Created chain data
 */
async function createChain(chainData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/chain-management`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chainData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        showSuccess('Chain created successfully');

        // Log admin action
        if (typeof window.AdminAccess?.logAdminAction === 'function') {
            window.AdminAccess.logAdminAction('Create Chain', {
                chainId: data.chain._id,
                chainName: chainData.name
            });
        }

        return data;
    } catch (error) {
        console.error('Error creating chain:', error);
        showError(error.message);
        throw error;
    }
}

/**
 * Update an existing chain
 * @param {string} chainId Chain ID to update
 * @param {object} updates Chain data to update
 * @returns {Promise<object>} Updated chain data
 */
async function updateChain(chainId, updates) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/chain-management`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ chainId, ...updates })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        showSuccess('Chain updated successfully');

        // Log admin action
        if (typeof window.AdminAccess?.logAdminAction === 'function') {
            window.AdminAccess.logAdminAction('Update Chain', {
                chainId: chainId,
                updates: Object.keys(updates)
            });
        }

        return data;
    } catch (error) {
        console.error('Error updating chain:', error);
        showError(error.message);
        throw error;
    }
}

/**
 * Delete a chain
 * @param {string} chainId Chain ID to delete
 * @returns {Promise<object>} Deletion result
 */
async function deleteChain(chainId) {
    if (!confirm('Are you sure you want to delete this chain? This will also delete all associated locations. This action cannot be undone.')) {
        return { cancelled: true };
    }

    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/chain-management`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ chainId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        showSuccess('Chain deleted successfully');

        // Log admin action
        if (typeof window.AdminAccess?.logAdminAction === 'function') {
            window.AdminAccess.logAdminAction('Delete Chain', {
                chainId: chainId
            });
        }

        return data;
    } catch (error) {
        console.error('Error deleting chain:', error);
        showError(error.message);
        throw error;
    }
}

/**
 * Load locations for a specific chain
 * @param {string} chainId Chain ID
 * @returns {Promise<Array>} Array of locations
 */
async function loadChainLocations(chainId) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/chain-management/${chainId}/locations`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        chainState.locations = data.locations || [];

        console.log(`Loaded ${chainState.locations.length} locations for chain ${chainId}`);
        return chainState.locations;
    } catch (error) {
        console.error('Error loading chain locations:', error);
        showError(error.message);
        return [];
    }
}

/**
 * Add location to a chain
 * @param {string} chainId Chain ID
 * @param {object} locationData Location data
 * @returns {Promise<object>} Created location data
 */
async function addChainLocation(chainId, locationData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/chain-management/${chainId}/locations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(locationData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        showSuccess('Location added successfully');

        // Log admin action
        if (typeof window.AdminAccess?.logAdminAction === 'function') {
            window.AdminAccess.logAdminAction('Add Chain Location', {
                chainId: chainId,
                locationId: data.location._id
            });
        }

        return data;
    } catch (error) {
        console.error('Error adding chain location:', error);
        showError(error.message);
        throw error;
    }
}

/**
 * Get chain categories for dropdown
 * @returns {Array} Array of chain categories
 */
function getChainCategories() {
    return [
        'Restaurant',
        'Retail',
        'Automotive',
        'Healthcare',
        'Fitness',
        'Entertainment',
        'Travel',
        'Technology',
        'Financial Services',
        'Home Services',
        'Beauty & Personal Care',
        'Education',
        'Professional Services',
        'Other'
    ];
}

/**
 * Validate chain data
 * @param {object} chainData Chain data to validate
 * @returns {object} Validation result
 */
function validateChainData(chainData) {
    const errors = [];

    // Required fields
    if (!chainData.name || chainData.name.trim() === '') {
        errors.push('Chain name is required');
    }

    if (!chainData.category || chainData.category.trim() === '') {
        errors.push('Category is required');
    }

    // Website validation (if provided)
    if (chainData.website && chainData.website.trim() !== '') {
        try {
            new URL(chainData.website);
        } catch {
            errors.push('Please enter a valid website URL');
        }
    }

    // Name length validation
    if (chainData.name && chainData.name.length > 100) {
        errors.push('Chain name must be less than 100 characters');
    }

    // Description length validation
    if (chainData.description && chainData.description.length > 500) {
        errors.push('Description must be less than 500 characters');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Validate location data
 * @param {object} locationData Location data to validate
 * @returns {object} Validation result
 */
function validateLocationData(locationData) {
    const errors = [];

    // Required fields
    if (!locationData.name || locationData.name.trim() === '') {
        errors.push('Location name is required');
    }

    if (!locationData.address || locationData.address.trim() === '') {
        errors.push('Address is required');
    }

    if (!locationData.city || locationData.city.trim() === '') {
        errors.push('City is required');
    }

    if (!locationData.state || locationData.state.trim() === '') {
        errors.push('State is required');
    }

    if (!locationData.zip || locationData.zip.trim() === '') {
        errors.push('ZIP code is required');
    }

    // Email validation (if provided)
    if (locationData.email && locationData.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(locationData.email)) {
            errors.push('Please enter a valid email address');
        }
    }

    // Phone validation (if provided)
    if (locationData.phone && locationData.phone.trim() !== '') {
        const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
        if (!phoneRegex.test(locationData.phone)) {
            errors.push('Please enter a valid phone number');
        }
    }

    // ZIP code validation
    if (locationData.zip) {
        const zipRegex = /^\d{5}(-\d{4})?$/;
        if (!zipRegex.test(locationData.zip)) {
            errors.push('Please enter a valid ZIP code');
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Format chain data for display
 * @param {object} chain Chain data
 * @returns {object} Formatted chain data
 */
function formatChainData(chain) {
    return {
        ...chain,
        statusText: chain.isActive ? 'Active' : 'Inactive',
        locationCountText: `${chain.locationCount || 0} location${(chain.locationCount || 0) !== 1 ? 's' : ''}`,
        createdDateFormatted: chain.createdAt ? new Date(chain.createdAt).toLocaleDateString() : '',
        updatedDateFormatted: chain.updatedAt ? new Date(chain.updatedAt).toLocaleDateString() : ''
    };
}

/**
 * Apply filters to chain list
 * @param {object} filters Filter criteria
 */
async function applyFilters(filters) {
    chainState.filters = { ...chainState.filters, ...filters };
    chainState.currentPage = 1; // Reset to first page
    await loadChains();
}

/**
 * Clear all filters
 */
async function clearFilters() {
    chainState.filters = {
        search: '',
        category: '',
        status: 'all'
    };
    chainState.currentPage = 1;
    await loadChains();
}

/**
 * Change page
 * @param {number} page Page number
 */
async function changePage(page) {
    if (page >= 1 && page <= chainState.totalPages) {
        chainState.currentPage = page;
        await loadChains();
    }
}

/**
 * Change sorting
 * @param {string} sortBy Field to sort by
 * @param {string} sortOrder Sort order (asc/desc)
 */
async function changeSorting(sortBy, sortOrder = 'asc') {
    chainState.sortBy = sortBy;
    chainState.sortOrder = sortOrder;
    chainState.currentPage = 1; // Reset to first page
    await loadChains();
}

/**
 * Toggle chain status (active/inactive)
 * @param {string} chainId Chain ID
 * @param {boolean} isActive New status
 * @returns {Promise<object>} Update result
 */
async function toggleChainStatus(chainId, isActive) {
    try {
        return await updateChain(chainId, { isActive });
    } catch (error) {
        console.error('Error toggling chain status:', error);
        throw error;
    }
}

/**
 * Search chains by name or category
 * @param {string} searchTerm Search term
 */
async function searchChains(searchTerm) {
    await applyFilters({ search: searchTerm });
}

/**
 * Get chain statistics
 * @returns {Promise<object>} Chain statistics
 */
async function getChainStatistics() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/chain-management/statistics`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        return data.statistics;
    } catch (error) {
        console.error('Error loading chain statistics:', error);
        return {
            totalChains: 0,
            activeChains: 0,
            inactiveChains: 0,
            totalLocations: 0,
            categoriesBreakdown: {}
        };
    }
}

/**
 * Setup event listeners for chain management
 */
function setupChainEventListeners() {
    // Search input handler
    const searchInput = document.getElementById('chain-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchChains(this.value);
            }, 500); // Debounce search
        });
    }

    // Category filter handler
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            applyFilters({ category: this.value });
        });
    }

    // Status filter handler
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            applyFilters({ status: this.value });
        });
    }

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
}

/**
 * Initialize the chain management utility
 * @returns {Promise<boolean>} True if initialization successful
 */
async function init() {
    console.log('Initializing Chain Management...');

    // Check admin access first
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) {
        console.error('Admin access denied');
        if (typeof window.AdminAccess?.enforceAdminAccess === 'function') {
            await window.AdminAccess.enforceAdminAccess();
        }
        return false;
    }

    console.log('Admin access confirmed');

    // Setup event listeners
    setupChainEventListeners();

    // Load chains
    await loadChains();

    return true;
}

// Export public API
window.ChainManagement = {
    // Data operations
    loadChains,
    createChain,
    updateChain,
    deleteChain,
    loadChainLocations,
    addChainLocation,
    toggleChainStatus,

    // Search and filtering
    searchChains,
    applyFilters,
    clearFilters,
    changePage,
    changeSorting,

    // Utility functions
    validateChainData,
    validateLocationData,
    formatChainData,
    getChainCategories,
    getChainStatistics,

    // Initialization
    init,
    setupChainEventListeners,

    // State access
    getState: () => ({ ...chainState }),
    getSelectedChain: () => chainState.selectedChain,
    setSelectedChain: (chain) => { chainState.selectedChain = chain; },

    // UI helpers
    showError,
    showSuccess,
    setLoadingState
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Chain Management utility loaded');

    // Check if we're on the chain management page
    if (document.getElementById('chains-container') || document.querySelector('.chain-management')) {
        init();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ChainManagement;
}