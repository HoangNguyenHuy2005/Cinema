// Cinema_FE/js/base.js

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();

    // --- 1. SEARCH HEADER (Giữ nguyên) ---
    const searchInput = document.querySelector('.search-bar input');
    const searchIcon = document.querySelector('.search-bar i');
    function performSearch() {
        const keyword = searchInput.value.trim();
        if (keyword) window.location.href = `phim.html?search=${encodeURIComponent(keyword)}`;
    }
    if (searchInput && searchIcon) {
        searchIcon.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
    }

    // --- 2. MODAL RẠP (Logic bật tắt giữ nguyên) ---
    const rapTrigger = document.getElementById('rap-modal-trigger');
    const modal = document.getElementById('cinema-modal');
    const closeBtn = document.querySelector('.modal-close-btn');

    if (rapTrigger && modal) {
        rapTrigger.addEventListener('click', async (e) => {
            e.preventDefault();
            modal.classList.remove('hidden');
            await loadCinemasForModal(); // Gọi hàm load dữ liệu
        });
    }

    if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
});


// --- BIẾN TOÀN CỤC ĐỂ LƯU DATA CHO VIỆC TÌM KIẾM ---
let modalCinemasData = [];

async function loadCinemasForModal() {
    const modalContent = document.querySelector('#cinema-modal .modal-content');
    const listContainer = document.querySelector('.cinema-list-modal');
    
    if (!listContainer) return;

    // 1. Thêm ô tìm kiếm vào Modal nếu chưa có
    if (!document.getElementById('modal-cinema-search')) {
        const searchBox = document.createElement('div');
        searchBox.className = 'modal-search-box';
        searchBox.innerHTML = `
            <input type="text" id="modal-cinema-search" placeholder="Tìm rạp (VD: CGV)..." autocomplete="off">
            <i class="fa-solid fa-magnifying-glass"></i>
        `;
        // Chèn vào trước danh sách ul
        modalContent.insertBefore(searchBox, listContainer);

        // Gán sự kiện tìm kiếm
        document.getElementById('modal-cinema-search').addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase();
            const filtered = modalCinemasData.filter(c => 
                c.name.toLowerCase().includes(keyword) || 
                c.address.toLowerCase().includes(keyword)
            );
            renderModalList(filtered);
        });
    }

    // 2. Gọi API lấy dữ liệu
    listContainer.innerHTML = '<p style="text-align:center; color:#666">Đang tải...</p>';
    const result = await callAPI('/cinemas', 'GET');
    
    if (result.ok) {
        modalCinemasData = result.data; // Lưu data gốc
        renderModalList(modalCinemasData); // Render lần đầu
    } else {
        listContainer.innerHTML = '<p style="color:red; text-align:center">Lỗi tải danh sách rạp.</p>';
    }
}

function renderModalList(list) {
    const listContainer = document.querySelector('.cinema-list-modal');
    listContainer.innerHTML = '';

    if (list.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; padding:10px; color:#999">Không tìm thấy rạp nào.</p>';
        return;
    }

    list.forEach(cinema => {
        const li = document.createElement('li');
        li.className = 'cinema-modal-item';

        // Xử lý Logo
        const logoUrl = cinema.logo || 'https://via.placeholder.com/50/fca311/fff?text=C';
        
        li.innerHTML = `
            <div class="cinema-logo-wrapper">
                <img src="${logoUrl}" alt="${cinema.name}" onerror="this.src='https://via.placeholder.com/50/eee/999?text=Err'">
            </div>
            <div class="cinema-info">
                <h4>${cinema.name}</h4>
                <p>${cinema.address}</p>
                <a href="dat-ve.html" class="view-schedule-link">Xem lịch chiếu</a>
            </div>
        `;
        listContainer.appendChild(li);
    });
}

// --- HÀM USER LOGOUT (Giữ nguyên) ---
function checkLoginStatus() {
    const token = localStorage.getItem('accessToken');
    const userIconLink = document.querySelector('.user-icon');
    if (!userIconLink) return;

    if (token) {
        userIconLink.href = "user-profile.html";
        userIconLink.title = "Trang cá nhân";
        // Clone để xóa event cũ
        const newLink = userIconLink.cloneNode(true);
        userIconLink.parentNode.replaceChild(newLink, userIconLink);
    } 
}

