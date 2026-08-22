import { config } from "@/config/env";

export type City = {
    name: string;
    placeId: string;
};

export type State = {
    name: string; 
    placeId: string;
};

const apiKey = config.GOOGLEAPI;

const countryCode = 'IN';

export async function getCitiesByState(
    query: string,
    state: string,
): Promise<City[]> {
    if (!query) return [];

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
    )}&types=(cities)&components=country:${countryCode}&key=${apiKey}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== "OK") {
            throw new Error(data.error_message || "Failed to fetch cities");
        }

        const cities: City[] = data.predictions
            .filter((prediction: any) =>
                prediction.types.includes("locality") &&
                prediction.description.toLowerCase().includes(state.toLowerCase())
            )
            .map((prediction: any) => ({
                name: prediction.description.split(",")[0], // only city name
                placeId: prediction.place_id,
            }));

        return cities;
    } catch (error) {
        console.error("Error fetching cities:", error);
        return [];
    }
}



export async function getStates(
    input: string = "a",
): Promise<State[]> {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
    )}&types=(regions)&components=country:${countryCode}&key=${apiKey}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== "OK") {
            throw new Error(data.error_message || "Failed to fetch states");
        }

        const states: State[] = data.predictions
            .filter((prediction: any) =>
                prediction.types.includes("administrative_area_level_1")
            )
            .map((prediction: any) => {
                const fullName = prediction.description;
                const stateName = fullName.split(",")[0]; // 👈 only state name

                return {
                    name: stateName,
                    placeId: prediction.place_id,
                };
            });

        return states;
    } catch (error) {
        console.error("Error fetching states:", error);
        return [];
    }
}

export async function getCities(query: string): Promise<City[]> {
    if (!query) return [];

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
    )}&types=(cities)&components=country:${countryCode}&key=${apiKey}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
            throw new Error(data.error_message || "Failed to fetch cities");
        }

        const cities: City[] = (data.predictions ?? [])
            .filter((prediction: any) => prediction.types.includes("locality"))
            .map((prediction: any) => ({
                name: prediction.description.split(",")[0],
                placeId: prediction.place_id,
            }));

        return cities;
    } catch (error) {
        console.error("Error fetching cities:", error);
        return [];
    }
}