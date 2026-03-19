document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) {
        return;
    }

    loadProfileData();

    const role = localStorage.getItem('userRole');
    if (role === 'TEACHER') {
        const teacherSection = document.getElementById('teacherGroupSection');
        if (teacherSection) {
            teacherSection.classList.remove('d-none');
            loadTeacherGroups();
        }
    } else if (role === 'STUDENT') {
        const studentSection = document.getElementById('studentGroupSection');
        if (studentSection) {
            studentSection.classList.remove('d-none');
            loadStudentGroup();
        }
    }
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

async function loadProfileData() {
    try {
        showLoading(true);

        const response = await fetch('/api/user/profile', {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }

        const profileData = await response.json();

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

    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        showMessage('Не удалось загрузить данные профиля. Попробуйте обновить страницу.', 'danger');
    } finally {
        showLoading(false);
    }
}

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

function refreshProfile() {
    loadProfileData();
    showMessage('Данные профиля обновлены', 'success');
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти из системы?')) {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        window.location.href = '/auth/login';
    }
}

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

function showLoading(show) {
    const elements = document.querySelectorAll('#profileFirstName, #profileLastName, #profileUsername, #profileEmail');
    elements.forEach(function(el) {
        el.textContent = show ? 'Загрузка...' : el.textContent;
    });
}

document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        loadProfileData();
    }
});

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
        const response = await fetch('/api/groups/create', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name: name })
        });

        if (!response.ok) throw new Error();

        const data = await response.json();
        const lastGroupNameEl = document.getElementById('lastGroupName');
        const lastGroupBlockEl = document.getElementById('lastGroupBlock');

        if (lastGroupNameEl) lastGroupNameEl.textContent = data.name;
        if (lastGroupBlockEl) lastGroupBlockEl.style.display = 'block';

        showMessage('Группа создана', 'success');
        input.value = '';
    } catch (e) {
        showMessage('Не удалось создать группу', 'danger');
    }
}

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
        const response = await fetch('/api/groups/join', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ joinCode: joinCode })
        });

        if (response.status === 204) {
            showMessage('Вы присоединились к группе', 'success');
            input.value = '';
            loadStudentGroup();
            return;
        }

        const err = await response.json().catch(function() { return {}; });
        showMessage(err.message || 'Не удалось присоединиться к группе', 'danger');
    } catch (e) {
        showMessage('Не удалось присоединиться к группе', 'danger');
    }
}

async function loadStudentGroup() {
    if (!checkAuth()) return;

    const info = document.getElementById('studentGroupInfo');
    const joinForm = document.getElementById('studentJoinForm');
    const nameEl = document.getElementById('studentGroupName');
    const teacherNameEl = document.getElementById('studentTeacherName');
    const teacherEmailEl = document.getElementById('studentTeacherEmail');

    if (!info || !joinForm) return;

    try {
        const response = await fetch('/api/groups/my', {
            headers: getAuthHeaders()
        });

        if (response.status === 404) {
            info.classList.add('d-none');
            joinForm.classList.remove('d-none');
            return;
        }

        if (!response.ok) {
            info.classList.add('d-none');
            joinForm.classList.remove('d-none');
            return;
        }

        const data = await response.json();
        if (nameEl) nameEl.textContent = data.groupName || '—';
        if (teacherNameEl) teacherNameEl.textContent = data.teacherName || '—';
        if (teacherEmailEl) teacherEmailEl.textContent = data.teacherEmail || '—';

        info.classList.remove('d-none');
        joinForm.classList.add('d-none');
    } catch (e) {
        info.classList.add('d-none');
        joinForm.classList.remove('d-none');
    }
}

