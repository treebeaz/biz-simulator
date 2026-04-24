document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) {
        return;
    }

    const studentSimRoot = document.getElementById('studentSimPageRoot');
    if (studentSimRoot) {
        const role = localStorage.getItem('userRole');
        if (role !== 'STUDENT') {
            window.location.href = '/profile';
            return;
        }
        loadProfileData();
        initStudentSimulationPage();
        return;
    }

    const roomStudentsRoot = document.getElementById('roomStudentsPageRoot');
    const roomIdFromQuery = new URLSearchParams(window.location.search).get('roomId');
    if (roomStudentsRoot && roomIdFromQuery) {
        const role = localStorage.getItem('userRole');
        if (role !== 'TEACHER') {
            window.location.href = '/profile';
            return;
        }
        loadProfileData();
        initRoomStudentsPage(roomIdFromQuery);
        return;
    }

    loadProfileData();

    const role = localStorage.getItem('userRole');
    if (role === 'TEACHER') {
        const teacherSection = document.getElementById('teacherGroupSection');
        if (teacherSection) {
            teacherSection.classList.remove('d-none');
            loadTeacherGroups();
            initRoomForm();
        }

        const teacherRoomsList = document.getElementById('teacherRoomsList');
        if (teacherRoomsList) {
            loadTeacherRooms();
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
        loadTeacherGroups();
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
    const classmatesBlock = document.getElementById('studentClassmatesBlock');
    const classmatesCountEl = document.getElementById('studentClassmatesCount');
    const classmatesListEl = document.getElementById('studentClassmatesList');

    if (!info || !joinForm) return;

    try {
        const response = await fetch('/api/groups/my', {
            headers: getAuthHeaders()
        });

        if (response.status === 404) {
            info.classList.add('d-none');
            joinForm.classList.remove('d-none');
            if (classmatesBlock) classmatesBlock.classList.add('d-none');
            return;
        }

        if (!response.ok) {
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
        if (classmatesCountEl) {
            classmatesCountEl.textContent = String(classmates.length);
        }
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
        if (classmatesBlock) {
            classmatesBlock.classList.remove('d-none');
        }

        info.classList.remove('d-none');
        joinForm.classList.add('d-none');
    } catch (e) {
        info.classList.add('d-none');
        joinForm.classList.remove('d-none');
        if (classmatesBlock) classmatesBlock.classList.add('d-none');
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
            syncRoomGroupSelect([]);
            return;
        }

        const groups = await response.json();

        if (!Array.isArray(groups) || groups.length === 0) {
            container.innerHTML = '<span class="text-muted">У вас пока нет групп.</span>';
            syncRoomGroupSelect([]);
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
        syncRoomGroupSelect(groups);
    } catch (e) {
        container.innerHTML = 'Ошибка при загрузке групп.';
        syncRoomGroupSelect([]);
    }
}

function initRoomForm() {
    syncRoomGroupSelect(window.__teacherGroups || []);
}

function syncRoomGroupSelect(groups) {
    const select = document.getElementById('roomGroupSelect');
    if (!select) return;

    const items = Array.isArray(groups) ? groups : [];
    if (items.length === 0) {
        select.innerHTML = '<option value="" selected>Сначала создайте группу</option>';
        select.disabled = true;
        return;
    }

    let options = '<option value="" selected>Выберите группу</option>';
    items.forEach(function(g) {
        const id = g.groupId || g.id || '';
        const name = g.groupName || g.name || '';
        if (!id) return;
        options += '<option value="' + id + '">' + (name || id) + '</option>';
    });

    select.innerHTML = options;
    select.disabled = false;
}

function resetRoomForm() {
    const groupSelect = document.getElementById('roomGroupSelect');
    const businessTypeSelect = document.getElementById('roomBusinessTypeSelect');
    const nameInput = document.getElementById('roomNameInput');
    const budgetInput = document.getElementById('roomInitialBudgetInput');
    const lastBlock = document.getElementById('lastRoomBlock');

    if (groupSelect) groupSelect.value = '';
    if (businessTypeSelect) businessTypeSelect.value = 'COFFEE_SHOP';
    if (nameInput) nameInput.value = '';
    if (budgetInput) budgetInput.value = '';
    if (lastBlock) lastBlock.classList.add('d-none');
}

async function createRoom() {
    if (!checkAuth()) return;

    const groupSelect = document.getElementById('roomGroupSelect');
    const businessTypeSelect = document.getElementById('roomBusinessTypeSelect');
    const nameInput = document.getElementById('roomNameInput');
    const budgetInput = document.getElementById('roomInitialBudgetInput');

    if (!groupSelect || !businessTypeSelect || !nameInput || !budgetInput) {
        showMessage('Форма создания комнаты не найдена', 'danger');
        return;
    }

    const groupId = (groupSelect.value || '').trim();
    const roomName = (nameInput.value || '').trim();
    const businessType = (businessTypeSelect.value || '').trim();
    const budgetRaw = (budgetInput.value || '').toString().trim();

    if (!groupId) {
        showMessage('Выберите группу', 'danger');
        return;
    }
    if (!roomName) {
        showMessage('Введите название комнаты', 'danger');
        return;
    }
    if (!businessType) {
        showMessage('Выберите тип бизнеса', 'danger');
        return;
    }
    if (!budgetRaw) {
        showMessage('Введите стартовый бюджет', 'danger');
        return;
    }

    const initialBudget = Number(budgetRaw);
    if (!Number.isFinite(initialBudget) || initialBudget < 0) {
        showMessage('Стартовый бюджет должен быть числом больше или равным 0', 'danger');
        return;
    }

    try {
        const response = await fetch('/api/rooms', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                groupId: groupId,
                roomName: roomName,
                businessType: businessType,
                initialBudget: initialBudget
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(function() { return {}; });
            showMessage(err.message || 'Не удалось создать комнату', 'danger');
            return;
        }

        const data = await response.json();

        const lastBlock = document.getElementById('lastRoomBlock');
        const lastNameEl = document.getElementById('lastRoomName');
        const lastIdEl = document.getElementById('lastRoomId');
        const lastStatusEl = document.getElementById('lastRoomStatus');

        if (lastNameEl) lastNameEl.textContent = data.roomName || roomName;
        if (lastIdEl) lastIdEl.textContent = data.roomId || '—';
        if (lastStatusEl) lastStatusEl.textContent = data.roomStatus || '—';
        if (lastBlock) lastBlock.classList.remove('d-none');

        showMessage('Комната создана', 'success');
    } catch (e) {
        showMessage('Не удалось создать комнату', 'danger');
    }
}

async function loadTeacherRooms() {
    if (!checkAuth()) return;

    const container = document.getElementById('teacherRoomsList');
    if (!container) return;

    container.innerHTML = 'Загрузка комнат...';

    try {
        const response = await fetch('/api/rooms', {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            container.innerHTML = 'Не удалось загрузить комнаты.';
            return;
        }

        const rooms = await response.json();
        if (!Array.isArray(rooms) || rooms.length === 0) {
            container.innerHTML = '<span class="text-muted">У вас пока нет комнат.</span>';
            return;
        }

        let html = '<div class="row g-3">';
        rooms.forEach(function(room) {
            const roomId = room.roomId || '';
            const name = room.roomName || 'Без названия';
            const status = room.roomStatus || '—';
            const businessType = room.businessType || '—';
            const budget = formatBudget(room.initialBudget);
            const period = (room.startDay || '—') + ' - ' + (room.endDay || '—');
            const duration = room.duration || '—';

            html += '<div class="col-lg-6">';
            html += '<div class="card h-100 border-0 shadow-sm">';
            html += '<div class="card-body">';
            html += '<div class="d-flex justify-content-between align-items-start mb-2">';
            html += '<h6 class="mb-0">' + name + '</h6>';
            html += '<span class="badge bg-secondary">' + status + '</span>';
            html += '</div>';
            html += '<div class="small text-muted mb-2">ID: ' + (roomId || '—') + '</div>';
            html += '<div class="small"><strong>Тип:</strong> ' + businessType + '</div>';
            html += '<div class="small"><strong>Бюджет:</strong> ' + budget + '</div>';
            html += '<div class="small"><strong>Период:</strong> дни ' + period + '</div>';
            html += '<div class="small mb-3"><strong>Длительность дня:</strong> ' + duration + ' сек</div>';
            html += '<div class="d-flex flex-wrap gap-2">';
            html += '<a class="btn btn-sm btn-outline-primary" href="/pages/teacher-room-students.html?roomId=' + encodeURIComponent(roomId) + '">';
            html += '<i class="bi bi-people"></i> Участники';
            html += '</a>';
            html += '<button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteRoom(\'' + roomId + '\')">';
            html += '<i class="bi bi-trash"></i> Удалить';
            html += '</button>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';

        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = 'Ошибка при загрузке комнат.';
    }
}

function formatBudget(value) {
    if (value === null || value === undefined || value === '') return '—';
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return String(value);
    return parsed.toLocaleString('ru-RU') + ' ₽';
}

async function deleteRoom(roomId) {
    if (!checkAuth()) return;
    if (!roomId) {
        showMessage('Некорректный id комнаты', 'danger');
        return;
    }

    if (!confirm('Удалить комнату? Это действие нельзя отменить.')) {
        return;
    }

    try {
        const response = await fetch('/api/rooms/' + roomId, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.status === 204) {
            showMessage('Комната удалена', 'success');
            loadTeacherRooms();
            return;
        }

        const err = await response.json().catch(function() { return {}; });
        showMessage(err.message || 'Не удалось удалить комнату', 'danger');
    } catch (e) {
        showMessage('Не удалось удалить комнату', 'danger');
    }
}

function openStudentSimulation() {
    window.location.href = '/pages/student-sim-room.html';
}

async function initStudentSimulationPage() {
    const empty = document.getElementById('studentSimEmptyState');
    await resolveMySimulationRoom();
    if (!window.__studentSimRoomId) {
        const wrap = document.getElementById('studentSimStateWrap');
        if (wrap) {
            wrap.innerHTML = '<span class="text-muted">Для вас пока не назначена комната симуляции.</span>';
        }
        if (empty) empty.classList.remove('d-none');
        return;
    }
    if (empty) empty.classList.add('d-none');
    await loadStudentSimulationMeta();
    await loadStudentRuntime();
    await loadStudentSimulationState();
    startStudentRuntimePolling();
}

function toggleSimDetails() {
    const card = document.getElementById('simDetailsCard');
    if (!card) return;
    card.classList.toggle('d-none');
}

async function loadStudentSimulationMeta() {
    const roomId = window.__studentSimRoomId;
    if (!roomId) return;

    // Defaults (in case backend endpoint is not implemented yet).
    const defaults = {
        minPrice: 50,
        unitPurchaseCost: 120,
        refPrice: 250,
        elasticity: 1.2,
        baseDemand: 55,
        rules: {
            staffSlots: 2,
            cap0: 60,
            juniorCapacity: 5,
            experiencedCapacity: 15,
            juniorSalaryMonth: 35000,
            experiencedSalaryMonth: 70000,
            rentPercent: 0.3,
            marketingRefPercent: 0.02,
            noiseMin: 0.85,
            noiseMax: 1.15
        }
    };

    try {
        // Recommended backend endpoint:
        // GET /api/sim/rooms/{roomId}/meta
        const res = await fetch('/api/sim/rooms/' + roomId + '/meta', {
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            window.__studentSimMeta = defaults;
            applyStudentSimulationMeta(defaults);
            return;
        }
        const meta = await res.json();
        const merged = Object.assign({}, defaults, meta || {});
        merged.rules = Object.assign({}, defaults.rules, (meta && meta.rules) ? meta.rules : {});
        window.__studentSimMeta = merged;
        applyStudentSimulationMeta(merged);
    } catch (e) {
        window.__studentSimMeta = defaults;
        applyStudentSimulationMeta(defaults);
    }
}

function fmtPct(x) {
    if (!Number.isFinite(Number(x))) return '—';
    return Math.round(Number(x) * 1000) / 10 + '%';
}

function applyStudentSimulationMeta(meta) {
    const m = meta || {};
    const rules = m.rules || {};

    const minPrice = Number.isFinite(Number(m.minPrice)) ? Number(m.minPrice) : 50;
    const unitCost = Number.isFinite(Number(m.unitPurchaseCost)) ? Number(m.unitPurchaseCost) : 120;

    const priceInput = document.getElementById('decisionPriceInput');
    if (priceInput) priceInput.min = String(minPrice);

    const priceHint = document.getElementById('decisionPriceHint');
    if (priceHint) priceHint.textContent = 'Минимальная цена: ' + minPrice.toLocaleString('ru-RU') + ' ₽.';

    const purchaseHint = document.getElementById('decisionPurchaseHint');
    if (purchaseHint) purchaseHint.textContent = 'Цена закупки: ' + unitCost.toLocaleString('ru-RU') + ' ₽ / ед.';

    const constraints = [];
    constraints.push('Мин. цена: ' + minPrice.toLocaleString('ru-RU') + ' ₽');
    constraints.push('Закупка: ' + unitCost.toLocaleString('ru-RU') + ' ₽ / ед.');
    if (Number.isFinite(Number(rules.staffSlots))) {
        constraints.push('Слоты персонала: ' + Number(rules.staffSlots));
    }
    if (Number.isFinite(Number(rules.cap0))) {
        constraints.push('Базовая мощность: ' + Number(rules.cap0) + ' ед./день');
    }
    if (Number.isFinite(Number(rules.juniorCapacity)) && Number.isFinite(Number(rules.experiencedCapacity))) {
        constraints.push('Мощность персонала: junior +' + Number(rules.juniorCapacity) + ', experienced +' + Number(rules.experiencedCapacity));
    }
    if (Number.isFinite(Number(rules.juniorSalaryMonth)) && Number.isFinite(Number(rules.experiencedSalaryMonth))) {
        constraints.push('Зарплата/мес: junior ' + Number(rules.juniorSalaryMonth).toLocaleString('ru-RU') +
            ' ₽, experienced ' + Number(rules.experiencedSalaryMonth).toLocaleString('ru-RU') + ' ₽');
    }
    if (Number.isFinite(Number(rules.rentPercent))) {
        constraints.push('Аренда: ' + fmtPct(rules.rentPercent) + ' от старт. бюджета / мес (делится на дни)');
    }
    if (Number.isFinite(Number(rules.marketingRefPercent))) {
        constraints.push('Маркетинг ref: ' + fmtPct(rules.marketingRefPercent) + ' от старт. бюджета');
    }
    if (Number.isFinite(Number(rules.noiseMin)) && Number.isFinite(Number(rules.noiseMax))) {
        constraints.push('Случайность спроса: ' + Number(rules.noiseMin) + '…' + Number(rules.noiseMax));
    }

    const constraintsText = document.getElementById('simConstraintsText');
    if (constraintsText) {
        constraintsText.textContent = constraints.length ? constraints.join(' · ') : '—';
    }

    const hintsBlock = document.getElementById('decisionHintsBlock');
    if (hintsBlock) {
        const parts = [];
        parts.push('Закупка стоит денег: ' + unitCost.toLocaleString('ru-RU') + ' ₽/ед.');
        if (Number.isFinite(Number(rules.staffSlots))) {
            parts.push('Найм ограничен слотами персонала.');
        }
        parts.push('Маркетинг списывается один раз за день.');
        hintsBlock.textContent = parts.join(' ');
    }
}

async function resolveMySimulationRoom() {
    try {
        const response = await fetch('/api/sim/my-room', {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            if (response.status === 404 || response.status === 403) {
                return;
            }
            const err = await response.json().catch(function() { return {}; });
            if (err && err.message) {
                showMessage(err.message, 'danger');
            }
            return;
        }
        const data = await response.json();
        const roomId = data.roomId || data.id || '';
        if (!roomId) return;
        window.__studentSimRoomId = roomId;
        window.__studentSimDayDurationSeconds = data.dayDurationSeconds || 30;
        const subtitle = document.getElementById('studentSimSubtitle');
        if (subtitle) {
            subtitle.textContent = 'Комната: ' + roomId;
        }
    } catch (e) {
    }
}

function startStudentRuntimePolling() {
    if (window.__studentRuntimePollingId) {
        clearInterval(window.__studentRuntimePollingId);
    }
    window.__studentRuntimePollingId = setInterval(function() {
        loadStudentRuntime();
    }, 1000);

    // Local UI clock: keeps timer/progress moving smoothly.
    if (window.__studentUiClockId) {
        clearInterval(window.__studentUiClockId);
    }
    window.__studentUiClockId = setInterval(function() {
        const rt = window.__studentSimRuntime || null;
        if (!rt) return;
        applyStudentRuntime(rt);
    }, 250);

    if (window.__studentStatePollingId) {
        clearInterval(window.__studentStatePollingId);
    }
    window.__studentStatePollingId = setInterval(function() {
        const rt = window.__studentSimRuntime || null;
        if (!rt) return;
        if (rt.finishedAt) return;
        if (!rt.startedAt) return;
        loadStudentSimulationState();
    }, 3000);
}

async function loadStudentRuntime() {
    const roomId = window.__studentSimRoomId;
    if (!roomId) return;
    try {
        const response = await fetch('/api/sim/rooms/' + roomId + '/runtime', {
            headers: getAuthHeaders()
        });
        if (!response.ok) return;
        const runtime = await response.json();
        applyStudentRuntime(runtime);
    } catch (e) {
    }
}

function applyStudentRuntime(runtime) {
    window.__studentSimRuntime = runtime || null;
    const dayEl = document.getElementById('simCurrentDayValue');
    const timerEl = document.getElementById('simDayTimerValue');
    const speedEl = document.getElementById('simSpeedValue');
    const runningEl = document.getElementById('simRunningValue');
    if (dayEl) dayEl.textContent = runtime.currentDay ?? '—';

    const speed = runtime.speedMultiplier ?? runtime.speedMultiplayer ?? 1;
    if (speedEl) speedEl.textContent = 'x' + speed;
    // Backend may keep finishedAt from previous run; treat as finished only when not running.
    const isFinished = !!runtime.finishedAt && !runtime.running;
    if (runningEl) {
        runningEl.textContent = isFinished ? 'Завершена' : (runtime.running ? 'Идет' : 'Пауза');
    }

    const dayDuration = runtime.dayDurationSeconds ?? window.__studentSimDayDurationSeconds ?? 30;
    const adjustedDuration = Math.max(1, Math.floor(dayDuration / Math.max(1, speed)));

    // Robust LocalDateTime parsing (backend sends LocalDateTime.toString()).
    // Example: 2026-04-21T20:12:33.737123 or 2026-04-21T20:12:33.737
    function parseLocalDateTimeToMs(s) {
        if (!s || typeof s !== 'string') return null;
        const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?$/);
        if (!m) return null;
        const year = Number(m[1]);
        const month = Number(m[2]);
        const day = Number(m[3]);
        const hh = Number(m[4]);
        const mm = Number(m[5]);
        const ss = Number(m[6]);
        let frac = m[7] || '';
        // normalize to milliseconds (3 digits)
        if (frac.length > 3) frac = frac.slice(0, 3);
        while (frac.length < 3) frac += '0';
        const ms = Number(frac || '0');
        const d = new Date(year, month - 1, day, hh, mm, ss, ms);
        const t = d.getTime();
        return Number.isFinite(t) ? t : null;
    }

    const serverTickMs = parseLocalDateTimeToMs(runtime.lastTickAt);
    const nowMs = Date.now();

    // Maintain a local "day base" so timer keeps ticking between fetches.
    // Update base when server tick changes, day changes, or we start running.
    const prevSig = window.__studentSimLastTickSig || null;
    const sig = (runtime.currentDay ?? '') + '|' + (runtime.lastTickAt ?? '') + '|' + (runtime.running ? '1' : '0');
    if (sig !== prevSig) {
        window.__studentSimLastTickSig = sig;
        if (serverTickMs != null) {
            window.__studentSimDayBaseMs = serverTickMs;
        } else if (runtime.running) {
            window.__studentSimDayBaseMs = nowMs;
        }
    }

    let secLeft = adjustedDuration;
    if (runtime.running) {
        const base = window.__studentSimDayBaseMs || nowMs;
        const elapsedSec = Math.floor((nowMs - base) / 1000);
        secLeft = Math.max(0, adjustedDuration - elapsedSec);
    }
    if (timerEl) {
        timerEl.textContent = secLeft + ' сек';
    }

    const progressBar = document.getElementById('simDayProgressBar');
    if (progressBar) {
        const elapsed = Math.max(0, adjustedDuration - secLeft);
        const pct = Math.max(0, Math.min(100, Math.round((elapsed / adjustedDuration) * 100)));
        progressBar.style.width = pct + '%';
    }

    if (isFinished) {
        if (window.__studentRuntimePollingId) {
            clearInterval(window.__studentRuntimePollingId);
            window.__studentRuntimePollingId = null;
        }
        if (window.__studentStatePollingId) {
            clearInterval(window.__studentStatePollingId);
            window.__studentStatePollingId = null;
        }
        if (window.__studentUiClockId) {
            clearInterval(window.__studentUiClockId);
            window.__studentUiClockId = null;
        }
    }
}

async function studentRuntimeAction(url, successMessage) {
    if (!checkAuth()) return;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const err = await response.json().catch(function() { return {}; });
            showMessage(err.message || 'Операция симуляции не выполнена', 'danger');
            return;
        }
        showMessage(successMessage, 'success');
        await loadStudentRuntime();
        await loadStudentSimulationState();
        // Ensure UI timers/polling are alive after any action.
        if (!window.__studentRuntimePollingId || !window.__studentUiClockId) {
            startStudentRuntimePolling();
        }
    } catch (e) {
        showMessage('Не удалось выполнить операцию симуляции', 'danger');
    }
}

async function startStudentSimulation() {
    const roomId = window.__studentSimRoomId;
    if (!roomId) return;
    await studentRuntimeAction('/api/sim/rooms/' + roomId + '/start', 'Симуляция начата');
}

async function pauseStudentSimulation() {
    const roomId = window.__studentSimRoomId;
    if (!roomId) return;
    await studentRuntimeAction('/api/sim/rooms/' + roomId + '/pause', 'Симуляция поставлена на паузу');
}

async function resumeStudentSimulation() {
    const roomId = window.__studentSimRoomId;
    if (!roomId) return;
    await studentRuntimeAction('/api/sim/rooms/' + roomId + '/resume', 'Симуляция продолжена');
}

async function finishStudentSimulation() {
    const roomId = window.__studentSimRoomId;
    if (!roomId) return;
    if (!confirm('Завершить симуляцию?')) return;
    await studentRuntimeAction('/api/sim/rooms/' + roomId + '/finish', 'Симуляция завершена');
}

async function setStudentSimulationSpeed(speed) {
    const roomId = window.__studentSimRoomId;
    if (!roomId) return;
    await studentRuntimeAction('/api/sim/rooms/' + roomId + '/speed/' + speed, 'Скорость изменена на x' + speed);
}

async function respawnStudentSimulation() {
    const roomId = window.__studentSimRoomId;
    if (!roomId) return;
    if (!confirm('Сбросить симуляцию и начать заново?')) return;
    await studentRuntimeAction('/api/sim/rooms/' + roomId + '/respawn', 'Симуляция сброшена');
}

function readSimNumber(id, fallback) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    const raw = (el.value || '').toString().trim();
    if (!raw) return fallback;
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return n;
}

async function submitStudentDecision() {
    if (!checkAuth()) return;
    const roomId = window.__studentSimRoomId;
    if (!roomId) {
        showMessage('Комната не назначена', 'danger');
        return;
    }

    // Client-side hints to match backend rules:
    // - marketing is a one-day expense (we will reset it after submit)
    // - purchase has unit cost (~120) and may be capped by available cash on backend
    const meta = window.__studentSimMeta || {};
    const UNIT_PURCHASE_COST = Number.isFinite(Number(meta.unitPurchaseCost)) ? Number(meta.unitPurchaseCost) : 120;

    const payload = {
        roomId: roomId,
        price: readSimNumber('decisionPriceInput', null),
        purchaseUnits: readSimNumber('decisionPurchaseUnitsInput', 0),
        marketingBudget: readSimNumber('decisionMarketingInput', 0),
        hireJunior: readSimNumber('decisionHireJuniorInput', 0),
        fireJunior: readSimNumber('decisionFireJuniorInput', 0),
        hireExperienced: readSimNumber('decisionHireExperiencedInput', 0),
        fireExperienced: readSimNumber('decisionFireExperiencedInput', 0)
    };

    // Basic sanity: avoid NaN/negatives
    if (payload.purchaseUnits < 0) payload.purchaseUnits = 0;
    if (payload.marketingBudget < 0) payload.marketingBudget = 0;
    if (payload.hireJunior < 0) payload.hireJunior = 0;
    if (payload.fireJunior < 0) payload.fireJunior = 0;
    if (payload.hireExperienced < 0) payload.hireExperienced = 0;
    if (payload.fireExperienced < 0) payload.fireExperienced = 0;

    // Warn if planned spending likely exceeds cash (backend should cap/adjust).
    const st = window.__studentSimLastState || null;
    const cash = st && Number.isFinite(Number(st.cash)) ? Number(st.cash) : null;
    const plannedPurchaseCost = payload.purchaseUnits * UNIT_PURCHASE_COST;
    const plannedSpend = plannedPurchaseCost + Number(payload.marketingBudget || 0);
    if (cash != null && plannedSpend > cash && plannedSpend > 0) {
        const ok = confirm(
            'Похоже, расходов больше чем денег на балансе.\n' +
            'Закупка ~ ' + plannedPurchaseCost.toLocaleString('ru-RU') + ' ₽ + маркетинг ' + Number(payload.marketingBudget || 0).toLocaleString('ru-RU') + ' ₽.\n' +
            'Баланс: ' + cash.toLocaleString('ru-RU') + ' ₽.\n\n' +
            'Продолжить отправку? (Сервер может ограничить закупку/расходы)'
        );
        if (!ok) return;
    }

    try {
        const response = await fetch('/api/sim/decision', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json().catch(function() { return {}; });
            showMessage(err.message || 'Не удалось отправить решение', 'danger');
            return;
        }

        showMessage('Решение отправлено. Маркетинг считается расходом только текущего дня. Результаты появятся после окончания дня.', 'success');
        await loadStudentRuntime();

        // Reset one-day fields so UI matches "per day" semantics.
        // Keep price as a strategic setting the student may want to leave.
        const resetIds = [
            'decisionPurchaseUnitsInput',
            'decisionMarketingInput',
            'decisionHireJuniorInput',
            'decisionFireJuniorInput',
            'decisionHireExperiencedInput',
            'decisionFireExperiencedInput'
        ];
        resetIds.forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    } catch (e) {
        showMessage('Не удалось отправить решение', 'danger');
    }
}

function resetStudentDecisionForm() {
    const ids = [
        'decisionPriceInput',
        'decisionPurchaseUnitsInput',
        'decisionMarketingInput',
        'decisionHireJuniorInput',
        'decisionFireJuniorInput',
        'decisionHireExperiencedInput',
        'decisionFireExperiencedInput'
    ];
    ids.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

async function loadStudentSimulationState() {
    if (!checkAuth()) return;
    const roomId = window.__studentSimRoomId;
    const wrap = document.getElementById('studentSimStateWrap');
    const subtitle = document.getElementById('studentSimSubtitle');
    if (!roomId) {
        if (wrap) wrap.innerHTML = '<span class="text-muted">Комната не назначена.</span>';
        return;
    }
    const rt = window.__studentSimRuntime || null;
    if (rt && rt.finishedAt) {
        if (wrap) {
            wrap.innerHTML = '<span class="text-muted">Симуляция завершена.</span>';
        }
        return;
    }
    if (subtitle) {
        subtitle.textContent = 'Комната: ' + roomId;
    }
    if (wrap) {
        wrap.innerHTML = 'Загрузка...';
    }

    try {
        const response = await fetch('/api/sim/rooms/' + roomId + '/my-state', {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const err = await response.json().catch(function() { return {}; });
            const msg = (err && err.message) ? err.message : '';
            const isStateNotFound = msg.toLowerCase().includes('state') || msg.toLowerCase().includes('состоя');
            if (wrap) {
                wrap.innerHTML = isStateNotFound
                    ? '<span class="text-muted">Состояние ещё не создано. Нажмите “Начать”.</span>'
                    : '<span class="text-danger">Не удалось загрузить состояние.</span>';
            }
            if (!isStateNotFound) {
                showMessage(msg || 'Не удалось загрузить состояние', 'danger');
            }
            return;
        }

        const state = await response.json();
        if (!wrap) return;
        window.__studentSimLastState = state;

        // Update decision limits based on staff slots.
        const meta = window.__studentSimMeta || {};
        const rules = meta.rules || {};
        const slots = Number.isFinite(Number(rules.staffSlots)) ? Number(rules.staffSlots) : null;
        const junior = Number(state.juniorCount ?? 0);
        const exp = Number(state.experiencedCount ?? 0);
        const totalStaff = (Number.isFinite(junior) ? junior : 0) + (Number.isFinite(exp) ? exp : 0);
        if (slots != null) {
            const free = Math.max(0, slots - totalStaff);
            const hj = document.getElementById('decisionHireJuniorInput');
            const he = document.getElementById('decisionHireExperiencedInput');
            if (hj) hj.max = String(free);
            if (he) he.max = String(free);
            const hireHint = document.getElementById('decisionHireHint');
            if (hireHint) hireHint.textContent = 'Слоты: ' + totalStaff + '/' + slots + ' (свободно: ' + free + ').';
        }

        let html = '';
        // Compact "start screen" summary (visible even before start).
        const staffLine = slots != null
            ? (totalStaff + ' / ' + slots + ' (занято/слоты)')
            : String(totalStaff);
        html += '<div class="small mb-1"><strong>Баланс:</strong> ' + formatBudget(state.cash) + '</div>';
        html += '<div class="small mb-1"><strong>Склад:</strong> ' + (state.stockUnits ?? '—') + '</div>';
        html += '<div class="small mb-1"><strong>Цена:</strong> ' + formatBudget(state.price) + '</div>';
        html += '<div class="small mb-1"><strong>Сотрудники:</strong> ' + staffLine + '</div>';
        html += '<div class="small mb-1"><strong>Маркетинг (последний день):</strong> ' + formatBudget(state.marketingBudget) + '</div>';
        html += '<div class="small mb-1"><strong>Новички:</strong> ' + (state.juniorCount ?? 0) + '</div>';
        html += '<div class="small mb-1"><strong>Опытные:</strong> ' + (state.experiencedCount ?? 0) + '</div>';
        html += '<div class="small mb-1"><strong>Накопленная прибыль:</strong> ' + formatBudget(state.cumulativeProfit) + '</div>';
        html += '<div class="small"><strong>Банкрот:</strong> ' + (state.bankrupt ? 'Да' : 'Нет') + '</div>';
        wrap.innerHTML = html;
    } catch (e) {
        if (wrap) wrap.innerHTML = '<span class="text-danger">Ошибка загрузки.</span>';
        showMessage('Ошибка при загрузке состояния', 'danger');
    }
}

function initRoomStudentsPage(roomId) {
    window.__roomStudentsRoomId = roomId;
    loadRoomStudentsPageData(roomId);
}

function resolveStudentUserId(participant, groupStudents) {
    if (!participant) return '';
    if (participant.userStudentId) return participant.userStudentId;
    if (participant.userId) return participant.userId;
    const u = participant.username || '';
    const e = participant.email || '';
    const list = groupStudents || [];
    for (let i = 0; i < list.length; i++) {
        const s = list[i];
        if (s.username === u || (s.emailStudent && s.emailStudent === e)) {
            return s.studentId || '';
        }
    }
    return participant.studentId || '';
}

function fillAddRoomStudentSelect(roomId, members, groupStudents) {
    const select = document.getElementById('addRoomStudentSelect');
    if (!select) return;

    const inRoomIds = {};
    (members || []).forEach(function(m) {
        const uid = resolveStudentUserId(m, groupStudents);
        if (uid) inRoomIds[uid] = true;
    });

    let options = '<option value="">Выберите студента</option>';
    const students = groupStudents || [];
    let count = 0;
    students.forEach(function(s) {
        const sid = s.studentId || '';
        if (!sid || inRoomIds[sid]) return;
        const labelParts = [];
        if (s.nameStudent) labelParts.push(s.nameStudent);
        if (s.username) labelParts.push('(' + s.username + ')');
        const label = labelParts.length ? labelParts.join(' ') : sid;
        options += '<option value="' + sid + '">' + label + '</option>';
        count++;
    });

    select.innerHTML = options;
    select.disabled = count === 0;
}

function renderRoomStudentsTable(roomId, members, groupStudents) {
    const wrap = document.getElementById('roomStudentsTableWrap');
    if (!wrap) return;

    if (!Array.isArray(members) || members.length === 0) {
        wrap.innerHTML = '<span class="text-muted">В комнате пока нет студентов.</span>';
        return;
    }

    let html = '<div class="table-responsive"><table class="table table-sm align-middle mb-0">';
    html += '<thead><tr><th>Студент</th><th>Логин</th><th>Email</th><th>Статус</th><th></th></tr></thead><tbody>';
    members.forEach(function(m) {
        const name = m.fullName || '—';
        const username = m.username || '—';
        const email = m.email || '—';
        const status = m.status || '—';
        const userIdForRemove = resolveStudentUserId(m, groupStudents);
        html += '<tr>';
        html += '<td>' + name + '</td>';
        html += '<td>' + username + '</td>';
        html += '<td>' + email + '</td>';
        html += '<td><span class="badge bg-secondary">' + status + '</span></td>';
        html += '<td class="text-end">';
        if (userIdForRemove) {
            html += '<button type="button" class="btn btn-sm btn-outline-danger" onclick="removeRoomParticipant(\'' +
                roomId + '\',\'' + userIdForRemove + '\')">Убрать</button>';
        } else {
            html += '<span class="text-muted small">—</span>';
        }
        html += '</td>';
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    wrap.innerHTML = html;
}

async function loadRoomStudentsPageData(roomId) {
    const titleEl = document.getElementById('roomStudentsTitle');
    const subEl = document.getElementById('roomStudentsSubtitle');
    const wrap = document.getElementById('roomStudentsTableWrap');

    if (wrap) wrap.innerHTML = 'Загрузка...';

    try {
        const [roomsRes, groupsRes, studentsRes] = await Promise.all([
            fetch('/api/rooms', { headers: getAuthHeaders() }),
            fetch('/api/groups/teacher', { headers: getAuthHeaders() }),
            fetch('/api/rooms/' + roomId + '/students', { headers: getAuthHeaders() })
        ]);

        if (!roomsRes.ok || !groupsRes.ok) {
            if (wrap) wrap.innerHTML = 'Не удалось загрузить данные.';
            showMessage('Не удалось загрузить комнату или группы', 'danger');
            return;
        }

        const rooms = await roomsRes.json();
        const room = Array.isArray(rooms) ? rooms.find(function(r) { return r.roomId === roomId; }) : null;
        if (!room) {
            if (wrap) wrap.innerHTML = 'Комната не найдена.';
            showMessage('Комната не найдена', 'danger');
            return;
        }

        if (titleEl) titleEl.textContent = room.roomName || 'Комната';
        const groups = await groupsRes.json();
        const gid = room.groupId || '';
        const group = Array.isArray(groups) ? groups.find(function(g) {
            return (g.groupId || g.id) === gid;
        }) : null;
        const gname = group && (group.groupName || group.name) ? (group.groupName || group.name) : gid;
        if (subEl) subEl.textContent = 'Группа: ' + (gname || '—') + ' · Управление составом комнаты';

        const groupStudents = group && group.students ? group.students : [];
        window.__roomStudentsGroupStudents = groupStudents;

        let members = [];
        if (studentsRes.ok) {
            members = await studentsRes.json();
        } else {
            if (wrap) wrap.innerHTML = 'Не удалось загрузить участников.';
            showMessage('Не удалось загрузить список участников комнаты', 'danger');
            return;
        }

        window.__roomStudentsMembers = members;
        fillAddRoomStudentSelect(roomId, members, groupStudents);
        renderRoomStudentsTable(roomId, members, groupStudents);
    } catch (e) {
        if (wrap) wrap.innerHTML = 'Ошибка загрузки.';
        showMessage('Ошибка при загрузке страницы', 'danger');
    }
}

async function reloadRoomStudentsList() {
    const roomId = window.__roomStudentsRoomId;
    if (!roomId) return;

    const wrap = document.getElementById('roomStudentsTableWrap');
    if (wrap) wrap.innerHTML = 'Загрузка...';

    try {
        const res = await fetch('/api/rooms/' + roomId + '/students', { headers: getAuthHeaders() });
        if (!res.ok) {
            if (wrap) wrap.innerHTML = 'Не удалось обновить список.';
            return;
        }
        const members = await res.json();
        window.__roomStudentsMembers = members;
        const groupStudents = window.__roomStudentsGroupStudents || [];
        fillAddRoomStudentSelect(roomId, members, groupStudents);
        renderRoomStudentsTable(roomId, members, groupStudents);
    } catch (e) {
        if (wrap) wrap.innerHTML = 'Ошибка.';
    }
}

async function submitAddRoomStudent() {
    if (!checkAuth()) return;
    const roomId = window.__roomStudentsRoomId;
    const select = document.getElementById('addRoomStudentSelect');
    if (!roomId || !select) return;

    const studentId = (select.value || '').trim();
    if (!studentId) {
        showMessage('Выберите студента', 'danger');
        return;
    }

    try {
        const response = await fetch('/api/rooms/' + roomId + '/students', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ studentId: studentId })
        });

        if (response.status === 201 || response.status === 200) {
            showMessage('Студент добавлен в комнату', 'success');
            if (select) select.value = '';
            await reloadRoomStudentsList();
            return;
        }

        const err = await response.json().catch(function() { return {}; });
        showMessage(err.message || 'Не удалось добавить студента', 'danger');
    } catch (e) {
        showMessage('Не удалось добавить студента', 'danger');
    }
}

async function removeRoomParticipant(roomId, studentUserId) {
    if (!checkAuth()) return;
    if (!roomId || !studentUserId) return;

    if (!confirm('Убрать студента из комнаты?')) {
        return;
    }

    try {
        const response = await fetch('/api/rooms/' + roomId + '/students/' + studentUserId, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (response.status === 204) {
            showMessage('Студент убран из комнаты', 'success');
            await reloadRoomStudentsList();
            return;
        }

        const err = await response.json().catch(function() { return {}; });
        showMessage(err.message || 'Не удалось убрать студента', 'danger');
    } catch (e) {
        showMessage('Не удалось убрать студента', 'danger');
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

