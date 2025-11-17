/* === LOGIC CHO TRANG PHIM (PHIM.HTML) === */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Phim-specific scripts loaded.");

    // Ví dụ: Thêm logic cho bộ lọc
    const genreFilter = document.getElementById('genre-filter');
    const dateFilter = document.getElementById('date-filter');

    if (genreFilter) {
        genreFilter.addEventListener('change', (e) => {
            console.log('Lọc theo thể loại:', e.target.value);
            // Thêm logic lọc danh sách phim ở đây
        });
    }

    if (dateFilter) {
        dateFilter.addEventListener('change', (e) => {
            console.log('Lọc theo ngày:', e.target.value);
            // Thêm logic lọc danh sách phim ở đây
        });
    }
});