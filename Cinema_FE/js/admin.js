/* === LOGIC CHO ADMIN-DASHBOARD.HTML === */

document.addEventListener('DOMContentLoaded', () => {
    
    console.log("Admin scripts loaded.");
    
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        // Bỏ qua link Đăng xuất
        if (link.classList.contains('logout')) {
            return;
        }

        link.addEventListener('click', (e) => {
            e.preventDefault(); // Ngăn trình duyệt tải lại
            
            const targetId = link.dataset.content; // Lấy e.g., "movies"
            const targetSection = document.getElementById(targetId);

            // 1. Cập nhật class 'active' cho link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // 2. Ẩn tất cả nội dung
            contentSections.forEach(section => {
                section.classList.remove('active');
            });

            // 3. Hiển thị nội dung tương ứng
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
});