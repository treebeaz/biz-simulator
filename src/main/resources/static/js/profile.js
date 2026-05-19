document.addEventListener('DOMContentLoaded', function () {
    if (!checkAuth()) return;
    loadProfileData();

    const role = localStorage.getItem('userRole');
    const teacherRoomCreateRoot = document.getElementById('teacherRoomCreateRoot');
    const teacherRoomsListRoot = document.getElementById('teacherRoomsListRoot');
    const teacherRoomParticipantsRoot = document.getElementById('teacherRoomParticipantsRoot');
    const teacherRoomSettingsRoot = document.getElementById('teacherRoomSettingsRoot');
    const studentRoomRoot = document.getElementById('studentRoomRoot');
    const studentSimulationRoot = document.getElementById('studentSimulationRoot');
    const studentSimulationResultsRoot = document.getElementById('studentSimulationResultsRoot');

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

    if (studentSimulationResultsRoot) {
        if (role !== 'STUDENT') {
            window.location.href = '/profile';
            return;
        }
        initStudentSimulationResultsPage();
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

function handleUnauthorized(response) {
    if (response && (response.status === 401 || response.status === 403)) {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        window.location.href = '/auth/login';
        return true;
    }
    return false;
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
    elements.forEach(function (el) {
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
        const response = await fetch('/api/user/profile', {headers: getAuthHeaders()});
        if (handleUnauthorized(response)) return;
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
            body: JSON.stringify({joinCode: joinCode})
        });

        if (response.status === 204) {
            showMessage('Вы присоединились к группе', 'success');
            input.value = '';
            loadStudentGroup();
            return;
        }

        const err = await response.json().catch(function () {
            return {};
        });
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
        const response = await fetch('/api/groups/my', {headers: getAuthHeaders()});
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
                classmates.forEach(function (c) {
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
            body: JSON.stringify({name: name})
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
        const response = await fetch('/api/groups/teacher', {headers: getAuthHeaders()});
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
            const response = await fetch('/api/groups/' + groupId + '/code', {headers: getAuthHeaders()});
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
            const err = await response.json().catch(function () {
                return {};
            });
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
        rooms.forEach(function (room) {
            html += renderRoomCard(room);
        });
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
        const err = await response.json().catch(function () {
            return {};
        });
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

        const data = await response.json().catch(function () {
            return null;
        });
        if (!Array.isArray(data)) {
            contentEl.innerHTML = '<span class="text-warning">Бэкенд еще не отдает список участников в формате JSON для аналитики.</span>';
            return;
        }
        if (data.length === 0) {
            contentEl.innerHTML = '<span class="text-muted">В комнате пока нет студентов.</span>';
            return;
        }
        contentEl.innerHTML = renderTeacherParticipantsList(roomId, data);
    } catch (e) {
        contentEl.innerHTML = '<span class="text-danger">Ошибка запроса.</span>';
    }
}

function renderTeacherParticipantsList(roomId, participants) {
    var html = '<div class="list-group">';
    participants.forEach(function (p) {
        var studentId = p.studentId || p.userId || p.id || '';
        var displayName = p.fullName || p.name || p.username || p.email || studentId;
        var meta = '';
        if (p.currentStep != null) meta += ' · ходов: ' + p.currentStep;
        html += '<button type="button" class="list-group-item list-group-item-action" onclick="loadTeacherStudentAnalytics(\'' + roomId + '\', \'' + studentId + '\', \'' + String(displayName).replace(/'/g, '&#39;') + '\')">';
        html += '<div class="fw-semibold">' + displayName + '</div>';
        var sub = '';
        if (p.username) sub += '@' + p.username;
        if (p.email) sub += (sub ? ' · ' : '') + p.email;
        sub += meta;
        if (sub) html += '<div class="small text-muted">' + sub + '</div>';
        html += '</button>';
    });
    html += '</div>';
    return html;
}

async function loadTeacherStudentAnalytics(roomId, studentId, displayName) {
    var nameEl = document.getElementById('teacherAnalyticsStudentName');
    var emptyEl = document.getElementById('teacherAnalyticsChartsEmpty');
    var wrapEl = document.getElementById('teacherAnalyticsChartsWrap');
    var tableEl = document.getElementById('teacherHistoryTableWrap');
    if (nameEl) nameEl.textContent = displayName || 'Студент';
    if (tableEl) tableEl.innerHTML = 'Загрузка...';
    setTeacherGradeUiEnabled(true);
    setTeacherGradeContext(roomId, studentId, displayName);
    await loadTeacherGrade(roomId, studentId);

    try {
        var response = await fetch('/api/simulation/rooms/' + roomId + '/participant/' + studentId + '/history', {
            headers: getAuthHeaders()
        });
        if (handleUnauthorized(response)) return;
        if (!response.ok) {
            var msg = 'Не удалось получить историю студента. HTTP ' + response.status;
            var err = await response.json().catch(function () {
                return null;
            });
            if (err && err.message) msg += ' · ' + err.message;
            if (tableEl) tableEl.innerHTML = '<span class="text-danger">' + msg + '</span>';
            if (emptyEl) emptyEl.classList.remove('d-none');
            if (wrapEl) wrapEl.classList.add('d-none');
            return;
        }
        var history = await response.json().catch(function () {
            return null;
        });
        if (!Array.isArray(history) || history.length === 0) {
            if (tableEl) tableEl.innerHTML = '<span class="text-muted">У студента пока нет ходов.</span>';
            if (emptyEl) emptyEl.classList.remove('d-none');
            if (wrapEl) wrapEl.classList.add('d-none');
            return;
        }
        var normalized = history.map(function (t) {
            return {
                step: t.step,
                price: t.price,
                purchaseQuantity: t.purchaseQuantity,
                marketingExpense: t.marketingExpense,
                staffChange: t.staffChange,
                demand: t.demand,
                sales: t.sales,
                revenue: t.revenue,
                totalCost: t.totalCost,
                profit: t.profit,
                cashAfter: t.cashAfter,
                stockAfter: t.stockAfter,
                cashChange: (t.cashChange != null ? t.cashChange : null),
                event: t.triggeredEventDto || t.event || null
            };
        });
        teacherAnalyticsContext.roomId = roomId;
        teacherAnalyticsContext.studentId = studentId;
        teacherAnalyticsContext.displayName = displayName;
        teacherAnalyticsContext.turns = normalized;
        if (tableEl) tableEl.innerHTML = buildTurnsTableHtml(normalized);
        if (emptyEl) emptyEl.classList.add('d-none');
        if (wrapEl) wrapEl.classList.remove('d-none');
        renderAnalyticsCharts('teacher', normalized);
    } catch (e) {
        if (tableEl) tableEl.innerHTML = '<span class="text-danger">Ошибка при загрузке аналитики.</span>';
        if (emptyEl) emptyEl.classList.remove('d-none');
        if (wrapEl) wrapEl.classList.add('d-none');
    }
}

var teacherAnalyticsContext = {
    roomId: null,
    studentId: null,
    displayName: null,
    turns: []
};

function downloadTeacherStudentCsv() {
    if (!teacherAnalyticsContext.roomId || !teacherAnalyticsContext.studentId) {
        showMessage('Сначала выберите студента.', 'warning');
        return;
    }
    var turns = teacherAnalyticsContext.turns || [];
    if (!Array.isArray(turns) || turns.length === 0) {
        showMessage('У студента нет ходов для CSV.', 'warning');
        return;
    }
    var name = (teacherAnalyticsContext.displayName || 'student').toString().replace(/[\\/:*?"<>|]+/g, '_');
    var csv = turnsToCsv(turns);
    downloadTextFile('turn-history-' + name + '.csv', csv, 'text/csv;charset=utf-8');
}

var teacherGradeContext = {
    roomId: null,
    studentId: null,
    displayName: null
};

function setTeacherGradeContext(roomId, studentId, displayName) {
    teacherGradeContext.roomId = roomId;
    teacherGradeContext.studentId = studentId;
    teacherGradeContext.displayName = displayName;
}

function setTeacherGradeUiEnabled(enabled) {
    var v = document.getElementById('teacherGradeValue');
    var c = document.getElementById('teacherGradeComment');
    var s = document.getElementById('teacherGradeSaveBtn');
    var cl = document.getElementById('teacherGradeClearBtn');
    if (v) v.disabled = !enabled;
    if (c) c.disabled = !enabled;
    if (s) s.disabled = !enabled;
    if (cl) cl.disabled = !enabled;
}

function clearTeacherGradeForm() {
    var v = document.getElementById('teacherGradeValue');
    var c = document.getElementById('teacherGradeComment');
    var st = document.getElementById('teacherGradeStatus');
    if (v) v.value = '';
    if (c) c.value = '';
    if (st) st.textContent = '—';
}

async function loadTeacherGrade(roomId, studentId) {
    clearTeacherGradeForm();
    var st = document.getElementById('teacherGradeStatus');
    if (st) st.textContent = 'Загрузка...';

    try {
        var resp = await fetch('/api/grades/rooms/' + roomId + '/students/' + studentId, {
            headers: getAuthHeaders()
        });
        if (handleUnauthorized(resp)) return;
        if (resp.status === 404) {
            if (st) st.textContent = 'Оценка не выставлена';
            return;
        }
        if (!resp.ok) {
            if (st) st.textContent = 'Не удалось загрузить оценку';
            return;
        }
        var data = await resp.json().catch(function () {
            return null;
        });
        if (!data) {
            if (st) st.textContent = 'Не удалось прочитать оценку';
            return;
        }
        var v = document.getElementById('teacherGradeValue');
        var c = document.getElementById('teacherGradeComment');
        if (v) v.value = data.gradeValue ?? '';
        if (c) c.value = data.comment ?? '';
        if (st) st.textContent = 'Сохранено';
    } catch (e) {
        if (st) st.textContent = 'Ошибка загрузки';
    }
}

async function saveTeacherGrade() {
    var roomId = teacherGradeContext.roomId;
    var studentId = teacherGradeContext.studentId;
    if (!roomId || !studentId) return;

    var vEl = document.getElementById('teacherGradeValue');
    var cEl = document.getElementById('teacherGradeComment');
    var st = document.getElementById('teacherGradeStatus');
    var gradeValue = vEl && vEl.value !== '' ? parseInt(vEl.value, 10) : null;
    var comment = cEl ? (cEl.value || '').trim() : '';

    if (gradeValue !== null && (!Number.isInteger(gradeValue) || gradeValue < 0 || gradeValue > 100)) {
        showMessage('Оценка должна быть целым числом от 0 до 100', 'danger');
        return;
    }

    try {
        if (st) st.textContent = 'Сохранение...';
        var resp = await fetch('/api/grades/rooms/' + roomId + '/students/' + studentId, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({gradeValue: gradeValue, comment: comment})
        });
        if (handleUnauthorized(resp)) return;
        if (!resp.ok) {
            var err = await resp.json().catch(function () {
                return {};
            });
            showMessage(err.message || 'Не удалось сохранить оценку', 'danger');
            if (st) st.textContent = 'Ошибка сохранения';
            return;
        }
        if (st) st.textContent = 'Сохранено';
        showMessage('Оценка сохранена', 'success');
    } catch (e) {
        if (st) st.textContent = 'Ошибка сохранения';
        showMessage('Не удалось сохранить оценку', 'danger');
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
        loadStudentGradeForRoom(room.id);
    } catch (e) {
        el.textContent = 'Не удалось прочитать сохранённые данные комнаты.';
    }
}

async function loadStudentGradeForRoom(roomId) {
    var statusEl = document.getElementById('studentGradeStatus');
    var wrapEl = document.getElementById('studentGradeWrap');
    if (statusEl) statusEl.textContent = 'Загрузка...';
    if (!roomId || !wrapEl) return;

    try {
        var resp = await fetch('/api/grades/rooms/' + roomId + '/me', {
            headers: getAuthHeaders()
        });
        if (handleUnauthorized(resp)) return;
        if (resp.status === 404) {
            if (statusEl) statusEl.textContent = 'Нет оценки';
            wrapEl.innerHTML = '<span class="text-muted">Оценка ещё не выставлена.</span>';
            return;
        }
        if (!resp.ok) {
            if (statusEl) statusEl.textContent = 'Ошибка';
            wrapEl.innerHTML = '<span class="text-danger">Не удалось загрузить оценку.</span>';
            return;
        }
        var data = await resp.json().catch(function () {
            return null;
        });
        if (!data) {
            if (statusEl) statusEl.textContent = 'Ошибка';
            wrapEl.innerHTML = '<span class="text-danger">Не удалось прочитать оценку.</span>';
            return;
        }
        if (statusEl) statusEl.textContent = 'Доступно';
        var html = '';
        html += '<div><strong>Баллы:</strong> ' + (data.gradeValue ?? '—') + ' / 100</div>';
        if (data.comment) html += '<div class="text-muted"><strong>Комментарий:</strong> ' + String(data.comment) + '</div>';
        wrapEl.innerHTML = html;
    } catch (e) {
        if (statusEl) statusEl.textContent = 'Ошибка';
        wrapEl.innerHTML = '<span class="text-danger">Не удалось загрузить оценку.</span>';
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
            body: JSON.stringify({joinCode: joinCode})
        });
        if (!response.ok) {
            const err = await response.json().catch(function () {
                return {};
            });
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

    mapping.forEach(function (pair) {
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
            const err = await response.json().catch(function () {
                return {};
            });
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
            const err = await response.json().catch(function () {
                return {};
            });
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


var SIM_DAY_MS = 30000;

var simAuto = {
    active: false,
    paused: false,
    nextTurnAt: 0,
    pausedRemainingMs: 0,
    intervalId: null,
    turnInFlight: false
};
var simContext = {
    room: null,
    settings: null
};
var simCharts = {
    studentCash: null,
    studentProfit: null,
    studentRevenueCost: null,
    studentDemandSales: null,
    teacherCash: null,
    teacherProfit: null,
    teacherRevenueCost: null,
    teacherDemandSales: null
};

function csvEscape(value) {
    if (value === null || value === undefined) return '';
    var s = String(value);
    if (s.includes('"')) s = s.replace(/"/g, '""');
    if (/[",\n\r;]/.test(s)) s = '"' + s + '"';
    return s;
}

function downloadTextFile(filename, content, mime) {
    var blob = new Blob([content], {type: mime || 'text/plain;charset=utf-8'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
        URL.revokeObjectURL(url);
    }, 0);
}

function turnsToCsv(turns) {
    var header = [
        'День',
        'Событие',
        'Цена',
        'Закупка',
        'Маркетинг',
        'Изменение персонала',
        'Спрос',
        'Продажи',
        'Выручка',
        'Затраты',
        'Прибыль',
        'Изменение кассы',
        'Касса',
        'Склад'
    ];
    var lines = [];
    lines.push(header.map(csvEscape).join(';'));
    (turns || []).forEach(function (t) {
        lines.push([
            t.step,
            t.event && t.event.name ? t.event.name : '',
            t.price,
            t.purchaseQuantity,
            t.marketingExpense,
            t.staffChange,
            t.demand,
            t.sales,
            t.revenue,
            t.totalCost,
            t.profit,
            t.cashChange,
            t.cashAfter,
            t.stockAfter
        ].map(csvEscape).join(';'));
    });
    return '\uFEFF' + lines.join('\r\n');
}

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

function getSimulationResultsLockKey(roomId) {
    return 'simResultsLocked:' + roomId;
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
        latestEvent: null,
        activeEffects: [],
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

    const done = Number(session.step ?? 0);
    if (stepEl) stepEl.textContent = String(done);
    if (maxTurnsEl) maxTurnsEl.textContent = String(maxTurns);

    if (cashEl) cashEl.textContent = Number(session.cash ?? 0).toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    if (stockEl) stockEl.textContent = String(session.stock ?? 0);
    if (staffEl) staffEl.textContent = Number(session.staff ?? 0).toLocaleString('ru-RU', {maximumFractionDigits: 2});
    if (costEl) costEl.textContent = Number(session.cost ?? 0).toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    if (stateEl) stateEl.textContent = session.gameFinished ? ('Игра завершена: ' + mapFinishReasonRu(session.finishReason)) : 'Идёт';

}

function renderSimulationHistory(session) {
    const wrap = document.getElementById('simHistoryWrap');
    if (!wrap) return;
    const list = Array.isArray(session.history) ? session.history : [];
    wrap.innerHTML = buildTurnsTableHtml(list);
}

function buildTurnsTableHtml(turns) {
    if (!Array.isArray(turns) || turns.length === 0) {
        return '<span class="text-muted">Ходов пока нет.</span>';
    }
    var html = '<div class="table-responsive"><table class="table table-sm table-striped">';
    html += '<thead><tr><th>День</th><th>Событие</th><th>Цена</th><th>Закупка</th><th>Маркетинг</th><th>Персонал</th><th>Спрос</th><th>Продажи</th><th>Выручка</th><th>Затраты</th><th>Прибыль</th><th>Касса</th><th>Склад</th></tr></thead><tbody>';
    turns.slice().reverse().forEach(function (turn) {
        html += '<tr>';
        html += '<td>' + (turn.step ?? '—') + '</td>';
        if (turn.event && turn.event.name) {
            html += '<td class="small"><span class="badge ' + getEffectBadgeClass(turn.event.effectType) + '">' + turn.event.name + '</span></td>';
        } else {
            html += '<td class="text-muted small">—</td>';
        }
        html += '<td class="text-muted small">' + (turn.price != null ? Number(turn.price).toFixed(2) : '—') + '</td>';
        html += '<td class="text-muted small">' + (turn.purchaseQuantity != null ? turn.purchaseQuantity : '—') + '</td>';
        html += '<td class="text-muted small">' + (turn.marketingExpense != null ? Number(turn.marketingExpense).toFixed(2) : '—') + '</td>';
        html += '<td class="text-muted small">' + (turn.staffChange != null ? Number(turn.staffChange).toFixed(2) : '—') + '</td>';
        html += '<td>' + (turn.demand ?? '—') + '</td>';
        html += '<td>' + (turn.sales ?? '—') + '</td>';
        html += '<td>' + fmtNumRu(turn.revenue, 2, 2) + '</td>';
        html += '<td>' + fmtNumRu(turn.totalCost, 2, 2) + '</td>';
        html += '<td>' + fmtNumRu(turn.profit, 2, 2) + '</td>';
        html += '<td>' + fmtNumRu(turn.cashAfter, 2, 2) + '</td>';
        html += '<td>' + (turn.stockAfter ?? '—') + '</td>';
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
}

function destroyChart(instance) {
    if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
    }
}

function renderAnalyticsCharts(prefix, turns) {
    var labels = turns.map(function (t) {
        return t.step;
    });
    var cash = turns.map(function (t) {
        return Number(t.cashAfter ?? 0);
    });
    var profit = turns.map(function (t) {
        return Number(t.profit ?? 0);
    });
    var revenue = turns.map(function (t) {
        return Number(t.revenue ?? 0);
    });
    var totalCost = turns.map(function (t) {
        return Number(t.totalCost ?? 0);
    });
    var demand = turns.map(function (t) {
        return Number(t.demand ?? 0);
    });
    var sales = turns.map(function (t) {
        return Number(t.sales ?? 0);
    });

    var chartKeyPrefix = prefix === 'student' ? 'student' : 'teacher';
    var cashCanvas = document.getElementById(prefix + 'ChartCash');
    var profitCanvas = document.getElementById(prefix + 'ChartProfit');
    var revenueCostCanvas = document.getElementById(prefix + 'ChartRevenueCost');
    var demandSalesCanvas = document.getElementById(prefix + 'ChartDemandSales');
    if (!cashCanvas || !profitCanvas || !revenueCostCanvas || !demandSalesCanvas || typeof Chart === 'undefined') return;

    destroyChart(simCharts[chartKeyPrefix + 'Cash']);
    destroyChart(simCharts[chartKeyPrefix + 'Profit']);
    destroyChart(simCharts[chartKeyPrefix + 'RevenueCost']);
    destroyChart(simCharts[chartKeyPrefix + 'DemandSales']);

    simCharts[chartKeyPrefix + 'Cash'] = new Chart(cashCanvas, {
        type: 'line',
        data: {labels: labels, datasets: [{label: 'Касса', data: cash, borderColor: '#0d6efd', tension: 0.2}]},
        options: {responsive: true, plugins: {legend: {display: false}}}
    });
    simCharts[chartKeyPrefix + 'Profit'] = new Chart(profitCanvas, {
        type: 'bar',
        data: {labels: labels, datasets: [{label: 'Прибыль', data: profit, backgroundColor: '#198754'}]},
        options: {responsive: true, plugins: {legend: {display: false}}}
    });
    simCharts[chartKeyPrefix + 'RevenueCost'] = new Chart(revenueCostCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {label: 'Выручка', data: revenue, borderColor: '#20c997', tension: 0.2},
                {label: 'Затраты', data: totalCost, borderColor: '#dc3545', tension: 0.2}
            ]
        },
        options: {responsive: true}
    });
    simCharts[chartKeyPrefix + 'DemandSales'] = new Chart(demandSalesCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {label: 'Спрос', data: demand, borderColor: '#6f42c1', tension: 0.2},
                {label: 'Продажи', data: sales, borderColor: '#fd7e14', tension: 0.2}
            ]
        },
        options: {responsive: true}
    });
}

function renderSimulationKpis(session) {
    var demandEl = document.getElementById('simKpiDemand');
    var salesEl = document.getElementById('simKpiSales');
    var revenueEl = document.getElementById('simKpiRevenue');
    var totalCostEl = document.getElementById('simKpiTotalCost');
    var profitEl = document.getElementById('simKpiProfit');
    var cashChangeEl = document.getElementById('simKpiCashChange');

    var list = Array.isArray(session.history) ? session.history : [];
    if (list.length === 0) {
        if (demandEl) demandEl.textContent = '—';
        if (salesEl) salesEl.textContent = '—';
        if (revenueEl) revenueEl.textContent = '—';
        if (totalCostEl) totalCostEl.textContent = '—';
        if (profitEl) profitEl.textContent = '—';
        if (cashChangeEl) cashChangeEl.textContent = '—';
        return;
    }

    var last = list[list.length - 1];
    var cashChange = Number(last.cashChange ?? 0);
    if (demandEl) demandEl.textContent = String(last.demand ?? '—');
    if (salesEl) salesEl.textContent = String(last.sales ?? '—');
    if (revenueEl) revenueEl.textContent = fmtNumRu(last.revenue, 2, 2);
    if (totalCostEl) totalCostEl.textContent = fmtNumRu(last.totalCost, 2, 2);
    if (profitEl) profitEl.textContent = fmtNumRu(last.profit, 2, 2);
    if (cashChangeEl) cashChangeEl.textContent = fmtNumRu(cashChange, 2, 2);
}

function mapEffectTypeRu(effectType) {
    var key = (effectType || '').toString().toUpperCase();
    if (key === 'INSTANT_CASH') return 'Мгновенный эффект на деньги';
    if (key === 'STAFF_MULTIPLIER') return 'Множитель персонала';
    if (key === 'COST_MULTIPLIER') return 'Множитель себестоимости';
    if (key === 'DEMAND_MULTIPLIER') return 'Множитель спроса';
    return effectType || 'Эффект';
}

function getEffectBadgeClass(effectType) {
    var key = (effectType || '').toString().toUpperCase();
    if (key === 'INSTANT_CASH') return 'bg-danger';
    if (key === 'DEMAND_MULTIPLIER') return 'bg-primary';
    if (key === 'COST_MULTIPLIER') return 'bg-warning text-dark';
    if (key === 'STAFF_MULTIPLIER') return 'bg-info text-dark';
    return 'bg-secondary';
}

function formatSignedMoney(value) {
    if (value === null || value === undefined) return '—';
    var n = Number(value);
    if (!Number.isFinite(n)) return '—';
    var sign = n > 0 ? '+' : '';
    return sign + n.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function renderEventCard(session) {
    var card = document.getElementById('simEventCard');
    var badge = document.getElementById('simEventTypeBadge');
    if (!card || !badge) return;

    var event = session.latestEvent;
    if (!event) {
        badge.className = 'badge bg-secondary';
        badge.textContent = 'Нет события';
        card.innerHTML = '<div class="text-muted small">На текущем ходу случайных событий не было.</div>';
        return;
    }

    badge.className = 'badge ' + getEffectBadgeClass(event.effectType);
    badge.textContent = mapEffectTypeRu(event.effectType);

    var effectValueText = event.effectType === 'INSTANT_CASH'
        ? formatSignedMoney(event.cashDelta)
        : fmtNumRu(event.effectValue, 2, 4);
    var durationText = (event.duration != null && Number(event.duration) > 0)
        ? (event.duration + ' дн.')
        : 'мгновенно';

    var html = '';
    html += '<div class="fw-semibold mb-1">' + (event.name || 'Событие') + '</div>';
    html += '<div class="small text-muted mb-2">' + (event.description || 'Описание не указано') + '</div>';
    html += '<div class="row g-2 small">';
    html += '<div class="col-md-4"><strong>Тип:</strong> ' + mapEffectTypeRu(event.effectType) + '</div>';
    html += '<div class="col-md-4"><strong>Значение:</strong> ' + effectValueText + '</div>';
    html += '<div class="col-md-4"><strong>Длительность:</strong> ' + durationText + '</div>';
    html += '</div>';
    card.innerHTML = html;
}

function renderActiveEffects(session) {
    var wrap = document.getElementById('simActiveEffectsWrap');
    if (!wrap) return;
    var effects = Array.isArray(session.activeEffects) ? session.activeEffects : [];
    if (effects.length === 0) {
        wrap.innerHTML = '<span class="text-muted small">Активных эффектов нет.</span>';
        return;
    }

    var html = '';
    effects.forEach(function (ef) {
        var badgeCls = getEffectBadgeClass(ef.effectType);
        var valueText = ef.effectType === 'INSTANT_CASH'
            ? formatSignedMoney(ef.cashDelta)
            : fmtNumRu(ef.effectValue, 2, 4);
        html += '<div class="border rounded px-2 py-1 small">';
        html += '<div class="d-flex align-items-center gap-2 mb-1">';
        html += '<span class="badge ' + badgeCls + '">' + mapEffectTypeRu(ef.effectType) + '</span>';
        html += '<span class="fw-semibold">' + (ef.name || 'Событие') + '</span>';
        html += '</div>';
        html += '<div class="text-muted mb-1">' + (ef.description || '') + '</div>';
        html += '<div><strong>Эффект:</strong> ' + valueText + ' · <strong>Осталось:</strong> ' + (ef.remainingDays != null ? ef.remainingDays : '—') + ' дн.</div>';
        html += '</div>';
    });
    wrap.innerHTML = html;
}

function updateEffectsAfterTurn(session, triggeredEventDto) {
    var current = Array.isArray(session.activeEffects) ? session.activeEffects : [];
    var decremented = current
        .map(function (e) {
            var next = Object.assign({}, e);
            next.remainingDays = Number(next.remainingDays ?? 0) - 1;
            return next;
        })
        .filter(function (e) {
            return e.remainingDays > 0;
        });

    if (triggeredEventDto && triggeredEventDto.effectType && triggeredEventDto.effectType.toUpperCase() !== 'INSTANT_CASH') {
        var backendRemainingAfterTurn = Math.max(0, Number(triggeredEventDto.duration ?? 0) - 1);
        decremented.push({
            name: triggeredEventDto.name,
            description: triggeredEventDto.description,
            effectType: triggeredEventDto.effectType,
            effectValue: triggeredEventDto.effectValue,
            cashDelta: triggeredEventDto.cashDelta,
            remainingDays: backendRemainingAfterTurn
        });
    }
    session.activeEffects = decremented;
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
                ? (Number(settings.eventProbability).toLocaleString('ru-RU', {
                    style: 'percent',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 1
                }))
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

        var res = await submitSimulationTurn({showSuccess: false});
        if (!res.ok) {
            showMessage(res.error || 'Автоход не выполнен', 'danger');
            simulationAutoStop();
            return;
        }
        if (res.session.gameFinished) {
            showMessage('Игра завершена: ' + mapFinishReasonRu(res.session.finishReason), 'warning');
            showSimulationFinishedModal(res.session.finishReason);
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
    if (localStorage.getItem(getSimulationResultsLockKey(room.id)) === '1') {
        openStudentResults();
        return;
    }

    try {
        const response = await fetch('/api/rooms/' + room.id + '/settings', {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            showMessage('Не удалось загрузить настройки комнаты', 'danger');
            return;
        }
        const settings = await response.json();
        simContext.room = room;
        simContext.settings = settings;
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
        renderSimulationKpis(session);
        renderEventCard(session);
        renderActiveEffects(session);
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

    return {price, purchaseQuantity, marketingExpense, staffChange};
}

async function submitSimulationTurn(options) {
    var showSuccess = !options || options.showSuccess !== false;

    const room = getStudentSimulationRoom();
    if (!room || !room.id) {
        return {ok: false, error: 'Нет комнаты'};
    }

    let session = loadSimulationSession(room.id);
    if (!session) {
        return {ok: false, error: 'Сессия не инициализирована. Обновите страницу.'};
    }
    if (session.gameFinished) {
        return {ok: false, error: 'Игра уже завершена: ' + mapFinishReasonRu(session.finishReason)};
    }

    let payload;
    try {
        payload = readSimulationDecision();
    } catch (e) {
        return {ok: false, error: e.message};
    }

    try {
        const response = await fetch('/api/simulation/rooms/' + room.id + '/turn', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const err = await response.json().catch(function () {
                return {};
            });
            return {ok: false, error: err.message || 'Не удалось выполнить ход'};
        }

        const result = await response.json();
        var triggeredEventDto = result.triggeredEventDto ?? null;
        session.step = result.step ?? session.step;
        session.cash = Number(result.cashAfter ?? session.cash);
        session.stock = Number(result.stockAfter ?? session.stock);
        session.staff = Number(session.staff) + Number(payload.staffChange);
        session.lastMarketing = Number(payload.marketingExpense);
        session.gameFinished = !!result.gameFinished;
        session.finishReason = result.finishReason || null;
        session.latestEvent = triggeredEventDto;
        updateEffectsAfterTurn(session, triggeredEventDto);
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
            cashChange: result.cashChange,
            totalCost: result.totalCost,
            profit: result.profit,
            cashAfter: result.cashAfter,
            stockAfter: result.stockAfter,
            event: triggeredEventDto
        });
        persistSimulationSession(session);
        renderSimulationHeader(room, session);
        renderSimulationHistory(session);
        renderSimulationKpis(session);
        renderEventCard(session);
        renderActiveEffects(session);

        if (showSuccess) {
            if (session.gameFinished) {
                showMessage('Игра завершена: ' + mapFinishReasonRu(session.finishReason), 'warning');
                showSimulationFinishedModal(session.finishReason);
            } else {
                showMessage('Ход выполнен успешно', 'success');
            }
        }
        return {ok: true, session: session, result: result, room: room, payload: payload};
    } catch (e) {
        return {ok: false, error: 'Ошибка выполнения хода'};
    }
}

async function makeSimulationTurn() {
    if (!checkAuth()) return;
    var res = await submitSimulationTurn({showSuccess: true});
    if (!res.ok) {
        showMessage(res.error || 'Ошибка', 'danger');
    }
    if (simAuto.active && res.ok && !res.session.gameFinished) {
        simAuto.nextTurnAt = Date.now() + SIM_DAY_MS;
        simulationAutoTick();
    }
}

async function restartSimulation() {
    if (!checkAuth()) return;
    var room = getStudentSimulationRoom();
    if (!room || !room.id) {
        showMessage('Сначала вступите в комнату', 'warning');
        return;
    }
    var ok = window.confirm('Начать игру заново? Локальная история и состояние будут удалены.');
    if (!ok) return;

    simulationAutoStop();
    var modalEl = document.getElementById('simGameFinishedModal');
    if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        var existing = bootstrap.Modal.getInstance(modalEl);
        if (existing) existing.hide();
    }

    try {
        var response = await fetch('/api/simulation/rooms/' + room.id + '/reset', {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            var err = await response.json().catch(function () {
                return {};
            });
            showMessage(err.message || 'Не удалось сбросить игру', 'danger');
            return;
        }
        var resetResult = await response.json();
        if (!simContext.settings) {
            showMessage('Игра на бэке сброшена. Перезагрузите страницу, чтобы обновить фронт.', 'warning');
            return;
        }
        var freshSession = initSessionFromSettings(room, simContext.settings);
        localStorage.removeItem(getSimulationResultsLockKey(room.id));
        freshSession.step = Number(resetResult.step ?? 0);
        freshSession.cash = Number(resetResult.cashAfter ?? freshSession.cash);
        freshSession.stock = Number(resetResult.stockAfter ?? freshSession.stock);
        persistSimulationSession(freshSession);
        renderSimulationHeader(room, freshSession);
        renderSimulationHistory(freshSession);
        renderSimulationKpis(freshSession);
        renderEventCard(freshSession);
        renderActiveEffects(freshSession);
        showMessage('Игра начата заново. Данные на сервере и локально очищены.', 'success');
    } catch (e) {
        showMessage('Ошибка при сбросе игры', 'danger');
    }
}

function showSimulationFinishedModal(finishReason) {
    var reasonEl = document.getElementById('simGameFinishedReason');
    if (reasonEl) reasonEl.textContent = 'Причина: ' + mapFinishReasonRu(finishReason);
    var modalEl = document.getElementById('simGameFinishedModal');
    if (!modalEl || typeof bootstrap === 'undefined' || !bootstrap.Modal) return;
    var modal = bootstrap.Modal.getOrCreateInstance(modalEl, {backdrop: 'static', keyboard: false});
    modal.show();
}

function openStudentResults() {
    var room = getStudentSimulationRoom();
    if (!room || !room.id) return;
    localStorage.setItem(getSimulationResultsLockKey(room.id), '1');
    window.location.href = '/pages/student-simulation-results.html?roomId=' + encodeURIComponent(room.id);
}

function buildStudentResultsSummary(session) {
    var turns = Array.isArray(session.history) ? session.history : [];
    if (turns.length === 0) {
        return '<span class="text-muted">Нет завершенных ходов.</span>';
    }
    var last = turns[turns.length - 1];
    var totalProfit = turns.reduce(function (sum, t) {
        return sum + Number(t.profit ?? 0);
    }, 0);
    var avgMargin = turns.length > 0
        ? turns.reduce(function (sum, t) {
        var rev = Number(t.revenue ?? 0);
        var p = Number(t.profit ?? 0);
        return sum + (rev > 0 ? (p / rev) : 0);
    }, 0) / turns.length
        : 0;
    var html = '';
    html += '<div class="col-md-4"><strong>Всего дней:</strong> ' + String(session.step ?? 0) + '</div>';
    html += '<div class="col-md-4"><strong>Финальная касса:</strong> ' + fmtNumRu(last.cashAfter, 2, 2) + '</div>';
    html += '<div class="col-md-4"><strong>Суммарная прибыль:</strong> ' + fmtNumRu(totalProfit, 2, 2) + '</div>';
    html += '<div class="col-md-4"><strong>Финальный склад:</strong> ' + (last.stockAfter ?? '—') + '</div>';
    html += '<div class="col-md-4"><strong>Средняя рентабельность:</strong> ' + (avgMargin * 100).toFixed(1) + '%</div>';
    html += '<div class="col-md-4"><strong>Причина завершения:</strong> ' + mapFinishReasonRu(session.finishReason) + '</div>';
    return html;
}

function initStudentSimulationResultsPage() {
    var params = new URLSearchParams(window.location.search);
    var roomId = params.get('roomId');
    var roomRaw = localStorage.getItem('lastJoinedRoom');
    var room = null;
    if (roomRaw) {
        try {
            room = JSON.parse(roomRaw);
        } catch (e) {
            room = null;
        }
    }
    var effectiveRoomId = roomId || (room && room.id ? room.id : null);
    if (!effectiveRoomId) {
        showMessage('Не указана комната для результатов.', 'danger');
        return;
    }
    var session = loadSimulationSession(effectiveRoomId);
    if (!session || !Array.isArray(session.history) || session.history.length === 0) {
        showMessage('Нет данных для аналитики. Сыграйте хотя бы один ход.', 'warning');
        return;
    }
    var infoEl = document.getElementById('studentResultsRoomInfo');
    if (infoEl) {
        infoEl.textContent = (room && room.name ? room.name : 'Комната') + ' · ID: ' + effectiveRoomId;
    }
    loadStudentGradeForResults(effectiveRoomId);
    var summaryEl = document.getElementById('studentResultsSummaryWrap');
    if (summaryEl) summaryEl.innerHTML = buildStudentResultsSummary(session);
    var tableEl = document.getElementById('studentResultsHistoryTableWrap');
    if (tableEl) tableEl.innerHTML = buildTurnsTableHtml(session.history);

    var chartsEmptyEl = document.getElementById('studentResultsChartsEmpty');
    var chartsWrapEl = document.getElementById('studentResultsChartsWrap');
    if (session.history.length > 0 && typeof Chart !== 'undefined') {
        if (chartsEmptyEl) chartsEmptyEl.classList.add('d-none');
        if (chartsWrapEl) chartsWrapEl.classList.remove('d-none');
        renderAnalyticsCharts('student', session.history);
    }
}

function downloadStudentResultsCsv() {
    var params = new URLSearchParams(window.location.search);
    var roomId = params.get('roomId');
    if (!roomId) {
        showMessage('roomId не найден.', 'danger');
        return;
    }
    var session = loadSimulationSession(roomId);
    if (!session || !Array.isArray(session.history) || session.history.length === 0) {
        showMessage('Нет данных для CSV.', 'warning');
        return;
    }
    var csv = turnsToCsv(session.history);
    downloadTextFile('results-room-' + roomId + '.csv', csv, 'text/csv;charset=utf-8');
}

async function loadStudentGradeForResults(roomId) {
    var statusEl = document.getElementById('studentResultsGradeStatus');
    var wrapEl = document.getElementById('studentResultsGradeWrap');
    if (!wrapEl) return;
    if (statusEl) statusEl.textContent = 'Загрузка...';
    try {
        var resp = await fetch('/api/grades/rooms/' + roomId + '/me', {
            headers: getAuthHeaders()
        });
        if (handleUnauthorized(resp)) return;
        if (resp.status === 404) {
            if (statusEl) statusEl.textContent = 'Нет оценки';
            wrapEl.innerHTML = '<span class="text-muted">Оценка ещё не выставлена.</span>';
            return;
        }
        if (!resp.ok) {
            if (statusEl) statusEl.textContent = 'Ошибка';
            wrapEl.innerHTML = '<span class="text-danger">Не удалось загрузить оценку.</span>';
            return;
        }
        var data = await resp.json().catch(function () {
            return null;
        });
        if (!data) {
            if (statusEl) statusEl.textContent = 'Ошибка';
            wrapEl.innerHTML = '<span class="text-danger">Не удалось прочитать оценку.</span>';
            return;
        }
        if (statusEl) statusEl.textContent = 'Доступно';
        var html = '';
        html += '<div class="fs-5 fw-semibold">' + (data.gradeValue ?? '—') + ' / 100</div>';
        if (data.comment) html += '<div class="text-muted"><strong>Комментарий:</strong> ' + String(data.comment) + '</div>';
        wrapEl.innerHTML = html;
    } catch (e) {
        if (statusEl) statusEl.textContent = 'Ошибка';
        wrapEl.innerHTML = '<span class="text-danger">Не удалось загрузить оценку.</span>';
    }
}

async function restartSimulationFromResults() {
    var params = new URLSearchParams(window.location.search);
    var roomId = params.get('roomId');
    if (!roomId) {
        showMessage('roomId не найден.', 'danger');
        return;
    }
    if (!window.confirm('Начать новую игру? Текущие результаты будут сброшены.')) return;
    try {
        var response = await fetch('/api/simulation/rooms/' + roomId + '/reset', {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            var err = await response.json().catch(function () {
                return {};
            });
            showMessage(err.message || 'Не удалось начать новую игру', 'danger');
            return;
        }
        localStorage.removeItem(getSimulationResultsLockKey(roomId));
        localStorage.removeItem(getSimulationSessionKey(roomId));
        window.location.href = '/pages/student-simulation.html';
    } catch (e) {
        showMessage('Ошибка при запуске новой игры', 'danger');
    }
}

