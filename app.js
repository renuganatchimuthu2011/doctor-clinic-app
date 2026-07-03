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
let purchases = [];
let currentUser = localStorage.getItem('clinic_current_user');
let selectedPatientId = null;
let authMode = 'login'; // 'login' or 'signup'
let currentPharmacyItems = [];
let currentPharmacyBillNumber = "PH-0001";
let pharmacyBillsList = [];
let pharmacyBillsUnsubscribe = null;

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
const patientListDateFilter = document.getElementById('patientListDateFilter');
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
const navPharmacyBilling = document.getElementById('navPharmacyBilling');
const registrationView = document.getElementById('registrationView');
const dashboardView = document.getElementById('dashboardView');
const billingSummaryView = document.getElementById('billingSummaryView');
const stockDetailsView = document.getElementById('stockDetailsView');
const pharmacyBillingView = document.getElementById('pharmacyBillingView');

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

// Stock Billing Summary Elements
const stockBillingStartDate = document.getElementById('stockBillingStartDate');
const stockBillingEndDate = document.getElementById('stockBillingEndDate');
const stockReportTypePicker = document.getElementById('stockReportTypePicker');
const stockReportMonthPicker = document.getElementById('stockReportMonthPicker');
const stockReportWeekPicker = document.getElementById('stockReportWeekPicker');
const stockReportYearPicker = document.getElementById('stockReportYearPicker');

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

// Pharmacy Billing Elements
const pharmacyBillNumber = document.getElementById('pharmacyBillNumber');
const pharmacyPatientName = document.getElementById('pharmacyPatientName');
const pharmacyBillDate = document.getElementById('pharmacyBillDate');
const addMedicineForm = document.getElementById('addMedicineForm');
const medName = document.getElementById('medName');
const medQty = document.getElementById('medQty');
const medPrice = document.getElementById('medPrice');
const pharmacyItemsTableBody = document.getElementById('pharmacyItemsTableBody');
const pharmacyGrandTotal = document.getElementById('pharmacyGrandTotal');
const newPharmacyBillBtn = document.getElementById('newPharmacyBillBtn');
const savePharmacyBillBtn = document.getElementById('savePharmacyBillBtn');
const printPharmacyBillBtn = document.getElementById('printPharmacyBillBtn');
const pharmacyHistoryTableBody = document.getElementById('pharmacyHistoryTableBody');
const pharmacyHistoryDateFilter = document.getElementById('pharmacyHistoryDateFilter');
const pharmacyHistoryGrandTotal = document.getElementById('pharmacyHistoryGrandTotal');

// Print Elements
const printBillNo = document.getElementById('printBillNo');
const printBillDate = document.getElementById('printBillDate');
const printPatientName = document.getElementById('printPatientName');
const printTableBody = document.getElementById('printTableBody');
const printGrandTotal = document.getElementById('printGrandTotal');

if(purchaseAmount) purchaseAmount.addEventListener('input', calculatePurchaseDue);
if(purchasePaidAmount) purchasePaidAmount.addEventListener('input', calculatePurchaseDue);
if(purchasePaymentOption) purchasePaymentOption.addEventListener('change', calculatePurchaseDue);

