import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { addToCart } from './cart-management.js';
import { addToWishlist } from './wishlist-management.js';

const auth = getAuth();

// Infinite scroll
let allProducts = [];
let displayedProductCount = 0;
const PRODUCTS_PER_LOAD = 5;

// Loading main content
export async function fetchProducts() {
    try {
        if (allProducts.length === 0) {
            const response = await fetch('https://localhost:7074/api/products');
            if (!response.ok) {
                throw new Error(`HTTP Hatası: ${response.status}`);
            }
            allProducts = await response.json();
            const totalCount = document.querySelector('#total-products-count');
            if (totalCount) {
                totalCount.textContent = allProducts.length;
            }
        }
        loadMoreProducts();
    } catch (error) {
        console.error('Ürünler alınırken bir hata oluştu:', error);
        const productList = document.querySelector('#products__container');
        if (productList) {
            productList.innerHTML = '<p>Ürünler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.</p>';
        }
    }
}

// Load More Products for infinity
function loadMoreProducts() {
    const productList = document.querySelector('#products__container');
    if (!productList) return;

    const productsToDisplay = allProducts.slice(
        displayedProductCount,
        displayedProductCount + PRODUCTS_PER_LOAD
    );

    productsToDisplay.forEach(product => {
        const productCard = createProductCard(product);
        productList.appendChild(productCard);
    });

    displayedProductCount += productsToDisplay.length;
}



function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.classList.add('product__item');
    productCard.innerHTML = `
        <div class="product__banner">
            <a href="details.html?productId=${product.productId}" class="product__images">
                <img src="${product.defaultImage}" alt="${product.name}" class="product__img default" />
                <img src="${product.hoverImage || product.defaultImage}" alt="${product.name}" class="product__img hover" />
            </a>
            <div class="product__actions">
                <a href="#" class="action__btn add-to-wishlist" data-product-id="${product.productId}" aria-label="İstek Listesine Kaydet">
                    <i class="fi fi-rs-heart"></i>
                </a>
            </div>
            ${product.discountPercentage ?
            `<div class="product__badge light-pink">-${product.discountPercentage}%</div>` : ''}
        </div>
        <div class="product__content">
            <span class="product__category">${product.category || 'Kategori Yok'}</span>
            <a href="details.html?productId=${product.productId}">
                <h3 class="product__title">${product.name}</h3>
            </a>
            <div class="product__rating">
                <i class="fi fi-rs-star"></i>
                <i class="fi fi-rs-star"></i>
                <i class="fi fi-rs-star"></i>
                <i class="fi fi-rs-star"></i>
                <i class="fi fi-rs-star"></i>
            </div>
            <div class="product__price flex">
                <span class="new__price">${product.price.toFixed(2)} ₺</span>
                ${product.oldPrice ? `<span class="old__price">${product.oldPrice} ₺</span>` : ''}
            </div>
            <a href="#" class="action__btn cart__btn add-to-cart" 
                data-product-id="${product.productId}"
                aria-label="Sepete Ekle">
                <i class="fi fi-rs-shopping-bag-add"></i>
            </a>
        </div>
    `;
    return productCard;
}

//Click event for product details
function setupProductDetailHandlers(productId) {
    const container = document.querySelector('#product-details');
    if (!container) return;

    const quantityInput = container.querySelector('.quantity__input');
    const mainImage = document.getElementById('main-image');

    container.addEventListener('click', async (e) => {

        if (e.target.classList.contains('minus')) {
            let quantity = parseInt(quantityInput.value);
            quantityInput.value = Math.max(1, quantity - 1);
        }


        if (e.target.classList.contains('plus')) {
            let quantity = parseInt(quantityInput.value);
            quantityInput.value = Math.min(parseInt(quantityInput.max), quantity + 1);
        }


        if (e.target.classList.contains('gallery__img')) {
            mainImage.src = e.target.src;
        }
    });


    setupAddToCartHandler(container, productId);
    setupWishlistHandler(container, productId);
}


