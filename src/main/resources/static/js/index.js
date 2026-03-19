document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('jwtToken');
    const username = localStorage.getItem('username');
    const userRole = localStorage.getItem('userRole');

    updateNavigation(token, username);
    updateContent(token, username, userRole);
});

function updateNavigation(token, username) {
    const navbarMenu = document.getElementById('navbarMenu');
    if (!navbarMenu) return;

    if (token && username) {
        navbarMenu.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button"
                   data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="bi bi-person-circle"></i> ${username}
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                        <a class="dropdown-item" href="/profile">
                            <i class="bi bi-person"></i> Личный кабинет
                        </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item text-danger" href="#" onclick="logoutFromIndex()">
                            <i class="bi bi-box-arrow-right"></i> Выйти
                        </a>
                    </li>
                </ul>
            </li>
        `;
    } else {
        navbarMenu.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="/auth/login">
                    <i class="bi bi-box-arrow-in-right"></i> Вход
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/auth/registration">
                    <i class="bi bi-person-plus"></i> Регистрация
                </a>
            </li>
        `;
    }
}

function updateContent(token, username) {
    const heroButtons = document.getElementById('heroButtons');
    const ctaButtons = document.getElementById('ctaButtons');
    if (!heroButtons || !ctaButtons) return;

    if (token && username) {
        heroButtons.innerHTML = `
            <a href="/profile" class="btn btn-light btn-lg me-3">
                Перейти к управлению
            </a>
            <a href="#howItWorks" class="btn btn-outline-light btn-lg">
                Как это работает
            </a>
        `;

        ctaButtons.innerHTML = `
            <a href="/profile" class="btn btn-primary btn-lg px-5">Перейти в личный кабинет</a>
        `;
    } else {
        heroButtons.innerHTML = `
            <a href="/auth/registration" class="btn btn-light btn-lg me-3">
                Начать обучение
            </a>
            <a href="#forWhom" class="btn btn-outline-light btn-lg">
                Узнать больше
            </a>
        `;

        ctaButtons.innerHTML = `
            <a href="/auth/login" class="btn btn-primary btn-lg px-5">Войти</a>
            <a href="/auth/registration" class="btn btn-outline-primary btn-lg px-5">Регистрация</a>
        `;
    }
}

function logoutFromIndex() {
    if (confirm('Вы уверены, что хотите выйти из системы?')) {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        window.location.href = '/';
    }
}

