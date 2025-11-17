from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from auth_routes import auth_bp
from config import Config
from models import db, Customer

# Khởi tạo ứng dụng Flask
app = Flask(__name__)

# -----------------------------
# Load cấu hình
# -----------------------------
app.config.from_object(Config)

# -----------------------------
# Cấu hình JWT
# -----------------------------
app.config["JWT_SECRET_KEY"] = "supersecretkey"  # secret key để mã hóa token
jwt = JWTManager(app)

# -----------------------------
# Khởi tạo SQLAlchemy
# -----------------------------
db.init_app(app)

# -----------------------------
# Đăng ký blueprint cho auth
# -----------------------------
app.register_blueprint(auth_bp, url_prefix="/api/auth")

# ----------------------------------------------------
# Route Kiểm tra Kết nối Database
# ----------------------------------------------------
@app.route('/api/db_test', methods=['GET'])
def db_test():
    """Kiểm tra kết nối tới MySQL và đếm số lượng khách hàng."""
    with app.app_context():
        try:
            # Thực hiện truy vấn đơn giản để kiểm tra kết nối
            customer_count = db.session.query(Customer).count()
            
            return jsonify({
                "message": "Database connection successful!", 
                "customer_count": customer_count
            }), 200
        except Exception as e:
            # Trả về lỗi nếu không kết nối được
            print(f"Database connection FAILED: {e}")
            return jsonify({
                "message": "Database connection FAILED!",
                "error": str(e)
            }), 500

# ----------------------------------------------------
# Chạy ứng dụng
# ----------------------------------------------------
if __name__ == '__main__':
    # Trong môi trường phát triển, dùng debug mode
    app.run(debug=True)