async function loadTeacherGroups() {
    if (!checkAuth()) return;

    const container = document.getElementById('teacherGroupsList');
    if (!container) return;

    container.innerHTML = 'Загрузка групп...';

    try {
        const response = await fetch('/api/groups/teacher', {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            container.innerHTML = 'Не удалось загрузить группы.';
            return;
        }

        const groups = await response.json();

        if (!Array.isArray(groups) || groups.length === 0) {
            container.innerHTML = '<span class="text-muted">У вас пока нет групп.</span>';
            return;
        }

        let html = '';
        groups.forEach(function (group, index) {
            const idx = index.toString();
            const groupId = group.groupId || group.id || '';
            html += '<div class="mb-3 border rounded p-2">';
            html += '<div class="d-flex justify-content-between align-items-center">';
            html += '<div><strong>Группа:</strong> ' + (group.groupName || '') + '</div>';
            html += '<div class="d-flex gap-2">';
            html += '<button type="button" class="btn btn-sm btn-outline-secondary" id="groupToggle-' + idx +
                '" onclick="toggleGroupStudents(' + idx + ')">Показать студентов</button>';
            html += '<button type="button" class="btn btn-sm btn-outline-primary" id="groupCodeBtn-' + idx +
                '" onclick="toggleGroupCode(' + idx + ')">Показать код</button>';
            html += '</div>';
            html += '</div>';
            html += '<div id="groupCode-' + idx + '" class="mt-2 small" style="display:none;">';
            if (groupId) {
                html += '<span class="text-muted">Код: </span><span id="groupCodeValue-' + idx + '">••••••••</span>';
            } else {
                html += '<span class="text-muted">Код недоступен (нет id группы).</span>';
            }
            html += '</div>';
            const students = group.students || [];
            html += '<div id="groupStudents-' + idx + '" class="mt-2" style="display:none;">';
            if (students.length > 0) {
                html += '<ul class="mb-0">';
                students.forEach(function (s) {
                    const name = s.nameStudent || '';
                    const username = s.username || '';
                    const email = s.emailStudent || '';
                    const parts = [];
                    if (name) parts.push(name);
                    if (username) parts.push('(' + username + ')');
                    if (email) parts.push('- ' + email);
                    html += '<li>' + parts.join(' ') + '</li>';
                });
                html += '</ul>';
            } else {
                html += '<span class="text-muted">В группе пока нет студентов.</span>';
            }
            html += '</div>';
            html += '</div>';
        });

        container.innerHTML = html;
        window.__teacherGroups = groups;
    } catch (e) {
        container.innerHTML = 'Ошибка при загрузке групп.';
    }
}

function toggleGroupStudents(index) {
    const block = document.getElementById('groupStudents-' + index);
    const button = document.getElementById('groupToggle-' + index);
    if (!block || !button) return;

    if (block.style.display === 'none' || block.style.display === '') {
        block.style.display = 'block';
        button.textContent = 'Скрыть студентов';
    } else {
        block.style.display = 'none';
        button.textContent = 'Показать студентов';
    }
}

async function toggleGroupCode(index) {
    const block = document.getElementById('groupCode-' + index);
    const button = document.getElementById('groupCodeBtn-' + index);
    if (!block || !button) return;

    if (block.style.display === 'none' || block.style.display === '') {
        block.style.display = 'block';
        button.textContent = 'Скрыть код';

        const groups = window.__teacherGroups || [];
        const group = groups[index];
        if (!group) return;

        const groupId = group.groupId || group.id;
        if (!groupId) return;

        const codeValueEl = document.getElementById('groupCodeValue-' + index);
        if (!codeValueEl) return;

        if (codeValueEl.dataset.loaded === 'true') {
            return;
        }

        try {
            const response = await fetch('/api/groups/' + groupId + '/code', {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                codeValueEl.textContent = 'Ошибка';
                return;
            }

            const data = await response.json();
            codeValueEl.textContent = data.code || '—';
            codeValueEl.dataset.loaded = 'true';
        } catch (e) {
            codeValueEl.textContent = 'Ошибка';
        }
    } else {
        block.style.display = 'none';
        button.textContent = 'Показать код';
    }
}

