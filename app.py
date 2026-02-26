from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from sqlalchemy import func, text
from flask_migrate import Migrate
from datetime import datetime
import csv
import os
import pandas as pd
from ml_models import get_analytics, get_predictor, get_comparison

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///electricCar.db"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = "electricCarSecretKey"

# Enable CORS for Next.js frontend
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
migrate = Migrate(app, db)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default="driver", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        """Hash and set password"""
        self.password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        """Check if password matches the hash"""
        return bcrypt.check_password_hash(self.password, password)

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        """Hash and set password"""
        self.password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        """Check if password matches the hash"""
        return bcrypt.check_password_hash(self.password, password)

class Car(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    driver_id = db.Column(db.String(50), nullable=False)
    car_id = db.Column(db.String(50), unique=True, nullable=False)
    driver_name = db.Column(db.String(100), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    vehicle_type = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default="assigned", nullable=False)
    vehicle_age = db.Column(db.Integer, nullable=False)
    trips_per_month = db.Column(db.Integer, nullable=False)
    battery_health = db.Column(db.Float, nullable=False)
    charge_per_km = db.Column(db.Float, nullable=False)
    garage_cost = db.Column(db.Float, nullable=False)
    charging_cost = db.Column(db.Float, nullable=False)
    maintenance_cost = db.Column(db.Float, nullable=False)
    total_operating_cost = db.Column(db.Float, nullable=False)
    gross_revenue = db.Column(db.Float, nullable=False)
    driver_charge = db.Column(db.Float, nullable=False)
    overspeed_count = db.Column(db.Integer, nullable=False)
    max_speed = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Function to load car data from Excel
def load_car_data():
    excel_file = os.path.join(os.getcwd(), 'final_dataset_for_electiccar 2.xlsx')
    if not os.path.exists(excel_file):
        print("Excel file not found!")
        return
    
    # Check if data already loaded
    if Car.query.first():
        print("Car data already loaded")
        return
    
    # Read Excel file
    df = pd.read_excel(excel_file)
    for index, row in df.iterrows():
        car = Car(
            driver_id=str(row['driver id']),
            car_id=str(row['car id']),
            driver_name=str(row['drive name']),
            city=str(row['city']),
            vehicle_type=str(row['vechicle type']),
            vehicle_age=int(row['vechicle age']),
            trips_per_month=int(row['total km driven'] / 100) if row['total km driven'] > 0 else 20,  # Estimated from km driven
            battery_health=float(row['current charge percentage']),
            charge_per_km=float(row['average energy per km kwh']),
            garage_cost=0.0,  # Not available in new dataset
            charging_cost=float(row['charging cost']),
            maintenance_cost=float(row['total maintanace cost']),
            total_operating_cost=float(row['charging cost']) + float(row['total maintanace cost']),
            gross_revenue=float(row['gross revenue']),
            driver_charge=float(row['driver earnings']),
            overspeed_count=0,  # Not available in new dataset
            max_speed=int(row['max speed'])
        )
        db.session.add(car)
    db.session.commit()
    print("Car data loaded successfully from Excel!")

def ensure_car_columns():
    with db.engine.begin() as conn:
        columns = [row[1] for row in conn.execute(text("PRAGMA table_info(car)"))]
        if "status" not in columns:
            conn.execute(text("ALTER TABLE car ADD COLUMN status VARCHAR(20) DEFAULT 'assigned'"))
        conn.execute(text("UPDATE car SET status='assigned' WHERE status IS NULL"))

# Initialize database function
def init_db():
    """Initialize database with tables and default data"""
    db.create_all()

    ensure_car_columns()
    
    # Check if admin exists
    admin = Admin.query.filter_by(username="admin").first()
    if not admin:
        default_admin = Admin(
            username="admin",
            email="kalaiguhan98@gmail.com",
            phone="9659119914"
        )
        default_admin.set_password("admin@123")
        db.session.add(default_admin)
        db.session.commit()
        print("Default admin created successfully!")
    
    # Load car data from CSV
    load_car_data()

# Create tables and add default admin
with app.app_context():
    init_db()

# Initialize DB before first request
@app.before_request
def before_first_request():
    """Ensure database is initialized before handling requests"""
    with app.app_context():
        db.create_all()
        ensure_car_columns()

def _next_prefixed_id(prefix, width, last_id):
    if not last_id:
        next_num = 1
    else:
        try:
            next_num = int(last_id[len(prefix):]) + 1
        except ValueError:
            next_num = 1
    return f"{prefix}{next_num:0{width}d}"

def get_next_driver_id():
    max_num = db.session.query(
        func.max(func.cast(func.substr(Car.driver_id, 2), db.Integer))
    ).filter(Car.driver_id.like("D%"))
    max_num = max_num.scalar()
    next_num = (max_num or 0) + 1
    return f"D{next_num:04d}"

def get_next_car_id():
    max_num = db.session.query(
        func.max(func.cast(func.substr(Car.car_id, 4), db.Integer))
    ).filter(Car.car_id.like("CAR%"))
    max_num = max_num.scalar()
    next_num = (max_num or 0) + 1
    return f"CAR{next_num:04d}"

def find_available_car():
    return Car.query.filter_by(status="available").order_by(func.random()).first()

def get_car_field_averages():
    averages = db.session.query(
        func.avg(Car.vehicle_age),
        func.avg(Car.trips_per_month),
        func.avg(Car.battery_health),
        func.avg(Car.charge_per_km),
        func.avg(Car.garage_cost),
        func.avg(Car.charging_cost),
        func.avg(Car.maintenance_cost),
        func.avg(Car.total_operating_cost),
        func.avg(Car.gross_revenue),
        func.avg(Car.driver_charge),
        func.avg(Car.overspeed_count),
        func.avg(Car.max_speed)
    ).first()

    return {
        "vehicle_age": int(round(averages[0] or 0)),
        "trips_per_month": int(round(averages[1] or 0)),
        "battery_health": float(averages[2] or 0.0),
        "charge_per_km": float(averages[3] or 0.0),
        "garage_cost": float(averages[4] or 0.0),
        "charging_cost": float(averages[5] or 0.0),
        "maintenance_cost": float(averages[6] or 0.0),
        "total_operating_cost": float(averages[7] or 0.0),
        "gross_revenue": float(averages[8] or 0.0),
        "driver_charge": float(averages[9] or 0.0),
        "overspeed_count": int(round(averages[10] or 0)),
        "max_speed": int(round(averages[11] or 0)),
    }

# Home route
@app.route("/")
def home():
    return render_template("home.html")

# Register route - Driver only
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip()
        phone = request.form.get("phone", "").strip()
        password = request.form.get("password", "").strip()
        driver_name = request.form.get("driver_name", "").strip() or username
        city = request.form.get("city", "").strip()
        vehicle_type = request.form.get("vehicle_type", "").strip() or "Unknown"

        if not username or not email or not phone or not password or not city:
            return render_template("register.html", error="All fields are required!")

        if User.query.filter_by(username=username).first():
            return render_template("register.html", error="Username already exists!")

        if User.query.filter_by(email=email).first():
            return render_template("register.html", error="Email already exists!")

        new_user = User(username=username, email=email, phone=phone, role="driver")
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        available_car = find_available_car()
        if available_car:
            available_car.driver_id = get_next_driver_id()
            available_car.driver_name = driver_name
            available_car.city = city
            available_car.status = "assigned"
            db.session.commit()
        else:
            defaults = get_car_field_averages()
            total_operating_cost = defaults["total_operating_cost"]
            if total_operating_cost == 0.0:
                total_operating_cost = defaults["garage_cost"] + defaults["charging_cost"] + defaults["maintenance_cost"]

            new_car = Car(
                driver_id=get_next_driver_id(),
                car_id=get_next_car_id(),
                driver_name=driver_name,
                city=city,
                vehicle_type=vehicle_type,
                status="assigned",
                vehicle_age=defaults["vehicle_age"],
                trips_per_month=defaults["trips_per_month"],
                battery_health=defaults["battery_health"],
                charge_per_km=defaults["charge_per_km"],
                garage_cost=defaults["garage_cost"],
                charging_cost=defaults["charging_cost"],
                maintenance_cost=defaults["maintenance_cost"],
                total_operating_cost=total_operating_cost,
                gross_revenue=defaults["gross_revenue"],
                driver_charge=defaults["driver_charge"],
                overspeed_count=defaults["overspeed_count"],
                max_speed=defaults["max_speed"]
            )
            db.session.add(new_car)
            db.session.commit()
        return redirect(url_for("login_driver"))

    return render_template("register.html")

# Admin Registration route
@app.route("/register/admin", methods=["GET", "POST"])
def register_admin():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip()
        phone = request.form.get("phone", "").strip()
        password = request.form.get("password", "").strip()
        existing_admin_password = request.form.get("existing_admin_password", "").strip()

        if not username or not email or not phone or not password or not existing_admin_password:
            return render_template("register_admin.html", error="All fields are required!")

        # Check if the provided password matches any existing admin
        existing_admin = None
        for admin in Admin.query.all():
            if admin.check_password(existing_admin_password):
                existing_admin = admin
                break
        if not existing_admin:
            return render_template("register_admin.html", error="Invalid admin password! You need an existing admin's password to register.")

        if Admin.query.filter_by(username=username).first():
            return render_template("register_admin.html", error="Admin username already exists!")

        if Admin.query.filter_by(email=email).first():
            return render_template("register_admin.html", error="Email already exists!")

        new_admin = Admin(username=username, email=email, phone=phone, password=password)
        db.session.add(new_admin)
        db.session.commit()
        return redirect(url_for("login_admin"))

    return render_template("register_admin.html")

# Driver Login
@app.route("/login/driver", methods=["GET", "POST"])
def login_driver():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()

        if not username or not password:
            flash("Please enter both username and password", "error")
            return render_template("login_driver.html", error="Please enter both username and password")

        user = User.query.filter_by(username=username, role="driver").first()
        if user and user.check_password(password):
            session.clear()
            session["username"] = user.username
            session["role"] = "driver"
            session["user_id"] = user.id
            return redirect(url_for("driver_dashboard"))
        else:
            return render_template("login_driver.html", error="Invalid username or password! Please try again.")

    return render_template("login_driver.html")

# Admin Login
@app.route("/login/admin", methods=["GET", "POST"])
def login_admin():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()

        if not username or not password:
            return render_template("login_admin.html", error="Please enter both username and password")

        admin = Admin.query.filter_by(username=username).first()
        if admin and admin.check_password(password):
            session.clear()
            session["username"] = admin.username
            session["role"] = "admin"
            session["user_id"] = admin.id
            return redirect(url_for("admin_dashboard"))
        else:
            return render_template("login_admin.html", error="Invalid admin credentials! Please try again.")

    return render_template("login_admin.html")

# Login Choice page
@app.route("/login")
def login():
    return render_template("login_choice.html")

# Driver Dashboard
@app.route("/driver/dashboard")
def driver_dashboard():
    if "username" in session and session["role"] == "driver":
        return render_template("driver_dashboard.html", username=session['username'])
    else:
        return redirect(url_for("login"))

# Admin Dashboard
@app.route("/admin/dashboard")
def admin_dashboard():
    if "username" in session and session["role"] == "admin":
        # Get distinct drivers from cars table
        drivers = db.session.query(Car.driver_id, Car.driver_name, Car.city).filter(Car.status == "assigned").distinct().limit(50).all()
        driver_count = db.session.query(Car.driver_id).filter(Car.status == "assigned").distinct().count()
        # Get only first 50 cars for display (not all 25,000)
        cars = Car.query.limit(50).all()
        total_cars = Car.query.count()
        available_cars = Car.query.filter_by(status="available").count()
        return render_template("admin_dashboard.html", 
                             username=session['username'],
                             drivers=drivers,
                             driver_count=driver_count,
                             cars=cars,
                             total_cars=total_cars,
                             available_cars=available_cars)
    else:
        return redirect(url_for("login"))

# Add car (admin only)
@app.route("/admin/cars/new", methods=["GET", "POST"])
def add_car():
    if "username" not in session or session["role"] != "admin":
        return redirect(url_for("login"))

    if request.method == "POST":
        def parse_int(field, default=0):
            value = request.form.get(field, "").strip()
            if value == "":
                return default
            return int(value)

        def parse_float(field, default=0.0):
            value = request.form.get(field, "").strip()
            if value == "":
                return default
            return float(value)

        driver_name = request.form.get("driver_name", "").strip()
        city = request.form.get("city", "").strip()
        vehicle_type = request.form.get("vehicle_type", "").strip()

        try:
            vehicle_age = parse_int("vehicle_age", 0)
            trips_per_month = parse_int("trips_per_month", 0)
            battery_health = parse_float("battery_health", 0.0)
            charge_per_km = parse_float("charge_per_km", 0.0)
            garage_cost = parse_float("garage_cost", 0.0)
            charging_cost = parse_float("charging_cost", 0.0)
            maintenance_cost = parse_float("maintenance_cost", 0.0)
            total_operating_cost = parse_float("total_operating_cost", 0.0)
            gross_revenue = parse_float("gross_revenue", 0.0)
            driver_charge = parse_float("driver_charge", 0.0)
            overspeed_count = parse_int("overspeed_count", 0)
            max_speed = parse_int("max_speed", 0)
        except ValueError:
            return render_template("admin_car_form.html", mode="add", error="Please enter valid numeric values.")

        if not driver_name or not city or not vehicle_type:
            return render_template("admin_car_form.html", mode="add", error="Driver name, city, and vehicle type are required.")

        if total_operating_cost == 0.0:
            total_operating_cost = garage_cost + charging_cost + maintenance_cost

        new_car = Car(
            driver_id=get_next_driver_id(),
            car_id=get_next_car_id(),
            driver_name=driver_name,
            city=city,
            vehicle_type=vehicle_type,
            status="assigned",
            vehicle_age=vehicle_age,
            trips_per_month=trips_per_month,
            battery_health=battery_health,
            charge_per_km=charge_per_km,
            garage_cost=garage_cost,
            charging_cost=charging_cost,
            maintenance_cost=maintenance_cost,
            total_operating_cost=total_operating_cost,
            gross_revenue=gross_revenue,
            driver_charge=driver_charge,
            overspeed_count=overspeed_count,
            max_speed=max_speed
        )
        db.session.add(new_car)
        db.session.commit()
        return redirect(url_for("admin_dashboard"))

    return render_template("admin_car_form.html", mode="add")

# Edit car (admin only)
@app.route("/admin/cars/<car_id>/edit", methods=["GET", "POST"])
def edit_car(car_id):
    if "username" not in session or session["role"] != "admin":
        return redirect(url_for("login"))

    car = Car.query.filter_by(car_id=car_id).first()
    if not car:
        return "Car not found!"

    if request.method == "POST":
        car.driver_name = request.form.get("driver_name", "").strip()
        car.city = request.form.get("city", "").strip()
        car.vehicle_type = request.form.get("vehicle_type", "").strip()

        try:
            car.vehicle_age = int(request.form.get("vehicle_age", "0"))
            car.trips_per_month = int(request.form.get("trips_per_month", "0"))
            car.battery_health = float(request.form.get("battery_health", "0"))
            car.charge_per_km = float(request.form.get("charge_per_km", "0"))
            car.garage_cost = float(request.form.get("garage_cost", "0"))
            car.charging_cost = float(request.form.get("charging_cost", "0"))
            car.maintenance_cost = float(request.form.get("maintenance_cost", "0"))
            car.total_operating_cost = float(request.form.get("total_operating_cost", "0"))
            car.gross_revenue = float(request.form.get("gross_revenue", "0"))
            car.driver_charge = float(request.form.get("driver_charge", "0"))
            car.overspeed_count = int(request.form.get("overspeed_count", "0"))
            car.max_speed = int(request.form.get("max_speed", "0"))
        except ValueError:
            return render_template("admin_car_form.html", mode="edit", car=car, error="Please enter valid numeric values.")

        if not car.driver_name or not car.city or not car.vehicle_type:
            return render_template("admin_car_form.html", mode="edit", car=car, error="Driver name, city, and vehicle type are required.")

        db.session.commit()
        return redirect(url_for("admin_dashboard"))

    return render_template("admin_car_form.html", mode="edit", car=car)

# Delete car (admin only)
@app.route("/admin/cars/<car_id>/delete", methods=["POST"])
def delete_car(car_id):
    if "username" not in session or session["role"] != "admin":
        return redirect(url_for("login"))

    car = Car.query.filter_by(car_id=car_id).first()
    if not car:
        return "Car not found!"

    db.session.delete(car)
    db.session.commit()
    return redirect(url_for("admin_dashboard"))

# Release car (admin only)
@app.route("/admin/cars/<car_id>/release", methods=["POST"])
def release_car(car_id):
    if "username" not in session or session["role"] != "admin":
        return redirect(url_for("login"))

    car = Car.query.filter_by(car_id=car_id).first()
    if not car:
        return "Car not found!"

    car.status = "available"
    car.driver_id = "UNASSIGNED"
    car.driver_name = "Unassigned"
    car.city = "Unassigned"
    db.session.commit()
    return redirect(url_for("admin_dashboard"))

# Release all cars for a driver (admin only)
@app.route("/admin/driver/<driver_id>/release", methods=["POST"])
def release_driver_cars(driver_id):
    if "username" not in session or session["role"] != "admin":
        return redirect(url_for("login"))

    cars = Car.query.filter_by(driver_id=driver_id).all()
    for car in cars:
        car.status = "available"
        car.driver_id = "UNASSIGNED"
        car.driver_name = "Unassigned"
        car.city = "Unassigned"
    db.session.commit()
    return redirect(url_for("admin_dashboard"))

# Search functionality
@app.route("/admin/search", methods=["GET", "POST"])
def admin_search():
    if "username" not in session or session["role"] != "admin":
        return redirect(url_for("login"))
    
    if request.method == "POST":
        search_type = request.form.get("search_type")
        search_value = request.form.get("search_value", "").strip()
        
        if not search_value:
            return render_template("admin_search.html", error="Please enter a search value")
        
        results = []
        if search_type == "driver_id":
            results = Car.query.filter(Car.driver_id.like(f"%{search_value}%")).all()
        elif search_type == "car_id":
            results = Car.query.filter(Car.car_id.like(f"%{search_value}%")).all()
        elif search_type == "driver_name":
            results = Car.query.filter(Car.driver_name.like(f"%{search_value}%")).all()
        
        return render_template("admin_search.html", 
                             results=results, 
                             search_type=search_type, 
                             search_value=search_value)
    
    return render_template("admin_search.html")

# View specific car details
@app.route("/admin/car/<car_id>")
def view_car_details(car_id):
    if "username" not in session or session["role"] != "admin":
        return redirect(url_for("login"))
    
    car = Car.query.filter_by(car_id=car_id).first()
    if not car:
        return "Car not found!"
    
    return render_template("car_details.html", car=car)

# View all admins (admin only)
@app.route("/admin/admins")
def view_admins():
    if "username" not in session or session["role"] != "admin":
        return redirect(url_for("login"))
    
    admins = Admin.query.all()
    return render_template("admin_list.html", admins=admins)

# Logout
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))

