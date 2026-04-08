let cart = JSON.parse(localStorage.getItem('cart')) || [];

function displayProducts(productsToShow = products) {
    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';
    productsToShow.forEach(product => {
        const cartItem = cart.find(item => item.id === product.id);
        const quantity = cartItem ? cartItem.quantity : 0;
        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        productDiv.innerHTML = `
            <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22250%22 height=%22180%22%3E%3Crect fill=%22%23ddd%22 width=%22250%22 height=%22180%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2216%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22%3EImage not loaded%3C/text%3E%3C/svg%3E'">
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

function viewProduct(id) {
    const product = products.find(p => p.id === id);
    const modal = document.getElementById('product-modal');
    const details = document.getElementById('product-details');
    details.innerHTML = `
        <img src="${product.image}" alt="${product.name}" style="max-width: 100%; height: 200px; object-fit: cover;">
        <h2>${product.name}</h2>
        <p>${product.description}</p>
        <p>Price: $${product.price.toFixed(2)}</p>
        <button onclick="updateQuantity(${product.id}, 1); closeModal()">Add to Cart</button>
    `;
    modal.style.display = 'block';
}

function showToast() {
    const toast = document.getElementById('toast');
    const toastTotal = document.getElementById('toast-total');
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    toastTotal.textContent = total.toFixed(2);
    toast.className = 'toast show';
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}

function removeFromCart(id) {
    if (confirm('Are you sure you want to remove this item from your cart?')) {
        cart = cart.filter(item => item.id !== id);
        updateCart();
        saveCart();
        filterProducts(); // Refresh the product display
    }
}

function updateQuantity(id, change) {
    let item = cart.find(item => item.id === id);
    if (!item && change > 0) {
        // Add to cart if not present and increasing
        const product = products.find(p => p.id === id);
        cart.push({ ...product, quantity: 0 });
        item = cart[cart.length - 1];
    }
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            updateCart();
            saveCart();
            filterProducts(); // Refresh the product display to update buttons
            if (change > 0) showToast(); // Show toast when adding
        }
    }
}

function updateCart() {
    const cartCount = document.getElementById('cart-count');
    const cartTotalHeader = document.getElementById('cart-total-header');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cartCount.textContent = count;
    cartTotalHeader.textContent = total.toFixed(2);
}

function displayCart() {
    const modal = document.getElementById('cart-modal');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    cartItems.innerHTML = '';
    let total = 0;
    cart.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div>
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)} x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}</p>
                <button onclick="updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)">+</button>
                <button onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;
        cartItems.appendChild(itemDiv);
        total += item.price * item.quantity;
    });
    cartTotal.textContent = total.toFixed(2);
    modal.style.display = 'block';
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
}

function filterProducts() {
    const category = document.getElementById('category-filter').value;
    const filtered = category === 'all' ? products : products.filter(p => p.category === category);
    displayProducts(filtered);
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Checkout Functions
function showCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    window.location.href = 'checkout-step1.html';
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    if (!fullname || !email || !phone || !address || !city) {
        alert('Please fill in all shipping information');
        return;
    }
    
    // Validate payment method details
    if (paymentMethod === 'mtn') {
        const mtnPhone = document.getElementById('mtn-phone').value;
        const mtnPin = document.getElementById('mtn-pin').value;
        if (!mtnPhone || !mtnPin) {
            alert('Please enter MTN Mobile Money details');
            return;
        }
        processTransaction('MTN Mobile Money', mtnPhone);
    } else if (paymentMethod === 'airtel') {
        const airtelPhone = document.getElementById('airtel-phone').value;
        const airtelPin = document.getElementById('airtel-pin').value;
        if (!airtelPhone || !airtelPin) {
            alert('Please enter Airtel Mobile Money details');
            return;
        }
        processTransaction('Airtel Mobile Money', airtelPhone);
    } else if (paymentMethod === 'creditcard') {
        const cardNumber = document.getElementById('card-number').value;
        const cardName = document.getElementById('card-name').value;
        const cardExpiry = document.getElementById('card-expiry').value;
        const cardCvv = document.getElementById('card-cvv').value;
        if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
            alert('Please enter complete card details');
            return;
        }
        processTransaction('Credit Card', cardNumber.slice(-4));
    }
}

function processTransaction(paymentMethod, lastFourOrPhone) {
    // Simulate payment processing with a delay
    const checkoutForm = document.getElementById('checkout-form');
    const checkoutModal = document.getElementById('checkout-modal');
    const confirmationModal = document.getElementById('confirmation-modal');
    const orderDetails = document.getElementById('order-details');
    
    // Store order information
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const total = document.getElementById('checkout-total').textContent;
    
    const orderNumber = 'JG' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const orderDate = new Date().toLocaleDateString();
    
    orderDetails.innerHTML = `
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Date:</strong> ${orderDate}</p>
        <p><strong>Customer:</strong> ${fullname}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        <p><strong>Amount Paid:</strong> $${total}</p>
    `;
    
    document.getElementById('confirmation-message').textContent = 
        `Thank you for your purchase! Your order has been placed successfully. A confirmation email has been sent to ${email}.`;
    
    // Close checkout and show confirmation
    checkoutModal.style.display = 'none';
    confirmationModal.style.display = 'block';
    
    // Save order to localStorage
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push({
        orderNumber,
        date: orderDate,
        customer: fullname,
        email,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        paymentMethod,
        total,
        items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price }))
    });
    localStorage.setItem('orders', JSON.stringify(orders));
}

function completeOrder() {
    // Clear cart
    cart = [];
    updateCart();
    saveCart();
    
    // Close confirmation modal
    const confirmationModal = document.getElementById('confirmation-modal');
    confirmationModal.style.display = 'none';
    
    // Close cart modal
    const cartModal = document.getElementById('cart-modal');
    cartModal.style.display = 'none';
    
    // Refresh products display
    filterProducts();
}

// Event listeners
document.getElementById('cart-link').addEventListener('click', displayCart);
document.querySelectorAll('.close').forEach(closeBtn => closeBtn.addEventListener('click', closeModal));
document.getElementById('category-filter').addEventListener('change', filterProducts);
document.getElementById('checkout-btn').addEventListener('click', showCheckout);
document.getElementById('checkout-form').addEventListener('submit', processPayment);

// Payment method selection listener
document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', function() {
        document.querySelectorAll('.payment-section').forEach(section => section.style.display = 'none');
        if (this.value === 'mtn') {
            document.getElementById('mtn-section').style.display = 'block';
        } else if (this.value === 'airtel') {
            document.getElementById('airtel-section').style.display = 'block';
        } else if (this.value === 'creditcard') {
            document.getElementById('card-section').style.display = 'block';
        }
    });
});

// Initialize
displayProducts();
updateCart();

// Add interactive animations
document.addEventListener('DOMContentLoaded', function() {
    // Add click animations to buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // Add hover effects to product cards
    document.querySelectorAll('.product').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add loading state to checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cart.length > 0) {
                this.classList.add('loading');
                this.textContent = 'Processing...';
                setTimeout(() => {
                    this.classList.remove('loading');
                    this.textContent = 'Checkout';
                }, 2000);
            }
        });
    }

    // Add stagger animation to cart items
    document.querySelectorAll('.cart-item').forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
        item.classList.add('animate-in');
    });

    // Add smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add ripple effect to buttons
    document.querySelectorAll('.btn, button').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            ripple.style.left = `${e.offsetX}px`;
            ripple.style.top = `${e.offsetY}px`;
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
});