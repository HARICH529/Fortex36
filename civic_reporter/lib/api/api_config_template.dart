class ApiConfig {
  // Environment-based configuration
  static const String _baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api/v1',
  );
  
  static const String _ngrokUrl = String.fromEnvironment(
    'NGROK_URL',
    defaultValue: 'https://your-ngrok-url.ngrok-free.dev/api/v1',
  );
  
  static const String _localNetworkUrl = String.fromEnvironment(
    'LOCAL_NETWORK_URL',
    defaultValue: 'http://YOUR_LOCAL_IP:3000/api/v1',
  );
  
  // Fallback URLs for different network scenarios
  static const String localUrl = 'http://localhost:3000/api/v1';
  static const String localhostUrl = 'http://127.0.0.1:3000/api/v1';
  
  // List of URLs to try in order
  static List<String> get fallbackUrls => [
    _localNetworkUrl,
    localUrl,
    localhostUrl,
    _ngrokUrl,
  ];
  
  // Current working URL
  static String? _workingUrl;
  
  // Get appropriate base URL
  static String getBaseUrl() {
    return _workingUrl ?? _baseUrl;
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