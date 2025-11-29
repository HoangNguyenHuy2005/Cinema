// Cinema_FE/js/lich-chieu.js

document.addEventListener('DOMContentLoaded', () => {
    loadScheduleData();
});

let allCinemas = [];
let allShowtimes = [];

async function loadScheduleData() {
    // Gọi song song 2 API
    const [cinemasRes, showtimesRes] = await Promise.all([
        callAPI('/cinemas', 'GET'),
        callAPI('/showtimes', 'GET')
    ]);

    if (cinemasRes.ok) allCinemas = cinemasRes.data;
    if (showtimesRes.ok) allShowtimes = showtimesRes.data;

    renderScheduleAreas();
}

function renderScheduleAreas() {
    const areaList = document.querySelector('.area-list ul');
    if (!areaList) return;
    areaList.innerHTML = '';

    // Lấy danh sách thành phố duy nhất
    const cities = [...new Set(allCinemas.map(c => extractCity(c.address)))];

    cities.forEach((city, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" class="area-link ${index === 0 ? 'active' : ''}">${city}</a>`;
        
        li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.area-link').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            renderScheduleCinemas(city);
        });
        areaList.appendChild(li);
    });

    if (cities.length > 0) renderScheduleCinemas(cities[0]);
}

function renderScheduleCinemas(city) {
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
            renderScheduleList(cinema.id);
        });
        cinemaList.appendChild(li);
    });

    if (cinemas.length > 0) renderScheduleList(cinemas[0].id);
}

function renderScheduleList(cinemaID) {
    const container = document.querySelector('.cinema-showtime-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Lọc suất chiếu theo Rạp
    const showtimes = allShowtimes.filter(s => s.cinema_id == cinemaID);

    if (showtimes.length === 0) {
        container.innerHTML = '<p style="padding:20px">Chưa có lịch chiếu tại rạp này.</p>';
        return;
    }

    // Gom nhóm theo tên phim
    const moviesMap = {}; 
    showtimes.forEach(s => {
        const mName = s.movie_name || "Unknown Movie";
        
        if (!moviesMap[mName]) {
            // --- SỬA: Ưu tiên lấy poster từ s.movie_poster ---
            moviesMap[mName] = { 
                name: mName, 
                poster: s.movie_poster || 'https://via.placeholder.com/100x150?text=No+Img', 
                times: [] 
            };
        }
        moviesMap[mName].times.push(s);
    });

    // Render ra HTML
    Object.values(moviesMap).forEach(movie => {
        const timesHtml = movie.times.map(s => {
            const time = new Date(s.show_time).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'});
            const price = (s.price_standard || 0).toLocaleString();
            
            return `<a href="chon-ghe.html?showtimeId=${s.id}" class="time-slot">
                        <span>${time}</span>
                        <span class="price-sub">${price}đ</span>
                    </a>`;
        }).join('');

        const html = `
            <div class="movie-showtime-item">
                <div class="poster">
                    <img src="${movie.poster}" alt="${movie.name}" onerror="this.src='https://via.placeholder.com/100x150'">
                </div>
                <div class="details">
                    <h4>${movie.name}</h4>
                    <div class="format-block">
                        <strong>2D Phụ Đề</strong>
                        <div class="times">${timesHtml}</div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

function extractCity(address) {
    if (!address) return "Khác";
    const parts = address.split(',');
    return parts[parts.length - 1].trim();
}