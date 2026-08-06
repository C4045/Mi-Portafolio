const STORAGE_KEY = 'eclat_reservations';

function getReservations() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function saveReservations(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function renderReservations() {
    const list = document.getElementById('reservationsList');
    if (!list) return;
    const all = getReservations();
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const filterDate = document.getElementById('filterDate')?.value || '';

    let filtered = all;
    if (search) filtered = filtered.filter(r => r.fullName.toLowerCase().includes(search));
    if (filterDate) filtered = filtered.filter(r => r.reservationDate === filterDate);
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
                <p class="empty-state__text">Make your first reservation above</p>
            </div>`;
        return;
    }

    list.innerHTML = filtered.map(r => `
        <article class="reservation-card">
            <div class="reservation-card__header">
                <h3 class="reservation-card__name">${r.fullName}</h3>
                <span class="reservation-card__status">Confirmed</span>
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
                <button class="btn btn--danger btn--sm" onclick="deleteReservation('${r.id}')">Cancel</button>
            </div>
        </article>
    `).join('');
}

function editReservation(id) {
    const all = getReservations();
    const r = all.find(x => x.id === id);
    if (!r) return;
    document.getElementById('editFullName').value = r.fullName;
    document.getElementById('editEmail').value = r.email;
    document.getElementById('editPhone').value = r.phone;
    document.getElementById('editDate').value = r.reservationDate;
    document.getElementById('editTime').value = r.reservationTime;
    document.getElementById('editGuests').value = r.guests;
    document.getElementById('editSpecialRequests').value = r.specialRequests || '';
    document.getElementById('editForm').dataset.editId = id;
    openModal('editModal');
}

function deleteReservation(id) {
    if (!confirm('Cancel this reservation? This cannot be undone.')) return;
    const all = getReservations().filter(r => r.id !== id);
    saveReservations(all);
    renderReservations();
    showToast('Reservation cancelled successfully', 'warning', 'Cancelled');
}

function validateField(id) {
    const el = document.getElementById(id);
    const error = document.getElementById(id + '-error');
    if (!el || !error) return true;
    if (!el.value.trim()) {
        error.textContent = 'This field is required';
        el.classList.add('error');
        return false;
    }
    if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) {
        error.textContent = 'Please enter a valid email';
        el.classList.add('error');
        return false;
    }
    if (el.type === 'tel' && !/^[\d\s\-().+]{7,20}$/.test(el.value)) {
        error.textContent = 'Please enter a valid phone number';
        el.classList.add('error');
        return false;
    }
    error.textContent = '';
    el.classList.remove('error');
    el.classList.add('success');
    return true;
}

const reservationForm = document.getElementById('reservationForm');
if (reservationForm) {
    const fields = ['fullName', 'email', 'phone', 'reservationDate', 'reservationTime', 'guests'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('blur', () => validateField(id));
    });

    reservationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let valid = true;
        fields.forEach(id => { if (!validateField(id)) valid = false; });
        if (!valid) return;

        const reservation = {
            id: generateId(),
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            reservationDate: document.getElementById('reservationDate').value,
            reservationTime: document.getElementById('reservationTime').value,
            guests: document.getElementById('guests').value,
            specialRequests: document.getElementById('specialRequests').value.trim(),
            createdAt: new Date().toISOString()
        };

        const all = getReservations();
        all.push(reservation);
        saveReservations(all);
        reservationForm.reset();
        fields.forEach(id => document.getElementById(id)?.classList.remove('success'));

        document.getElementById('confirmationDetails').innerHTML = `
            <p><strong>${reservation.fullName}</strong></p>
            <p>${formatDate(reservation.reservationDate)} at ${reservation.reservationTime}</p>
            <p>${reservation.guests} guest(s)</p>
        `;
        openModal('confirmationModal');
        renderReservations();
    });
}

const editForm = document.getElementById('editForm');
if (editForm) {
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = editForm.dataset.editId;
        if (!id) return;
        const all = getReservations();
        const idx = all.findIndex(r => r.id === id);
        if (idx === -1) return;
        all[idx] = {
            ...all[idx],
            fullName: document.getElementById('editFullName').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            phone: document.getElementById('editPhone').value.trim(),
            reservationDate: document.getElementById('editDate').value,
            reservationTime: document.getElementById('editTime').value,
            guests: document.getElementById('editGuests').value,
            specialRequests: document.getElementById('editSpecialRequests').value.trim(),
        };
        saveReservations(all);
        closeModal('editModal');
        renderReservations();
        showToast('Reservation updated successfully', 'success');
    });
}

document.getElementById('closeModal')?.addEventListener('click', () => closeModal('confirmationModal'));
document.getElementById('modalCloseBtn')?.addEventListener('click', () => closeModal('confirmationModal'));
document.getElementById('closeEditModal')?.addEventListener('click', () => closeModal('editModal'));
document.getElementById('cancelEditBtn')?.addEventListener('click', () => closeModal('editModal'));

document.getElementById('searchInput')?.addEventListener('input', renderReservations);
document.getElementById('filterDate')?.addEventListener('change', renderReservations);

renderReservations();
