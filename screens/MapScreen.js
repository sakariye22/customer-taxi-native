import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { View, Text, Button, StyleSheet, Dimensions, TextInput, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

export default function MapScreen({ route, navigation }) {
  const { token, userId } = route.params;
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [destination, setDestination] = useState("");
  const [destinationCoords, setDestinationCoords] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Permission to access location was denied');
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
          id: `driver-${index}`,
          latitude: location.lat,
          longitude: location.lng,
        }));
        setDrivers(transformedData);
      } else {
        throw new Error(data.message || "Failed to fetch drivers' locations");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message);
    }
  };

  const requestRide = async () => {
    if (!destination.trim()) {
      Alert.alert("Error", "Please enter a destination.");
      return;
    }

    if (!location) {
      Alert.alert("Error", "Location not available.");
      return;
    }

    try {
      const response = await axios.post(
        'http://192.168.1.93:3001/api/request-ride',
        {
          userId,
          pickupCoordinates: [location.coords.longitude, location.coords.latitude],
          dropoffAddress: destination,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (response.status === 201) {
        Alert.alert("Success", "Ride requested successfully.");
      } else {
        throw new Error("Failed to request ride");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.response?.data?.message || "Failed to request ride.");
    }
  };

  const handlePress = (data, details = null) => {
    const address = details?.formatted_address;
    const coords = details?.geometry?.location;
    setDestination(address);
    if (coords) {
      setDestinationCoords({ latitude: coords.lat, longitude: coords.lng });
    }
  };


  return (
    <View style={styles.container}>
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}>
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
          />
          {drivers.map((driver) => (
            <Marker
              key={driver.id}
              coordinate={{
                latitude: driver.latitude,
                longitude: driver.longitude,
              }}
              title={`Driver ${driver.id}`}
              pinColor="blue"
            />
          ))}
        </MapView>
      )}
      <GooglePlacesAutocomplete
        placeholder="Enter destination"
        fetchDetails={true}
        onPress={(data, details = null) => {
          setDestination(details?.formatted_address);
        }}
        query={{
          key: '',
          language: 'en',
        }}
        styles={{
          textInputContainer: styles.inputContainer,
          textInput: styles.input,
          listView: styles.listView,
          separator: styles.separator,
        }}
        nearbyPlacesAPI="GooglePlacesSearch"
        debounce={400}
      />
      <Button title="Request Ride" onPress={requestRide} style={styles.button} />
      <Button title="Go to Logout" onPress={() => navigation.navigate('Logout')} style={styles.button} />
    </View>
  );
}const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
  },
  map: {
    ...StyleSheet.absoluteFillObject, 
  },
  inputContainer: {
    width: '90%',
    position: 'absolute',
    top: Constants.statusBarHeight, 
    alignSelf: 'center',
    zIndex: 10, 
    backgroundColor: 'white',
  },
  input: {
    height: 44,
    margin: 10, 
    padding: 10,
    backgroundColor: '#FFF',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
  },
  listView: {
    position: 'absolute',
    top: 64, 
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
  },
  button: {
    marginBottom: 10, 
    width: '90%',
    alignSelf: 'center',
  },
});
