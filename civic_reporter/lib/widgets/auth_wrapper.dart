import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/simple_auth_provider.dart';
import '../main.dart';
import '../screens/loading_screen.dart';

class AuthWrapper extends StatelessWidget {
  final Widget child;
  
  const AuthWrapper({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Consumer<SimpleAuthProvider>(
      builder: (context, authProvider, _) {
        // If loading, show loading screen
        if (authProvider.isLoading) {
          return const LoadingScreen();
        }
        
        // If not authenticated and trying to access protected content
        if (!authProvider.isAuthenticated) {
          // Check if the error is authentication related
          if (authProvider.error != null && 
              (authProvider.error!.contains('Authentication required') ||
               authProvider.error!.contains('Invalid or expired token'))) {
            // Clear the error and redirect to login
            WidgetsBinding.instance.addPostFrameCallback((_) {
              authProvider.clearError();
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => const LoginScreen()),
              );
            });
            return const LoadingScreen();
          }
        }
        
        return child;
      },
    );
  }
}