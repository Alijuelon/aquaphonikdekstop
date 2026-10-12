#!/usr/bin/env python3
import sys
import time

try:
    import serial
except ImportError:
    print("Modul pyserial belum terinstall. Install dengan: pip install pyserial")
    sys.exit(1)

PORT = "/dev/ttyUSB0"
BAUD = 115200

print("=" * 60)
print(f"📡 MEMBUKA PORT {PORT} @ {BAUD} BAUD...")
print("=" * 60)

try:
    ser = serial.Serial(PORT, BAUD, timeout=1)
except serial.SerialException as e:
    print(f"\n❌ GAGAL MEMBUKA PORT: {e}")
    print("Kemungkinan penyebab:")
    print("1. Arduino IDE Serial Monitor sedang terbuka (Tutup tab Serial Monitor di Arduino IDE).")
    print("2. Kabel USB Arduino Mega terlepas.")
    sys.exit(1)

# Memicu hardware reset Arduino via DTR agar boot dari awal
print("🔄 Mengirim sinyal reset ke Arduino Mega...")
ser.dtr = True
time.sleep(0.1)
ser.dtr = False
time.sleep(0.5)

print("✅ Terhubung! Menampilkan data sensor realtime:")
print("   (Tekan Ctrl + C di terminal untuk keluar)\n")
print("-" * 60)

count = 0
try:
    while True:
        raw_line = ser.readline().decode("utf-8", errors="replace").strip()
        if raw_line:
            if raw_line.startswith("{") and raw_line.endswith("}"):
                count += 1
                print(f"[{count:03d}] 📊 JSON: {raw_line}")
            else:
                print(f"       ℹ️ LOG : {raw_line}")
except KeyboardInterrupt:
    print("\n\n⏹️ Monitoring dihentikan oleh pengguna.")
finally:
    ser.close()
    print("🔌 Port serial berhasil ditutup.")
