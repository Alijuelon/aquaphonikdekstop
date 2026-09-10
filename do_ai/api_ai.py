# pyrefly: ignore [missing-import]
import joblib
import pandas as pd
# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify
from flask_cors import CORS
import warnings
from sklearn.exceptions import InconsistentVersionWarning
# pyrefly: ignore [missing-import]
import gspread
# pyrefly: ignore [missing-import]
from google.oauth2.service_account import Credentials
from datetime import datetime

import os
import sys

# Abaikan warning perbedaan versi scikit-learn
warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

app = Flask(__name__)
CORS(app)

# ==============================================================================
# CONFIGURATION
# ==============================================================================
def get_resource_path(relative_path):
    """ Dapatkan path absolut, mendukung mode normal maupun PyInstaller """
    try:
        # PyInstaller membuat folder temp pada sys._MEIPASS saat runtime
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_path, relative_path)

MODEL_PATH = get_resource_path('virtual_sensor_do_gabungan.pkl')

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

# ==============================================================================
# GOOGLE SHEETS SETUP
# ==============================================================================
try:
    print("🔄 Menghubungkan ke Google Sheets...")
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]
    creds_path = get_resource_path("credentials.json")
    creds = Credentials.from_service_account_file(creds_path, scopes=scopes)
    client = gspread.authorize(creds)
    
  # Gunakan ID unik yang diambil dari tengah-tengah URL Anda
# pyrefly: ignore [parse-error]
    id_sheet = "1h3HiHlQ3g8YyYtP7Ta7kvek3--7dZcJifm1kYFd5pKM"
    sheet = client.open_by_key(id_sheet).sheet1

    # (Opsional) Buat Header jika kosong
    if not sheet.row_values(1):
        sheet.append_row(['Timestamp', 'Suhu', 'pH', 'TDS', 'Turbidity', 'DO_Prediksi', 'DO_Asli'])
    print("✅ Berhasil terhubung ke Google Sheets!\n")
except Exception as e:
    print(f"❌ Gagal menghubungkan ke Google Sheets: {e}")
    sheet = None

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

        # Ambil DO asli jika dikirim oleh sensor pembanding (default 0 jika tidak ada)
        do_real = float(data.get('do_real', 0))

        status_msg = "Di bawah batas kritis (< 5.0 mg/L)!" if hasil_prediksi < 5.0 else "Kondisi Oksigen Normal."
        is_critical = bool(hasil_prediksi < 5.0)

        # Simpan Langsung ke Google Drive
        if sheet is not None:
            try:
                waktu_sekarang = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                # Typo waktu_ssheeekarang sudah diperbaiki menjadi waktu_sekarang
                baris_baru = [waktu_sekarang, sample_temp, sample_ph, sample_tds, sample_turbidity, round(float(hasil_prediksi), 2), do_real]
                sheet.append_row(baris_baru)
                print("✅ Data berhasil disimpan ke Google Sheets.")
            except Exception as e:
                print(f"⚠️ Gagal menyimpan ke Google Sheets: {e}")

        # Print ke terminal (console)
        print("\n" + "="*40)
        print(f"📡 DATA SENSOR MASUK:")
        print(f"   - Suhu Air : {sample_temp} °C")
        print(f"   - pH       : {sample_ph}")
        print(f"   - TDS      : {sample_tds} ppm")
        print(f"   - Turbidity: {sample_turbidity} NTU")
        print(f"🤖 HASIL PREDIKSI AI:")
        print(f"   - DO       : {round(float(hasil_prediksi), 2)} mg/L")
        print(f"   - Status   : {status_msg}")
        print("="*40 + "\n")

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
    # pyrefly: ignore [name-defined]
    app.run(host='0.0.0.0', port=5001, debug=False)