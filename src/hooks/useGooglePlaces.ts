import { useEffect, useState } from 'react';
import { env } from '../config/env';

type Prediction = {
  description: string;
  place_id: string;
};

type GooglePlacesTypes = {
  maps?: {
    places?: {
      AutocompleteService?: new () => {
        getPlacePredictions: (
          req: { input: string },
          cb: (
            predictions: Array<Record<string, unknown>> | null,
            status: unknown
          ) => void
        ) => void;
      };
      PlacesService?: new (el: HTMLElement) => {
        getDetails: (
          req: { placeId: string; fields: string[] },
          cb: (place: Record<string, unknown> | null, status: unknown) => void
        ) => void;
      };
      PlacesServiceStatus?: { OK: unknown };
    };
  };
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

    const gw = window as unknown as { google?: GooglePlacesTypes };
    if (existing) {
      if (gw.google?.maps?.places) {
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
      const gw = window as unknown as { google?: GooglePlacesTypes };
      if (!gw.google || !gw.google.maps) {
        reject(new Error('Google Maps script not loaded'));
        return;
      }

      const AutocompleteCtor = gw.google.maps.places?.AutocompleteService;
      if (!AutocompleteCtor) {
        reject(new Error('AutocompleteService not available'));
        return;
      }

      const svc = new AutocompleteCtor();
      svc.getPlacePredictions({ input }, (predictions, status) => {
        const okStatus = gw.google?.maps?.places?.PlacesServiceStatus?.OK;
        if (status !== okStatus) {
          resolve([]);
          return;
        }
        resolve(
          (predictions || []).map(p => ({
            description: String(p.description),
            place_id: String(p.place_id),
          }))
        );
      });
    });
  };

  const getPlaceDetails = (placeId: string): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const gw = window as unknown as { google?: GooglePlacesTypes };
      if (!gw.google || !gw.google.maps) {
        reject(new Error('Google Maps script not loaded'));
        return;
      }

      const element = document.createElement('div');
      const PlacesCtor = gw.google.maps.places?.PlacesService;
      if (!PlacesCtor) {
        reject(new Error('PlacesService not available'));
        return;
      }

      const ps = new PlacesCtor(element);
      ps.getDetails(
        { placeId, fields: ['geometry', 'formatted_address', 'name'] },
        (place, status) => {
          const okStatus = gw.google?.maps?.places?.PlacesServiceStatus?.OK;
          if (status !== okStatus) {
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