// Initialize App
function init() {
    // Set default date filter to today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if(billingStartDate) billingStartDate.value = todayStr;
    if(billingEndDate) billingEndDate.value = todayStr;
    if(stockBillingStartDate) stockBillingStartDate.value = todayStr;
    if(stockBillingEndDate) stockBillingEndDate.value = todayStr;
    if(pharmacyBillDate) pharmacyBillDate.value = todayStr;
    
    if(pharmacyHistoryDateFilter) {
        pharmacyHistoryDateFilter.value = todayStr;
        pharmacyHistoryDateFilter.addEventListener('change', (e) => fetchPharmacyBillsByDate(e.target.value));
        
        // Fetch the initial history for today
        fetchPharmacyBillsByDate(todayStr);
    }
    
    const reportTypePicker = document.getElementById('reportTypePicker');
    const reportMonthPicker = document.getElementById('reportMonthPicker');
    const reportWeekPicker = document.getElementById('reportWeekPicker');
    const reportYearPicker = document.getElementById('reportYearPicker');

    if(reportTypePicker) {
        reportTypePicker.addEventListener('change', () => {
            if(reportMonthPicker) reportMonthPicker.style.display = 'none';
            if(reportWeekPicker) reportWeekPicker.style.display = 'none';
            if(reportYearPicker) reportYearPicker.style.display = 'none';
            
            if (reportTypePicker.value === 'monthly') {
                if(reportMonthPicker) reportMonthPicker.style.display = 'inline-block';
            } else if (reportTypePicker.value === 'weekly') {
                if(reportWeekPicker) reportWeekPicker.style.display = 'inline-block';
            } else if (reportTypePicker.value === 'yearly') {
                if(reportYearPicker) reportYearPicker.style.display = 'inline-block';
            }
            updateTableFromReportPicker();
        });
    }

    if(reportMonthPicker) {
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        reportMonthPicker.value = `${today.getFullYear()}-${mm}`;
        reportMonthPicker.addEventListener('change', updateTableFromReportPicker);
    }
    if(reportYearPicker) {
        reportYearPicker.value = today.getFullYear();
        reportYearPicker.addEventListener('change', updateTableFromReportPicker);
    }
    if(reportWeekPicker) {
        const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
        reportWeekPicker.value = `${today.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
        reportWeekPicker.addEventListener('change', updateTableFromReportPicker);
    }

    if(stockReportTypePicker) {
        stockReportTypePicker.addEventListener('change', () => {
            if(stockReportMonthPicker) stockReportMonthPicker.style.display = 'none';
            if(stockReportWeekPicker) stockReportWeekPicker.style.display = 'none';
            if(stockReportYearPicker) stockReportYearPicker.style.display = 'none';
            
            if (stockReportTypePicker.value === 'monthly') {
                if(stockReportMonthPicker) stockReportMonthPicker.style.display = 'inline-block';
            } else if (stockReportTypePicker.value === 'weekly') {
                if(stockReportWeekPicker) stockReportWeekPicker.style.display = 'inline-block';
            } else if (stockReportTypePicker.value === 'yearly') {
                if(stockReportYearPicker) stockReportYearPicker.style.display = 'inline-block';
            }
            updateStockTableFromReportPicker();
        });
    }

    if(stockReportMonthPicker) {
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        stockReportMonthPicker.value = `${today.getFullYear()}-${mm}`;
        stockReportMonthPicker.addEventListener('change', updateStockTableFromReportPicker);
    }
    if(stockReportYearPicker) {
        stockReportYearPicker.value = today.getFullYear();
        stockReportYearPicker.addEventListener('change', updateStockTableFromReportPicker);
    }
    if(stockReportWeekPicker) {
        const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
        stockReportWeekPicker.value = `${today.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
        stockReportWeekPicker.addEventListener('change', updateStockTableFromReportPicker);
    }

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
        if(billingSummaryView && billingSummaryView.style.display === 'block') {
            renderBillingSummary();
            renderStockBillingSummary();
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

    // Listen for purchases
    db.collection('purchases').orderBy('purchaseDate', 'desc').onSnapshot(snapshot => {
        purchases = [];
        snapshot.forEach(doc => {
            purchases.push({ id: doc.id, ...doc.data() });
        });
        if(stockDetailsView.style.display === 'block') {
            renderPurchaseList();
        }
        if(billingSummaryView.style.display === 'block') {
            renderStockBillingSummary();
            renderBillingSummary();
        }
    }, error => {
        console.error("Error listening to purchases:", error);
    });

    // Listen for pharmacy bills for today initially
    fetchPharmacyBillsByDate(todayStr);

    attachEventListeners();
}

// Event Listeners
function attachEventListeners() {
    if (billingStartDate) billingStartDate.addEventListener('change', renderBillingSummary);
    if (billingEndDate) billingEndDate.addEventListener('change', renderBillingSummary);
    if (stockBillingStartDate) stockBillingStartDate.addEventListener('change', renderStockBillingSummary);
    if (stockBillingEndDate) stockBillingEndDate.addEventListener('change', renderStockBillingSummary);
    
    // Auth Listeners
    authForm.addEventListener('submit', handleAuth);
    authToggleLink.addEventListener('click', toggleAuthMode);
    if(logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // App Listeners
    navRegistration.addEventListener('click', () => switchView('registration'));
    navDashboard.addEventListener('click', () => switchView('dashboard'));
    navBillingSummary.addEventListener('click', () => switchView('billing'));
    if(navStockDetails) navStockDetails.addEventListener('click', () => switchView('stock'));
    if(navPharmacyBilling) navPharmacyBilling.addEventListener('click', () => { switchView('pharmacy'); generateNextPharmacyBillNumber(); });
    
    registrationForm.addEventListener('submit', handleRegistration);
    if(addPurchaseForm) addPurchaseForm.addEventListener('submit', handleAddPurchase);
    
    if(addMedicineForm) addMedicineForm.addEventListener('submit', handleAddMedicine);
    if(newPharmacyBillBtn) newPharmacyBillBtn.addEventListener('click', newPharmacyBill);
    if(savePharmacyBillBtn) savePharmacyBillBtn.addEventListener('click', savePharmacyBill);
    if(printPharmacyBillBtn) printPharmacyBillBtn.addEventListener('click', printPharmacyBill);
    
    if(purchaseAmount) purchaseAmount.addEventListener('input', calculatePurchaseDue);
    if(purchasePaidAmount) purchasePaidAmount.addEventListener('input', calculatePurchaseDue);
    if(purchasePaymentOption) purchasePaymentOption.addEventListener('change', calculatePurchaseDue);
    
    // Fee Calculation Listeners
    [doctorFee, procedureFee].forEach(input => {
        input.addEventListener('input', calculateTotal);
    });

    saveBillingBtn.addEventListener('click', saveBillingAndProcedure);
    searchPatient.addEventListener('input', handleSearch);
    
    if (patientListDateFilter) {
        const d = new Date();
        const defaultDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        patientListDateFilter.value = defaultDate;
        patientListDateFilter.addEventListener('change', () => {
            renderPatientList(searchPatient.value);
        });
    }

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
        if(pharmacyBillingView) pharmacyBillingView.style.display = 'none';
        navRegistration.classList.add('active');
        navDashboard.classList.remove('active');
        navBillingSummary.classList.remove('active');
        if(navStockDetails) navStockDetails.classList.remove('active');
        if(navPharmacyBilling) navPharmacyBilling.classList.remove('active');
    } else if (view === 'dashboard') {
        registrationView.style.display = 'none';
        dashboardView.style.display = 'block';
        billingSummaryView.style.display = 'none';
        if(stockDetailsView) stockDetailsView.style.display = 'none';
        if(pharmacyBillingView) pharmacyBillingView.style.display = 'none';
        navRegistration.classList.remove('active');
        navDashboard.classList.add('active');
        navBillingSummary.classList.remove('active');
        if(navStockDetails) navStockDetails.classList.remove('active');
        if(navPharmacyBilling) navPharmacyBilling.classList.remove('active');
    } else if (view === 'billing') {
        registrationView.style.display = 'none';
        dashboardView.style.display = 'none';
        billingSummaryView.style.display = 'block';
        if(stockDetailsView) stockDetailsView.style.display = 'none';
        if(pharmacyBillingView) pharmacyBillingView.style.display = 'none';
        navRegistration.classList.remove('active');
        navDashboard.classList.remove('active');
        navBillingSummary.classList.add('active');
        if(navStockDetails) navStockDetails.classList.remove('active');
        if(navPharmacyBilling) navPharmacyBilling.classList.remove('active');
        renderBillingSummary();
        renderStockBillingSummary();
    } else if (view === 'stock') {
        registrationView.style.display = 'none';
        dashboardView.style.display = 'none';
        billingSummaryView.style.display = 'none';
        if(stockDetailsView) stockDetailsView.style.display = 'block';
        if(pharmacyBillingView) pharmacyBillingView.style.display = 'none';
        navRegistration.classList.remove('active');
        navDashboard.classList.remove('active');
        navBillingSummary.classList.remove('active');
        if(navStockDetails) navStockDetails.classList.add('active');
        if(navPharmacyBilling) navPharmacyBilling.classList.remove('active');
        renderPurchaseList();
    } else if (view === 'pharmacy') {
        registrationView.style.display = 'none';
        dashboardView.style.display = 'none';
        billingSummaryView.style.display = 'none';
        if(stockDetailsView) stockDetailsView.style.display = 'none';
        if(pharmacyBillingView) pharmacyBillingView.style.display = 'block';
        navRegistration.classList.remove('active');
        navDashboard.classList.remove('active');
        navBillingSummary.classList.remove('active');
        if(navStockDetails) navStockDetails.classList.remove('active');
        if(navPharmacyBilling) navPharmacyBilling.classList.add('active');
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
    const dateInput = document.getElementById('registrationDate').value;

    if(!name || !contact || !address || !dateInput) {
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    if (contact.length !== 10 || !/^\d{10}$/.test(contact)) {
        showToast('Contact number must be exactly 10 digits.', 'error');
        if (submitBtn) submitBtn.disabled = false;
        return;
    }

    let finalDate = new Date().toISOString();
    if (dateInput) {
        const d = new Date(dateInput);
        const now = new Date();
        d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        finalDate = d.toISOString();
    }

    try {
        await db.collection('patients').add({
            name,
            contact,
            address,
            date: finalDate,
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
    const selectedDate = patientListDateFilter ? patientListDateFilter.value : '';

    const filteredPatients = patients.filter(p => {
        const nameMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const phoneMatch = phoneSearchTerm && p.contact.replace(/\D/g, '').includes(phoneSearchTerm);
        const rawContactMatch = p.contact.toLowerCase().includes(searchTerm.toLowerCase());
        const searchMatch = nameMatch || phoneMatch || rawContactMatch;

        if (selectedDate) {
            const pDate = new Date(p.date);
            const pDateStr = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}-${String(pDate.getDate()).padStart(2, '0')}`;
            if (pDateStr !== selectedDate) {
                return false;
            }
        }

        return searchMatch;
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
                <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                    <p style="margin: 0;"><i class="fa-solid fa-phone" style="font-size:0.75rem; margin-right:4px;"></i>${patient.contact}</p>
                    <p style="margin: 0;"><i class="fa-solid fa-calendar-day" style="font-size:0.75rem; margin-right:4px;"></i>${new Date(patient.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
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
        if(totalRevenue) totalRevenue.textContent = 'Total Income: \u20b90.00';
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

    // Calculate Drug Purchases for the same period
    let totalPurchases = 0;
    let filteredPurchases = purchases;
    if (startDateValue || endDateValue) {
        filteredPurchases = purchases.filter(p => {
            const pDateStr = p.purchaseDate;
            let include = true;
            if (startDateValue && pDateStr < startDateValue) include = false;
            if (endDateValue && pDateStr > endDateValue) include = false;
            return include;
        });
    }
    
    filteredPurchases.forEach(p => {
        totalPurchases += (parseFloat(p.purchaseAmount) || 0);
    });

    const netIncome = grandTotal - totalPurchases;

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
        totalRevenue.textContent = `Total Income: \u20b9${grandTotal.toFixed(2)}`;
        totalRevenue.style.color = 'var(--primary-color)';
        totalRevenue.style.borderColor = 'var(--primary-color)';
        totalRevenue.style.fontWeight = '700';
    }
}

function renderStockBillingSummary() {
    const stockBillingTableBody = document.getElementById('stockBillingTableBody');
    if (!stockBillingTableBody) return;

    const startDateValue = stockBillingStartDate ? stockBillingStartDate.value : '';
    const endDateValue = stockBillingEndDate ? stockBillingEndDate.value : '';

    let filteredPurchases = purchases;
    if (startDateValue || endDateValue) {
        filteredPurchases = purchases.filter(p => {
            const pDateStr = p.purchaseDate;
            let include = true;
            if (startDateValue && pDateStr < startDateValue) include = false;
            if (endDateValue && pDateStr > endDateValue) include = false;
            return include;
        });
    }

    let sumDrugPurchases = 0;
    let sumDueAmount = 0;

    if (filteredPurchases.length === 0) {
        let dateMsg = 'the selected date range';
        if (startDateValue === endDateValue && startDateValue) dateMsg = new Date(startDateValue).toLocaleDateString('en-IN');
        stockBillingTableBody.innerHTML = `<tr><td colspan="5" class="empty-state">No stock bills generated for ${dateMsg}.</td></tr>`;
    } else {
        stockBillingTableBody.innerHTML = '';
        filteredPurchases.forEach((p, index) => {
            const purchasedAmount = parseFloat(p.purchaseAmount) || 0;
            const dueAmount = parseFloat(p.dueAmount) || 0;
            sumDrugPurchases += purchasedAmount;
            sumDueAmount += dueAmount;

            const pDate = new Date(p.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${pDate}</td>
                <td>\u20b9${purchasedAmount.toFixed(2)}</td>
                <td><span style="color: ${dueAmount > 0 ? 'var(--danger-color)' : 'inherit'};">\u20b9${dueAmount.toFixed(2)}</span></td>
            `;
            stockBillingTableBody.appendChild(row);
        });
    }

    // We also need to calculate total patient income for this same period to show Net Income
    let billedPatients = patients.filter(p => p.status === 'completed');
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
    let grandTotal = 0;
    billedPatients.forEach(p => { grandTotal += (p.fees.total || 0); });
    
    const netIncome = grandTotal - sumDrugPurchases;

    // Grand Total Footer only if there are purchases
    if (filteredPurchases.length > 0) {
        const totalStockRow = document.createElement('tr');
        totalStockRow.style.fontWeight = 'bold';
        totalStockRow.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
        totalStockRow.innerHTML = `
            <td colspan="2" style="text-align: right;">Grand Total:</td>
            <td style="color: var(--danger-color);">\u20b9${sumDrugPurchases.toFixed(2)}</td>
            <td style="color: var(--danger-color);">\u20b9${sumDueAmount.toFixed(2)}</td>
        `;
        stockBillingTableBody.appendChild(totalStockRow);
    }

    const stockNetIncomeBadge = document.getElementById('stockNetIncomeBadge');
    if (stockNetIncomeBadge) {
        stockNetIncomeBadge.textContent = `Net Income: \u20b9${netIncome.toFixed(2)}`;
        if (netIncome >= 0) {
            stockNetIncomeBadge.style.color = 'var(--primary-color)';
            stockNetIncomeBadge.style.borderColor = 'var(--primary-color)';
        } else {
            stockNetIncomeBadge.style.color = 'var(--danger-color)';
            stockNetIncomeBadge.style.borderColor = 'var(--danger-color)';
        }
        stockNetIncomeBadge.style.fontWeight = '700';
    }
}

function updateTableFromReportPicker() {
    const typePicker = document.getElementById('reportTypePicker');
    if (!typePicker) return;
    const type = typePicker.value;
    let start = '';
    let end = '';
    
    if (type === 'monthly') {
        const val = document.getElementById('reportMonthPicker')?.value;
        if (val) {
            const [y, m] = val.split('-');
            const lastDay = new Date(y, m, 0);
            start = `${y}-${m}-01`;
            end = `${y}-${m}-${String(lastDay.getDate()).padStart(2, '0')}`;
        }
    } else if (type === 'yearly') {
        const val = document.getElementById('reportYearPicker')?.value;
        if (val) {
            start = `${val}-01-01`;
            end = `${val}-12-31`;
        }
    } else if (type === 'weekly') {
        const val = document.getElementById('reportWeekPicker')?.value;
        if (val) {
            const y = parseInt(val.substring(0, 4));
            const w = parseInt(val.substring(6, 8));
            
            const d = new Date(y, 0, 4); 
            const dayNum = d.getDay() || 7;
            d.setDate(d.getDate() - dayNum + 1 + (w - 1) * 7);
            
            const startStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            start = startStr;
            
            const endD = new Date(d);
            endD.setDate(d.getDate() + 6);
            end = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`;
        }
    }
    
    if (start && end) {
        if (billingStartDate) billingStartDate.value = start;
        if (billingEndDate) billingEndDate.value = end;
        renderBillingSummary();
    }
}

// Attach listeners to report pickers
document.getElementById('reportMonthPicker')?.addEventListener('change', updateTableFromReportPicker);
document.getElementById('reportYearPicker')?.addEventListener('change', updateTableFromReportPicker);
document.getElementById('reportWeekPicker')?.addEventListener('change', updateTableFromReportPicker);

window.downloadReport = function() {
    const typePicker = document.getElementById('reportTypePicker');
    const type = typePicker ? typePicker.value : 'monthly';
    
    let selectedValue = '';
    let periodName = '';
    
    if (type === 'monthly') {
        const picker = document.getElementById('reportMonthPicker');
        if (!picker || !picker.value) return alert("Please select a month.");
        selectedValue = picker.value;
        periodName = `Month: ${selectedValue}`;
    } else if (type === 'weekly') {
        const picker = document.getElementById('reportWeekPicker');
        if (!picker || !picker.value) return alert("Please select a week.");
        selectedValue = picker.value;
        periodName = `Week: ${selectedValue}`;
    } else if (type === 'yearly') {
        const picker = document.getElementById('reportYearPicker');
        if (!picker || !picker.value) return alert("Please select a year.");
        selectedValue = picker.value;
        periodName = `Year: ${selectedValue}`;
    }

    let totalPatients = 0;
    let consultationFees = 0;
    let medicineFees = 0;
    let procedureFees = 0;
    let totalIncome = 0;

    patients.filter(p => p.status === 'completed').forEach(p => {
        if (!p.date) return;
        
        let matches = false;
        if (type === 'monthly') {
            const billMonth = p.date.substring(0, 7);
            matches = (billMonth === selectedValue);
        } else if (type === 'yearly') {
            const billYear = p.date.substring(0, 4);
            matches = (billYear === selectedValue);
        } else if (type === 'weekly') {
            const pDate = new Date(p.date);
            const d = new Date(Date.UTC(pDate.getFullYear(), pDate.getMonth(), pDate.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
            const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
            const billWeek = `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
            matches = (billWeek === selectedValue);
        }

        if (matches) {
            totalPatients++;
            consultationFees += (parseFloat(p.fees.doctor) || 0);
            medicineFees += (parseFloat(p.fees.medicine) || 0);
            procedureFees += (parseFloat(p.fees.procedure) || 0);
            totalIncome += (parseFloat(p.fees.total) || 0);
        }
    });

    let totalPurchasesAmount = 0;
    purchases.forEach(p => {
        if (!p.purchaseDate) return;
        
        let matches = false;
        if (type === 'monthly') {
            const billMonth = p.purchaseDate.substring(0, 7);
            matches = (billMonth === selectedValue);
        } else if (type === 'yearly') {
            const billYear = p.purchaseDate.substring(0, 4);
            matches = (billYear === selectedValue);
        } else if (type === 'weekly') {
            const pDate = new Date(p.purchaseDate);
            const d = new Date(Date.UTC(pDate.getFullYear(), pDate.getMonth(), pDate.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
            const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
            const billWeek = `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
            matches = (billWeek === selectedValue);
        }

        if (matches) {
            totalPurchasesAmount += (parseFloat(p.purchaseAmount) || 0);
        }
    });

    const netIncome = totalIncome - totalPurchasesAmount;

    if (totalPatients === 0 && totalPurchasesAmount === 0) {
        alert(`No data found for the selected ${type} period.`);
        return;
    }

    const headers = ["Period", "Total Patients", "Consultation fees", "Medicine fees", "Procedure fees", "Total Income", "Drug Purchases", "Net Income"];
    const row = [periodName, totalPatients, consultationFees.toFixed(2), medicineFees.toFixed(2), procedureFees.toFixed(2), totalIncome.toFixed(2), totalPurchasesAmount.toFixed(2), netIncome.toFixed(2)];
    const csvContent = headers.join(",") + "\n" + row.join(",");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Report_${selectedValue}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

function updateStockTableFromReportPicker() {
    const typePicker = document.getElementById('stockReportTypePicker');
    if (!typePicker) return;
    const type = typePicker.value;
    let start = '';
    let end = '';
    
    if (type === 'monthly') {
        const val = document.getElementById('stockReportMonthPicker')?.value;
        if (val) {
            const [y, m] = val.split('-');
            const lastDay = new Date(y, m, 0);
            start = `${y}-${m}-01`;
            end = `${y}-${m}-${String(lastDay.getDate()).padStart(2, '0')}`;
        }
    } else if (type === 'yearly') {
        const val = document.getElementById('stockReportYearPicker')?.value;
        if (val) {
            start = `${val}-01-01`;
            end = `${val}-12-31`;
        }
    } else if (type === 'weekly') {
        const val = document.getElementById('stockReportWeekPicker')?.value;
        if (val) {
            const y = parseInt(val.substring(0, 4));
            const w = parseInt(val.substring(6, 8));
            
            const d = new Date(y, 0, 4); 
            const dayNum = d.getDay() || 7;
            d.setDate(d.getDate() - dayNum + 1 + (w - 1) * 7);
            
            const startStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            start = startStr;
            
            const endD = new Date(d);
            endD.setDate(d.getDate() + 6);
            end = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`;
        }
    }
    
    if (start && end) {
        if (stockBillingStartDate) stockBillingStartDate.value = start;
        if (stockBillingEndDate) stockBillingEndDate.value = end;
        renderStockBillingSummary();
    }
}

document.getElementById('stockReportMonthPicker')?.addEventListener('change', updateStockTableFromReportPicker);
document.getElementById('stockReportYearPicker')?.addEventListener('change', updateStockTableFromReportPicker);
document.getElementById('stockReportWeekPicker')?.addEventListener('change', updateStockTableFromReportPicker);

window.downloadStockReport = function() {
    const stockBillingTableBody = document.getElementById('stockBillingTableBody');
    if (!stockBillingTableBody) return;
    
    let csvContent = "S.No,Purchase Date,Drug Purchased Amount,Due Amount\n";
    const rows = stockBillingTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData = Array.from(cols).map(col => `"${col.innerText.replace(/"/g, '""').replace(/₹/g, '').replace(/\u20b9/g, '').trim()}"`);
        csvContent += rowData.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    
    const typePicker = document.getElementById('stockReportTypePicker');
    let type = typePicker ? typePicker.value : 'export';
    let val = '';
    if (type === 'monthly') val = document.getElementById('stockReportMonthPicker')?.value || '';
    if (type === 'weekly') val = document.getElementById('stockReportWeekPicker')?.value || '';
    if (type === 'yearly') val = document.getElementById('stockReportYearPicker')?.value || '';
    
    link.setAttribute("download", `Stock_Billing_Summary_${val || type}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


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
    if (pOption === '') {
        paymentStatus = '';
        pOption = '-';
    } else if (paid > 0 && (pOption === 'GPay' || pOption === 'Cash')) {
        paymentStatus = 'Paid';
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
            
        let statusBadge = '';
        if (p.paymentStatus === 'Paid') {
            statusBadge = `<span class="badge bg-success">Paid</span>`;
        } else if (p.paymentStatus === 'Not Paid') {
            statusBadge = `<span class="badge bg-danger">Not Paid</span>`;
        }

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

function calculatePurchaseDue() {
    const amt = parseFloat(purchaseAmount.value) || 0;
    const paid = parseFloat(purchasePaidAmount.value) || 0;
    const due = amt - paid;
    if (purchaseDueAmount) {
        purchaseDueAmount.value = due > 0 ? due.toFixed(2) : '0.00';
    }
    
    if (purchasePaymentStatus && purchasePaymentOption) {
        const mode = purchasePaymentOption.value;
        if (mode === '') {
            purchasePaymentStatus.value = '';
            purchasePaymentStatus.style.color = '';
        } else if (paid > 0 && (mode === 'GPay' || mode === 'Cash')) {
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

// --- Pharmacy Billing Logic ---

async function generateNextPharmacyBillNumber() {
    try {
        if(pharmacyBillNumber) pharmacyBillNumber.textContent = "Bill No: Generating...";
        const snapshot = await db.collection('pharmacyBills')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();
        
        let nextNum = 1;
        if (!snapshot.empty) {
            const lastBill = snapshot.docs[0].data();
            if (lastBill.billNumber && lastBill.billNumber.startsWith('PH-')) {
                const lastNum = parseInt(lastBill.billNumber.replace('PH-', ''), 10);
                if (!isNaN(lastNum)) {
                    nextNum = lastNum + 1;
                }
            }
        }
        
        currentPharmacyBillNumber = `PH-${String(nextNum).padStart(4, '0')}`;
        if(pharmacyBillNumber) pharmacyBillNumber.textContent = `Bill No: ${currentPharmacyBillNumber}`;
    } catch (error) {
        console.error("Error generating bill number:", error);
        currentPharmacyBillNumber = `PH-${String(Date.now()).slice(-4)}`;
        if(pharmacyBillNumber) pharmacyBillNumber.textContent = `Bill No: ${currentPharmacyBillNumber}`;
    }
}

function handleAddMedicine(e) {
    e.preventDefault();
    if (!medName.value) return;
    
    const qty = parseInt(medQty.value, 10) || 1;
    const price = parseFloat(medPrice.value) || 0;
    
    currentPharmacyItems.push({
        name: medName.value,
        qty: qty,
        price: price,
        amount: qty * price
    });
    
    addMedicineForm.reset();
    medQty.value = 1;
    medPrice.value = '0.00';
    renderPharmacyItemsTable();
}

window.removePharmacyItem = function(index) {
    currentPharmacyItems.splice(index, 1);
    renderPharmacyItemsTable();
}

function renderPharmacyItemsTable() {
    if (!pharmacyItemsTableBody) return;
    
    pharmacyItemsTableBody.innerHTML = '';
    let total = 0;
    
    if (currentPharmacyItems.length === 0) {
        pharmacyItemsTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">No medicines added yet.</td></tr>`;
    } else {
        currentPharmacyItems.forEach((item, index) => {
            total += item.amount;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td style="text-align: right;">${item.qty}</td>
                <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
                <td style="text-align: right;">₹${item.amount.toFixed(2)}</td>
                <td style="text-align: center;">
                    <button class="btn btn-danger" style="padding: 2px 8px;" onclick="removePharmacyItem(${index})"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            pharmacyItemsTableBody.appendChild(tr);
        });
    }
    
    if(pharmacyGrandTotal) {
        pharmacyGrandTotal.textContent = `₹${total.toFixed(2)}`;
    }
}


function newPharmacyBill(silent = false) {
    currentPharmacyItems = [];
    if(pharmacyPatientName) pharmacyPatientName.value = '';
    const today = new Date();
    if(pharmacyBillDate) pharmacyBillDate.value = today.toISOString().split('T')[0];
    renderPharmacyItemsTable();
    generateNextPharmacyBillNumber();
    if (silent !== true) {
        showToast("New bill started");
    }
}

async function savePharmacyBill() {
    if (!pharmacyPatientName.value) {
        showToast("Please enter a patient name.", "error");
        return;
    }
    if (currentPharmacyItems.length === 0) {
        showToast("Please add at least one medicine.", "error");
        return;
    }
    
    const totalAmount = currentPharmacyItems.reduce((sum, item) => sum + item.amount, 0);
    
    const billData = {
        billNumber: currentPharmacyBillNumber,
        patientName: pharmacyPatientName.value,
        date: pharmacyBillDate.value,
        items: currentPharmacyItems,
        totalAmount: totalAmount,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        savePharmacyBillBtn.disabled = true;
        savePharmacyBillBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        
        await db.collection('pharmacyBills').add(billData);
        
        showToast("Pharmacy Bill saved successfully!", "success");
        savePharmacyBillBtn.disabled = false;
        savePharmacyBillBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Bill';
    } catch (error) {
        console.error("Error saving pharmacy bill:", error);
        showToast("Failed to save bill.", "error");
        savePharmacyBillBtn.disabled = false;
        savePharmacyBillBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Bill';
    }
}

function printPharmacyBill() {
    if (!pharmacyPatientName.value) {
        showToast("Please enter a patient name before printing.", "error");
        return;
    }
    if (currentPharmacyItems.length === 0) {
        showToast("Please add medicines before printing.", "error");
        return;
    }
    
    // Populate print area
    if(printBillNo) printBillNo.textContent = currentPharmacyBillNumber;
    if(printBillDate) printBillDate.textContent = pharmacyBillDate.value;
    if(printPatientName) printPatientName.textContent = pharmacyPatientName.value;
    
    if(printTableBody) {
        printTableBody.innerHTML = '';
        currentPharmacyItems.forEach((item, index) => {
            printTableBody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td style="text-align: right;">${item.qty}</td>
                    <td style="text-align: right;">${item.price.toFixed(2)}</td>
                    <td style="text-align: right;">${item.amount.toFixed(2)}</td>
                </tr>
            `;
        });
    }
    
    const totalAmount = currentPharmacyItems.reduce((sum, item) => sum + item.amount, 0);
    if(printGrandTotal) printGrandTotal.textContent = `₹${totalAmount.toFixed(2)}`;
    // Call print
    window.print();
}

function fetchPharmacyBillsByDate(dateStr) {
    if (!dateStr) return;
    
    if (pharmacyBillsUnsubscribe) {
        pharmacyBillsUnsubscribe();
    }
    
    pharmacyBillsTableLoading(true);
    
    pharmacyBillsUnsubscribe = db.collection('pharmacyBills')
        .where('date', '==', dateStr)
        .onSnapshot(snapshot => {
            pharmacyBillsList = [];
            snapshot.forEach(doc => {
                pharmacyBillsList.push({ id: doc.id, ...doc.data() });
            });
            renderPharmacyBillHistory();
        }, error => {
            console.error("Error listening to pharmacy bills by date:", error);
            pharmacyBillsTableLoading(false);
        });
}

function pharmacyBillsTableLoading(isLoading) {
    if (!pharmacyHistoryTableBody) return;
    if (isLoading) {
        pharmacyHistoryTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Loading history...</td></tr>`;
        if (pharmacyHistoryGrandTotal) pharmacyHistoryGrandTotal.textContent = `₹0.00`;
    }
}

function renderPharmacyBillHistory() {
    if (!pharmacyHistoryTableBody) return;
    
    pharmacyHistoryTableBody.innerHTML = '';
    
    if (pharmacyBillsList.length === 0) {
        pharmacyHistoryTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">No pharmacy bills found for this date.</td></tr>`;
        if (pharmacyHistoryGrandTotal) pharmacyHistoryGrandTotal.textContent = `₹0.00`;
        return;
    }
    
    // Sort client side by createdAt descending
    pharmacyBillsList.sort((a, b) => {
        let timeA = a.createdAt ? (typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0) : 0;
        let timeB = b.createdAt ? (typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0) : 0;
        return timeB - timeA;
    });
    
    let grandTotal = 0;
    
    pharmacyBillsList.forEach(bill => {
        grandTotal += (bill.totalAmount || 0);
        let timeStr = "";
        if (bill.createdAt && typeof bill.createdAt.toDate === 'function') {
            timeStr = bill.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${bill.billNumber}</strong></td>
            <td>${bill.date}</td>
            <td>${timeStr}</td>
            <td>${bill.patientName}</td>
            <td style="font-weight: 500;">₹${(bill.totalAmount || 0).toFixed(2)}</td>
            <td style="text-align: center;">
                <button class="btn btn-primary" style="padding: 2px 8px;" onclick="viewPharmacyBill('${bill.id}')" title="View / Reprint">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        `;
        pharmacyHistoryTableBody.appendChild(tr);
    });
    
    if (pharmacyHistoryGrandTotal) {
        pharmacyHistoryGrandTotal.textContent = `₹${grandTotal.toFixed(2)}`;
    }
}

window.viewPharmacyBill = function(billId) {
    const bill = pharmacyBillsList.find(b => b.id === billId);
    if (!bill) return;
    
    // Populate print area directly from the history bill
    if(printBillNo) printBillNo.textContent = bill.billNumber;
    if(printBillDate) printBillDate.textContent = bill.date;
    if(printPatientName) printPatientName.textContent = bill.patientName;
    
    if(printTableBody) {
        printTableBody.innerHTML = '';
        (bill.items || []).forEach((item, index) => {
            printTableBody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td style="text-align: right;">${item.qty}</td>
                    <td style="text-align: right;">${item.price.toFixed(2)}</td>
                    <td style="text-align: right;">${item.amount.toFixed(2)}</td>
                </tr>
            `;
        });
    }
    
    const totalAmount = (bill.items || []).reduce((sum, item) => sum + item.amount, 0);
    if(printGrandTotal) printGrandTotal.textContent = `₹${totalAmount.toFixed(2)}`;
    
    // Call print to show the preview without scrolling
    window.print();
}

// Boot up
init();
