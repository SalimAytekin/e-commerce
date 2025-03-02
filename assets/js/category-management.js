const api = {
    async getCategories() {
        try {
            const response = await fetch('https://localhost:7074/api/Products/categories');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Kategoriler yüklenirken hata:', error);
            throw error;
        }
    },

    async getProductsByCategory(categoryId) {
        try {
            const response = await fetch(`https://localhost:7074/api/Products/${categoryId}/products`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Ürünler yüklenirken hata:', error);
            throw error;
        }
    }
};

let categorySwiper = null;

function updateURL(categoryId, categoryName) {
    const url = new URL(window.location);
    url.searchParams.set('category', categoryId);
    window.history.pushState({}, '', url);
}

async function loadAndDisplayCategories() {
    try {
        if (categorySwiper) {
            categorySwiper.destroy(true, true);
        }

        const categories = await api.getCategories();
        const wrapper = document.getElementById('categoriesWrapper');
        
        if (!categories || categories.length === 0) {
            wrapper.innerHTML = '<div class="swiper-slide"><div class="no-categories">Kategori bulunamadı.</div></div>';
            return;
        }

        wrapper.innerHTML = categories.map(category => `
            <div class="swiper-slide">
                <div class="category__item" data-category-id="${category.categoryId}">
                    <img src="${category.imageUrl || 'assets/img/default-category.jpg'}" 
                         alt="${category.name}" 
                         class="category__img">
                    <h3 class="category__title">${category.name}</h3>
                </div>
            </div>
        `).join('');

        initializeSwipers();
        addCategoryClickListeners();
        
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get('category');
        
        if (categoryId) {
            const categoryItem = document.querySelector(`[data-category-id="${categoryId}"]`);
            if (categoryItem) {
                categoryItem.click();
            }
        } else if (categories.length > 0) {
           
            const firstCategory = document.querySelector('.category__item');
            if (firstCategory) {
                firstCategory.classList.add('active');
                await loadProductsByCategory(
                    firstCategory.dataset.categoryId,
                    firstCategory.querySelector('.category__title').textContent
                );
            }
        }
    } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
        const wrapper = document.getElementById('categoriesWrapper');
        wrapper.innerHTML = '<div class="swiper-slide"><div class="error-message">Kategoriler yüklenirken bir hata oluştu.</div></div>';
    }
}

async function loadProductsByCategory(categoryId, categoryName) {
    try {
        const productsGrid = document.getElementById('productsGrid');
        productsGrid.innerHTML = '<div class="loading">Ürünler yükleniyor...</div>';

        const products = await api.getProductsByCategory(categoryId);
        
     
        const categoryTitle = document.getElementById('categoryTitle');
        if (categoryTitle) {
            categoryTitle.textContent = `${categoryName} Ürünleri`;
        }

        if (!products || products.length === 0) {
            productsGrid.innerHTML = '<div class="no-products">Bu kategoride ürün bulunmamaktadır.</div>';
            return;
        }

        productsGrid.innerHTML = products.map(product => `
            <article class="product__card">
                <div class="product__banner">
                    <a href="details.html?productId=${product.productId}" class="product__images">
                        <img src="${product.defaultImage}" alt="${product.name}" class="product__img default" />
                        <img src="${product.hoverImage}" alt="${product.name}" class="product__img hover" />
                    </a>
                    <div class="product__actions">
                        <a href="#" class="action__btn" aria-label="Göz at">
                            <i class="fi fi-rs-eye"></i>
                        </a>
                        <a href="#" class="action__btn add-to-wishlist" data-product-id="${product.productId}" aria-label="İstek Listesine Kaydet">
                            <i class="fi fi-rs-heart"></i>
                        </a>
                        <a href="#" class="action__btn" aria-label="Kıyasla">
                            <i class="fi fi-rs-shuffle"></i>
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
            </article>
        `).join('');

       
        addToCartListeners();
        addWishlistListeners();
        
    } catch (error) {
        console.error('Ürünler yüklenirken hata:', error);
        document.getElementById('productsGrid').innerHTML = 
            '<div class="error-message">Ürünler yüklenirken bir hata oluştu.</div>';
    }
}

// Listen Add to Cart Click
function addToCartListeners() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.dataset.productId;
            console.log(`Ürün sepete eklendi: ${productId}`);
        });
    });
}

// Listen Add to Whislist Click
function addWishlistListeners() {
    const wishlistButtons = document.querySelectorAll('.add-to-wishlist');
    wishlistButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.dataset.productId;
            console.log(`Ürün istek listesine eklendi: ${productId}`);
        });
    });
}

function addCategoryClickListeners() {
    const categoryItems = document.querySelectorAll('.category__item');
    categoryItems.forEach(item => {
        item.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            document.querySelectorAll('.category__item').forEach(cat => {
                cat.classList.remove('active');
            });
            this.classList.add('active');

            const categoryId = this.dataset.categoryId;
            const categoryName = this.querySelector('.category__title').textContent;
            
            updateURL(categoryId, categoryName);
            
            try {
                await loadProductsByCategory(categoryId, categoryName);
            } catch (error) {
                console.error('Kategori değiştirme hatası:', error);
            }
        });
    });
}


function initializeSwipers() {
    categorySwiper = new Swiper(".categories__container", {
        slidesPerView: 1,
        spaceBetween: 24,
        loop: true,
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        breakpoints: {
            350: {
                slidesPerView: 2,
            },
            768: {
                slidesPerView: 3,
            },
            992: {
                slidesPerView: 4,
            },
            1200: {
                slidesPerView: 5,
            },
            1400: {
                slidesPerView: 6,
            },
        },
    });
}

document.addEventListener('DOMContentLoaded', loadAndDisplayCategories);