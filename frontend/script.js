// Blood Bank Management System - JavaScript

// Global State
let currentPage = 'home';
let currentAdminTab = 'requests';
let isAdminLoggedIn = false;

// Utility Functions
function generateId() {
    return 'id-' + Math.random().toString(36).substr(2, 16);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Toast Notification System
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');

    toast.className = `toast ${type}`;
    toastMessage.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        hideToast();
    }, 5000);
}

function hideToast() {
    const toast = document.getElementById('toast');
    toast.classList.remove('show');
}

// Navigation Functions
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(pageId).classList.add('active');
    currentPage = pageId;

    // Update navigation active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Find and activate current nav link
    const currentNavLink = Array.from(document.querySelectorAll('.nav-link')).find(link => {
        const onclick = link.getAttribute('onclick');
        return onclick && onclick.includes(`'${pageId}'`);
    });

    if (currentNavLink) {
        currentNavLink.classList.add('active');
    }

    // Close mobile menu if open
    const navMenu = document.getElementById('nav-menu');
    const hamburger = document.getElementById('hamburger');
    navMenu.classList.remove('active');
    hamburger.classList.remove('active');

    // Special handling for admin dashboard
    if (pageId === 'admin-dashboard') {
        if (!isAdminLoggedIn) {
            showPage('admin-login');
            showToast('Please login to access admin dashboard', 'error');
            return;
        }
        loadAdminDashboard();
    }

    // Load page-specific data
    switch (pageId) {
        case 'home':
            loadBloodAvailability();
            updateHomeStats();
            break;
        case 'admin-dashboard':
            if (isAdminLoggedIn) {
                loadAdminDashboard();
            }
            break;
    }
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const hamburger = document.getElementById('hamburger');

    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
}

// Password Toggle
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.password-toggle i');

    if (input.type === 'password') {
        input.type = 'text';
        button.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        button.className = 'fas fa-eye';
    }
}

// Home Page Functions
async function loadBloodAvailability() {
    const availabilityContainer = document.getElementById('blood-availability');
    if (!availabilityContainer) return;

    try {
        const response = await fetch('/api/donors');
        const donors = await response.json();
        const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        availabilityContainer.innerHTML = '';

        bloodGroups.forEach(group => {
            const count = donors.filter(donor => donor.blood_group === group).length;
            const groupCard = document.createElement('div');
            groupCard.className = 'blood-group-card';
            groupCard.innerHTML = `
                <div class="blood-badge">${group}</div>
                <div class="blood-count">${count}</div>
                <div class="blood-label">Donors</div>
            `;
            availabilityContainer.appendChild(groupCard);
        });
    } catch (error) {
        console.error('Error loading blood availability:', error);
        showToast('Failed to load blood availability', 'error');
    }
}

async function updateHomeStats() {
    const totalDonorsElement = document.getElementById('total-donors');
    if (totalDonorsElement) {
        try {
            const response = await fetch('/api/donors');
            const donors = await response.json();
            totalDonorsElement.textContent = donors.length;
        } catch (error) {
            console.error('Error updating home stats:', error);
        }
    }
}


// Donor Registration Functions
function initializeDonorForm() {
    const donorForm = document.getElementById('donor-form');
    if (!donorForm) return;

    donorForm.addEventListener('submit', handleDonorRegistration);
}

async function handleDonorRegistration(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const donorData = {
        name: formData.get('name'),
        age: parseInt(formData.get('age')),
        blood_group: formData.get('bloodGroup'),
        city: formData.get('city'),
        contact: formData.get('contact'),
        email: formData.get('email') || '',
        last_donation_date: null
    };

    if (!validateDonorData(donorData)) {
        return;
    }

    try {
        const response = await fetch('/api/donors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(donorData),
        });

        if (response.ok) {
            showToast('Registration successful! Thank you for becoming a donor.');
            event.target.reset();
            updateHomeStats();
            loadBloodAvailability();
        } else {
            showToast('Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error during donor registration:', error);
        showToast('An error occurred. Please try again.', 'error');
    }
}

function validateDonorData(data) {
    if (!data.name.trim()) {
        showToast('Name is required', 'error');
        return false;
    }

    if (data.age < 18 || data.age > 65) {
        showToast('Age must be between 18 and 65', 'error');
        return false;
    }

    if (!data.blood_group) {
        showToast('Blood group is required', 'error');
        return false;
    }

    if (!data.city.trim()) {
        showToast('City is required', 'error');
        return false;
    }

    if (!data.contact.trim()) {
        showToast('Contact number is required', 'error');
        return false;
    }

    if (data.contact.length < 10) {
        showToast('Contact number must be at least 10 digits', 'error');
        return false;
    }

    if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
        showToast('Please enter a valid email address', 'error');
        return false;
    }

    return true;
}

// Blood Request Functions
function initializeRequestForm() {
    const requestForm = document.getElementById('request-form');
    if (!requestForm) return;

    requestForm.addEventListener('submit', handleBloodRequest);
}

