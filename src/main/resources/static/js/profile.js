document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) {
        return;
    }

    loadProfileData();

    // Показываем блок групп по роли
    const role = localStorage.getItem('userRole');
    if (role === 'TEACHER') {
        const teacherSection = document.getElementById('teacherGroupSection');
        if (teacherSection) {
            teacherSection.classList.remove('d-none');
        }
    } else if (role === 'STUDENT') {
        const studentSection = document.getElementById('studentGroupSection');
        if (studentSection) {
            studentSection.classList.remove('d-none');
        }
    }
});

// Проверка авторизации
function checkAuth() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/auth/login';
        return false;
    }
    return true;
}

// Получение заголовков с токеном
function getAuthHeaders() {
    const token = localStorage.getItem('jwtToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Загрузка данных профиля
async function loadProfileData() {
    try {
        // Показываем индикатор загрузки
        showLoading(true);

        // Запрос к REST API
        const response = await fetch('/api/user/profile', {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }

        const profileData = await response.json();

        // Заполняем данные профиля
        const firstNameEl = document.getElementById('profileFirstName');
        const lastNameEl = document.getElementById('profileLastName');
        const usernameEl = document.getElementById('profileUsername');
        const emailEl = document.getElementById('profileEmail');
        const nameEl = document.getElementById('profileName');
        const initialsEl = document.getElementById('profileInitials');
        const roleEl = document.getElementById('profileRole');
        const systemRoleEl = document.getElementById('profileSystemRole');

        if (firstNameEl) {
            firstNameEl.textContent = profileData.firstName || 'Не указано';
        }
        if (lastNameEl) {
            lastNameEl.textContent = profileData.lastName || 'Не указано';
        }
        if (usernameEl) {
            usernameEl.textContent = profileData.username || 'Не указано';
        }
        if (emailEl) {
            emailEl.textContent = profileData.email || 'Скрыто';
        }

        const fullName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
        if (nameEl) {
            nameEl.textContent = fullName || profileData.username;
        }

        if (initialsEl) {
            const initials = getInitials(profileData.firstName, profileData.lastName, profileData.username);
            initialsEl.textContent = initials;
        }

        const role = localStorage.getItem('userRole');
        if (roleEl) {
            roleEl.textContent =
                role === 'STUDENT' ? 'Студент' :
                    role === 'TEACHER' ? 'Преподаватель' : 'Пользователь';
        }
        if (systemRoleEl) {
            systemRoleEl.textContent =
                role === 'STUDENT' ? 'Студент (управление виртуальной компанией)' :
                    role === 'TEACHER' ? 'Преподаватель (создание и управление компаниями)' : 'Не определено';
        }

        await loadStatistics();
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        showMessage('Не удалось загрузить данные профиля. Попробуйте обновить страницу.', 'danger');
    } finally {
        showLoading(false);
    }
}

// Получение инициалов для аватара
function getInitials(firstName, lastName, username) {
    if (firstName && lastName) {
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    } else if (firstName) {
        return firstName.charAt(0).toUpperCase();
    } else if (username) {
        return username.charAt(0).toUpperCase();
    }
    return '👤';
}

// Загрузка статистики (заглушка)
async function loadStatistics() {
    const role = localStorage.getItem('userRole');
    const companiesCountEl = document.getElementById('companiesCount');
    const decisionsCountEl = document.getElementById('decisionsCount');
    const eventsCountEl = document.getElementById('eventsCount');
    const daysCountEl = document.getElementById('daysCount');

    if (role === 'STUDENT') {
        if (companiesCountEl) companiesCountEl.textContent = '1';
        if (decisionsCountEl) decisionsCountEl.textContent = '0';
        if (eventsCountEl) eventsCountEl.textContent = '0';
        if (daysCountEl) daysCountEl.textContent = '1';
    } else if (role === 'TEACHER') {
        if (companiesCountEl) companiesCountEl.textContent = '0';
        if (decisionsCountEl) decisionsCountEl.textContent = '0';
        if (eventsCountEl) eventsCountEl.textContent = '0';
        if (daysCountEl) daysCountEl.textContent = '1';
    }
}

// Обновление профиля
function refreshProfile() {
    loadProfileData();
    showMessage('Данные профиля обновлены', 'success');
}

// Показать/скрыть сообщение
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    const messageText = document.getElementById('messageText');

    if (!messageDiv || !messageText) return;

    messageText.textContent = text;
    messageDiv.className = `alert alert-${type} alert-dismissible fade show`;
    messageDiv.classList.remove('d-none');
}

function hideMessage() {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.classList.add('d-none');
    }
}

// Показать/скрыть индикатор загрузки
function showLoading(show) {
    const elements = document.querySelectorAll('#profileFirstName, #profileLastName, #profileUsername, #profileEmail');
    elements.forEach(function(el) {
        el.textContent = show ? 'Загрузка...' : el.textContent;
    });
}

// Обновление данных при фокусе на странице
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        loadProfileData();
    }
});

// Создание группы (преподаватель)
async function createGroup() {
    if (!checkAuth()) return;

    const input = document.getElementById('groupNameInput');
    if (!input) return;

    const name = input.value.trim();
    if (!name) {
        showMessage('Введите название группы', 'danger');
        return;
    }

    try {
        const response = await fetch('/api/user/create-group', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name: name })
        });

        if (!response.ok) throw new Error();

        const data = await response.json();
        const lastGroupNameEl = document.getElementById('lastGroupName');
        const lastGroupCodeEl = document.getElementById('lastGroupCode');
        const lastGroupBlockEl = document.getElementById('lastGroupBlock');

        if (lastGroupNameEl) lastGroupNameEl.textContent = data.name;
        if (lastGroupCodeEl) lastGroupCodeEl.textContent = data.code;
        if (lastGroupBlockEl) lastGroupBlockEl.style.display = 'block';

        showMessage('Группа создана', 'success');
        input.value = '';
    } catch (e) {
        showMessage('Не удалось создать группу', 'danger');
    }
}

// Присоединение к группе (студент)
async function joinGroup() {
    if (!checkAuth()) return;

    const input = document.getElementById('joinCodeInput');
    if (!input) return;

    const joinCode = input.value.trim();
    if (!joinCode) {
        showMessage('Введите код приглашения', 'danger');
        return;
    }

    try {
        const response = await fetch('/api/user/join-group', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ joinCode: joinCode })
        });

        if (response.status === 204) {
            showMessage('Вы присоединились к группе', 'success');
            input.value = '';
            return;
        }

        const err = await response.json().catch(function() { return {}; });
        showMessage(err.message || 'Не удалось присоединиться к группе', 'danger');
    } catch (e) {
        showMessage('Не удалось присоединиться к группе', 'danger');
    }
}

