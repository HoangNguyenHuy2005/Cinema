/* === LOGIC CHO TRANG ĐẶT VÉ (DAT-VE.HTML) === */

document.addEventListener('DOMContentLoaded', () => {

    console.log("Dat-ve scripts loaded.");

    // --- 1. KHỞI TẠO SLIDER "MUA VÉ THEO PHIM" ---
    // (Giống hệt slider ở trang chủ)
    initMovieSlider();

    // --- 2. LOGIC CHỌN KHU VỰC, RẠP, NGÀY (GIẢ LẬP) ---
    
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

/**
 * Khởi tạo slider phim
 * (Hàm này giống hệt hàm trong 'index.js')
 */
function initMovieSlider() {
    // Chỉ chọn carousel trong ".book-by-movie"
    const carousel = document.querySelector('.book-by-movie .movie-carousel');
    if (!carousel) return; 

    const items = carousel.querySelectorAll('.movie-card');
    if (items.length === 0) return; 

    let currentIndex = 0;
    const totalItems = items.length;
    
    const itemWidth = items[0].offsetWidth;
    const gap = 20; 
    const scrollWidthPerItem = itemWidth + gap;
    
    const visibleWidth = carousel.offsetWidth;
    const itemsToScroll = Math.max(1, Math.floor(visibleWidth / scrollWidthPerItem));

    let sliderInterval;

    const startSlider = () => {
        clearInterval(sliderInterval);
        sliderInterval = setInterval(() => {
            currentIndex += itemsToScroll;
            const maxIndex = totalItems - itemsToScroll;
            if (currentIndex > maxIndex) {
                currentIndex = 0;
            }
            const newScrollLeft = currentIndex * scrollWidthPerItem;
            carousel.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
        }, 4000); 
    };

    carousel.addEventListener('mouseenter', () => clearInterval(sliderInterval));
    carousel.addEventListener('mouseleave', startSlider);

    startSlider();
}