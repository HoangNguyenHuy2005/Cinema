// Cinema_FE/js/dat-ve.js

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
        const poster = movie.poster || movie.PosterURL || 'https://via.placeholder.com/180x270';
        const id = movie.id || movie.MovieID; 
        const name = movie.name || movie.Name;
        const dateStr = movie.release_date || movie.ReleaseDate;
        const releaseDate = dateStr ? new Date(dateStr).toLocaleDateString('vi-VN') : 'Sắp chiếu';

        const html = `
            <div class="movie-card">
                <div class="poster-img"><img src="${poster}" alt="${name}"></div>
                <div class="movie-info">
                    <h3>${name}</h3>
                    <p class="release-date">${releaseDate}</p>
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
let activeDate = new Date().toISOString().split('T')[0]; // Ngày đang chọn

async function loadBookingData() {
    const [cinemasRes, showtimesRes] = await Promise.all([
        callAPI('/cinemas', 'GET'),  
        callAPI('/showtimes', 'GET')  
    ]);

    if (cinemasRes.ok) allCinemas = cinemasRes.data;
    if (showtimesRes.ok) allShowtimes = showtimesRes.data;

    renderAreas();
    renderDatePicker();
}

function renderDatePicker() {
    const container = document.querySelector('.date-picker ul');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        
        const dateStr = d.toISOString().split('T')[0];
        const dayNum = d.getDate();
        const monthNum = d.getMonth() + 1;
        const days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
        const dayName = i === 0 ? 'Hôm nay' : days[d.getDay()];

        const li = document.createElement('li');
        li.innerHTML = `
            <a href="#" class="date-link ${i === 0 ? 'active' : ''}" data-date="${dateStr}">
                <span>${dayNum}/${monthNum}</span>
                <span>${dayName}</span>
            </a>
        `;
        
        li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.date-link').forEach(el => el.classList.remove('active'));
            e.currentTarget.classList.add('active');
            activeDate = dateStr;
            
            const activeCinema = document.querySelector('.cinema-link.active');
            if (activeCinema) {
                renderShowtimes(activeCinema.dataset.id);
            }
        });
        container.appendChild(li);
    }
}

function renderAreas() {
    const areaList = document.querySelector('.area-list ul');
    if (!areaList) return;
    areaList.innerHTML = '';

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
        li.innerHTML = `<a href="#" class="cinema-link ${index === 0 ? 'active' : ''}" data-id="${cinema.id}">${cinema.name}</a>`;
        
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

// --- HÀM RENDER ĐÃ ĐƯỢC CHỈNH SỬA ---
function renderShowtimes(cinemaID) {
    const container = document.querySelector('.showtime-listing');
    if (!container) return;
    container.innerHTML = '';

    const showtimes = allShowtimes.filter(s => {
        let cId = s.cinema_id;
        if (!cId && s.room) cId = s.room.cinema_id;
        const sDate = s.show_time.split(' ')[0];
        return cId == cinemaID && sDate === activeDate;
    });

    if (showtimes.length === 0) {
        container.innerHTML = '<p style="padding:20px; color:#666">Không có suất chiếu nào vào ngày này.</p>';
        return;
    }

    const moviesInTheater = {}; 
    showtimes.forEach(s => {
        const mName = s.movie_name || (s.movie ? s.movie.name : "Unknown");
        const mPoster = s.movie_poster || (s.movie ? s.movie.poster : "") || 'https://via.placeholder.com/100x150';
        
        if (!moviesInTheater[mName]) {
            moviesInTheater[mName] = { name: mName, poster: mPoster, times: [] };
        }
        moviesInTheater[mName].times.push(s);
    });

    Object.values(moviesInTheater).forEach(movie => {
        const timeHtml = movie.times.map(s => {
            const d = new Date(s.show_time);
            const timeStr = d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
            const price = s.price_standard ? s.price_standard.toLocaleString() : '0';
            
            return `<a href="chon-ghe.html?showtimeId=${s.id}" class="time-slot">
                        <span class="time-text">${timeStr}</span>
                        <span class="price-sub">${price}đ</span>
                    </a>`;
        }).join('');

        const html = `
            <div class="movie-showtime-item">
                <div class="poster">
                    <img src="${movie.poster}" alt="${movie.name}">
                </div>
                <div class="movie-details">
                    <h4>${movie.name}</h4>
                    <p class="movie-specs">2D Phụ đề</p>
                    <div class="times">
                        ${timeHtml}
                    </div>
                </div>
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
    window.location.href = `chon-ghe.html?showtimeId=${showtimeId}`;
}

function extractCity(address) {
    if (!address) return "Khác";
    const parts = address.split(',');
    return parts[parts.length - 1].trim();
}