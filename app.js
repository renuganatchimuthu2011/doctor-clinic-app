// Firebase Configuration & Initialization
const firebaseConfig = {
    projectId: "doctor-clinic-app-2026",
    appId: "1:641524447355:web:61541f05556740b0c78ade",
    storageBucket: "doctor-clinic-app-2026.firebasestorage.app",
    apiKey: "AIzaSyBYI-Q624DLSXjrxrzgeEOFdeMROPbDugs",
    authDomain: "doctor-clinic-app-2026.firebaseapp.com",
    messagingSenderId: "641524447355"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// State Management
let patients = [];
let users = [];
let stockItems = [];
let purchases = [];
let currentUser = localStorage.getItem('clinic_current_user');
let selectedPatientId = null;
let authMode = 'login'; // 'login' or 'signup'

// Auth Elements
const authContainer = document.getElementById('authContainer');
const mainApp = document.getElementById('mainApp');
const authForm = document.getElementById('authForm');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authToggleLink = document.getElementById('authToggleLink');
const authToggleText = document.getElementById('authToggleText');
const authSubtitle = document.getElementById('authSubtitle');
const authUsername = document.getElementById('authUsername');
const authPassword = document.getElementById('authPassword');
const logoutBtn = document.getElementById('logoutBtn');

// DOM Elements
const registrationForm = document.getElementById('registrationForm');
const patientList = document.getElementById('patientList');
const searchPatient = document.getElementById('searchPatient');
const searchResults = document.getElementById('searchResults');

// Mobile Sidebar Elements
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

// Navigation Elements
const navRegistration = document.getElementById('navRegistration');
const navDashboard = document.getElementById('navDashboard');
const navBillingSummary = document.getElementById('navBillingSummary');
const navStockDetails = document.getElementById('navStockDetails');
const registrationView = document.getElementById('registrationView');
const dashboardView = document.getElementById('dashboardView');
const billingSummaryView = document.getElementById('billingSummaryView');
const stockDetailsView = document.getElementById('stockDetailsView');

// Billing & Procedure Elements
const selectedPatientNameBadge = document.getElementById('selectedPatientName');
const procedureNotes = document.getElementById('procedureNotes');
const doctorFee = document.getElementById('doctorFee');
const procedureFee = document.getElementById('procedureFee');
const totalAmount = document.getElementById('totalAmount');
const saveBillingBtn = document.getElementById('saveBillingBtn');

// New Billing Summary Elements
const billingStartDate = document.getElementById('billingStartDate');
const billingEndDate = document.getElementById('billingEndDate');

// Stock Elements
const addPurchaseForm = document.getElementById('addPurchaseForm');
const purchaseItemName = document.getElementById('purchaseItemName');
const purchaseCategory = document.getElementById('purchaseCategory');
const purchaseQuantity = document.getElementById('purchaseQuantity');
const purchaseVendor = document.getElementById('purchaseVendor');
const purchaseDate = document.getElementById('purchaseDate');
const purchaseAmount = document.getElementById('purchaseAmount');
const purchasePaidAmount = document.getElementById('purchasePaidAmount');
const purchasePaymentOption = document.getElementById('purchasePaymentOption');
const purchaseDueDate = document.getElementById('purchaseDueDate');
const purchaseDueAmount = document.getElementById('purchaseDueAmount');
const purchasePaymentStatus = document.getElementById('purchasePaymentStatus');
const purchaseTableBody = document.getElementById('purchaseTableBody');
const stockTableBody = document.getElementById('stockTableBody');

// Initialize App
function init() {
    // Set default date filter to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    
    if (billingStartDate) billingStartDate.value = todayStr;
    if (billingEndDate) billingEndDate.value = todayStr;

    if (currentUser) {
        showApp();
    } else {
        showAuth();
    }
    
    // Listen for users
    db.collection('users').onSnapshot(snapshot => {
        users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
    }, error => {
        console.error("Error listening to users:", error);
    });

    // Listen for patients (real-time sync)
    db.collection('patients').orderBy('date', 'desc').onSnapshot(snapshot => {
        patients = [];
        snapshot.forEach(doc => {
            patients.push({ id: doc.id, ...doc.data() });
        });
        
        // Re-render UI based on new data
        renderPatientList(searchPatient.value);
        if(billingSummaryView.style.display === 'block') {
            renderBillingSummary();
        }
        if(selectedPatientId) {
            const p = patients.find(p => p.id === selectedPatientId);
            if(p && p.fees) {
                calculateTotal();
            }
        }
    }, error => {
        console.error("Error listening to patients:", error);
        // Check if it's an index error (though shouldn't be for this simple query unless multiple orderBys)
    });

    // Listen for stock items
    db.collection('stock').orderBy('name', 'asc').onSnapshot(snapshot => {
        stockItems = [];
        snapshot.forEach(doc => {
            stockItems.push({ id: doc.id, ...doc.data() });
        });
        if(stockDetailsView.style.display === 'block') {
            renderStockList();
        }
    }, error => {
        console.error("Error listening to stock:", error);
    });

    // Listen for purchases
    db.collection('purchases').orderBy('purchaseDate', 'desc').onSnapshot(snapshot => {
        purchases = [];
        snapshot.forEach(doc => {
            purchases.push({ id: doc.id, ...doc.data() });
        });
        if(stockDetailsView.style.display === 'block') {
            renderPurchaseList();
        }
    }, error => {
        console.error("Error listening to purchases:", error);
    });

    attachEventListeners();
}

// Event Listeners
function attachEventListeners() {
    if (billingStartDate) billingStartDate.addEventListener('change', renderBillingSummary);
    if (billingEndDate) billingEndDate.addEventListener('change', renderBillingSummary);
    
    // Auth Listeners
    authForm.addEventListener('submit', handleAuth);
    authToggleLink.addEventListener('click', toggleAuthMode);
    if(logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // App Listeners
    navRegistration.addEventListener('click', () => switchView('registration'));
    navDashboard.addEventListener('click', () => switchView('dashboard'));
    navBillingSummary.addEventListener('click', () => switchView('billing'));
    if(navStockDetails) navStockDetails.addEventListener('click', () => switchView('stock'));
    
    registrationForm.addEventListener('submit', handleRegistration);
    if(addPurchaseForm) addPurchaseForm.addEventListener('submit', handleAddPurchase);
    
    if(purchaseAmount) purchaseAmount.addEventListener('input', calculatePurchaseDue);
    if(purchasePaidAmount) purchasePaidAmount.addEventListener('input', calculatePurchaseDue);
    if(purchasePaymentOption) purchasePaymentOption.addEventListener('change', calculatePurchaseDue);
    
    // Fee Calculation Listeners
    [doctorFee, procedureFee].forEach(input => {
        input.addEventListener('input', calculateTotal);
    });

    saveBillingBtn.addEventListener('click', saveBillingAndProcedure);
    searchPatient.addEventListener('input', handleSearch);
    
    // Mobile Sidebar Listeners
    if(hamburgerBtn) hamburgerBtn.addEventListener('click', openSidebar);
    if(sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);
    if(sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
}

// --- Mobile Sidebar Logic ---
function openSidebar() {
    if(sidebar) sidebar.classList.add('open');
    if(sidebarOverlay) sidebarOverlay.classList.add('active');
}

function closeSidebar() {
    if(sidebar) sidebar.classList.remove('open');
    if(sidebarOverlay) sidebarOverlay.classList.remove('active');
}

// --- Auth Logic ---
function showAuth() {
    authContainer.style.display = 'flex';
    mainApp.style.display = 'none';
}

function showApp() {
    authContainer.style.display = 'none';
    mainApp.style.display = 'flex';
    
    // Role-based visibility: All logged in users can see everything
    navDashboard.style.display = 'flex';
    navBillingSummary.style.display = 'flex';
    if(navStockDetails) navStockDetails.style.display = 'flex';
}

function toggleAuthMode(e) {
    e.preventDefault();
    if (authMode === 'login') {
        authMode = 'signup';
        authSubmitBtn.textContent = 'Register';
        if(authSubtitle) authSubtitle.textContent = 'Create a new account to get started.';
        authToggleText.innerHTML = `Already have an account? <a href="#" id="authToggleLink">Sign In here</a>`;
    } else {
        authMode = 'login';
        authSubmitBtn.textContent = 'Sign In';
        if(authSubtitle) authSubtitle.textContent = 'Welcome! Please sign in to continue.';
        authToggleText.innerHTML = `Don't have an account? <a href="#" id="authToggleLink">Register here</a>`;
    }
    // Reattach listener
    document.getElementById('authToggleLink').addEventListener('click', toggleAuthMode);
}

async function handleAuth(e) {
    e.preventDefault();
    const username = authUsername.value.trim();
    const password = authPassword.value.trim();
    
    if (!username || !password) return;

    if (authMode === 'signup') {
        const userExists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (userExists) {
            alert('Username already exists!');
            return;
        }
        
        try {
            await db.collection('users').add({ username, password });
            showToast('Account created! Please sign in.', 'success');
            
            // Switch back to login mode automatically
            authMode = 'login';
            authSubmitBtn.textContent = 'Sign In';
            if(authSubtitle) authSubtitle.textContent = 'Welcome! Please sign in to continue.';
            authToggleText.innerHTML = `Don't have an account? <a href="#" id="authToggleLink">Register here</a>`;
            document.getElementById('authToggleLink').addEventListener('click', toggleAuthMode);
            authForm.reset();
        } catch (error) {
            console.error("Error creating user:", error);
            showToast("Failed to create account. Please try again.", "error");
        }
        
    } else {
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
        // Default bypass for prototype admin
        if (user || (username === 'admin' && password === 'admin')) {
            currentUser = username;
            localStorage.setItem('clinic_current_user', currentUser);
            authForm.reset();
            showToast('Logged in successfully!', 'success');
            showApp();
        } else {
            alert('Invalid credentials!');
        }
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('clinic_current_user');
    switchView('registration'); // Reset view for next login
    showAuth();
}

// --- App Logic ---

// Switch Views
function switchView(view) {
    if (view === 'registration') {
        registrationView.style.display = 'block';
        dashboardView.style.display = 'none';
        billingSummaryView.style.display = 'none';
        if(stockDetailsView) stockDetailsView.style.display = 'none';
        navRegistration.classList.add('active');
        navDashboard.classList.remove('active');
        navBillingSummary.classList.remove('active');
        if(navStockDetails) navStockDetails.classList.remove('active');
    } else if (view === 'dashboard') {
        registrationView.style.display = 'none';
        dashboardView.style.display = 'block';
        billingSummaryView.style.display = 'none';
        if(stockDetailsView) stockDetailsView.style.display = 'none';
        navRegistration.classList.remove('active');
        navDashboard.classList.add('active');
        navBillingSummary.classList.remove('active');
        if(navStockDetails) navStockDetails.classList.remove('active');
    } else if (view === 'billing') {
        registrationView.style.display = 'none';
        dashboardView.style.display = 'none';
        billingSummaryView.style.display = 'block';
        if(stockDetailsView) stockDetailsView.style.display = 'none';
        navRegistration.classList.remove('active');
        navDashboard.classList.remove('active');
        navBillingSummary.classList.add('active');
        if(navStockDetails) navStockDetails.classList.remove('active');
        renderBillingSummary();
    } else if (view === 'stock') {
        registrationView.style.display = 'none';
        dashboardView.style.display = 'none';
        billingSummaryView.style.display = 'none';
        if(stockDetailsView) stockDetailsView.style.display = 'block';
        navRegistration.classList.remove('active');
        navDashboard.classList.remove('active');
        navBillingSummary.classList.remove('active');
        if(navStockDetails) navStockDetails.classList.add('active');
        renderStockList();
        renderPurchaseList();
    }
    
    // Close sidebar automatically on mobile
    closeSidebar();
}

// Handle Patient Registration
async function handleRegistration(e) {
    e.preventDefault();
    
    const submitBtn = registrationForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    
    const name = document.getElementById('patientName').value.trim();
    const contact = document.getElementById('contactNumber').value.trim();
    const address = document.getElementById('address').value.trim();

    if(!name || !contact || !address) {
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    try {
        await db.collection('patients').add({
            name,
            contact,
            address,
            date: new Date().toISOString(),
            status: 'pending',
            procedure: '',
            fees: {
                doctor: 0,
                medicine: 0,
                procedure: 0,
                total: 0
            }
        });

        registrationForm.reset();
        showToast('Patient registered successfully!', 'success');
        
        // Auto-switch to dashboard after registration
        switchView('dashboard');
    } catch (error) {
        console.error("Error adding document: ", error);
        showToast('Error registering patient.', 'error');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// Render Patient List
function renderPatientList(searchTerm = '') {
    patientList.innerHTML = '';
    
    const phoneSearchTerm = searchTerm.replace(/\D/g, '');
    const filteredPatients = patients.filter(p => {
        const nameMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const phoneMatch = phoneSearchTerm && p.contact.replace(/\D/g, '').includes(phoneSearchTerm);
        const rawContactMatch = p.contact.toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || phoneMatch || rawContactMatch;
    });

    if (filteredPatients.length === 0) {
        patientList.innerHTML = '<div class="empty-state">No patients found.</div>';
        return;
    }

    filteredPatients.forEach(patient => {
        const item = document.createElement('div');
        item.className = `patient-item ${patient.id === selectedPatientId ? 'selected' : ''}`;
        item.onclick = () => selectPatient(patient.id);

        const statusClass = patient.status === 'completed' ? 'status-completed' : 'status-pending';
        const statusText = patient.status === 'completed' ? 'Treated' : 'Waiting';

        item.innerHTML = `
            <div class="patient-info">
                <h4>${patient.name}</h4>
                <p><i class="fa-solid fa-phone" style="font-size:0.75rem; margin-right:4px;"></i>${patient.contact}</p>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-trash" onclick="deletePatientById(event, '${patient.id}')" style="cursor: pointer; color: var(--danger-color, #dc3545);" title="Delete Patient"></i>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
        `;
        
        patientList.appendChild(item);
    });
}

// Select Patient
function selectPatient(id) {
    selectedPatientId = id;
    renderPatientList(searchPatient.value);
    
    const patient = patients.find(p => p.id === id);
    if (!patient) return;

    selectedPatientNameBadge.textContent = patient.name;
    selectedPatientNameBadge.style.color = 'var(--primary-color)';
    selectedPatientNameBadge.style.borderColor = 'var(--primary-color)';
    
    procedureNotes.disabled = false;
    doctorFee.disabled = false;
    procedureFee.disabled = false;
    saveBillingBtn.disabled = false;

    procedureNotes.value = patient.procedure || '';
    doctorFee.value = patient.fees.doctor || 0;
    procedureFee.value = patient.fees.procedure || 0;
    
    calculateTotal();
}

// Calculate Total Fees
function calculateTotal() {
    const doc = parseFloat(doctorFee.value) || 0;
    const proc = parseFloat(procedureFee.value) || 0;
    
    const total = doc + proc;
    totalAmount.textContent = `₹${total.toFixed(2)}`;
}

// Save Billing and Procedure
async function saveBillingAndProcedure() {
    if (!selectedPatientId) return;

    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    const docFee = parseFloat(doctorFee.value) || 0;
    const procFee = parseFloat(procedureFee.value) || 0;
    const medFee = patient.fees.medicine || 0;
    const total = docFee + procFee + medFee;

    try {
        await db.collection('patients').doc(selectedPatientId).update({
            status: 'completed',
            procedure: procedureNotes.value,
            fees: {
                doctor: docFee,
                medicine: medFee,
                procedure: procFee,
                total: total
            }
        });

        showToast('Procedure and billing updated successfully!', 'success');
        switchView('billing');
    } catch (error) {
        console.error("Error updating billing: ", error);
        showToast('Error saving billing info.', 'error');
    }
}

// Delete Patient By ID (from list)
async function deletePatientById(event, id) {
    event.stopPropagation(); // Prevent row selection
    
    const confirmDelete = confirm("Are you sure you want to delete this patient?");
    if (!confirmDelete) return;

    try {
        await db.collection('patients').doc(id).delete();
        showToast('Patient deleted successfully!', 'success');
        
        // If the deleted patient was currently selected, reset dashboard
        if (selectedPatientId === id) {
            selectedPatientId = null;
            selectedPatientNameBadge.textContent = "No patient selected";
            selectedPatientNameBadge.style.color = "";
            selectedPatientNameBadge.style.borderColor = "";
            
            procedureNotes.value = "";
            doctorFee.value = 0;
            procedureFee.value = 0;
            totalAmount.textContent = "₹0.00";
            
            procedureNotes.disabled = true;
            doctorFee.disabled = true;
            procedureFee.disabled = true;
            saveBillingBtn.disabled = true;
        }
    } catch (error) {
        console.error("Error deleting document: ", error);
        showToast('Error deleting patient.', 'error');
    }
}

// Render Billing Summary Table
function renderBillingSummary() {
    const billingTableBody = document.getElementById('billingTableBody');
    const totalRevenue = document.getElementById('totalRevenue');
    const startDateValue = billingStartDate ? billingStartDate.value : '';
    const endDateValue = billingEndDate ? billingEndDate.value : '';
    
    let billedPatients = patients.filter(p => p.status === 'completed');
    
    // Filter by selected date range
    if (startDateValue || endDateValue) {
        billedPatients = billedPatients.filter(p => {
            const pDate = new Date(p.date);
            const pDateStr = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}-${String(pDate.getDate()).padStart(2, '0')}`;
            
            let include = true;
            if (startDateValue && pDateStr < startDateValue) include = false;
            if (endDateValue && pDateStr > endDateValue) include = false;
            return include;
        });
    }
    
    if (billedPatients.length === 0) {
        let dateMsg = 'the selected date range';
        if (startDateValue === endDateValue && startDateValue) dateMsg = new Date(startDateValue).toLocaleDateString('en-IN');
        billingTableBody.innerHTML = `<tr><td colspan="9" class="empty-state">No bills generated for ${dateMsg}.</td></tr>`;
        if(totalRevenue) totalRevenue.textContent = 'Total: \u20b90.00';
        return;
    }

    let grandTotal = 0;
    let consultationTotal = 0;
    let medicineTotal = 0;
    let procedureTotal = 0;
    billingTableBody.innerHTML = '';
    
    billedPatients.forEach((patient, index) => {
        grandTotal += patient.fees.total;
        consultationTotal += patient.fees.doctor || 0;
        medicineTotal += (parseFloat(patient.fees.medicine) || 0);
        procedureTotal += patient.fees.procedure || 0;
        const patientDate = new Date(patient.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${patientDate}</td>
            <td><strong>${patient.name}</strong></td>
            <td>${patient.contact}</td>
            <td>${patient.procedure || '-'}</td>
            <td>\u20b9${(patient.fees.doctor || 0).toFixed(2)}</td>
            <td>
                <input type="number" class="billing-editable-input" value="${(patient.fees.medicine || 0).toFixed(2)}" min="0" step="0.01" onchange="updateMedicineFee('${patient.id}', this.value)">
            </td>
            <td>\u20b9${(patient.fees.procedure || 0).toFixed(2)}</td>
            <td class="total-cell">\u20b9${(patient.fees.total || 0).toFixed(2)}</td>
        `;
        billingTableBody.appendChild(row);
    });

    // Append a footer row for totals
    const totalRow = document.createElement('tr');
    totalRow.style.fontWeight = 'bold';
    totalRow.style.backgroundColor = 'rgba(13, 148, 136, 0.1)'; // faint primary color
    totalRow.innerHTML = `
        <td colspan="5" style="text-align: right;">Grand Total:</td>
        <td style="color: var(--primary-color);">\u20b9${consultationTotal.toFixed(2)}</td>
        <td style="color: var(--primary-color);">\u20b9${medicineTotal.toFixed(2)}</td>
        <td style="color: var(--primary-color);">\u20b9${procedureTotal.toFixed(2)}</td>
        <td class="total-cell" style="color: var(--primary-color);">\u20b9${grandTotal.toFixed(2)}</td>
    `;
    billingTableBody.appendChild(totalRow);

    if(totalRevenue) {
        totalRevenue.textContent = `Total: \u20b9${grandTotal.toFixed(2)}`;
        totalRevenue.style.color = 'var(--primary-color)';
        totalRevenue.style.borderColor = 'var(--primary-color)';
        totalRevenue.style.fontWeight = '700';
    }
}

// --- Stock & Purchase Logic ---
async function handleAddPurchase(e) {
    e.preventDefault();
    const submitBtn = addPurchaseForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const itemName = purchaseItemName.value.trim();
    const category = purchaseCategory.value;
    const quantity = parseInt(purchaseQuantity.value) || 0;
    const vendor = purchaseVendor.value.trim();
    const pDate = purchaseDate.value;
    const amount = parseFloat(purchaseAmount.value) || 0;
    const paid = parseFloat(purchasePaidAmount.value) || 0;
    let pOption = purchasePaymentOption.value;
    const dDate = purchaseDueDate.value;

    if (!itemName || !category || !vendor || !pDate) {
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    const dueAmount = amount - paid;
    
    let paymentStatus = 'Not Paid';
    if (pOption === 'GPay' || pOption === 'Cash') {
        paymentStatus = 'Paid';
    } else {
        paymentStatus = 'Not Paid';
        pOption = '-';
    }

    try {
        // 1. Add to Purchase History
        await db.collection('purchases').add({
            itemName,
            category,
            quantity,
            vendorName: vendor,
            purchaseDate: pDate,
            purchaseAmount: amount,
            paidAmount: paid,
            paymentOption: pOption,
            dueDate: dDate,
            dueAmount,
            paymentStatus,
            createdAt: new Date().toISOString()
        });

        // 2. Increment Stock Inventory
        // Check if item already exists in stock
        const stockRef = db.collection('stock');
        const querySnapshot = await stockRef.where('name', '==', itemName).where('category', '==', category).get();
        
        if (!querySnapshot.empty) {
            // Update existing stock
            const stockDoc = querySnapshot.docs[0];
            const currentQty = stockDoc.data().quantity || 0;
            await stockRef.doc(stockDoc.id).update({
                quantity: currentQty + quantity
            });
        } else {
            // Create new stock entry
            await stockRef.add({
                name: itemName,
                category: category,
                quantity: quantity
            });
        }

        addPurchaseForm.reset();
        if(purchaseDueAmount) purchaseDueAmount.value = '0.00';
        if(purchasePaymentStatus) {
            purchasePaymentStatus.value = 'Not Paid';
            purchasePaymentStatus.style.color = 'var(--danger-color)';
        }
        showToast('Purchase logged and stock updated!', 'success');
    } catch (error) {
        console.error("Error adding purchase: ", error);
        showToast('Error logging purchase.', 'error');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

function renderPurchaseList() {
    if (!purchaseTableBody) return;
    
    if (purchases.length === 0) {
        purchaseTableBody.innerHTML = '<tr><td colspan="12" class="empty-state">No purchases found.</td></tr>';
        return;
    }

    purchaseTableBody.innerHTML = '';
    purchases.forEach(p => {
        const row = document.createElement('tr');
        
        const dueAmtHtml = p.dueAmount > 0 
            ? `<strong style="color: var(--danger-color);">₹${p.dueAmount.toFixed(2)}</strong>`
            : `-`;
        const dueDateHtml = p.dueDate ? p.dueDate : `-`;
            
        const statusBadge = p.paymentStatus === 'Paid' 
            ? `<span class="badge bg-success">Paid</span>` 
            : `<span class="badge bg-danger">Not Paid</span>`;

        row.innerHTML = `
            <td style="white-space: nowrap;">${new Date(p.purchaseDate).toLocaleDateString('en-IN')}</td>
            <td style="white-space: nowrap;"><strong>${p.vendorName}</strong></td>
            <td style="white-space: nowrap;"><strong>${p.itemName}</strong></td>
            <td style="white-space: nowrap;"><span class="badge bg-secondary" style="font-size: 0.7rem;">${p.category}</span></td>
            <td style="white-space: nowrap;">${p.quantity}</td>
            <td style="white-space: nowrap;">₹${p.purchaseAmount.toFixed(2)}</td>
            <td style="white-space: nowrap;">₹${p.paidAmount.toFixed(2)}</td>
            <td style="white-space: nowrap;">${dueAmtHtml}</td>
            <td style="white-space: nowrap;">${dueDateHtml}</td>
            <td style="white-space: nowrap;">${p.paymentOption}</td>
            <td style="white-space: nowrap;">${statusBadge}</td>
            <td style="text-align: center;">
                <i class="fa-solid fa-trash" onclick="deletePurchase('${p.id}')" style="cursor: pointer; color: var(--danger-color);" title="Delete Purchase"></i>
            </td>
        `;
        purchaseTableBody.appendChild(row);
    });
}

function renderStockList() {
    if (!stockTableBody) return;
    
    if (stockItems.length === 0) {
        stockTableBody.innerHTML = '<tr><td colspan="4" class="empty-state">No items in inventory. Add a purchase first.</td></tr>';
        return;
    }

    stockTableBody.innerHTML = '';
    stockItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td><span class="badge bg-secondary">${item.category}</span></td>
            <td style="text-align: right; font-size: 1.1rem; font-weight: 600; color: var(--primary-color);">
                ${item.quantity}
            </td>
            <td style="text-align: center;">
                <i class="fa-solid fa-trash" onclick="deleteStockItem('${item.id}')" style="cursor: pointer; color: var(--danger-color);" title="Delete Inventory Item"></i>
            </td>
        `;
        stockTableBody.appendChild(row);
    });
}

function calculatePurchaseDue() {
    const amt = parseFloat(purchaseAmount.value) || 0;
    const paid = parseFloat(purchasePaidAmount.value) || 0;
    const due = amt - paid;
    if (purchaseDueAmount) {
        purchaseDueAmount.value = due > 0 ? due.toFixed(2) : '0.00';
    }
    
    if (purchasePaymentStatus && purchasePaymentOption) {
        const mode = purchasePaymentOption.value;
        if (mode === 'GPay' || mode === 'Cash') {
            purchasePaymentStatus.value = 'Paid';
            purchasePaymentStatus.style.color = 'var(--success-color, #198754)';
        } else {
            purchasePaymentStatus.value = 'Not Paid';
            purchasePaymentStatus.style.color = 'var(--danger-color)';
        }
    }
}

window.deletePurchase = async function(id) {
    if (!confirm("Are you sure you want to delete this purchase record? (This will NOT deduct from current stock quantity)")) return;
    try {
        await db.collection('purchases').doc(id).delete();
        showToast('Purchase deleted', 'success');
    } catch (error) {
        console.error("Error deleting purchase: ", error);
        showToast('Error deleting purchase', 'error');
    }
};

window.deleteStockItem = async function(id) {
    if (!confirm("Are you sure you want to completely delete this item from the inventory list?")) return;
    try {
        await db.collection('stock').doc(id).delete();
        showToast('Inventory item deleted', 'success');
    } catch (error) {
        console.error("Error deleting stock item: ", error);
        showToast('Error deleting inventory item', 'error');
    }
};

// Update Medicine Fee directly from table
window.updateMedicineFee = async function(patientId, newValue) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const med = parseFloat(newValue) || 0;
    const total = patient.fees.doctor + patient.fees.procedure + med;

    try {
        await db.collection('patients').doc(patientId).update({
            'fees.medicine': med,
            'fees.total': total
        });
        showToast('Medicine fee updated successfully', 'success');
    } catch (error) {
        console.error("Error updating medicine fee: ", error);
        showToast('Error updating medicine fee', 'error');
    }
};

// Search and Dropdown Logic
function handleSearch(e) {
    const term = e.target.value.toLowerCase().trim();
    
    renderPatientList(term);

    if (term.length === 0) {
        searchResults.style.display = 'none';
        return;
    }

    const phoneTerm = term.replace(/\D/g, '');
    const filtered = patients.filter(p => {
        const nameMatch = p.name.toLowerCase().includes(term);
        const phoneMatch = phoneTerm && p.contact.replace(/\D/g, '').includes(phoneTerm);
        const rawContactMatch = p.contact.toLowerCase().includes(term);
        return nameMatch || phoneMatch || rawContactMatch;
    });

    if (filtered.length === 0) {
        searchResults.innerHTML = '<div class="p-3 text-muted" style="text-align:center;">No patients found.</div>';
        searchResults.style.display = 'block';
        return;
    }

    searchResults.innerHTML = '';
    filtered.forEach(patient => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `
            <div>
                <strong style="color: var(--text-main);">${patient.name}</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted);"><i class="fa-solid fa-phone" style="font-size:0.75rem; margin-right:4px;"></i>${patient.contact}</div>
            </div>
            <span class="badge ${patient.status === 'completed' ? 'bg-success' : 'bg-warning'}">${patient.status === 'completed' ? 'Treated' : 'Waiting'}</span>
        `;
        div.onclick = () => {
            selectPatient(patient.id);
            searchPatient.value = '';
            searchResults.style.display = 'none';
            renderPatientList('');
            
            switchView('dashboard');
        };
        searchResults.appendChild(div);
    });
    searchResults.style.display = 'block';
}

document.addEventListener('click', (e) => {
    if (searchResults && !e.target.closest('.search-bar')) {
        searchResults.style.display = 'none';
    }
});

// Toast Notification
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Boot up
document.addEventListener('DOMContentLoaded', init);
