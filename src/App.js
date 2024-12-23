import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Search from './Search';
import axios from 'axios';



delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function App() {
  const [location, setLocation] = useState({ lat: 26.913837, lng: 80.941244 }); // Default location
  const [userLocation, setUserLocation] = useState({ lat: 26.913837, lng: 80.941244 }); // Store user's fetched location
  const [pointerLocation, setPointerLocation] = useState({ lat: 26.913837, lng: 80.941244 }); // Pointer location
  const [customPointerLocation, setCustomPointerLocation] = useState({ lat: 26.913837, lng: 80.941244 }); // Custom pointer location

  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [categoryPlaces, setCategoryPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [placeDetails, setPlaceDetails] = useState(null);

  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [lowAccuracy, setLowAccuracy] = useState(false);

  const [pointerPopupText, setPointerPopupText] = useState('You are here!');
 

  // Marker Icon to indicate default, fetched, or searched location
  const pointerIcon = new L.Icon({
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    iconSize: [25, 41], // Size of the marker
    iconAnchor: [12, 41], // Point of the icon which will correspond to marker's position
    popupAnchor: [1, -34], // Popup position
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    shadowSize: [41, 41], // Shadow size
  });

  useEffect(() => {
    // Attempt to fetch the user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // If permission granted, update location and user location state
        setLocation({
          lat: latitude,
          lng: longitude,
        });
        setUserLocation({
          lat: latitude,
          lng: longitude,
        });
        setCustomPointerLocation({
          lat: latitude,
          lng: longitude,
        });
        setPointerLocation({ lat: latitude, lng: longitude });
        setPointerPopupText(accuracy > 100 ? 'You are here, but location accuracy is low.' : 'You are here!');
        setHasLocationPermission(true);

        setLowAccuracy(accuracy > 100);
      },
      (error) => {
        console.error('Location permission denied or unavailable:', error);
        setHasLocationPermission(false);
      }
    );
  }, []);

  // Fetch places from OpenStreetMap (Overpass API) based on category
  const fetchPlaces = async (lat, lng, category) => {
    const radius = 2000;
    const overpassCategory = category === 'museum' ? 'tourism' : 'amenity';
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];(node["${overpassCategory}"="${category}"](around:${radius},${lat},${lng}););out body;`;

    try {
      const response = await axios.get(overpassUrl);
      return response.data.elements.map((place) => ({
        name: place.tags.name,
        coords: [place.lat, place.lon],
      }));
    } catch (error) {
      console.error('Error fetching places:', error);
      return [];
    }
  };

  // Handle button click for different categories
  const handleCategoryClick = async (category) => {
    setSelectedCategory(category);
    const places = await fetchPlaces(pointerLocation.lat, pointerLocation.lng, category); // Use pointerLocation here
    setCategoryPlaces(places);
    setIsPanelVisible(true);
  };
  
  // Function to handle location change from Search component
  const onLocationChange = async (coords, locationName) => {
    let resolvedLocationName = locationName;

    // If locationName is null, perform reverse geocoding
    if (!locationName) {
      try {
        const reverseGeocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}`;
        const response = await axios.get(reverseGeocodeUrl);
        resolvedLocationName = response.data.display_name || 'Unknown Location';
      } catch (error) {
        console.error('Error during reverse geocoding:', error);
        resolvedLocationName = 'Unknown Location';
      }
    }
  
    setLocation({
      lat: coords[0],
      lng: coords[1],
    });
    setCustomPointerLocation({
      lat: coords[0],
      lng: coords[1],
    });
    // When searching, update the pointer location to the searched coordinates
    setPointerLocation({
      lat: coords[0],
      lng: coords[1],
    });
    setPointerPopupText(resolvedLocationName || 'Unable to fetch location name'); // Use locationName if available
  };

  // Handle place selection from the map
  const handlePlaceSelect = async (placeName, placeCoords) => {
    
    setPlaceDetails({
      name: placeName,
      coords: placeCoords,
    });
    setCustomPointerLocation({
      lat: placeCoords[0],
      lng: placeCoords[1],
    });
    // When a place is selected, update the pointer location
    setPointerLocation({
      lat: placeCoords[0],
      lng: placeCoords[1],
    });
    setPointerPopupText(placeName);
    
  };

  // Function to reset the pointer back to the user's location
  const resetToUserLocation = () => {
    setCategoryPlaces([]); // Clear any places related to categories
    setIsPanelVisible(false); // Hide the category panel
    setSelectedCategory('');
    // Use the separate userLocation state when resetting the pointer
    setCustomPointerLocation({
      lat: userLocation.lat,
      lng: userLocation.lng,
    });
    setPointerLocation({
      lat: userLocation.lat,
      lng: userLocation.lng,
    });
    setPointerPopupText(
      hasLocationPermission
        ? lowAccuracy
          ? 'You are here, but location accuracy is low.'
          : 'You are here!'
        : 'Default location (Permission denied)'
    );
    setPlaceDetails(null);
    setIsPanelVisible(false);
  };

  // Component to handle map centering based on pointerLocation
  const CenterMap = () => {
    const map = useMap();
    useEffect(() => {
      map.setView([pointerLocation.lat, pointerLocation.lng], 15);
    });
    return null;
  };

  // Function to handle place click from the places panel
