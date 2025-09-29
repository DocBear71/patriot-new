// file: /src/utils/donations-admin.js v1 - Admin donations management and reporting utility

/**
 * Donations Admin Management Utility
 * Handles viewing, managing, and reporting on donations for administrators
 */

// State management
let donationsAdminState = {
    donations: [],
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 20,
    totalDonations: 0,
    totalAmount: 0,
    isLoading: false,
    filters: {
        search: '',
        status: '',
        dateRange: '',
        amountRange: '',
        recurring: ''
    },
    sortBy: 'createdAt',
    sortOrder: 'desc',
    selectedDonation: null,
    statistics: {}
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
    donationsAdminState.isLoading = isLoading;
    const loadingElements = document.querySelectorAll('.donations-loading');
    const contentElements = document.querySelectorAll('.donations-content');

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
    console.error('Donations Admin Error:', message);

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
    console.log('Donations Admin Success:', message);

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
 * Load donations from the server
 * @param {object} options Loading options
 * @returns {Promise<object>} Donations data
 */
async function loadDonations(options = {}) {
    const {
        page = donationsAdminState.currentPage,
        limit = donationsAdminState.itemsPerPage,
        search = donationsAdminState.filters.search,
        status = donationsAdminState.filters.status,
        dateRange = donationsAdminState.filters.dateRange,
        amountRange = donationsAdminState.filters.amountRange,
        recurring = donationsAdminState.filters.recurring,
        sortBy = donationsAdminState.sortBy,
        sortOrder = donationsAdminState.sortOrder
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
        if (status) params.append('status', status);
        if (dateRange) params.append('dateRange', dateRange);
        if (amountRange) params.append('amountRange', amountRange);
        if (recurring) params.append('recurring', recurring);

        const response = await fetch(`${baseURL}/api/donations-admin?${params}`, {
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
        donationsAdminState.donations = data.donations || [];
        donationsAdminState.currentPage = data.currentPage || 1;
        donationsAdminState.totalPages = data.totalPages || 1;
        donationsAdminState.totalDonations = data.totalDonations || 0;
        donationsAdminState.totalAmount = data.totalAmount || 0;

        console.log(`Loaded ${donationsAdminState.donations.length} donations`);
        return data;
    } catch (error) {
        console.error('Error loading donations:', error);
        showError(error.message);
        return { donations: [], totalDonations: 0, totalAmount: 0 };
        setLoadingState(false);
    }
}

/**
 * Load donation statistics
 * @returns {Promise<object>} Donation statistics
 */
async function loadDonationStatistics() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/donations-admin/statistics`, {
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
        donationsAdminState.statistics = data.statistics;

        console.log('Loaded donation statistics');
        return data.statistics;
    } catch (error) {
        console.error('Error loading donation statistics:', error);
        return {
            totalDonations: 0,
            totalAmount: 0,
            averageDonation: 0,
            recurringDonations: 0,
            thisMonth: { count: 0, amount: 0 },
            lastMonth: { count: 0, amount: 0 },
            thisYear: { count: 0, amount: 0 }
        };
    }
}

/**
 * Update donation status
 * @param {string} donationId Donation ID
 * @param {string} status New status
 * @returns {Promise<object>} Update result
 */
async function updateDonationStatus(donationId, status) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/donations-admin/update-status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ donationId, status })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        showSuccess('Donation status updated successfully');

        // Log admin action
        if (typeof window.AdminAccess?.logAdminAction === 'function') {
            window.AdminAccess.logAdminAction('Update Donation Status', {
                donationId: donationId,
                newStatus: status
            });
        }

        return data;
    } catch (error) {
        console.error('Error updating donation status:', error);
        showError(error.message);
        throw error;
    }
}

/**
 * Refund a donation
 * @param {string} donationId Donation ID
 * @param {string} reason Refund reason
 * @returns {Promise<object>} Refund result
 */
async function refundDonation(donationId, reason) {
    if (!confirm('Are you sure you want to refund this donation? This action cannot be undone.')) {
        return { cancelled: true };
    }

    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/donations-admin/refund`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ donationId, reason })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        showSuccess('Donation refunded successfully');

        // Log admin action
        if (typeof window.AdminAccess?.logAdminAction === 'function') {
            window.AdminAccess.logAdminAction('Refund Donation', {
                donationId: donationId,
                reason: reason
            });
        }

        return data;
    } catch (error) {
        console.error('Error refunding donation:', error);
        showError(error.message);
        throw error;
    }
}

