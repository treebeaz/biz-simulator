document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    if (isAuthenticated()) {
        window.location.href = "/";
    }

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const isEmail = username.includes("@");
        const requestData = {
            password: password
        }

        if (isEmail) {
            requestData.email = username;
        } else {
            requestData.username = username;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();
            if(response.ok) {
                saveToken(data.token, data.username, data.role);
                window.location.href = '/';
            } else {
                showError(data.message || 'Ошибка входа');
            }
        } catch (error) {
            showError('Ошибка сети или сервера');
        }

    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
    }
})