document.addEventListener('DOMContentLoaded', () => {
    console.log("Trang Đăng nhập đã tải.");

    // --- Logic chuyển tab Đăng nhập / Đăng ký ---
    const tabLinks = document.querySelectorAll('.tab-link');
    const forms = document.querySelectorAll('.auth-form');

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Active tab
            tabLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show form
            const formId = link.dataset.form; 
            forms.forEach(f => f.classList.remove('active'));
            document.getElementById(formId).classList.add('active');
        });
    });

    // --- Xử lý Đăng nhập ---
    const loginForm = document.getElementById('login');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-pass').value;

            // Gọi API Login
            const result = await callAPI('/auth/login', 'POST', {
                username: email, 
                password: password
            });

            if (result.ok) {
                alert('Đăng nhập thành công!');
                
                // Lưu token vào localStorage để dùng cho các request sau
                localStorage.setItem('accessToken', result.data.token);
                localStorage.setItem('userRole', result.data.role);

                // Chuyển hướng dựa vào quyền (role)
                if (result.data.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                alert(result.data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
            }
        });
    }
});