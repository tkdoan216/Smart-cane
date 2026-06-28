#include <Wire.h>
#include "Adafruit_VL53L0X.h"

#define TRIG_PIN 2
#define ECHO_PIN 4

#define MOTOR_PIN 27
#define BUTTON_PIN 25
#define BUZZER_PIN 26

#define SDA_PIN 18
#define SCL_PIN 19

Adafruit_VL53L0X lox = Adafruit_VL53L0X();
bool laserOK = false;

long readUltrasonic() {
  long total = 0;
  int count = 0;

  for (int i = 0; i < 5; i++) {
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);

    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    long duration = pulseIn(ECHO_PIN, HIGH, 30000);

    if (duration > 0) {
      long distance = duration * 0.0343 / 2;

      if (distance >= 2 && distance <= 400) {
        total += distance;
        count++;
      }
    }

    delay(10);
  }

  if (count == 0) return -1;
  return total / count;
}

int readLaser() {
  if (!laserOK) return -1;

  int total = 0;
  int count = 0;

  for (int i = 0; i < 5; i++) {
    VL53L0X_RangingMeasurementData_t measure;
    lox.rangingTest(&measure, false);

    if (measure.RangeStatus != 4) {
      int distance = measure.RangeMilliMeter / 10;

      if (distance >= 3 && distance <= 120) {
        total += distance;
        count++;
      }
    }

    delay(20);
  }

  if (count == 0) return -1;
  return total / count;
}

int getBestDistance(long ultrasonic, int laser) {
  if (ultrasonic == -1 && laser == -1) return -1;
  if (ultrasonic == -1) return laser;
  if (laser == -1) return ultrasonic;

  // Use the smaller distance for safer obstacle warnings.
  return min((int)ultrasonic, laser);
}

void controlMotor(int distance) {
  if (distance == -1) {
    digitalWrite(MOTOR_PIN, LOW);
    return;
  }

  if (distance < 10) {
    // Strong continuous vibration.
    digitalWrite(MOTOR_PIN, HIGH);
    delay(100);

  } else if (distance <= 30) {
    // Light intermittent vibration.
    digitalWrite(MOTOR_PIN, HIGH);
    delay(100);
    digitalWrite(MOTOR_PIN, LOW);
    delay(300);

  } else {
    // Safe range.
    digitalWrite(MOTOR_PIN, LOW);
    delay(200);
  }
}

void beepBeep() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    delay(150);
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  pinMode(MOTOR_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  digitalWrite(MOTOR_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  Wire.begin(SDA_PIN, SCL_PIN);
  delay(1000);

  Serial.println("Smart Blind Cane Started");

  if (lox.begin()) {
    laserOK = true;
    Serial.println("VL53L0X OK");
  } else {
    laserOK = false;
    Serial.println("VL53L0X NOT FOUND - using ultrasonic only");
  }
}

void loop() {
  // Pressing the SOS button triggers the buzzer alert.
  if (digitalRead(BUTTON_PIN) == LOW) {
    Serial.println("SOS BUTTON PRESSED - BEEP BEEP");
    beepBeep();
    delay(300);
  }

  long ultrasonicDistance = readUltrasonic();
  int laserDistance = readLaser();

  int bestDistance = getBestDistance(ultrasonicDistance, laserDistance);

  Serial.print("Ultrasonic: ");
  if (ultrasonicDistance == -1) Serial.print("N/A");
  else {
    Serial.print(ultrasonicDistance);
    Serial.print(" cm");
  }

  Serial.print(" | Laser: ");
  if (laserDistance == -1) Serial.print("N/A");
  else {
    Serial.print(laserDistance);
    Serial.print(" cm");
  }

  Serial.print(" | Best: ");
  if (bestDistance == -1) Serial.print("N/A");
  else {
    Serial.print(bestDistance);
    Serial.print(" cm");
  }

  Serial.print(" | Status: ");

  if (bestDistance == -1) {
    Serial.println("UNKNOWN");
  } else if (bestDistance < 10) {
    Serial.println("STRONG WARNING");
  } else if (bestDistance <= 30) {
    Serial.println("NORMAL WARNING");
  } else {
    Serial.println("SAFE");
  }

  controlMotor(bestDistance);
}
