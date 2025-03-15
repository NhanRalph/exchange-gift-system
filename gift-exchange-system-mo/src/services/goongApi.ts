import Constants from "expo-constants";
const API_GOONG_URL = (Constants.expoConfig as any).extra.API_GOONG_URL;
const API_TOKEN_GOONG = (Constants.expoConfig as any).extra.API_TOKEN_GOONG;

const GOONG_API_KEY = API_TOKEN_GOONG;
const GOONG_API_URL = API_GOONG_URL;

export interface DirectionsResponse {
  status: string;
  geocoded_waypoints: Array<{
    geocoder_status: string;
    place_id: string;
  }>;
  routes: Array<{
    bounds: any;
    legs: Array<{
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
    }>;
    overview_polyline: {
      points: string;
    };
    summary: string;
    warnings: string[];
    waypoint_order: number[];
  }>;
}

export const goongApi = {
  getDirections: async (
    origin: [number, number], // [latitude, longitude]
    destination: [number, number] // [latitude, longitude]
  ): Promise<DirectionsResponse> => {
    const url = `${GOONG_API_URL}/Direction?origin=${origin[0]},${origin[1]}&destination=${destination[0]},${destination[1]}&vehicle=car&api_key=${GOONG_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      return data;
    } catch (error) {
      console.error("Error fetching directions:", error);
      throw error;
    }
  },

  decodePolyline: (encoded: string): number[][] => {
    let index = 0;
    let latitude = 0;
    let longitude = 0;
    const coordinates: number[][] = [];
    const len = encoded.length;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;

      // Decode latitude
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
      latitude += deltaLat;

      // Decode longitude
      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
      longitude += deltaLng;

      // Convert to actual coordinates
      const finalLat = latitude / 1e5;
      const finalLng = longitude / 1e5;

      // Only add points if they're within Vietnam's bounds
      if (
        finalLng >= 102 &&
        finalLng <= 110 &&
        finalLat >= 8 &&
        finalLat <= 24
      ) {
        coordinates.push([finalLat, finalLng]);
      }
    }

    return coordinates;
  },
};
