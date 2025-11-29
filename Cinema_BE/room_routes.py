from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Room, Cinema, Seat

room_bp = Blueprint('room', __name__)

# 1. Lấy danh sách phòng (đã có ở bước trước, giữ nguyên hoặc thêm nếu thiếu)
@room_bp.route('', methods=['GET'])
def get_rooms():
    rooms = Room.query.all()
    return jsonify([{
        "id": r.id,
        "name": r.name,
        "cinema_name": r.cinema.name if r.cinema else "Unknown",
        "capacity": r.capacity
    } for r in rooms])

# 2. Thêm Phòng mới + Tự động tạo Ghế (Admin)
@room_bp.route('', methods=['POST'])
@jwt_required()
def create_room():
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Denied"}), 403
    
    data = request.get_json()
    cinema_id = data.get('cinema_id')
    name = data.get('name')
    
    if not cinema_id or not name:
        return jsonify({"message": "Missing info"}), 400
        
    # Tạo phòng
    # Mặc định capacity 50 (10 hàng x 5 cột)
    new_room = Room(cinema_id=cinema_id, name=name, capacity=50)
    db.session.add(new_room)
    db.session.flush() # Lấy ID
    
    # --- Tự động tạo 50 ghế (A1..A5, B1..B5,... J1..J5) ---
    rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
    cols = range(1, 6) # 1-5
    seats = []
    for r_idx, row in enumerate(rows):
        for col in cols:
            seat_code = f"{row}{col}"
            s_type = 'vip' if r_idx >= 8 else 'standard' # 2 hàng cuối là VIP
            seats.append(Seat(room_id=new_room.id, seat_code=seat_code, type=s_type, price=0))
            
    db.session.add_all(seats)
    db.session.commit()
    
    return jsonify({"message": "Room created with 50 seats", "id": new_room.id}), 201

# 3. Xóa Phòng
@room_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_room(id):
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Denied"}), 403
    
    room = Room.query.get(id)
    if not room: return jsonify({"message": "Not found"}), 404
    
    try:
        # Xóa ghế trước
        Seat.query.filter_by(room_id=id).delete()
        db.session.delete(room)
        db.session.commit()
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500
    
# Thêm vào cuối file room_routes.py

@room_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_room(id):
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Denied"}), 403
    
    room = Room.query.get(id)
    if not room: return jsonify({"message": "Not found"}), 404
    
    data = request.get_json()
    if 'name' in data: room.name = data['name']
    
    # Không cho sửa cinema_id hay capacity vì ảnh hưởng đến ghế đã tạo
    
    db.session.commit()
    return jsonify({"message": "Room updated"}), 200