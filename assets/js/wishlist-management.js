import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { addToCart } from './cart-management.js';
import config from './config.js';

const auth = getAuth();
const Swal = window.Swal;

export async function addToWishlist(productId) {
    try {
        const user = auth.currentUser;
        if (!user) {
            Swal.fire({
                title: 'Giriş Gerekli',
                text: 'İstek listesine ürün eklemek için lütfen giriş yapın.',
                icon: 'info',
                confirmButtonText: 'Giriş Yap',
                showCancelButton: true,
                cancelButtonText: 'İptal'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'login-register.html';
                }
            });
            return;
        }

        const idToken = await user.getIdToken(true);
        const response = await fetch(`${config.apiUrl}/api/Wishlist/AddToWishlist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ productId })
        });

        if (!response.ok) {
            if (response.status === 401) {
                Swal.fire({
                    title: 'Yetkilendirme Hatası',
                    text: 'Bu işlemi gerçekleştirmek için yetkiniz bulunmuyor. Lütfen tekrar giriş yapın.',
                    icon: 'warning',
                    confirmButtonText: 'Giriş Yap',
                    showCancelButton: true,
                    cancelButtonText: 'İptal'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = 'login-register.html';
                    }
                });
                return;
            }
            throw new Error('İstek listesine eklenemedi');
        }

        const data = await response.json();
        updateWishlistIcon();
        Swal.fire({
            icon: 'success',
            title: 'Başarılı!',
            text: 'Ürün istek listesine eklendi.',
            timer: 2000,
            showConfirmButton: false,
            position: 'top-end',
            toast: true
        });
        return data;
    } catch (error) {
        console.error('Wishlist ekleme hatası:', error);
        Swal.fire({
            icon: 'error',
            title: 'Hata!',
            text: `Ürün istek listesine eklenirken bir hata oluştu: ${error.message}`,
            position: 'top-end',
            toast: true,
            showConfirmButton: true,
            confirmButtonColor: '#d33'
        });
        throw error;
    }
}

export async function fetchWishlistItems() {
    const wishlistContainer = document.getElementById('wishlist-items');
    const user = auth.currentUser;

    if (!user) {
        wishlistContainer.innerHTML = `
            <tr><td colspan="4">Lütfen giriş yapın.</td></tr>
        `;
        return;
    }

    try {
        const token = await user.getIdToken();
        const response = await fetch(`${config.apiUrl}/api/Wishlist/get-wishlist/${user.uid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 404) {
                wishlistContainer.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; vertical-align: middle; padding: 50px;">
                            <p style="margin-bottom: 20px;">Favorileriniz boş, hemen keşfetmeye başlayın!</p>
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
                            onmouseout="this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)';">Şimdi keşfet</a>
                        </td>
                    </tr>
                `;
                return;
            }
            throw new Error('İstek listesi yüklenirken bir hata oluştu.');
        }

        const wishlistItems = await response.json();

        if (wishlistItems.length === 0) {
            wishlistContainer.innerHTML = `
                <tr>
                    <td colspan="4">
                        <p>İstek listenizde ürün bulunmamaktadır.</p>
                        <a href="/products.html">Ürünlere göz at</a>
                    </td>
                </tr>
            `;
            return;
        }

        wishlistContainer.innerHTML = '';
        for (const item of wishlistItems) {
            const productResponse = await fetch(`${config.apiUrl}/api/product/${item.productId}`);
            const product = await productResponse.json();

            const row = document.createElement('tr');
            row.id = `wishlist-item-${item.productId}`;
            row.innerHTML = `
                <td><img src="${item.defaultImage}" alt="${item.name}" class="table__img" /></td>
                <td><h3 class="table__title">${product.name}</h3></td>
                <td><span class="table__price">${item.price.toFixed(2)} ₺</span></td>
                <td><span class="table__stock">${item.stock > 0 ? 'Stoklarımızda mevcut' : 'Ürün Stokta Mevcut Değil !'}</span></td>
                <td>
                    <a href="#" class="btn btn--sm add-to-cart" data-product-id="${item.productId}">Sepete Ekle</a>
                </td>
                <td>
                    <i class="fi fi-rs-trash table__trash" data-wishlist-item-id="${item.wishlistItemId}">Ürünü Sil</i>
                </td>
            `;
            wishlistContainer.appendChild(row);
        }
    } catch (error) {
        console.error("İstek listesi hatası:", error);
        wishlistContainer.innerHTML = `
            <tr><td colspan="4">Bir hata oluştu: ${error.message}</td></tr>
        `;
    }
}

export async function removeFromWishlist(wishlistItemId) {
    const user = auth.currentUser;
    if (!user) {
        Swal.fire({
            icon: 'warning',
            title: 'Giriş Yapın',
            text: 'Bu işlemi gerçekleştirmek için giriş yapmanız gerekiyor.'
        });
        return;
    }

    try {
        const token = await user.getIdToken();
        const response = await fetch(`${config.apiUrl}/api/Wishlist/remove-from-wishlist/${wishlistItemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('İstek listesinden ürün silinemedi');

        await fetchWishlistItems();
        await updateWishlistIcon();

        Swal.fire({
            icon: 'success',
            title: 'Başarılı',
            text: 'Ürün istek listenizden silindi.'
        });
    } catch (error) {
        console.error("Hata oluştu:", error);
        Swal.fire({
            icon: 'error',
            title: 'Hata',
            text: `Ürün silinemedi: ${error.message}`
        });
    }
}

async function updateWishlistIcon() {
    try {
        const wishlistCountElement = document.getElementById('wishlist-count');
        if (!wishlistCountElement) {
            console.log('Wishlist count element not found');
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            console.log('No user logged in');
            wishlistCountElement.textContent = '0';
            return;
        }

        const token = await user.getIdToken();
        const response = await fetch(`${config.apiUrl}/api/Wishlist/get-wishlist/${user.uid}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.status === 404) {
            wishlistCountElement.textContent = '0';
            return;
        }

        if (!response.ok) {
            throw new Error('İstek listesi yüklenemedi');
        }

        const wishlistItems = await response.json();
        const itemCount = wishlistItems.length;

        console.log('Wishlist count updated to:', itemCount);
        wishlistCountElement.textContent = itemCount.toString();

    } catch (error) {
        console.error('İstek listesi sayacı güncellenirken hata:', error);
        const wishlistCountElement = document.getElementById('wishlist-count');
        if (wishlistCountElement) wishlistCountElement.textContent = '0';
    }
}

export { updateWishlistIcon };

document.addEventListener('DOMContentLoaded', () => {
    const wishlistContainer = document.getElementById('wishlist-items');
    if (wishlistContainer) {
        wishlistContainer.addEventListener('click', async (event) => {
            const trashIcon = event.target.closest('.table__trash');
            if (trashIcon) {
                const wishlistItemId = trashIcon.dataset.wishlistItemId;
                await removeFromWishlist(parseInt(wishlistItemId));
            }

            const addToCartButton = event.target.closest('.add-to-cart');
            if (addToCartButton) {
                event.preventDefault();
                const productId = addToCartButton.dataset.productId;
                await addToCart(parseInt(productId));
            }
        });
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await updateWishlistIcon();
            if (wishlistContainer) await fetchWishlistItems();
        } else {
            if (wishlistContainer) {
                wishlistContainer.innerHTML = `
                    <tr><td colspan="6">Ürün görüntülemek için giriş yapmalısınız.</td></tr>
                `;
            }
        }
    });
}); 