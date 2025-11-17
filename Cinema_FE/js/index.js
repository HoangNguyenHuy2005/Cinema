/* === LOGIC CHO TRANG CHỦ (INDEX.HTML) === */

document.addEventListener('DOMContentLoaded', () => {

    console.log("Index-specific scripts loaded.");

    // --- LOGIC SLIDER TỰ ĐỘNG TRƯỢT ---
    initMovieSlider();
    
    // Logic cho slider dots (vẫn là placeholder)
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            // Tạm thời chỉ làm active dot
            dots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            
            // Bạn sẽ cần thêm logic cuộn slider đến vị trí `index` ở đây
        });
    });

});

/**
 * Khởi tạo slider phim "Đang chiếu"
 * Tự động trượt theo từng "trang" phim.
 */
function initMovieSlider() {
    const carousel = document.querySelector('.movie-carousel');
    if (!carousel) return; // Không tìm thấy slider, thoát

    const items = carousel.querySelectorAll('.movie-card');
    if (items.length === 0) return; // Không có phim, thoát

    let currentIndex = 0;
    const totalItems = items.length;
    
    const itemWidth = items[0].offsetWidth;
    const gap = 20; // Được định nghĩa trong CSS
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
            
            carousel.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });

        }, 4000); // Tự động trượt mỗi 4 giây
    };

    carousel.addEventListener('mouseenter', () => clearInterval(sliderInterval));
    carousel.addEventListener('mouseleave', startSlider);

    startSlider();
}