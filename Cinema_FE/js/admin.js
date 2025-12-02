// Cinema_FE/js/admin.js - FULL VERSION

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    
    // Load dữ liệu mặc định
    loadMovies();
    loadGenresForModal(); // Pre-load danh sách thể loại cho form phim

    // --- XỬ LÝ CHUYỂN TAB ---
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Active menu sidebar
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Active nội dung section
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            const targetId = link.dataset.content;
            document.getElementById(targetId).classList.add('active');

            // Load dữ liệu tương ứng khi vào tab
            if (targetId === 'movies') loadMovies();
            if (targetId === 'showtimes') loadShowtimes();
            if (targetId === 'cinemas') loadCinemas();
            if (targetId === 'genres') loadGenres();
            if (targetId === 'users') loadUsers();
            if (targetId === 'bookings') loadBookings();
        });
    });

    // --- GÁN SỰ KIỆN SUBMIT CHO CÁC FORM ---
    const forms = {
        'movie-form': handleSaveMovie,
        'add-showtime-form': handleSaveShowtime,
        'add-cinema-form': handleSaveCinema,
        'add-room-form': handleSaveRoom,
        'add-genre-form': handleAddGenre,
        'edit-user-form': handleSaveUser
    };

    for (const [formId, handler] of Object.entries(forms)) {
        const el = document.getElementById(formId);
        if(el) el.addEventListener('submit', handler);
    }
});

/* ==================== AUTH & UTILS ==================== */

function checkAuth() {
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');
    
    // Nếu không có token hoặc không phải admin -> đá về trang login
    if (!token || role !== 'admin') {
        window.location.href = 'dang-nhap.html';
    }
}

function handleLogout() {
    localStorage.clear();
    window.location.href = 'dang-nhap.html';
}

function toggleModal(id) { 
    document.getElementById(id).classList.toggle('hidden'); 
}

// Hàm hỗ trợ load danh sách checkbox thể loại cho Modal Thêm/Sửa Phim
async function loadGenresForModal() {
    const container = document.getElementById('genre-checkboxes');
    if(!container) return;

    const res = await callAPI('/movies/genres', 'GET');
    if(res.ok) {
        container.innerHTML = '';
        if(res.data.length === 0) {
            container.innerHTML = '<small>Chưa có thể loại nào.</small>';
            return;
        }
        res.data.forEach(g => {
            const div = document.createElement('div');
            div.innerHTML = `
                <input type="checkbox" name="genre_ids" value="${g.id}" id="g-${g.id}">
                <label for="g-${g.id}">${g.name}</label>
            `;
            container.appendChild(div);
        });
    }
}

/* ==================== 1. QUẢN LÝ PHIM ==================== */

