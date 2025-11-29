// js/admin.js

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    loadMovies();

    // Chuyển tab
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            const id = link.dataset.content;
            document.getElementById(id).classList.add('active');

            if (id === 'movies') loadMovies();
            if (id === 'showtimes') loadShowtimes();
            if (id === 'cinemas') loadCinemas();
        });
    });

    // Sự kiện Submit
    const forms = {
        'movie-form': handleSaveMovie,
        'add-showtime-form': handleSaveShowtime,
        'add-cinema-form': handleSaveCinema,
        'add-room-form': handleSaveRoom
    };
    for (const [id, handler] of Object.entries(forms)) {
        const el = document.getElementById(id);
        if(el) el.addEventListener('submit', handler);
    }
});

function checkAuth() {
    const token = localStorage.getItem('accessToken');
    if (!token) window.location.href = 'admin-login.html';
}
function handleLogout() {
    localStorage.clear();
    window.location.href = 'admin-login.html';
}
function toggleModal(id) { document.getElementById(id).classList.toggle('hidden'); }

// --- 1. PHIM ---
async function loadMovies() {
    const tbody = document.getElementById('movie-list-body');
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    const res = await callAPI('/movies', 'GET');
    if (res.ok) {
        tbody.innerHTML = '';
        res.data.forEach(m => {
            // ESCAPE DỮ LIỆU ĐỂ TRÁNH LỖI KHI BẤM NÚT SỬA
            const json = JSON.stringify(m).replace(/"/g, '&quot;').replace(/'/g, "\\'");
            tbody.innerHTML += `
                <tr>
                    <td>${m.id}</td>
                    <td><img src="${m.poster||''}" style="height:50px"></td>
                    <td>${m.name}</td>
                    <td>${m.release_date || ''}</td>
                    <td>
                        <button class="btn-edit" onclick='openEditMovie(${json})'><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-delete" onclick="deleteMovie(${m.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
        });
    }
}
function openAddMovieModal() {
    document.getElementById('movie-form').reset();
    document.getElementById('movie-id').value = '';
    document.getElementById('movie-modal-title').innerText = "Thêm Phim";
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
    
    document.getElementById('movie-modal-title').innerText = "Sửa Phim";
    toggleModal('movie-modal');
}
async function handleSaveMovie(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `/movies/${data.id}` : '/movies';
    const res = await callAPI(url, method, data);
    if(res.ok) { alert("Thành công!"); toggleModal('movie-modal'); loadMovies(); }
    else alert(res.data.message);
}
async function deleteMovie(id) {
    if(confirm("Xóa phim?")) { await callAPI(`/movies/${id}`, 'DELETE'); loadMovies(); }
}

// --- 2. LỊCH CHIẾU ---
async function loadShowtimes() {
    const tbody = document.getElementById('showtime-list-body');
    tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
    const res = await callAPI('/showtimes', 'GET');
    if (res.ok) {
        tbody.innerHTML = '';
        res.data.forEach(s => {
            // Tạo object phẳng để fill form dễ hơn
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
                    <td>${s.price_standard}</td>
                    <td>
                        <button class="btn-edit" onclick='openEditShowtime(${json})'><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-delete" onclick="deleteShowtime(${s.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
        });
    }
}
async function openAddShowtimeModal() {
    document.getElementById('add-showtime-form').reset();
    document.getElementById('st-id').value = '';
    document.getElementById('st-modal-title').innerText = "Thêm Lịch";
    document.getElementById('st-room-select').disabled = false;
    toggleModal('showtime-modal');
    loadShowtimeOptions();
}
async function openEditShowtime(s) {
    document.getElementById('st-id').value = s.id;
    document.getElementById('st-modal-title').innerText = "Sửa Lịch";
    toggleModal('showtime-modal');
    await loadShowtimeOptions();
    
    document.getElementById('st-movie-select').value = s.movie_id;
    document.getElementById('st-room-select').value = s.room_id;
    document.getElementById('st-room-select').disabled = true; // Không cho sửa phòng
    document.getElementById('st-price').value = s.price;
    
    // Convert "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM"
    if(s.show_time) {
        document.getElementById('st-time').value = s.show_time.replace(' ', 'T').substring(0,16);
    }
}
async function loadShowtimeOptions() {
    const mSel = document.getElementById('st-movie-select');
    const rSel = document.getElementById('st-room-select');
    
    if(mSel.options.length <= 1) { // Chỉ load nếu chưa load
        const mRes = await callAPI('/movies', 'GET');
        if(mRes.ok) mSel.innerHTML += mRes.data.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        
        const rRes = await callAPI('/rooms', 'GET');
        if(rRes.ok) rSel.innerHTML += rRes.data.map(r => `<option value="${r.id}">${r.cinema_name} - ${r.name}</option>`).join('');
    }
}
async function handleSaveShowtime(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `/showtimes/${data.id}` : '/showtimes';
    const res = await callAPI(url, method, data);
    if(res.ok) { alert("Thành công!"); toggleModal('showtime-modal'); loadShowtimes(); }
    else alert(res.data.message);
}
async function deleteShowtime(id) {
    if(confirm("Xóa lịch?")) { await callAPI(`/showtimes/${id}`, 'DELETE'); loadShowtimes(); }
}

// --- 3. RẠP & PHÒNG ---
async function loadCinemas() {
    const tbody = document.getElementById('cinema-list-body');
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    const res = await callAPI('/cinemas', 'GET');
    if(res.ok) {
        tbody.innerHTML = '';
        res.data.forEach(c => {
            const cJson = JSON.stringify(c).replace(/"/g, '&quot;').replace(/'/g, "\\'");
            let rooms = c.rooms.map(r => {
                 const rJson = JSON.stringify(r).replace(/"/g, '&quot;').replace(/'/g, "\\'");
                 return `<span class="badge">${r.name} <i class="fa-solid fa-pen" onclick='openEditRoom(${c.id},"${c.name}",${rJson});event.stopPropagation()'></i></span>`;
            }).join(' ');
            
            tbody.innerHTML += `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.name}</td>
                    <td>${c.address}</td>
                    <td>${rooms} <button class="btn-tiny" onclick="openAddRoomModal(${c.id}, '${c.name}')">+</button></td>
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
    document.getElementById('cinema-modal-title').innerText = "Sửa Rạp";
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
    if(confirm("Xóa rạp sẽ xóa hết phòng!")) { await callAPI(`/cinemas/${id}`, 'DELETE'); loadCinemas(); }
}

// Room Logic
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