// ============================================================
// JEBBI GADGETS - Checkout Module (Backend Integration)
// ============================================================

const API_BASE_URL = 'http://localhost:5000/api';
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let checkoutData = JSON.parse(localStorage.getItem('checkoutData')) || {};

function updateCart() {
    const cartCount = document.getElementById('cart-count');
    const cartTotalHeader = document.getElementById('cart-total-header');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (cartCount) cartCount.textContent = count;
    if (cartTotalHeader) cartTotalHeader.textContent = total.toFixed(2);
}

function saveCheckoutData() {
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
}

// STEP 1: Shipping Information
if (document.getElementById('shipping-form')) {
    document.getElementById('shipping-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullname = document.getElementById('fullname').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value.trim();
        const zip = document.getElementById('zip').value.trim();

        if (!fullname || !email || !phone || !address || !city) {
            alert('Please fill in all required shipping information');
            return;
        }

        checkoutData.shipping = { fullname, email, phone, address, city, state, zip };
        saveCheckoutData();
        window.location.href = 'checkout-step2.html';
    });
}

// STEP 2: Order Summary
if (document.getElementById('order-summary')) {
    const orderSummary = document.getElementById('order-summary');
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        orderSummary.innerHTML += `
            <div class="summary-item">
                <div class="item-details">
                    <strong>${item.name}</strong>
                    <span>$${item.price.toFixed(2)} x ${item.quantity}</span>
                </div>
                <div class="item-total">$${itemTotal.toFixed(2)}</div>
            </div>
        `;
        subtotal += itemTotal;
    });

    const tax = subtotal * 0.1; // 10% tax
    const shipping = 10; // Fixed shipping
    const total = subtotal + tax + shipping;

    orderSummary.innerHTML += `
        <div class="summary-breakdown" style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px;">
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                <span>Subtotal:</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                <span>Tax (10%):</span>
                <span>$${tax.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                <span>Shipping:</span>
                <span>$${shipping.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 10px 0; font-weight: bold; font-size: 18px; color: #2ecc71;">
                <span>Total:</span>
                <span>$${total.toFixed(2)}</span>
            </div>
        </div>
    `;

    window.proceedToPayment = function() {
        checkoutData.summary = { subtotal, tax, shipping, total };
        saveCheckoutData();
        window.location.href = 'checkout-step3.html';
    };
}

// STEP 3: Payment Processing
if (document.getElementById('payment-form')) {
    document.getElementById('payment-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
            alert('Please login to complete the purchase');
            window.location.href = 'login.html';
            return;
        }
        
        // Show loading
        const submitBtn = document.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;
        
        try {
            // Create order on backend
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: cart.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    shippingAddress: checkoutData.shipping,
                    paymentMethod: paymentMethod,
                    amount: checkoutData.summary?.total || 0
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Clear cart
                localStorage.removeItem('cart');
                localStorage.removeItem('checkoutData');
                
                // Show success
                showToast('Order created successfully!', 'success');
                
                setTimeout(() => {
                    window.location.href = `confirmation.html?orderId=${data.data.id}`;
                }, 2000);
            } else {
                alert(data.message || 'Order creation failed');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to process order. Please try again.');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ORDER CONFIRMATION
if (document.getElementById('order-confirmation')) {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (orderId) {
        const token = localStorage.getItem('accessToken');
        
        fetch(`${API_BASE_URL}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                const order = data.data;
                document.getElementById('order-confirmation').innerHTML = `
                    <h2>✓ Order Confirmed!</h2>
                    <p>Order ID: <strong>${order.orderNumber || order.id}</strong></p>
                    <p>Total: <strong>$${order.totalAmount?.toFixed(2) || '0.00'}</strong></p>
                    <p>You will receive a confirmation email at: <strong>${order.shippingAddress?.email}</strong></p>
                    <p>Expected delivery: 5-7 business days</p>
                    <a href="index.html" class="btn">Continue Shopping</a>
                `;
            }
        })
        .catch(err => console.error('Error:', err));
    }
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
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    updateCart();
});
