import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth();

// DOM Elements
const ordersTableBody = document.getElementById('ordersTableBody');
const ordersLoading = document.getElementById('ordersLoading');
const ordersError = document.getElementById('ordersError');

// State Management
let isLoadingOrders = false;

// Helper Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'processing': return 'status--processing';
        case 'completed': return 'status--completed';
        case 'cancelled': return 'status--cancelled';
        default: return '';
    }
}

function getStatusText(status) {
    switch (status.toLowerCase()) {
        case 'processing': return 'İşleniyor';
        case 'completed': return 'Tamamlandı';
        case 'cancelled': return 'İptal Edildi';
        default: return status;
    }
}

// Orders Management
async function loadUserOrders() {
    if (isLoadingOrders) return;

    try {
        isLoadingOrders = true;
        ordersLoading.style.display = 'block';
        ordersError.style.display = 'none';
        ordersTableBody.innerHTML = '';

        const token = await auth.currentUser.getIdToken();
        const response = await fetch('https://localhost:7074/api/Order/user-orders', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Siparişler yüklenemedi');
        }

        const orders = await response.json();

        if (orders.length === 0) {
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-orders-message">
                        <p>Henüz siparişiniz bulunmamaktadır.</p>
                        <a href="shop.html" class="btn btn--sm">Alışverişe Başla</a>
                    </td>
                </tr>
            `;
            return;
        }

        const ordersHTML = orders.map(order => `
            <tr>
                <td>#${order.orderId}</td>
                <td>${formatDate(order.orderDate)}</td>
                <td><span class="status ${getStatusClass(order.status)}">${getStatusText(order.status)}</span></td>
                <td>${order.totalAmount.toFixed(2)} ₺</td>
                <td>
                    <button onclick="viewOrderDetails(${order.orderId})" 
                            class="view__order btn btn--sm">
                        Görüntüle
                    </button>
                </td>
            </tr>
        `).join('');

        ordersTableBody.innerHTML = ordersHTML;

    } catch (error) {
        console.error('Siparişler yüklenirken hata:', error);
        ordersError.style.display = 'block';
    } finally {
        isLoadingOrders = false;
        ordersLoading.style.display = 'none';
    }
}

// Order Details View
async function viewOrderDetails(orderId) {
    try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`https://localhost:7074/api/Order/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Sipariş detayları yüklenemedi');
        }

        const orderDetails = await response.json();

        Swal.fire({
            title: `Sipariş #${orderDetails.orderId}`,
            html: `
                <div class="order-details">
                    <div class="order-info">
                        <p><strong>Tarih:</strong> ${formatDate(orderDetails.orderDate)}</p>
                        <p><strong>Durum:</strong> <span class="status ${getStatusClass(orderDetails.status)}">${getStatusText(orderDetails.status)}</span></p>
                        <p><strong>Toplam:</strong> ${orderDetails.totalAmount.toFixed(2)} ₺</p>
                    </div>
                    <hr>
                    <div class="order-items">
                        <h4>Sipariş Ürünleri</h4>
                        ${orderDetails.items.map(item => `
                            <div class="order-item">
                                <img src="${item.productImage}" alt="${item.productName}" class="order-item__image">
                                <div class="order-item__details">
                                    <p class="order-item__name">${item.productName}</p>
                                    <p>Adet: ${item.quantity} x ${item.unitPrice.toFixed(2)} ₺</p>
                                    <p><strong>Toplam:</strong> ${item.totalPrice.toFixed(2)} ₺</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `,
            width: '600px',
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                popup: 'order-details-modal'
            }
        });
    } catch (error) {
        console.error('Sipariş detayları görüntülenirken hata:', error);
        Swal.fire({
            icon: 'error',
            title: 'Hata',
            text: 'Sipariş detayları yüklenirken bir hata oluştu.',
            confirmButtonText: 'Tamam'
        });
    }
}



document.addEventListener('DOMContentLoaded', () => {
    const accountTabs = document.querySelectorAll('.account__tab');
    accountTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.target;
            if (targetId === '#orders') {
                loadUserOrders();
            }
        });
    });
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        const ordersTab = document.querySelector('#orders');
        if (ordersTab.classList.contains('active-tab')) {
            loadUserOrders();
        }
    } else {
        window.location.href = '/login-register.html';
    }
});

window.loadUserOrders = loadUserOrders;
window.viewOrderDetails = viewOrderDetails;