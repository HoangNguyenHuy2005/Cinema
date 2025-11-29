document.addEventListener('DOMContentLoaded', () => {
    loadMoviesForBooking();
    loadBookingData();
});

// --- PHẦN 1: MUA VÉ THEO PHIM (SLIDER) ---
async function loadMoviesForBooking() {
    const result = await callAPI('/movies', 'GET');
    if (result.ok) {
        renderBookingSlider(result.data);
    }
}

function renderBookingSlider(movies) {
    const container = document.querySelector('.book-by-movie .movie-carousel');
    if (!container) return;
    container.innerHTML = '';

    movies.forEach(movie => {
        const poster = movie.poster || 'https://via.placeholder.com/180x270';
        // Giả sử backend trả về movie.id (chữ thường) hoặc MovieID (chữ hoa) tùy model
        // Ta dùng cú pháp an toàn:
        const id = movie.id || movie.MovieID; 
        const name = movie.name || movie.Name;
        const dateStr = movie.release_date || movie.ReleaseDate;

        const html = `
            <div class="movie-card">
                <div class="poster-img"><img src="${poster}" alt="${name}"></div>
                <div class="movie-info">
                    <h3>${name}</h3>
                    <p class="release-date">${new Date(dateStr).toLocaleDateString('vi-VN')}</p>
                </div>
                <a href="dat-ve.html?movieId=${id}" class="buy-ticket-btn">Mua vé</a>
            </div>
        `;
        container.innerHTML += html;
    });
}


// --- PHẦN 2: MUA VÉ THEO RẠP (3 CỘT) ---
let allCinemas = [];
let allShowtimes = [];

async function loadBookingData() {
    // Sửa endpoint đúng với backend: /cinemas
    const [cinemasRes, showtimesRes] = await Promise.all([
        callAPI('/cinemas', 'GET'),  
        callAPI('/showtimes', 'GET')  
    ]);

    if (cinemasRes.ok) allCinemas = cinemasRes.data;
    if (showtimesRes.ok) allShowtimes = showtimesRes.data;

    renderAreas();
}

function renderAreas() {
    const areaList = document.querySelector('.area-list ul');
    if (!areaList) return;
    areaList.innerHTML = '';

    // Lọc ra danh sách thành phố duy nhất
    const cities = [...new Set(allCinemas.map(c => extractCity(c.address)))];

    cities.forEach((city, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" class="area-link ${index === 0 ? 'active' : ''}">${city}</a>`;
        
        li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.area-link').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            renderCinemasByCity(city);
        });
        areaList.appendChild(li);
    });

    if (cities.length > 0) renderCinemasByCity(cities[0]);
}

function renderCinemasByCity(city) {
    const cinemaList = document.querySelector('.cinema-list ul');
    if (!cinemaList) return;
    cinemaList.innerHTML = '';

    const cinemas = allCinemas.filter(c => extractCity(c.address) === city);

    cinemas.forEach((cinema, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" class="cinema-link ${index === 0 ? 'active' : ''}">${cinema.name}</a>`;
        
        li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.cinema-link').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            
            renderShowtimes(cinema.id);
        });
        cinemaList.appendChild(li);
    });

    if (cinemas.length > 0) renderShowtimes(cinemas[0].id);
}

function renderShowtimes(cinemaID) {
    const container = document.querySelector('.showtime-listing');
    const datePicker = document.querySelector('.date-picker ul');
    
    if (!container) return;
    
    // 1. Date Picker
    if (datePicker) {
        datePicker.innerHTML = '';
        for(let i=0; i<7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const dayStr = `${d.getDate()}/${d.getMonth()+1}`;
            const dayName = i === 0 ? 'Hôm nay' : `Th ${d.getDay() + 2}`; // Thứ 2 = day 1

            datePicker.innerHTML += `
                <li><a href="#" class="date-link ${i===0?'active':''}">
                    <span>${dayStr}</span><span>${dayName}</span>
                </a></li>`;
        }
    }

    // 2. Render Suất chiếu
    container.innerHTML = '';
    
    // Lọc showtime theo cinema_id. 
    // Backend phải trả về nested object 'room' hoặc 'cinema_id'
    // Ví dụ backend trả về: {id, room: {id, cinema_id, ...}, ...}
    const showtimes = allShowtimes.filter(s => {
        // Kiểm tra an toàn để tránh lỗi undefined
        if (s.room && s.room.cinema_id) {
            return s.room.cinema_id == cinemaID;
        }
        return false;
    });

    if (showtimes.length === 0) {
        container.innerHTML = '<p style="padding:10px">Không có suất chiếu nào.</p>';
        return;
    }

    // Gom nhóm theo tên phim
    const moviesInTheater = {}; 
    showtimes.forEach(s => {
        const mName = s.movie ? s.movie.name : "Unknown Movie";
        if (!moviesInTheater[mName]) {
            moviesInTheater[mName] = { name: mName, times: [] };
        }
        moviesInTheater[mName].times.push(s);
    });

    // Tạo HTML
    Object.values(moviesInTheater).forEach(movie => {
        const timeHtml = movie.times.map(s => {
            const time = new Date(s.show_time).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
            // Nút giờ chiếu gọi hàm bookTicket với schedule ID
            return `<a href="#" class="time-slot" onclick="bookTicket(${s.id})">${time}</a>`;
        }).join('');

        const html = `
            <div class="movie-showtime-item">
                <div class="movie-details">
                    <span class="tag-rate">T16</span>
                    <h4>${movie.name}</h4>
                </div>
                <p class="movie-specs">2D Phụ đề</p>
                <div class="times">${timeHtml}</div>
            </div>
        `;
        container.innerHTML += html;
    });
}

function bookTicket(showtimeId) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        alert("Vui lòng đăng nhập để đặt vé!");
        window.location.href = "dang-nhap.html";
        return;
    }
    // Chuyển sang trang chọn ghế
    window.location.href = `chon-ghe.html?showtimeId=${showtimeId}`;
}

function extractCity(address) {
    if (!address) return "Khác";
    const parts = address.split(',');
    return parts[parts.length - 1].trim();
}