const fs = require('fs');
const path = require('path');

// Read the restaurants data
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/restaurants_v2.json'), 'utf8'));

// Group restaurants by city and calculate center coordinates
const citiesMap = new Map();

data.forEach(restaurant => {
  const cityCountry = restaurant.Location; // e.g., "Munich, Germany"
  const [city, country] = cityCountry.split(', ');
  
  const lat = parseFloat(restaurant.Latitude);
  const lng = parseFloat(restaurant.Longitude);
  
  if (!citiesMap.has(cityCountry)) {
    citiesMap.set(cityCountry, {
      name: city,
      country: country,
      fullName: cityCountry,
      restaurants: [],
      latSum: 0,
      lngSum: 0,
      count: 0
    });
  }
  
  const cityData = citiesMap.get(cityCountry);
  cityData.restaurants.push(restaurant);
  cityData.latSum += lat;
  cityData.lngSum += lng;
  cityData.count += 1;
});

// Calculate center coordinates and create final cities array
const cities = Array.from(citiesMap.values()).map(cityData => ({
  name: cityData.name,
  country: cityData.country,
  fullName: cityData.fullName,
  latitude: cityData.latSum / cityData.count,
  longitude: cityData.lngSum / cityData.count,
  restaurantCount: cityData.count
})).sort((a, b) => a.name.localeCompare(b.name));

console.log(`Found ${cities.length} unique cities`);
console.log('Sample cities:', cities.slice(0, 5));

// Write to a TypeScript file
const tsContent = `// Auto-generated from restaurants_v2.json
export type City = {
  name: string;
  country: string;
  fullName: string;
  latitude: number;
  longitude: number;
  restaurantCount: number;
};

export const CITIES: City[] = ${JSON.stringify(cities, null, 2)};

export function findCitiesByName(query: string): City[] {
  const lowerQuery = query.toLowerCase();
  return CITIES.filter(city => 
    city.name.toLowerCase().includes(lowerQuery) ||
    city.fullName.toLowerCase().includes(lowerQuery)
  ).slice(0, 10); // Limit to top 10 results
}
`;

fs.writeFileSync(path.join(__dirname, '../lib/cities.ts'), tsContent);
console.log('Cities data written to lib/cities.ts');