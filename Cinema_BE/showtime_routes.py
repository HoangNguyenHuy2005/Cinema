from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Schedule, Movie, Room, ScheduleSeat, Cinema, Seat
from datetime import datetime

showtime_bp = Blueprint('showtime', __name__)

def parse_show_time(val):
    if not val: return None
    val = val.replace("T", " ")
    if len(val) > 16: val = val[:19]
    formats = ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"]
    for fmt in formats:
        try:
            return datetime.strptime(val, fmt)
        except ValueError:
            continue
    return None

@showtime_bp.route('', methods=['GET'])
def list_showtimes():
    try:
        query = db.session.query(Schedule, Movie, Room, Cinema)\
            .join(Movie, Schedule.movie_id == Movie.id)\
            .join(Room, Schedule.room_id == Room.id)\
            .join(Cinema, Room.cinema_id == Cinema.id)\
            .order_by(Schedule.show_time.desc())

        results = query.all()
        data = []
        for s, m, r, c in results:
            data.append({
                "id": s.id,
                "movie_id": m.id,           # Cần thiết để fill form sửa
                "movie_name": m.name,
                "movie_poster": m.poster,   # Cần thiết cho trang Lịch chiếu
                "cinema_id": c.id,
                "cinema_name": c.name,
                "room_id": r.id,            # Cần thiết để fill form sửa
                "room_name": r.name,
                "show_time": s.show_time.strftime("%Y-%m-%d %H:%M:%S"),
                "price_standard": s.price_standard,
                "price_vip": s.price_vip
            })
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@showtime_bp.route('', methods=['POST'])
@jwt_required()
def create_showtime():
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Denied"}), 403

    data = request.get_json()
    movie_id = data.get("movie_id")
    room_id = data.get("room_id")
    show_time = parse_show_time(data.get("show_time"))
    price = int(data.get("price", 75000))

    if not all([movie_id, room_id, show_time]):
        return jsonify({"message": "Thiếu thông tin bắt buộc"}), 400

    try:
        # 1. Tạo lịch
        new_schedule = Schedule(
            movie_id=movie_id, room_id=room_id, 
            show_time=show_time, 
            price_standard=price, 
            price_vip=price + 20000
        )
        db.session.add(new_schedule)
        db.session.flush() # Lấy ID

        # 2. Copy ghế từ Room sang ScheduleSeat
        base_seats = Seat.query.filter_by(room_id=room_id).all()
        if not base_seats:
             db.session.rollback()
             return jsonify({"message": "Phòng chiếu này chưa có ghế nào (Cần tạo phòng trước)!"}), 400

        for seat in base_seats:
            ss = ScheduleSeat(schedule_id=new_schedule.id, seat_id=seat.id, status='available')
            db.session.add(ss)
        
        db.session.commit()
        return jsonify({"message": "Tạo suất chiếu thành công", "id": new_schedule.id}), 201
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({"message": str(e)}), 500

@showtime_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_showtime(id):
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Denied"}), 403
    
    s = Schedule.query.get(id)
    if not s: return jsonify({"message": "Not found"}), 404
    
    data = request.get_json()
    try:
        if 'movie_id' in data: s.movie_id = data['movie_id']
        # Không cho sửa room_id vì phức tạp logic ghế
        
        if data.get('show_time'):
            st = parse_show_time(data.get('show_time'))
            if st: s.show_time = st
            
        if 'price' in data: # Frontend gửi lên là 'price'
            s.price_standard = int(data['price'])
            s.price_vip = s.price_standard + 20000
            
        db.session.commit()
        return jsonify({"message": "Cập nhật thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

@showtime_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_showtime(id):
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Denied"}), 403
    
    try:
        ScheduleSeat.query.filter_by(schedule_id=id).delete()
        Schedule.query.filter_by(id=id).delete()
        db.session.commit()
        return jsonify({"message": "Đã xóa"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500