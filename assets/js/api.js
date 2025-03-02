
//index showcase products

document.addEventListener("DOMContentLoaded", () => {
  const products = {
    "Yeni Ürünler": [
      { name: "Floral Desenli Günlük Pamuk Elbise", imageUrl: "./assets/img/showcase-img-1.jpg", newPrice: 500, oldPrice: 700 },
      { name: "Fırfırlı Düz Renk Uzun Kollu Bluz", imageUrl: "./assets/img/showcase-img-2.jpg", newPrice: 500, oldPrice: 700 },
      { name: "Çok Renkli V Yaka Tişört", imageUrl: "./assets/img/showcase-img-3.jpg", newPrice: 500, oldPrice: 700 }
    ],
    "İndirimli Ürünler ve Outlet": [
      { name: "Balina Desenli Yama Tişört", imageUrl: "./assets/img/showcase-img-4.jpg", newPrice: 500, oldPrice: 700 },
      { name: "Fintage Çiçek Desenli Elbise", imageUrl: "./assets/img/showcase-img-5.jpg", newPrice: 500, oldPrice: 700 },
      { name: "Çok Renkli Çizgili Daire Tişört", imageUrl: "./assets/img/showcase-img-6.jpg", newPrice: 500, oldPrice: 700 }
    ],
    "En Çok Satanlar": [
      { name: "Geometrik Desenli Uzun Kollu Bluz", imageUrl: "./assets/img/showcase-img-7.jpg", newPrice: 500, oldPrice: 700 },
      { name: "Baskılı Patchwork Maxi Elbise", imageUrl: "./assets/img/showcase-img-8.jpg", newPrice: 500, oldPrice: 700 },
      { name: "Papatya Desenli Çift Askılı Tulum", imageUrl: "./assets/img/showcase-img-9.jpg", newPrice: 500, oldPrice: 700 }
    ],
    "Trendy": [
      { name: "Çiçek Desenli Günlük Pamuk Elbise", imageUrl: "./assets/img/showcase-img-7.jpg", newPrice: 500, oldPrice: 700 },
      { name: "Fırfırlı Düz Renk Uzun Kollu", imageUrl: "./assets/img/showcase-img-8.jpg", newPrice: 500, oldPrice: 700 },
      { name: "Çok Renkli V Yaka Tişört", imageUrl: "./assets/img/showcase-img-9.jpg", newPrice: 500, oldPrice: 700 }
    ]
  };

  const showcaseContainer = document.querySelector('.showcase__container');

 
  for (const category in products) {

    const sectionWrapper = document.createElement('div');
    sectionWrapper.classList.add('showcase__wrapper');

    const sectionTitle = document.createElement('h3');
    sectionTitle.classList.add('section__title');
    sectionTitle.textContent = category; 

    sectionWrapper.appendChild(sectionTitle);

   
    products[category].forEach(product => {
      const showcaseItem = `
        <div class="showcase__item">
          <a href="details.html" class="showcase__img-box">
            <img src="${product.imageUrl}" alt="${product.name}" class="showcase__img" />
          </a>
          <div class="showcase__content">
            <a href="details.html">
              <h4 class="showcase__title">${product.name}</h4>
            </a>
            <div class="showcase__price flex">
              <span class="new__price">${product.newPrice} TL</span>
              <span class="old__price">${product.oldPrice} TL</span>
            </div>
          </div>
        </div>
      `;
      sectionWrapper.innerHTML += showcaseItem;
    });

    // Add to main container
    showcaseContainer.appendChild(sectionWrapper);
  }
});



/* SHOW MENU */
const navMenu = document.getElementById("nav-menu"),
navToggle = document.getElementById("nav-toggle"),
navClose = document.getElementById("nav-close");


if (navToggle) {
navToggle.addEventListener("click", () => {
  navMenu.classList.add("show-menu");
});
}

if (navClose) {
navClose.addEventListener("click", () => {
  navMenu.classList.remove("show-menu");
});
}

function imgGallery() {
const mainImg = document.querySelector(".details__img"),
  smallImg = document.querySelectorAll(".details__small-img");

smallImg.forEach((img) => {
  img.addEventListener("click", function () {
    mainImg.src = this.src;
  });
});
}

imgGallery();


/* PRODUCTS TABS */
import { logoutUser } from './firebase.js';

const accountTabs = document.querySelectorAll(".account__tab"),
accountContents = document.querySelectorAll("[content]");

accountTabs.forEach((tab) => {
tab.addEventListener("click", () => {

  if (!tab.dataset.target) {
    handleLogout();
    return;
  }

  const target = document.querySelector(tab.dataset.target);

  accountContents.forEach((content) => {
    content.classList.remove("active-tab");
  });

  target.classList.add("active-tab");

  accountTabs.forEach((t) => {
    t.classList.remove("active-tab");
  });

  tab.classList.add("active-tab");
});
});

async function handleLogout() {
  try {
      const result = await Swal.fire({
          title: 'Çıkış yapmak istediğinizden emin misiniz?',
          text: "Oturumunuz sonlandırılacak!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Evet, çıkış yap!',
          cancelButtonText: 'İptal'
      });

      if (result.isConfirmed) {
          const logoutResult = await logoutUser();
          
          if (logoutResult) {
              await Swal.fire({
                  position: 'top-end',
                  icon: 'success',
                  title: 'Başarıyla çıkış yapıldı!',
                  showConfirmButton: false,
                  timer: 1500
              });
              
            
              setTimeout(() => {
                  window.location.href = 'login-register.html';
              }, 1500);
          }
      }
  } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
      Swal.fire({
          icon: 'error',
          title: 'Hata!',
          text: 'Çıkış yapılırken bir hata oluştu!'
      });
  }
}








    