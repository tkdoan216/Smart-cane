# Members

Huynh Minh Duc - 104240434

Huynh Ngoc Phuong Thao - 104240544

Tran Khanh Doan - 104240544


# Smart Blind Assistance Cane

An IoT-based smart cane designed to assist visually impaired people by detecting nearby obstacles and providing real-time alerts through vibration and sound.

The system uses two distance sensors: an ultrasonic sensor and a VL53L0X laser ToF sensor. Both sensors work together to improve obstacle detection accuracy and user safety.

## Features

- Detects obstacles in front of the cane
- Uses two sensors for better distance measurement
- Selects the safer and more reliable distance value
- Provides vibration feedback based on obstacle distance
- Includes an SOS button with buzzer alert
- Can continue working even if one distance sensor fails

## Hardware Components

- ESP32 Vietduino
- HC-SR04 Ultrasonic Sensor
- VL53L0X Laser ToF Distance Sensor
- Vibration Motor Module
- SOS Button / Joystick Button
- Buzzer
- Jumper Wires

## Wiring

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

## Distance Detection Logic

The cane uses both the ultrasonic sensor and the VL53L0X laser sensor to measure the distance to obstacles.

The ultrasonic sensor is useful for detecting larger objects and obstacles at a longer range.  
The VL53L0X laser ToF sensor is useful for detecting smaller or lower obstacles with better short-range accuracy.

Both sensors are read at the same time. After that, the system chooses the final distance using this logic:

| Sensor Condition | Selected Distance |
|---|---|
| Both sensors work | Choose the smaller distance |
| Ultrasonic fails | Use VL53L0X distance |
| VL53L0X fails | Use ultrasonic distance |
| Both sensors fail | Distance is unknown |

The smaller distance is selected when both sensors work because safety is the priority. If one sensor detects an obstacle closer than the other sensor, the cane should warn the user based on the closer object.

## Warning Logic

After selecting the best distance, the system controls the vibration motor:

| Distance | Status | Motor Feedback |
|---|---|---|
| Less than 10 cm | Strong Warning | Strong continuous vibration |
| 10 cm to 30 cm | Normal Warning | Light intermittent vibration |
| More than 30 cm | Safe | No vibration |
| Unknown | Unknown | Motor off |

## SOS Button Logic

The cane also includes an SOS button.

When the SOS button is pressed:

1. ESP32 detects the button input.
2. The buzzer is activated.
3. The buzzer produces a beep-beep alert sound.
4. This can be used as an emergency warning signal.

## How the System Works

1. ESP32 starts the system.
2. The ultrasonic sensor measures obstacle distance.
3. The VL53L0X laser sensor measures obstacle distance.
4. ESP32 compares both sensor values.
5. The closer valid distance is selected.
6. The vibration motor gives feedback based on distance.
7. If the SOS button is pressed, the buzzer creates an alert sound.

## Code Structure

The Arduino code includes these main functions:

| Function | Purpose |
|---|---|
| `readUltrasonic()` | Reads distance from the HC-SR04 ultrasonic sensor |
| `readLaser()` | Reads distance from the VL53L0X laser sensor |
| `getBestDistance()` | Compares both sensor values and selects the safest distance |
| `controlMotor()` | Controls vibration feedback based on distance |
| `beepBeep()` | Activates the buzzer for SOS alert |

## Arduino Code Location

```text
smartcanearduino/smartcanearduino.ino
