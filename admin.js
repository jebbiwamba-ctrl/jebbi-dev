// Admin Panel JavaScript
// API Base URL
const API_BASE = 'http://localhost:5000/api';

// Get JWT from localStorage
function getAuthHeaders() {
    const token = localStorage.getItem('jebbi_token'); // Assume auth.js stores as this
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Check admin auth on load
document.addEventListener('DOMContentLoaded', async function() {
    const user = JSON.parse(localStorage.getItem('jebbi_current_user'));
    if (!user || user.role !== 'admin') {
        alert('Admin access required');
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('admin-user').textContent = `Admin: ${user.fullname}`;
    
    // Load initial tab
    loadProducts(1);
    setupEventListeners();
});

// Setup global listeners
function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchTab(tab);
        });
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Modals
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeModal();
    });

    // Forms
    document.getElementById('edit-form').addEventListener('submit', handleFormSubmit);
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
    
    // Load data
    if (tabName === 'products') loadProducts(1);
    else if (tabName === 'users') loadUsers(1);
    else if (tabName === 'orders') loadOrders(1);
    else if (tabName === 'stats') loadStats();
}

// PRODUCTS
async function loadProducts(page = 1) {
    try {
        const res = await fetch(`${API_BASE}/products?page=${page}&limit=10`, {
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) renderProductsTable(data.data);
        renderPagination('products-pagination', data.page, data.pages, loadProducts);
    } catch (err) {
        showToast('Error loading products: ' + err.message, 'error');
    }
}

function renderProductsTable(products) {
    const tbody = document.querySelector('#products-table tbody');
    tbody.innerHTML = products.map(p => `
        <tr>
            <td>${p._id.slice(-8)}</td>
            <td>${p.sku}</td>
            <td>${p.name}</td>
            <td>$${p.price.toFixed(2)}</td>
            <td>${p.stock}</td>
            <td><span class="status ${p.status}">${p.status}</span></td>
            <td>
                <button onclick="editItem('product', '${p._id}')" class="btn-small">Edit</button>
                <button onclick="deleteItem('product', '${p._id}', '${p.name}')" class="btn-small danger">Delete</button>
            </td>
        </tr>
    `).join('');
}

document.getElementById('add-product-btn').addEventListener('click', () => editItem('product', 'new'));

// USERS
async function loadUsers(page = 1) {
    const role = document.getElementById('user-role-filter').value;
    const url = new URLSearchParams({ page, limit: 10 });
    if (role) url.append('role', role);
    
    try {
        const res = await fetch(`${API_BASE}/users?${url}`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success) renderUsersTable(data.data);
    } catch (err) {
        showToast('Error loading users', 'error');
    }
}

document.getElementById('user-role-filter').addEventListener('change', () => loadUsers(1));

function renderUsersTable(users) {
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u._id.slice(-8)}</td>
            <td>${u.fullname}</td>
            <td>${u.email}</td>
            <td><span class="role ${u.role}">${u.role}</span></td>
            <td><span class="status ${u.status}">${u.status}</span></td>
            <td>
                <button onclick="editItem('user', '${u._id}')" class="btn-small">Edit</button>
                <button onclick="deleteItem('user', '${u._id}', '${u.fullname}')" class="btn-small danger">Delete</button>
            </td>
        </tr>
    `).join('');
}

// ORDERS
async function loadOrders(page = 1) {
    const status = document.getElementById('order-status-filter').value;
    const url = new URLSearchParams({ page, limit: 10 });
    if (status) url.append('status', status);
    
    try {
        const res = await fetch(`${API_BASE}/orders?${url}`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success) renderOrdersTable(data.data);
    } catch (err) {
        showToast('Error loading orders', 'error');
    }
}

document.getElementById('order-status-filter').addEventListener('change', () => loadOrders(1));

function renderOrdersTable(orders) {
    const tbody = document.querySelector('#orders-table tbody');
    tbody.innerHTML = orders.map(o => `
        <tr>
            <td>${o._id.slice(-8)}</td>
            <td>${o.displayOrderNumber || o.orderNumber}</td>
            <td>${o.userEmail || 'N/A'}</td>
            <td>$${o.totalAmount?.toFixed(2) || 0}</td>
            <td><span class="status ${o.status}">${o.status}</span></td>
            <td>${new Date(o.createdAt).toLocaleDateString()}</td>
            <td>
                <button onclick="editItem('order', '${o._id}')" class="btn-small">Edit</button>
                <button onclick="deleteItem('order', '${o._id}', 'Order #${o.orderNumber}')" class="btn-small danger">Cancel</button>
            </td>
        </tr>
    `).join('');
}

// STATS
async function loadStats() {
    try {
        const [usersRes, ordersRes] = await Promise.all([
            fetch(`${API_BASE}/users/stats`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/orders/stats`, { headers: getAuthHeaders() })
        ]);
        const users = await usersRes.json();
        const orders = await ordersRes.json();
        
        document.getElementById('total-users').textContent = users.data?.totalUsers || 0;
        document.getElementById('total-orders').textContent = orders.data?.totalOrders || 0;
        document.getElementById('total-revenue').textContent = `$${(orders.data?.totalRevenue || 0).toLocaleString()}`;
        // Low stock from products call
    } catch (err) {
        showToast('Error loading stats', 'error');
    }
}

