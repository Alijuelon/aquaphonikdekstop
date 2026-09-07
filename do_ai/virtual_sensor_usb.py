import joblib
import pandas as pd
import json
import time
import serial
import serial.tools.list_ports
import warnings
from sklearn.exceptions import InconsistentVersionWarning

# Abaikan warning perbedaan versi scikit-learn
warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

# ==============================================================================
# CONFIGURATION
# ==============================================================================
MODEL_PATH = 'virtual_sensor_do_gabungan.pkl'
BAUD_RATE = 115200

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
    exit(1)

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

def prediksi_do(temp, ph, tds, turbidity):
    # Buat input fitur
    input_df = rekayasa_fitur(temp, ph, tds, turbidity)
    
    # Jalankan prediksi
    hasil = model.predict(input_df)[0]
    return hasil

# ==============================================================================
# SERIAL COMMUNICATION SETUP
# ==============================================================================
def find_available_port():
    ports = serial.tools.list_ports.comports()
    if not ports:
        return None
    
    print("Daftar Port Serial yang ditemukan:")
    for i, port in enumerate(ports):
        print(f"  {i+1}. {port.device} - {port.description}")
    
    # Pilih port pertama secara otomatis
    selected_port = ports[0].device
    return selected_port

def connect_serial():
    port = find_available_port()
    if not port:
        print("❌ Tidak ada perangkat USB Serial yang terdeteksi.")
        return None

    try:
        print(f"🔄 Menghubungkan ke {port} dengan baudrate {BAUD_RATE}...")
        ser = serial.Serial(port, BAUD_RATE, timeout=1)
        # Beri waktu sejenak agar koneksi serial stabil (biasa untuk Arduino/ESP32)
        time.sleep(2)
        print(f"✅ Berhasil terhubung ke {port}!\n")
        return ser
    except serial.SerialException as e:
        print(f"❌ Gagal terhubung ke {port}: {e}")
        return None

# ==============================================================================
# MAIN LOOP
# ==============================================================================
def main():
    ser = connect_serial()
    
    if not ser:
        print("Pastikan perangkat sensor (ESP32/Arduino) sudah terhubung ke USB.")
        exit(1)

    print("📡 Menunggu data dari sensor...\n")
    print("=" * 60)

    try:
        while True:
                try:
                    if ser.in_waiting > 0:
                        # Baca dan decode bytes ke string UTF-8, bersihkan spasi/newline
                        raw_line = ser.readline().decode('utf-8').strip()
                        
                        # Abaikan baris kosong atau pesan debug (harus format JSON yang diawali '{')
                        if not raw_line or not raw_line.startswith('{'):
                            continue

                        # Parsing JSON
                        sensor_data = json.loads(raw_line)

                        # Ekstraksi nilai yang dibutuhkan dari format JSON sensor
                        # Menggunakan keys yang sama dengan yang ada di serial.ts desktop app
                        sample_temp = float(sensor_data.get('temp_water', 0))
                        sample_ph = float(sensor_data.get('ph', 0))
                        sample_tds = float(sensor_data.get('tds', 0))
                        sample_turbidity = float(sensor_data.get('turbidity', 0))

                        print(f"📥 Input Sensor [USB]: Suhu: {sample_temp} °C | pH: {sample_ph} | TDS: {sample_tds} ppm | Turbidity: {sample_turbidity} NTU")

                        # Melakukan prediksi menggunakan model AI
                        hasil_prediksi = prediksi_do(sample_temp, sample_ph, sample_tds, sample_turbidity)

                        # Output Hasil Prediksi
                        print(f"📊 HASIL PREDIKSI DO: {hasil_prediksi:.2f} mg/L")

                        if hasil_prediksi < 5.0:
                            print("   ⚠️ STATUS: Di bawah batas kritis (< 5.0 mg/L)!")
                        else:
                            print("   ✅ STATUS: Kondisi Oksigen Normal.")
                        
                        print("-" * 60)

                except json.JSONDecodeError:
                    print(f"❌ [Error] Data yang diterima bukan JSON yang valid: {raw_line[:50]}...")
                except ValueError as ve:
                    print(f"❌ [Error] Terdapat nilai sensor yang tidak valid (bukan angka): {ve}")
                except serial.SerialException as se:
                    print(f"\n❌ [Koneksi Terputus] {se}")
                    print("Kemungkinan penyebab:")
                    print("1. Kabel USB sensor tercabut.")
                    print("2. Aplikasi Desktop (Electron) sedang terbuka dan menggunakan port yang sama.")
                    print("Silakan tutup aplikasi desktop atau program lain yang menggunakan Serial Monitor, lalu coba lagi.")
                    break
                except Exception as ex:
                    print(f"❌ [Error] Terjadi kesalahan tak terduga: {ex}")

            # Sleep sejenak untuk menghindari CPU load tinggi
            time.sleep(0.01)

    except KeyboardInterrupt:
        print("\n🛑 Program dihentikan oleh pengguna (Ctrl+C).")
    finally:
        if ser and ser.is_open:
            ser.close()
            print("🔒 Port Serial telah ditutup.")

if __name__ == "__main__":
    main()
