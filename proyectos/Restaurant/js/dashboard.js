const STORAGE_KEY = 'eclat_reservations';

function getReservations() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function saveReservations(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function todayStr() {
    return new Date().toISOString().split('T')[0];
}

function updateStats() {
    const all = getReservations();
    const today = todayStr();
    document.getElementById('totalReservations').textContent = all.length;
    document.getElementById('todayReservations').textContent = all.filter(r => r.reservationDate === today).length;
    document.getElementById('upcomingReservations').textContent = all.filter(r => r.reservationDate >= today).length;
    document.getElementById('totalGuests').textContent = all.reduce((sum, r) => sum + parseInt(r.guests || 0), 0);
}

function renderDashboard() {
    const list = document.getElementById('dashboardReservationsList');
    if (!list) return;
    const all = getReservations();
    const search = (document.getElementById('dashboardSearch')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const dateFilter = document.getElementById('dashboardDateFilter')?.value || '';
    const today = todayStr();

    let filtered = all;
    if (search) filtered = filtered.filter(r => r.fullName.toLowerCase().includes(search) || r.email.toLowerCase().includes(search));
    if (dateFilter) filtered = filtered.filter(r => r.reservationDate === dateFilter);
    if (statusFilter === 'upcoming') filtered = filtered.filter(r => r.reservationDate >= today);
    if (statusFilter === 'completed') filtered = filtered.filter(r => r.reservationDate < today);
    if (statusFilter === 'cancelled') filtered = filtered.filter(() => false);
    filtered.sort((a, b) => a.reservationDate.localeCompare(b.reservationDate) || a.reservationTime.localeCompare(b.reservationTime));

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg class="empty-state__icon" viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="20" y="40" width="160" height="120" rx="10"/>
                    <line x1="20" y1="80" x2="180" y2="80"/>
                    <circle cx="60" cy="120" r="8"/>
                    <path d="M80 110 L120 130 M80 130 L120 110"/>
                    <circle cx="160" cy="120" r="8"/>
                </svg>
                <h3 class="empty-state__title">No Reservations Found</h3>
                <p class="empty-state__text">Try adjusting your filters</p>
            </div>`;
        return;
    }

    list.innerHTML = filtered.map(r => {
        const isUpcoming = r.reservationDate >= today;
        return `
        <article class="reservation-card">
            <div class="reservation-card__header">
                <h3 class="reservation-card__name">${r.fullName}</h3>
                <span class="reservation-card__status ${isUpcoming ? 'status-upcoming' : 'status-completed'}">${isUpcoming ? 'Upcoming' : 'Completed'}</span>
            </div>
            <div class="reservation-card__details">
                <p><strong>Date:</strong> ${formatDate(r.reservationDate)}</p>
                <p><strong>Time:</strong> ${r.reservationTime}</p>
                <p><strong>Guests:</strong> ${r.guests}</p>
                <p><strong>Email:</strong> ${r.email}</p>
                <p><strong>Phone:</strong> ${r.phone}</p>
                ${r.specialRequests ? `<p><strong>Requests:</strong> ${r.specialRequests}</p>` : ''}
            </div>
            <div class="reservation-card__actions">
                <button class="btn btn--secondary btn--sm" onclick="editReservation('${r.id}')">Edit</button>
                <button class="btn btn--danger btn--sm" onclick="confirmDelete('${r.id}')">Cancel</button>
            </div>
        </article>`;
    }).join('');
    updateStats();
}

function editReservation(id) {
    const all = getReservations();
    const r = all.find(x => x.id === id);
    if (!r) return;
    document.getElementById('dashEditFullName').value = r.fullName;
    document.getElementById('dashEditEmail').value = r.email;
    document.getElementById('dashEditPhone').value = r.phone;
    document.getElementById('dashEditDate').value = r.reservationDate;
    document.getElementById('dashEditTime').value = r.reservationTime;
    document.getElementById('dashEditGuests').value = r.guests;
    document.getElementById('dashEditSpecialRequests').value = r.specialRequests || '';
    document.getElementById('editFormDashboard').dataset.editId = id;
    openModal('editModal');
}

function confirmDelete(id) {
    document.getElementById('confirmDeleteBtn').dataset.deleteId = id;
    openModal('deleteModal');
}

document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
    const id = document.getElementById('confirmDeleteBtn').dataset.deleteId;
    if (!id) return;
    const all = getReservations().filter(r => r.id !== id);
    saveReservations(all);
    closeModal('deleteModal');
    renderDashboard();
    showToast('Reservation cancelled', 'warning', 'Cancelled');
});

document.getElementById('editFormDashboard')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('editFormDashboard').dataset.editId;
    if (!id) return;
    const all = getReservations();
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) return;
    all[idx] = {
        ...all[idx],
        fullName: document.getElementById('dashEditFullName').value.trim(),
        email: document.getElementById('dashEditEmail').value.trim(),
        phone: document.getElementById('dashEditPhone').value.trim(),
        reservationDate: document.getElementById('dashEditDate').value,
        reservationTime: document.getElementById('dashEditTime').value,
        guests: document.getElementById('dashEditGuests').value,
        specialRequests: document.getElementById('dashEditSpecialRequests').value.trim(),
    };
    saveReservations(all);
    closeModal('editModal');
    renderDashboard();
    showToast('Reservation updated', 'success');
});

document.getElementById('closeDeleteModal')?.addEventListener('click', () => closeModal('deleteModal'));
document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => closeModal('deleteModal'));
document.getElementById('closeEditModal')?.addEventListener('click', () => closeModal('editModal'));
document.getElementById('cancelEditBtnDash')?.addEventListener('click', () => closeModal('editModal'));

document.getElementById('dashboardSearch')?.addEventListener('input', renderDashboard);
document.getElementById('statusFilter')?.addEventListener('change', renderDashboard);
document.getElementById('dashboardDateFilter')?.addEventListener('change', renderDashboard);
document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
    document.getElementById('dashboardSearch').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('dashboardDateFilter').value = '';
    renderDashboard();
});

renderDashboard();
