// Global state objects
let pageState = {
    headerLoaded: false,
    cartLoaded: false,
    wishlistLoaded: false,
    userLoaded: false,
    footerLoaded: false,
    newsletterLoaded: false,
    currentTime: null
};

function checkAndShowContent() {
    const { headerLoaded, cartLoaded, wishlistLoaded, userLoaded, footerLoaded, newsletterLoaded } = pageState;
    
    if (headerLoaded && cartLoaded && wishlistLoaded && userLoaded && footerLoaded && newsletterLoaded) {
        showContent();
    }
}

function showContent() {
    const headerElement = document.getElementById('header');
    const footerElement = document.getElementById('footer');
    const newsletterElement = document.getElementById('newsletter-container');
    
    headerElement?.classList.remove('content-loading');
    footerElement?.classList.remove('content-loading');
    newsletterElement?.classList.remove('content-loading');
    
    headerElement?.classList.add('content-loaded');
    footerElement?.classList.add('content-loaded');
    newsletterElement?.classList.add('content-loaded');
    
    console.log(`Content loaded for user: ${firebase.auth().currentUser?.email || 'Guest'}`);
    console.log(`Load time: ${new Date().toISOString()}`);
}

function initializeSearch() {
    const searchBtn = document.querySelector('.search__btn');
    const searchInput = document.querySelector('.form__input');
    const resultsContainer = document.querySelector('.search__results');

    if (!searchBtn || !searchInput || !resultsContainer) {
        console.error('Gerekli DOM elementleri bulunamadı');
        return;
    }

    let lastQuery = '';

    searchInput.addEventListener('input', async function() {
        const query = this.value.trim();

        if (query === lastQuery) return;
        lastQuery = query;

        if (query.length >= 2) {
            await searchProducts(query);
        } else {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
        }
    });

    searchBtn.addEventListener('click', async function() {
        const query = searchInput.value.trim();
        if (!query) {
            alert('Lütfen bir arama terimi girin!');
            return;
        }
        await searchProducts(query);
    });
}

