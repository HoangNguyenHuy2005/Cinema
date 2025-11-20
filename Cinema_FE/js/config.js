// Địa chỉ Backend (đảm bảo Backend đang chạy ở port này)
const API_BASE_URL = 'http://127.0.0.1:5000/api';

/**
 * Hàm gọi API chung cho toàn bộ ứng dụng
 * @param {string} endpoint - Đường dẫn API (ví dụ: '/auth/login')
 * @param {string} method - Phương thức (GET, POST, PUT, DELETE)
 * @param {object} body - Dữ liệu gửi đi (nếu có)
 */
async function callAPI(endpoint, method = 'GET', body = null) {
    // Lấy token từ bộ nhớ (nếu người dùng đã đăng nhập)
    const token = localStorage.getItem('accessToken');

    const headers = {
        'Content-Type': 'application/json'
    };

    // Nếu có token, đính kèm vào header để xác thực
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        return { ok: response.ok, status: response.status, data };
    } catch (error) {
        console.error('Lỗi kết nối API:', error);
        return { ok: false, error };
    }
}