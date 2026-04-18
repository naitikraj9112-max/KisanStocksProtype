/**
 * Get the user's current location using the browser Geolocation API
 * with a fallback to IP-based geolocation.
 * Returns { latitude, longitude }
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    // Function to fetch location via IP if browser API fails
    const fallbackToIP = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error('IP Fetch Failed');
        const data = await res.json();
        
        if (data.latitude && data.longitude) {
          resolve({
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
          });
        } else {
          reject(new Error('Location information is unavailable via IP.'));
        }
      } catch (err) {
        reject(new Error('All location methods failed.'));
      }
    };

    if (!navigator.geolocation) {
      // Browser doesn't support geolocation, try IP directly
      fallbackToIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Browser geolocation failed, falling back to IP:', error.message);
        fallbackToIP();
      },
      {
        enableHighAccuracy: true,
        timeout: 5000, // Reduced timeout so we fail over to IP faster
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
}
