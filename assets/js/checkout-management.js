import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


const SHIPPING_COST = 50;
const auth = getAuth();

const checkoutItemsList = document.getElementById('checkoutItemsList');
const subtotalElement = document.getElementById('subtotal');
const grandTotalElement = document.getElementById('grandTotal');
const shippingElement = document.getElementById('shipping');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutAddressList = document.getElementById('checkoutAddressList');
const addNewAddressBtn = document.getElementById('addNewAddressBtn');
const newAddressForm = document.getElementById('newAddressForm');

let isLoadingCart = false;
let isLoadingAddresses = false;

function openPopup() {
    document.getElementById('paymentPopup').style.display = 'block';
}

function closePopup() {
    document.getElementById('paymentPopup').style.display = 'none';
}

document.querySelector('.close').addEventListener('click', closePopup);
window.addEventListener('click', (event) => {
    if (event.target == document.getElementById('paymentPopup')) {
        closePopup();
    }
});

function displayLoadingMessage(element, message = 'Yükleniyor...') {
    element.innerHTML = `
        <div class="loading-message">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
}

function updateOrderSummary(subtotal) {
    const shipping = subtotal > 0 ? SHIPPING_COST : 0;
    const total = subtotal + shipping;

    subtotalElement.textContent = `${subtotal.toFixed(2)} ₺`;
    shippingElement.textContent = `${shipping.toFixed(2)} ₺`;
    grandTotalElement.textContent = `${total.toFixed(2)} ₺`;
}

// Address Management
async function loadUserAddresses() {
    if (isLoadingAddresses) return;

    try {
        isLoadingAddresses = true;
        displayLoadingMessage(checkoutAddressList, 'Adresler yükleniyor...');

        const token = await auth.currentUser.getIdToken();
        const response = await fetch('https://localhost:7074/api/Address/GetAddresses', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Adresler yüklenemedi');
        }

        const addresses = await response.json();

        if (addresses.length === 0) {
            checkoutAddressList.innerHTML = `
                <div class="no-address-message">
                    <p>Kayıtlı adresiniz bulunmamaktadır.</p>
                </div>
            `;
            return;
        }

        const addressesHTML = addresses.map(address => `
            <div class="address-card ${address.isDefault ? 'address-card--selected' : ''}" 
                 data-address-id="${address.addressId}">
                <div class="address-card__header">
                    <span class="address-type">${address.title}</span>
                    ${address.isDefault ? '<span class="default-badge">Varsayılan</span>' : ''}
                </div>
                <div class="address-details">
                    <p>${address.fullAddress}</p>
                    <p>${address.district} / ${address.city}</p>
                    <p>${address.postalCode}</p>
                </div>
                <div class="address-card__actions">
                    <button type="button" class="btn btn--sm select-address-btn" 
                            onclick="selectAddress(${address.addressId})">
                        Seç
                    </button>
                </div>
            </div>
        `).join('');

        checkoutAddressList.innerHTML = addressesHTML;

    } catch (error) {
        console.error('Adresler yüklenirken hata:', error);
        checkoutAddressList.innerHTML = `
            <div class="error-message">
                <p>Adresler yüklenirken bir hata oluştu.</p>
                <button onclick="loadUserAddresses()" class="btn btn--sm">Tekrar Dene</button>
            </div>
        `;
    } finally {
        isLoadingAddresses = false;
    }
}

// Cart Management
async function loadCheckoutItems() {
    if (isLoadingCart) return;

    try {
        isLoadingCart = true;
        displayLoadingMessage(checkoutItemsList);

        const token = await auth.currentUser.getIdToken();
        const response = await fetch('https://localhost:7074/api/Cart/GetCartItems', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                checkoutItemsList.innerHTML = `
                    <tr>
                        <td colspan="3" class="empty-cart-message">
                            <p>Sepetiniz boş.</p>
                            <a href="shop.html" class="btn btn--sm">Alışverişe Başla</a>
                        </td>
                    </tr>
                `;
                updateOrderSummary(0);
                return;
            }
            throw new Error('Sepet bilgileri yüklenemedi');
        }

        const cartItems = await response.json();

        if (!cartItems || cartItems.length === 0) {
            checkoutItemsList.innerHTML = `
                <tr>
                    <td colspan="3" class="empty-cart-message">
                        <p>Sepetiniz boş.</p>
                        <a href="shop.html" class="btn btn--sm">Alışverişe Başla</a>
                    </td>
                </tr>
            `;
            updateOrderSummary(0);
            return;
        }

        let cartHTML = '';
        let subtotal = 0;

        cartItems.forEach(item => {
            subtotal += item.totalPrice;
            cartHTML += `
                <tr class="checkout-item">
                    <td>
                        <img src="${item.defaultImage}" alt="${item.name}" class="order__img" />
                    </td>
                    <td>
                        <h3 class="table__title">${item.name}</h3>
                        <p class="table__quantity">x ${item.quantity}</p>
                    </td>
                    <td>
                        <span class="table__price">${item.totalPrice.toFixed(2)} ₺</span>
                    </td>
                </tr>
            `;
        });

        checkoutItemsList.innerHTML = cartHTML;
        updateOrderSummary(subtotal);

    } catch (error) {
        console.error('Sepet yükleme hatası:', error);
        checkoutItemsList.innerHTML = `
            <tr>
                <td colspan="3" class="error-message">
                    <p>Bir hata oluştu: ${error.message}</p>
                    <button onclick="loadCheckoutItems()" class="btn btn--sm">Tekrar Dene</button>
                </td>
            </tr>
        `;
    } finally {
        isLoadingCart = false;
    }
}

// Order Creation
async function placeOrder(event) {
    event.preventDefault();

    const selectedAddress = document.querySelector('.address-card--selected');
    if (!selectedAddress) {
        Swal.fire({
            icon: 'warning',
            title: 'Adres Seçimi',
            text: 'Lütfen teslimat adresi seçin.',
            confirmButtonText: 'Tamam'
        });
        return;
    }

    const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked');
    if (!selectedPayment) {
        Swal.fire({
            icon: 'warning',
            title: 'Ödeme Yöntemi',
            text: 'Lütfen bir ödeme yöntemi seçin.',
            confirmButtonText: 'Tamam'
        });
        return;
    }

    if (selectedPayment.value === 'creditCard' || selectedPayment.value === 'iyzico') {
        openPopup();
        return;
    }

    await createOrder();
}

// Payment Form Submission
document.getElementById('paymentForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const paymentSuccess = await processPayment();
    if (paymentSuccess) {
        closePopup();
        await createOrder();
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Ödeme Hatası',
            text: 'Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.',
            confirmButtonText: 'Tamam'
        });
    }
});

// Simulate payment processing function
async function processPayment() {

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, 2000);
    });
}

async function createOrder() {
    try {
        const orderButton = document.getElementById('placeOrderBtn');
        orderButton.disabled = true;
        orderButton.innerHTML = '<div class="spinner"></div> Sipariş İşleniyor...';

        const user = auth.currentUser;
        if (!user) {
            throw new Error('Oturum açmanız gerekiyor');
        }

        const token = await user.getIdToken();

        const selectedAddress = document.querySelector('.address-card--selected');
        const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked');
        const orderData = {
            addressId: parseInt(selectedAddress.dataset.addressId),
            paymentMethod: selectedPayment.value,
            orderNotes: document.querySelector('textarea[name="orderNotes"]')?.value || ''
        };

        const response = await fetch('https://localhost:7074/api/Order/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Sipariş oluşturulamadı');
        }

        const result = await response.json();

        await Swal.fire({
            icon: 'success',
            title: 'Başarılı!',
            text: 'Siparişiniz başarıyla oluşturuldu.',
            confirmButtonText: 'Siparişlerim'
        });

        window.location.href = '/index.html';
    } catch (error) {
        console.error('Sipariş hatası:', error);
        Swal.fire({
            icon: 'error',
            title: 'Hata',
            text: error.message || 'Sipariş oluşturulurken bir hata oluştu.',
            confirmButtonText: 'Tamam'
        });
    } finally {
        const orderButton = document.getElementById('placeOrderBtn');
        orderButton.disabled = false;
        orderButton.innerHTML = 'Sipariş Ver';
    }
}

// Event Handlers
function toggleNewAddressForm() {
    newAddressForm.style.display = newAddressForm.style.display === 'none' ? 'block' : 'none';
}

function selectAddress(addressId) {
    const addressCards = document.querySelectorAll('.address-card');
    addressCards.forEach(card => {
        card.classList.remove('address-card--selected');
        const selectBtn = card.querySelector('.select-address-btn');

        if (card.dataset.addressId === addressId.toString()) {
            card.classList.add('address-card--selected');
            if (selectBtn) {
                selectBtn.textContent = 'Seçildi';
                selectBtn.classList.add('btn--selected');
            }
            card.setAttribute('aria-selected', 'true');
        } else {
            if (selectBtn) {
                selectBtn.textContent = 'Seç';
                selectBtn.classList.remove('btn--selected');
            }
            card.setAttribute('aria-selected', 'false');
        }
    });

    const selectedCard = document.querySelector('.address-card--selected');
    if (selectedCard) {
        selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const orderButton = document.getElementById('placeOrderBtn');
    if (orderButton) {
        orderButton.addEventListener('click', placeOrder);
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', placeOrder);
    }

    if (addNewAddressBtn) {
        addNewAddressBtn.addEventListener('click', toggleNewAddressForm);
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadCheckoutItems();
        loadUserAddresses();
    } else {
        window.location.href = '/login-register.html';
    }
});

window.selectAddress = selectAddress;
window.loadUserAddresses = loadUserAddresses;
window.loadCheckoutItems = loadCheckoutItems;