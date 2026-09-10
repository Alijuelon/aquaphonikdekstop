# pyrefly: ignore [missing-import]
import joblib
import pandas as pd

model = joblib.load('virtual_sensor_do_gabungan.pkl')
print(type(model))
if hasattr(model, 'feature_names_in_'):
    print("Features expected:", model.feature_names_in_)
elif hasattr(model, 'steps'):
    print("Pipeline steps:", model.steps)
    if hasattr(model.steps[0][1], 'feature_names_in_'):
        print("Features expected by first step:", model.steps[0][1].feature_names_in_)
