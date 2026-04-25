document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    loadProfileData();

    const role = localStorage.getItem('userRole');
    const teacherRoomCreateRoot = document.getElementById('teacherRoomCreateRoot');
    const teacherRoomsListRoot = document.getElementById('teacherRoomsListRoot');
    const teacherRoomParticipantsRoot = document.getElementById('teacherRoomParticipantsRoot');
    const studentRoomRoot = document.getElementById('studentRoomRoot');

    if (teacherRoomCreateRoot || teacherRoomsListRoot || teacherRoomParticipantsRoot) {
        if (role !== 'TEACHER') {
            window.location.href = '/profile';
            return;
        }
        if (teacherRoomsListRoot) {
            loadTeacherRoomsList();
        }
        if (teacherRoomParticipantsRoot) {
            loadRoomParticipantsPlaceholder();
        }
        return;
    }

    if (studentRoomRoot) {
        if (role !== 'STUDENT') {
            window.location.href = '/profile';
            return;
        }
        renderStudentLastJoinedRoom();
        return;
    }

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
    if (messageDiv) messageDiv.classList.add('d-none');
}

function showLoading(show) {
    const elements = document.querySelectorAll('#profileFirstName, #profileLastName, #profileUsername, #profileEmail');
    elements.forEach(function(el) {
        el.textContent = show ? 'Загрузка...' : el.textContent;
    });
}

function getInitials(firstName, lastName, username) {
    if (firstName && lastName) return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (username) return username.charAt(0).toUpperCase();
    return 'U';
}

async function loadProfileData() {
    try {
        showLoading(true);
        const response = await fetch('/api/user/profile', { headers: getAuthHeaders() });
        if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
        const profileData = await response.json();

        const firstNameEl = document.getElementById('profileFirstName');
        const lastNameEl = document.getElementById('profileLastName');
        const usernameEl = document.getElementById('profileUsername');
        const emailEl = document.getElementById('profileEmail');
        const nameEl = document.getElementById('profileName');
        const initialsEl = document.getElementById('profileInitials');
        const roleEl = document.getElementById('profileRole');
        const systemRoleEl = document.getElementById('profileSystemRole');

        if (firstNameEl) firstNameEl.textContent = profileData.firstName || 'Не указано';
        if (lastNameEl) lastNameEl.textContent = profileData.lastName || 'Не указано';
        if (usernameEl) usernameEl.textContent = profileData.username || 'Не указано';
        if (emailEl) emailEl.textContent = profileData.email || 'Скрыто';

        const fullName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
        if (nameEl) nameEl.textContent = fullName || profileData.username;
        if (initialsEl) initialsEl.textContent = getInitials(profileData.firstName, profileData.lastName, profileData.username);

        const role = localStorage.getItem('userRole');
        if (roleEl) {
            roleEl.textContent = role === 'STUDENT' ? 'Студент' : role === 'TEACHER' ? 'Преподаватель' : 'Пользователь';
        }
        if (systemRoleEl) {
            systemRoleEl.textContent =
                role === 'STUDENT' ? 'Студент' :
                    role === 'TEACHER' ? 'Преподаватель' : 'Не определено';
        }
    } catch (e) {
        console.error('Ошибка загрузки профиля:', e);
        showMessage('Не удалось загрузить данные профиля. Попробуйте обновить страницу.', 'danger');
    } finally {
        showLoading(false);
    }
}

function logout() {
    if (!confirm('Вы уверены, что хотите выйти из системы?')) return;
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    window.location.href = '/auth/login';
}

// =========================
// STUDENT: group page
// =========================

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
    const classmatesBlock = document.getElementById('studentClassmatesBlock');
    const classmatesCountEl = document.getElementById('studentClassmatesCount');
    const classmatesListEl = document.getElementById('studentClassmatesList');

    if (!info || !joinForm) return;

    try {
        const response = await fetch('/api/groups/my', { headers: getAuthHeaders() });
        if (response.status === 404 || !response.ok) {
            info.classList.add('d-none');
            joinForm.classList.remove('d-none');
            if (classmatesBlock) classmatesBlock.classList.add('d-none');
            return;
        }

        const data = await response.json();
        if (nameEl) nameEl.textContent = data.groupName || '—';
        if (teacherNameEl) teacherNameEl.textContent = data.teacherName || '—';
        if (teacherEmailEl) teacherEmailEl.textContent = data.teacherEmail || '—';

        const classmates = Array.isArray(data.classmate) ? data.classmate : (Array.isArray(data.classmates) ? data.classmates : []);
        if (classmatesCountEl) classmatesCountEl.textContent = String(classmates.length);
        if (classmatesListEl) {
            if (classmates.length === 0) {
                classmatesListEl.innerHTML = '<div class="text-muted small">Пока вы один в группе.</div>';
            } else {
                let html = '<div class="list-group list-group-flush">';
                classmates.forEach(function(c) {
                    const fullName = c.fullName || 'Без имени';
                    const username = c.username || '—';
                    const email = c.email || '—';
                    html += '<div class="list-group-item px-0">';
                    html += '<div class="fw-semibold">' + fullName + '</div>';
                    html += '<div class="small text-muted">@' + username + ' · ' + email + '</div>';
                    html += '</div>';
                });
                html += '</div>';
                classmatesListEl.innerHTML = html;
            }
        }
        if (classmatesBlock) classmatesBlock.classList.remove('d-none');

        info.classList.remove('d-none');
        joinForm.classList.add('d-none');
    } catch (e) {
        info.classList.add('d-none');
        joinForm.classList.remove('d-none');
        if (classmatesBlock) classmatesBlock.classList.add('d-none');
    }
}

