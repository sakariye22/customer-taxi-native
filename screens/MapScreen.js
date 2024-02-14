import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';

export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [region, setRegion] = useState({
    latitude: 59.403160, // These coordinates should be set to your desired initial region
    longitude: 17.944830,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      setRegion({
        ...region,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuPlaceholder}>
          {/* This is a placeholder for the menu icon */}
          <Text style={styles.menuText}>Menu</Text>
        </TouchableOpacity>
        <View style={styles.shieldPlaceholder}>
          {/* This is a placeholder for the shield icon */}
          <Text style={styles.menuText}></Text>
        </View>
      </View>
      {location ? (
        <MapView
          style={styles.map}
          region={region}
        >
          <Marker
            coordinate={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
            title="Your Location"
          />
          <Circle
            center={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
            radius={1000} // This should be set to the radius you want for the circle
            strokeWidth={1}
            strokeColor={'#1a66ff'}
            fillColor={'rgba(26, 102, 255, 0.3)'}
          />
        </MapView>
      ) : (
        <Text>{errorMsg || "Requesting location..."}</Text>
      )}
      <View style={styles.bottomPanel}>
        {/* Content of bottom panel will go here */}
      </View>
      <TouchableOpacity style={styles.onlineButton}>
        <Text style={styles.onlineButtonText}>Go online</Text>
      </TouchableOpacity>
      <View style={styles.navBar}>
        {/* Placeholder views for navigation bar icons */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 15,
    backgroundColor: '#000', // Assuming a dark
},
map: {
width: Dimensions.get('window').width,
height: Dimensions.get('window').height * 0.75, // Adjust based on your layout
},
menuPlaceholder: {
width: 25,
height: 25,
backgroundColor: '#ccc', // Placeholder color
justifyContent: 'center',
alignItems: 'center',
borderRadius: 4,
},
menuText: {
color: '#000', // Placeholder text color
fontWeight: 'bold',
},
shieldPlaceholder: {
width: 25,
height: 25,
backgroundColor: '#ccc', // Placeholder color
justifyContent: 'center',
alignItems: 'center',
borderRadius: 4,
},
bottomPanel: {
padding: 20,
backgroundColor: '#333', // Dark theme bottom panel
borderTopLeftRadius: 20,
borderTopRightRadius: 20,
alignItems: 'center',
},
onlineButton: {
backgroundColor: '#22bb33',
paddingVertical: 10,
paddingHorizontal: 20,
borderRadius: 20,
position: 'absolute',
bottom: 80, // Adjust based on your layout
alignSelf: 'center',
},
onlineButtonText: {
color: '#fff',
fontSize: 18,
fontWeight: 'bold',
},
navBar: {
flexDirection: 'row',
justifyContent: 'space-around',
alignItems: 'center',
padding: 10,
backgroundColor: '#222', // Assuming a dark theme navigation bar
position: 'absolute',
bottom: 0,
width: '100%',
},
// Add other styles for nav bar icons, text, etc.
});
