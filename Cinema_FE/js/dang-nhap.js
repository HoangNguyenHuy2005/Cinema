/* === LOGIC CHO TRANG ĐĂNG NHẬP (DANG-NHAP.HTML) === */

document.addEventListener('DOMContentLoaded', () => {

    console.log("Dang-nhap scripts loaded.");

    const tabLinks = document.querySelectorAll('.tab-link');
    const forms = document.querySelectorAll('.auth-form');
    const loginForm = document.getElementById('login');

    // === 1. LOGIC CHUYỂN TAB (GIỮ NGUYÊN) ===
    if (tabLinks.length > 0 && forms.length > 0) {
        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                const formId = link.dataset.form; 
                const targetForm = document.getElementById(formId);

                tabLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                forms.forEach(f => f.classList.remove('active'));
                if (targetForm) {
                    targetForm.classList.add('active');
                }
            });
        });
    }

    // === 2. LOGIC GIẢ LẬP ĐĂNG NHẬP (MỚI) ===
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            // Ngăn form gửi đi thật
            event.preventDefault(); 

            // Lấy giá trị từ form
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;

            // Đặt tài khoản test của bạn ở đây
            const TEST_EMAIL = 'test@gmail.com';
            const TEST_PASS = '123456';

            if (email === TEST_EMAIL && pass === TEST_PASS) {
                // Đăng nhập thành công
                alert('Đăng nhập thành công!');
                
                // Lưu trạng thái vào localStorage
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userName', 'Test User'); // Lưu tên (tùy chọn)

                // Chuyển hướng về trang chủ
                window.location.href = 'index.html';

            } else {
                // Đăng nhập thất bại
                alert('Sai email hoặc mật khẩu!');
            }
        });
    }
});