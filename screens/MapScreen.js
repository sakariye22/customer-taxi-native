import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [drivers, setDrivers] = useState([
    ...Array.from({ length: 10 }, (_, index) => ({
      id: `driver${index + 1}`,
      latitude: 59.616417,
      longitude: 17.853167,
    })),
  ]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

     
      setDrivers(drivers.map(driver => ({
        ...driver,
        latitude: 59.616417 + (Math.random() - 0.5) * 0.01, 
        longitude: 17.853167 + (Math.random() - 0.5) * 0.01,
      })));


      const intervalId = setInterval(() => {
        setDrivers(drivers.map(driver => ({
          ...driver,
          latitude: driver.latitude + (Math.random() - 0.5) * 0.002,
          longitude: driver.longitude + (Math.random() - 0.5) * 0.002,
        })));
      }, 5000);

      return () => clearInterval(intervalId); 
    })();
  }, []);

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 59.616417, 
            longitude: 17.853167,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
          />
          {drivers.map(driver => (
            <Marker
              key={driver.id}
              coordinate={{
                latitude: driver.latitude,
                longitude: driver.longitude,
              }}
              title={driver.id}
              pinColor="blue" 
            />
          ))}
        </MapView>
      ) : (
        <Text>{errorMsg || "Requesting location..."}</Text>
      )}
      <Button title="Go to Logout" onPress={() => navigation.navigate('Logout')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
