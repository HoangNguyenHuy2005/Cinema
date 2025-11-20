document.addEventListener('DOMContentLoaded', () => {
    // Chỉ cần load dữ liệu cho khung 3 cột
    loadScheduleData();
});

let scheduleTheaters = [];
let scheduleShowtimes = [];

async function loadScheduleData() {
    const [theatersRes, showtimesRes] = await Promise.all([
        callAPI('/theaters', 'GET'),
        callAPI('/showtimes', 'GET')
    ]);

    if (theatersRes.ok) scheduleTheaters = theatersRes.data;
    if (showtimesRes.ok) scheduleShowtimes = showtimesRes.data;

    // Tái sử dụng logic render (hoặc copy hàm từ dat-ve.js nếu không muốn gộp file)
    renderScheduleAreas();
}

function renderScheduleAreas() {
    // Logic y hệt renderAreas() bên dat-ve.js nhưng trỏ vào class của trang lich-chieu.html
    // ... (Bạn có thể copy code từ dat-ve.js sang đây và đổi tên biến nếu cần)
    
    const areaList = document.querySelector('.area-list ul');
    if (!areaList) return;
    areaList.innerHTML = '';

    const cities = [...new Set(scheduleTheaters.map(t => extractCity(t.Address)))];

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

    const theaters = scheduleTheaters.filter(t => extractCity(t.Address) === city);

    theaters.forEach((theater, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" class="cinema-link ${index === 0 ? 'active' : ''}">${theater.Name}</a>`;
        li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.cinema-link').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            renderScheduleList(theater.TheaterID);
        });
        cinemaList.appendChild(li);
    });

    if (theaters.length > 0) renderScheduleList(theaters[0].TheaterID);
}

function renderScheduleList(theaterID) {
    // Logic render danh sách phim giống dat-ve.js
    const container = document.querySelector('.cinema-showtime-list'); // Class khác một chút so với dat-ve.html
    if (!container) return;
    
    container.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];
    
    const showtimes = scheduleShowtimes.filter(s => 
        s.Screen.TheaterID === theaterID && 
        s.StartTime.startsWith(today)
    );

    if (showtimes.length === 0) {
        container.innerHTML = '<p style="padding:20px">Chưa có lịch chiếu.</p>';
        return;
    }

    // Group by Movie logic...
    const moviesMap = {}; 
    showtimes.forEach(s => {
        if (!moviesMap[s.Movie.Name]) moviesMap[s.Movie.Name] = { ...s.Movie, times: [] };
        moviesMap[s.Movie.Name].times.push(s);
    });

    // Render
    Object.values(moviesMap).forEach(movie => {
        const timesHtml = movie.times.map(s => {
            const time = new Date(s.StartTime).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'});
            return `<a href="#" class="time-slot"><span>${time}</span><span>${parseInt(s.Price)/1000}K</span></a>`;
        }).join('');

        const html = `
            <div class="movie-showtime-item">
                <div class="poster"><img src="${movie.PosterURL || 'https://via.placeholder.com/100x150'}" alt=""></div>
                <div class="details">
                    <h4>${movie.Name}</h4>
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