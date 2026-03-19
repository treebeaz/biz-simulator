document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    if (!loginForm || !errorMessage || !errorText) return;

    if (isAuthenticated()) {
        window.location.href = "/";
        return;
    }

    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');
        if (usernameEl) usernameEl.value = savedUsername;
        if (passwordEl) passwordEl.focus();
    }

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        errorMessage.classList.add('d-none');

        const username = (document.getElementById('username')?.value || '').trim();
        const password = (document.getElementById('password')?.value || '').trim();

        if (!username || !password) {
            showError('Заполните все обязательные поля');
            return;
        }

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Вход...';
            submitBtn.disabled = true;
        }

        const isEmail = username.includes("@");
        const requestData = { password: password };
        if (isEmail) {
            requestData.email = username;
        } else {
            requestData.username = username;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            const data = await response.json().catch(function() { return {}; });

            if (response.ok) {
                saveToken(data.token, data.username, data.role);
                if (submitBtn) {
                    submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i> Успешно!';
                    submitBtn.className = 'btn btn-success w-100 mb-4';
                }
                setTimeout(function() {
                    window.location.href = '/';
                }, 1000);
            } else {
                showError(data.message || 'Неверный логин или пароль');
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            }
        } catch (error) {
            showError('Ошибка сети или сервера');
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    });

    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('d-none');
        setTimeout(function() {
            errorMessage.classList.add('d-none');
        }, 5000);
    }
});