function setupAddToCartHandler(container, productId) {
    const addToCartBtn = container.querySelector('.add-to-cart');
    if (!addToCartBtn) return;

    addToCartBtn.addEventListener('click', async () => {
        if (addToCartBtn.disabled) return;

        addToCartBtn.disabled = true;
        const quantityInput = container.querySelector('.quantity__input');
        const quantity = parseInt(quantityInput?.value || 1);

        try {
            await addToCart(productId, quantity);
        } catch (error) {
            console.error('Sepete ekleme hatası:', error);
        } finally {
            setTimeout(() => {
                addToCartBtn.disabled = false;
            }, 1000);
        }
    });
}


function setupWishlistHandler(container, productId) {
    const wishlistBtn = container.querySelector('.add-to-wishlist');
    if (!wishlistBtn) return;

    wishlistBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (wishlistBtn.disabled) return;

        wishlistBtn.disabled = true;
        try {
            await addToWishlist(productId, 1);
        } catch (error) {
            console.error('İstek listesine ekleme hatası:', error);
        } finally {
            setTimeout(() => {
                wishlistBtn.disabled = false;
            }, 1000);
        }
    });
}

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('productId');
}

document.addEventListener('DOMContentLoaded', async () => {
    const productId = getProductIdFromUrl();

    // Event delegation for global click handler
    document.addEventListener('click', async (e) => {

        if (e.target.closest('.add-to-cart')) {
            e.preventDefault();
            const button = e.target.closest('.add-to-cart');
            if (button.disabled) return;

            const productId = button.getAttribute('data-product-id');
            if (!productId) return;

            button.disabled = true;
            try {
                await addToCart(productId, 1);
            } finally {
                setTimeout(() => {
                    button.disabled = false;
                }, 1000);
            }
        }


        if (e.target.closest('.add-to-wishlist')) {
            e.preventDefault();
            const button = e.target.closest('.add-to-wishlist');
            if (button.disabled) return;

            const productId = button.getAttribute('data-product-id');
            if (!productId) return;

            button.disabled = true;
            try {
                await addToWishlist(productId, 1);
            } finally {
                setTimeout(() => {
                    button.disabled = false;
                }, 1000);
            }
        }
    });


    if (productId) {
        await fetchProductDetails(productId);
    } else {
        await fetchProducts();

        //  observer for Infinite scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && displayedProductCount < allProducts.length) {
                    loadMoreProducts();
                }
            });
        }, {
            root: null,
            rootMargin: '200px',
            threshold: 0.1
        });

        const productsContainer = document.querySelector('.products.container');
        if (productsContainer) {
            const scrollTrigger = document.createElement('div');
            scrollTrigger.id = 'scroll-trigger';
            productsContainer.appendChild(scrollTrigger);
            observer.observe(scrollTrigger);
        }
    }
});

//Details Page