async function loadMovies() {
    const tbody = document.getElementById('movie-list-body');
    tbody.innerHTML = '<tr><td colspan="6">Đang tải...</td></tr>';
    
    const res = await callAPI('/movies', 'GET');
    if (res.ok) {
        tbody.innerHTML = '';
        if(res.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Chưa có phim nào.</td></tr>';
            return;
        }

        res.data.forEach(m => {
            // Escape ký tự đặc biệt để tránh lỗi cú pháp JS
            const json = JSON.stringify(m).replace(/"/g, '&quot;').replace(/'/g, "\\'");
            const dateStr = m.release_date ? new Date(m.release_date).toLocaleDateString('vi-VN') : '---';
            
            // Hiển thị genres badge
            const genresHtml = m.genres && m.genres.length 
                ? m.genres.map(g => `<span class="badge" style="background:#8e44ad">${g.name}</span>`).join(' ') 
                : '<span style="color:#ccc">--</span>';

            tbody.innerHTML += `
                <tr>
                    <td>${m.id}</td>
                    <td><img src="${m.poster || ''}" style="height:50px; object-fit:cover; border-radius:4px"></td>
                    <td class="fw-bold">${m.name}</td>
                    <td>${genresHtml}</td>
                    <td>${dateStr}</td>
                    <td>
                        <button class="btn-edit" onclick='openEditMovie(${json})'><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-delete" onclick="deleteMovie(${m.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
        });
    } else {
        tbody.innerHTML = `<tr><td colspan="6" style="color:red">${res.data.message}</td></tr>`;
    }
}

function openAddMovieModal() {
    document.getElementById('movie-form').reset();
    document.getElementById('movie-id').value = '';
    // Uncheck tất cả genre
    document.querySelectorAll('input[name="genre_ids"]').forEach(cb => cb.checked = false);
    
    document.getElementById('movie-modal-title').innerText = "Thêm Phim Mới";
    toggleModal('movie-modal');
}

function openEditMovie(m) {
    document.getElementById('movie-id').value = m.id;
    document.getElementById('m-name').value = m.name;
    document.getElementById('m-director').value = m.director || '';
    document.getElementById('m-casts').value = m.casts || '';
    document.getElementById('m-duration').value = m.duration || '';
    document.getElementById('m-poster').value = m.poster || '';
    document.getElementById('m-desc').value = m.description || '';
    if(m.release_date) document.getElementById('m-date').value = m.release_date;

    // Check các genre của phim
    document.querySelectorAll('input[name="genre_ids"]').forEach(cb => cb.checked = false);
    if(m.genres) {
        m.genres.forEach(g => {
            const cb = document.getElementById(`g-${g.id}`);
            if(cb) cb.checked = true;
        });
    }

    document.getElementById('movie-modal-title').innerText = "Cập Nhật Phim";
    toggleModal('movie-modal');
}

async function handleSaveMovie(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Lấy mảng Genre ID thủ công vì FormData không lấy hết checkbox
    const checkboxes = document.querySelectorAll('input[name="genre_ids"]:checked');
    data.genre_ids = Array.from(checkboxes).map(cb => parseInt(cb.value));

    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `/movies/${data.id}` : '/movies';
    
    const res = await callAPI(url, method, data);
    
    if(res.ok) { 
        alert("Thành công!"); 
        toggleModal('movie-modal'); 
        loadMovies(); 
    } else {
        alert("Lỗi: " + res.data.message);
    }
}

async function deleteMovie(id) {
    if(confirm("Xóa phim này sẽ xóa cả lịch chiếu liên quan. Tiếp tục?")) { 
        const res = await callAPI(`/movies/${id}`, 'DELETE');
        if(res.ok) loadMovies();
        else alert("Lỗi: " + res.data.message);
    }
}

/* ==================== 2. QUẢN LÝ SUẤT CHIẾU ==================== */

async function loadShowtimes() {
    const tbody = document.getElementById('showtime-list-body');
    tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
    
    const res = await callAPI('/showtimes', 'GET');
    if (res.ok) {
        tbody.innerHTML = '';
        if(res.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Chưa có lịch chiếu nào.</td></tr>';
            return;
        }
        
        res.data.forEach(s => {
            const editObj = {
                id: s.id,
                movie_id: s.movie_id,
                room_id: s.room_id,
                show_time: s.show_time, 
                price: s.price_standard
            };
            const json = JSON.stringify(editObj).replace(/"/g, '&quot;').replace(/'/g, "\\'");
            
            tbody.innerHTML += `
                <tr>
                    <td>${s.id}</td>
                    <td>${s.movie_name}</td>
                    <td>${s.cinema_name} - ${s.room_name}</td>
                    <td>${s.show_time}</td>
                    <td>${(s.price_standard || 0).toLocaleString()}đ</td>
                    <td>
                        <button class="btn-edit" onclick='openEditShowtime(${json})'><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-delete" onclick="deleteShowtime(${s.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
        });
    } else {
        tbody.innerHTML = `<tr><td colspan="6" style="color:red">${res.data.message}</td></tr>`;
    }
}

async function openAddShowtimeModal() {
    document.getElementById('add-showtime-form').reset();
    document.getElementById('st-id').value = '';
    document.getElementById('st-modal-title').innerText = "Thêm Lịch Chiếu";
    document.getElementById('st-room-select').disabled = false;
    
    toggleModal('showtime-modal');
    await loadShowtimeOptions();
}

async function openEditShowtime(s) {
    document.getElementById('st-id').value = s.id;
    document.getElementById('st-modal-title').innerText = "Sửa Suất Chiếu";
    
    toggleModal('showtime-modal');
    await loadShowtimeOptions();
    
    document.getElementById('st-movie-select').value = s.movie_id;
    document.getElementById('st-room-select').value = s.room_id;
    document.getElementById('st-room-select').disabled = true; // Không cho sửa phòng
    document.getElementById('st-price').value = s.price;
    
    // Chuyển format ngày giờ cho input datetime-local
    if(s.show_time) {
        // "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM"
        const isoStr = s.show_time.replace(' ', 'T').substring(0, 16);
        document.getElementById('st-time').value = isoStr;
    }
}

async function loadShowtimeOptions() {
    const mSel = document.getElementById('st-movie-select');
    const rSel = document.getElementById('st-room-select');
    
    // Chỉ load nếu chưa có option (tránh load lại nhiều lần)
    if(mSel.options.length <= 1) {
        const mRes = await callAPI('/movies', 'GET');
        if(mRes.ok) mSel.innerHTML = '<option value="">Chọn Phim</option>' + mRes.data.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        
        const rRes = await callAPI('/rooms', 'GET');
        if(rRes.ok) rSel.innerHTML = '<option value="">Chọn Phòng</option>' + rRes.data.map(r => `<option value="${r.id}">${r.cinema_name} - ${r.name}</option>`).join('');
    }
}

async function handleSaveShowtime(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `/showtimes/${data.id}` : '/showtimes';
    
    const res = await callAPI(url, method, data);
    if(res.ok) { alert("Thành công!"); toggleModal('showtime-modal'); loadShowtimes(); }
    else alert("Lỗi: " + res.data.message);
}

async function deleteShowtime(id) {
    if(confirm("Xóa lịch chiếu này?")) { 
        await callAPI(`/showtimes/${id}`, 'DELETE'); 
        loadShowtimes(); 
    }
}

/* ==================== 3. QUẢN LÝ RẠP & PHÒNG ==================== */

async function loadCinemas() {
    const tbody = document.getElementById('cinema-list-body');
    tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
    
    const res = await callAPI('/cinemas', 'GET');
    if(res.ok) {
        tbody.innerHTML = '';
        res.data.forEach(c => {
            const cJson = JSON.stringify(c).replace(/"/g, '&quot;').replace(/'/g, "\\'");
            
            let roomsHtml = c.rooms.map(r => {
                const rJson = JSON.stringify(r).replace(/"/g, '&quot;').replace(/'/g, "\\'");
                return `<span class="badge">${r.name} <i class="fa-solid fa-pen" onclick='openEditRoom(${c.id},"${c.name}",${rJson});event.stopPropagation()'></i></span>`;
            }).join(' ');
            
            const logoImg = c.logo ? `<img src="${c.logo}" style="height:40px; border-radius:4px">` : '--';

            tbody.innerHTML += `
                <tr>
                    <td>${c.id}</td>
                    <td>${logoImg}</td>
                    <td>${c.name}</td>
                    <td>${c.address}</td>
                    <td>${roomsHtml} <button class="btn-tiny" onclick="openAddRoomModal(${c.id}, '${c.name}')">+</button></td>
                    <td>
                        <button class="btn-edit" onclick='openEditCinema(${cJson})'><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-delete" onclick="deleteCinema(${c.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
        });
    }
}

function openEditCinema(c) {
    document.getElementById('cinema-id').value = c.id;
    document.getElementById('cinema-name').value = c.name;
    document.getElementById('cinema-address').value = c.address;
    document.getElementById('cinema-logo').value = c.logo || '';
    document.getElementById('cinema-modal-title').innerText = "Cập Nhật Rạp";
    toggleModal('cinema-modal');
}

async function handleSaveCinema(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `/cinemas/${data.id}` : '/cinemas';
    
    const res = await callAPI(url, method, data);
    if(res.ok) { alert("Thành công"); toggleModal('cinema-modal'); loadCinemas(); }
    else alert(res.data.message);
}

async function deleteCinema(id) {
    if(confirm("Xóa rạp sẽ xóa hết phòng và lịch chiếu!")) { 
        await callAPI(`/cinemas/${id}`, 'DELETE'); 
        loadCinemas(); 
    }
}

// --- Room Logic ---
function openAddRoomModal(cId, cName) {
    document.getElementById('add-room-form').reset();
    document.getElementById('room-id').value = '';
    document.getElementById('room-cinema-id').value = cId;
    document.getElementById('room-modal-title').innerText = `Thêm Phòng - ${cName}`;
    toggleModal('room-modal');
}
function openEditRoom(cId, cName, r) {
    document.getElementById('add-room-form').reset();
    document.getElementById('room-id').value = r.id;
    document.getElementById('room-cinema-id').value = cId;
    document.getElementById('room-name').value = r.name;
    document.getElementById('room-modal-title').innerText = `Sửa Phòng - ${cName}`;
    toggleModal('room-modal');
}
async function handleSaveRoom(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `/rooms/${data.id}` : '/rooms';
    const res = await callAPI(url, method, data);
    if(res.ok) { alert("Thành công"); toggleModal('room-modal'); loadCinemas(); }
    else alert(res.data.message);
}

/* ==================== 4. QUẢN LÝ THỂ LOẠI ==================== */

async function loadGenres() {
    const tbody = document.getElementById('genre-list-body');
    tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
    
    const res = await callAPI('/movies/genres', 'GET');
    if (res.ok) {
        tbody.innerHTML = '';
        res.data.forEach(g => {
            tbody.innerHTML += `
                <tr>
                    <td>${g.id}</td>
                    <td class="fw-bold" style="color:#8e44ad">${g.name}</td>
                    <td><button class="btn-delete" onclick="deleteGenre(${g.id})"><i class="fa-solid fa-trash"></i></button></td>
                </tr>`;
        });
    }
}

async function handleAddGenre(e) {
    e.preventDefault();
    const name = document.getElementById('genre-name').value;
    const res = await callAPI('/movies/genres', 'POST', { name: name });
    if (res.ok) {
        alert("Đã thêm!");
        toggleModal('genre-modal');
        document.getElementById('add-genre-form').reset();
        loadGenres();
        loadGenresForModal(); // Update modal phim
    } else {
        alert("Lỗi: " + res.data.message);
    }
}

async function deleteGenre(id) {
    if (confirm("Xóa thể loại này?")) {
        await callAPI(`/movies/genres/${id}`, 'DELETE');
        loadGenres();
    }
}

/* ==================== 5. QUẢN LÝ NGƯỜI DÙNG ==================== */

async function loadUsers() {
    const tbody = document.getElementById('user-list-body');
    tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
    
    const res = await callAPI('/auth/users', 'GET');
    if (res.ok) {
        tbody.innerHTML = '';
        res.data.forEach(u => {
            const roleClass = u.role === 'admin' ? 'role-admin' : 'role-user';
            const json = JSON.stringify(u).replace(/"/g, '&quot;').replace(/'/g, "\\'");
            
            tbody.innerHTML += `
                <tr>
                    <td>${u.id}</td>
                    <td class="fw-bold">${u.username}</td>
                    <td>${u.full_name || '--'}</td>
                    <td>${u.email || '--'}</td>
                    <td><span class="${roleClass}">${u.role.toUpperCase()}</span></td>
                    <td>
                        <button class="btn-edit" onclick='openEditUser(${json})'><i class="fa-solid fa-user-gear"></i></button>
                        <button class="btn-delete" onclick="deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
        });
    }
}

function openEditUser(u) {
    document.getElementById('user-id').value = u.id;
    document.getElementById('u-username').value = u.username;
    document.getElementById('u-fullname').value = u.full_name || '';
    document.getElementById('u-email').value = u.email || '';
    document.getElementById('u-role').value = u.role;
    toggleModal('user-modal');
}

async function handleSaveUser(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const res = await callAPI(`/auth/users/${data.id}`, 'PUT', data);
    if (res.ok) {
        alert("Cập nhật User thành công!");
        toggleModal('user-modal');
        loadUsers();
    } else {
        alert("Lỗi: " + res.data.message);
    }
}

async function deleteUser(id) {
    if (confirm("Xóa tài khoản người dùng này?")) {
        await callAPI(`/auth/users/${id}`, 'DELETE');
        loadUsers();
    }
}

/* ==================== 6. QUẢN LÝ ĐƠN ĐẶT VÉ ==================== */

async function loadBookings() {
    const tbody = document.getElementById('booking-list-body');
    tbody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';

    const res = await callAPI('/bookings/all', 'GET');
    if (res.ok) {
        tbody.innerHTML = '';
        if (res.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">Chưa có đơn nào.</td></tr>';
            return;
        }

        res.data.forEach(b => {
            let statusClass = 'st-pending';
            if(b.status === 'paid') statusClass = 'st-paid';
            if(b.status === 'canceled') statusClass = 'st-canceled';
            
            const total = b.total_price ? b.total_price.toLocaleString() : 0;

            tbody.innerHTML += `
                <tr>
                    <td>#${b.id}</td>
                    <td>${b.username} (ID:${b.user_id})</td>
                    <td>
                        <strong>${b.movie_name}</strong><br>
                        <span style="font-size:11px; color:#666">${b.cinema_name} - ${b.room_name}</span>
                    </td>
                    <td>${b.seats.join(', ')}</td>
                    <td>${total}đ</td>
                    <td><span class="${statusClass}">${b.status.toUpperCase()}</span></td>
                    <td>${b.created_at}</td>
                    <td>
                        ${b.status === 'pending' ? `<button class="btn-delete" onclick="cancelBookingByAdmin(${b.id})">Hủy</button>` : ''}
                    </td>
                </tr>`;
        });
    } else {
        tbody.innerHTML = `<tr><td colspan="8" style="color:red">${res.data.message}</td></tr>`;
    }
}

async function cancelBookingByAdmin(id) {
    if (confirm("Admin xác nhận hủy đơn này?")) {
        const res = await callAPI(`/bookings/${id}/cancel`, 'POST');
        if (res.ok) {
            alert("Đã hủy đơn!");
            loadBookings();
        } else {
            alert("Lỗi: " + res.data.message);
        }
    }
}