// CRUD Modals
async function editItem(type, id) {
    let item;
    if (id !== 'new') {
        const res = await fetch(`${API_BASE}/${type}s/${id}`, { headers: getAuthHeaders() });
        const data = await res.json();
        item = data.data || data;
    }
    
    const modal = document.getElementById('edit-modal');
    document.getElementById('modal-title').textContent = id === 'new' ? `New ${type.slice(0,-1)}` : `Edit ${type.slice(0,-1)}`;
    
    let formHtml = '';
    if (type === 'product') {
        formHtml = `
            <input name="name" value="${item?.name || ''}" placeholder="Name" required>
            <input name="sku" value="${item?.sku || ''}" placeholder="SKU" required>
            <textarea name="description" placeholder="Description">${item?.description || ''}</textarea>
            <input name="price" type="number" value="${item?.price || ''}" step="0.01" required>
            <input name="stock" type="number" value="${item?.stock || 0}" required>
            <input name="category" value="${item?.category || ''}" placeholder="Category" required>
            <input name="status" value="${item?.status || 'active'}" list="status-list">
        `;
    } else if (type === 'user') {
        formHtml = `
            <input name="fullname" value="${item?.fullname || ''}" placeholder="Full Name">
            <input name="role" value="${item?.role || 'customer'}" list="role-list">
            <input name="status" value="${item?.status || 'active'}" list="status-list">
        `;
    } else if (type === 'order') {
        formHtml = `
            <input name="status" value="${item?.status || ''}" list="order-status-list">
            <textarea name="adminNotes" placeholder="Admin Notes">${item?.adminNotes || ''}</textarea>
        `;
    }
    
    document.getElementById('edit-form').innerHTML = formHtml + '<input type="hidden" name="_id" value="' + (item?._id || '') + '">';
    modal.style.display = 'block';
    window.currentEdit = { type, id };
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    const { type, id } = window.currentEdit;
    const method = id === 'new' ? 'POST' : 'PUT';
    const url = id === 'new' ? `${API_BASE}/${type}s` : `${API_BASE}/${type}s/${id}`;
    
    try {
        const res = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (res.ok) {
            closeModal();
            showToast('Saved successfully!');
            // Reload tab
            if (type === 'products') loadProducts();
            else if (type === 'users') loadUsers();
            else if (type === 'orders') loadOrders();
        } else {
            const err = await res.json();
            showToast(err.message || 'Save failed', 'error');
        }
    } catch (err) {
        showToast('Network error: ' + err.message, 'error');
    }
}

async function deleteItem(type, id, name) {
    document.getElementById('confirm-message').textContent = `Delete ${name}?`;
    document.getElementById('confirm-modal').style.display = 'block';
    window.pendingDelete = { type, id };
    
    document.getElementById('confirm-yes').onclick = async () => {
        try {
            const res = await fetch(`${API_BASE}/${type}s/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                showToast('Deleted successfully!');
                document.getElementById('confirm-modal').style.display = 'none';
                // Reload tab
                if (type === 'products') loadProducts();
                else if (type === 'users') loadUsers();
                else if (type === 'orders') loadOrders();
            }
        } catch (err) {
            showToast('Delete failed', 'error');
        }
    };
}

// Utils
function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

function logout() {
    localStorage.removeItem('jebbi_current_user');
    localStorage.removeItem('jebbi_token');
    window.location.href = 'login.html';
}

function showToast(message, type = 'success') {
    // Simple alert fallback, replace with toast UI
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function renderPagination(containerId, current, total, loadFn) {
    const container = document.getElementById(containerId);
    let html = `<button ${current === 1 ? 'disabled' : ''} onclick="loadFn(${current-1})">Prev</button>`;
    for (let i = 1; i <= total; i++) {
        html += `<button ${i === current ? 'class=active' : ''} onclick="loadFn(${i})">${i}</button>`;
    }
    html += `<button ${current === total ? 'disabled' : ''} onclick="loadFn(${current+1})">Next</button>`;
    container.innerHTML = html;
}

// Datalists for forms
document.write(`
    <datalist id="status-list">
        <option value="active">
        <option value="inactive">
        <option value="discontinued">
    </datalist>
    <datalist id="role-list">
        <option value="customer">
        <option value="admin">
    </datalist>
    <datalist id="order-status-list">
        <option value="pending">
        <option value="processing">
        <option value="shipped">
        <option value="delivered">
        <option value="cancelled">
        <option value="refunded">
    </datalist>
`);
