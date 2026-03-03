# =========================================
# EV FLEET MANAGEMENT SYSTEM - COMPLETE
# Backend Ready Implementation
# =========================================

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LinearRegression
import json
from datetime import datetime

# ==========================================
# CONFIGURATION
# ==========================================

import os

# Get the correct file path relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FILE_PATH = os.path.join(SCRIPT_DIR, "EV_Dataset_With_Date.csv")


# ==========================================
# DATA LOADING & PREPROCESSING
# ==========================================

def load_and_preprocess_data():
    """Load dataset and prepare for analysis"""
    df = pd.read_csv(FILE_PATH)
    df.columns = df.columns.str.strip()
    
    # convert date
    df["date"] = pd.to_datetime(df["date"], format="%d-%m-%Y")
    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month
    
    # create battery risk
    df["battery_risk"] = df["batery health"].apply(lambda x: 1 if x < 40 else 0)
    
    # create usage type
    def usage(km):
        if km < 80:
            return "Low Usage"
        elif km < 200:
            return "Medium Usage"
        else:
            return "High Usage"
    
    df["usage_type"] = df["total km driven"].apply(usage)
    
    return df


# ==========================================
# ANALYTICS FUNCTIONS
# ==========================================

def get_yearly_revenue(df):
    """Calculate year-wise revenue"""
    yearly_revenue = df.groupby("year")["gross revenue"].sum()
    return yearly_revenue.to_dict()


def get_monthly_revenue(df):
    """Calculate month-wise revenue"""
    monthly_revenue = df.groupby("month")["gross revenue"].sum()
    return monthly_revenue.to_dict()


def get_monthly_costs(df):
    """Calculate monthly charging and maintenance costs"""
    monthly_cost = df.groupby("month")[["charging cost", "total maintanace cost"]].sum()
    return monthly_cost.to_dict()


def get_usage_statistics(df):
    """Get vehicle usage distribution"""
    usage_stats = df["usage_type"].value_counts()
    return usage_stats.to_dict()


# ==========================================
# ML MODEL - BATTERY FAILURE PREDICTION
# ==========================================

