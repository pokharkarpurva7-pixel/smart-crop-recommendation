print("TRAIN FILE STARTED")
import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

HERE = os.path.dirname(__file__)
DATA_PATH = os.path.join(HERE, '..', 'data', 'crop_data_sample.csv')
MODEL_DIR = os.path.join(HERE, '..', 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURE_COLS = ['N', 'P', 'K', 'temperature', 'humidity', 'pH', 'rainfall']

def load_data(path=DATA_PATH):
    df = pd.read_csv(path)
    return df

def train_and_save(df):
    X = df[FEATURE_COLS]
    y = df['crop']
    le = LabelEncoder()
    y_enc = le.fit_transform(y)


X_train, X_test, y_train, y_test = train_test_split(
    X, y_enc, test_size=0.2, random_state=42
)

pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('clf', RandomForestClassifier(n_estimators=200, random_state=42))
])

pipeline.fit(X_train, y_train)

preds = pipeline.predict(X_test)
acc = accuracy_score(y_test, preds)
print(f"Test accuracy: {acc:.4f}")
print(classification_report(y_test, preds, target_names=le.classes_))

joblib.dump(pipeline, os.path.join(MODEL_DIR, 'pipeline.joblib'))
joblib.dump(le, os.path.join(MODEL_DIR, 'label_encoder.joblib'))
print(f"Saved pipeline and label encoder to {MODEL_DIR}")

if __name__ == "__main__":
    df = load_data()
    train_and_save(df)