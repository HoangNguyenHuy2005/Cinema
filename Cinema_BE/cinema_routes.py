from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Cinema, Room

cinema_bp = Blueprint('cinema', __name__)

# 1. Lấy danh sách Rạp (Kèm danh sách phòng bên trong)
@cinema_bp.route('', methods=['GET'])
def get_cinemas():
    cinemas = Cinema.query.all()
    return jsonify([{
        "id": c.id,
        "name": c.name,
        "address": c.address,
        "rooms": [{"id": r.id, "name": r.name, "capacity": r.capacity} for r in c.rooms]
    } for c in cinemas])

# 2. Thêm Rạp mới (Admin)
@cinema_bp.route('', methods=['POST'])
@jwt_required()
def create_cinema():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"message": "Access denied"}), 403
        
    data = request.get_json()
    if not data.get('name'):
        return jsonify({"message": "Name is required"}), 400
        
    new_cinema = Cinema(name=data['name'], address=data.get('address', ''))
    db.session.add(new_cinema)
    db.session.commit()
    return jsonify({"message": "Cinema created", "id": new_cinema.id}), 201

# 3. Xóa Rạp (Admin)
@cinema_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_cinema(id):
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Denied"}), 403
    
    cinema = Cinema.query.get(id)
    if not cinema: return jsonify({"message": "Not found"}), 404
    
    # Cẩn thận: Xóa rạp sẽ xóa luôn các phòng (nếu cấu hình cascade) hoặc lỗi
    # Ở đây ta xóa đơn giản
    try:
        db.session.delete(cinema)
        db.session.commit()
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    
# Thêm vào cuối file cinema_routes.py (trước dòng return nếu có, hoặc sau hàm delete)

@cinema_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_cinema(id):
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Denied"}), 403
    
    cinema = Cinema.query.get(id)
    if not cinema: return jsonify({"message": "Not found"}), 404
    
    data = request.get_json()
    if 'name' in data: cinema.name = data['name']
    if 'address' in data: cinema.address = data['address']
    
    db.session.commit()
    return jsonify({"message": "Cinema updated"}), 200