async function handleBloodRequest(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const requestData = {
        patient_name: formData.get('requesterName'),
        requesterType: formData.get('requesterType'), // This field is not in the DB schema, but we keep it for validation
        blood_group: formData.get('bloodGroup'),
        urgencyLevel: formData.get('urgencyLevel'), // Also not in DB schema
        city: formData.get('city'),
        contact: formData.get('contact'),
        email: formData.get('email') || '',
        units: parseInt(formData.get('unitsNeeded')),
        hospital: 'N/A' // Assuming hospital might not always be provided
    };

    if (!validateRequestData(requestData)) {
        return;
    }
    
    // Adjust for hospital/patient name
    if (requestData.requesterType === 'hospital') {
        requestData.hospital = requestData.patient_name;
    }

    try {
        const response = await fetch('/api/requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (response.ok) {
            showToast('Blood request submitted successfully! We will contact you soon.');
            event.target.reset();
        } else {
            showToast('Failed to submit blood request. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error submitting blood request:', error);
        showToast('An error occurred. Please try again.', 'error');
    }
}


function validateRequestData(data) {
    if (!data.patient_name.trim()) {
        showToast('Requester name is required', 'error');
        return false;
    }

    if (!data.requesterType) {
        showToast('Requester type is required', 'error');
        return false;
    }

    if (!data.blood_group) {
        showToast('Blood group is required', 'error');
        return false;
    }

    if (!data.urgencyLevel) {
        showToast('Urgency level is required', 'error');
        return false;
    }

    if (!data.city.trim()) {
        showToast('City is required', 'error');
        return false;
    }

    if (!data.contact.trim()) {
        showToast('Contact number is required', 'error');
        return false;
    }

    if (data.contact.length < 10) {
        showToast('Contact number must be at least 10 digits', 'error');
        return false;
    }

    if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
        showToast('Please enter a valid email address', 'error');
        return false;
    }

    if (!data.units || data.units < 1) {
        showToast('Units needed must be at least 1', 'error');
        return false;
    }

    return true;
}


// Admin Functions
function initializeAdminLogin() {
    const adminForm = document.getElementById('admin-login-form');
    if (!adminForm) return;

    adminForm.addEventListener('submit', handleAdminLogin);
}

async function handleAdminLogin(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            isAdminLoggedIn = true;
            localStorage.setItem('bloodbank_admin_session', 'true');
            showToast('Login successful! Redirecting to dashboard...');

            setTimeout(() => {
                showPage('admin-dashboard');
            }, 1000);
        } else {
            showToast('Invalid username or password', 'error');
        }
    } catch (error) {
        console.error('Admin login error:', error);
        showToast('An error occurred during login.', 'error');
    }
}


function adminLogout() {
    isAdminLoggedIn = false;
    localStorage.removeItem('bloodbank_admin_session');
    showToast('Logged out successfully');
    showPage('admin-login');
}

function loadAdminDashboard() {
    updateAdminStats();
    showAdminTab(currentAdminTab);
}

async function updateAdminStats() {
    try {
        const [donorsRes, requestsRes] = await Promise.all([
            fetch('/api/donors'),
            fetch('/api/requests')
        ]);
        const donors = await donorsRes.json();
        const requests = await requestsRes.json();
        
        const totalDonors = donors.length;
        const totalRequests = requests.length;
        const pendingRequests = requests.filter(req => req.status === 'pending').length;
        const fulfilledRequests = requests.filter(req => req.status === 'fulfilled').length;

        document.getElementById('admin-total-donors').textContent = totalDonors;
        document.getElementById('admin-total-requests').textContent = totalRequests;
        document.getElementById('admin-pending-requests').textContent = pendingRequests;
        document.getElementById('admin-fulfilled-requests').textContent = fulfilledRequests;
    } catch (error) {
        console.error('Error updating admin stats:', error);
    }
}


function showAdminTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Show selected tab
    document.querySelector(`[onclick="showAdminTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`admin-${tabName}-tab`).classList.add('active');

    currentAdminTab = tabName;

    // Load tab content
    if (tabName === 'requests') {
        loadRequestsList();
    } else if (tabName === 'donors') {
        loadDonorsList();
    }
}

async function loadRequestsList() {
    const container = document.getElementById('requests-list');
    if (!container) return;

    try {
        const response = await fetch('/api/requests');
        const requests = await response.json();
        container.innerHTML = '';

        if (requests.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No blood requests found</p>';
            return;
        }

        requests.forEach(request => {
            const requestCard = createRequestCard(request);
            container.appendChild(requestCard);
        });
    } catch (error) {
        console.error('Error loading requests list:', error);
        container.innerHTML = '<p style="text-align: center; color: #dc2626; padding: 2rem;">Failed to load requests.</p>';
    }
}

function createRequestCard(request) {
    const card = document.createElement('div');
    // A default for urgencyLevel since it's not in the DB.
    const urgencyLevel = request.urgencyLevel || 'normal';
    card.className = `request-card ${urgencyLevel === 'critical' ? 'urgency-critical' : ''}`;

    const statusClass = `status-${request.status}`;
    const urgencyClass = `urgency-${urgencyLevel}`;

    let actionButtons = '';
    if (request.status === 'pending') {
        actionButtons = `
            <button class="btn btn-approve" onclick="updateRequestStatus(${request.id}, 'approved')">
                <i class="fas fa-check-circle"></i> Approve
            </button>
            <button class="btn btn-reject" onclick="updateRequestStatus(${request.id}, 'rejected')">
                <i class="fas fa-times-circle"></i> Reject
            </button>
        `;
    } else if (request.status === 'approved') {
        actionButtons = `
            <button class="btn btn-fulfill" onclick="updateRequestStatus(${request.id}, 'fulfilled')">
                Mark Fulfilled
            </button>
        `;
    }

    card.innerHTML = `
        <div class="request-header">
            <div class="request-info">
                <h3>${request.patient_name}</h3>
                <p>${request.hospital}</p>
                <p>${request.city}</p>
            </div>
            <div class="blood-group-info">
                <div class="mini-blood-badge">${request.blood_group}</div>
                <div>
                    <span style="font-weight: 600;">${request.units} units</span>
                    <p class="urgency-badge ${urgencyClass}">${urgencyLevel} Priority</p>
                </div>
            </div>
            <div class="contact-info">
                <p>${request.contact}</p>
                ${request.email ? `<p>${request.email}</p>` : ''}
                <p style="font-size: 0.75rem; color: #6b7280;">${formatDate(new Date(request.created_at))}</p>
            </div>
            <div class="request-actions">
                <div class="status-badge ${statusClass}">${request.status}</div>
                ${actionButtons}
            </div>
        </div>
    `;

    return card;
}

async function updateRequestStatus(requestId, newStatus) {
    try {
        const response = await fetch(`/api/requests/${requestId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
            showToast(`Request ${newStatus} successfully!`);
            updateAdminStats();
            loadRequestsList();
        } else {
            showToast('Failed to update request status.', 'error');
        }
    } catch (error) {
        console.error('Error updating request status:', error);
        showToast('An error occurred while updating status.', 'error');
    }
}

async function loadDonorsList() {
    const container = document.getElementById('donors-list');
    if (!container) return;

    try {
        const response = await fetch('/api/donors');
        const donors = await response.json();
        container.innerHTML = '';

        if (donors.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No donors found</p>';
            return;
        }

        const donorsGrid = document.createElement('div');
        donorsGrid.className = 'donors-grid';

        donors.forEach(donor => {
            const donorCard = createDonorCard(donor);
            donorsGrid.appendChild(donorCard);
        });

        container.appendChild(donorsGrid);
    } catch (error) {
        console.error('Error loading donors list:', error);
        container.innerHTML = '<p style="text-align: center; color: #dc2626; padding: 2rem;">Failed to load donors.</p>';
    }
}


function createDonorCard(donor) {
    const card = document.createElement('div');
    card.className = 'donor-card';

    card.innerHTML = `
        <div class="donor-header">
            <div class="mini-blood-badge">${donor.blood_group}</div>
            <div class="donor-info">
                <h3>${donor.name}</h3>
                <p>Age: ${donor.age}</p>
                <p>${donor.city}</p>
                <p>${donor.contact}</p>
                ${donor.email ? `<p>${donor.email}</p>` : ''}
            </div>
        </div>
        <div class="donor-details">
            <p>Registered: ${donor.registrationDate ? formatDate(new Date(donor.registrationDate)) : 'N/A'}</p>
            ${donor.last_donation_date ?
                `<p>Last Donation: ${formatDate(new Date(donor.last_donation_date))}</p>` :
                '<p>No donations recorded</p>'
            }
        </div>
    `;

    return card;
}


// Initialize Application
function initializeApp() {
    // Check admin session
    if (localStorage.getItem('bloodbank_admin_session') === 'true') {
        isAdminLoggedIn = true;
    }

    // Initialize forms
    initializeDonorForm();
    initializeRequestForm();
    initializeAdminLogin();

    // Initialize mobile menu
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }

    // Load initial page data
    loadBloodAvailability();
    updateHomeStats();

    // Show default page
    showPage('home');
}

// Close mobile menu when clicking on a link
document.addEventListener('click', function(event) {
    const navMenu = document.getElementById('nav-menu');
    const hamburger = document.getElementById('hamburger');

    if (event.target.matches('.nav-link')) {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// Close toast when clicking outside
document.addEventListener('click', function(event) {
    const toast = document.getElementById('toast');
    if (!toast.contains(event.target) && toast.classList.contains('show')) {
        hideToast();
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);