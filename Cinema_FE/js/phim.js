// js/phim.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra xem có từ khóa tìm kiếm trên URL không
    const urlParams = new URLSearchParams(window.location.search);
    const searchKeyword = urlParams.get('search');
    
    // Nếu có, điền lại vào ô tìm kiếm để user biết
    if (searchKeyword) {
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) searchInput.value = searchKeyword;
    }

    // 2. Load danh sách phim và lọc ngay lập tức
    loadAllMovies(searchKeyword);

    // 3. Lắng nghe bộ lọc ngày/thể loại (nếu có)
    const dateFilter = document.getElementById('date-filter');
    if (dateFilter) dateFilter.addEventListener('change', () => filterMovies(searchKeyword));
});

// Biến toàn cục lưu danh sách phim gốc
let allMoviesData = [];

async function loadAllMovies(searchKeyword = null) {
    const result = await callAPI('/movies', 'GET');
    if (result.ok) {
        allMoviesData = result.data;
        // Sau khi load xong, gọi hàm lọc ngay để áp dụng search (nếu có)
        filterMovies(searchKeyword);
    } else {
        console.error("Lỗi tải phim:", result);
    }
}

function filterMovies(initialKeyword = null) {
    // Lấy giá trị các bộ lọc hiện tại
    const dateVal = document.getElementById('date-filter')?.value;
    
    // Ưu tiên lấy từ khóa từ ô input (nếu user gõ mới), nếu không thì dùng từ khóa lúc load trang
    const searchInput = document.querySelector('.search-bar input');
    let keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    // Nếu ô input trống nhưng lúc load trang có search (trường hợp reload), dùng search cũ
    if (!keyword && initialKeyword) {
        keyword = initialKeyword.toLowerCase();
    }

    let filtered = allMoviesData;

    // --- 1. LỌC THEO TỪ KHÓA TÌM KIẾM ---
    if (keyword) {
        filtered = filtered.filter(m => {
            const mName = (m.name || m.Name || '').toLowerCase();
            const mDirector = (m.director || m.Director || '').toLowerCase();
            return mName.includes(keyword) || mDirector.includes(keyword);
        });
    }

    // --- 2. LỌC THEO NGÀY ---
    if (dateVal) {
        filtered = filtered.filter(m => {
            const mDate = m.release_date || m.ReleaseDate;
            return mDate === dateVal;
        });
    }

    renderMovieGrid(filtered);
}

function renderMovieGrid(movies) {
    const container = document.querySelector('.movie-grid');
    if (!container) return;
    container.innerHTML = '';

    if (movies.length === 0) {
        container.innerHTML = '<p style="width:100%; text-align:center; padding:20px">Không tìm thấy phim phù hợp.</p>';
        return;
    }

    movies.forEach(movie => {
        const poster = movie.poster || movie.PosterURL || 'https://via.placeholder.com/180x270?text=No+Image';
        const name = movie.name || movie.Name || "Tên phim";
        const id = movie.id || movie.MovieID;
        
        const dateStr = movie.release_date || movie.ReleaseDate;
        let releaseDateDisplay = "---";
        if (dateStr) {
            releaseDateDisplay = new Date(dateStr).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'});
        }

        const html = `
            <div class="movie-card">
                <div class="poster-img">
                    <img src="${poster}" alt="${name}">
                </div>
                <div class="movie-info">
                    <h3>${name}</h3>
                    <p class="release-date">${releaseDateDisplay}</p>
                </div>
                <a href="dat-ve.html?movieId=${id}" class="buy-ticket-btn">Mua vé</a>
            </div>
        `;
        container.innerHTML += html;
    });
}