# ============ API ENDPOINTS FOR NEXT.JS FRONTEND ============

@app.route("/api/auth/login/driver", methods=["POST"])
def api_login_driver():
    """Driver login API endpoint"""
    try:
        data = request.get_json()
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400
        
        user = User.query.filter_by(username=username, role="driver").first()
        if user and user.check_password(password):
            session.clear()
            session["username"] = user.username
            session["role"] = "driver"
            session["user_id"] = user.id
            
            return jsonify({
                "success": True,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": "driver"
                }
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/login/admin", methods=["POST"])
def api_login_admin():
    """Admin login API endpoint"""
    try:
        data = request.get_json()
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400
        
        admin = Admin.query.filter_by(username=username).first()
        if admin and admin.check_password(password):
            session.clear()
            session["username"] = admin.username
            session["role"] = "admin"
            session["user_id"] = admin.id
            
            return jsonify({
                "success": True,
                "user": {
                    "id": admin.id,
                    "username": admin.username,
                    "email": admin.email,
                    "role": "admin"
                }
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/register/driver", methods=["POST"])
def api_register_driver():
    """Driver registration API endpoint"""
    try:
        data = request.get_json()
        username = data.get("username", "").strip()
        email = data.get("email", "").strip()
        phone = data.get("phone", "").strip()
        password = data.get("password", "").strip()
        driver_name = data.get("driver_name", "").strip() or username
        city = data.get("city", "").strip()
        vehicle_type = data.get("vehicle_type", "").strip() or "Unknown"
        
        if not username or not email or not phone or not password or not city:
            return jsonify({"error": "All fields are required"}), 400
        
        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username already exists"}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 400
        
        new_user = User(username=username, email=email, phone=phone, role="driver")
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        available_car = find_available_car()
        if available_car:
            available_car.driver_id = get_next_driver_id()
            available_car.driver_name = driver_name
            available_car.city = city
            available_car.status = "assigned"
            db.session.commit()
        else:
            defaults = get_car_field_averages()
            total_operating_cost = defaults["total_operating_cost"]
            if total_operating_cost == 0.0:
                total_operating_cost = defaults["garage_cost"] + defaults["charging_cost"] + defaults["maintenance_cost"]

            new_car = Car(
                driver_id=get_next_driver_id(),
                car_id=get_next_car_id(),
                driver_name=driver_name,
                city=city,
                vehicle_type=vehicle_type,
                status="assigned",
                vehicle_age=defaults["vehicle_age"],
                trips_per_month=defaults["trips_per_month"],
                battery_health=defaults["battery_health"],
                charge_per_km=defaults["charge_per_km"],
                garage_cost=defaults["garage_cost"],
                charging_cost=defaults["charging_cost"],
                maintenance_cost=defaults["maintenance_cost"],
                total_operating_cost=total_operating_cost,
                gross_revenue=defaults["gross_revenue"],
                driver_charge=defaults["driver_charge"],
                overspeed_count=defaults["overspeed_count"],
                max_speed=defaults["max_speed"]
            )
            db.session.add(new_car)
            db.session.commit()
        
        return jsonify({"success": True, "message": "Registration successful"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/register/admin", methods=["POST"])
def api_register_admin():
    """Admin registration API endpoint - requires existing admin password"""
    try:
        data = request.get_json()
        username = data.get("username", "").strip()
        email = data.get("email", "").strip()
        phone = data.get("phone", "").strip()
        password = data.get("password", "").strip()
        existing_admin_password = data.get("existing_admin_password", "").strip()
        
        if not username or not email or not phone or not password or not existing_admin_password:
            return jsonify({"error": "All fields are required"}), 400
        
        # Check if the provided password matches any existing admin
        existing_admin = None
        for admin in Admin.query.all():
            if admin.check_password(existing_admin_password):
                existing_admin = admin
                break
        if not existing_admin:
            return jsonify({"error": "Invalid admin password! You need an existing admin's password to register."}), 401
        
        if Admin.query.filter_by(username=username).first():
            return jsonify({"error": "Admin username already exists"}), 400
        
        if Admin.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 400
        
        new_admin = Admin(username=username, email=email, phone=phone)
        new_admin.set_password(password)
        db.session.add(new_admin)
        db.session.commit()
        
        return jsonify({"success": True, "message": "Admin registration successful"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/logout", methods=["POST"])
def api_logout():
    """Logout API endpoint"""
    session.clear()
    return jsonify({"success": True}), 200

@app.route("/api/auth/session", methods=["GET"])
def api_get_session():
    """Get current session info"""
    if "username" in session:
        return jsonify({
            "authenticated": True,
            "user": {
                "username": session["username"],
                "role": session["role"],
                "user_id": session["user_id"]
            }
        }), 200
    else:
        return jsonify({"authenticated": False}), 200

@app.route("/api/vehicles", methods=["GET"])
def api_get_vehicles():
    """Get all vehicles with their details"""
    try:
        cars = Car.query.filter_by(status="assigned").limit(50).all()
        vehicles_list = []
        
        for car in cars:
            vehicles_list.append({
                "id": car.car_id,
                "model": car.vehicle_type,
                "plateNumber": car.car_id,
                "driverName": car.driver_name,
                "city": car.city,
                "batteryHealth": car.battery_health,
                "chargePerKm": car.charge_per_km,
                "currentChargePercent": min(100, max(0, car.battery_health)),
                "status": "Running" if car.battery_health > 70 else "Charging" if car.battery_health > 40 else "Idle",
                "vehicleAge": car.vehicle_age,
                "tripsPerMonth": car.trips_per_month,
                "maxSpeed": car.max_speed,
                "overspeedCount": car.overspeed_count
            })
        
        return jsonify(vehicles_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/financials", methods=["GET"])
def api_get_financials():
    """Get monthly financial data aggregated from all cars"""
    try:
        # Get aggregate data from all cars
        total_revenue = db.session.query(func.sum(Car.gross_revenue)).scalar() or 0
        total_garage_cost = db.session.query(func.sum(Car.garage_cost)).scalar() or 0
        total_charging_cost = db.session.query(func.sum(Car.charging_cost)).scalar() or 0
        total_maintenance_cost = db.session.query(func.sum(Car.maintenance_cost)).scalar() or 0
        
        # Generate monthly trend data (simulated for last 6 months)
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        monthly_data = []
        
        for i, month in enumerate(months):
            # Simulate some variation in monthly data
            variation = 0.8 + (i * 0.04)
            monthly_data.append({
                "month": month,
                "revenue": round(total_revenue * variation / 6, 2),
                "runningCost": round(total_garage_cost * variation / 6, 2),
                "chargingCost": round(total_charging_cost * variation / 6, 2),
                "maintenanceCost": round(total_maintenance_cost * variation / 6, 2)
            })
        
        return jsonify(monthly_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/driver/status", methods=["GET"])
def api_get_driver_status():
    """Get driver status for the first available car"""
    try:
        car = Car.query.filter_by(status="assigned").first()
        if not car:
            return jsonify({"error": "No car found"}), 404
        
        # Calculate remaining distance based on battery health and efficiency
        remaining_distance = round(car.battery_health * car.charge_per_km * 10, 2)
        # Estimate remaining time (assuming average speed of 50 km/h)
        remaining_time = round(remaining_distance / 50 * 60, 0)  # in minutes
        
        driver_status = {
            "chargePercent": round(car.battery_health, 0),
            "remainingTimeMinutes": int(remaining_time),
            "remainingDistanceKm": round(remaining_distance, 0),
            "vehicleInfo": {
                "model": car.vehicle_type,
                "plateNumber": car.car_id,
                "driverName": car.driver_name
            }
        }
        
        return jsonify(driver_status), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/dashboard/stats", methods=["GET"])
def api_get_dashboard_stats():
    """Get overall dashboard statistics"""
    try:
        total_cars = Car.query.count()
        assigned_cars = Car.query.filter_by(status="assigned").count()
        available_cars = Car.query.filter_by(status="available").count()
        
        total_revenue = db.session.query(func.sum(Car.gross_revenue)).scalar() or 0
        total_costs = db.session.query(
            func.sum(Car.garage_cost + Car.charging_cost + Car.maintenance_cost)
        ).scalar() or 0
        
        avg_battery = db.session.query(func.avg(Car.battery_health)).scalar() or 0
        
        stats = {
            "totalCars": total_cars,
            "assignedCars": assigned_cars,
            "availableCars": available_cars,
            "totalRevenue": round(total_revenue, 2),
            "totalCosts": round(total_costs, 2),
            "netProfit": round(total_revenue - total_costs, 2),
            "avgBatteryHealth": round(avg_battery, 2)
        }
        
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/search", methods=["GET"])
def api_admin_search():
    """Search for cars by driver ID, car ID, or driver name"""
    try:
        search_type = request.args.get("type", "").strip()
        search_value = request.args.get("value", "").strip()
        
        if not search_type or not search_value:
            return jsonify({"error": "Search type and value are required"}), 400
        
        results = []
        if search_type == "driver_id":
            cars = Car.query.filter(Car.driver_id.like(f"%{search_value}%")).all()
        elif search_type == "car_id":
            cars = Car.query.filter(Car.car_id.like(f"%{search_value}%")).all()
        elif search_type == "driver_name":
            cars = Car.query.filter(Car.driver_name.like(f"%{search_value}%")).all()
        elif search_type == "city":
            cars = Car.query.filter(Car.city.like(f"%{search_value}%")).all()
        else:
            return jsonify({"error": "Invalid search type"}), 400
        
        for car in cars:
            results.append({
                "id": car.id,
                "driver_id": car.driver_id,
                "car_id": car.car_id,
                "driver_name": car.driver_name,
                "city": car.city,
                "vehicle_type": car.vehicle_type,
                "status": car.status,
                "vehicle_age": car.vehicle_age,
                "trips_per_month": car.trips_per_month,
                "battery_health": car.battery_health,
                "charge_per_km": car.charge_per_km,
                "garage_cost": car.garage_cost,
                "charging_cost": car.charging_cost,
                "maintenance_cost": car.maintenance_cost,
                "total_operating_cost": car.total_operating_cost,
                "gross_revenue": car.gross_revenue,
                "driver_charge": car.driver_charge,
                "overspeed_count": car.overspeed_count,
                "max_speed": car.max_speed
            })
        
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/cars", methods=["GET"])
def api_admin_get_all_cars():
    """Get all cars with pagination"""
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        
        pagination = Car.query.paginate(page=page, per_page=per_page, error_out=False)
        cars = []
        
        for car in pagination.items:
            cars.append({
                "id": car.id,
                "driver_id": car.driver_id,
                "car_id": car.car_id,
                "driver_name": car.driver_name,
                "city": car.city,
                "vehicle_type": car.vehicle_type,
                "status": car.status,
                "vehicle_age": car.vehicle_age,
                "trips_per_month": car.trips_per_month,
                "battery_health": car.battery_health,
                "charge_per_km": car.charge_per_km,
                "garage_cost": car.garage_cost,
                "charging_cost": car.charging_cost,
                "maintenance_cost": car.maintenance_cost,
                "total_operating_cost": car.total_operating_cost,
                "gross_revenue": car.gross_revenue,
                "driver_charge": car.driver_charge,
                "overspeed_count": car.overspeed_count,
                "max_speed": car.max_speed
            })
        
        return jsonify({
            "cars": cars,
            "total": pagination.total,
            "pages": pagination.pages,
            "current_page": page,
            "per_page": per_page
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/cars/<car_id>", methods=["GET"])
def api_admin_get_car(car_id):
    """Get a specific car by car_id"""
    try:
        car = Car.query.filter_by(car_id=car_id).first()
        if not car:
            return jsonify({"error": "Car not found"}), 404
        
        return jsonify({
            "id": car.id,
            "driver_id": car.driver_id,
            "car_id": car.car_id,
            "driver_name": car.driver_name,
            "city": car.city,
            "vehicle_type": car.vehicle_type,
            "status": car.status,
            "vehicle_age": car.vehicle_age,
            "trips_per_month": car.trips_per_month,
            "battery_health": car.battery_health,
            "charge_per_km": car.charge_per_km,
            "garage_cost": car.garage_cost,
            "charging_cost": car.charging_cost,
            "maintenance_cost": car.maintenance_cost,
            "total_operating_cost": car.total_operating_cost,
            "gross_revenue": car.gross_revenue,
            "driver_charge": car.driver_charge,
            "overspeed_count": car.overspeed_count,
            "max_speed": car.max_speed
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/cars", methods=["POST"])
def api_admin_add_car():
    """Add a new car"""
    try:
        data = request.get_json()
        
        driver_name = data.get("driver_name", "").strip()
        city = data.get("city", "").strip()
        vehicle_type = data.get("vehicle_type", "").strip()
        
        if not driver_name or not city or not vehicle_type:
            return jsonify({"error": "Driver name, city, and vehicle type are required"}), 400
        
        defaults = get_car_field_averages()
        
        new_car = Car(
            driver_id=get_next_driver_id(),
            car_id=get_next_car_id(),
            driver_name=driver_name,
            city=city,
            vehicle_type=vehicle_type,
            status="assigned",
            vehicle_age=data.get("vehicle_age", defaults["vehicle_age"]),
            trips_per_month=data.get("trips_per_month", defaults["trips_per_month"]),
            battery_health=data.get("battery_health", defaults["battery_health"]),
            charge_per_km=data.get("charge_per_km", defaults["charge_per_km"]),
            garage_cost=data.get("garage_cost", defaults["garage_cost"]),
            charging_cost=data.get("charging_cost", defaults["charging_cost"]),
            maintenance_cost=data.get("maintenance_cost", defaults["maintenance_cost"]),
            total_operating_cost=data.get("total_operating_cost", defaults["total_operating_cost"]),
            gross_revenue=data.get("gross_revenue", defaults["gross_revenue"]),
            driver_charge=data.get("driver_charge", defaults["driver_charge"]),
            overspeed_count=data.get("overspeed_count", defaults["overspeed_count"]),
            max_speed=data.get("max_speed", defaults["max_speed"])
        )
        
        db.session.add(new_car)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Car added successfully",
            "car_id": new_car.car_id
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/cars/<car_id>", methods=["PUT"])
def api_admin_update_car(car_id):
    """Update a car's details"""
    try:
        car = Car.query.filter_by(car_id=car_id).first()
        if not car:
            return jsonify({"error": "Car not found"}), 404
        
        data = request.get_json()
        
        car.driver_name = data.get("driver_name", car.driver_name)
        car.city = data.get("city", car.city)
        car.vehicle_type = data.get("vehicle_type", car.vehicle_type)
        car.status = data.get("status", car.status)
        car.vehicle_age = data.get("vehicle_age", car.vehicle_age)
        car.trips_per_month = data.get("trips_per_month", car.trips_per_month)
        car.battery_health = data.get("battery_health", car.battery_health)
        car.charge_per_km = data.get("charge_per_km", car.charge_per_km)
        car.garage_cost = data.get("garage_cost", car.garage_cost)
        car.charging_cost = data.get("charging_cost", car.charging_cost)
        car.maintenance_cost = data.get("maintenance_cost", car.maintenance_cost)
        car.total_operating_cost = data.get("total_operating_cost", car.total_operating_cost)
        car.gross_revenue = data.get("gross_revenue", car.gross_revenue)
        car.driver_charge = data.get("driver_charge", car.driver_charge)
        car.overspeed_count = data.get("overspeed_count", car.overspeed_count)
        car.max_speed = data.get("max_speed", car.max_speed)
        
        db.session.commit()
        
        return jsonify({"success": True, "message": "Car updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/cars/<car_id>", methods=["DELETE"])
def api_admin_delete_car(car_id):
    """Delete a car"""
    try:
        car = Car.query.filter_by(car_id=car_id).first()
        if not car:
            return jsonify({"error": "Car not found"}), 404
        
        db.session.delete(car)
        db.session.commit()
        
        return jsonify({"success": True, "message": "Car deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/drivers/<driver_id>/release", methods=["POST"])
def api_admin_release_driver(driver_id):
    """Release all cars for a driver"""
    try:
        cars = Car.query.filter_by(driver_id=driver_id).all()
        if not cars:
            return jsonify({"error": "No cars found for this driver"}), 404
        
        for car in cars:
            car.status = "available"
            car.driver_id = "UNASSIGNED"
            car.driver_name = "Unassigned"
            car.city = "Unassigned"
        
        db.session.commit()
        
        return jsonify({"success": True, "message": f"Released {len(cars)} car(s)"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==================== ML Model API Endpoints ====================

@app.route("/api/ml/stats", methods=["GET"])
def api_ml_stats():
    """Get statistical analysis for the fleet"""
    try:
        vehicle_type = request.args.get("vehicle_type", None)
        analytics = get_analytics()
        stats = analytics.get_stats(vehicle_type=vehicle_type)
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/ml/vehicle-types", methods=["GET"])
def api_ml_vehicle_types():
    """Get available vehicle types"""
    try:
        analytics = get_analytics()
        vehicle_types = analytics.get_available_vehicle_types()
        return jsonify({"vehicle_types": vehicle_types}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/ml/cities", methods=["GET"])
def api_ml_cities():
    """Get available cities"""
    try:
        analytics = get_analytics()
        cities = analytics.get_available_cities()
        return jsonify({"cities": cities}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/ml/vehicle-statuses", methods=["GET"])
def api_ml_vehicle_statuses():
    """Get available vehicle statuses"""
    try:
        analytics = get_analytics()
        statuses = analytics.get_available_vehicle_statuses()
        return jsonify({"statuses": statuses}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/ml/predict-range", methods=["POST"])
def api_ml_predict_range():
    """
    Predict estimated range for a vehicle
    
    Expected JSON payload:
    {
        "vehicle_type": "string",
        "city": "string",
        "vehicle_status": "string",
        "vehicle_age": number,
        "battery_capacity_kw": number,
        "current_charge_percentage": number,
        "battery_health": number,
        "average_energy_per_km_kwh": number,
        "total_maintenance_cost": number,
        "max_speed": number
    }
    """
    try:
        input_data = request.get_json()
        if not input_data:
            return jsonify({"error": "No input data provided"}), 400
        
        predictor = get_predictor()
        predicted_range = predictor.predict(input_data)
        
        return jsonify({
            "predicted_range_km": predicted_range,
            "input_data": input_data
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/ml/feature-stats", methods=["GET"])
def api_ml_feature_stats():
    """Get statistics for numeric features (for UI defaults)"""
    try:
        predictor = get_predictor()
        stats = predictor.get_feature_stats()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/ml/compare-metrics", methods=["GET", "POST"])
def api_ml_compare_metrics():
    """
    Compare current metrics with historical trends
    
    Query params (GET):
    - metric: Name of metric (gross_revenue, total_km_driven, driver_earnings)
    
    JSON payload (POST):
    {
        "metric": "string",
        "current_value": number (optional)
    }
    """
    try:
        comparison = get_comparison()
        
        if request.method == "GET":
            metric = request.args.get("metric")
            if not metric:
                # Return available metrics
                metrics = comparison.get_available_metrics()
                return jsonify({"available_metrics": metrics}), 200
            
            result = comparison.compare_metric(metric)
            if result is None:
                return jsonify({"error": f"Metric '{metric}' not found"}), 404
            
            return jsonify(result), 200
        else:  # POST
            data = request.get_json()
            if not data or "metric" not in data:
                return jsonify({"error": "Metric name required"}), 400
            
            metric = data["metric"]
            current_value = data.get("current_value", None)
            
            result = comparison.compare_metric(metric, current_value=current_value)
            if result is None:
                return jsonify({"error": f"Metric '{metric}' not found"}), 404
            
            return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/ml/monthly-trend", methods=["GET"])
def api_ml_monthly_trend():
    """
    Get monthly trend data for a metric
    
    Query params:
    - metric: Name of metric
    - months: Number of months to return (default: 18)
    """
    try:
        metric = request.args.get("metric")
        months = int(request.args.get("months", 18))
        
        if not metric:
            return jsonify({"error": "Metric name required"}), 400
        
        comparison = get_comparison()
        trend = comparison.get_monthly_trend(metric, months=months)
        
        if trend is None:
            return jsonify({"error": f"Metric '{metric}' not found"}), 404
        
        return jsonify(trend), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)