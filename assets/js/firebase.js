import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0FkCaNQlsatTzvAUc1TMSzx9T3E3Dr9k",
  authDomain: "fullstackproje-b3025.firebaseapp.com",
  projectId: "fullstackproje-b3025",
  storageBucket: "fullstackproje-b3025.appspot.com",
  messagingSenderId: "375444689674",
  appId: "1:375444689674:web:70609f2b75e5bd2014a0f3",
  measurementId: "G-HPQCL108QF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function showSuccessAlert(title, message, redirectUrl = null) {
  Swal.fire({
    icon: 'success',
    title: title,
    text: message,
    timer: 2000,
    showConfirmButton: false,
    position: 'top-end',
    toast: true
  }).then(() => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  });
}

function showErrorAlert(title, message) {
  Swal.fire({
    icon: 'error',
    title: title,
    text: message,
    position: 'top-end',
    toast: true,
    showConfirmButton: true,
    confirmButtonColor: '#d33'
  });
}

// User Register
export const registerUser = async (username, email, password, confirmPassword) => {
  try {
    
    if (!username || username.trim() === "") {
      showErrorAlert("Hata!", "Kullanıcı adı boş bırakılamaz!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showErrorAlert("Hata!", "Lütfen geçerli bir email adresi girin.");
      return;
    }

    if (password.length < 6) {
      showErrorAlert("Hata!", "Şifre en az 6 karakter olmalıdır!");
      return;
    }

    if (password !== confirmPassword) {
      showErrorAlert("Hata!", "Şifreler eşleşmiyor!");
      return;
    }

    // Register firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken();

    // Register to SQL
    const response = await fetch('https://localhost:7074/api/User/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        email: email,
        userName: username,
        password: password
      })
    });

    if (!response.ok) {
      await user.delete();
      const errorData = await response.json();
      throw new Error(errorData.message || 'Backend kayıt hatası');
    }

    localStorage.setItem("accessToken", idToken);
    showSuccessAlert("Kayıt Başarılı!", `Hoş geldiniz ${username}`, "index.html");
    updateHeaderForLoggedInUser(user);

    return {
      uid: user.uid,
      email: user.email,
      username: username,
    };

  } catch (error) {
    console.error("Kayıt hatası:", error);
    let errorMessage = "Beklenmeyen bir hata oluştu.";

    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage = "Bu email zaten kullanımda!";
        break;
      case "auth/invalid-email":
        errorMessage = "Geçersiz email formatı!";
        break;
      case "auth/operation-not-allowed":
        errorMessage = "Kayıt işlemi şu anda devre dışı!";
        break;
      default:
        errorMessage = error.message;
    }
    showErrorAlert("Kayıt Hatası!", errorMessage);
  }
};

//Login User
export const loginUser = async (email, password) => {
  try {
    if (!email || !password) {
      showErrorAlert("Hata!", "Lütfen email ve şifreyi doldurun!");
      return;
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken();
    
    localStorage.setItem("accessToken", idToken);
    showSuccessAlert("Giriş Başarılı!", `Hoş geldiniz, ${user.email}`, "index.html");
    updateHeaderForLoggedInUser(user);

    return user;

  } catch (error) {
    console.error("Giriş hatası:", error);
    let errorMessage = "Giriş yapılırken bir hata oluştu.";

    switch (error.code) {
      case "auth/wrong-password":
        errorMessage = "Hatalı şifre girdiniz!";
        break;
      case "auth/user-not-found":
        errorMessage = "Bu email adresi ile kayıtlı kullanıcı bulunamadı.";
        break;
      default:
        errorMessage = error.message;
    }
    showErrorAlert("Giriş Hatası!", errorMessage);
  }
};

// Logout User
export const logoutUser = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem("accessToken");
    updateHeaderForLoggedOutUser();
    
    showSuccessAlert("Çıkış Yapıldı!", "Başarıyla çıkış yaptınız.", "login-register.html");

  } catch (error) {
    console.error("Çıkış hatası:", error);
    showErrorAlert("Çıkış Hatası!", "Çıkış yapılırken bir hata oluştu.");
  }
};

