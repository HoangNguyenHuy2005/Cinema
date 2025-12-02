from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from models import db, User

auth_bp = Blueprint('auth', __name__)

# --- Đăng ký ---
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 400

    hashed_pw = generate_password_hash(password)
    new_user = User(username=username, password_hash=hashed_pw)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201


# --- Đăng nhập ---
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid credentials"}), 401

    additional_claims = {"role": user.role}
    token = create_access_token(
        identity=user.username, 
        additional_claims=additional_claims # Thêm vai trò vào claims
    )
       
    return jsonify({
        "access_token": token,
        "username": user.username,
        "role": user.role 
    }), 200


# --- Đăng xuất (JWT client xoá token) ---
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({"message": "Logged out successfully"}), 200


# --- Kiểm tra quyền admin ---
@auth_bp.route('/admin-only', methods=['GET'])
@jwt_required()
def admin_only():
    claims = get_jwt()
    if claims.get("role") != "admin": 
        return jsonify({"message": "Access denied"}), 403
    return jsonify({"message": "Welcome, admin!"}), 200

# Lấy danh sách người dùng (Chỉ Admin)
@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    claims = get_jwt() # Lấy toàn bộ claims/dictionary từ Token
    current_username = get_jwt_identity() # Lấy username (là string)
    
    # Kiểm tra quyền Admin bằng claims["role"]
    if claims.get("role") != "admin": 
        return jsonify({"message": "Access denied"}), 403

    # Dùng username string để query DB
    current_user = User.query.filter_by(username=current_username).first()

    users = User.query.all()

    return jsonify([{
        "id": u.id, 
        "username": u.username, 
        "role": u.role,
        "created_at": u.created_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(u, 'created_at') else None
    } for u in users])

    # --- API MỚI: Lấy thông tin cá nhân ---
@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_name = get_jwt_identity() # Trả về username
    user = User.query.filter_by(username=current_user_name).first()
    
    if not user: return jsonify({"message": "User not found"}), 404
    
    return jsonify({
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role
    })

# --- API MỚI: Cập nhật thông tin ---
@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_name = get_jwt_identity()
    user = User.query.filter_by(username=current_user_name).first()
    if not user: return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    if 'full_name' in data: user.full_name = data['full_name']
    if 'email' in data: user.email = data['email']
    
    db.session.commit()
    return jsonify({"message": "Cập nhật thành công!"})

# --- API MỚI: Đổi mật khẩu ---
@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    current_user_name = get_jwt_identity()
    user = User.query.filter_by(username=current_user_name).first()
    
    data = request.get_json()
    old_pass = data.get('old_password')
    new_pass = data.get('new_password')

    if not check_password_hash(user.password_hash, old_pass):
        return jsonify({"message": "Mật khẩu cũ không đúng"}), 400
        
    if len(new_pass) < 6:
        return jsonify({"message": "Mật khẩu mới quá ngắn"}), 400

    user.password_hash = generate_password_hash(new_pass)
    db.session.commit()
    return jsonify({"message": "Đổi mật khẩu thành công"})

# --- ADMIN: QUẢN LÝ USER (MỚI) ---

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Không có quyền"}), 403
    
    users = User.query.all()
    return jsonify([{
        "id": u.id,
        "username": u.username,
        "full_name": u.full_name,
        "email": u.email,
        "role": u.role
    } for u in users])

@auth_bp.route('/users/<int:id>', methods=['PUT'])
@jwt_required()
def update_user_role(id):
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Không có quyền"}), 403
    
    user = User.query.get(id)
    if not user: return jsonify({"message": "User not found"}), 404
    
    data = request.get_json()
    if 'role' in data: user.role = data['role']
    # Admin có thể sửa các thông tin khác nếu cần
    if 'full_name' in data: user.full_name = data['full_name']
    if 'email' in data: user.email = data['email']

    db.session.commit()
    return jsonify({"message": "Cập nhật user thành công"})

@auth_bp.route('/users/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_user(id):
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Không có quyền"}), 403
    
    user = User.query.get(id)
    if not user: return jsonify({"message": "User not found"}), 404
    
    # Chặn admin tự xóa mình
    current_user = get_jwt_identity()
    if user.username == current_user:
        return jsonify({"message": "Không thể tự xóa tài khoản đang đăng nhập!"}), 400

    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "Đã xóa user"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Không thể xóa (có thể user đang có vé đặt): " + str(e)}), 500