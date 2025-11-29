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
        // --- SỬA LỖI Ở ĐÂY ---
        // Chấp nhận cả key cũ (viết hoa) và key mới (viết thường)
        const poster = movie.poster || movie.PosterURL || 'https://via.placeholder.com/180x270?text=No+Image';
        const name = movie.name || movie.Name || "Tên phim chưa cập nhật";
        const id = movie.id || movie.MovieID;
        
        // Xử lý ngày tháng
        const rawDate = movie.release_date || movie.ReleaseDate;
        let releaseDateStr = "Sắp chiếu";
        if (rawDate) {
            releaseDateStr = new Date(rawDate).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'});
        }
        
        const html = `
            <div class="movie-card">
                <div class="poster-img">
                    <img src="${poster}" alt="${name}">
                    <span class="tag-soon">CHIẾU SỚM</span> 
                </div>
                <div class="movie-info">
                    <h3>${name}</h3>
                    <p class="release-date">${releaseDateStr}</p>
                </div>
                <a href="dat-ve.html?movieId=${id}" class="buy-ticket-btn">Mua vé</a>
            </div>
        `;
        container.innerHTML += html;
    });

    // Khởi tạo Slider
    initMovieSlider();
}

function initMovieSlider() {
    const carousel = document.querySelector('.movie-carousel');
    if (!carousel) return;

    const items = carousel.querySelectorAll('.movie-card');
    if (items.length === 0) return;

    let currentIndex = 0;
    // Tính toán độ rộng item + gap (nếu có css gap)
    // Giả sử gap khoảng 20px từ CSS
    const itemStyle = window.getComputedStyle(items[0]);
    const itemWidth = items[0].offsetWidth + parseInt(itemStyle.marginRight || 0) + 20; 
    
    // Tự động chạy slider
    let sliderInterval = setInterval(() => {
        currentIndex++;
        // Reset nếu chạy quá (ước lượng)
        if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth) {
             currentIndex = 0;
             carousel.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
             carousel.scrollBy({ left: itemWidth, behavior: 'smooth' });
        }
    }, 4000);
}