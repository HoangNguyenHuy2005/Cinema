from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Booking, Schedule, ScheduleSeat, Seat, Ticket, LOCK_TIMEOUT_MINUTES, User
from datetime import datetime, timedelta

booking_bp = Blueprint('booking', __name__)

LOCK_MINUTES = LOCK_TIMEOUT_MINUTES

def free_expired_locks(schedule_id=None):
    now = datetime.utcnow()
    q = ScheduleSeat.query.filter(ScheduleSeat.status == 'locked')
    if schedule_id:
        q = q.filter(ScheduleSeat.schedule_id == schedule_id)
    expired = q.filter(ScheduleSeat.locked_until != None, ScheduleSeat.locked_until < now).all()
    for ss in expired:
        ss.status = 'available'
        ss.locked_until = None
        ss.locked_by_booking_id = None
    if expired:
        db.session.commit()

@booking_bp.route('/showtimes/<int:sid>/seats', methods=['GET'])
def get_seats_for_showtime(sid):
    schedule = Schedule.query.get(sid)
    if not schedule:
        return jsonify({"message": "Showtime not found"}), 404
    free_expired_locks(schedule_id=sid)
    seats = []
    ss_list = ScheduleSeat.query.filter_by(schedule_id=sid).all()
    for ss in ss_list:
        s = ss.seat
        seats.append({
            "schedule_seat_id": ss.id,
            "seat_id": s.id,
            "seat_code": s.seat_code,
            "type": s.type,
            "price": s.price if s.type != 'vip' else (schedule.price_vip or s.price),
            "status": ss.status
        })
    return jsonify({"showtime_id": sid, "seats": seats})

@booking_bp.route('/', methods=['POST'])
@jwt_required()
def create_booking():
    identity = get_jwt_identity()
    user = identity if isinstance(identity, str) else identity.get("username")

    data = request.get_json()
    schedule_id = data.get("schedule_id")
    seat_codes = data.get("seat_codes", [])

    if not schedule_id or not seat_codes:
        return jsonify({"message": "schedule_id and seat_codes required"}), 400

    seat_codes.sort()

    schedule = Schedule.query.get(schedule_id)
    if not schedule:
        return jsonify({"message": "Showtime not found"}), 404

    free_expired_locks(schedule_id=schedule_id)

    seats = Seat.query.filter(Seat.room_id == schedule.room_id, Seat.seat_code.in_(seat_codes)).all()
    if len(seats) != len(seat_codes):
        return jsonify({"message": "One or more seats not found"}), 404

    ss_list = []
    total = 0
    
    for seat in seats:
        ss = ScheduleSeat.query.filter_by(schedule_id=schedule_id, seat_id=seat.id).with_for_update().first()
        if not ss:
            return jsonify({"message": f"Seat {seat.seat_code} not available for this showtime"}), 400
        if ss.status == 'booked':
            return jsonify({"message": f"Seat {seat.seat_code} already booked"}), 409
        if ss.status == 'locked' and ss.locked_until and ss.locked_until > datetime.utcnow():
            return jsonify({"message": f"Seat {seat.seat_code} currently locked"}), 409
        
        price = schedule.price_vip if seat.type == 'vip' and schedule.price_vip else (schedule.price_standard or seat.price)
        total += price
        ss_list.append((ss, seat, price))

    user_obj = User.query.filter_by(username=user).first()
    if not user_obj:
        return jsonify({"message": "User not found"}), 404

    booking = Booking(user_id=user_obj.id, schedule_id=schedule_id, total_price=total, status='pending')
    db.session.add(booking)
    db.session.flush()

    now = datetime.utcnow()
    lock_until = now + timedelta(minutes=LOCK_MINUTES)

    for ss, seat, price in ss_list:
        ss.status = 'locked'
        ss.locked_until = lock_until
        ss.locked_by_booking_id = booking.id
        db.session.add(ss)
        
        new_ticket = Ticket(booking_id=booking.id, seat_id=seat.id, price=price)
        db.session.add(new_ticket)

    db.session.commit()
    return jsonify({
        "message": "Booking created (pending)",
        "booking_id": booking.id, 
        "total_price": total,
        "lock_expires_in_minutes": LOCK_MINUTES
    }), 201