/**
 * Export donations to CSV
 * @param {object} filters Export filters
 * @returns {Promise<void>}
 */
async function exportDonationsCSV(filters = {}) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const baseURL = getBaseUrl();
        const params = new URLSearchParams(filters);

        const response = await fetch(`${baseURL}/api/donations-admin/export?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `donations-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showSuccess('Donations exported successfully');

        // Log admin action
        if (typeof window.AdminAccess?.logAdminAction === 'function') {
            window.AdminAccess.logAdminAction('Export Donations', {
                filters: filters,
                exportDate: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error exporting donations:', error);
        showError('Failed to export donations');
    }
}

/**
 * Get donation status options
 * @returns {Array} Array of status options
 */
function getDonationStatuses() {
    return [
        { value: 'completed', label: 'Completed' },
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'failed', label: 'Failed' },
        { value: 'refunded', label: 'Refunded' },
        { value: 'cancelled', label: 'Cancelled' }
    ];
}

/**
 * Get status label from code
 * @param {string} status Status code
 * @returns {string} Status label
 */
function getStatusLabel(status) {
    const statuses = getDonationStatuses();
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
}

/**
 * Format currency amount for display
 * @param {number} amount Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Format donation data for display
 * @param {object} donation Donation data
 * @returns {object} Formatted donation data
 */
function formatDonationData(donation) {
    return {
        ...donation,
        formattedAmount: formatCurrency(donation.amount),
        statusLabel: getStatusLabel(donation.status),
        donorName: donation.isAnonymous
            ? 'Anonymous'
            : `${donation.donorInfo.firstName} ${donation.donorInfo.lastName}`,
        createdDateFormatted: donation.createdAt ? new Date(donation.createdAt).toLocaleDateString() : '',
        recurringText: donation.isRecurring ? `Yes (${donation.frequency})` : 'No'
    };
}

/**
 * Apply filters to donations list
 * @param {object} filters Filter criteria
 */
async function applyFilters(filters) {
    donationsAdminState.filters = { ...donationsAdminState.filters, ...filters };
    donationsAdminState.currentPage = 1; // Reset to first page
    await loadDonations();
}

/**
 * Clear all filters
 */
async function clearFilters() {
    donationsAdminState.filters = {
        search: '',
        status: '',
        dateRange: '',
        amountRange: '',
        recurring: ''
    };
    donationsAdminState.currentPage = 1;
    await loadDonations();
}

/**
 * Change page
 * @param {number} page Page number
 */
async function changePage(page) {
    if (page >= 1 && page <= donationsAdminState.totalPages) {
        donationsAdminState.currentPage = page;
        await loadDonations();
    }
}

/**
 * Change sorting
 * @param {string} sortBy Field to sort by
 * @param {string} sortOrder Sort order (asc/desc)
 */
async function changeSorting(sortBy, sortOrder = 'desc') {
    donationsAdminState.sortBy = sortBy;
    donationsAdminState.sortOrder = sortOrder;
    donationsAdminState.currentPage = 1; // Reset to first page
    await loadDonations();
}

/**
 * Search donations
 * @param {string} searchTerm Search term
 */
async function searchDonations(searchTerm) {
    await applyFilters({ search: searchTerm });
}

/**
 * Generate donation report
 * @param {string} reportType Type of report (daily, weekly, monthly, yearly)
 * @returns {Promise<object>} Report data
 */
async function generateDonationReport(reportType) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const baseURL = getBaseUrl();
        const response = await fetch(`${baseURL}/api/donations-admin/report/${reportType}`, {
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
        console.log(`Generated ${reportType} donation report`);
        return data.report;
    } catch (error) {
        console.error('Error generating donation report:', error);
        showError(`Failed to generate ${reportType} report`);
        return null;
    }
}

/**
 * Setup event listeners for donations admin
 */
function setupDonationsAdminEventListeners() {
    // Search input handler
    const searchInput = document.getElementById('donations-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchDonations(this.value);
            }, 500); // Debounce search
        });
    }

    // Status filter handler
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            applyFilters({ status: this.value });
        });
    }

    // Date range filter handler
    const dateRangeFilter = document.getElementById('date-range-filter');
    if (dateRangeFilter) {
        dateRangeFilter.addEventListener('change', function() {
            applyFilters({ dateRange: this.value });
        });
    }

    // Amount range filter handler
    const amountRangeFilter = document.getElementById('amount-range-filter');
    if (amountRangeFilter) {
        amountRangeFilter.addEventListener('change', function() {
            applyFilters({ amountRange: this.value });
        });
    }

    // Recurring filter handler
    const recurringFilter = document.getElementById('recurring-filter');
    if (recurringFilter) {
        recurringFilter.addEventListener('change', function() {
            applyFilters({ recurring: this.value });
        });
    }

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }

    // Export button
    const exportBtn = document.getElementById('export-donations');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportDonationsCSV(donationsAdminState.filters);
        });
    }

    // Pagination buttons
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            changePage(donationsAdminState.currentPage - 1);
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            changePage(donationsAdminState.currentPage + 1);
        });
    }
}

