import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


const addressForm = document.getElementById('address-form');
const titleInput = document.getElementById('address-type');
const toggleFormBtn = document.getElementById('toggle-address-form');
const cancelBtn = document.getElementById('cancel-address-btn');


const auth = getAuth();
let currentUser = null;
let accessToken = null;

auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        accessToken = await user.getIdToken();
        loadAddresses(); 
    } else {
        currentUser = null;
        accessToken = null;
    }
});

// Title Controle
titleInput.addEventListener('blur', async function() {
    if (!currentUser || !this.value.trim()) return;

    try {
        const response = await fetch(`https://localhost:7074/api/Address/CheckTitle?title=${encodeURIComponent(this.value.trim())}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();

        if (data.exists) {
            alert(`"${this.value}" başlığı ile bir adresiniz zaten var.\nMevcut adres: ${data.existingAddress.city}, ${data.existingAddress.district}\nLütfen farklı bir başlık kullanın.`);
            this.value = '';
            this.focus();
        }
    } catch (error) {
        console.error('Başlık kontrolü sırasında hata:', error);
    }
});


async function addAddress(event) {
    event.preventDefault();
    
    if (!currentUser) {
        alert("Lütfen önce giriş yapın.");
        return;
    }

    const formData = {
        Title: titleInput.value.trim(),
        FullAddress: document.getElementById('address-details').value.trim(),
        City: document.getElementById('address-city').value.trim(),
        District: document.getElementById('address-district').value.trim(),
        PostalCode: document.getElementById('address-postalCode').value.trim(),
        IsDefault: document.getElementById('address-default').checked
    };

  
    if (!/^\d{5}$/.test(formData.PostalCode)) {
        alert("Posta kodu 5 haneli sayı olmalıdır");
        return;
    }

    try {
        accessToken = await currentUser.getIdToken(true);

        const response = await fetch('https://localhost:7074/api/Address/AddAddress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(formData)
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || 'Adres eklenirken bir hata oluştu');
        }

        alert('Adres başarıyla eklendi');
        addressForm.reset();
        addressForm.style.display = 'none';
        loadAddresses();

    } catch (error) {
        console.error('Hata:', error);
        alert(error.message);
    }
}


async function loadAddresses() {
    if (!currentUser || !accessToken) return;

    try {
        const response = await fetch('https://localhost:7074/api/Address/GetAddresses', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Adresler yüklenemedi');
        }

        const addresses = await response.json();
        displayAddresses(addresses);
    } catch (error) {
        console.error('Hata:', error);
    }
}


function displayAddresses(addresses) {
    const container = document.getElementById('saved-addresses');
    if (!container) return;

    if (addresses.length === 0) {
        container.innerHTML = '<p>Henüz kayıtlı adresiniz bulunmamaktadır.</p>';
        return;
    }

    container.innerHTML = addresses.map(address => `
        <div class="address-card ${address.isDefault ? 'address-card--default' : ''}">
            <div class="address-card__header">
                <span class="address-type">${address.title}</span>
                ${address.isDefault ? '<span class="default-badge">Varsayılan</span>' : ''}
            </div>
            <address class="address">
                <span class="address-details">${address.fullAddress}</span><br>
                <span class="address-city">${address.district} / ${address.city}</span><br>
                <span class="address-zip">${address.postalCode}</span>
            </address>
            <div class="address-card__actions">
                ${!address.isDefault ? `
                    <button class="btn btn--sm btn--outline" onclick="setDefaultAddress(${address.addressId})">
                        <i class="fi fi-rs-check"></i> Varsayılan Yap
                    </button>
                ` : ''}
                <button class="btn btn--sm" onclick="editAddress(${address.addressId})">
                    <i class="fi fi-rs-edit"></i> Düzenle
                </button>
                <button class="btn btn--sm" onclick="deleteAddress(${address.addressId})">
                    <i class="fi fi-rs-trash"></i> Sil
                </button>
            </div>
        </div>
    `).join('');
}


let currentEditId = null;

async function editAddress(addressId) {
    currentEditId = addressId;
    const modal = document.getElementById('edit-address-modal');
    
    try {
        accessToken = await currentUser.getIdToken(true);
        const response = await fetch(`https://localhost:7074/api/Address/GetAddresses`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const addresses = await response.json();
        const address = addresses.find(a => a.addressId === addressId);
        
        if (address) {
            document.getElementById('edit-address-type').value = address.title;
            document.getElementById('edit-address-city').value = address.city;
            document.getElementById('edit-address-district').value = address.district;
            document.getElementById('edit-address-details').value = address.fullAddress;
            document.getElementById('edit-address-postalCode').value = address.postalCode;
            document.getElementById('edit-address-default').checked = address.isDefault;
            
            modal.style.display = 'block';
        }
    } catch (error) {
        console.error('Hata:', error);
        alert('Adres bilgileri yüklenirken bir hata oluştu');
    }
}

async function updateAddress(event) {
    event.preventDefault();
    
    if (!currentUser || !currentEditId) return;
    
    const formData = {
        Title: document.getElementById('edit-address-type').value.trim(),
        FullAddress: document.getElementById('edit-address-details').value.trim(),
        City: document.getElementById('edit-address-city').value.trim(),
        District: document.getElementById('edit-address-district').value.trim(),
        PostalCode: document.getElementById('edit-address-postalCode').value.trim(),
        IsDefault: document.getElementById('edit-address-default').checked
    };

   
    if (!/^\d{5}$/.test(formData.PostalCode)) {
        alert("Posta kodu 5 haneli sayı olmalıdır");
        return;
    }

    try {
        accessToken = await currentUser.getIdToken(true);
        
        const response = await fetch(`https://localhost:7074/api/Address/UpdateAddress/${currentEditId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Adres güncellenirken bir hata oluştu');
        }

        alert('Adres başarıyla güncellendi');
        closeEditModal();
        loadAddresses();
    } catch (error) {
        console.error('Hata:', error);
        alert(error.message);
    }
}


async function deleteAddress(addressId) {
    if (!confirm('Bu adresi silmek istediğinizden emin misiniz?')) return;
    
    try {
        accessToken = await currentUser.getIdToken(true);
        
        const response = await fetch(`https://localhost:7074/api/Address/DeleteAddress/${addressId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Adres silinirken bir hata oluştu');
        }

        alert('Adres başarıyla silindi');
        loadAddresses();
    } catch (error) {
        console.error('Hata:', error);
        alert(error.message);
    }
}


async function setDefaultAddress(addressId) {
    try {
        accessToken = await currentUser.getIdToken(true);
        
        const response = await fetch(`https://localhost:7074/api/Address/SetDefaultAddress/${addressId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Varsayılan adres ayarlanırken bir hata oluştu');
        }

        loadAddresses();
    } catch (error) {
        console.error('Hata:', error);
        alert(error.message);
    }
}

// Form and modal 
function closeEditModal() {
    const modal = document.getElementById('edit-address-modal');
    modal.style.display = 'none';
    currentEditId = null;
}

// Event Listeners
if (addressForm) {
    addressForm.addEventListener('submit', addAddress);
}

if (toggleFormBtn) {
    toggleFormBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addressForm.style.display = addressForm.style.display === 'none' || 
                                  addressForm.style.display === '' ? 'block' : 'none';
    });
}

if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
        addressForm.style.display = 'none';
        addressForm.reset();
    });
}

document.getElementById('edit-address-form').addEventListener('submit', updateAddress);

// Global 
window.editAddress = editAddress;
window.deleteAddress = deleteAddress;
window.setDefaultAddress = setDefaultAddress;


document.addEventListener('DOMContentLoaded', () => {
    if (auth.currentUser) {
        loadAddresses();
    }
});