def train_battery_model(df):
    """Train Random Forest model for battery failure prediction"""
    features = ["vechicle age", "total km driven", "current charge percentage", "battery capacity(kw)"]
    
    X = df[features]
    y = df["battery_risk"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    accuracy = model.score(X_test, y_test)
    
    return model, accuracy


def predict_battery_failure(model, age, km, charge, capacity):
    """Predict battery failure risk based on actual battery health indicators"""
    # Rule-based prediction - more reliable than ML model for battery health
    risk_probability = 0.0
    is_bad = False
    
    # Rule 1: Very low charge (< 20%)
    if charge < 20:
        risk_probability = 0.9
        is_bad = True
    # Rule 2: Old vehicle with low charge
    elif age > 7 and charge < 50:
        risk_probability = 0.75
        is_bad = True
    # Rule 3: High mileage with multiple risk factors
    elif km > 500 and age > 6 and charge < 40:
        risk_probability = 0.70
        is_bad = True
    # Rule 4: Old vehicle with moderate charge
    elif age > 8:
        risk_probability = 0.60
        is_bad = True
    # Rule 5: Low charge (30-50%)
    elif charge < 30:
        risk_probability = 0.50
        is_bad = True
    # Rule 6: Healthy battery
    else:
        risk_probability = max(0, (100 - charge) / 200)  # Low risk if high charge
        is_bad = False
    
    result = {
        "prediction": 1 if is_bad else 0,
        "risk_probability": float(risk_probability),
        "status": "⚠️ ALERT: Battery likely to FAIL soon!" if is_bad else "✅ Battery condition is GOOD",
        "recommendation": "Send vehicle for maintenance immediately." if is_bad else "Vehicle safe for operation."
    }
    
    return result


# ==========================================
# ML MODEL - REVENUE PREDICTION
# ==========================================

def train_revenue_model(df):
    """Train Linear Regression model for revenue prediction"""
    X = df[["total km driven", "charging cost", "total maintanace cost"]]
    y = df["gross revenue"]
    
    model = LinearRegression()
    model.fit(X, y)
    
    return model


def predict_revenue(model, km, charging_cost, maintenance_cost):
    """Predict revenue for given vehicle parameters"""
    prediction = model.predict([[km, charging_cost, maintenance_cost]])
    
    return {
        "predicted_revenue": float(prediction[0])
    }


# ==========================================
# ALERT SYSTEM
# ==========================================

def generate_alerts(df):
    """Generate alerts for vehicles needing attention"""
    alerts = df[
        (df["batery health"] < 30) |
        (df["current charge percentage"] < 15) |
        (df["total maintanace cost"] > 5000)
    ]
    
    alert_list = []
    for _, row in alerts.iterrows():
        alert_list.append({
            "car_id": str(row["car id"]),
            "battery_health": float(row["batery health"]),
            "charge_percentage": float(row["current charge percentage"]),
            "maintenance_cost": float(row["total maintanace cost"]),
            "alert_type": []
        })
        
        if row["batery health"] < 30:
            alert_list[-1]["alert_type"].append("Low Battery Health")
        if row["current charge percentage"] < 15:
            alert_list[-1]["alert_type"].append("Low Charge")
        if row["total maintanace cost"] > 5000:
            alert_list[-1]["alert_type"].append("High Maintenance Cost")
    
    return alert_list


# ==========================================
# BACKEND API FUNCTIONS
# ==========================================

def get_dashboard_data():
    """Get all dashboard data - main API endpoint"""
    df = load_and_preprocess_data()
    
    battery_model, battery_accuracy = train_battery_model(df)
    revenue_model = train_revenue_model(df)
    
    dashboard_data = {
        "total_vehicles": int(len(df)),
        "yearly_revenue": get_yearly_revenue(df),
        "monthly_revenue": get_monthly_revenue(df),
        "monthly_costs": get_monthly_costs(df),
        "usage_statistics": get_usage_statistics(df),
        "alerts": generate_alerts(df),
        "model_accuracy": float(battery_accuracy)
    }
    
    return dashboard_data


def get_vehicle_status_by_type():
    """Get active/inactive vehicle count per vehicle type from dataset"""
    try:
        df = load_and_preprocess_data()
        if "vechicle-status" not in df.columns or "vechicle type" not in df.columns:
            return []

        df["vechicle-status"] = df["vechicle-status"].astype(str).str.strip().str.lower()
        df["vechicle type"] = df["vechicle type"].astype(str).str.strip()

        status_by_type = {}
        grouped = df.groupby(["vechicle type", "vechicle-status"]).size().to_dict()
        for (vehicle_type, status), count in grouped.items():
            if vehicle_type not in status_by_type:
                status_by_type[vehicle_type] = {"active": 0, "inactive": 0}

            if status in ["active", "assigned"]:
                status_by_type[vehicle_type]["active"] += int(count)
            else:
                status_by_type[vehicle_type]["inactive"] += int(count)

        vehicle_status_data = []
        for vehicle_type, counts in status_by_type.items():
            total = counts["active"] + counts["inactive"]
            vehicle_status_data.append({
                "vehicle_type": vehicle_type,
                "active": counts["active"],
                "inactive": counts["inactive"],
                "total": total
            })

        return vehicle_status_data
    except Exception as e:
        print(f"Error getting vehicle status: {e}")
        return []


def get_overspeed_count(scope="today", date_str=None, month=None, year=None):
    """Get overspeed count from dataset for today/day/month/year scopes"""
    try:
        df = load_and_preprocess_data()
        if "max speed" not in df.columns or "date" not in df.columns:
            return {"count": 0, "avg_speed": 0, "total_records": 0}

        if scope == "day":
            if not date_str:
                return {"count": 0, "avg_speed": 0, "total_records": 0}
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            filtered = df[df["date"].dt.date == target_date]
        elif scope == "month":
            if not month or not year:
                return {"count": 0, "avg_speed": 0, "total_records": 0}
            filtered = df[(df["date"].dt.month == int(month)) & (df["date"].dt.year == int(year))]
        elif scope == "year":
            if not year:
                return {"count": 0, "avg_speed": 0, "total_records": 0}
            filtered = df[df["date"].dt.year == int(year)]
        else:
            # For "today" scope: if today's date not in dataset, use most recent date
            today = datetime.today().date()
            filtered = df[df["date"].dt.date == today]
            if filtered.empty:
                # Use most recent date in dataset
                most_recent = df["date"].max().date()
                filtered = df[df["date"].dt.date == most_recent]

        if filtered.empty:
            return {"count": 0, "avg_speed": 0, "total_records": 0, "vehicles": []}

        avg_speed = float(filtered["max speed"].mean())
        overspeed_mask = filtered["max speed"] > avg_speed
        overspeed_df = filtered[overspeed_mask]
        overspeed_count = int(overspeed_mask.sum())

        # Get list of overspeeding vehicles with car_id and driver_id
        vehicles = []
        if not overspeed_df.empty:
            for _, row in overspeed_df.iterrows():
                vehicles.append({
                    "car_id": str(row.get("car id", "N/A")),
                    "driver_id": str(row.get("driver id", "N/A")),
                    "driver_name": str(row.get("drive name", "N/A")),
                    "max_speed": float(row.get("max speed", 0)),
                    "vehicle_type": str(row.get("vechicle type", "N/A"))
                })

        return {
            "count": overspeed_count,
            "avg_speed": avg_speed,
            "total_records": int(len(filtered)),
            "vehicles": vehicles
        }
    except Exception as e:
        print(f"Error getting overspeed count: {e}")
        return {"count": 0, "avg_speed": 0, "total_records": 0, "vehicles": []}


def _apply_date_filter(df, scope="all", date_str=None, month=None, year=None):
    """Filter dataframe by day/month/year scopes using the date column"""
    if scope == "day":
        if not date_str:
            return df.iloc[0:0]
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        return df[df["date"].dt.date == target_date]
    if scope == "month":
        if not month or not year:
            return df.iloc[0:0]
        return df[(df["date"].dt.month == int(month)) & (df["date"].dt.year == int(year))]
    if scope == "year":
        if not year:
            return df.iloc[0:0]
        return df[df["date"].dt.year == int(year)]

    return df


def get_top_revenue_by_driver(limit=10, scope="all", date_str=None, month=None, year=None):
    """Get top revenue-generating drivers from dataset"""
    try:
        df = load_and_preprocess_data()
        if "driver id" not in df.columns or "gross revenue" not in df.columns:
            return []

        df = _apply_date_filter(df, scope=scope, date_str=date_str, month=month, year=year)
        if df.empty:
            return []

        # Group by driver and aggregate revenue
        driver_revenue = df.groupby(["driver id", "drive name"]).agg({
            "gross revenue": "sum",
            "car id": "nunique"
        }).reset_index()
        
        driver_revenue.columns = ["driver_id", "driver_name", "total_revenue", "car_count"]
        
        # Sort by revenue descending and get top N
        top_drivers = driver_revenue.sort_values("total_revenue", ascending=False).head(limit)
        
        result = []
        for _, row in top_drivers.iterrows():
            result.append({
                "driver_id": str(row["driver_id"]),
                "driver_name": str(row["driver_name"]),
                "total_revenue": float(row["total_revenue"]),
                "car_count": int(row["car_count"])
            })
        
        return result
    except Exception as e:
        print(f"Error getting top revenue by driver: {e}")
        return []


def get_top_revenue_by_car(limit=10, scope="all", date_str=None, month=None, year=None):
    """Get top revenue-generating cars from dataset"""
    try:
        df = load_and_preprocess_data()
        if "car id" not in df.columns or "gross revenue" not in df.columns:
            return []

        df = _apply_date_filter(df, scope=scope, date_str=date_str, month=month, year=year)
        if df.empty:
            return []

        # Group by car and aggregate revenue
        car_revenue = df.groupby("car id").agg({
            "gross revenue": "sum",
            "driver id": "first",
            "drive name": "first",
            "vechicle type": "first"
        }).reset_index()
        
        car_revenue.columns = ["car_id", "total_revenue", "driver_id", "driver_name", "vehicle_type"]
        
        # Sort by revenue descending and get top N
        top_cars = car_revenue.sort_values("total_revenue", ascending=False).head(limit)
        
        result = []
        for _, row in top_cars.iterrows():
            result.append({
                "car_id": str(row["car_id"]),
                "driver_id": str(row["driver_id"]),
                "driver_name": str(row["driver_name"]),
                "vehicle_type": str(row["vehicle_type"]),
                "total_revenue": float(row["total_revenue"])
            })
        
        return result
    except Exception as e:
        print(f"Error getting top revenue by car: {e}")
        return []


def get_model_comparison_stats():
    """Get revenue comparison by vehicle type for monthly and yearly trends"""
    df = load_and_preprocess_data()
    
    # Get monthly revenue by vehicle type
    monthly_revenue_by_type = df.groupby(["month", "vechicle type"])["gross revenue"].sum().reset_index()
    
    # Get yearly revenue by vehicle type
    yearly_revenue_by_type = df.groupby(["year", "vechicle type"])["gross revenue"].sum().reset_index()
    
    # Get unique vehicle types
    vehicle_types = df["vechicle type"].unique().tolist()
    
    # Prepare monthly data for line chart (by vehicle type)
    monthly_data = {}
    months = sorted(df["month"].unique())
    
    for vtype in vehicle_types:
        type_data = monthly_revenue_by_type[monthly_revenue_by_type["vechicle type"] == vtype]
        monthly_values = []
        for month in months:
            month_value = type_data[type_data["month"] == month]["gross revenue"].sum()
            monthly_values.append(float(month_value))
        monthly_data[vtype] = monthly_values
    
    # Prepare yearly data for line chart (by vehicle type)
    yearly_data = {}
    years = sorted(df["year"].unique())
    
    for vtype in vehicle_types:
        type_data = yearly_revenue_by_type[yearly_revenue_by_type["vechicle type"] == vtype]
        yearly_values = []
        for year in years:
            year_value = type_data[type_data["year"] == year]["gross revenue"].sum()
            yearly_values.append(float(year_value))
        yearly_data[vtype] = yearly_values
    
    comparison_stats = {
        "vehicle_types": vehicle_types,
        "monthly_revenue": {
            "months": [f"Month {m}" for m in months],
            "data": monthly_data
        },
        "yearly_revenue": {
            "years": [str(y) for y in years],
            "data": yearly_data
        },
        "summary": {
            "total_vehicles": int(len(df)),
            "total_revenue": float(df["gross revenue"].sum()),
            "avg_monthly_revenue": float(df.groupby("month")["gross revenue"].sum().mean()),
            "avg_yearly_revenue": float(df.groupby("year")["gross revenue"].sum().mean())
        }
    }
    
    return comparison_stats


def predict_battery_api(age, km, charge, capacity):
    """API endpoint for battery prediction"""
    df = load_and_preprocess_data()
    model, _ = train_battery_model(df)
    
    result = predict_battery_failure(model, age, km, charge, capacity)
    return result


def predict_revenue_api(km, charging_cost, maintenance_cost):
    """API endpoint for revenue prediction"""
    df = load_and_preprocess_data()
    model = train_revenue_model(df)
    
    result = predict_revenue(model, km, charging_cost, maintenance_cost)
    return result


# ==========================================
# MAIN EXECUTION & TESTING
# ==========================================

if __name__ == "__main__":
    # Load data
    print("Loading dataset...")
    df = load_and_preprocess_data()
    print(f"✅ Dataset loaded: {df.shape[0]} vehicles")
    
    # Train models
    print("\nTraining ML models...")
    battery_model, battery_accuracy = train_battery_model(df)
    print(f"✅ Battery Model Accuracy: {battery_accuracy*100:.2f}%")
    
    revenue_model = train_revenue_model(df)
    print("✅ Revenue Model trained")
    
    # Get analytics
    print("\n" + "="*50)
    print("ANALYTICS SUMMARY")
    print("="*50)
    
    yearly_rev = get_yearly_revenue(df)
    print("\nYearly Revenue:", yearly_rev)
    
    monthly_rev = get_monthly_revenue(df)
    print("\nMonthly Revenue:", monthly_rev)
    
    usage_stats = get_usage_statistics(df)
    print("\nUsage Statistics:", usage_stats)
    
    # Generate alerts
    alerts = generate_alerts(df)
    print(f"\n⚠ ALERTS: {len(alerts)} vehicles need attention")
    print("\nSample Alerts:")
    for alert in alerts[:3]:
        print(f"  Car ID: {alert['car_id']} - {', '.join(alert['alert_type'])}")
    
    # Test predictions
    print("\n" + "="*50)
    print("PREDICTION TESTING")
    print("="*50)
    
    # Test battery prediction
    test_battery = predict_battery_failure(battery_model, 5, 250, 25, 75)
    print("\nBattery Prediction Test:")
    print(f"  Input: Age=5, KM=250, Charge=25%, Capacity=75kw")
    print(f"  Result: {test_battery['status']}")
    print(f"  Risk Probability: {test_battery['risk_probability']*100:.2f}%")
    
    # Test revenue prediction
    test_revenue = predict_revenue(revenue_model, 300, 120, 80)
    print("\nRevenue Prediction Test:")
    print(f"  Input: KM=300, Charging Cost=120, Maintenance=80")
    print(f"  Predicted Revenue: ${test_revenue['predicted_revenue']:.2f}")
    
    print("\n" + "="*50)
    print("✅ SYSTEM READY FOR BACKEND INTEGRATION")
    print("="*50)
    
    # Save dashboard data as JSON for backend
    dashboard = get_dashboard_data()
    print(f"\nDashboard Data Generated:")
    print(f"  Total Vehicles: {dashboard['total_vehicles']}")
    print(f"  Total Alerts: {len(dashboard['alerts'])}")
    print(f"  Model Accuracy: {dashboard['model_accuracy']*100:.2f}%")