/**
 * Update dashboard statistics display
 * @param {object} statistics Statistics data
 */
function updateStatisticsDisplay(statistics) {
    // Update total donations count
    const totalCountElement = document.getElementById('total-donations-count');
    if (totalCountElement) {
        totalCountElement.textContent = statistics.totalDonations.toLocaleString();
    }

    // Update total amount
    const totalAmountElement = document.getElementById('total-donations-amount');
    if (totalAmountElement) {
        totalAmountElement.textContent = formatCurrency(statistics.totalAmount);
    }

    // Update average donation
    const avgDonationElement = document.getElementById('avg-donation-amount');
    if (avgDonationElement) {
        avgDonationElement.textContent = formatCurrency(statistics.averageDonation);
    }

    // Update this month stats
    const thisMonthCountElement = document.getElementById('this-month-count');
    if (thisMonthCountElement) {
        thisMonthCountElement.textContent = statistics.thisMonth.count.toLocaleString();
    }

    const thisMonthAmountElement = document.getElementById('this-month-amount');
    if (thisMonthAmountElement) {
        thisMonthAmountElement.textContent = formatCurrency(statistics.thisMonth.amount);
    }

    // Update recurring donations
    const recurringCountElement = document.getElementById('recurring-donations-count');
    if (recurringCountElement) {
        recurringCountElement.textContent = statistics.recurringDonations.toLocaleString();
    }
}

/**
 * Initialize the donations admin utility
 * @returns {Promise<boolean>} True if initialization successful
 */
async function init() {
    console.log('Initializing Donations Admin Manager...');

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
    setupDonationsAdminEventListeners();

    // Load data
    const statistics = await loadDonationStatistics();
    updateStatisticsDisplay(statistics);
    await loadDonations();

    return true;
}

// Export public API
window.DonationsAdmin = {
    // Data operations
    loadDonations,
    loadDonationStatistics,
    updateDonationStatus,
    refundDonation,
    exportDonationsCSV,
    generateDonationReport,

    // Search and filtering
    searchDonations,
    applyFilters,
    clearFilters,
    changePage,
    changeSorting,

    // Utility functions
    formatDonationData,
    formatCurrency,
    getDonationStatuses,
    getStatusLabel,

    // UI functions
    updateStatisticsDisplay,

    // Initialization
    init,
    setupDonationsAdminEventListeners,

    // State access
    getState: () => ({ ...donationsAdminState }),

    // UI helpers
    showError,
    showSuccess,
    setLoadingState
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Donations Admin utility loaded');

    // Check if we're on the donations admin page
    if (document.getElementById('donations-table-body') || document.querySelector('.donations-admin')) {
        init();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.DonationsAdmin;
}