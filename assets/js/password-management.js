import { changeUserPassword } from './firebase.js';

document.getElementById('change-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (newPassword !== confirmPassword) {
    alert('Yeni şifreler eşleşmiyor');
    return;
  }

  try {
    await changeUserPassword(currentPassword, newPassword);
    alert('Şifre başarıyla değiştirildi');
    e.target.reset();
  } catch (error) {
    alert('Şifre değişikliği başarısız: ' + error.message);
  }
});