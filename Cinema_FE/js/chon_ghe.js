// js/chon-ghe.js

// Lấy showtimeId từ URL (ví dụ: chon-ghe.html?showtimeId=1)
const urlParams = new URLSearchParams(window.location.search);
const scheduleId = urlParams.get('showtimeId');
let selectedSeats = []; // Lưu mã ghế đang chọn (ví dụ: ['A1', 'A2'])
let scheduleInfo = null; // Lưu thông tin suất chiếu (nếu API trả về)

document.addEventListener('DOMContentLoaded', async () => {
    if (!scheduleId) {
        alert("Không tìm thấy thông tin suất chiếu!");
        window.location.href = "index.html";
        return;
    }

    await loadSeatMap();
    
    // Gán sự kiện cho nút "Thanh toán" / "Đặt vé"
    const confirmBtn = document.getElementById('confirm-booking-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleBooking);
    }
});

async function loadSeatMap() {
    const seatMapContainer = document.getElementById('seat-map'); 
    if(!seatMapContainer) return;
    
    seatMapContainer.innerHTML = '<p>Đang tải sơ đồ ghế...</p>';

    // Gọi API lấy danh sách ghế
    const result = await callAPI(`/bookings/showtimes/${scheduleId}/seats`, 'GET');

    if (result.ok) {
        renderSeats(result.data.seats, seatMapContainer);
    } else {
        seatMapContainer.innerHTML = '<p class="error">Lỗi tải ghế. Vui lòng thử lại.</p>';
        console.error(result.error);
    }
}

function renderSeats(seats, container) {
    container.innerHTML = '';
    
    // Sắp xếp ghế để hiển thị đẹp hơn (A1, A2...)
    // Giả sử mã ghế là dạng "A1", "B2"...
    // Bạn có thể cần CSS Grid hoặc Flexbox để chia hàng (Row A, Row B...)
    
    // Nhóm ghế theo hàng (A, B, C...)
    const rows = {};
    seats.forEach(s => {
        const rowLabel = s.seat_code.charAt(0); // Lấy chữ cái đầu
        if (!rows[rowLabel]) rows[rowLabel] = [];
        rows[rowLabel].push(s);
    });

    // Tạo HTML cho từng hàng
    Object.keys(rows).sort().forEach(rowLabel => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'seat-row';
        
        // Sắp xếp ghế trong hàng theo số (A1, A2, A10...)
        rows[rowLabel].sort((a, b) => {
            const numA = parseInt(a.seat_code.substring(1));
            const numB = parseInt(b.seat_code.substring(1));
            return numA - numB;
        });

        rows[rowLabel].forEach(seat => {
            const seatBtn = document.createElement('div');
            seatBtn.className = `seat ${seat.type} ${seat.status}`; 
            // class: seat standard available / seat vip locked ...
            seatBtn.innerText = seat.seat_code;
            seatBtn.dataset.code = seat.seat_code;
            seatBtn.dataset.price = seat.price;

            // Sự kiện chọn ghế
            if (seat.status === 'available') {
                seatBtn.addEventListener('click', () => toggleSeat(seatBtn));
            } else {
                seatBtn.classList.add('disabled'); // Ghế đã đặt hoặc bị khóa
            }

            rowDiv.appendChild(seatBtn);
        });
        container.appendChild(rowDiv);
    });
}

function toggleSeat(seatElement) {
    const code = seatElement.dataset.code;
    
    if (seatElement.classList.contains('selected')) {
        // Bỏ chọn
        seatElement.classList.remove('selected');
        selectedSeats = selectedSeats.filter(s => s !== code);
    } else {
        // Chọn mới
        seatElement.classList.add('selected');
        selectedSeats.push(code);
    }

    updateSummary();
}

function updateSummary() {
    // Cập nhật giao diện tổng tiền, số ghế...
    const summaryEl = document.getElementById('booking-summary');
    if (summaryEl) {
        summaryEl.innerText = `Ghế chọn: ${selectedSeats.join(', ')}`;
    }
}

async function handleBooking() {
    if (selectedSeats.length === 0) {
        alert("Vui lòng chọn ít nhất 1 ghế!");
        return;
    }

    const btn = document.getElementById('confirm-booking-btn');
    btn.disabled = true;
    btn.innerText = "Đang xử lý...";

    // Gọi API create_booking
    const result = await callAPI('/bookings/', 'POST', {
        schedule_id: scheduleId,
        seat_codes: selectedSeats
    });

    btn.disabled = false;
    btn.innerText = "Xác nhận đặt vé";

    if (result.ok) {
        alert(`Đặt vé thành công! Mã đơn: ${result.data.booking_id}. Vui lòng thanh toán trong 5 phút.`);
        // Redirect tới trang thanh toán hoặc lịch sử
        window.location.href = "booking-history.html"; 
    } else {
        alert(result.data.message || "Lỗi đặt vé. Ghế có thể vừa bị người khác chọn.");
        // Load lại ghế để cập nhật trạng thái mới nhất
        loadSeatMap();
        selectedSeats = [];
        updateSummary();
    }
}