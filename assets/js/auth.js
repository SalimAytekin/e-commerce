import { registerUser, loginUser, logoutUser } from './firebase.js';


// Register click event
document.getElementById("register-btn").addEventListener("click", async (event) => {
  event.preventDefault();

  

  const username = document.getElementById("register-username").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const confirmPassword = document.getElementById("register-confirm-password").value;


  await registerUser(username, email, password, confirmPassword);
});

// Login click event
document.getElementById("login-btn").addEventListener("click", async (event) => {
  event.preventDefault();

  
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  
  await loginUser(email, password);
});

// Log out Click Event
document.getElementById("logout-btn").addEventListener("click", async (event) => {
  event.preventDefault();

  
  await logoutUser();
});


// Password update form

document.addEventListener('DOMContentLoaded', function () {

  const changePasswordForm = document.getElementById('change-password-form');
  
  if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', function (event) {
          event.preventDefault(); 

          const currentPassword = document.getElementById('current-password').value;
          const newPassword = document.getElementById('new-password').value;
          const confirmPassword = document.getElementById('confirm-password').value;

         
          if (newPassword !== confirmPassword) {
              alert("Yeni şifreler uyuşmuyor!");
              return;
          }

          console.log("Şifre güncelleme formu gönderildi");
          console.log("Mevcut Şifre:", currentPassword);
          console.log("Yeni Şifre:", newPassword);

          
      });
  }
});
