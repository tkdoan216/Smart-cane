import React, { useEffect, useRef, useState } from 'react';
import { Button, PermissionsAndroid, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { atob } from 'react-native-quick-base64';
import Tts from 'react-native-tts';

const DEVICE_NAME = 'Vietduino_Sensor_Hub';
const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const SENSOR_DATA_CHAR_UUID = '12345678-1234-1234-1234-123456789abd';

export default function HomeScreen() {
  const managerRef = useRef<BleManager | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    managerRef.current = new BleManager();
    return () => {
      managerRef.current?.destroy();
    };
  }, []);

  // Android permissions
  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]).catch(() => {});
    }
  }, []);

  const scanAndConnect = async () => {
    setError(null);
    setIsScanning(true);
    setData(null);
    setConnected(false);
    const manager = managerRef.current;
    if (!manager) return;
    manager.startDeviceScan(null, null, async (err, scannedDevice) => {
      if (err) {
        setError(err.message);
        setIsScanning(false);
        manager.stopDeviceScan();
        return;
      }
      if (scannedDevice && scannedDevice.name === DEVICE_NAME) {
        manager.stopDeviceScan();
        setIsScanning(false);
        try {
          const connectedDevice = await scannedDevice.connect();
          setConnected(true);
          await connectedDevice.discoverAllServicesAndCharacteristics();
          // Read the full data once after connecting
          readSensorData(connectedDevice);
          subscribeToSensorData(connectedDevice);
        } catch (e: any) {
          setError(e.message);
        }
      }
    });
    // Stop scan after 10 seconds
    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  const subscribeToSensorData = async (connectedDevice: any) => {
    try {
      await connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        SENSOR_DATA_CHAR_UUID,
        async (error: any, characteristic: any) => {
          if (error) {
            setError(error.message);
            return;
          }
          if (characteristic?.value) {
            try {
              // Only trigger a READ when NOTIFY is received, do not parse or log NOTIFY data
              await readSensorData(connectedDevice);
            } catch {
              setError('Failed to trigger read after NOTIFY');
            }
          }
        }
      );
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Read the full data from the characteristic
  const readSensorData = async (connectedDevice: any) => {
    try {
      const char = await connectedDevice.readCharacteristicForService(
        SERVICE_UUID,
        SENSOR_DATA_CHAR_UUID
      );
      if (char?.value) {
        // Log the raw base64 data from READ
        console.log('READ Raw base64:', char.value);
        const json = atob(char.value);
        // Log the decoded string from READ
        console.log('READ Decoded string:', json);
        setData(JSON.parse(json)); // Only update data from READ
      }
    } catch (e: any) {
      setError('Failed to read sensor data: ' + e.message);
    }
  };

  const speak = async () => {
    Tts.speak('Hello, world!');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>BLE Sensor Hub Demo</Text>
      <Button title={isScanning ? 'Scanning...' : 'Scan & Connect'} onPress={scanAndConnect} disabled={isScanning || connected} />
      {connected && <Text style={styles.connected}>Connected to {DEVICE_NAME}</Text>}
      {error && <Text style={styles.error}>Error: {error}</Text>}
      <Text style={styles.subtitle}>Latest Sensor Data:</Text>
      <View style={styles.dataBox}>
        <Text selectable style={styles.dataText}>{data ? JSON.stringify(data, null, 2) : 'No data yet.'}</Text>
      </View>
      <Button title="Press to hear some words" onPress={speak} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  connected: {
    color: 'green',
    marginVertical: 8,
  },
  error: {
    color: 'red',
    marginVertical: 8,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 24,
    marginBottom: 8,
  },
  dataBox: {
    width: '100%',
    minHeight: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  dataText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 14,
  },
});
