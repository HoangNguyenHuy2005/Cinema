// js/config.js
const API_BASE_URL = 'http://127.0.0.1:5000/api';

/**
 * Hàm gọi API chung
 * @param {string} endpoint - Ví dụ: '/movies'
 * @param {string} method - 'GET', 'POST', v.v.
 * @param {object} body - Dữ liệu gửi đi (nếu có)
 */
async function callAPI(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('accessToken');
    const headers = {
        'Content-Type': 'application/json'
    };

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
        console.error('API Error:', error);
        return { ok: false, error };
    }
}