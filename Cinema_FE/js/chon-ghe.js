// js/chon-ghe.js

const urlParams = new URLSearchParams(window.location.search);
const scheduleId = urlParams.get('showtimeId');
let selectedSeats = []; // Lưu mã ghế (ví dụ: ['A1', 'A2'])
let seatPrices = {};    // Lưu giá từng ghế để tính tổng
let totalPrice = 0;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('accessToken');
    if (!token) {
        alert("Vui lòng đăng nhập để đặt vé!");
        window.location.href = "dang-nhap.html";
        return;
    }

    // 2. Kiểm tra scheduleId
    if (!scheduleId) {
        alert("Không tìm thấy suất chiếu!");
        window.location.href = "index.html";
        return;
    }

    await loadSeatMap();

    // 3. Gán sự kiện nút đặt vé
    const confirmBtn = document.getElementById('confirm-booking-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleBooking);
    }
});

async function loadSeatMap() {
    const container = document.getElementById('seat-map');
    container.innerHTML = '<p>Đang tải sơ đồ ghế...</p>';

    // Gọi API lấy thông tin suất chiếu + ghế
    // (Sử dụng route của booking_routes hoặc showtime_routes tuỳ backend bạn đang dùng)
    // Ở Turn 16 bạn đã tạo route: /api/bookings/showtimes/<sid>/seats
    const result = await callAPI(`/bookings/showtimes/${scheduleId}/seats`, 'GET');

    if (result.ok) {
        // Cập nhật thông tin phim/rạp ở header nếu API trả về
        // (Giả sử API trả về thêm thông tin phụ, nếu không thì bỏ qua)
        // document.getElementById('movie-title').innerText = result.data.movie_name || "Phim";
        
        renderSeats(result.data.seats, container);
    } else {
        container.innerHTML = `<p style="color:red">Lỗi: ${result.data.message}</p>`;
    }
}

function renderSeats(seats, container) {
    container.innerHTML = '';
    
    // Nhóm ghế theo hàng (A, B, C...)
    const rows = {};
    seats.forEach(s => {
        const rowLabel = s.seat_code.charAt(0); // Lấy chữ cái đầu
        if (!rows[rowLabel]) rows[rowLabel] = [];
        rows[rowLabel].push(s);
    });

    // Sắp xếp hàng A -> Z
    Object.keys(rows).sort().forEach(rowLabel => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'seat-row';
        
        // Sắp xếp ghế trong hàng (1 -> 10...)
        rows[rowLabel].sort((a, b) => {
            const numA = parseInt(a.seat_code.substring(1));
            const numB = parseInt(b.seat_code.substring(1));
            return numA - numB;
        });

        rows[rowLabel].forEach(seat => {
            const seatDiv = document.createElement('div');
            // Class: seat standard available
            seatDiv.className = `seat ${seat.type} ${seat.status}`;
            seatDiv.innerText = seat.seat_code;
            seatDiv.dataset.code = seat.seat_code;
            seatDiv.dataset.price = seat.price;

            // Chỉ ghế 'available' mới click được
            if (seat.status === 'available') {
                seatDiv.addEventListener('click', () => toggleSeat(seatDiv));
            }

            rowDiv.appendChild(seatDiv);
        });
        container.appendChild(rowDiv);
    });
}

function toggleSeat(seatElement) {
    const code = seatElement.dataset.code;
    const price = parseInt(seatElement.dataset.price);

    if (seatElement.classList.contains('selected')) {
        // Bỏ chọn
        seatElement.classList.remove('selected');
        selectedSeats = selectedSeats.filter(s => s !== code);
        totalPrice -= price;
    } else {
        // Chọn mới
        seatElement.classList.add('selected');
        selectedSeats.push(code);
        totalPrice += price;
    }

    updateSummary();
}

function updateSummary() {
    const seatsEl = document.getElementById('booking-seats');
    const priceEl = document.getElementById('booking-price');
    const btn = document.getElementById('confirm-booking-btn');

    if (selectedSeats.length > 0) {
        seatsEl.innerHTML = `Ghế: <span style="color:#fca311; font-weight:bold">${selectedSeats.join(', ')}</span>`;
        priceEl.innerText = `Tổng tiền: ${totalPrice.toLocaleString()}đ`;
        btn.disabled = false;
        btn.style.backgroundColor = '#fca311';
    } else {
        seatsEl.innerHTML = `Ghế: <span style="color:#999">Chưa chọn</span>`;
        priceEl.innerText = `Tổng tiền: 0đ`;
        btn.disabled = true;
        btn.style.backgroundColor = '#ccc';
    }
}

async function handleBooking() {
    if (selectedSeats.length === 0) return;

    const btn = document.getElementById('confirm-booking-btn');
    btn.disabled = true;
    btn.innerText = "Đang xử lý...";

    // Gửi API đặt vé
    const result = await callAPI('/bookings/', 'POST', {
        schedule_id: parseInt(scheduleId),
        seat_codes: selectedSeats
    });

    if (result.ok) {
        alert(`Đặt vé thành công! Mã đơn: ${result.data.booking_id}. Vui lòng thanh toán.`);
        // Chuyển hướng về trang lịch sử hoặc trang chủ
        window.location.href = "user-profile.html"; 
    } else {
        alert("Lỗi đặt vé: " + result.data.message);
        btn.disabled = false;
        btn.innerText = "Xác nhận đặt vé";
        // Load lại ghế để cập nhật trạng thái mới nhất
        loadSeatMap();
        selectedSeats = [];
        totalPrice = 0;
        updateSummary();
    }
}