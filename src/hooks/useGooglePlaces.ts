import { useEffect, useState } from 'react';
import { env } from '../config/env';

type Prediction = {
  description: string;
  place_id: string;
};

export function useGooglePlaces() {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const key = env.placesApiKey;
    if (!key) {
      setIsLoaded(false);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );

    if (existing) {
      if (window.google?.maps?.places) {
        setIsLoaded(true);
      } else {
        existing.addEventListener('load', () => setIsLoaded(true), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setIsLoaded(false);
    document.head.appendChild(script);
  }, []);

  const getPredictions = (input: string): Promise<Prediction[]> => {
    return new Promise((resolve, reject) => {
      if (!window.google?.maps) {
        reject(new Error('Google Maps script not loaded'));
        return;
      }

      const svc = new window.google.maps.places.AutocompleteService();
      void svc.getPlacePredictions({ input }, (predictions, status) => {
        if (status !== window.google?.maps.places.PlacesServiceStatus.OK) {
          resolve([]);
          return;
        }
        resolve(
          (predictions ?? []).map(p => ({
            description: p.description,
            place_id: p.place_id,
          }))
        );
      });
    });
  };

  const getPlaceDetails = (placeId: string): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      if (!window.google?.maps) {
        reject(new Error('Google Maps script not loaded'));
        return;
      }

      const element = document.createElement('div');
      const ps = new window.google.maps.places.PlacesService(element);
      ps.getDetails(
        { placeId, fields: ['geometry', 'formatted_address', 'name'] },
        (place, status) => {
          if (status !== window.google?.maps.places.PlacesServiceStatus.OK) {
            reject(new Error('Place details fetch failed'));
            return;
          }
          resolve(place);
        }
      );
    });
  };

  return { isLoaded, getPredictions, getPlaceDetails };
}
