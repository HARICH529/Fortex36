import 'package:flutter/material.dart';
import '../main.dart';

class UserFilteredReportsScreen extends StatelessWidget {
  final List<dynamic> reports;
  final String title;
  
  const UserFilteredReportsScreen({
    super.key, 
    required this.reports, 
    required this.title
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('$title (${reports.length})'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: reports.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.inbox, size: 80, color: Colors.grey),
                  SizedBox(height: 20),
                  Text('No Reports Found', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  SizedBox(height: 10),
                  Text('Create your first report using the + button', style: TextStyle(color: Colors.grey)),
                ],
              ),
            )
          : ListView.builder(
              padding: EdgeInsets.all(16),
              itemCount: reports.length,
              itemBuilder: (context, index) {
                final report = reports[index];
                return GestureDetector(
                  onTap: () => _viewReportDetails(context, report),
                  child: Card(
                    margin: EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: _getStatusColor(report.status),
                        child: Icon(
                          _getStatusIcon(report.status),
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      title: Text(
                        report.title,
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(report.description),
                          SizedBox(height: 4),
                          Text(
                            'Status: ${report.status.toUpperCase()}',
                            style: TextStyle(
                              color: _getStatusColor(report.status),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      trailing: Text(
                        '${report.upvotes} ↑',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.blue,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }

  void _viewReportDetails(BuildContext context, dynamic report) {
    Navigator.push(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => ReportDetailScreen(report: report),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(1.0, 0.0),
              end: Offset.zero,
            ).animate(CurvedAnimation(
              parent: animation,
              curve: Curves.easeInOut,
            )),
            child: child,
          );
        },
        transitionDuration: const Duration(milliseconds: 300),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'submitted':
        return Colors.orange;
      case 'in_progress':
      case 'acknowledged':
        return Colors.blue;
      case 'resolved':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'submitted':
        return Icons.pending;
      case 'in_progress':
      case 'acknowledged':
        return Icons.construction;
      case 'resolved':
        return Icons.check_circle;
      default:
        return Icons.report;
    }
  }
}