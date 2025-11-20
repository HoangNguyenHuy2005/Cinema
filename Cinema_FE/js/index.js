document.addEventListener('DOMContentLoaded', () => {
    // Tải danh sách phim khi vào trang
    loadMovies();
    
    // Khởi tạo slider (nếu có logic slider ở đây)
    initMovieSlider();
});

async function loadMovies() {
    // Gọi API lấy phim (Giả sử bạn đã tạo route này ở Backend)
    // Nếu chưa có API này, nó sẽ trả về lỗi 404, bạn có thể bỏ qua bước này để test login trước.
    const result = await callAPI('/movies', 'GET');

    if (result.ok) {
        const movies = result.data; 
        renderMovies(movies);
    } else {
        console.log("Chưa lấy được danh sách phim từ API (hoặc API chưa tồn tại).");
    }
}

function renderMovies(movies) {
    const container = document.querySelector('.movie-carousel');
    if (!container) return;

    container.innerHTML = ''; // Xóa placeholder

    movies.forEach(movie => {
        // Render HTML thẻ phim
        const html = `
            <div class="movie-card">
                <div class="poster-img">
                    <img src="${movie.image_url || 'https://via.placeholder.com/180x270'}" alt="${movie.title}">
                </div>
                <div class="movie-info">
                    <h3>${movie.title}</h3>
                    <p class="release-date">${movie.release_date}</p>
                </div>
                <a href="dat-ve.html?id=${movie.id}" class="buy-ticket-btn">Mua vé</a>
            </div>
        `;
        container.innerHTML += html;
    });
}

function initMovieSlider() {
    // Logic slider của bạn (giữ nguyên code cũ)
}