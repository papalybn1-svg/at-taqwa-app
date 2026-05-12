// Service de recherche de villes utilisant l'API Nominatim (OpenStreetMap)
// Gratuit et sans clé API requise

export interface CitySearchResult {
  name: string;
  country: string;
  displayName: string;
  lat?: number;
  lon?: number;
}

// Fonction pour rechercher des villes dans le monde entier
export const searchCities = async (query: string, limit: number = 10): Promise<CitySearchResult[]> => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    // Utiliser l'API Nominatim d'OpenStreetMap (gratuite, sans clé API)
    const encodedQuery = encodeURIComponent(query.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=${limit}&addressdetails=1&extratags=1&namedetails=1`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'At-Taqwa Prayer Times App' // Requis par Nominatim
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transformer les résultats de Nominatim en format CitySearchResult
    const results: CitySearchResult[] = data
      .filter((item: any) => {
        // Filtrer pour ne garder que les villes/villages (pas les pays, régions, etc.)
        const type = item.type || '';
        const classType = item.class || '';
        return (
          classType === 'place' || 
          type === 'city' || 
          type === 'town' || 
          type === 'village' ||
          type === 'administrative'
        );
      })
      .map((item: any) => {
        const address = item.address || {};
        const cityName = item.namedetails?.name || 
                        address.city || 
                        address.town || 
                        address.village || 
                        address.municipality ||
                        item.display_name.split(',')[0];
        
        const country = address.country || 'Unknown';
        
        return {
          name: cityName,
          country: country,
          displayName: `${cityName}, ${country}`,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon)
        };
      })
      .filter((item: CitySearchResult, index: number, self: CitySearchResult[]) => {
        // Supprimer les doublons basés sur le nom et le pays
        return index === self.findIndex((t) => 
          t.name === item.name && t.country === item.country
        );
      })
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error('❌ Erreur recherche villes:', error);
    return [];
  }
};

// Fonction pour rechercher une ville spécifique avec son pays
export const searchCityWithCountry = async (cityName: string, countryName?: string): Promise<CitySearchResult | null> => {
  try {
    const query = countryName ? `${cityName}, ${countryName}` : cityName;
    const results = await searchCities(query, 1);
    
    if (results.length > 0) {
      return results[0];
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erreur recherche ville spécifique:', error);
    return null;
  }
};

