// Multi-step checkout functionality
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

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function saveCheckoutData() {
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
}

// Step 1: Shipping Information
if (document.getElementById('shipping-form')) {
    document.getElementById('shipping-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const fullname = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;
        const city = document.getElementById('city').value;

        if (!fullname || !email || !phone || !address || !city) {
            alert('Please fill in all shipping information');
            return;
        }

        checkoutData.shipping = { fullname, email, phone, address, city };
        saveCheckoutData();
        window.location.href = 'checkout-step2.html';
    });
}

// Step 2: Order Summary
if (document.getElementById('order-summary')) {
    const orderSummary = document.getElementById('order-summary');
    let total = 0;
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
        total += itemTotal;
    });

    orderSummary.innerHTML += `
        <div class="summary-total">
            <strong>Total Amount: $${total.toFixed(2)}</strong>
        </div>
    `;

    function proceedToPayment() {
        window.location.href = 'checkout-step3.html';
    }
}

// Step 3: Payment Method
if (document.getElementById('payment-form')) {
    // Payment method selection
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

    document.getElementById('payment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

        if (!paymentMethod) {
            alert('Please select a payment method');
            return;
        }

        // Validate payment details
        if (paymentMethod === 'mtn') {
            const mtnPhone = document.getElementById('mtn-phone').value;
            const mtnPin = document.getElementById('mtn-pin').value;
            if (!mtnPhone || !mtnPin) {
                alert('Please enter MTN Mobile Money details');
                return;
            }
            checkoutData.payment = { method: 'MTN Mobile Money', phone: mtnPhone };
        } else if (paymentMethod === 'airtel') {
            const airtelPhone = document.getElementById('airtel-phone').value;
            const airtelPin = document.getElementById('airtel-pin').value;
            if (!airtelPhone || !airtelPin) {
                alert('Please enter Airtel Mobile Money details');
                return;
            }
            checkoutData.payment = { method: 'Airtel Mobile Money', phone: airtelPhone };
        } else if (paymentMethod === 'creditcard') {
            const cardNumber = document.getElementById('card-number').value;
            const cardName = document.getElementById('card-name').value;
            const cardExpiry = document.getElementById('card-expiry').value;
            const cardCvv = document.getElementById('card-cvv').value;
            if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
                alert('Please enter complete card details');
                return;
            }
            checkoutData.payment = { method: 'Credit Card', lastFour: cardNumber.slice(-4) };
        }

        processPayment();
    });
}

function processPayment() {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderNumber = 'JG' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const orderDate = new Date().toLocaleDateString();

    const order = {
        orderNumber,
        date: orderDate,
        shipping: checkoutData.shipping,
        payment: checkoutData.payment,
        total,
        items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price }))
    };

    // Save order
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Clear cart and checkout data
    cart = [];
    checkoutData = {};
    saveCart();
    localStorage.removeItem('checkoutData');

    // Show confirmation
    window.location.href = 'confirmation.html?order=' + orderNumber;
}

// Initialize
updateCart();

// Add interactive enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Add step indicator animations
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        step.style.setProperty('--step-index', index);
    });

    // Add form validation feedback
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.style.borderColor = '#dc3545';
                this.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
            } else {
                this.style.borderColor = '#28a745';
                this.style.boxShadow = '0 0 0 0.2rem rgba(40, 167, 69, 0.25)';
            }
        });

        input.addEventListener('focus', function() {
            this.style.borderColor = '#007bff';
            this.style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
        });
    });

    // Add payment method selection animations
    document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Add loading state to payment button
    const payButton = document.querySelector('.btn-pay');
    if (payButton) {
        payButton.addEventListener('click', function() {
            this.classList.add('loading');
            this.textContent = 'Processing Payment...';
        });
    }

    // Add stagger animation to summary items
    document.querySelectorAll('.summary-item').forEach((item, index) => {
        item.style.setProperty('--item-index', index);
    });

    // Add smooth transitions for navigation
    document.querySelectorAll('.form-buttons button').forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add confirmation page animations
    if (window.location.pathname.includes('confirmation.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const orderNumber = urlParams.get('order');

        if (orderNumber) {
            // Animate order details
            setTimeout(() => {
                document.querySelectorAll('.order-info, .order-items').forEach((element, index) => {
                    element.style.animationDelay = `${index * 0.2}s`;
                    element.classList.add('animate-in');
                });
            }, 500);
        }
    }
});