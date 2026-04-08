// ============================================================
// JEBBI GADGETS - Products Module (Backend Integration)
// ============================================================

const API_BASE_URL = 'http://localhost:5000/api';
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];

// Load Products from Backend
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        const data = await response.json();
        
        if (data.success) {
            products = data.data || [];
            displayProducts(products);
        } else {
            showToast('Failed to load products', 'error');
            loadDefaultProducts(); // Fallback to demo products
        }
    } catch (error) {
        console.error('Error loading products:', error);
        loadDefaultProducts(); // Use demo products if backend unavailable
    }
}

// Fallback: Load Demo Products
function loadDefaultProducts() {
    products = [
        { id: 1, name: 'Wireless Headphones', price: 79.99, image: 'https://via.placeholder.com/250x180?text=Headphones', description: 'High-quality wireless headphones' },
        { id: 2, name: 'Smart Watch', price: 199.99, image: 'https://via.placeholder.com/250x180?text=Smart+Watch', description: 'Advanced fitness tracking' },
        { id: 3, name: 'USB-C Hub', price: 39.99, image: 'https://via.placeholder.com/250x180?text=USB+Hub', description: '7-in-1 USB-C adapter' },
        { id: 4, name: 'Portable SSD', price: 129.99, image: 'https://via.placeholder.com/250x180?text=SSD', description: '1TB fast storage' },
        { id: 5, name: 'Phone Case', price: 24.99, image: 'https://via.placeholder.com/250x180?text=Phone+Case', description: 'Protective case' },
        { id: 6, name: 'Screen Protector', price: 9.99, image: 'https://via.placeholder.com/250x180?text=Protector', description: 'Tempered glass' }
    ];
    displayProducts(products);
}

// Display Products
function displayProducts(productsToShow = products) {
    const productsContainer = document.getElementById('products');
    if (!productsContainer) return;
    
    productsContainer.innerHTML = '';
    productsToShow.forEach(product => {
        const cartItem = cart.find(item => item.id === product.id);
        const quantity = cartItem ? cartItem.quantity : 0;
        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        productDiv.innerHTML = `
            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/250x180?text=${product.name}'">
            <h3>${product.name}</h3>
            <p>$${product.price.toFixed(2)}</p>
            <button onclick="viewProduct(${product.id})">View Details</button>
            <div class="quantity-controls">
                <button onclick="updateQuantity(${product.id}, -1)" ${quantity === 0 ? 'disabled' : ''}>-</button>
                <span>${quantity}</span>
                <button onclick="updateQuantity(${product.id}, 1)">+</button>
            </div>
        `;
        productsContainer.appendChild(productDiv);
    });
}

// View Product Details
function viewProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const modal = document.getElementById('product-modal');
    const details = document.getElementById('product-details');
    details.innerHTML = `
        <img src="${product.image}" alt="${product.name}" style="max-width: 100%; height: 200px; object-fit: cover;">
        <h2>${product.name}</h2>
        <p>${product.description || ''}</p>
        <p><strong>Price: $${product.price.toFixed(2)}</strong></p>
        <button onclick="updateQuantity(${product.id}, 1); closeModal()">Add to Cart</button>
    `;
    if (modal) modal.style.display = 'block';
}

// Close Modal
function closeModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.style.display = 'none';
}

// Cart Management
function updateQuantity(id, change) {
    let item = cart.find(item => item.id === id);
    if (!item && change > 0) {
        const product = products.find(p => p.id === id);
        if (product) {
            cart.push({ ...product, quantity: 0 });
            item = cart[cart.length - 1];
        }
    }
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
            updateCart();
            displayProducts();
            if (change > 0) showToast('Added to cart!');
        }
    }
}

function removeFromCart(id) {
    if (confirm('Remove this item from cart?')) {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        updateCart();
        displayProducts();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCart() {
    const cartCount = document.getElementById('cart-count');
    const cartTotalHeader = document.getElementById('cart-total-header');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (cartCount) cartCount.textContent = count;
    if (cartTotalHeader) cartTotalHeader.textContent = total.toFixed(2);
}

// Search Products
function filterProducts(searchTerm = '') {
    if (!searchTerm && document.getElementById('search')) {
        searchTerm = document.getElementById('search').value.toLowerCase();
    }
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm)
    );
    displayProducts(filtered);
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    updateCart();
});
