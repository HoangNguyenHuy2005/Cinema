document.addEventListener('DOMContentLoaded', () => {
    // Logic Tab (Đăng nhập / Đăng ký)
    const tabLinks = document.querySelectorAll('.tab-link');
    const forms = document.querySelectorAll('.auth-form');

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            tabLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const formId = link.dataset.form;
            forms.forEach(f => f.classList.remove('active'));
            document.getElementById(formId).classList.add('active');
        });
    });

    // --- XỬ LÝ ĐĂNG NHẬP ---
    const loginForm = document.getElementById('login');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-pass').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            submitBtn.disabled = true;
            submitBtn.innerText = "Đang xử lý...";

            const result = await callAPI('/auth/login', 'POST', {
                username: email, 
                password: password
            });

            submitBtn.disabled = false;
            submitBtn.innerText = "Đăng nhập";

            if (result.ok) {
                // --- LƯU TOKEN VÀ ROLE (QUAN TRỌNG) ---
                localStorage.setItem('accessToken', result.data.access_token);
                
                // Lưu role để admin.js kiểm tra
                if (result.data.role) {
                    localStorage.setItem('userRole', result.data.role);
                }
                
                if (result.data.username) {
                    localStorage.setItem('username', result.data.username);
                }
                
                alert('Đăng nhập thành công!');

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

    // --- XỬ LÝ ĐĂNG KÝ ---
    const registerForm = document.getElementById('register');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value; 
            const password = document.getElementById('reg-pass').value;
            const submitBtn = registerForm.querySelector('button[type="submit"]');

            if (password.length < 6) {
                alert("Mật khẩu phải từ 6 ký tự trở lên");
                return;
            }

            submitBtn.innerText = "Đang đăng ký...";
            submitBtn.disabled = true;

            const result = await callAPI('/auth/register', 'POST', {
                username: email, 
                password: password,
                full_name: name,
                email: email
            });

            submitBtn.innerText = "Đăng ký";
            submitBtn.disabled = false;

            if (result.ok) {
                alert('Đăng ký thành công! Vui lòng đăng nhập.');
                document.querySelector('.tab-link[data-form="login"]').click();
                document.getElementById('login-email').value = email;
            } else {
                alert(result.data.message || 'Đăng ký thất bại.');
            }
        });
    }
});