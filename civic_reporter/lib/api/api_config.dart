class ApiConfig {
  // Primary URL - ngrok for cross-network access
  static const String ngrokUrl = 'https://your-ngrok-url.ngrok-free.dev/api/v1';
  
  // Fallback URLs for different network scenarios
  static const String localUrl = 'http://localhost:3000/api/v1';
  static const String localhostUrl = 'http://127.0.0.1:3000/api/v1';
  
  // Add your computer's IP address here for mobile testing
  // Replace with your actual IP address
  static const String localNetworkUrl = 'http://YOUR_LOCAL_IP:3000/api/v1';
  
  // List of URLs to try in order - wireless connection prioritized
  static const List<String> fallbackUrls = [
    localNetworkUrl,  // Try computer IP first (works wirelessly)
    localUrl,         // Try localhost
    localhostUrl,     // Try 127.0.0.1
    ngrokUrl,         // Try ngrok last
  ];
  
  // Current working URL (will be set after successful connection)
  static String? _workingUrl;
  
  // Get appropriate base URL
  static String getBaseUrl() {
    return _workingUrl ?? ngrokUrl;
  }
  
  // Set working URL after successful connection test
  static void setWorkingUrl(String url) {
    _workingUrl = url;
  }

  // Auth endpoints
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String firebaseAuth = '/auth/firebase-auth';
  static const String refreshToken = '/auth/refresh-token';
  static const String logout = '/auth/logout';
  static const String profile = '/auth/profile';

  // Report endpoints
  static const String createReport = '/reports/create-report';
  static const String getAllReports = '/reports/get-all-reports';
  static const String getUserReports = '/reports/fetch-user-reports';
  static const String nearbyReports = '/reports/nearby';
  static const String upvoteReport = '/reports';
  static const String updateReportStatus = '/reports';

  // Headers
  static Map<String, String> get headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      };

  static Map<String, String> headersWithAuth(String token) => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
        'ngrok-skip-browser-warning': 'true',
      };
}
