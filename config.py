class Config:
    SQLALCHEMY_DATABASE_URI = "sqlite:///electricCar.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = "electricCarSecretKey"