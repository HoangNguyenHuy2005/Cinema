// js/index.js
document.addEventListener('DOMContentLoaded', () => {
    // Gọi API lấy phim khi trang tải xong
    loadMovies();
});

async function loadMovies() {
    // Gọi API Backend
    const result = await callAPI('/movies', 'GET');

    if (result.ok) {
        const movies = result.data;
        renderMovieCarousel(movies);
    } else {
        console.error("Không lấy được danh sách phim:", result.error);
    }
}

function renderMovieCarousel(movies) {
    const container = document.querySelector('.movie-carousel');
    if (!container) return;

    container.innerHTML = ''; // Xóa placeholder

    // Nếu API trả về rỗng
    if (movies.length === 0) {
        container.innerHTML = '<p style="padding:20px;">Hiện chưa có phim nào.</p>';
        return;
    }

    movies.forEach(movie => {
        // Xử lý dữ liệu (đảm bảo có ảnh default nếu DB chưa có)
        const poster = movie.PosterURL || 'https://via.placeholder.com/180x270?text=No+Image';
        // Format ngày chiếu
        const releaseDate = new Date(movie.ReleaseDate).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'});
        
        const html = `
            <div class="movie-card">
                <div class="poster-img">
                    <img src="${poster}" alt="${movie.Name}">
                    <span class="tag-soon">CHIẾU SỚM</span> 
                </div>
                <div class="movie-info">
                    <h3>${movie.Name}</h3>
                    <p class="release-date">${releaseDate}</p>
                </div>
                <a href="dat-ve.html?movieId=${movie.MovieID}" class="buy-ticket-btn">Mua vé</a>
            </div>
        `;
        container.innerHTML += html;
    });

    // Khởi tạo Slider (Code cũ của bạn để chạy slider)
    initMovieSlider();
}

function initMovieSlider() {
    const carousel = document.querySelector('.movie-carousel');
    if (!carousel) return;

    const items = carousel.querySelectorAll('.movie-card');
    if (items.length === 0) return;

    let currentIndex = 0;
    const gap = 20;
    const itemWidth = items[0].offsetWidth + gap;
    
    // Tự động chạy slider
    let sliderInterval = setInterval(() => {
        currentIndex++;
        if (currentIndex * itemWidth >= carousel.scrollWidth - carousel.clientWidth) {
            currentIndex = 0;
        }
        carousel.scrollTo({ left: currentIndex * itemWidth, behavior: 'smooth' });
    }, 4000);
}