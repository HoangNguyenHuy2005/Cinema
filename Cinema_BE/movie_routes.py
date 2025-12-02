from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Movie, Genre
from datetime import datetime

movie_bp = Blueprint('movie', __name__)

# --- Route MỚI: Lấy danh sách tất cả thể loại (cho dropdown) ---
@movie_bp.route('/genres', methods=['GET'])
def get_all_genres():
    try:
        genres = Genre.query.all()
        return jsonify([{"id": g.id, "name": g.name} for g in genres])
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@movie_bp.route('/genres', methods=['POST'])
@jwt_required()
def create_genre():
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Denied"}), 403

    data = request.get_json()
    name = data.get('name')
    if not name: return jsonify({"message": "Tên thể loại không được để trống"}), 400
# Kiểm tra trùng
    if Genre.query.filter_by(name=name).first():
        return jsonify({"message": "Thể loại này đã tồn tại"}), 409

    try:
        new_genre = Genre(name=name)
        db.session.add(new_genre)
        db.session.commit()
        return jsonify({"message": "Đã thêm thể loại", "id": new_genre.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

@movie_bp.route('/genres/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_genre(id):
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Denied"}), 403

    genre = Genre.query.get(id)
    if not genre: return jsonify({"message": "Not found"}), 404

    try:
        db.session.delete(genre)
        db.session.commit()
        return jsonify({"message": "Đã xóa thể loại"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Không thể xóa (đang được sử dụng bởi phim khác)"}), 400

# 1. Lấy danh sách phim (Kèm theo thể loại)
@movie_bp.route('', methods=['GET'])
def get_movies():
    try:
        movies = Movie.query.order_by(Movie.release_date.desc()).all()
        return jsonify([{
            "id": m.id,
            "name": m.name,
            "director": m.director,
            "casts": m.casts,
            "duration": m.duration,
            "release_date": m.release_date.strftime('%Y-%m-%d') if m.release_date else None,
            "description": m.description,
            "poster": m.poster,
            "trailer": m.trailer,
            "status": m.status,
            # Trả về danh sách ID thể loại và Tên để hiển thị
            "genres": [{"id": g.id, "name": g.name} for g in m.genres] 
        } for m in movies]), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Internal Server Error"}), 500

# 2. Thêm phim mới (Xử lý Genre)
@movie_bp.route('', methods=['POST'])
@jwt_required()
def create_movie():
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Denied"}), 403

    data = request.get_json()
    if not data.get('name'): return jsonify({"message": "Name required"}), 400

    try:
        r_date = None
        if data.get('release_date'):
            r_date = datetime.strptime(data['release_date'], '%Y-%m-%d').date()

        new_movie = Movie(
            name=data.get('name'),
            director=data.get('director'),
            casts=data.get('casts'),
            duration=data.get('duration'),
            release_date=r_date,
            description=data.get('description'),
            poster=data.get('poster'),
            trailer=data.get('trailer'),
            status='showing'
        )

        # --- Xử lý Genre (Mới) ---
        genre_ids = data.get('genre_ids', []) # Frontend gửi lên mảng [1, 2]
        if genre_ids:
            # Tìm các object Genre trong DB và gán vào phim
            genres = Genre.query.filter(Genre.id.in_(genre_ids)).all()
            new_movie.genres = genres

        db.session.add(new_movie)
        db.session.commit()
        return jsonify({"message": "Movie added", "id": new_movie.id}), 201
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({"message": str(e)}), 500

# 3. Sửa phim (Xử lý Genre)
@movie_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_movie(id):
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Denied"}), 403

    movie = Movie.query.get(id)
    if not movie: return jsonify({"message": "Not found"}), 404

    data = request.get_json()
    try:
        if 'name' in data: movie.name = data['name']
        if 'director' in data: movie.director = data['director']
        if 'casts' in data: movie.casts = data['casts']
        if 'duration' in data: movie.duration = data['duration']
        if 'description' in data: movie.description = data['description']
        if 'poster' in data: movie.poster = data['poster']
        if 'trailer' in data: movie.trailer = data['trailer']
        if 'status' in data: movie.status = data['status']
        if 'release_date' in data and data['release_date']:
            movie.release_date = datetime.strptime(data['release_date'], '%Y-%m-%d').date()

        # --- Update Genre (Mới) ---
        if 'genre_ids' in data:
            genre_ids = data['genre_ids']
            # Clear cũ và thêm mới
            genres = Genre.query.filter(Genre.id.in_(genre_ids)).all()
            movie.genres = genres

        db.session.commit()
        return jsonify({"message": "Updated"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

# 4. Xóa phim
@movie_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_movie(id):
    claims = get_jwt()
    if claims.get("role") != "admin": return jsonify({"message": "Denied"}), 403
    
    movie = Movie.query.get(id)
    if not movie: return jsonify({"message": "Not found"}), 404
    try:
        # SQLAlchemy sẽ tự xóa trong bảng trung gian movie_genre
        db.session.delete(movie)
        db.session.commit()
        return jsonify({"message": "Deleted"}), 200
    except:
        return jsonify({"message": "Cannot delete"}), 400

# 5. Lấy lịch chiếu theo phim - MỚI (cho Frontend hiển thị)
@movie_bp.route('/<int:id>/schedules', methods=['GET'])
def get_movie_schedules(id):
    # Query join các bảng để lấy tên rạp, tên phòng
    schedules = db.session.query(Schedule, Room, Cinema)\
        .join(Room, Schedule.room_id == Room.id)\
        .join(Cinema, Room.cinema_id == Cinema.id)\
        .filter(Schedule.movie_id == id)\
        .filter(Schedule.show_time >= datetime.now())\
        .order_by(Schedule.show_time).all()

    res = []
    for sch, room, cinema in schedules:
        res.append({
            "id": sch.id,
            "show_time": sch.show_time.strftime('%Y-%m-%d %H:%M:%S'),
            "price": sch.price_standard,
            "room": {
                "id": room.id,
                "name": room.name
            },
            "cinema": {
                "id": cinema.id,
                "name": cinema.name,
                "address": cinema.address
            }
        })
    return jsonify(res)

