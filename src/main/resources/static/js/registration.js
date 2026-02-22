document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    if(isAuthenticated()) {
        window.location.href='/';
    }

    const birthDateInput = document.getElementById('birthDate');
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 100);
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() - 18);

    birthDateInput.min = formatDate(minDate);
    birthDateInput.max = formatDate(maxDate);

    registerForm.addEventListener('submit', async function(e ) {
        e.preventDefault();

        errorMessage.classList.add('d-none');
        successMessage.classList.add('d-none');

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if(password != confirmPassword) {
            showError('Пароли не совпадают');
            return;
        }

        if(password.length < 7) {
            showError("Пароль должен содержать минимум 7 символов");
            return;
        }

        const formData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: password,
            role: document.querySelector('input[name="role"]:checked').value,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            birthDate: document.getElementById('birthDate').value
        }

        if (!/^[A-ZА-Я]/.test(formData.firstName)) {
            showError('Имя должно начинаться с заглавной буквы');
            return;
        }

        if (!/^[A-ZА-Я]/.test(formData.lastName)) {
            showError('Фамилия должна начинаться с заглавной буквы');
            return;
        }

        // Проверка логина (только буквы и цифры)
        if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
            showError('Логин должен содержать только буквы и цифры');
            return;
        }

        if (formData.username.length < 5) {
            showError('Логин должен содержать минимум 5 символов');
            return;
        }

        try {
            // Отправляем запрос на регистрацию
            const response = await fetch('/api/auth/registration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Регистрация успешна
                showSuccess('Регистрация успешна! Вы будете перенаправлены...');

                // Сохраняем токен
                saveToken(data.token, data.username, data.role);

                // Редирект через 2 секунды
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);

            } else {
                // Ошибка регистрации
                showError(data.message || 'Ошибка регистрации');
            }

        } catch (error) {
            showError('Ошибка сети или сервера');
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.remove('d-none');
    }

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

})