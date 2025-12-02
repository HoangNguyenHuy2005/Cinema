// js/config.js
const API_BASE_URL = 'https://dendrological-zackary-blisteringly.ngrok-free.dev';

async function callAPI(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        // Kiểm tra Content-Type để parse đúng
        const contentType = response.headers.get("content-type");
        let data = {};

        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            // Nếu không phải JSON (ví dụ lỗi server text/html), lấy text
            const text = await response.text();
            // Tạo object data giả để frontend không bị lỗi undefined
            data = { message: text.substring(0, 100) || `Lỗi HTTP ${response.status}` };
        }

        return { ok: response.ok, status: response.status, data };
    } catch (error) {
        console.error('API Error:', error);
        return { 
            ok: false, 
            status: 0, 
            data: { message: "Không thể kết nối đến Server" } 
        };
    }
}