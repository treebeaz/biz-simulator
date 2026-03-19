function saveToken(token, username, role) {
    localStorage.setItem('jwtToken', token);
    localStorage.setItem('username', username);
    localStorage.setItem('userRole', role);

    window.authToken = token;
}

function getToken() {
    return localStorage.getItem('jwtToken');
}

function isAuthenticated() {
    return getToken() !== null;
}

function getUserRole() {
    return localStorage.getItem('userRole');
}

function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function logout() {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    window.authToken = null;
    window.location.href = '/auth/login';
}

function checkAuthOnLoad() {
    if (!isAuthenticated() && !window.location.pathname.includes('/auth/')) {
        window.location.href = '/auth/login';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuthOnLoad);
} else {
    checkAuthOnLoad();
}

