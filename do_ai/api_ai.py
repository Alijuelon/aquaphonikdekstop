import joblib
import pandas as pd
from flask import Flask, request, jsonify
import warnings
from sklearn.exceptions import InconsistentVersionWarning

# Abaikan warning perbedaan versi scikit-learn
warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

app = Flask(__name__)

# ==============================================================================
# CONFIGURATION
# ==============================================================================
MODEL_PATH = 'virtual_sensor_do_gabungan.pkl'

# ==============================================================================
# ML MODEL SETUP
# ==============================================================================
try:
    print("🔄 Memuat model AI...")
    model = joblib.load(MODEL_PATH)
    print("✅ Model berhasil dimuat!\n")
except Exception as e:
    print(f"❌ Gagal memuat model: {e}")
    print("Harap pastikan file 'virtual_sensor_do_gabungan.pkl' berada di folder yang sama.")
    # Kita tetap izinkan Flask jalan agar API merespons dengan error yang jelas
    model = None

def rekayasa_fitur(temp, ph, tds, turbidity):
    """
    Menghitung fitur turunan persis sesuai saat training di Colab.
    """
    temp_squared = temp ** 2
    ph_temp = ph * temp
    tds_turbidity = tds * turbidity

    # Format data ke bentuk DataFrame dengan nama kolom yang identik
    df = pd.DataFrame([{
        'Temperature': temp,
        'pH': ph,
        'TDS': tds,
        'Turbidity': turbidity,
        'temp_squared': temp_squared,
        'ph_temp': ph_temp,
        'tds_turbidity': tds_turbidity
    }])
    return df

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"status": "error", "message": "Model tidak dapat dimuat di server AI"}), 500

    try:
        # Ambil data JSON dari request Express
        data = request.json
        if not data:
            return jsonify({"status": "error", "message": "Body request harus berupa JSON"}), 400

        # Ambil parameter
        sample_temp = float(data.get('temp_water', 0))
        sample_ph = float(data.get('ph', 0))
        sample_tds = float(data.get('tds', 0))
        sample_turbidity = float(data.get('turbidity', 0))

        # Buat input fitur dan jalankan prediksi
        input_df = rekayasa_fitur(sample_temp, sample_ph, sample_tds, sample_turbidity)
        hasil_prediksi = model.predict(input_df)[0]

        status_msg = "Di bawah batas kritis (< 5.0 mg/L)!" if hasil_prediksi < 5.0 else "Kondisi Oksigen Normal."
        is_critical = bool(hasil_prediksi < 5.0)

        # Kembalikan response JSON
        return jsonify({
            "status": "success",
            "data": {
                "do_prediction": round(float(hasil_prediksi), 2),
                "is_critical": is_critical,
                "status_message": status_msg,
                "input": {
                    "temp_water": sample_temp,
                    "ph": sample_ph,
                    "tds": sample_tds,
                    "turbidity": sample_turbidity
                }
            }
        })

    except ValueError as ve:
        return jsonify({"status": "error", "message": f"Input tidak valid (pastikan berupa angka): {str(ve)}"}), 400
    except Exception as ex:
        return jsonify({"status": "error", "message": f"Terjadi kesalahan internal: {str(ex)}"}), 500

if __name__ == '__main__':
    # Flask berjalan di port 5000 secara default
    app.run(host='0.0.0.0', port=5000, debug=False)