document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('productId'); // URL'den alınan ID

    try {
        const response = await fetch(`https://localhost:7074/api/Products/${productId}`);
        if (!response.ok) {
            throw new Error(`HTTP Hatası: ${response.status}`);
        }
        const product = await response.json();

        const addToCartBtn = document.getElementById('addToCartBtn');
        const wishlistBtn = document.querySelector('.add-to-wishlist');

        if (addToCartBtn) {
            addToCartBtn.setAttribute('data-product-id', productId);
        }

        if (wishlistBtn) {
            wishlistBtn.setAttribute('data-product-id', productId);
        }



        const productImage = document.getElementById('productImage');
        productImage.src = product.defaultImage;
        productImage.alt = product.name;


        const hoverImagesContainer = document.getElementById('productHoverImages');
        const defaultImage = document.createElement('img');
        defaultImage.src = product.defaultImage;
        defaultImage.alt = product.name;
        defaultImage.classList.add('details__small-img');
        hoverImagesContainer.appendChild(defaultImage);

        const hoverImage = document.createElement('img');
        hoverImage.src = product.hoverImage;
        hoverImage.alt = product.name;
        hoverImage.classList.add('details__small-img');
        hoverImagesContainer.appendChild(hoverImage);

        // Change main image when clicking on small images
        [defaultImage, hoverImage].forEach(img => {
            img.addEventListener('click', function () {
                productImage.src = img.src; 
            });
        });


        const smallImagesContainer = document.getElementById('productImagesSmall');
        if (product.images && product.images.length > 0) {
            product.images.forEach(image => {
                const img = document.createElement('img');
                img.src = image;
                img.alt = product.name;
                img.classList.add('details__small-img');
                smallImagesContainer.appendChild(img);

                img.addEventListener('click', function () {
                    productImage.src = image;
                });
            });
        } else {
            console.error('Küçük resimler bulunamadı.');
        }

        document.getElementById('productName').textContent = product.name;
        document.getElementById('productBrand').textContent = product.brand || 'Viva Moda';
        document.getElementById('productPrice').textContent = `${product.price}₺`;
        document.getElementById('productOldPrice').textContent = product.oldPrice ? `${product.oldPrice}₺` : '';
        document.getElementById('productDiscount').textContent = product.discountPercentage ? `${product.discountPercentage}% İndirim` : '';
        document.getElementById('productDescription').textContent = product.description;
        document.getElementById('productSKU').textContent = product.sku || 'Bilinmiyor';
        document.getElementById('productTags').textContent = product.tags ? product.tags.join(', ') : 'Etiket Yok';
        document.getElementById('productAvailability').textContent = `${product.stock} Stokta Mevcut`;

        // Dynamic loading of colors
        const colorList = document.getElementById('colorList');
        if (product.colors) {
            const colors = JSON.parse(product.colors);
            colors.forEach(color => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<a href="#" class="color__link" style="background-color: ${color};"></a>`;
                colorList.appendChild(listItem);
            });
        }

        // Dynamic loading of sizes
        const sizeList = document.getElementById('sizeList');
        if (product.sizes) {
            const sizes = JSON.parse(product.sizes);
            sizes.forEach(size => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<a href="#" class="size__link">${size}</a>`;
                sizeList.appendChild(listItem);
            });
        }

    } catch (error) {
        console.error('Veri çekme hatası:', error);
    }
});

document.querySelectorAll('.product__link').forEach(link => {
    link.addEventListener('click', function (event) {
        const productId = this.getAttribute('data-product-id'); 
        link.href = `details.html?productId=${productId}`;
    });
});

