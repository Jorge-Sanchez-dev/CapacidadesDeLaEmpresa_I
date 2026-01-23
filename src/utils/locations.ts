// src/utils/location.ts

type CountryConfig = {
  name: string;
  postalCodeRegex: RegExp;
  cities: string[];
};

export const COUNTRIES: Record<string, CountryConfig> = {
  España: {
    name: "España",
    postalCodeRegex: /^[0-9]{5}$/,
    cities: [
      "Madrid",
      "Barcelona",
      "Valencia",
      "Sevilla",
      "Toledo",
      "Cuenca",
      "Zaragoza",
      "Bilbao",
      "Málaga",
      "Granada",
      "Alicante",
    ],
  },
};

export function validateLocation(
  country: string,
  city: string,
  postalCode: string
): string | null {
  const countryData = COUNTRIES[country];

  if (!countryData) {
    return "País no válido";
  }

  if (!countryData.cities.includes(city)) {
    return "La ciudad no pertenece al país indicado";
  }

  if (!countryData.postalCodeRegex.test(postalCode)) {
    return "El código postal no es válido para el país indicado";
  }

  return null; // ✅ todo correcto
}
