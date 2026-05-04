document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    loadProfileData();

    const role = localStorage.getItem('userRole');
    const teacherRoomCreateRoot = document.getElementById('teacherRoomCreateRoot');
    const teacherRoomsListRoot = document.getElementById('teacherRoomsListRoot');
    const teacherRoomParticipantsRoot = document.getElementById('teacherRoomParticipantsRoot');
    const teacherRoomSettingsRoot = document.getElementById('teacherRoomSettingsRoot');
    const studentRoomRoot = document.getElementById('studentRoomRoot');
    const studentSimulationRoot = document.getElementById('studentSimulationRoot');

    if (teacherRoomCreateRoot || teacherRoomsListRoot || teacherRoomParticipantsRoot || teacherRoomSettingsRoot) {
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
        if (teacherRoomSettingsRoot) {
            loadTeacherRoomSettings();
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

    if (studentSimulationRoot) {
        if (role !== 'STUDENT') {
            window.location.href = '/profile';
            return;
        }
        initStudentSimulationPage();
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
    html += '<a class="btn btn-sm btn-outline-secondary" href="/pages/teacher-room-settings.html?roomId=' + encodeURIComponent(id) + '">Настройки</a>';
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
    const startCashInput = document.getElementById('roomStartCashInput');
    const info = document.getElementById('createdRoomInfo');
    if (!nameInput || !businessTypeSelect || !startCashInput) return;

    const name = (nameInput.value || '').trim();
    const businessType = (businessTypeSelect.value || '').trim() || 'COFFEE_SHOP';
    const startCashRaw = (startCashInput.value || '').trim();
    const startCash = parseFloat(startCashRaw);
    if (!name) {
        showMessage('Введите название комнаты', 'danger');
        return;
    }
    if (!startCashRaw || Number.isNaN(startCash) || startCash <= 0) {
        showMessage('Укажите корректный стартовый капитал (больше 0)', 'danger');
        return;
    }

    try {
        const response = await fetch('/api/rooms/teacher/create', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                name: name,
                businessType: businessType,
                startCash: startCash
            })
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
                '<br><strong>Код:</strong> <code>' + (room.joinCode || '—') + '</code>' +
                '<br><strong>Стартовый капитал:</strong> ' + startCash.toFixed(2);
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
    window.location.href = '/pages/student-simulation.html';
}

function openSimulationFromRoom() {
    const raw = localStorage.getItem('lastJoinedRoom');
    if (!raw) {
        showMessage('Сначала подключитесь к комнате по коду', 'warning');
        return;
    }
    window.location.href = '/pages/student-simulation.html';
}

function getCurrentRoomIdFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('roomId');
}

function setRoomSettingsFormValues(settings) {
    const mapping = [
        ['startCashInput', settings.startCash],
        ['startStockInput', settings.startStock],
        ['startStaffInput', settings.startStaff],
        ['startCostInput', settings.startCost],
        ['baseDemandInput', settings.baseDemand],
        ['avgPriceInput', settings.avgPrice],
        ['elasticityInput', settings.elasticity],
        ['marketingEfficiencyInput', settings.marketingEfficiency],
        ['fixedCostInput', settings.fixedCost],
        ['salaryPerStaffInput', settings.salaryPerStaff],
        ['eventProbabilityInput', settings.eventProbability]
    ];

    mapping.forEach(function(pair) {
        const element = document.getElementById(pair[0]);
        if (!element) return;
        element.value = pair[1] ?? '';
    });
}

function parseNumberInput(id, integerOnly) {
    const element = document.getElementById(id);
    if (!element) return null;
    const value = (element.value || '').trim();
    if (!value) return null;
    const parsed = integerOnly ? parseInt(value, 10) : parseFloat(value);
    if (Number.isNaN(parsed)) {
        throw new Error('Некорректное значение поля: ' + id);
    }
    return parsed;
}

function collectRoomSettingsUpdatePayload() {
    return {
        startStock: parseNumberInput('startStockInput', true),
        startStaff: parseNumberInput('startStaffInput', false),
        startCost: parseNumberInput('startCostInput', false),
        baseDemand: parseNumberInput('baseDemandInput', true),
        avgPrice: parseNumberInput('avgPriceInput', false),
        elasticity: parseNumberInput('elasticityInput', false),
        marketingEfficiency: parseNumberInput('marketingEfficiencyInput', false),
        fixedCost: parseNumberInput('fixedCostInput', false),
        salaryPerStaff: parseNumberInput('salaryPerStaffInput', false),
        eventProbability: parseNumberInput('eventProbabilityInput', false)
    };
}

async function loadTeacherRoomSettings() {
    if (!checkAuth()) return;
    const roomId = getCurrentRoomIdFromQuery();
    const roomIdEl = document.getElementById('roomSettingsRoomId');
    if (roomIdEl) roomIdEl.textContent = roomId || '—';
    if (!roomId) {
        showMessage('roomId не указан в URL', 'danger');
        return;
    }

    try {
        const response = await fetch('/api/rooms/' + roomId + '/settings', {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const err = await response.json().catch(function() { return {}; });
            showMessage(err.message || 'Не удалось загрузить настройки комнаты', 'danger');
            return;
        }
        const settings = await response.json();
        setRoomSettingsFormValues(settings);
    } catch (e) {
        showMessage('Ошибка при загрузке настроек комнаты', 'danger');
    }
}

async function saveTeacherRoomSettings() {
    if (!checkAuth()) return;
    const roomId = getCurrentRoomIdFromQuery();
    if (!roomId) {
        showMessage('roomId не указан в URL', 'danger');
        return;
    }

    try {
        const payload = collectRoomSettingsUpdatePayload();
        const response = await fetch('/api/rooms/' + roomId + '/settings', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const err = await response.json().catch(function() { return {}; });
            showMessage(err.message || 'Не удалось сохранить настройки', 'danger');
            return;
        }
        const updated = await response.json();
        setRoomSettingsFormValues(updated);
        showMessage('Настройки комнаты сохранены', 'success');
    } catch (e) {
        showMessage('Проверьте заполнение полей настроек', 'danger');
    }
}

// =========================
// STUDENT: simulation page
// =========================

var SIM_DAY_MS = 30000;

/** Автопрогон: 1 день = 30 с, кнопки Начать / Пауза / Закончить */
var simAuto = {
    active: false,
    paused: false,
    nextTurnAt: 0,
    pausedRemainingMs: 0,
    intervalId: null,
    turnInFlight: false
};

function getStudentSimulationRoom() {
    const raw = localStorage.getItem('lastJoinedRoom');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function getSimulationSessionKey(roomId) {
    return 'simSession:' + roomId;
}

function mapFinishReasonRu(reason) {
    const key = (reason || '').toString().toUpperCase();
    if (key === 'MAX_TURN' || key === 'MAX_TURNS') return 'Достигнут максимум ходов';
    if (key === 'BANKRUPT') return 'Банкротство';
    return reason || '—';
}

function initSessionFromSettings(room, settings) {
    return {
        roomId: room.id,
        roomName: room.name || 'Комната',
        maxTurns: room.maxTurns != null ? Number(room.maxTurns) : 30,
        step: 0,
        cash: Number(settings.startCash ?? 0),
        stock: Number(settings.startStock ?? 0),
        staff: Number(settings.startStaff ?? 0),
        cost: Number(settings.startCost ?? 0),
        lastMarketing: 0,
        gameFinished: false,
        finishReason: null,
        history: []
    };
}

function persistSimulationSession(session) {
    localStorage.setItem(getSimulationSessionKey(session.roomId), JSON.stringify(session));
}

function loadSimulationSession(roomId) {
    const raw = localStorage.getItem(getSimulationSessionKey(roomId));
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function renderSimulationHeader(room, session) {
    const roomNameEl = document.getElementById('simRoomName');
    const roomMetaEl = document.getElementById('simRoomMeta');
    if (roomNameEl) roomNameEl.textContent = room.name || 'Комната';
    if (roomMetaEl) {
        roomMetaEl.textContent =
            'Тип: ' + mapBusinessTypeRu(room.businessType) +
            ' · Статус: ' + mapRoomStatusRu(room.status) +
            ' · Макс. ходов: ' + (room.maxTurns ?? '—');
    }

    const maxTurns = session.maxTurns != null ? Number(session.maxTurns) : (room.maxTurns != null ? Number(room.maxTurns) : 30);
    const stepEl = document.getElementById('simStepValue');
    const maxTurnsEl = document.getElementById('simMaxTurnsValue');
    const cashEl = document.getElementById('simCashValue');
    const stockEl = document.getElementById('simStockValue');
    const staffEl = document.getElementById('simStaffValue');
    const costEl = document.getElementById('simCostValue');
    const stateEl = document.getElementById('simGameStateValue');
    const lastMEl = document.getElementById('simLastMarketingDisplay');
    const nextDayEl = document.getElementById('simNextDayLabel');
    const hintEl = document.getElementById('simTurnHint');

    const done = Number(session.step ?? 0);
    if (stepEl) stepEl.textContent = String(done);
    if (maxTurnsEl) maxTurnsEl.textContent = String(maxTurns);

    if (cashEl) cashEl.textContent = Number(session.cash ?? 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (stockEl) stockEl.textContent = String(session.stock ?? 0);
    if (staffEl) staffEl.textContent = Number(session.staff ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
    if (costEl) costEl.textContent = Number(session.cost ?? 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (stateEl) stateEl.textContent = session.gameFinished ? ('Игра завершена: ' + mapFinishReasonRu(session.finishReason)) : 'Идёт';

    if (lastMEl) {
        lastMEl.textContent = Number(session.lastMarketing ?? 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (nextDayEl) {
        if (session.gameFinished) {
            nextDayEl.textContent = '—';
        } else {
            nextDayEl.textContent = String(done + 1);
        }
    }
    if (hintEl) {
        if (session.gameFinished) {
            hintEl.textContent = 'Игра окончена, новые ходы недоступны.';
        } else {
            hintEl.textContent = 'Спрос в модели зависит от m прошлого дня — смотрите значение выше перед выбором m_t.';
        }
    }
}

function renderSimulationHistory(session) {
    const wrap = document.getElementById('simHistoryWrap');
    if (!wrap) return;
    const list = Array.isArray(session.history) ? session.history : [];
    if (list.length === 0) {
        wrap.innerHTML = '<span class="text-muted">Ходов пока нет.</span>';
        return;
    }

    let html = '<div class="table-responsive"><table class="table table-sm table-striped">';
    html += '<thead><tr><th>День</th><th>p</th><th>q</th><th>m</th><th>h</th><th>Спрос</th><th>Продажи</th><th>Выручка</th><th>Затраты</th><th>Прибыль</th><th>Касса</th><th>Склад</th></tr></thead><tbody>';
    list.slice().reverse().forEach(function(turn) {
        html += '<tr>';
        html += '<td>' + (turn.step ?? '—') + '</td>';
        html += '<td class="text-muted small">' + (turn.price != null ? Number(turn.price).toFixed(2) : '—') + '</td>';
        html += '<td class="text-muted small">' + (turn.purchaseQuantity != null ? turn.purchaseQuantity : '—') + '</td>';
        html += '<td class="text-muted small">' + (turn.marketingExpense != null ? Number(turn.marketingExpense).toFixed(2) : '—') + '</td>';
        html += '<td class="text-muted small">' + (turn.staffChange != null ? Number(turn.staffChange).toFixed(2) : '—') + '</td>';
        html += '<td>' + (turn.demand ?? '—') + '</td>';
        html += '<td>' + (turn.sales ?? '—') + '</td>';
        html += '<td>' + Number(turn.revenue ?? 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>';
        html += '<td>' + Number(turn.totalCost ?? 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>';
        html += '<td>' + Number(turn.profit ?? 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>';
        html += '<td>' + Number(turn.cashAfter ?? 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>';
        html += '<td>' + (turn.stockAfter ?? '—') + '</td>';
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    wrap.innerHTML = html;
}

function fmtNumRu(v, minFd, maxFd) {
    if (v === null || v === undefined || v === '') return '—';
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('ru-RU', {
        minimumFractionDigits: minFd != null ? minFd : 0,
        maximumFractionDigits: maxFd != null ? maxFd : 2
    });
}

function fillSimulationSettings(settings) {
    const el = document.getElementById('simSettingsInfo');
    if (!el) return;

    var rows = [
        {
            name: 'Базовый спрос',
            symHtml: 'D<sub>0</sub>',
            val: fmtNumRu(settings.baseDemand, 0, 0),
            hint: 'Масштаб спроса до влияния цены, маркетинга и персонала.'
        },
        {
            name: 'Среднерыночная цена',
            symHtml: 'p<sub>avg</sub>',
            val: fmtNumRu(settings.avgPrice, 2, 2),
            hint: 'Ориентир для ценовой эластичности: при p = p<sub>avg</sub> множитель цены равен 1.'
        },
        {
            name: 'Ценовая эластичность',
            symHtml: 'β',
            val: fmtNumRu(settings.elasticity, 2, 2),
            hint: 'Чем выше β, тем сильнее спрос реагирует на отклонение цены от рынка.'
        },
        {
            name: 'Эффективность маркетинга',
            symHtml: 'α',
            val: fmtNumRu(settings.marketingEfficiency, 2, 4),
            hint: 'Вес в формуле 1 + α·ln(1 + m), m — расходы прошлого периода.'
        },
        {
            name: 'Постоянные расходы за период',
            symHtml: 'F<sub>fixed</sub>',
            val: fmtNumRu(settings.fixedCost, 2, 2),
            hint: 'Аренда, коммунальные и т.п., не зависят от объёма продаж.'
        },
        {
            name: 'Ставка на единицу персонала',
            symHtml: 'w',
            val: fmtNumRu(settings.salaryPerStaff, 2, 2),
            hint: 'Затраты на персонал за период: w·L (L — текущий уровень эффективности).'
        },
        {
            name: 'Себестоимость единицы на старте',
            symHtml: 'c<sub>0</sub>',
            val: fmtNumRu(settings.startCost, 2, 2),
            hint: 'Начальное значение c<sub>t</sub>; в модели может меняться событиями.'
        },
        {
            name: 'Вероятность случайного события',
            symHtml: 'p<sub>event</sub>',
            val: settings.eventProbability != null
                ? (Number(settings.eventProbability).toLocaleString('ru-RU', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 1 }))
                : '—',
            hint: 'Зарезервировано под динамические события (поставщик, поломка и т.д.).'
        }
    ];

    var html = '<div class="table-responsive"><table class="table table-sm mb-0 align-middle">';
    html += '<thead class="table-light"><tr><th>Параметр</th><th>В формулах</th><th class="text-end">Значение</th><th>Зачем студенту</th></tr></thead><tbody>';
    rows.forEach(function (r) {
        html += '<tr><td>' + r.name + '</td><td><code>' + r.symHtml + '</code></td><td class="text-end fw-semibold">' + r.val + '</td><td class="text-muted">' + r.hint + '</td></tr>';
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
}

function simulationAutoClearInterval() {
    if (simAuto.intervalId) {
        clearInterval(simAuto.intervalId);
        simAuto.intervalId = null;
    }
}

function simulationAutoUpdateUi() {
    var start = document.getElementById('simBtnAutoStart');
    var pause = document.getElementById('simBtnAutoPause');
    var stop = document.getElementById('simBtnAutoStop');
    var badge = document.getElementById('simAutoStatusBadge');
    if (start) start.disabled = simAuto.active;
    if (pause) pause.disabled = !simAuto.active;
    if (stop) stop.disabled = !simAuto.active;
    if (pause) {
        if (simAuto.active && simAuto.paused) {
            pause.innerHTML = '<i class="bi bi-play-fill"></i> Продолжить';
        } else {
            pause.innerHTML = '<i class="bi bi-pause-fill"></i> Пауза';
        }
    }
    if (badge) {
        if (!simAuto.active) {
            badge.className = 'badge bg-secondary';
            badge.textContent = 'Выключено';
        } else if (simAuto.paused) {
            badge.className = 'badge bg-warning text-dark';
            badge.textContent = 'Пауза';
        } else {
            badge.className = 'badge bg-success';
            badge.textContent = 'Идёт';
        }
    }
}

function simulationAutoTick() {
    var cd = document.getElementById('simAutoCountdown');
    if (!simAuto.active) return;
    if (simAuto.paused) {
        if (cd) cd.textContent = 'На паузе';
        return;
    }
    var ms = simAuto.nextTurnAt - Date.now();
    if (ms <= 0) {
        simAutoFireTurn();
        return;
    }
    if (cd) cd.textContent = 'Следующий автоматический ход через ' + Math.ceil(ms / 1000) + ' с';
}

function simulationAutoStop() {
    simAuto.active = false;
    simAuto.paused = false;
    simAuto.pausedRemainingMs = 0;
    simAuto.turnInFlight = false;
    simulationAutoClearInterval();
    var cd = document.getElementById('simAutoCountdown');
    if (cd) cd.textContent = '—';
    simulationAutoUpdateUi();
}

function simulationAutoStart() {
    if (!checkAuth()) return;
    var room = getStudentSimulationRoom();
    if (!room || !room.id) {
        showMessage('Сначала вступите в комнату', 'warning');
        return;
    }
    var session = loadSimulationSession(room.id);
    if (!session) {
        showMessage('Сессия не инициализирована. Обновите страницу.', 'danger');
        return;
    }
    if (session.gameFinished) {
        showMessage('Игра уже завершена', 'warning');
        return;
    }
    simulationAutoStop();
    simAuto.active = true;
    simAuto.paused = false;
    simAuto.nextTurnAt = Date.now() + SIM_DAY_MS;
    simAuto.intervalId = setInterval(simulationAutoTick, 250);
    simulationAutoUpdateUi();
    simulationAutoTick();
    showMessage('Автодни запущены: каждые 30 секунд отправляется ход с текущими значениями формы.', 'success');
}

function simulationAutoPauseResume() {
    if (!simAuto.active) return;
    if (!simAuto.paused) {
        simAuto.paused = true;
        simAuto.pausedRemainingMs = Math.max(0, simAuto.nextTurnAt - Date.now());
    } else {
        simAuto.paused = false;
        simAuto.nextTurnAt = Date.now() + (simAuto.pausedRemainingMs > 0 ? simAuto.pausedRemainingMs : SIM_DAY_MS);
    }
    simulationAutoUpdateUi();
    simulationAutoTick();
}

async function simAutoFireTurn() {
    if (!simAuto.active || simAuto.paused || simAuto.turnInFlight) return;
    simAuto.turnInFlight = true;
    try {
        var room = getStudentSimulationRoom();
        if (!room || !room.id) {
            simulationAutoStop();
            return;
        }
        var session = loadSimulationSession(room.id);
        if (!session || session.gameFinished) {
            simulationAutoStop();
            return;
        }

        var res = await submitSimulationTurn({ showSuccess: false });
        if (!res.ok) {
            showMessage(res.error || 'Автоход не выполнен', 'danger');
            simulationAutoStop();
            return;
        }
        if (res.session.gameFinished) {
            showMessage('Игра завершена: ' + mapFinishReasonRu(res.session.finishReason), 'warning');
            simulationAutoStop();
            return;
        }
        simAuto.nextTurnAt = Date.now() + SIM_DAY_MS;
        simulationAutoTick();
    } finally {
        simAuto.turnInFlight = false;
    }
}

async function initStudentSimulationPage() {
    simulationAutoStop();

    const room = getStudentSimulationRoom();
    const empty = document.getElementById('simEmptyState');
    const content = document.getElementById('simMainContent');
    if (!room || !room.id) {
        if (empty) empty.classList.remove('d-none');
        if (content) content.classList.add('d-none');
        return;
    }
    if (empty) empty.classList.add('d-none');
    if (content) content.classList.remove('d-none');

    try {
        const response = await fetch('/api/rooms/' + room.id + '/settings', {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            showMessage('Не удалось загрузить настройки комнаты', 'danger');
            return;
        }
        const settings = await response.json();
        fillSimulationSettings(settings);

        let session = loadSimulationSession(room.id);
        if (!session) {
            session = initSessionFromSettings(room, settings);
            persistSimulationSession(session);
        } else if (session.maxTurns == null && room.maxTurns != null) {
            session.maxTurns = Number(room.maxTurns);
            persistSimulationSession(session);
        }
        renderSimulationHeader(room, session);
        renderSimulationHistory(session);
    } catch (e) {
        showMessage('Ошибка при инициализации симуляции', 'danger');
    }
}

function readSimulationDecision() {
    const price = parseFloat((document.getElementById('simPriceInput')?.value || '').trim());
    const purchaseQuantity = parseInt((document.getElementById('simPurchaseInput')?.value || '').trim(), 10);
    const marketingExpense = parseFloat((document.getElementById('simMarketingInput')?.value || '').trim());
    const staffChange = parseFloat((document.getElementById('simStaffChangeInput')?.value || '').trim());

    if (!Number.isFinite(price) || price <= 0) throw new Error('Цена должна быть больше 0');
    if (!Number.isInteger(purchaseQuantity) || purchaseQuantity < 0) throw new Error('Закупка должна быть целым числом >= 0');
    if (!Number.isFinite(marketingExpense) || marketingExpense < 0) throw new Error('Маркетинг должен быть >= 0');
    if (!Number.isFinite(staffChange)) throw new Error('Изменение персонала заполнено некорректно');

    return { price, purchaseQuantity, marketingExpense, staffChange };
}

/**
 * @param {{ showSuccess?: boolean }} options
 * @returns {Promise<{ ok: boolean, error?: string, session?: object, result?: object, room?: object, payload?: object }>}
 */
async function submitSimulationTurn(options) {
    var showSuccess = !options || options.showSuccess !== false;

    const room = getStudentSimulationRoom();
    if (!room || !room.id) {
        return { ok: false, error: 'Нет комнаты' };
    }

    let session = loadSimulationSession(room.id);
    if (!session) {
        return { ok: false, error: 'Сессия не инициализирована. Обновите страницу.' };
    }
    if (session.gameFinished) {
        return { ok: false, error: 'Игра уже завершена: ' + mapFinishReasonRu(session.finishReason) };
    }

    let payload;
    try {
        payload = readSimulationDecision();
    } catch (e) {
        return { ok: false, error: e.message };
    }

    try {
        const response = await fetch('/api/simulation/rooms/' + room.id + '/turn', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const err = await response.json().catch(function() { return {}; });
            return { ok: false, error: err.message || 'Не удалось выполнить ход' };
        }

        const result = await response.json();
        session.step = result.step ?? session.step;
        session.cash = Number(result.cashAfter ?? session.cash);
        session.stock = Number(result.stockAfter ?? session.stock);
        session.staff = Number(session.staff) + Number(payload.staffChange);
        session.lastMarketing = Number(payload.marketingExpense);
        session.gameFinished = !!result.gameFinished;
        session.finishReason = result.finishReason || null;
        session.history = Array.isArray(session.history) ? session.history : [];
        session.history.push({
            step: result.step,
            price: payload.price,
            purchaseQuantity: payload.purchaseQuantity,
            marketingExpense: payload.marketingExpense,
            staffChange: payload.staffChange,
            demand: result.demand,
            sales: result.sales,
            revenue: result.revenue,
            totalCost: result.totalCost,
            profit: result.profit,
            cashAfter: result.cashAfter,
            stockAfter: result.stockAfter
        });
        persistSimulationSession(session);
        renderSimulationHeader(room, session);
        renderSimulationHistory(session);

        if (showSuccess) {
            if (session.gameFinished) {
                showMessage('Игра завершена: ' + mapFinishReasonRu(session.finishReason), 'warning');
            } else {
                showMessage('Ход выполнен успешно', 'success');
            }
        }
        return { ok: true, session: session, result: result, room: room, payload: payload };
    } catch (e) {
        return { ok: false, error: 'Ошибка выполнения хода' };
    }
}

async function makeSimulationTurn() {
    if (!checkAuth()) return;
    var res = await submitSimulationTurn({ showSuccess: true });
    if (!res.ok) {
        showMessage(res.error || 'Ошибка', 'danger');
    }
    if (simAuto.active && res.ok && !res.session.gameFinished) {
        simAuto.nextTurnAt = Date.now() + SIM_DAY_MS;
        simulationAutoTick();
    }
}

