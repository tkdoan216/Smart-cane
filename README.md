# Smart Blind Assistance Cane

An IoT smart cane project for assisting visually impaired users. The system includes:

- An ESP32-based cane firmware that reads obstacle sensors and controls vibration / buzzer alerts.
- An Expo React Native mobile app that connects to the sensor hub over BLE and displays sensor data.

## Members

- Huynh Minh Duc - 104240434
- Huynh Ngoc Phuong Thao - 104240544
- Tran Khanh Doan - 104240544

## Repository Structure

```text
.
|-- app/                  # Expo Router screens
|-- assets/               # App images and fonts
|-- components/           # Shared React Native components
|-- constants/            # App constants
|-- hooks/                # Shared React hooks
|-- android/              # Expo prebuild Android project
|-- firmware/
|   `-- arduino/          # ESP32 / Arduino firmware
|-- scripts/              # Project helper scripts
|-- app.json              # Expo configuration
|-- package.json          # Mobile app dependencies and scripts
`-- tsconfig.json         # TypeScript configuration
```

## Mobile App

The mobile app is built with Expo, React Native, Expo Router, and `react-native-ble-plx`.

### Features

- Scans for the BLE device named `Vietduino_Sensor_Hub`.
- Connects to the configured BLE service and characteristic.
- Reads sensor data from the cane and displays the latest JSON payload.
- Includes text-to-speech support through `react-native-tts`.

### Setup

```bash
npm install
npm start
```

Useful scripts:

```bash
npm run android
npm run ios
npm run web
npm run lint
```

## Firmware

The Arduino firmware is located at:

```text
firmware/arduino/smartcanearduino.ino
```

### Hardware Components

- ESP32 Vietduino
- HC-SR04 ultrasonic sensor
- VL53L0X laser ToF distance sensor
- Vibration motor module
- SOS button / joystick button
- Buzzer
- Jumper wires

### Wiring

| Component | ESP32 Pin |
|---|---|
| HC-SR04 VCC | VIN / 5V |
| HC-SR04 GND | GND |
| HC-SR04 TRIG | IO2 |
| HC-SR04 ECHO | IO4 |
| VL53L0X VIN | 3V3 |
| VL53L0X GND | GND |
| VL53L0X SDA | IO18 |
| VL53L0X SCL | IO19 |
| Vibration Motor IN | IO27 |
| SOS Button SW | IO25 |
| Buzzer + | IO26 |
| Buzzer - | GND |

### Distance Detection Logic

The cane reads both the ultrasonic sensor and the VL53L0X laser sensor, then chooses the safest valid distance.

| Sensor Condition | Selected Distance |
|---|---|
| Both sensors work | Smaller distance |
| Ultrasonic fails | VL53L0X distance |
| VL53L0X fails | Ultrasonic distance |
| Both sensors fail | Unknown |

### Warning Logic

| Distance | Status | Motor Feedback |
|---|---|---|
| Less than 10 cm | Strong warning | Strong continuous vibration |
| 10 cm to 30 cm | Normal warning | Light intermittent vibration |
| More than 30 cm | Safe | No vibration |
| Unknown | Unknown | Motor off |

## Notes

Generated dependencies and build outputs are intentionally excluded from Git. Run `npm install` and rebuild native projects locally when needed.
