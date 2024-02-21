import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();

    const intervalId = setInterval(fetchDriverLocations, 10000); 

    return () => clearInterval(intervalId);
  }, []);

  const fetchDriverLocations = async () => {
    try {
      const response = await fetch('http://192.168.1.93:3001/api/get-location/fordrivers');
      const data = await response.json();
      console.log("Fetched driver locations:", data); 

      if (response.ok) {
        const transformedData = data.locations.map((location, index) => ({

          id: driver-${index},
          latitude: location.lat,
          longitude: location.lng,
        }));
        setDrivers(transformedData);
        console.log("senaste uppdatering:", transformedData);
      } else {
        throw new Error(data.message || "Failed to fetch drivers' locations");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message);
    }
  };
return (
    <View style={styles.container}>
      {location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude, 
            longitude: location.coords.longitude,
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
          {drivers.map((driver) => (
            <Marker
              key={driver._id} 
              coordinate={{
                latitude: driver.latitude,
                longitude: driver.longitude,
              }}
              title={Driver ${driver.id}}
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
﻿
