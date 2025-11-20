// js/phim.js
document.addEventListener('DOMContentLoaded', () => {
    loadAllMovies();

    // Lắng nghe sự kiện bộ lọc
    const genreFilter = document.getElementById('genre-filter');
    const dateFilter = document.getElementById('date-filter');

    if (genreFilter) genreFilter.addEventListener('change', filterMovies);
    if (dateFilter) dateFilter.addEventListener('change', filterMovies);
});

// Biến toàn cục lưu danh sách phim gốc
let allMoviesData = [];

async function loadAllMovies() {
    const result = await callAPI('/movies', 'GET');
    if (result.ok) {
        allMoviesData = result.data;
        renderMovieGrid(allMoviesData);
    }
}

function renderMovieGrid(movies) {
    const container = document.querySelector('.movie-grid');
    if (!container) return;
    container.innerHTML = '';

    if (movies.length === 0) {
        container.innerHTML = '<p>Không tìm thấy phim phù hợp.</p>';
        return;
    }

    movies.forEach(movie => {
        const poster = movie.PosterURL || 'https://via.placeholder.com/180x270?text=No+Image';
        const releaseDate = new Date(movie.ReleaseDate).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'});

        const html = `
            <div class="movie-card">
                <div class="poster-img">
                    <img src="${poster}" alt="${movie.Name}">
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
}

function filterMovies() {
    const genreVal = document.getElementById('genre-filter')?.value;
    const dateVal = document.getElementById('date-filter')?.value;

    let filtered = allMoviesData;

    // Lọc theo ngày (Ví dụ đơn giản)
    if (dateVal) {
        filtered = filtered.filter(m => m.ReleaseDate === dateVal);
    }

    // Lọc theo thể loại (Cần API trả về thể loại của phim để lọc chính xác)
    // Hiện tại backend chưa trả về mảng Genre cho mỗi phim trong list, nên tạm thời bỏ qua hoặc cần update backend.
    
    renderMovieGrid(filtered);
}