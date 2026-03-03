import os
from datetime import datetime

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(SCRIPT_DIR, "final_dataset_for_electiccar_2.csv")

_MODEL_CACHE = None


def _clean_columns(df):
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("-", "_")
        .str.replace("(", "", regex=False)
        .str.replace(")", "", regex=False)
        .str.replace("%", "", regex=False)
        .str.replace("vechicle", "vehicle", regex=False)
    )
    return df


def load_driver_dataset():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    df = _clean_columns(df)

    df["vehicle_type"] = df["vehicle_type"].astype(str).str.strip()
    df["driver_id"] = df["driver_id"].astype(str).str.strip()
    df["driver_name"] = df["drive_name"].astype(str).str.strip()

    numeric_cols = [
        "vehicle_age",
        "total_km_driven",
        "battery_capacitykw",
        "current_charge_percentage",
        "average_energy_per_km_kwh",
        "batery_health",
        "max_speed",
        "gross_revenue",
        "driver_earnings",
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    if "battery_health" not in df.columns:
        if "batery_health" in df.columns:
            df["battery_health"] = df["batery_health"].fillna(0)
        else:
            np.random.seed(42)
            df["battery_health"] = (
                100
                - (df["vehicle_age"] * 2.2)
                - (df["total_km_driven"] / 30000)
                - (df["current_charge_percentage"] * 0.04)
                - (df["battery_capacitykw"] * 0.02)
                + np.random.normal(0, 3, len(df))
            ).clip(55, 100)

    return df


def get_available_drivers():
    """Get list of driver names available in the CSV dataset"""
    try:
        df = load_driver_dataset()
        drivers = df["driver_name"].unique().tolist()
        return sorted(drivers)
    except Exception as e:
        print(f"Error getting available drivers: {e}")
        return []


def get_random_driver_profile():
    """Get a random driver profile from the dataset"""
    try:
        bundle = _get_model_bundle()
        df = bundle["df"]
        if df.empty:
            return None
        
        random_row = df.sample(n=1).iloc[0]
        return {
            "driver_id": str(random_row.get("driver_id", "")),
            "driver_name": str(random_row.get("driver_name", "")),
            "car_id": str(random_row.get("car_id", "")),
            "vehicle_type": str(random_row.get("vehicle_type", "")),
            "vehicle_age": float(random_row.get("vehicle_age", 0)),
            "total_km_driven": float(random_row.get("total_km_driven", 0)),
            "battery_capacity_kw": float(random_row.get("battery_capacitykw", 0)),
            "charge_per_km": float(random_row.get("average_energy_per_km_kwh", 0)),
            "current_charge_percentage": float(random_row.get("current_charge_percentage", 0)),
            "battery_health": float(random_row.get("battery_health", 0)),
            "city": str(random_row.get("city", "")),
            "status": str(random_row.get("vehicle_status", "")),
            "max_speed": float(random_row.get("max_speed", 0)),
            "gross_revenue": float(random_row.get("gross_revenue", 0)),
            "driver_earnings": float(random_row.get("driver_earnings", 0)),
        }
    except Exception as e:
        print(f"Error getting random driver profile: {e}")
        return None


def _train_driver_model(df):
    le_vehicle = LabelEncoder()
    df["vehicle_type_encoded"] = le_vehicle.fit_transform(df["vehicle_type"])

    feature_cols = [
        "vehicle_type_encoded",
        "vehicle_age",
        "total_km_driven",
        "battery_capacitykw",
        "current_charge_percentage",
    ]

    X = df[feature_cols].fillna(0)
    y = df["battery_health"].fillna(0)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=3,
        random_state=42,
    )

    model.fit(X_train, y_train)

    return model, le_vehicle, feature_cols


def _get_model_bundle():
    global _MODEL_CACHE
    if _MODEL_CACHE is None:
        df = load_driver_dataset()
        model, encoder, feature_cols = _train_driver_model(df)
        _MODEL_CACHE = {
            "df": df,
            "model": model,
            "encoder": encoder,
            "feature_cols": feature_cols,
        }
    return _MODEL_CACHE


def _find_driver_row(df, username):
    row = df[df["driver_name"].str.lower() == username.lower()]
    if row.empty:
        row = df[df["driver_id"].str.lower() == username.lower()]
    if row.empty:
        return None
    return row.iloc[0]


def get_driver_profile(username):
    try:
        bundle = _get_model_bundle()
        df = bundle["df"]
        row = _find_driver_row(df, username)
        if row is None:
            return None

        return {
            "driver_id": str(row.get("driver_id", "")),
            "driver_name": str(row.get("driver_name", "")),
            "car_id": str(row.get("car_id", "")),
            "vehicle_type": str(row.get("vehicle_type", "")),
            "vehicle_age": float(row.get("vehicle_age", 0)),
            "total_km_driven": float(row.get("total_km_driven", 0)),
            "battery_capacity_kw": float(row.get("battery_capacitykw", 0)),
            "charge_per_km": float(row.get("average_energy_per_km_kwh", 0)),
            "current_charge_percentage": float(row.get("current_charge_percentage", 0)),
            "battery_health": float(row.get("battery_health", 0)),
            "city": str(row.get("city", "")),
            "status": str(row.get("vehicle_status", "")),
            "max_speed": float(row.get("max_speed", 0)),
            "gross_revenue": float(row.get("gross_revenue", 0)),
            "driver_earnings": float(row.get("driver_earnings", 0)),
        }
    except Exception as exc:
        print(f"Error getting driver profile: {exc}")
        return None


def predict_driver_km(username, current_charge_percentage):
    try:
        bundle = _get_model_bundle()
        df = bundle["df"]
        model = bundle["model"]
        encoder = bundle["encoder"]
        feature_cols = bundle["feature_cols"]

        row = _find_driver_row(df, username)
        if row is None:
            return None

        vehicle_type = str(row.get("vehicle_type", ""))
        vehicle_encoded = int(encoder.transform([vehicle_type])[0])

        prediction_input = pd.DataFrame([[
            vehicle_encoded,
            float(row.get("vehicle_age", 0)),
            float(row.get("total_km_driven", 0)),
            float(row.get("battery_capacitykw", 0)),
            float(current_charge_percentage),
        ]], columns=feature_cols)

        predicted_health = float(model.predict(prediction_input)[0])

        charge_per_km = float(row.get("average_energy_per_km_kwh", 0.0))
        if charge_per_km <= 0:
            estimated_distance = 0.0
        else:
            estimated_distance = float(current_charge_percentage) / charge_per_km

        profile = get_driver_profile(username)

        return {
            "profile": profile,
            "prediction": {
                "predicted_battery_health": predicted_health,
                "estimated_distance_km": estimated_distance,
                "current_charge_percentage": float(current_charge_percentage),
                "charge_per_km": charge_per_km,
                "generated_at": datetime.utcnow().isoformat(),
            },
        }
    except Exception as exc:
        print(f"Error predicting driver km: {exc}")
        return None
