// Сохранение токена
function saveToken(token, username, role) {
    localStorage.setItem('jwtToken', token);
    localStorage.setItem('username', username);
    localStorage.setItem('userRole', role);

    window.authToken = token;
}

// Получение токена
function getToken() {
    return localStorage.getItem('jwtToken');
}

// Проверка на авторизацию пользователя
function isAuthenticated() {
    return getToken() !== null;
}

// Получение роли пользователя
function getUserRole() {
    return localStorage.getItem('userRole');
}

// Получение заголовков с токеном для API запросов
function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Выход из системы
function logout() {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    window.authToken = null;
    window.location.href = '/auth/login';
}

// Проверка токена при загрузке страницы
function checkAuthOnLoad() {
    if (!isAuthenticated() && !window.location.pathname.includes('/auth/')) {
        window.location.href = '/auth/login';
    }
}

// Запуск проверки при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuthOnLoad);
} else {
    checkAuthOnLoad();
}

