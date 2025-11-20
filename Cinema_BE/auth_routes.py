from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
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

    token = create_access_token(identity=user.username) 
    
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
    current_username = get_jwt_identity() 
    
    current_user = User.query.filter_by(username=current_username).first()
    
    if not current_user or current_user.role != "admin":
        return jsonify({"message": "Access denied"}), 403
        
    return jsonify({"message": "Welcome, admin!"}), 200