export async function changeUserPassword(currentPassword, newPassword) {
  const user = auth.currentUser;

  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);

    const idToken = await user.getIdToken();
    const response = await fetch('https://localhost:7074/api/User/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword: newPassword
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Backend şifre güncellemesi başarısız');
    }

    showSuccessAlert("Başarılı!", "Şifreniz başarıyla güncellendi.");
    return true;

  } catch (error) {
    console.error("Şifre değişikliği hatası:", error);
    showErrorAlert("Şifre Değiştirme Hatası!", "Şifre değiştirilirken bir hata oluştu. Lütfen mevcut şifrenizi kontrol edin.");
    throw error;
  }
}

function updateHeaderForLoggedInUser(user) {
  const headerTopAction = document.querySelector('.header__top-action');
  
  if (headerTopAction) {
      const username = user.email.split('@')[0];
      const initial = username.charAt(0).toUpperCase();
      const hue = Math.abs(username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360);
      const avatarColor = `hsl(${hue}, 70%, 50%)`;

      headerTopAction.innerHTML = `
          <div class="header__user-icon">
              <div class="header__user-avatar-initial" style="background-color: ${avatarColor}">
                  ${initial}
              </div>
              <div class="header__user-menu">
                  <div class="header__user-menu-header">
                      <div class="header__user-name">${username}</div>
                      <div class="header__user-email">${user.email}</div>
                  </div>
                  <a href="accounts.html" class="header__user-menu-item">
                      <i class="fi fi-rs-user"></i>
                      Hesabım
                  </a>
                  <a href="accounts.html?tab=orders" class="header__user-menu-item">
                      <i class="fi fi-rs-shopping-bag"></i>
                      Siparişlerim
                  </a>
                  <a href="accounts.html?tab=update-profile" class="header__user-menu-item">
                      <i class="fi fi-rs-edit"></i>
                      Profili Güncelle
                  </a>
                  <a href="#" class="header__user-menu-item logout" onclick="logoutUser()">
                      <i class="fi fi-rs-sign-out"></i>
                      Çıkış Yap
                  </a>
              </div>
          </div>
      `;

      // User menü for header
      const userIcon = headerTopAction.querySelector('.header__user-icon');
      const userMenu = headerTopAction.querySelector('.header__user-menu');

      if (userIcon && userMenu) {
          userIcon.addEventListener('click', function(e) {
              e.stopPropagation();
              userMenu.classList.toggle('active');
          });

          document.addEventListener('click', function(e) {
              if (!userIcon.contains(e.target)) {
                  userMenu.classList.remove('active');
              }
          });
      }
  }
}

function switchTab(targetId) {
  // Waiting for loading page
  setTimeout(() => {
      const tabButton = document.querySelector(`.account__tab[data-target="${targetId}"]`);
      if (tabButton) {
          document.querySelectorAll('.account__tab').forEach(t => {
              t.classList.remove('active-tab');
          });
          tabButton.classList.add('active-tab');

          document.querySelectorAll('.tab__content').forEach(content => {
              content.classList.remove('active-tab');
          });
          const targetContent = document.querySelector(targetId);
          if (targetContent) {
              targetContent.classList.add('active-tab');
          }
      }
  }, 100); 
}

window.switchTab = switchTab;

function handleTabNavigation(tabId) {
  if (window.location.pathname.includes('accounts.html')) {
      const targetTab = document.querySelector(`[data-target="#${tabId}"]`);
      if (targetTab) {
          document.querySelectorAll('.account__tab').forEach(tab => {
              tab.classList.remove('active-tab');
          });
          targetTab.classList.add('active-tab');
          
          document.querySelectorAll('.tab__content').forEach(content => {
              content.classList.remove('active-tab');
          });
          document.querySelector(`#${tabId}`).classList.add('active-tab');
      }
  }
}

window.handleTabNavigation = handleTabNavigation;

function updateHeaderForLoggedOutUser() {
  const headerTopAction = document.querySelector('.header__top-action');
  
  if (headerTopAction) {
      headerTopAction.innerHTML = `
          <a href="login-register.html" class="header__login-btn">
              <i class="fi fi-rs-user"></i>
              <span>Giriş Yap / Kayıt Ol</span>
          </a>
      `;
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Kullanıcı oturum açtı:", user.email);
    updateHeaderForLoggedInUser(user);
  } else {
    console.log("Kullanıcı oturum kapattı.");
    updateHeaderForLoggedOutUser();
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.querySelector('.register .form');
  const loginForm = document.querySelector('.login .form');

  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('register-username').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm-password').value;

      await registerUser(username, email, password, confirmPassword);
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      await loginUser(email, password);
    });
  }
});
window.logoutUser = logoutUser;