// Zoom Effect
document.addEventListener('DOMContentLoaded', function () {
    const productImage = document.getElementById('productImage');
    const zoomLens = document.getElementById('zoomLens');
    const zoomResult = document.createElement('div');
    zoomResult.classList.add('zoom-result');
    productImage.parentElement.appendChild(zoomResult);

    productImage.addEventListener('mousemove', throttle(moveLens, 20));
    productImage.addEventListener('mouseenter', () => {
        zoomLens.style.display = 'block';
        zoomResult.style.display = 'block';
    });
    productImage.addEventListener('mouseleave', () => {
        zoomLens.style.display = 'none';
        zoomResult.style.display = 'none';
    });

    function moveLens(event) {
        const pos = getCursorPos(event);
        let x = pos.x - (zoomLens.offsetWidth / 2);
        let y = pos.y - (zoomLens.offsetHeight / 2);

        // Border control for lens
        if (x > productImage.width - zoomLens.offsetWidth) { x = productImage.width - zoomLens.offsetWidth; }
        if (x < 0) { x = 0; }
        if (y > productImage.height - zoomLens.offsetHeight) { y = productImage.height - zoomLens.offsetHeight; }
        if (y < 0) { y = 0; }

        // Pozition the lens
        zoomLens.style.left = x + 'px';
        zoomLens.style.top = y + 'px';


        const cx = zoomResult.offsetWidth / zoomLens.offsetWidth;
        const cy = zoomResult.offsetHeight / zoomLens.offsetHeight;
        zoomResult.style.backgroundImage = `url('${productImage.src}')`;
        zoomResult.style.backgroundSize = `${productImage.width * cx}px ${productImage.height * cy}px`;
        zoomResult.style.backgroundPosition = `-${x * cx}px -${y * cy}px`;
    }

    function getCursorPos(event) {
        const rect = productImage.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return { x: x, y: y };
    }

    function throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return function () {
            const context = this;
            const args = arguments;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function () {
                    if (Date.now() - lastRan >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }
});

//Review Page


let currentUserId = 'Dxdiag01';


async function loadReviews(productId) {
    try {
        const response = await fetch(`https://localhost:7074/api/ProductReviews/product/${productId}`);
        if (!response.ok) throw new Error('Yorumlar yüklenemedi');
        const reviews = await response.json();

        const reviewsContainer = document.getElementById('reviewsContainer');
        reviewsContainer.innerHTML = '';

        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p class="no-reviews">Bu ürün için henüz yorum yapılmamış.</p>';
            return;
        }

        const averageRating = reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length;
        updateAverageRating(averageRating);

        reviews.forEach(review => {
            const reviewElement = createReviewElement(review);
            reviewsContainer.appendChild(reviewElement);
        });
    } catch (error) {
        console.error('Yorum yükleme hatası:', error);
        document.getElementById('reviewsContainer').innerHTML =
            '<p class="error-message">Yorumlar yüklenirken bir hata oluştu.</p>';
    }
}


function createReviewElement(review) {
    const reviewDiv = document.createElement('div');
    reviewDiv.className = 'review__item';

    const formattedDate = new Date(review.createdAt).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    reviewDiv.innerHTML = `
        <div class="review__header">
            <div class="review__author">
                <span class="author__name">${review.user.userName}</span>
                ${review.isVerified ? '<span class="verified-badge">✓ Onaylı Alışveriş</span>' : ''}
            </div>
            <div class="review__rating">
                ${createStarRating(review.rating)}
            </div>
            <div class="review__date">${formattedDate}</div>
        </div>
        <div class="review__content">
            ${review.comment}
        </div>
        ${review.images && review.images.length > 0 ? createReviewImages(review.images) : ''}
        ${review.user.userId === currentUserId ? createReviewActions(review.productReviewId) : ''}
    `;

    return reviewDiv;
}


function createStarRating(rating) {
    return Array(5).fill(0).map((_, index) =>
        `<i class="fi ${index < rating ? 'fi-rs-star active' : 'fi-rs-star'}"></i>`
    ).join('');
}

function createReviewImages(images) {
    return `
        <div class="review__images">
            ${images.map(img => `
                <div class="review__image-wrapper">
                    <img src="${img.imageUrl}" alt="Yorum Görseli" class="review__image">
                </div>
            `).join('')}
        </div>
    `;
}

function createReviewActions(reviewId) {
    return `
        <div class="review__actions">
            <button class="btn btn--sm edit-review" data-review-id="${reviewId}">
                <i class="fi fi-rs-edit"></i> Düzenle
            </button>
            <button class="btn btn--sm delete-review" data-review-id="${reviewId}">
                <i class="fi fi-rs-trash"></i> Sil
            </button>
        </div>
    `;
}

function updateAverageRating(averageRating) {
    const ratingDisplay = document.querySelector('.product__rating');
    if (ratingDisplay) {
        ratingDisplay.innerHTML = createStarRating(Math.round(averageRating));
        ratingDisplay.setAttribute('title', `Ortalama Puan: ${averageRating.toFixed(1)}`);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const reviewForm = document.getElementById('reviewForm');
    const ratingStars = document.querySelectorAll('.rate__product .fi-rs-star');
    let selectedRating = 0;

    ratingStars.forEach((star, index) => {
        star.addEventListener('mouseover', () => {
            updateStars(index);
        });

        star.addEventListener('click', () => {
            selectedRating = index + 1;
            updateStars(index);
        });

        star.addEventListener('mouseout', () => {
            updateStars(selectedRating - 1);
        });
    });

    function updateStars(index) {
        ratingStars.forEach((star, i) => {
            star.classList.toggle('active', i <= index);
        });
    }

    reviewForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('productId');

        if (!selectedRating) {
            showAlert('Lütfen bir puan seçin', 'error');
            return;
        }

        const formData = {
            productId: parseInt(productId),
            userId: currentUserId,
            rating: selectedRating,
            comment: document.getElementById('reviewComment').value,
            imageUrls: []
        };

        try {
            const response = await fetch('https://localhost:7074/api/ProductReviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            showAlert('Yorumunuz başarıyla eklendi!', 'success');
            reviewForm.reset();
            selectedRating = 0;
            updateStars(-1);
            loadReviews(productId);

        } catch (error) {
            console.error('Yorum gönderme hatası:', error);
            showAlert('Yorum gönderilirken bir hata oluştu.', 'error');
        }
    });

    // DELETE review
    document.getElementById('reviewsContainer').addEventListener('click', async function (e) {
        if (e.target.classList.contains('delete-review') ||
            e.target.closest('.delete-review')) {
            const button = e.target.classList.contains('delete-review') ?
                e.target : e.target.closest('.delete-review');
            const reviewId = button.dataset.reviewId;

            if (confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
                try {
                    const response = await fetch(`https://localhost:7074/api/ProductReviews/${reviewId}?userId=${currentUserId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) throw new Error('Yorum silinemedi');

                    showAlert('Yorum başarıyla silindi', 'success');
                    const urlParams = new URLSearchParams(window.location.search);
                    loadReviews(urlParams.get('productId'));
                } catch (error) {
                    console.error('Yorum silme hatası:', error);
                    showAlert('Yorum silinirken bir hata oluştu', 'error');
                }
            }
        }
    });
});


function showAlert(message, type = 'info') {
    Swal.fire({
        text: message,
        icon: type,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}

// load reviews when the page is loaded
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('productId');
    if (productId) {
        loadReviews(productId);
    }
});




//Discounted Products


const discountedApiUrl = 'https://localhost:7074/api/products/discounted';

async function fetchDiscountedProducts() {
    try {
        const response = await fetch(discountedApiUrl);

        if (!response.ok) {
            throw new Error(`HTTP Hatası: ${response.status}`);
        }

        const products = await response.json();
        console.log("İndirimli Ürünler:", products);

        const productList = document.querySelector('#discounted__container');

        if (!products.length) {
            productList.innerHTML = '<p>İndirimli ürün bulunamadı.</p>';
            return;
        }

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product__item');
            productCard.innerHTML = `
               <div class="product__banner">
                    <a href="details.html" class="product__images">
                        <img src="${product.defaultImage}" alt="${product.name}" class="product__img default" />
                        <img src="${product.hoverImage}" alt="${product.name}" class="product__img hover" />
                    </a>
                    <div class="product__actions">
                        <a href="#" class="action__btn" aria-label="Göz at">
                            <i class="fi fi-rs-eye"></i>
                        </a>
                        <a href="#" class="action__btn" aria-label="İstek Listesine Kaydet" onclick="addToWishlist(${product.productId}, 1)"> 
                            <i class="fi fi-rs-heart"></i>
                        </a>
                        <a href="#" class="action__btn" aria-label="Kıyasla">
                            <i class="fi fi-rs-shuffle"></i>
                        </a>
                    </div>
                    <div class="product__badge light-pink">-${product.discountPercentage}%</div>
                </div>
                <div class="product__content">
                    <span class="product__category">${product.category || 'Kategori Yok'}</span>
                    <a href="details.html">
                        <h3 class="product__title">${product.name}</h3>
                    </a>
                    <div class="product__rating">
                        <i class="fi fi-rs-star"></i>
                        <i class="fi fi-rs-star"></i>
                        <i class="fi fi-rs-star"></i>
                        <i class="fi fi-rs-star"></i>
                        <i class="fi fi-rs-star"></i>
                    </div>
                    <div class="product__price flex">
                        <span class="new__price">${product.price}₺</span>
                        <span class="old__price">${product.oldPrice || ''}</span>
                    </div>
                    <a href="#" class="action__btn cart__btn add-to-cart" 
                        data-product-id="${product.productId}"
                        aria-label="Sepete Ekle">
                        <i class="fi fi-rs-shopping-bag-add"></i>
                    </a>
                </div>
            `;
            productList.appendChild(productCard);
        });

    } catch (error) {
        console.error('İndirimli ürünler alınırken bir hata oluştu:', error);
        const productList = document.querySelector('#discounted__container');
        productList.innerHTML = '<p>İndirimli ürünler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.</p>';
    }
}

document.addEventListener('DOMContentLoaded', fetchDiscountedProducts);

