document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Slider Phim (Phần trên cùng)
    loadMoviesForBooking();

    // 2. Load Dữ liệu cho khung đặt vé 3 cột (Khu vực -> Rạp -> Suất chiếu)
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
        const poster = movie.PosterURL || 'https://via.placeholder.com/180x270';
        const html = `
            <div class="movie-card">
                <div class="poster-img"><img src="${poster}" alt="${movie.Name}"></div>
                <div class="movie-info">
                    <h3>${movie.Name}</h3>
                    <p class="release-date">${new Date(movie.ReleaseDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <a href="dat-ve.html?movieId=${movie.MovieID}" class="buy-ticket-btn">Mua vé</a>
            </div>
        `;
        container.innerHTML += html;
    });
    
    // Khởi tạo slider (nếu cần code slider cũ)
    // initMovieSlider(); 
}


// --- PHẦN 2: MUA VÉ THEO RẠP (3 CỘT) ---
let allTheaters = [];
let allShowtimes = [];

async function loadBookingData() {
    // Gọi song song 2 API lấy Rạp và Lịch chiếu
    const [theatersRes, showtimesRes] = await Promise.all([
        callAPI('/theaters', 'GET'),  // Bạn cần tạo API này ở Backend
        callAPI('/showtimes', 'GET')  // Bạn cần tạo API này ở Backend
    ]);

    if (theatersRes.ok) allTheaters = theatersRes.data;
    if (showtimesRes.ok) allShowtimes = showtimesRes.data;

    // 1. Render danh sách Khu vực (Lấy từ Address của rạp)
    renderAreas();
}

function renderAreas() {
    const areaList = document.querySelector('.area-list ul');
    if (!areaList) return;
    areaList.innerHTML = '';

    // Lấy danh sách thành phố duy nhất từ địa chỉ rạp
    const cities = [...new Set(allTheaters.map(t => extractCity(t.address)))];

    cities.forEach((city, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" class="area-link ${index === 0 ? 'active' : ''}">${city}</a>`;
        
        li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            // Xóa active cũ
            document.querySelectorAll('.area-link').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            
            // Load rạp theo thành phố này
            renderCinemasByCity(city);
        });
        areaList.appendChild(li);
    });

    // Mặc định load thành phố đầu tiên
    if (cities.length > 0) renderCinemasByCity(cities[0]);
}

function renderCinemasByCity(city) {
    const cinemaList = document.querySelector('.cinema-list ul');
    if (!cinemaList) return;
    cinemaList.innerHTML = '';

    const theaters = allTheaters.filter(t => extractCity(t.address) === city);

    theaters.forEach((theater, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" class="cinema-link ${index === 0 ? 'active' : ''}">${theater.name}</a>`;
        
        li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.cinema-link').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            
            // Load lịch chiếu của rạp này
            renderShowtimes(theater.theaterID);
        });
        cinemaList.appendChild(li);
    });

    // Mặc định load rạp đầu tiên
    if (theaters.length > 0) renderShowtimes(theaters[0].id);
}

function renderShowtimes(theaterID) {
    const container = document.querySelector('.showtime-listing');
    const datePicker = document.querySelector('.date-picker ul');
    
    if (!container) return;
    
    // 1. Render Date Picker (7 ngày tới)
    if (datePicker) {
        datePicker.innerHTML = '';
        for(let i=0; i<7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const dayStr = `${d.getDate()}/${d.getMonth()+1}`;
            const dayName = i === 0 ? 'Hôm nay' : `Th ${d.getDay() + 2}`; // Simple logic

            datePicker.innerHTML += `
                <li><a href="#" class="date-link ${i===0?'active':''} data-date="${d.toISOString().split('T')[0]}">
                    <span>${dayStr}</span><span>${dayName}</span>
                </a></li>`;
        }
    }

    // 2. Lọc và Render Suất chiếu
    container.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];
    
    // Lọc suất chiếu của Rạp này và Ngày hôm nay (mặc định)
    const showtimes = allShowtimes.filter(s => 
        s.Screen.TheaterID === theaterID && 
        s.StartTime.startsWith(today)
    );

    if (showtimes.length === 0) {
        container.innerHTML = '<p style="padding:10px">Không có suất chiếu nào.</p>';
        return;
    }

    // Gom nhóm theo phim
    const moviesInTheater = {}; 
    showtimes.forEach(s => {
        if (!moviesInTheater[s.Movie.Name]) {
            moviesInTheater[s.Movie.Name] = { ...s.Movie, times: [] };
        }
        moviesInTheater[s.Movie.Name].times.push(s);
    });

    // Render ra HTML
    Object.values(moviesInTheater).forEach(movie => {
        const timeHtml = movie.times.map(s => {
            const time = new Date(s.StartTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
            return `<a href="#" class="time-slot" onclick="bookTicket(${s.ShowtimeID})">${time}</a>`;
        }).join('');

        const html = `
            <div class="movie-showtime-item">
                <div class="movie-details">
                    <span class="tag-rate">T16</span>
                    <h4>${movie.Name}</h4>
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
    alert(`Chức năng chọn ghế cho suất chiếu ${showtimeId} đang phát triển...`);
    // Chuyển sang trang chọn ghế: window.location.href = `chon-ghe.html?showtimeId=${showtimeId}`;
}

// Helper: Tách tên thành phố từ địa chỉ (Ví dụ: "123 Đường A, Quận 1, TP.HCM")
function extractCity(address) {
    if (!address) return "Khác";
    const parts = address.split(',');
    return parts[parts.length - 1].trim();
}