const onPlaceClick = (placeCoords, placeName) => {
  // setIsPopupVisible(true);
  setPointerPopupText(placeName);
    setCustomPointerLocation({
      lat: placeCoords[0],
      lng: placeCoords[1],
    });
    setPointerLocation({
      lat: placeCoords[0],
      lng: placeCoords[1],
    });
  };

  const togglePanelVisibility = () => {
    setIsPanelVisible((prevState) => !prevState);
    if (isPanelVisible) {
      setCategoryPlaces([]); // Clear category markers when closing the panel
    }
  };

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      {/* Search bar */}
      <Search setLocation={(coords, locationName) => onLocationChange(coords, locationName)} />

      {/* Category Buttons */}
      <div className="category-buttons">
        <button onClick={() => handleCategoryClick('restaurant')}>Restaurants</button>
        <button onClick={() => handleCategoryClick('hotel')}>Hotels</button>
        <button onClick={() => handleCategoryClick('cafe')}>Cafes</button>
        <button onClick={() => handleCategoryClick('pharmacy')}>Pharmacies</button>
        <button onClick={() => handleCategoryClick('atm')}>ATMs</button>
        <button onClick={() => handleCategoryClick('museum')}>Museums</button>
      </div>

      {/* Map container */}
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true} // Allow scroll zooming
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Center map whenever pointerLocation changes */}
        <CenterMap />
    
        {/* Marker for custom pointer location (default, user fetched, or searched location) */}
        <Marker
          position={[customPointerLocation.lat, customPointerLocation.lng]} 
          icon={pointerIcon}
          ref={(markerRef) => {
            if (markerRef) {
              markerRef.openPopup(); // Always opens the popup
            }
          }}
        >
          {<Popup>{pointerPopupText}</Popup>}  {/* This will show the popup text */}
        </Marker>


        {/* Markers for places from category */}
        {categoryPlaces.map((place, index) => (
          <Marker
            key={index}
            position={place.coords}
            // onClick={() => setPointerPopupText( place.name) }
            eventHandlers={{
              click: () => handlePlaceSelect(place.name, place.coords),
            }}
            
          >
            <Popup>{place.name}</Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Button to collapse/expand the places panel
      <button className="toggle-panel-btn" onClick={togglePanelVisibility}>
        {isPanelVisible ? 'Close Panel' : 'Open Panel'}
      </button> */}

      {/* Floating Box for Place Details */}
      {placeDetails && (
        <div className="place-info-box">
          <h3>{placeDetails.name}</h3>
          <p>Lat: {placeDetails.coords[0]}, Lng: {placeDetails.coords[1]}</p>
          {/* {placeDetails.imageUrl && <img src={placeDetails.imageUrl} alt={placeDetails.name} />} */}
        </div>
      )}

      {/* Left-side Panel */}
      {isPanelVisible && (
        <div className="places-panel">
           {/* Close Button inside the panel */}
          <button className="close-panel-btn" onClick={togglePanelVisibility}>
            &times;
          </button>
          <h3>{selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Nearby</h3>
          <ul>
            {categoryPlaces.length > 0 ? (
              categoryPlaces.map((place, index) => (
                <li
                  key={index}
                  onClick={() => onPlaceClick(place.coords, place.name) } // Make place clickable
                  style={{ cursor: 'pointer' }} // Add pointer cursor to indicate clickability
                >
                  {place.name}
                  
                </li>
                
              ))
            ) : (
              <li>No places found</li>
            )}
          </ul>
          
        </div>
      )}

      {/* Coordinates Display Box for Pointer */}
      <div className="coordinates-box">
        <p>
          Lat: {pointerLocation.lat.toFixed(4)}, Lng: {pointerLocation.lng.toFixed(4)}
        </p>
      </div>

      {/* Button to reset pointer location */}
      <button className="reset-location-btn" onClick={resetToUserLocation}>
        Go to My Location
      </button>
    </div>
  );
}

export default App;
