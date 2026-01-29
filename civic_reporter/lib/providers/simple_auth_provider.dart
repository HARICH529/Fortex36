import 'package:flutter/foundation.dart';
import '../api/simple_auth_service.dart';

class SimpleAuthProvider with ChangeNotifier {
  final SimpleAuthService _authService = SimpleAuthService();
  
  Map<String, dynamic>? _userProfile;
  bool _isLoading = false;
  String? _error;
  bool _isAuthenticated = false;
  
  SimpleAuthProvider() {
    _checkLoginState();
  }
  
  Future<void> _checkLoginState() async {
    final isLoggedIn = await _authService.isLoggedIn();
    if (isLoggedIn) {
      _isAuthenticated = true;
      // Try to get user profile
      final profile = await _authService.getUserProfile();
      if (profile != null) {
        _userProfile = profile;
      }
      notifyListeners();
    }
  }

  Future<void> refreshUserProfile() async {
    try {
      _setLoading(true);
      _setError(null);
      print('Refreshing user profile...');
      
      // Check if we have a token first
      final token = await _authService.getToken();
      if (token == null) {
        print('No token found, marking as not authenticated');
        _isAuthenticated = false;
        _userProfile = null;
        notifyListeners();
        return;
      }
      
      final profile = await _authService.getUserProfile();
      print('Profile received: $profile');
      if (profile != null) {
        _userProfile = profile;
        _isAuthenticated = true;
        print('Profile updated in provider: $_userProfile');
      } else {
        print('Profile is null');
        // Don't set error, just mark as not authenticated
        _isAuthenticated = false;
        _userProfile = null;
      }
      notifyListeners();
    } catch (e) {
      print('Profile refresh error: $e');
      // If it's an authentication error, clear the session
      if (e.toString().contains('Authentication required') || 
          e.toString().contains('Invalid or expired token')) {
        _isAuthenticated = false;
        _userProfile = null;
        await _authService.clearToken();
        // Throw the error so the UI can handle it
        throw e;
      } else {
        _setError('Failed to refresh profile: ${e.toString()}');
      }
      notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  Map<String, dynamic>? get userProfile => _userProfile;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _isAuthenticated;

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? error) {
    _error = error;
    notifyListeners();
  }

  Future<bool> register({
    required String email,
    required String password,
    required String name,
    required String phone,
  }) async {
    try {
      _setLoading(true);
      _setError(null);

      final result = await _authService.register(
        email: email,
        password: password,
        name: name,
        phone: phone,
      );

      if (result != null && result['success'] == true) {
        _isAuthenticated = true;
        _userProfile = result['data']['user'];
        notifyListeners();
        return true;
      } else {
        _setError('Registration failed');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> login({
    required String email,
    required String password,
  }) async {
    try {
      _setLoading(true);
      _setError(null);

      final result = await _authService.login(
        email: email,
        password: password,
      );

      if (result != null && result['success'] == true) {
        _isAuthenticated = true;
        _userProfile = result['data']['user'];
        notifyListeners();
        return true;
      } else {
        _setError('Login failed');
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> signOut() async {
    try {
      _setLoading(true);
      await _authService.signOut();
      _isAuthenticated = false;
      _userProfile = null;
      _error = null;
      notifyListeners();
    } catch (e) {
      // Even if logout fails, clear local state
      _isAuthenticated = false;
      _userProfile = null;
      _error = null;
      notifyListeners();
      print('Logout error (but cleared local state): $e');
    } finally {
      _setLoading(false);
    }
  }

  void clearError() {
    _setError(null);
  }
}
