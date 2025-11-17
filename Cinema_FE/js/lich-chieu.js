/* === LOGIC CHO TRANG LỊCH CHIẾU (LICH-CHIEU.HTML) === */

document.addEventListener('DOMContentLoaded', () => {

    console.log("Lich-chieu scripts loaded.");

    // --- LOGIC CHỌN KHU VỰC, RẠP, NGÀY (GIẢ LẬP) ---
    
    // Khu vực
    const areaLinks = document.querySelectorAll('.area-link');
    areaLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            areaLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            console.log('Đã chọn khu vực:', link.textContent);
            // Thêm logic tải danh sách rạp tương ứng
        });
    });

    // Rạp
    const cinemaLinks = document.querySelectorAll('.cinema-link');
    cinemaLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            cinemaLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            console.log('Đã chọn rạp:', link.textContent);
            // Thêm logic tải lịch chiếu tương ứng
        });
    });

    // Ngày
    const dateLinks = document.querySelectorAll('.date-link');
    dateLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            dateLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            console.log('Đã chọn ngày:', link.textContent);
            // Thêm logic tải lịch chiếu tương ứng
        });
    });

});