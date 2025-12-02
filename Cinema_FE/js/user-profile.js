document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    
    // Mặc định load luôn lịch sử để sẵn sàng
    loadBookingHistory(); 

    document.getElementById('profile-form').addEventListener('submit', handleUpdateInfo);
    document.getElementById('password-form').addEventListener('submit', handleChangePassword);
});

// ... (Giữ nguyên hàm loadUserProfile, handleUpdateInfo, handleChangePassword cũ) ...
// (Tôi viết gọn lại các hàm cũ để bạn dễ copy, nhưng quan trọng là hàm loadBookingHistory bên dưới)

async function loadUserProfile() {
    const res = await callAPI('/auth/profile', 'GET');
    if (res.ok) {
        const u = res.data;
        document.getElementById('display-name').innerText = u.full_name || u.username;
        document.getElementById('p-username').value = u.username;
        document.getElementById('p-fullname').value = u.full_name || '';
        document.getElementById('p-email').value = u.email || '';
    } else {
        alert("Phiên đăng nhập hết hạn.");
        window.location.href = "dang-nhap.html";
    }
}

async function handleUpdateInfo(e) {
    e.preventDefault();
    const full_name = document.getElementById('p-fullname').value;
    const email = document.getElementById('p-email').value;
    const res = await callAPI('/auth/profile', 'PUT', { full_name, email });
    if (res.ok) { alert("Cập nhật thành công!"); loadUserProfile(); } 
    else alert("Lỗi: " + res.data.message);
}

async function handleChangePassword(e) {
    e.preventDefault();
    const oldPass = document.getElementById('old-pass').value;
    const newPass = document.getElementById('new-pass').value;
    const confirmPass = document.getElementById('confirm-pass').value;
    if (newPass !== confirmPass) return alert("Mật khẩu mới không khớp!");
    
    const res = await callAPI('/auth/change-password', 'POST', { old_password: oldPass, new_password: newPass });
    if (res.ok) { alert("Thành công! Vui lòng đăng nhập lại."); handleLogout(); } 
    else alert("Lỗi: " + res.data.message);
}

// --- HÀM MỚI: LOAD LỊCH SỬ ---
async function loadBookingHistory() {
    const container = document.querySelector('.history-list');
    if (!container) return;
    
    container.innerHTML = '<p>Đang tải lịch sử...</p>';
    
    const res = await callAPI('/bookings/history', 'GET');
    
    if (res.ok) {
        const bookings = res.data;
        if (bookings.length === 0) {
            container.innerHTML = '<p>Bạn chưa có giao dịch nào.</p>';
            return;
        }
        
        container.innerHTML = ''; // Xóa loading
        
        bookings.forEach(b => {
            const statusMap = {
                'paid': { text: 'Đã thanh toán', class: 'status-paid' },
                'pending': { text: 'Chờ thanh toán', class: 'status-pending' },
                'canceled': { text: 'Đã hủy', class: 'status-canceled' }
            };
            
            const st = statusMap[b.status] || { text: b.status, class: '' };
            const poster = b.poster || 'https://via.placeholder.com/80x120';
            const total = b.total_price ? b.total_price.toLocaleString() : 0;

            const html = `
                <div class="history-item">
                    <img src="${poster}" alt="${b.movie_name}" class="poster">
                    <div class="history-info">
                        <div>
                            <h4>${b.movie_name}</h4>
                            <p><strong>Rạp:</strong> ${b.cinema_name} - ${b.room_name}</p>
                            <p><strong>Suất chiếu:</strong> ${b.show_time}</p>
                            <p><strong>Ghế:</strong> ${b.seats.join(', ')}</p>
                            <p style="font-size:12px; color:#999; margin-top:5px">Ngày đặt: ${b.created_at}</p>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:end; margin-top:10px">
                            <span class="status-badge ${st.class}">${st.text}</span>
                            <span class="price">${total}đ</span>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });
    } else {
        container.innerHTML = `<p style="color:red">Lỗi tải lịch sử: ${res.data.message}</p>`;
    }
}

// Chuyển Tab
function showTab(tabName) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.profile-menu a').forEach(el => el.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    
    // Update Active Menu (Thủ công một chút dựa trên thứ tự hoặc logic text)
    const menuLinks = document.querySelectorAll('.profile-menu a');
    // Xóa active hết
    menuLinks.forEach(l => l.classList.remove('active'));

    // Tìm link đúng để active
    if(tabName === 'info') menuLinks[0].classList.add('active');
    if(tabName === 'history') menuLinks[1].classList.add('active'); // Giả sử history là item thứ 2
    if(tabName === 'password') menuLinks[2].classList.add('active');
}

function handleLogout() {
    localStorage.clear();
    window.location.href = "dang-nhap.html";
}