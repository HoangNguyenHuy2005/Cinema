import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # --- Cấu hình Database MySQL ---
    # ĐÃ SỬA TÊN DATABASE TỪ 'cinema_db' SANG 'movieDB' để khớp với DB của bạn.
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", 
        "mysql+pymysql://root:Huy20055555@localhost:3306/movieDB"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Khóa bí mật cho Flask (dùng cho Session, Security)
    SECRET_KEY = os.getenv("SECRET_KEY", "cinema_secret_key")

    # Mức độ mã hóa cho mật khẩu
    SECURITY_PASSWORD_SALT = os.getenv("SECURITY_PASSWORD_SALT", "default_salt")

    # Số lần lặp để mã hóa mật khẩu
    PASSWORD_HASH_ITERATIONS = 150000