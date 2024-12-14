import React, { useState } from 'react';
import axios from 'axios';
import Autosuggest from 'react-autosuggest';
import './Search.css';

const Search = ({ setLocation }) => {  // Using setLocation from App.js to update location
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = async (query) => {
    if (!query) return [];
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
    );
    return response.data.map((place) => ({
      name: place.display_name,
      coords: [parseFloat(place.lat), parseFloat(place.lon)],
    }));
  };

  const onSuggestionsFetchRequested = async ({ value }) => {
    const newSuggestions = await fetchSuggestions(value);
    setSuggestions(newSuggestions);
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const getSuggestionValue = (suggestion) => suggestion.name;

  const renderSuggestion = (suggestion) => <div>{suggestion.name}</div>;

  const onSuggestionSelected = (event, { suggestion }) => {
    setValue(suggestion.name);
    setLocation(suggestion.coords);  // Calls the onLocationChange function passed from parent
  };

  const inputProps = {
    placeholder: 'Search for a location...',
    value,
    onChange: (event, { newValue }) => setValue(newValue),
  };

  return (
    <div className="search-container">
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionsClearRequested={onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        onSuggestionSelected={onSuggestionSelected}
        inputProps={inputProps}
      />
    </div>
  );
};

export default Search;
