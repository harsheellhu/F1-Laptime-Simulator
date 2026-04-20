"""
Advanced Model Training with XGBoost, LightGBM, Ensemble Methods
Scientific approach with cross-validation, hyperparameter tuning, and explainability
"""

import pandas as pd
import numpy as np
import joblib
import pickle
import json
from pathlib import Path
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import (train_test_split, cross_val_score, GridSearchCV,
                                     KFold, RandomizedSearchCV, validation_curve)
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, VotingRegressor, StackingRegressor
from sklearn.metrics import (mean_absolute_error, mean_squared_error, r2_score,
                             mean_absolute_percentage_error, median_absolute_error)
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectFromModel, RFE, VarianceThreshold

# XGBoost
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("XGBoost not available - install with: pip install xgboost")

# LightGBM (faster, often better)
try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False
    print("LightGBM not available - install with: pip install lightgbm")

# CatBoost
try:
    from catboost import CatBoostRegressor
    CATBOOST_AVAILABLE = True
except ImportError:
    CATBOOST_AVAILABLE = False

# SHAP for explainability
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    print("SHAP not available - install with: pip install shap")


class AdvancedModelTrainer:
    """
    Advanced training pipeline with scientific rigor.
    """

    def __init__(self, output_dir: str = "f1_simulator/model/advanced"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.models = {}
        self.scaler = StandardScaler()
        self.feature_importance = pd.DataFrame()
        self.metrics_history = []

        print(f"Model output directory: {self.output_dir}")

    def load_data(self, X_path: str, y_path: str, features_path: str = None):
        """Load preprocessed data."""
        print("Loading data...")
        X = pd.read_csv(X_path)
        y = pd.read_csv(y_path).squeeze()

        if features_path:
            with open(features_path, 'r') as f:
                self.feature_names = [line.strip() for line in f.readlines()]
        else:
            self.feature_names = list(X.columns)

        print(f"Data loaded: {X.shape}, target shape: {y.shape}")
        print(f"Features: {len(self.feature_names)}")

        self.X = X
        self.y = y
        return X, y

    def split_and_scale(self, test_size: float = 0.2, val_size: float = 0.15, random_state: int = 42):
        """
        Split data into train/val/test with stratification by lap position.
        """
        print("\nSplitting data...")

        # First split: train+val vs test
        X_train_val, X_test, y_train_val, y_test = train_test_split(
            self.X, self.y, test_size=test_size, random_state=random_state
        )

        # Second split: train vs val
        val_ratio = val_size / (1 - test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_train_val, y_train_val, test_size=val_ratio, random_state=random_state
        )

        # Scale features
        print("Scaling features...")
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_val_scaled = self.scaler.transform(X_val)
        X_test_scaled = self.scaler.transform(X_test)

        self.X_train = pd.DataFrame(X_train_scaled, columns=self.feature_names)
        self.X_val = pd.DataFrame(X_val_scaled, columns=self.feature_names)
        self.X_test = pd.DataFrame(X_test_scaled, columns=self.feature_names)
        self.y_train = y_train
        self.y_val = y_val
        self.y_test = y_test

        print(f"Train: {len(self.X_train)}, Val: {len(self.X_val)}, Test: {len(self.X_test)}")
        return self.X_train, self.X_val, self.X_test, self.y_train, self.y_val, self.y_test

    def train_xgboost(self, tune_hyperparams: bool = True, n_trials: int = 50):
        """
        Train XGBoost model with hyperparameter tuning.
        """
        if not XGBOOST_AVAILABLE:
            print("XGBoost not installed, skipping")
            return None

        print("\n" + "="*60)
        print("Training XGBoost Model")
        print("="*60)

        X_train, X_val, X_test, y_train, y_val, y_test = (
            self.X_train, self.X_val, self.X_test,
            self.y_train, self.y_val, self.y_test
        )

        if tune_hyperparams:
            print("Running hyperparameter optimization...")
            # Use Random Search for efficiency
            param_dist = {
                'n_estimators': [100, 200, 300],
                'max_depth': [4, 6, 8, 10],
                'learning_rate': [0.01, 0.05, 0.1],
                'subsample': [0.7, 0.8, 0.9],
                'colsample_bytree': [0.7, 0.8, 0.9],
                'min_child_weight': [1, 3, 5],
                'gamma': [0, 0.1, 0.2],
                'reg_alpha': [0, 0.1, 1],
                'reg_lambda': [1, 1.5, 2]
            }

            xgb_reg = xgb.XGBRegressor(
                objective='reg:squarederror',
                random_state=42,
                n_jobs=-1
            )

            # Random search (limited for demo)
            from sklearn.model_selection import PredefinedSplit
            test_fold = np.concatenate([
                np.full(len(X_train), -1),  # train
                np.zeros(len(X_val))       # val
            ])
            ps = PredefinedSplit(test_fold)
            X_tv = pd.concat([X_train, X_val])
            y_tv = pd.concat([y_train, y_val])

            search = RandomizedSearchCV(
                xgb_reg, param_dist,
                n_iter=n_trials,
                cv=ps,
                scoring='neg_mean_absolute_error',
                n_jobs=-1,
                random_state=42,
                verbose=1
            )
            search.fit(X_tv, y_tv)

            best_params = search.best_params_
            print(f"\nBest params: {best_params}")
            model = xgb.XGBRegressor(**best_params, random_state=42, n_jobs=-1, early_stopping_rounds=30)
        else:
            model = xgb.XGBRegressor(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                min_child_weight=3,
                reg_alpha=0.1,
                reg_lambda=1.5,
                objective='reg:squarederror',
                random_state=42,
                n_jobs=-1,
                early_stopping_rounds=30
            )

        # Train
        print("Training final model...")
        model.fit(X_train, y_train,
                 eval_set=[(X_val, y_val)],
                 verbose=False)

        # Predictions
        y_pred_train = model.predict(X_train)
        y_pred_val = model.predict(X_val)
        y_pred_test = model.predict(X_test)

        # Metrics
        metrics = {
            'model': 'XGBoost',
            'train_mae': mean_absolute_error(y_train, y_pred_train),
            'val_mae': mean_absolute_error(y_val, y_pred_val),
            'test_mae': mean_absolute_error(y_test, y_pred_test),
            'train_rmse': np.sqrt(mean_squared_error(y_train, y_pred_train)),
            'val_rmse': np.sqrt(mean_squared_error(y_val, y_pred_val)),
            'test_rmse': np.sqrt(mean_squared_error(y_test, y_pred_test)),
            'train_r2': r2_score(y_train, y_pred_train),
            'val_r2': r2_score(y_val, y_pred_val),
            'test_r2': r2_score(y_test, y_pred_test),
            'train_mape': mean_absolute_percentage_error(y_train, y_pred_train) * 100,
            'test_mape': mean_absolute_percentage_error(y_test, y_pred_test) * 100,
        }

        print(f"\nXGBoost Results:")
        for k, v in metrics.items():
            if k not in ['model']:
                print(f"  {k}: {v:.4f}")

        # Feature importance
        importance_df = pd.DataFrame({
            'feature': self.feature_names,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)

        self.models['xgboost'] = model
        
        # Clear early_stopping_rounds for reuse in ensemble
        model.set_params(early_stopping_rounds=None)
        
        self.metrics_history.append(metrics)
        self.feature_importance = importance_df

        # Save
        self._save_model('xgboost', model, metrics, importance_df)
        return model, metrics, importance_df

    def train_lightgbm(self, tune_hyperparams: bool = False):
        """Train LightGBM model (fast, high accuracy)."""
        if not LIGHTGBM_AVAILABLE:
            print("LightGBM not installed, skipping")
            return None

        print("\n" + "="*60)
        print("Training LightGBM Model")
        print("="*60)

        model = lgb.LGBMRegressor(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=42,
            n_jobs=-1,
            verbose=-1
        )

        model.fit(self.X_train, self.y_train,
                  eval_set=[(self.X_val, self.y_val)],
                  eval_metric='mae',
                  callbacks=[lgb.early_stopping(30, verbose=False)])

        # Predictions
        y_pred_test = model.predict(self.X_test)
        test_mae = mean_absolute_error(self.y_test, y_pred_test)
        test_r2 = r2_score(self.y_test, y_pred_test)

        print(f"Test MAE: {test_mae:.4f}, R²: {test_r2:.4f}")

        self.models['lightgbm'] = model
        
        # Remove early stopping callback for ensemble compatibility
        model.set_params(callbacks=None)
        
        return model

    def train_random_forest(self):
        """Train Random Forest baseline."""
        print("\n" + "="*60)
        print("Training Random Forest (Baseline)")
        print("="*60)

        model = RandomForestRegressor(
            n_estimators=200,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )

        model.fit(self.X_train, self.y_train)

        y_pred_test = model.predict(self.X_test)
        test_mae = mean_absolute_error(self.y_test, y_pred_test)
        test_r2 = r2_score(self.y_test, y_pred_test)

        print(f"Test MAE: {test_mae:.4f}, R²: {test_r2:.4f}")

        self.models['random_forest'] = model
        return model

    def create_ensemble(self, models: list = None, method: str = 'voting'):
        """
        Create ensemble model combining multiple predictors.

        method: 'voting' (simple average) or 'stacking' (meta-learner)
        """
        print(f"\nCreating {method} ensemble...")

        if models is None:
            models = [(name, model) for name, model in self.models.items()]

        if method == 'voting':
            ensemble = VotingRegressor(estimators=models, weights=None)
        else:  # stacking
            from sklearn.linear_model import RidgeCV
            ensemble = StackingRegressor(
                estimators=models,
                final_estimator=RidgeCV(),
                cv=5,
                passthrough=False
            )

        ensemble.fit(self.X_train, self.y_train)
        y_pred_test = ensemble.predict(self.X_test)

        test_mae = mean_absolute_error(self.y_test, y_pred_test)
        test_r2 = r2_score(self.y_test, y_pred_test)

        print(f"Ensemble Test MAE: {test_mae:.4f}, R²: {test_r2:.4f}")

        self.models['ensemble'] = ensemble
        return ensemble

    def calculate_shap_values(self, model, X_sample: pd.DataFrame = None, n_samples: int = 100):
        """Calculate SHAP values for model interpretability."""
        if not SHAP_AVAILABLE:
            print("SHAP not available")
            return None

        print("\nCalculating SHAP values for model explainability...")

        if X_sample is None:
            X_sample = self.X_test.sample(min(n_samples, len(self.X_test)))

        # Create explainer (TreeExplainer for tree-based models)
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_sample)

        # Save
        shap_output = {
            'shap_values': shap_values,
            'X_sample': X_sample.values,
            'feature_names': self.feature_names
        }

        with open(self.output_dir / "shap_values.pkl", 'wb') as f:
            pickle.dump(shap_output, f)

        print(f"SHAP values saved ({shap_values.shape})")

        return shap_values, explainer

    def evaluate_all_models(self):
        """Comprehensive evaluation of all trained models."""
        print("\n" + "="*70)
        print("COMPREHENSIVE MODEL EVALUATION")
        print("="*70)

        results = []
        for name, model in self.models.items():
            y_pred = model.predict(self.X_test)

            metrics = {
                'model': name,
                'test_mae': mean_absolute_error(self.y_test, y_pred),
                'test_rmse': np.sqrt(mean_squared_error(self.y_test, y_pred)),
                'test_r2': r2_score(self.y_test, y_pred),
                'test_mape': mean_absolute_percentage_error(self.y_test, y_pred) * 100,
                'test_medae': median_absolute_error(self.y_test, y_pred),
            }
            results.append(metrics)

        results_df = pd.DataFrame(results).sort_values('test_mae')
        print("\n" + results_df.to_string(index=False, float_format='%.4f'))

        # Save results
        results_df.to_csv(self.output_dir / "model_comparison.csv", index=False)
        print(f"\nResults saved to {self.output_dir}/model_comparison.csv")

        return results_df

    def _save_model(self, name: str, model, metrics: dict, importance: pd.DataFrame):
        """Save model with metadata."""
        # Save model
        with open(self.output_dir / f"model_{name}.pkl", 'wb') as f:
            pickle.dump({'model': model, 'scaler': self.scaler, 'feature_names': self.feature_names}, f)

        # Save metrics
        with open(self.output_dir / f"metrics_{name}.json", 'w') as f:
            json.dump(metrics, f, indent=2)

        # Save feature importance
        importance.to_csv(self.output_dir / f"importance_{name}.csv", index=False)

        print(f"Saved {name} model and artifacts")

    def save_scaler(self):
        """Save the scaler for inference."""
        with open(self.output_dir / "scaler.pkl", 'wb') as f:
            pickle.dump(self.scaler, f)
        print("Scaler saved")

    def save_feature_names(self):
        """Save feature names for inference."""
        with open(self.output_dir / "feature_names.txt", 'w') as f:
            f.write('\n'.join(self.feature_names))
        print("Feature names saved")

    def run_full_training_pipeline(self, X_path: str = None, y_path: str = None, features_path: str = None):
        """
        Complete training pipeline.

        Parameters
        ----------
        X_path : str, optional
            Path to feature CSV. If None, loads from default location.
        y_path : str, optional
            Path to target CSV. If None, loads from default location.
        features_path : str, optional
            Path to feature names text file.
        """
        print("\n" + "="*70)
        print("ADVANCED F1 LAP TIME MODEL TRAINING PIPELINE")
        print("="*70)

        # Step 1: Load
        if X_path is None or y_path is None:
            # Auto-detect data dir
            data_dir = Path("f1_simulator/model")
            X_path = X_path or data_dir / "X_processed.csv"
            y_path = y_path or data_dir / "y.csv"
            features_path = features_path or data_dir / "feature_names.txt"

        self.load_data(str(X_path), str(y_path), str(features_path) if features_path else None)

        # Step 2: Split
        self.split_and_scale()

        # Step 3: Train individual models
        self.train_random_forest()
        if XGBOOST_AVAILABLE:
            self.train_xgboost(tune_hyperparams=True, n_trials=30)
        if LIGHTGBM_AVAILABLE:
            self.train_lightgbm()

        # Step 4: Create ensemble
        if len(self.models) >= 2:
            self.create_ensemble(method='voting')

        # Step 5: Evaluate
        results_df = self.evaluate_all_models()

        # Step 6: SHAP explainability
        if SHAP_AVAILABLE and 'xgboost' in self.models:
            shap_values, explainer = self.calculate_shap_values(self.models['xgboost'])

        # Step 7: Save all
        self.save_scaler()
        self.save_feature_names()

        # Save best model as default model.pkl for backward compatibility
        best_model_name = results_df.iloc[0]['model']
        best_model = self.models[best_model_name]
        best_mae = results_df.iloc[0]['test_mae']
        print(f"\n[OK] Best model: {best_model_name} (MAE: {best_mae:.3f}s)")

        # Save as default model.pkl in parent directory
        default_path = self.output_dir.parent / "model.pkl"
        with open(default_path, 'wb') as f:
            pickle.dump({'model': best_model, 'scaler': self.scaler, 'feature_names': self.feature_names}, f)
        print(f"[OK] Saved default model to {default_path}")

        self.best_model = best_model
        return best_model, results_df


if __name__ == "__main__":
    print("="*70)
    print("F1 ADVANCED MODEL TRAINING")
    print("="*70)

    # Check if processed data exists
    data_dir = Path("f1_simulator/model")
    if not (data_dir / "X_processed.csv").exists():
        print("\nNo processed data found!")
        print("Please run the pipeline in order:")
        print("  1. python real_data_db.py")
        print("  2. python data_fetcher.py")
        print("  3. python feature_engineering.py")
        print("\nOr use the one-click setup:")
        print("  run_f1_simulator.bat")
        exit(1)

    # Run training pipeline
    trainer = AdvancedModelTrainer()
    best_model, results = trainer.run_full_training_pipeline()

    print("\n" + "="*70)
    print("TRAINING COMPLETE")
    print("="*70)
    print(f"Best model: {type(best_model).__name__}")
    print(f"MAE: {results.iloc[0]['test_mae']:.3f}s")
    print(f"R²:  {results.iloc[0]['test_r2']:.3f}")
    print("\nNext: Run launch_ui.bat to start the simulation UI")
