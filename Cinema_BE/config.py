# config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Lấy từng thành phần từ file .env
    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "princesama2005") # Fallback nếu quên chỉnh env
    host = os.getenv("DB_HOST", "localhost")
    database = os.getenv("DB_NAME", "moviedb1")

    # Ghép lại thành chuỗi kết nối hoàn chỉnh
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{user}:{password}@{host}/{database}?charset=utf8mb4"
    )
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretkey")