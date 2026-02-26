"""
Machine Learning Models and Analytics for Electric Car Project
Extracted from Jupyter notebooks: stats.ipynb, total km predict.ipynb, comparison.ipynb
"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestRegressor
import os
import joblib

# Data path configuration
DATA_PATH = "final_dataset_for_electiccar_2.csv"
MODEL_PATH = "trained_range_predictor.pkl"


class ElectricCarAnalytics:
    """Analytics for electric car fleet statistics"""
    
    def __init__(self, csv_path=None):
        if csv_path is None:
            csv_path = DATA_PATH
        self.df = self._load_and_clean_data(csv_path)
    
    def _load_and_clean_data(self, csv_path):
        """Load and clean the dataset"""
        if not os.path.exists(csv_path):
            # Try alternate path
            csv_path = os.path.join("helping folder for the electic car", csv_path)
        
        df_raw = pd.read_csv(csv_path)
        
        rename_map = {
            "driver id": "driver_id",
            "car id": "car_id",
            "drive name": "drive_name",
            "city": "city",
            "vechicle type": "vehicle_type",
            "vechicle age": "vehicle_age",
            "battery capacity(kw)": "battery_capacity_kw",
            "total km driven": "total_km_driven",
            "current charge percentage": "current_charge_percentage",
            "estimated rangekm": "estimated_rangekm",
            "batery health": "battery_health",
            "vechicle-status": "vehicle_status",
            "average energy per km kwh": "average_energy_per_km_kwh",
            "charging cost": "charging_cost",
            "total maintanace cost": "total_maintenance_cost",
            "max speed": "max_speed",
            "gross revenue": "gross_revenue",
            "driver earnings": "driver_earnings"
        }
        
        df = df_raw.rename(columns=rename_map)
        df.columns = (
            df.columns
            .str.strip()
            .str.lower()
            .str.replace(" ", "_", regex=False)
            .str.replace("-", "_", regex=False)
            .str.replace("(", "", regex=False)
            .str.replace(")", "", regex=False)
        )
        
        return df
    
    def get_stats(self, vehicle_type=None):
        """
        Get statistical analysis for vehicles
        
        Args:
            vehicle_type: Filter by vehicle type, or None for all vehicles
            
        Returns:
            dict with summary and grouped statistics
        """
        df_filtered = self.df if vehicle_type is None else self.df[self.df["vehicle_type"] == vehicle_type]
        
        summary = {
            "total_revenue": float(df_filtered["gross_revenue"].sum()),
            "avg_revenue": float(df_filtered["gross_revenue"].mean()),
            "total_km": float(df_filtered["total_km_driven"].sum()),
            "avg_battery_health": float(df_filtered["battery_health"].mean()),
            "total_maintenance_cost": float(df_filtered["total_maintenance_cost"].sum()),
            "vehicle_count": len(df_filtered)
        }
        
        grouped = (
            df_filtered
            .groupby("vehicle_type")
            .agg(
                cars=("car_id", "nunique"),
                total_revenue=("gross_revenue", "sum"),
                avg_revenue=("gross_revenue", "mean"),
                total_km=("total_km_driven", "sum"),
                avg_battery_health=("battery_health", "mean"),
                total_maintenance_cost=("total_maintenance_cost", "sum"),
            )
            .reset_index()
            .sort_values(by="total_revenue", ascending=False)
        )
        
        return {
            "summary": summary,
            "by_vehicle_type": grouped.to_dict(orient="records")
        }
    
    def get_available_vehicle_types(self):
        """Get list of unique vehicle types"""
        return sorted(self.df["vehicle_type"].dropna().unique().tolist())
    
    def get_available_cities(self):
        """Get list of unique cities"""
        return sorted(self.df["city"].dropna().unique().tolist())
    
    def get_available_vehicle_statuses(self):
        """Get list of unique vehicle statuses"""
        return sorted(self.df["vehicle_status"].dropna().unique().tolist())


class RangePredictor:
    """ML Model to predict estimated range for electric vehicles"""
    
    def __init__(self, csv_path=None):
        if csv_path is None:
            csv_path = DATA_PATH
        self.df = self._load_and_clean_data(csv_path)
        self.pipeline = None
        self.feature_cols = [
            "vehicle_type",
            "city",
            "vehicle_status",
            "vehicle_age",
            "battery_capacity_kw",
            "current_charge_percentage",
            "battery_health",
            "average_energy_per_km_kwh",
            "total_maintenance_cost",
            "max_speed"
        ]
        self.target = "estimated_rangekm"
        self.categorical_cols = ["vehicle_type", "city", "vehicle_status"]
        self.numeric_cols = [c for c in self.feature_cols if c not in self.categorical_cols]
        
    def _load_and_clean_data(self, csv_path):
        """Load and clean the dataset"""
        if not os.path.exists(csv_path):
            csv_path = os.path.join("helping folder for the electic car", csv_path)
        
        df_raw = pd.read_csv(csv_path)
        
        rename_map = {
            "driver id": "driver_id",
            "car id": "car_id",
            "drive name": "drive_name",
            "city": "city",
            "vechicle type": "vehicle_type",
            "vechicle age": "vehicle_age",
            "battery capacity(kw)": "battery_capacity_kw",
            "total km driven": "total_km_driven",
            "current charge percentage": "current_charge_percentage",
            "estimated rangekm": "estimated_rangekm",
            "batery health": "battery_health",
            "vechicle-status": "vehicle_status",
            "average energy per km kwh": "average_energy_per_km_kwh",
            "charging cost": "charging_cost",
            "total maintanace cost": "total_maintenance_cost",
            "max speed": "max_speed",
            "gross revenue": "gross_revenue",
            "driver earnings": "driver_earnings"
        }
        
        df = df_raw.rename(columns=rename_map)
        df.columns = (
            df.columns
            .str.strip()
            .str.lower()
            .str.replace(" ", "_", regex=False)
            .str.replace("-", "_", regex=False)
            .str.replace("(", "", regex=False)
            .str.replace(")", "", regex=False)
        )
        
        return df
    
    def train(self):
        """Train the Random Forest model"""
        df_model = self.df[self.feature_cols + [self.target]].dropna()
        
        X = df_model[self.feature_cols]
        y = df_model[self.target]
        
        preprocess = ColumnTransformer(
            transformers=[
                ("cat", Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("onehot", OneHotEncoder(handle_unknown="ignore"))
                    ]
                ), self.categorical_cols),
                ("num", Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median"))
                    ]
                ), self.numeric_cols),
            ]
        )
        
        model = RandomForestRegressor(
            n_estimators=300,
            random_state=42,
            n_jobs=-1
        )
        
        self.pipeline = Pipeline(
            steps=[
                ("preprocess", preprocess),
                ("model", model)
            ]
        )
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        self.pipeline.fit(X_train, y_train)
        
        from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
        preds = self.pipeline.predict(X_test)
        
        mse = mean_squared_error(y_test, preds)
        metrics = {
            "mae": float(mean_absolute_error(y_test, preds)),
            "rmse": float(np.sqrt(mse)),
            "r2": float(r2_score(y_test, preds))
        }
        
        return metrics
    
    def save_model(self, path=MODEL_PATH):
        """Save trained model to disk"""
        if self.pipeline is None:
            raise ValueError("Model must be trained before saving")
        joblib.dump(self.pipeline, path)
    
    def load_model(self, path=MODEL_PATH):
        """Load trained model from disk"""
        if os.path.exists(path):
            self.pipeline = joblib.load(path)
            return True
        return False
    
    def predict(self, input_data):
        """
        Predict estimated range for given input
        
        Args:
            input_data: dict with keys matching feature_cols or pandas DataFrame
            
        Returns:
            Predicted estimated range in km
        """
        if self.pipeline is None:
            # Try to load model, or train if not available
            if not self.load_model():
                self.train()
        
        if isinstance(input_data, dict):
            input_df = pd.DataFrame([input_data])
        else:
            input_df = input_data
        
        prediction = self.pipeline.predict(input_df[self.feature_cols])
        return float(prediction[0]) if len(prediction) == 1 else prediction.tolist()
    
    def get_feature_stats(self):
        """Get statistics for numeric features (for UI defaults)"""
        df_model = self.df[self.feature_cols + [self.target]].dropna()
        
        stats = {}
        for col in self.numeric_cols:
            stats[col] = {
                "min": float(df_model[col].min()),
                "max": float(df_model[col].max()),
                "median": float(df_model[col].median()),
                "mean": float(df_model[col].mean())
            }
        
        return stats


class MetricComparison:
    """Compare current metrics with historical trends"""
    
    def __init__(self, csv_path=None):
        if csv_path is None:
            csv_path = DATA_PATH
        self.df = self._load_and_clean_data(csv_path)
        self.monthly = self._prepare_monthly_data()
    
    def _load_and_clean_data(self, csv_path):
        """Load and clean the dataset"""
        if not os.path.exists(csv_path):
            csv_path = os.path.join("helping folder for the electic car", csv_path)
        
        df_raw = pd.read_csv(csv_path)
        
        rename_map = {
            "driver id": "driver_id",
            "car id": "car_id",
            "drive name": "drive_name",
            "city": "city",
            "vechicle type": "vehicle_type",
            "vechicle age": "vehicle_age",
            "battery capacity(kw)": "battery_capacity_kw",
            "total km driven": "total_km_driven",
            "current charge percentage": "current_charge_percentage",
            "estimated rangekm": "estimated_rangekm",
            "batery health": "battery_health",
            "vechicle-status": "vehicle_status",
            "average energy per km kwh": "average_energy_per_km_kwh",
            "charging cost": "charging_cost",
            "total maintanace cost": "total_maintenance_cost",
            "max speed": "max_speed",
            "gross revenue": "gross_revenue",
            "driver earnings": "driver_earnings"
        }
        
        df = df_raw.rename(columns=rename_map)
        df.columns = (
            df.columns
            .str.strip()
            .str.lower()
            .str.replace(" ", "_", regex=False)
            .str.replace("-", "_", regex=False)
            .str.replace("(", "", regex=False)
            .str.replace(")", "", regex=False)
        )
        
        return df
    
    def _prepare_monthly_data(self):
        """Prepare monthly aggregated data"""
        df = self.df.copy()
        
        # Create synthetic dates if not present
        possible_date_cols = ["record_date", "date", "timestamp", "created_at"]
        date_col = next((c for c in possible_date_cols if c in df.columns), None)
        
        if date_col is None:
            df["record_date"] = pd.date_range(
                end=pd.Timestamp.today().normalize(),
                periods=len(df),
                freq="D"
            )
            date_col = "record_date"
        else:
            df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
            df = df.dropna(subset=[date_col])
        
        metrics = ["gross_revenue", "total_km_driven", "driver_earnings"]
        available_metrics = [m for m in metrics if m in df.columns]
        
        monthly = (
            df.set_index(date_col)
            .sort_index()[available_metrics]
            .resample("M")
            .sum()
        )
        
        return monthly
    
    def compare_metric(self, metric, current_value=None):
        """
        Compare current value with historical data
        
        Args:
            metric: Name of metric to compare (e.g., "gross_revenue", "total_km_driven")
            current_value: Current value, or None to use most recent month
            
        Returns:
            dict with comparison statistics
        """
        if metric not in self.monthly.columns:
            return None
        
        current_period = self.monthly.index.max()
        if current_period is pd.NaT:
            return None
        
        current_month_value = self.monthly.loc[current_period, metric]
        current_value = current_month_value if current_value is None else current_value
        
        prev_month_value = self.monthly.shift(1).loc[current_period, metric]
        prev_year_value = self.monthly.shift(12).loc[current_period, metric]
        
        def pct_change(current, previous):
            if pd.isna(previous) or previous == 0:
                return None
            return float((current - previous) / previous * 100.0)
        
        return {
            "metric": metric,
            "current_value": float(current_value),
            "prev_month_value": float(prev_month_value) if not pd.isna(prev_month_value) else None,
            "prev_year_value": float(prev_year_value) if not pd.isna(prev_year_value) else None,
            "prev_month_change_pct": pct_change(current_value, prev_month_value),
            "prev_year_change_pct": pct_change(current_value, prev_year_value),
        }
    
    def get_available_metrics(self):
        """Get list of available metrics for comparison"""
        return list(self.monthly.columns)
    
    def get_monthly_trend(self, metric, months=18):
        """Get monthly trend data for a metric"""
        if metric not in self.monthly.columns:
            return None
        
        data = self.monthly[metric].tail(months)
        
        return {
            "dates": [d.strftime("%Y-%m") for d in data.index],
            "values": data.tolist()
        }


# Initialize global instances (lazy loading)
_analytics = None
_predictor = None
_comparison = None


def get_analytics():
    """Get or create ElectricCarAnalytics instance"""
    global _analytics
    if _analytics is None:
        _analytics = ElectricCarAnalytics()
    return _analytics


def get_predictor():
    """Get or create RangePredictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = RangePredictor()
        # Try to load existing model, or train new one
        if not _predictor.load_model():
            print("Training new range prediction model...")
            metrics = _predictor.train()
            print(f"Model trained with metrics: {metrics}")
            _predictor.save_model()
    return _predictor


def get_comparison():
    """Get or create MetricComparison instance"""
    global _comparison
    if _comparison is None:
        _comparison = MetricComparison()
    return _comparison