// =========================
// TEACHER: groups pages
// =========================

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
        loadTeacherGroups();
    } catch (e) {
        showMessage('Не удалось создать группу', 'danger');
    }
}

async function loadTeacherGroups() {
    if (!checkAuth()) return;
    const container = document.getElementById('teacherGroupsList');
    if (!container) return;

    container.innerHTML = 'Загрузка групп...';
    try {
        const response = await fetch('/api/groups/teacher', { headers: getAuthHeaders() });
        if (!response.ok) {
            container.innerHTML = 'Не удалось загрузить группы.';
            return;
        }

        const groups = await response.json();
        if (!Array.isArray(groups) || groups.length === 0) {
            container.innerHTML = '<span class="text-muted">У вас пока нет групп.</span>';
            return;
        }

        let html = '<div class="accordion" id="teacherGroupsAccordion">';
        groups.forEach(function (group, index) {
            const idx = index.toString();
            const groupId = group.groupId || group.id || '';
            const groupName = group.groupName || group.name || '';
            const students = group.students || [];
            const studentsCount = students.length;

            const headingId = 'heading-' + idx;
            const collapseId = 'collapse-' + idx;

            html += '<div class="accordion-item">';
            html += '<h2 class="accordion-header" id="' + headingId + '">';
            html += '<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#' + collapseId +
                '" aria-expanded="false" aria-controls="' + collapseId + '">';
            html += '<div class="d-flex align-items-center justify-content-between w-100">';
            html += '<span class="fw-semibold text-truncate" style="max-width:65%">' + groupName + '</span>';
            html += '<span class="badge bg-secondary">' + studentsCount + ' ' + (studentsCount === 1 ? 'студент' : 'студентов') + '</span>';
            html += '</div>';
            html += '</button>';
            html += '</h2>';

            html += '<div id="' + collapseId + '" class="accordion-collapse collapse" aria-labelledby="' + headingId +
                '" data-bs-parent="#teacherGroupsAccordion">';
            html += '<div class="accordion-body">';

            html += '<div class="mb-3">';
            html += '<div class="fw-semibold mb-2">Участники</div>';
            if (studentsCount > 0) {
                html += '<ul class="mb-0">';
                students.forEach(function (s) {
                    const name = s.nameStudent || '';
                    const username = s.username || '';
                    const email = s.emailStudent || '';
                    const parts = [];
                    if (name) parts.push(name);
                    if (username) parts.push('(' + username + ')');
                    if (email) parts.push('- ' + email);
                    html += '<li class="mb-1">' + parts.join(' ') + '</li>';
                });
                html += '</ul>';
            } else {
                html += '<div class="text-muted">В группе пока нет студентов.</div>';
            }
            html += '</div>';

            if (groupId) {
                html += '<div class="d-flex flex-column flex-md-row align-items-md-center gap-2">';
                html += '<button type="button" class="btn btn-sm btn-outline-primary" id="groupCodeBtn-' + idx +
                    '" onclick="toggleGroupCode(' + idx + ')">Показать код</button>';
                html += '<div class="text-muted small">Код нужен студентам, чтобы вступить в вашу группу.</div>';
                html += '</div>';
            } else {
                html += '<div class="text-muted small">Код приглашения недоступен.</div>';
                html += '<button type="button" class="btn btn-sm btn-outline-primary" disabled>Код недоступен</button>';
            }

            html += '<div id="groupCode-' + idx + '" class="mt-2 small" style="display:none;">';
            if (groupId) {
                html += '<span class="text-muted">Код: </span><span id="groupCodeValue-' + idx + '">••••••••</span>';
            } else {
                html += '<span class="text-muted">—</span>';
            }
            html += '</div>';

            html += '</div>';
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';

        container.innerHTML = html;
        window.__teacherGroups = groups;
    } catch (e) {
        container.innerHTML = 'Ошибка при загрузке групп.';
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
        if (codeValueEl.dataset.loaded === 'true') return;

        try {
            const response = await fetch('/api/groups/' + groupId + '/code', { headers: getAuthHeaders() });
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

// =========================
// ROOMS: teacher + student
// =========================

function renderRoomCard(room) {
    const id = room.id || '—';
    const name = room.name || 'Без названия';
    const businessType = mapBusinessTypeRu(room.businessType);
    const status = mapRoomStatusRu(room.status);
    const maxTurns = room.maxTurns ?? '—';
    const joinCode = room.joinCode || '—';
    const participants = room.participantsCount ?? '—';
    const teacherName = room.teacherName || '—';

    let html = '';
    html += '<div class="card shadow-sm mb-3">';
    html += '<div class="card-body">';
    html += '<div class="d-flex justify-content-between align-items-start mb-2">';
    html += '<h6 class="mb-0">' + name + '</h6>';
    html += '<span class="badge bg-secondary">' + status + '</span>';
    html += '</div>';
    html += '<div class="small text-muted mb-2">ID: ' + id + '</div>';
    html += '<div class="small"><strong>Тип бизнеса:</strong> ' + businessType + '</div>';
    html += '<div class="small"><strong>Макс. ходов:</strong> ' + maxTurns + '</div>';
    html += '<div class="small"><strong>Участников:</strong> ' + participants + '</div>';
    html += '<div class="small"><strong>Преподаватель:</strong> ' + teacherName + '</div>';
    html += '<div class="small"><strong>Код комнаты:</strong> <code>' + joinCode + '</code></div>';
    html += '<div class="d-flex gap-2 mt-3">';
    html += '<a class="btn btn-sm btn-outline-primary" href="/pages/teacher-room-participants.html?roomId=' + encodeURIComponent(id) + '">Участники</a>';
    html += '<button class="btn btn-sm btn-outline-danger" type="button" onclick="deleteTeacherRoom(\'' + id + '\')">Удалить</button>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    return html;
}

async function createRoomByTeacher() {
    if (!checkAuth()) return;
    const nameInput = document.getElementById('roomNameInput');
    const businessTypeSelect = document.getElementById('roomBusinessTypeSelect');
    const info = document.getElementById('createdRoomInfo');
    if (!nameInput || !businessTypeSelect) return;

    const name = (nameInput.value || '').trim();
    const businessType = (businessTypeSelect.value || '').trim() || 'COFFEE_SHOP';
    if (!name) {
        showMessage('Введите название комнаты', 'danger');
        return;
    }

    try {
        const response = await fetch('/api/rooms/teacher/create', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name: name, businessType: businessType })
        });

        if (!response.ok) {
            const err = await response.json().catch(function() { return {}; });
            showMessage(err.message || 'Не удалось создать комнату', 'danger');
            return;
        }

        const room = await response.json();
        showMessage('Комната создана', 'success');
        if (info) {
            info.classList.remove('d-none');
            info.innerHTML = '<strong>Комната:</strong> ' + (room.name || '—') +
                '<br><strong>Код:</strong> <code>' + (room.joinCode || '—') + '</code>';
        }
        nameInput.value = '';
    } catch (e) {
        showMessage('Не удалось создать комнату', 'danger');
    }
}

async function loadTeacherRoomsList() {
    if (!checkAuth()) return;
    const wrap = document.getElementById('teacherRoomsListWrap');
    if (!wrap) return;
    wrap.innerHTML = 'Загрузка...';

    try {
        const response = await fetch('/api/rooms/teacher/check-rooms', {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            wrap.innerHTML = '<span class="text-danger">Не удалось загрузить комнаты.</span>';
            return;
        }

        const rooms = await response.json();
        if (!Array.isArray(rooms) || rooms.length === 0) {
            wrap.innerHTML = '<span class="text-muted">Комнат пока нет.</span>';
            return;
        }

        let html = '';
        rooms.forEach(function(room) { html += renderRoomCard(room); });
        wrap.innerHTML = html;
    } catch (e) {
        wrap.innerHTML = '<span class="text-danger">Ошибка загрузки.</span>';
    }
}

async function deleteTeacherRoom(roomId) {
    if (!checkAuth()) return;
    if (!roomId) return;
    if (!confirm('Удалить комнату?')) return;

    try {
        const response = await fetch('/api/rooms/teacher/' + roomId + '/delete', {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (response.status === 204) {
            showMessage('Комната удалена', 'success');
            loadTeacherRoomsList();
            return;
        }
        const err = await response.json().catch(function() { return {}; });
        showMessage(err.message || 'Не удалось удалить комнату', 'danger');
    } catch (e) {
        showMessage('Не удалось удалить комнату', 'danger');
    }
}

async function loadRoomParticipantsPlaceholder() {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId');
    const roomIdEl = document.getElementById('roomParticipantsRoomId');
    const contentEl = document.getElementById('roomParticipantsContent');
    if (roomIdEl) roomIdEl.textContent = roomId || '—';
    if (!roomId || !contentEl) {
        if (contentEl) contentEl.textContent = 'roomId не указан.';
        return;
    }

    try {
        const response = await fetch('/api/rooms/' + roomId + '/participants', {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            contentEl.innerHTML = '<span class="text-danger">Не удалось получить участников.</span>';
            return;
        }
        const text = await response.text();
        contentEl.textContent = text;
    } catch (e) {
        contentEl.innerHTML = '<span class="text-danger">Ошибка запроса.</span>';
    }
}

function renderStudentLastJoinedRoom() {
    const el = document.getElementById('studentRoomLastInfo');
    if (!el) return;
    const raw = localStorage.getItem('lastJoinedRoom');
    if (!raw) {
        el.textContent = 'Пока нет данных.';
        return;
    }

    try {
        const room = JSON.parse(raw);
        el.innerHTML =
            '<div><strong>Название:</strong> ' + (room.name || '—') + '</div>' +
            '<div><strong>ID:</strong> ' + (room.id || '—') + '</div>' +
            '<div><strong>Тип:</strong> ' + mapBusinessTypeRu(room.businessType) + '</div>' +
            '<div><strong>Статус:</strong> ' + mapRoomStatusRu(room.status) + '</div>' +
            '<div><strong>Макс. ходов:</strong> ' + (room.maxTurns ?? '—') + '</div>' +
            '<div><strong>Участников:</strong> ' + (room.participantsCount ?? '—') + '</div>' +
            '<div><strong>Преподаватель:</strong> ' + (room.teacherName || '—') + '</div>' +
            '<div class="mt-2 badge bg-success">Готово к запуску</div>';

        const hint = document.getElementById('studentRoomGameHint');
        if (hint) {
            hint.textContent = 'Комната подключена. Можно начинать игру.';
        }
    } catch (e) {
        el.textContent = 'Не удалось прочитать сохранённые данные комнаты.';
    }
}

async function joinRoomByCode() {
    if (!checkAuth()) return;
    const input = document.getElementById('joinRoomCodeInput');
    if (!input) return;
    const joinCode = (input.value || '').trim();
    if (!joinCode) {
        showMessage('Введите код комнаты', 'danger');
        return;
    }

    try {
        const response = await fetch('/api/rooms/student/join', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ joinCode: joinCode })
        });
        if (!response.ok) {
            const err = await response.json().catch(function() { return {}; });
            showMessage(err.message || 'Не удалось вступить в комнату', 'danger');
            return;
        }
        const room = await response.json();
        localStorage.setItem('lastJoinedRoom', JSON.stringify(room));
        showMessage('Вы успешно вступили в комнату', 'success');
        input.value = '';
        renderStudentLastJoinedRoom();
    } catch (e) {
        showMessage('Не удалось вступить в комнату', 'danger');
    }
}

function mapRoomStatusRu(status) {
    const key = (status || '').toString().toUpperCase();
    if (key === 'DRAFT') return 'Черновик';
    if (key === 'ACTIVE') return 'Симулируется';
    if (key === 'PAUSED') return 'На паузе';
    if (key === 'FINISHED') return 'Завершена';
    if (key === 'ARCHIVED') return 'В архиве';
    return status || '—';
}

function mapBusinessTypeRu(type) {
    const key = (type || '').toString().toUpperCase();
    if (key === 'COFFEE_SHOP') return 'Кофейня';
    return type || '—';
}

function startGameFromRoom() {
    const raw = localStorage.getItem('lastJoinedRoom');
    if (!raw) {
        showMessage('Сначала подключитесь к комнате по коду', 'warning');
        return;
    }
    const hint = document.getElementById('studentRoomGameHint');
    if (hint) {
        hint.textContent = 'Запуск игры доступен после подключения модуля симуляции.';
    }
    showMessage('Комната готова. Следующий шаг — запуск симуляции.', 'success');
}

function openSimulationFromRoom() {
    const raw = localStorage.getItem('lastJoinedRoom');
    if (!raw) {
        showMessage('Сначала подключитесь к комнате по коду', 'warning');
        return;
    }
    showMessage('Экран симуляции будет открыт после подключения модуля симуляции.', 'info');
}

