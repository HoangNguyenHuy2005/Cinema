// js/dang-nhap.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Logic Tab (Giữ nguyên) ---
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
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-pass').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            // Disable button để tránh spam click
            submitBtn.disabled = true;
            submitBtn.innerText = "Đang xử lý...";

            // Gọi API (Dựa trên auth_routes.py của bạn)
            const result = await callAPI('/auth/login', 'POST', {
                username: email, 
                password: password
            });

            submitBtn.disabled = false;
            submitBtn.innerText = "Đăng nhập";

            if (result.ok) {
                alert('Đăng nhập thành công!');
                // Lưu token
                localStorage.setItem('accessToken', result.data.token);
                localStorage.setItem('userRole', result.data.role);

                // Chuyển hướng
                if (result.data.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                alert(result.data.message || 'Đăng nhập thất bại!');
            }
        });
    }

    // --- Xử lý Đăng ký (Nếu backend đã có API register) ---
    /* const registerForm = document.getElementById('register');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            // ... logic tương tự đăng nhập ...
        });
    }
    */
});