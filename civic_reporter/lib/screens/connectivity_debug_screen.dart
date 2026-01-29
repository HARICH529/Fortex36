import 'package:flutter/material.dart';
import '../api/api_service.dart';
import '../api/api_config.dart';

class ConnectivityDebugScreen extends StatefulWidget {
  @override
  _ConnectivityDebugScreenState createState() => _ConnectivityDebugScreenState();
}

class _ConnectivityDebugScreenState extends State<ConnectivityDebugScreen> {
  String _results = '';
  bool _testing = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Connectivity Debug'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Flutter App Connectivity Test',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 20),
            
            ElevatedButton(
              onPressed: _testing ? null : _testAllConnections,
              child: _testing 
                ? Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                      SizedBox(width: 8),
                      Text('Testing...'),
                    ],
                  )
                : Text('Test All Connections'),
            ),
            
            SizedBox(height: 10),
            
            ElevatedButton(
              onPressed: _testing ? null : _testLogin,
              child: Text('Test Login'),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            ),
            
            SizedBox(height: 10),
            
            ElevatedButton(
              onPressed: _clearResults,
              child: Text('Clear Results'),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            ),
            
            SizedBox(height: 20),
            
            Text(
              'Results:',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            
            SizedBox(height: 10),
            
            Expanded(
              child: Container(
                width: double.infinity,
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: SingleChildScrollView(
                  child: Text(
                    _results.isEmpty ? 'No tests run yet...' : _results,
                    style: TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _addResult(String message) {
    setState(() {
      _results += '${DateTime.now().toString().substring(11, 19)} - $message\n';
    });
  }

  void _clearResults() {
    setState(() {
      _results = '';
    });
  }

  Future<void> _testAllConnections() async {
    setState(() {
      _testing = true;
    });

    _addResult('🧪 Starting connectivity tests...');
    
    final apiService = ApiService();
    
    try {
      _addResult('🔍 Testing connection to all endpoints...');
      final connectionOk = await apiService.testConnection();
      
      if (connectionOk) {
        _addResult('✅ Connection test passed!');
        _addResult('🌐 Working URL: ${ApiConfig.getBaseUrl()}');
      } else {
        _addResult('❌ All connection attempts failed');
      }
      
    } catch (e) {
      _addResult('❌ Connection test error: $e');
    }

    setState(() {
      _testing = false;
    });
  }

  Future<void> _testLogin() async {
    setState(() {
      _testing = true;
    });

    _addResult('🔐 Testing login with test credentials...');
    
    try {
      final apiService = ApiService();
      final response = await apiService.login(
        email: 'mobiletest@example.com',
        password: 'mobile123',
      );
      
      _addResult('✅ Login successful!');
      _addResult('📄 Response: ${response.toString().substring(0, response.toString().length > 200 ? 200 : response.toString().length)}...');
      
    } catch (e) {
      _addResult('❌ Login failed: $e');
    }

    setState(() {
      _testing = false;
    });
  }
}