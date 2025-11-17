from flask_sqlalchemy import SQLAlchemy

# Khởi tạo đối tượng SQLAlchemy
db = SQLAlchemy()

# --- Các Bảng Chính ---

class Customer(db.Model):
    __tablename__ = 'CUSTOMER'
    CustID = db.Column(db.Integer, primary_key=True)
    Name = db.Column(db.String(255), nullable=False)
    Email = db.Column(db.String(255), unique=True)
    Phone = db.Column(db.String(20))
    # Cột lưu mật khẩu đã hash (BẮT BUỘC CHO LOGIN)
    password_hash = db.Column(db.String(128)) 
    
class Employee(db.Model):
    __tablename__ = 'EMPLOYEE'
    EmpID = db.Column(db.Integer, primary_key=True)
    Name = db.Column(db.String(255), nullable=False)
    Position = db.Column(db.String(255))
    Phone = db.Column(db.String(20))
    Email = db.Column(db.String(255), unique=True)
    password_hash = db.Column(db.String(128))
    TheaterID = db.Column(db.Integer, db.ForeignKey('THEATER.TheaterID')) 

class Movie(db.Model):
    __tablename__ = 'MOVIE'
    MovieID = db.Column(db.Integer, primary_key=True)
    Name = db.Column(db.String(255), nullable=False)
    Director = db.Column(db.String(255))
    Duration = db.Column(db.Integer)
    ReleaseDate = db.Column(db.Date)
    Description = db.Column(db.Text)

class Theater(db.Model):
    __tablename__ = 'THEATER'
    TheaterID = db.Column(db.Integer, primary_key=True)
    Name = db.Column(db.String(255), nullable=False)
    Address = db.Column(db.String(255))

class Screen(db.Model):
    __tablename__ = 'SCREEN'
    ScreenID = db.Column(db.Integer, primary_key=True)
    TheaterID = db.Column(db.Integer, db.ForeignKey('THEATER.TheaterID'), nullable=False)
    Name = db.Column(db.String(255), nullable=False)
    Capacity = db.Column(db.Integer)

class Showtime(db.Model):
    __tablename__ = 'SHOWTIME'
    ShowtimeID = db.Column(db.Integer, primary_key=True)
    MovieID = db.Column(db.Integer, db.ForeignKey('MOVIE.MovieID'), nullable=False)
    ScreenID = db.Column(db.Integer, db.ForeignKey('SCREEN.ScreenID'), nullable=False)
    StartTime = db.Column(db.DateTime, nullable=False)
    Price = db.Column(db.Numeric(10, 2))

class Seat(db.Model):
    __tablename__ = 'SEAT'
    SeatID = db.Column(db.Integer, primary_key=True)
    ScreenID = db.Column(db.Integer, db.ForeignKey('SCREEN.ScreenID'), nullable=False)
    RowLabel = db.Column(db.String(10))
    SeatNumber = db.Column(db.Integer)
    SeatType = db.Column(db.String(50)) # THUONG, VIP, DOI

# --- Các Bảng Quan Hệ và Giao dịch ---

class Booking(db.Model):
    __tablename__ = 'BOOKING'
    BookingID = db.Column(db.Integer, primary_key=True)
    CustID = db.Column(db.Integer, db.ForeignKey('CUSTOMER.CustID'), nullable=False)
    ShowtimeID = db.Column(db.Integer, db.ForeignKey('SHOWTIME.ShowtimeID'), nullable=False)
    BookingDate = db.Column(db.DateTime, default=db.func.now())
    PaymentMethod = db.Column(db.String(50))
    Status = db.Column(db.String(50)) # Confirmed, Cancelled
    TotalAmount = db.Column(db.Numeric(10, 2))

class Ticket(db.Model):
    __tablename__ = 'TICKET'
    TicketID = db.Column(db.Integer, primary_key=True)
    BookingID = db.Column(db.Integer, db.ForeignKey('BOOKING.BookingID'), nullable=False)
    SeatID = db.Column(db.Integer, db.ForeignKey('SEAT.SeatID'), nullable=False)
    ShowtimeID = db.Column(db.Integer, db.ForeignKey('SHOWTIME.ShowtimeID'), nullable=False)
    Price = db.Column(db.Numeric(10, 2))
    
    # Đảm bảo một ghế chỉ được đặt một lần trong một suất chiếu
    __table_args__ = (
        db.UniqueConstraint('ShowtimeID', 'SeatID', name='_showtime_seat_uc'),
    )

class Genre(db.Model):
    __tablename__ = 'GENRE'
    GenreID = db.Column(db.Integer, primary_key=True)
    Name = db.Column(db.String(255), nullable=False, unique=True)

class MovieGenre(db.Model):
    __tablename__ = 'MOVIE_GENRE'
    MovieID = db.Column(db.Integer, db.ForeignKey('MOVIE.MovieID'), primary_key=True)
    GenreID = db.Column(db.Integer, db.ForeignKey('GENRE.GenreID'), primary_key=True)