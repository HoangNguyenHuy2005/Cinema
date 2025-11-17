/* === LOGIC CHUNG CHO MỌI TRANG === */

document.addEventListener('DOMContentLoaded', () => {

    console.log("Base scripts loaded.");

    // --- Logic cho nút Người dùng ---
    const userIcon = document.querySelector('.user-icon');
    
    // **QUAN TRỌNG: Đọc trạng thái đăng nhập từ localStorage**
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (userIcon) {
        if (isLoggedIn) {
            // NẾU ĐÃ ĐĂNG NHẬP: Biến nút này thành nút ĐĂNG XUẤT
            userIcon.href = "#"; // Bỏ link đến trang đăng nhập

            userIcon.addEventListener('click', (event) => {
                event.preventDefault(); 
                
                // Hỏi người dùng có muốn đăng xuất không
                if (confirm('Bạn có muốn đăng xuất không?')) {
                    // Xóa trạng thái khỏi localStorage
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('userName');
                    
                    alert('Đã đăng xuất.');
                    
                    // Tải lại trang để cập nhật header
                    window.location.href = 'index.html';
                }
            });

        } else {
            // NẾU CHƯA ĐĂNG NHẬP: Giữ nguyên hành vi
            // (Không cần làm gì, nút sẽ tự động trỏ đến dang-nhap.html)
            console.log('Người dùng chưa đăng nhập.');
        }
    }


    /* === LOGIC CHO MODAL RẠP (Giữ nguyên) === */
    const rapTriggerButton = document.getElementById('rap-modal-trigger');
    const cinemaModal = document.getElementById('cinema-modal');
    
    if (rapTriggerButton && cinemaModal) {
        const closeModalButton = cinemaModal.querySelector('.modal-close-btn');

        rapTriggerButton.addEventListener('click', (e) => {
            e.preventDefault(); 
            cinemaModal.classList.remove('hidden');
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