async function searchProducts(query) {
    const resultsContainer = document.querySelector('.search__results');
    
    try {
        const response = await fetch(`https://localhost:7074/api/Products/search?query=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        const responseText = await response.text();
        let data;

        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('API yanıtı JSON formatında değil:', responseText);
            resultsContainer.innerHTML = '<div class="search__item">Arama sonuçları alınırken bir hata oluştu</div>';
            resultsContainer.style.display = 'block';
            return;
        }

        if (!response.ok) {
            if (response.status === 404) {
                resultsContainer.innerHTML = '<div class="search__item">Ürün bulunamadı</div>';
            } else if (response.status === 400) {
                resultsContainer.innerHTML = '<div class="search__item">Lütfen geçerli bir arama terimi girin</div>';
            } else {
                resultsContainer.innerHTML = '<div class="search__item">Bir hata oluştu</div>';
            }
            resultsContainer.style.display = 'block';
            return;
        }

        displayProducts(data);

    } catch (error) {
        console.error('Arama sırasında hata oluştu:', error);
        resultsContainer.innerHTML = '<div class="search__item">Bağlantı hatası oluştu</div>';
        resultsContainer.style.display = 'block';
    }
}

function displayProducts(products) {
    const resultsContainer = document.querySelector('.search__results');
    resultsContainer.innerHTML = ''; 
    
    if (products && products.length > 0) {
        products.forEach((product, index) => {
            const formattedPrice = new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY'
            }).format(product.price);

            const productElement = document.createElement('div');
            productElement.classList.add('search__item');
            
            productElement.style.animation = `fadeIn 0.2s ease-out ${index * 0.05}s`;
            
            productElement.innerHTML = `
                <div class="search__item-content">
                    <img 
                        src="${product.defaultImage || ''}" 
                        alt="${product.name}" 
                        class="search__item-image" 
                        loading="lazy"
                        onerror="this.onerror=null;this.src='/assets/img/no-image.png';"
                    />
                    <div class="search__item-details">
                        <h4 class="search__item-name">${product.name}</h4>
                        <p class="search__item-description">
                            ${product.category?.name || 'Kategori belirtilmemiş'}
                        </p>
                        <p class="search__item-price">${formattedPrice}</p>
                    </div>
                </div>
            `;

            productElement.addEventListener('click', () => {
                window.location.href = `details.html?productId=${product.productId}`;
            });

            productElement.addEventListener('mouseenter', () => {
                productElement.style.transform = 'translateY(-2px)';
                productElement.style.transition = 'transform 0.2s ease';
            });

            productElement.addEventListener('mouseleave', () => {
                productElement.style.transform = 'translateY(0)';
            });

            resultsContainer.appendChild(productElement);
        });

        resultsContainer.style.display = 'block';
        resultsContainer.classList.add('show');
        
    } else {
        const noResultElement = document.createElement('div');
        noResultElement.classList.add('search__item', 'no-results');
        noResultElement.innerHTML = `
            <div class="search__item-content">
                <div class="search__item-details" style="text-align: center;">
                    <img 
                        src="/assets/img/no-results.png" 
                        alt="Sonuç bulunamadı" 
                        style="width: 64px; height: 64px; margin-bottom: 12px;"
                    />
                    <h4 class="search__item-name">Ürün Bulunamadı</h4>
                    <p class="search__item-description">
                        Farklı anahtar kelimeler ile tekrar deneyebilirsiniz
                    </p>
                </div>
            </div>
        `;
        
        resultsContainer.appendChild(noResultElement);
        resultsContainer.style.display = 'block';
        resultsContainer.classList.add('show');
    }

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.header__search')) {
            resultsContainer.style.display = 'none';
            resultsContainer.classList.remove('show');
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  const debouncedSearch = debounce(async (query) => {
    await searchProducts(query);
  }, 300);

document.addEventListener('DOMContentLoaded', async function() {
    try {
        //Header loading
        const headerResponse = await fetch('header.html');
        const headerData = await headerResponse.text();
        const headerElement = document.getElementById('header');
        if (headerElement) {
            headerElement.innerHTML = headerData;
            pageState.headerLoaded = true;
            headerElement.classList.add('content-loading');

            initializeSearch();

        }

        // Footer loading
        const footerResponse = await fetch('footer.html');
        const footerData = await footerResponse.text();
        const footerElement = document.getElementById('footer');
        if (footerElement) {
            footerElement.innerHTML = footerData;
            pageState.footerLoaded = true;
        }

        // Newsletter loading
        const newsletterResponse = await fetch('newsletter.html');
        const newsletterData = await newsletterResponse.text();
        const newsletterElement = document.getElementById('newsletter-container');
        if (newsletterElement) {
            newsletterElement.innerHTML = newsletterData;
            pageState.newsletterLoaded = true;
        }
        const megaMenuTrigger = document.querySelector('.has-mega-menu');
        const megaMenu = document.querySelector('.mega-menu');
        
        if (window.innerWidth <= 768) {
          megaMenuTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            megaMenu.style.display = megaMenu.style.display === 'block' ? 'none' : 'block';
          });
        }

searchInput.addEventListener('input', function() {
    const query = this.value.trim();
    if (query.length >= 2) {
      debouncedSearch(query);
    }
  });  //Loading Scripts

        const cartScript = document.createElement('script');
        cartScript.type = 'module';
        cartScript.src = './cart-management.js';
        cartScript.onload = () => {
            if (typeof window.updateCartIcon === 'function') {
                window.updateCartIcon();
                pageState.cartLoaded = true;
                checkAndShowContent();
            }
        };
        document.body.appendChild(cartScript);
        
        
        const wishlistScript = document.createElement('script');
        wishlistScript.type = 'module';
        wishlistScript.src = './wishlist-management.js';
        wishlistScript.onload = async () => {
            const wishlistModule = await import('./wishlist-management.js');
            if (typeof wishlistModule.updateWishlistIcon === 'function') {
                wishlistModule.updateWishlistIcon();
                pageState.wishlistLoaded = true;
                checkAndShowContent();
            }
        };
        document.body.appendChild(wishlistScript);

       
        firebase.auth().onAuthStateChanged((user) => {
            pageState.userLoaded = true;
            pageState.currentTime = new Date().toISOString();
            console.log(`Current Date and Time (UTC): ${pageState.currentTime}`);
            console.log(`Current User's Login: ${user ? user.email : 'Guest'}`);
            checkAndShowContent();
        });

        
        initializeSearch();

    } catch (error) {
        console.error('İçerik yüklenirken bir hata oluştu:', error);
        showContent();
    }
});

 document.querySelectorAll('.account__tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.account__tab').forEach(t => t.classList.remove('active-tab'));
      this.classList.add('active-tab');
  
      const target = this.getAttribute('data-target');
      if (target) {
        document.querySelectorAll('.tab__content').forEach(content => {
          content.classList.remove('active-tab');
        });
        document.querySelector(target)?.classList.add('active-tab');
      }
    });
  });
