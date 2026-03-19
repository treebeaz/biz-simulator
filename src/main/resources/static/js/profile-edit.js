let originalData = {};
let isLoading = false;

document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) {
        return;
    }
    loadCurrentProfile();
    setupEventListeners();
});

function checkAuth() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/auth/login';
        return false;
    }
    return true;
}

function getAuthHeaders() {
    const token = localStorage.getItem('jwtToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function setupEventListeners() {
    const showPasswords = document.getElementById('showPasswords');
    if (showPasswords) {
        showPasswords.addEventListener('change', function(e) {
            const type = e.target.checked ? 'text' : 'password';
            const currentPassword = document.getElementById('currentPassword');
            const newPassword = document.getElementById('newPassword');
            const confirmPassword = document.getElementById('confirmPassword');
            if (currentPassword) currentPassword.type = type;
            if (newPassword) newPassword.type = type;
            if (confirmPassword) confirmPassword.type = type;
        });
    }

    const newPassword = document.getElementById('newPassword');
    if (newPassword) {
        newPassword.addEventListener('input', checkPasswordStrength);
    }
}

async function loadCurrentProfile() {
    try {
        showLoading(true);

        const response = await fetch('/api/user/profile', {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error();
        }

        const profileData = await response.json();

        originalData = {
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            username: profileData.username || '',
            email: profileData.email || ''
        };

        const firstName = document.getElementById('firstName');
        const lastName = document.getElementById('lastName');
        const usernameDisplay = document.getElementById('usernameDisplay');
        const currentEmail = document.getElementById('currentEmail');

        if (firstName) firstName.value = originalData.firstName;
        if (lastName) lastName.value = originalData.lastName;
        if (usernameDisplay) usernameDisplay.value = originalData.username;
        if (currentEmail) currentEmail.value = originalData.email || 'Не указан';

        const role = localStorage.getItem('userRole');
        const roleDisplay = document.getElementById('roleDisplay');
        if (roleDisplay) {
            roleDisplay.value =
                role === 'STUDENT' ? 'Студент' :
                    role === 'TEACHER' ? 'Преподаватель' : 'Пользователь';
        }
    } catch (error) {
        showMessage('Не удалось загрузить данные профиля', 'danger');
    } finally {
        showLoading(false);
    }
}

function checkPasswordStrength() {
    const password = document.getElementById('newPassword')?.value || '';
    const strengthBar = document.getElementById('passwordStrength');
    if (!strengthBar) return;

    if (!password) {
        strengthBar.className = 'password-strength';
        strengthBar.style.width = '0%';
        return;
    }

    let strength = 0;
    if (password.length >= 7) strength += 1;
    if (password.length >= 10) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

    if (strength <= 2) {
        strengthBar.className = 'password-strength password-weak';
    } else if (strength <= 4) {
        strengthBar.className = 'password-strength password-medium';
    } else {
        strengthBar.className = 'password-strength password-strong';
    }
}

async function saveChanges() {
    if (isLoading) return;

    try {
        hideMessage();

        const firstName = (document.getElementById('firstName')?.value || '').trim();
        const lastName = (document.getElementById('lastName')?.value || '').trim();
        const currentPassword = document.getElementById('currentPassword')?.value || '';
        const newEmail = (document.getElementById('newEmail')?.value || '').trim();
        const newPassword = document.getElementById('newPassword')?.value || '';
        const confirmPassword = document.getElementById('confirmPassword')?.value || '';

        if (!firstName || !lastName) {
            showMessage('Имя и фамилия обязательны', 'danger');
            return;
        }

        if (!currentPassword) {
            showMessage('Текущий пароль обязателен', 'danger');
            return;
        }

        if (firstName && !/^[A-ZА-Я]/.test(firstName)) {
            showMessage('Имя должно начинаться с заглавной буквы', 'danger');
            return;
        }

        if (lastName && !/^[A-ZА-Я]/.test(lastName)) {
            showMessage('Фамилия должна начинаться с заглавной буквы', 'danger');
            return;
        }

        if (newPassword && newPassword.length < 7) {
            showMessage('Новый пароль должен быть не менее 7 символов', 'danger');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('Пароли не совпадают', 'danger');
            return;
        }

        if (newEmail && !isValidEmail(newEmail)) {
            showMessage('Введите корректный email', 'danger');
            return;
        }

        const updateData = {};
        if (newEmail && newEmail !== originalData.email) {
            updateData.email = newEmail;
        }
        if (newPassword) {
            updateData.password = newPassword;
        }

        const hasChanges = Object.keys(updateData).length > 0 ||
            firstName !== originalData.firstName ||
            lastName !== originalData.lastName;

        if (!hasChanges) {
            showMessage('Нет изменений для сохранения', 'info');
            return;
        }

        showLoading(true);

        const response = await fetch('/api/user/update-account', {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(updateData)
        });

        if (response.status === 204) {
            if (updateData.password) {
                showMessage('Пароль изменен! Войдите заново.', 'success');
                setTimeout(function() { logout(); }, 2000);
            } else {
                showMessage('Изменения успешно сохранены', 'success');
                if (updateData.email) {
                    originalData.email = updateData.email;
                }
                originalData.firstName = firstName;
                originalData.lastName = lastName;
                setTimeout(function() {
                    window.location.href = '/profile';
                }, 1500);
            }
        } else if (response.status === 400) {
            const errorData = await response.json().catch(function() { return {}; });
            showMessage(errorData.message || 'Ошибка валидации', 'danger');
        } else {
            showMessage('Ошибка сервера', 'danger');
        }
    } catch (error) {
        showMessage('Произошла ошибка', 'danger');
    } finally {
        showLoading(false);
    }
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function cancelEdit() {
    if (confirm('Отменить все изменения?')) {
        window.location.href = '/profile';
    }
}

function resetForm() {
    if (confirm('Сбросить все изменения к исходным значениям?')) {
        const firstName = document.getElementById('firstName');
        const lastName = document.getElementById('lastName');
        const newEmail = document.getElementById('newEmail');
        const currentPassword = document.getElementById('currentPassword');
        const newPassword = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        const strengthBar = document.getElementById('passwordStrength');

        if (firstName) firstName.value = originalData.firstName || '';
        if (lastName) lastName.value = originalData.lastName || '';
        if (newEmail) newEmail.value = '';
        if (currentPassword) currentPassword.value = '';
        if (newPassword) newPassword.value = '';
        if (confirmPassword) confirmPassword.value = '';
        if (strengthBar) {
            strengthBar.className = 'password-strength';
            strengthBar.style.width = '0%';
        }
        hideMessage();
    }
}

function logout() {
    localStorage.clear();
    window.location.href = '/auth/login';
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    const messageText = document.getElementById('messageText');
    if (!messageDiv || !messageText) return;

    messageText.textContent = text;
    messageDiv.className = `alert alert-${type} alert-dismissible fade show`;
    messageDiv.classList.remove('d-none');
    setTimeout(hideMessage, 5000);
}

function hideMessage() {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.classList.add('d-none');
    }
}

function showLoading(loading) {
    isLoading = loading;
    const saveButton = document.getElementById('saveButton');
    const inputs = document.querySelectorAll('input:not([readonly])');

    if (saveButton) {
        if (loading) {
            saveButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Сохранение...';
            saveButton.disabled = true;
        } else {
            saveButton.innerHTML = '<i class="bi bi-check-lg me-1"></i> Сохранить';
            saveButton.disabled = false;
        }
    }

    inputs.forEach(function(input) {
        input.disabled = loading;
    });
}

