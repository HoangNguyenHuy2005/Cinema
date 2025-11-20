// js/base.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("Base scripts loaded.");

    // --- Xử lý trạng thái đăng nhập ---
    const userIcon = document.querySelector('.user-icon');
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');

    if (userIcon) {
        if (token) {
            // Đã đăng nhập -> Click để Đăng xuất
            userIcon.setAttribute('href', '#'); // Ngăn chuyển trang
            userIcon.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i>'; // Đổi icon thành logout
            
            // Thêm tooltip hoặc title nếu muốn
            userIcon.title = "Đăng xuất";

            userIcon.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Bạn có muốn đăng xuất không?')) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('userRole');
                    alert('Đã đăng xuất thành công!');
                    window.location.href = 'index.html';
                }
            });
        } else {
            // Chưa đăng nhập -> Giữ nguyên link đến dang-nhap.html
            console.log('Chưa đăng nhập');
        }
    }

    // --- Logic Modal Rạp (Giữ nguyên) ---
    const rapTriggerButton = document.getElementById('rap-modal-trigger');
    const cinemaModal = document.getElementById('cinema-modal');

    if (rapTriggerButton && cinemaModal) {
        const closeModalButton = cinemaModal.querySelector('.modal-close-btn');

        rapTriggerButton.addEventListener('click', (e) => {
            e.preventDefault();
            cinemaModal.classList.remove('hidden');
            // Có thể gọi API load danh sách rạp tại đây nếu cần: loadTheaters()
        });

        if (closeModalButton) {
            closeModalButton.addEventListener('click', () => {
                cinemaModal.classList.add('hidden');
            });
        }

        cinemaModal.addEventListener('click', (e) => {
            if (e.target === cinemaModal) {
                cinemaModal.classList.add('hidden');
            }
        });
    }
});