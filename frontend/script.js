// Blood Bank Management System - JavaScript

// Global State
let currentPage = 'home';
let currentAdminTab = 'requests';
let isAdminLoggedIn = false;

// Data Storage (using localStorage to simulate database)
const storage = {
    donors: JSON.parse(localStorage.getItem('bloodbank_donors') || '[]'),
    requests: JSON.parse(localStorage.getItem('bloodbank_requests') || '[]'),
    admin: { username: 'admin', password: 'admin123' }
};

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

function saveToStorage() {
    localStorage.setItem('bloodbank_donors', JSON.stringify(storage.donors));
    localStorage.setItem('bloodbank_requests', JSON.stringify(storage.requests));
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
function loadBloodAvailability() {
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const availabilityContainer = document.getElementById('blood-availability');
    
    if (!availabilityContainer) return;
    
    availabilityContainer.innerHTML = '';
    
    bloodGroups.forEach(group => {
        const count = storage.donors.filter(donor => donor.bloodGroup === group).length;
        
        const groupCard = document.createElement('div');
        groupCard.className = 'blood-group-card';
        groupCard.innerHTML = `
            <div class="blood-badge">${group}</div>
            <div class="blood-count">${count}</div>
            <div class="blood-label">Donors</div>
        `;
        
        availabilityContainer.appendChild(groupCard);
    });
}

function updateHomeStats() {
    const totalDonorsElement = document.getElementById('total-donors');
    if (totalDonorsElement) {
        totalDonorsElement.textContent = storage.donors.length;
    }
}

// Donor Registration Functions
function initializeDonorForm() {
    const donorForm = document.getElementById('donor-form');
    if (!donorForm) return;
    
    donorForm.addEventListener('submit', handleDonorRegistration);
}

function handleDonorRegistration(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const donorData = {
        id: generateId(),
        name: formData.get('name'),
        age: parseInt(formData.get('age')),
        bloodGroup: formData.get('bloodGroup'),
        city: formData.get('city'),
        contact: formData.get('contact'),
        email: formData.get('email') || '',
        registrationDate: new Date().toISOString(),
        isActive: true
    };
    
    // Validation
    if (!validateDonorData(donorData)) {
        return;
    }
    
    // Save donor
    storage.donors.push(donorData);
    saveToStorage();
    
    showToast('Registration successful! Thank you for becoming a donor.');
    event.target.reset();
    
    // Update home page stats if we're there
    updateHomeStats();
    loadBloodAvailability();
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
    
    if (!data.bloodGroup) {
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

function handleBloodRequest(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const requestData = {
        id: generateId(),
        requesterName: formData.get('requesterName'),
        requesterType: formData.get('requesterType'),
        bloodGroup: formData.get('bloodGroup'),
        urgencyLevel: formData.get('urgencyLevel'),
        city: formData.get('city'),
        contact: formData.get('contact'),
        email: formData.get('email') || '',
        unitsNeeded: parseInt(formData.get('unitsNeeded')),
        requestDate: new Date().toISOString(),
        status: 'pending',
        adminNotes: ''
    };
    
    // Validation
    if (!validateRequestData(requestData)) {
        return;
    }
    
    // Save request
    storage.requests.push(requestData);
    saveToStorage();
    
    showToast('Blood request submitted successfully! We will contact you soon.');
    event.target.reset();
}

function validateRequestData(data) {
    if (!data.requesterName.trim()) {
        showToast('Requester name is required', 'error');
        return false;
    }
    
    if (!data.requesterType) {
        showToast('Requester type is required', 'error');
        return false;
    }
    
    if (!data.bloodGroup) {
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
    
    if (!data.unitsNeeded || data.unitsNeeded < 1) {
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

function handleAdminLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const username = formData.get('username');
    const password = formData.get('password');
    
    if (username === storage.admin.username && password === storage.admin.password) {
        isAdminLoggedIn = true;
        localStorage.setItem('bloodbank_admin_session', 'true');
        showToast('Login successful! Redirecting to dashboard...');
        
        setTimeout(() => {
            showPage('admin-dashboard');
        }, 1000);
    } else {
        showToast('Invalid username or password', 'error');
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

function updateAdminStats() {
    const totalDonors = storage.donors.length;
    const totalRequests = storage.requests.length;
    const pendingRequests = storage.requests.filter(req => req.status === 'pending').length;
    const fulfilledRequests = storage.requests.filter(req => req.status === 'fulfilled').length;
    
    document.getElementById('admin-total-donors').textContent = totalDonors;
    document.getElementById('admin-total-requests').textContent = totalRequests;
    document.getElementById('admin-pending-requests').textContent = pendingRequests;
    document.getElementById('admin-fulfilled-requests').textContent = fulfilledRequests;
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

function loadRequestsList() {
    const container = document.getElementById('requests-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (storage.requests.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No blood requests found</p>';
        return;
    }
    
    // Sort requests by date (newest first)
    const sortedRequests = [...storage.requests].sort((a, b) => 
        new Date(b.requestDate) - new Date(a.requestDate)
    );
    
    sortedRequests.forEach(request => {
        const requestCard = createRequestCard(request);
        container.appendChild(requestCard);
    });
}

function createRequestCard(request) {
    const card = document.createElement('div');
    card.className = `request-card ${request.urgencyLevel === 'critical' ? 'urgency-critical' : ''}`;
    
    const statusClass = `status-${request.status}`;
    const urgencyClass = `urgency-${request.urgencyLevel}`;
    
    let actionButtons = '';
    if (request.status === 'pending') {
        actionButtons = `
            <button class="btn btn-approve" onclick="updateRequestStatus('${request.id}', 'approved')">
                <i class="fas fa-check-circle"></i> Approve
            </button>
            <button class="btn btn-reject" onclick="updateRequestStatus('${request.id}', 'rejected')">
                <i class="fas fa-times-circle"></i> Reject
            </button>
        `;
    } else if (request.status === 'approved') {
        actionButtons = `
            <button class="btn btn-fulfill" onclick="updateRequestStatus('${request.id}', 'fulfilled')">
                Mark Fulfilled
            </button>
        `;
    }
    
    card.innerHTML = `
        <div class="request-header">
            <div class="request-info">
                <h3>${request.requesterName}</h3>
                <p>${request.requesterType}</p>
                <p>${request.city}</p>
            </div>
            <div class="blood-group-info">
                <div class="mini-blood-badge">${request.bloodGroup}</div>
                <div>
                    <span style="font-weight: 600;">${request.unitsNeeded} units</span>
                    <p class="urgency-badge ${urgencyClass}">${request.urgencyLevel} Priority</p>
                </div>
            </div>
            <div class="contact-info">
                <p>${request.contact}</p>
                ${request.email ? `<p>${request.email}</p>` : ''}
                <p style="font-size: 0.75rem; color: #6b7280;">${formatDate(new Date(request.requestDate))}</p>
            </div>
            <div class="request-actions">
                <div class="status-badge ${statusClass}">${request.status}</div>
                ${actionButtons}
            </div>
        </div>
        ${request.adminNotes ? `
            <div class="admin-notes">
                <strong>Admin Notes:</strong> ${request.adminNotes}
            </div>
        ` : ''}
    `;
    
    return card;
}

function updateRequestStatus(requestId, newStatus) {
    const request = storage.requests.find(req => req.id === requestId);
    if (!request) return;
    
    request.status = newStatus;
    
    if (newStatus === 'fulfilled') {
        request.fulfilledDate = new Date().toISOString();
    }
    
    // Add admin notes for status changes
    let adminNote = '';
    switch (newStatus) {
        case 'approved':
            adminNote = 'Request approved by admin';
            break;
        case 'rejected':
            adminNote = 'Request rejected by admin';
            break;
        case 'fulfilled':
            adminNote = 'Request marked as fulfilled';
            break;
    }
    
    if (adminNote) {
        request.adminNotes = request.adminNotes ? 
            `${request.adminNotes}\
${adminNote}` : adminNote;
    }
    
    saveToStorage();
    showToast(`Request ${newStatus} successfully!`);
    
    // Reload the dashboard
    updateAdminStats();
    loadRequestsList();
}

function loadDonorsList() {
    const container = document.getElementById('donors-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (storage.donors.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No donors found</p>';
        return;
    }
    
    // Create donors grid
    const donorsGrid = document.createElement('div');
    donorsGrid.className = 'donors-grid';
    
    // Sort donors by registration date (newest first)
    const sortedDonors = [...storage.donors].sort((a, b) => 
        new Date(b.registrationDate) - new Date(a.registrationDate)
    );
    
    sortedDonors.forEach(donor => {
        const donorCard = createDonorCard(donor);
        donorsGrid.appendChild(donorCard);
    });
    
    container.appendChild(donorsGrid);
}

function createDonorCard(donor) {
    const card = document.createElement('div');
    card.className = 'donor-card';
    
    card.innerHTML = `
        <div class="donor-header">
            <div class="mini-blood-badge">${donor.bloodGroup}</div>
            <div class="donor-info">
                <h3>${donor.name}</h3>
                <p>Age: ${donor.age}</p>
                <p>${donor.city}</p>
                <p>${donor.contact}</p>
                ${donor.email ? `<p>${donor.email}</p>` : ''}
            </div>
        </div>
        <div class="donor-details">
            <p>Registered: ${formatDate(new Date(donor.registrationDate))}</p>
            ${donor.lastDonationDate ? 
                `<p>Last Donation: ${formatDate(new Date(donor.lastDonationDate))}</p>` : 
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
    
    // Add sample data if storage is empty (for demo purposes)
    if (storage.donors.length === 0 && storage.requests.length === 0) {
        addSampleData();
    }
}

// Sample Data for Demo
function addSampleData() {
    // Add sample donors
    const sampleDonors = [
        {
            id: generateId(),
            name: 'John Smith',
            age: 28,
            bloodGroup: 'O+',
            city: 'New York',
            contact: '555-0123',
            email: 'john@example.com',
            registrationDate: new Date(Date.now() - 86400000 * 5).toISOString(),
            isActive: true
        },
        {
            id: generateId(),
            name: 'Sarah Johnson',
            age: 32,
            bloodGroup: 'A+',
            city: 'Los Angeles',
            contact: '555-0124',
            email: 'sarah@example.com',
            registrationDate: new Date(Date.now() - 86400000 * 3).toISOString(),
            isActive: true
        },
        {
            id: generateId(),
            name: 'Mike Wilson',
            age: 25,
            bloodGroup: 'B+',
            city: 'Chicago',
            contact: '555-0125',
            email: 'mike@example.com',
            registrationDate: new Date(Date.now() - 86400000 * 7).toISOString(),
            isActive: true
        }
    ];
    
    // Add sample requests
    const sampleRequests = [
        {
            id: generateId(),
            requesterName: 'City General Hospital',
            requesterType: 'hospital',
            bloodGroup: 'O+',
            urgencyLevel: 'high',
            city: 'New York',
            contact: '555-0200',
            email: 'emergency@citygeneral.com',
            unitsNeeded: 3,
            requestDate: new Date(Date.now() - 86400000 * 2).toISOString(),
            status: 'pending',
            adminNotes: ''
        },
        {
            id: generateId(),
            requesterName: 'Jennifer Brown',
            requesterType: 'patient',
            bloodGroup: 'A+',
            urgencyLevel: 'critical',
            city: 'Los Angeles',
            contact: '555-0201',
            email: 'jennifer@example.com',
            unitsNeeded: 2,
            requestDate: new Date(Date.now() - 86400000 * 1).toISOString(),
            status: 'approved',
            adminNotes: 'Urgent surgery case - approved immediately'
        }
    ];
    
    storage.donors.push(...sampleDonors);
    storage.requests.push(...sampleRequests);
    saveToStorage();
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