@booking_bp.route('/<int:booking_id>/confirm', methods=['POST'])
@jwt_required()
def confirm_booking(booking_id):
    identity = get_jwt_identity()
    user = identity if isinstance(identity, str) else identity.get("username")
    
    b = Booking.query.get(booking_id)
    if not b:
        return jsonify({"message": "Booking not found"}), 404
    
    user_obj = User.query.filter_by(username=user).first()
    if b.user_id != user_obj.id:
        return jsonify({"message": "Not your booking"}), 403
    if b.status != 'pending':
        return jsonify({"message": f"Cannot confirm booking with status {b.status}"}), 400

    free_expired_locks(schedule_id=b.schedule_id)

    ss_list = []
    for ticket in b.tickets:
        ss = ScheduleSeat.query.filter_by(schedule_id=b.schedule_id, seat_id=ticket.seat_id).first()
        if not ss:
            return jsonify({"message": f"Seat not available"}), 400
        if ss.status == 'booked':
            return jsonify({"message": f"Seat {ticket.seat.seat_code} already booked"}), 409
        if ss.status == 'locked' and ss.locked_by_booking_id != b.id:
            return jsonify({"message": f"Seat {ticket.seat.seat_code} locked by another booking"}), 409
        ss_list.append(ss)

    for ss in ss_list:
        ss.status = 'booked'
        ss.locked_until = None
        ss.locked_by_booking_id = None
        db.session.add(ss)

    b.status = 'paid'
    db.session.commit()
    return jsonify({"message": "Booking confirmed/paid", "booking_id": b.id})

@booking_bp.route('/<int:booking_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_booking(booking_id):
    identity = get_jwt_identity()
    claims = get_jwt()
    user = identity if isinstance(identity, str) else identity.get("username")
    
    b = Booking.query.get(booking_id)
    if not b:
        return jsonify({"message": "Booking not found"}), 404
    
    user_obj = User.query.filter_by(username=user).first()
    role = claims.get("role")
    
    if b.user_id != user_obj.id and role != "admin":
        return jsonify({"message": "Not allowed"}), 403

    for ticket in b.tickets:
        ss = ScheduleSeat.query.filter_by(schedule_id=b.schedule_id, seat_id=ticket.seat_id).first()
        if ss:
            ss.status = 'available'
            ss.locked_until = None
            ss.locked_by_booking_id = None
            db.session.add(ss)
    
    b.status = 'canceled'
    db.session.commit()
    return jsonify({"message": "Booking canceled"})

@booking_bp.route('/history', methods=['GET'])
@jwt_required()
def booking_history():
    identity = get_jwt_identity()
    # Xử lý identity (có thể là string username hoặc dict tùy config)
    username = identity if isinstance(identity, str) else identity.get("username")
    
    user_obj = User.query.filter_by(username=username).first()
    if not user_obj:
        return jsonify({"message": "User not found"}), 404
        
    # Lấy booking của user
    bookings = Booking.query.filter_by(user_id=user_obj.id).order_by(Booking.created_at.desc()).all()
    
    res = []
    for b in bookings:
        seat_codes = [t.seat.seat_code for t in b.tickets]
        
        # Lấy thông tin rạp/phòng từ schedule
        schedule = b.schedule
        room_name = schedule.room.name if schedule.room else "Unknown Room"
        cinema_name = schedule.room.cinema.name if (schedule.room and schedule.room.cinema) else "Unknown Cinema"
        
        res.append({
            "id": b.id,
            "movie_name": schedule.movie.name,
            "poster": schedule.movie.poster, # Thêm poster nếu muốn hiện ảnh
            "cinema_name": cinema_name,      # <--- Thêm cái này
            "room_name": room_name,          # <--- Thêm cái này
            "show_time": schedule.show_time.strftime("%H:%M %d/%m/%Y"),
            "seats": seat_codes,
            "total_price": b.total_price,
            "status": b.status,
            "created_at": b.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    return jsonify(res)

@booking_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_bookings():
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Denied"}), 403

    # Lấy tất cả booking, sắp xếp mới nhất
    bookings = Booking.query.order_by(Booking.created_at.desc()).all()
    
    res = []
    for b in bookings:
        seat_codes = [t.seat.seat_code for t in b.tickets]
        schedule = b.schedule
        
        # Xử lý null safety
        movie_name = schedule.movie.name if schedule.movie else "Deleted Movie"
        room_name = schedule.room.name if schedule.room else "Unknown Room"
        cinema_name = schedule.room.cinema.name if (schedule.room and schedule.room.cinema) else "Unknown Cinema"

        res.append({
            "id": b.id,
            "user_id": b.user_id,
            "username": b.user.username if b.user else "Deleted User",
            "movie_name": movie_name,
            "cinema_name": cinema_name,
            "room_name": room_name,
            "show_time": schedule.show_time.strftime("%H:%M %d/%m/%Y"),
            "seats": seat_codes,
            "total_price": b.total_price,
            "status": b.status,
            "created_at": b.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return jsonify(res)