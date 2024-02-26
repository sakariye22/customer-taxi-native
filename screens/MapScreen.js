import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { View, Text, Button, StyleSheet, Dimensions, TextInput, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import {API_KEY} from '@env';

export default function MapScreen({ route, navigation }) {
  const { token, userId } = route.params;
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('');
const [dropoffAddress, setDropoffAddress] = useState('');

useEffect(() => {
  (async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Permission to access location was denied');
      return;
    }

    let currentLocation = await Location.getCurrentPositionAsync({});
    setLocation(currentLocation);
    
    setPickupCoords({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    });
    
    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    });

    if (reverseGeocode.length > 0) {
      const { street, name, city, region, postalCode } = reverseGeocode[0];
      const address = `${name || street}, ${city}, ${region} ${postalCode}`;
      setPickupAddress(address); 
    }
  })();

  const intervalId = setInterval(fetchDriverLocations, 10000);
  return () => clearInterval(intervalId);
}, []);

const fetchDriverLocations = async () => {
  try {
    const response = await fetch('http://192.168.1.93:3001/api/get-location/fordrivers');
    const { locations } = await response.json(); 

    if (response.ok && locations && Array.isArray(locations) && locations[0] !== null) {
      const validLocations = locations.map((location, index) => ({
        id: `driver-${index}`, 
        latitude: location.latitude,
        longitude: location.longitude,
      }));
      setDrivers(validLocations);
    } else {
      console.error("Received invalid driver locations:", locations);
      setErrorMsg("Failed to fetch valid driver locations.");
    }
  } catch (error) {
    console.error("Fetch driver locations error:", error);
    setErrorMsg(error.message || "Failed to fetch drivers' locations");
  }
};



const requestRide = async () => {
  if (!dropoffAddress || !pickupCoords || !destinationCoords) {
    Alert.alert("Error", "Please enter both pickup and destination.");
    return;
  }

  try {
    // Updated payload to match the backend schema expectations
    const rideRequestPayload = {
      userId,
      pickupLatitude: pickupCoords.latitude,
      pickupLongitude: pickupCoords.longitude,
      dropoffLatitude: destinationCoords.latitude,
      dropoffLongitude: destinationCoords.longitude,
      fare: 10, // Assuming the fare is predefined or calculated elsewhere
    };

    console.log("Requesting ride with data:", rideRequestPayload);

    const response = await axios.post(
      'http://192.168.1.93:3001/api/request-ride', 
      rideRequestPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.status === 200) {
      Alert.alert("Success", "Ride requested successfully.");
    } else {
      throw new Error("Failed to request ride");
    }
  } catch (error) {
    console.error(error);
    Alert.alert("Error", error.response?.data?.message || "Failed to request ride.");
  }
};



  
const handleDestinationSelect = async (data, details = null) => {
  try {
    const address = details?.formatted_address;
    setDropoffAddress(address); 
    if (details && details.geometry && details.geometry.location) {
      const { lat, lng } = details.geometry.location;
      setDestinationCoords({ latitude: lat, longitude: lng });
    } else {
      throw new Error("Invalid address format");
    }
  } catch (error) {
    console.error("Error selecting destination:", error);
    Alert.alert("Error", "Failed to select destination. Please try again.");
  }
};


/*
  const handleDestinationSelect = (data, details = null) => {
    const address = details?.formatted_address;
    const coords = details?.geometry?.location;
    setDestination(address); 
    if (coords) {
      setDestinationCoords({ latitude: coords.lat, longitude: coords.lng });
    }
  };

*/
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
          }}>
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="user"
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
      ) : null}   
      
    <GooglePlacesAutocomplete
  placeholder="Enter destination"
  fetchDetails={true}
  onPress={(data, details = null) => {
    const address = details?.formatted_address;
    setDropoffAddress(address); 
    const coords = details?.geometry?.location;
    if (coords) {
      setDestinationCoords({ latitude: coords.lat, longitude: coords.lng });
    }
  }}
  query={{
    key: API_KEY,
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
