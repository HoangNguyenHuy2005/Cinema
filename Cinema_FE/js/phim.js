// js/phim.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load dữ liệu
    loadAllMovies();
    loadGenres(); // <--- MỚI: Load danh sách thể loại cho dropdown

    // 2. Kiểm tra tìm kiếm từ URL (nếu chuyển từ trang khác sang)
    const urlParams = new URLSearchParams(window.location.search);
    const searchKeyword = urlParams.get('search');
    
    if (searchKeyword) {
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) searchInput.value = searchKeyword;
    }

    // 3. Lắng nghe sự kiện thay đổi bộ lọc
    const genreFilter = document.getElementById('genre-filter');
    const dateFilter = document.getElementById('date-filter');
    const searchInput = document.querySelector('.search-bar input');

    if (genreFilter) genreFilter.addEventListener('change', applyFilters);
    if (dateFilter) dateFilter.addEventListener('change', applyFilters);
    
    // Nếu muốn gõ tìm kiếm lọc ngay tại trang này luôn:
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
});

let allMoviesData = [];

async function loadAllMovies() {
    const result = await callAPI('/movies', 'GET');
    if (result.ok) {
        allMoviesData = result.data;
        // Sau khi có dữ liệu, chạy lọc lần đầu (để áp dụng search URL nếu có)
        applyFilters();
    } else {
        console.error("Lỗi tải phim:", result);
    }
}

// --- HÀM MỚI: Tải danh sách thể loại ---
async function loadGenres() {
    const select = document.getElementById('genre-filter');
    if (!select) return;

    const result = await callAPI('/movies/genres', 'GET');
    if (result.ok) {
        // Giữ option đầu tiên là "Tất cả thể loại"
        select.innerHTML = '<option value="">Tất cả thể loại</option>';
        result.data.forEach(g => {
            select.innerHTML += `<option value="${g.id}">${g.name}</option>`;
        });
    }
}

// --- HÀM LỌC TỔNG HỢP ---
function applyFilters() {
    // 1. Lấy giá trị các tiêu chí
    const genreVal = document.getElementById('genre-filter')?.value;
    const dateVal = document.getElementById('date-filter')?.value;
    const searchInput = document.querySelector('.search-bar input');
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

    // 2. Bắt đầu lọc
    let filtered = allMoviesData;

    // A. Lọc theo Từ khóa (Tên phim hoặc Đạo diễn)
    if (keyword) {
        filtered = filtered.filter(m => {
            const mName = (m.name || m.Name || '').toLowerCase();
            const mDirector = (m.director || m.Director || '').toLowerCase();
            return mName.includes(keyword) || mDirector.includes(keyword);
        });
    }

    // B. Lọc theo Ngày chiếu
    if (dateVal) {
        filtered = filtered.filter(m => {
            const mDate = m.release_date || m.ReleaseDate;
            return mDate === dateVal;
        });
    }

    // C. Lọc theo Thể loại (QUAN TRỌNG)
    if (genreVal) {
        filtered = filtered.filter(m => {
            // m.genres là mảng các object [{id:1, name:'Hành động'}, ...]
            // Ta kiểm tra xem có genre nào trùng id với genreVal không
            if (!m.genres || m.genres.length === 0) return false;
            return m.genres.some(g => g.id == genreVal);
        });
    }

    // 3. Render kết quả
    renderMovieGrid(filtered);
}

function renderMovieGrid(movies) {
    const container = document.querySelector('.movie-grid');
    if (!container) return;
    container.innerHTML = '';

    if (movies.length === 0) {
        container.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:30px; color:#666">Không tìm thấy phim phù hợp.</p>';
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

        // Hiển thị thể loại lên thẻ phim (Optional)
        let genreNames = "";
        if (movie.genres && movie.genres.length > 0) {
            genreNames = `<p class="movie-genre" style="font-size:12px; color:#888">${movie.genres.map(g => g.name).join(', ')}</p>`;
        }

        const html = `
            <div class="movie-card">
                <div class="poster-img">
                    <img src="${poster}" alt="${name}" onerror="this.src='https://via.placeholder.com/180x270'">
                </div>
                <div class="movie-info">
                    <h3>${name}</h3>
                    ${genreNames}
                    <p class="release-date">Khởi chiếu: ${releaseDateDisplay}</p>
                </div>
                <a href="dat-ve.html?movieId=${id}" class="buy-ticket-btn">Mua vé</a>
            </div>
        `;
        container.innerHTML += html;
    });
}