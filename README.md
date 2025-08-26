# boat-tracker

## WindWidget

Shows wind direction and speed. Tap to expand and show current weather + temperature.

Props:
- lat, lon: coordinates (required for real API calls)
- apiKey: OpenWeather API key (use env/app.config.js)
- useDummy: boolean — show local dummy data (useful during development)
- cacheTtlMs: optional — cache TTL in milliseconds (default 4 minutes)

Notes:
- Response is validated; partial responses are handled.
- In-memory cache reduces API calls; for multi-session persistence consider AsyncStorage.
- Unit tests live under `__tests__/WindWidget.test.js`.