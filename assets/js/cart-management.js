import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
const Swal = window.Swal;

const auth = getAuth();

async function updateCartIcon() {
    try {
        const cartCountElement = document.getElementById('cart-count');
        if (!cartCountElement) {
            console.log('Cart count element not found');
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            console.log('No user logged in');
            cartCountElement.textContent = '0';
            return;
        }

        const token = await user.getIdToken();
        const response = await fetch('https://localhost:7074/api/Cart/GetCartItems', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.status === 404) { 
            cartCountElement.textContent = '0';
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to fetch cart items');
        }

        const cartItems = await response.json();
        const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        
        console.log('Cart count updated to:', totalQuantity);
        cartCountElement.textContent = totalQuantity.toString();

    } catch (error) {
        console.error('Error updating cart icon:', error);
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) cartCountElement.textContent = '0';
    }
}

// Update Cart icon while loading page
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            updateCartIcon();
        }
    });
});

async function addToCart(productId, quantity = 1) {
    try {
        const user = auth.currentUser;
        if (!user) {
            Swal.fire({
                icon: 'warning',
                title: 'Giriş Yapın',
                text: 'Sepete eklemek için giriş yapmanız gerekiyor.',
                confirmButtonText: 'Giriş Yap',
                preConfirm: () => {
                    window.location.href = '/login-register.html';
                }
            });
            return;
        }

        const token = await user.getIdToken();
        const response = await fetch('https://localhost:7074/api/Cart/AddToCart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity })
        });

        if (!response.ok) throw new Error('Sepete eklenemedi');

        await updateCartIcon();

        Swal.fire({
            icon: 'success',
            title: 'Başarılı!',
            text: 'Ürün sepete eklendi.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    } catch (error) {
        console.error('Sepete ekleme hatası:', error);
        Swal.fire({
            icon: 'error',
            title: 'Hata',
            text: error.message
        });
    }
}

async function removeFromCart(cartItemId) {
    try {
        const user = auth.currentUser;
        if (!user) {
            Swal.fire({
                icon: 'warning',
                title: 'Giriş Yapın',
                text: 'Bu işlemi gerçekleştirmek için giriş yapmanız gerekiyor.',
                confirmButtonText: 'Tamam'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: "Bu ürünü sepetinizden silmek istediğinize emin misiniz?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Evet, sil',
            cancelButtonText: 'İptal'
        });

        if (!result.isConfirmed) return;

        const token = await user.getIdToken();
        
        const response = await fetch(`https://localhost:7074/api/Cart/RemoveFromCart/${cartItemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Ürün sepetten silinemedi');
        }

        const itemRow = document.getElementById(`cart-item-${cartItemId}`);
        if (itemRow) {
            itemRow.remove();
        }

        await updateCartIcon();
        await updateTotalPrice();

        const cartContainer = document.getElementById('cart-items');
        if (cartContainer && cartContainer.children.length === 0) {
            cartContainer.innerHTML = showEmptyCartMessage();
        }

        Swal.fire({
            icon: 'success',
            title: 'Başarılı',
            text: 'Ürün sepetinizden silindi.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });

    } catch (error) {
        console.error('Sepetten silme hatası:', error);
        Swal.fire({
            icon: 'error',
            title: 'Hata',
            text: error.message || 'Ürün silinirken bir hata oluştu.',
            confirmButtonText: 'Tamam'
        });
    }
}

async function displayCartItems(cartItems) {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;

    cartContainer.innerHTML = '';
    let totalPrice = 0;

    for (const item of cartItems) {
        const productResponse = await fetch(`https://localhost:7074/api/products/${item.productId}`);
        const product = await productResponse.json();

        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;

        const row = document.createElement('tr');
        row.id = `cart-item-${item.cartItemId}`;
        row.innerHTML = `
            <td><img src="${product.defaultImage}" alt="${product.name}" class="table__img" /></td>
            <td><h3 class="table__title">${product.name}</h3></td>
            <td><span class="table__price">${item.price.toFixed(2)} ₺</span></td>
            <td>
                <div class="quantity__box">
                    <button class="quantity__btn minus" data-cart-item-id="${item.cartItemId}">-</button>
                    <input type="number" class="quantity__input" value="${item.quantity}" min="1" max="${product.stock}" data-cart-item-id="${item.cartItemId}">
                    <button class="quantity__btn plus" data-cart-item-id="${item.cartItemId}">+</button>
                </div>
            </td>
            <td><span class="table__subtotal">${itemTotal.toFixed(2)} ₺</span></td>
            <td>
                <i class="fi fi-rs-trash table__trash" data-cart-item-id="${item.cartItemId}">Ürünü Sil</i>
            </td>
        `;
        cartContainer.appendChild(row);
    }

    const totalElement = document.getElementById('cart-total');
    if (totalElement) {
        totalElement.textContent = `${totalPrice.toFixed(2)} ₺`;
    }

    await updateTotalPrice();
}

async function updateCartQuantity(cartItemId, quantity) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Kullanıcı girişi gerekli');
        }

        const token = await user.getIdToken();
        
        // Request payload
        const payload = {
            quantity: quantity
        };
        
        console.log('Updating cart item:', {
            cartItemId,
            quantity,
            endpoint: `https://localhost:7074/api/Cart/UpdateCartItem/${cartItemId}`
        });

        const response = await fetch(`https://localhost:7074/api/Cart/UpdateCartItem/${cartItemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

      
        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response body:', responseText);

        if (!response.ok) {
            throw new Error(responseText || 'Miktar güncellenemedi');
        }

        // Convert response to json
        const updatedItem = JSON.parse(responseText);
        console.log('Güncellenen ürün:', updatedItem);

        // Update ui
        const row = document.getElementById(`cart-item-${cartItemId}`);
        if (row) {
            
            const quantityInput = row.querySelector('.quantity__input');
            if (quantityInput) {
                quantityInput.value = quantity;
                quantityInput.defaultValue = quantity;
            }

            
            const subtotalElement = row.querySelector('.table__subtotal');
            if (subtotalElement && updatedItem.totalPrice) {
                subtotalElement.textContent = `${updatedItem.totalPrice.toFixed(2)} ₺`;
            }
        }

        // Reload Cart Data
        await fetchCartItems();
        await updateCartIcon();
        await updateTotalPrice();

        return true;

    } catch (error) {
        console.error('Miktar güncelleme hatası:', error);
        
        // Change ui to old
        const row = document.getElementById(`cart-item-${cartItemId}`);
        if (row) {
            const quantityInput = row.querySelector('.quantity__input');
            if (quantityInput) {
                quantityInput.value = quantityInput.defaultValue;
            }
        }

        Swal.fire({
            icon: 'error',
            title: 'Hata',
            text: error.message || 'Miktar güncellenirken bir hata oluştu.',
            confirmButtonText: 'Tamam'
        });
        return false;
    }
}

async function updateTotalPrice() {
    try {
        const subtotalElements = document.querySelectorAll('.table__subtotal');
        let subtotal = 0;
        const SHIPPING_COST = 50.00; 
        

        subtotalElements.forEach(element => {
        
            const priceText = element.textContent.replace('₺', '').trim();
            const price = parseFloat(priceText);
            
            if (!isNaN(price)) {
                subtotal += price;
                console.log(`Ürün fiyatı eklendi: ${price}, Ara toplam: ${subtotal}`);
            }
        });

        const subtotalElement = document.getElementById('cart-subtotal');
        if (subtotalElement) {
            subtotalElement.textContent = `${subtotal.toFixed(2)} ₺`;
            console.log(`Ürün fiyatları toplamı güncellendi: ${subtotal.toFixed(2)} ₺`);
        }

        const totalElement = document.getElementById('cart-total');
        if (totalElement) {
            const total = subtotal + SHIPPING_COST;
            totalElement.textContent = `${total.toFixed(2)} ₺`;
            console.log(`Toplam fiyat güncellendi (kargo dahil): ${total.toFixed(2)} ₺`);
        }

        // Empty cart controller
        if (subtotalElements.length === 0) {
            const cartContainer = document.getElementById('cart-items');
            if (cartContainer) {
                cartContainer.innerHTML = showEmptyCartMessage();
                if (subtotalElement) subtotalElement.textContent = '0.00 ₺';
                if (totalElement) totalElement.textContent = '50.00 ₺'; 
            }
        }

    } catch (error) {
        console.error('Toplam fiyat hesaplama hatası:', error);
        Swal.fire({
            icon: 'error',
            title: 'Hata',
            text: 'Toplam fiyat hesaplanırken bir hata oluştu.',
            confirmButtonText: 'Tamam'
        });
    }
}



// Click to update cart event
document.getElementById('update-cart')?.addEventListener('click', async () => {
    try {
        await updateTotalPrice();
        Swal.fire({
            icon: 'success',
            title: 'Başarılı',
            text: 'Sepet güncellendi.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    } catch (error) {
        console.error('Sepet güncelleme hatası:', error);
        Swal.fire({
            icon: 'error',
            title: 'Hata',
            text: 'Sepet güncellenirken bir hata oluştu.',
            confirmButtonText: 'Tamam'
        });
    }
});


async function fetchCartItems() {
    const cartContainer = document.getElementById('cart-items');
    const user = auth.currentUser;

    if (!user) {
        if (cartContainer) {
            cartContainer.innerHTML = `
                <tr><td colspan="6">Sepetinizi görüntülemek için giriş yapmalısınız.</td></tr>
            `;
        }
        return;
    }

    try {
        const token = await user.getIdToken();
        const response = await fetch('https://localhost:7074/api/Cart/GetCartItems', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                cartContainer.innerHTML = showEmptyCartMessage();
                return;
            }
            throw new Error('Sepet yüklenemedi');
        }

        const cartItems = await response.json();

        if (!cartItems || cartItems.length === 0) {
            cartContainer.innerHTML = showEmptyCartMessage();
            return;
        }

        await displayCartItems(cartItems);

    } catch (error) {
        console.error('Sepet yükleme hatası:', error);
        if (cartContainer) {
            cartContainer.innerHTML = `
                <tr><td colspan="6">Bir hata oluştu: ${error.message}</td></tr>
            `;
        }
    }
}

function showEmptyCartMessage() {
    return `
        <tr><td colspan="6" style="text-align: center; vertical-align: middle; padding: 50px;">
            <p style="margin-bottom: 20px;">Sepetiniz boş.</p>
            <a href="shop.html" style="
                display: inline-block;
                padding: 12px 25px;
                background-color: #2C5E30;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-size: 16px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            "
            onmouseover="this.style.boxShadow='0 8px 12px rgba(0, 0, 0, 0.2)';"
            onmouseout="this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)';">
                Alışverişe Başla
            </a>
        </td></tr>
    `;
}

// DOM Content Loaded Event Listener
document.addEventListener('DOMContentLoaded', () => {
    const cartContainer = document.getElementById('cart-items');
    if (cartContainer) {
        
        cartContainer.addEventListener('click', async (event) => {
            const trashIcon = event.target.closest('.fi-rs-trash');
            if (trashIcon) {
                event.preventDefault();
                const cartItemId = trashIcon.dataset.cartItemId;
                if (cartItemId) {
                    await removeFromCart(parseInt(cartItemId));
                }
            }
        });


cartContainer.addEventListener('click', async (event) => {
    const btn = event.target.closest('.quantity__btn');
    if (!btn) return;

    event.preventDefault();
    const cartItemId = parseInt(btn.dataset.cartItemId);
    const quantityBox = btn.closest('.quantity__box');
    const input = quantityBox.querySelector('.quantity__input');
    let currentQuantity = parseInt(input.value);
    let newQuantity = currentQuantity;

    if (btn.classList.contains('minus')) {
        newQuantity = Math.max(1, currentQuantity - 1);
    } else if (btn.classList.contains('plus')) {
        newQuantity = Math.min(parseInt(input.max) || 99, currentQuantity + 1);
    }

    if (newQuantity !== currentQuantity) {
        console.log('Updating quantity:', { cartItemId, newQuantity, currentQuantity });
        const success = await updateCartQuantity(cartItemId, newQuantity);
        
        if (success) {
            console.log('Update successful');
            input.value = newQuantity;
            input.defaultValue = newQuantity;
            
            await updateTotalPrice();
            
            Swal.fire({
                icon: 'success',
                title: 'Başarılı',
                text: 'Miktar güncellendi',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500
            });
        } else {
            console.log('Update failed, reverting to:', currentQuantity);
            input.value = currentQuantity;
        }
    }
});

cartContainer.addEventListener('change', async (event) => {
    const input = event.target;
    if (!input.matches('.quantity__input')) return;

    const cartItemId = parseInt(input.dataset.cartItemId);
    const oldValue = parseInt(input.defaultValue);
    const maxQuantity = parseInt(input.max) || 99;
    const newQuantity = Math.max(1, Math.min(maxQuantity, parseInt(input.value) || 1));
    
    if (newQuantity !== oldValue) {
        console.log('Manual quantity update:', { cartItemId, newQuantity, oldValue });
        
        try {
            const success = await updateCartQuantity(cartItemId, newQuantity);
            
            if (success) {
                console.log('Manual update successful');
                input.defaultValue = newQuantity;
                
                await updateTotalPrice();
                
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı',
                    text: 'Miktar güncellendi',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                console.log('Manual update failed, reverting to:', oldValue);
                input.value = oldValue;
                
                Swal.fire({
                    icon: 'error',
                    title: 'Hata',
                    text: 'Miktar güncellenirken bir hata oluştu',
                    confirmButtonText: 'Tamam'
                });
            }
        } catch (error) {
            console.error('Manual update error:', error);
            input.value = oldValue;
            
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: 'Miktar güncellenirken bir hata oluştu',
                confirmButtonText: 'Tamam'
            });
        }
    }
});

        // update cart icon while loading header
        const headerLoaded = setInterval(() => {
            const cartCount = document.getElementById('cart-count');
            if (cartCount) {
                clearInterval(headerLoaded);
                if (auth.currentUser) {
                    updateCartIcon();
                }
            }
        }, 100);

        // clear interval after  sec.
        setTimeout(() => clearInterval(headerLoaded), 5000);

        // Click to Update Cart button
        const updateCartButton = document.getElementById('update-cart');
        if (updateCartButton) {
            updateCartButton.addEventListener('click', async () => {
                try {
                    await updateTotalPrice();
                    Swal.fire({
                        icon: 'success',
                        title: 'Başarılı',
                        text: 'Sepet güncellendi.',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000
                    });
                } catch (error) {
                    console.error('Sepet güncelleme hatası:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Hata',
                        text: 'Sepet güncellenirken bir hata oluştu.',
                        confirmButtonText: 'Tamam'
                    });
                }
            });
        }
        // get cart data while page loading
        const initializeCart = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    await fetchCartItems();
                    await updateCartIcon();
                    await updateTotalPrice();
                } else {
                    cartContainer.innerHTML = `
                        <tr>
                            <td colspan="6" class="text-center">
                                Sepetinizi görüntülemek için giriş yapmalısınız.
                            </td>
                        </tr>
                    `;
                    const cartCount = document.getElementById('cart-count');
                    if (cartCount) cartCount.textContent = '0';
                }
            } catch (error) {
                console.error('Sepet başlatma hatası:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Hata',
                    text: 'Sepet yüklenirken bir hata oluştu.',
                    confirmButtonText: 'Tamam'
                });
            }
        };

        // Listen session
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                await initializeCart();
            } else {
                cartContainer.innerHTML = showEmptyCartMessage();
                const cartCount = document.getElementById('cart-count');
                if (cartCount) cartCount.textContent = '0';
            }
        });

        // Send message if empty
        const showEmptyCart = () => {
            cartContainer.innerHTML = showEmptyCartMessage();
            const subtotalElement = document.getElementById('cart-subtotal');
            const totalElement = document.getElementById('cart-total');
            if (subtotalElement) subtotalElement.textContent = '0.00 ₺';
            if (totalElement) totalElement.textContent = '50.00 ₺'; // Sadece kargo ücreti
        };

        initializeCart();
    }

    // Global Listen for add to cart
    document.addEventListener('click', async (event) => {
        const addToCartBtn = event.target.closest('[data-add-to-cart]');
        if (addToCartBtn) {
            event.preventDefault();
            const productId = parseInt(addToCartBtn.dataset.productId);
            const quantity = parseInt(addToCartBtn.dataset.quantity || '1');
            if (productId) {
                await addToCart(productId, quantity);
            }
        }
    });

    // Product quantity
    document.addEventListener('input', (event) => {
        const input = event.target;
        if (input.matches('.quantity__input')) {
            const value = input.value.replace(/[^\d]/g, '');
            const numValue = parseInt(value) || 1;
            const maxValue = parseInt(input.max) || 99;
            input.value = Math.max(1, Math.min(maxValue, numValue));
        }
    });

     let updateTimeout;
    const debouncedUpdateTotal = () => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(async () => {
            try {
                await updateTotalPrice();
            } catch (error) {
                console.error('Toplam fiyat güncelleme hatası:', error);
            }
        }, 500);
    };

    document.addEventListener('input', (event) => {
        if (event.target.matches('.quantity__input')) {
            debouncedUpdateTotal();
        }
    });

    // Update Total for delete cart product
    document.addEventListener('cartItemRemoved', debouncedUpdateTotal);
});

export {
    updateCartIcon,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    fetchCartItems,
    updateTotalPrice
};