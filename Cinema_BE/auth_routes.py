from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from passlib.context import CryptContext

# -----------------------------
# Khởi tạo Blueprint
# -----------------------------
auth_bp = Blueprint("auth", __name__)

# -----------------------------
# Hash password
# -----------------------------
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

# -----------------------------
# Fake users (chưa dùng database)
# -----------------------------
fake_users = {
    "admin": {"password": "$2b$12$hrJo.4Qtlx3Y.Y0j692NxeoFtacKL0.acWQ9otTxLygDa/Qt11hc6", "role": "admin"},
    "huy": {"password": "$2b$12$rNkCk6S/HD/HJj39CaXdbuyyj32.8s/wHLmj0vbaEFY1zqW3JjRby", "role": "user"}
}

# -----------------------------
# Hàm kiểm tra username/password
# -----------------------------
def check_user(username, password):
    user = fake_users.get(username)
    if not user:
        return None
    if not pwd.verify(password, user["password"]):
        return None
    return {"username": username, "role": user["role"]}

# -----------------------------
# Route: Login
# -----------------------------
@auth_bp.post("/login")
def login():
    data = request.get_json()
    
    # Kiểm tra dữ liệu đầu vào
    if not data or "username" not in data or "password" not in data:
        return jsonify({"message": "Missing username or password"}), 400

    user = check_user(data["username"], data["password"])

    if not user:
        return jsonify({"message": "Sai tên đăng nhập hoặc mật khẩu"}), 401
    
    # Tạo token JWT (có thể lưu cả username + role)
    token = create_access_token(identity=user)
    return jsonify({"token": token, "role": user["role"]})

# -----------------------------
# Route: Logout
# -----------------------------
@auth_bp.post("/logout")
def logout():
    # JWT là stateless, client chỉ cần xóa token ở frontend là logout
    return jsonify({"message": "Client tự xóa token là logout thành công"})

# -----------------------------
# Ví dụ route test phân quyền (tùy chọn)
# -----------------------------
@auth_bp.get("/admin-only")
@jwt_required()
def admin_only():
    identity = get_jwt_identity()
    if identity["role"] != "admin":
        return jsonify({"message": "Không có quyền truy cập"}), 403
    return jsonify({"message": f"Chào admin {identity['username']}"})

@auth_bp.get("/user-only")
@jwt_required()
def user_only():
    identity = get_jwt_identity()
    if identity["role"] != "user":
        return jsonify({"message": "Không có quyền truy cập"}), 403
    return jsonify({"message": f"Chào user {identity['username']}"})
