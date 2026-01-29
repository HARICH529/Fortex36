const Admin = require('../models/Admin');
const Report = require('../models/Report');
const jwt = require('jsonwebtoken');

const generateAdminToken = (admin) => {
  return jwt.sign(
    { adminId: admin._id, email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const login = async (req, res) => {
  console.log('👉 Login Request Received');
  try {
    console.log('👉 Body:', JSON.stringify(req.body));
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log(`👉 Finding admin with email: ${email}`);
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
    console.log('👉 Find result:', admin ? 'Found' : 'Not Found');

    if (!admin) {
      console.log('❌ Admin not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('👉 Comparing password...');
    let isPasswordValid = false;
    try {
      isPasswordValid = await admin.comparePassword(password);
      console.log('👉 Password comparison result:', isPasswordValid);
    } catch (err) {
      console.error('❌ Password comparison threw error:', err);
      return res.status(500).json({ error: 'Password validation failed' });
    }

    if (!isPasswordValid) {
      console.log('❌ Password invalid');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('👉 Generating token...');
    const token = generateAdminToken(admin);
    console.log('👉 Token generated');

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: { _id: admin._id, email: admin.email },
        token
      }
    });
    console.log('✅ Response sent');
  } catch (error) {
    console.error('❌ Login error caught:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('userId', 'name email mobile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { reports }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

const updateReportAcknowledge = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findByIdAndUpdate(
      reportId,
      {
        isAcknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: req.admin.adminId,
        reportStatus: 'ACKNOWLEDGED'
      },
      { new: true }
    ).populate('userId', 'name email mobile fcmToken');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Send real-time update via Socket.IO
    if (global.io) {
      global.io.to(`report-${reportId}`).emit('report-status-update', {
        reportId: reportId,
        status: 'ACKNOWLEDGED',
        message: 'Your report has been acknowledged by authorities!'
      });
      console.log('✅ Real-time update sent for report:', reportId);
    }

    // Send push notification to user
    try {
      const notificationService = require('../services/notificationService');
      if (report.userId.fcmToken) {
        await notificationService.sendReportAcknowledgedNotification(
          report.userId.fcmToken,
          report.title,
          reportId,
          report.userId._id
        );
        console.log('✅ Acknowledgment notification sent to user');
      } else {
        console.log('⚠️ No FCM token found for user, skipping notification');
      }
    } catch (error) {
      console.error('❌ Failed to send acknowledgment notification:', error);
    }

    // Record on blockchain (non-blocking)
    console.log('🔗 Attempting blockchain acknowledgment...');
    try {
      const aptosService = require('../services/aptosService');

      // Force initialization if not done
      if (!aptosService.initialized) {
        await aptosService.initialize();
      }

      console.log('📋 Service initialized:', aptosService.initialized);
      const txHash = await aptosService.acknowledgeReport(reportId, report.userId._id.toString());
      console.log('✅ Blockchain acknowledgment TX:', txHash);
      console.log('🔗 View at: https://explorer.aptoslabs.com/txn/' + txHash + '?network=testnet');
    } catch (error) {
      console.error('❌ Blockchain acknowledgment failed:', error.message);
    }

    res.json({
      success: true,
      message: 'Report acknowledged successfully',
      data: { report }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to acknowledge report' });
  }
};

const getReportLocations = async (req, res) => {
  try {
    console.log('Fetching reports with location data...');

    const reports = await Report.find(
      {
        location: { $exists: true, $ne: null },
        'location.coordinates': { $exists: true, $ne: null }
      },
      { location: 1, department: 1, severity: 1, title: 1, createdAt: 1 }
    );

    console.log(`Found ${reports.length} reports with location data`);

    const locations = reports.map(report => {
      console.log('Report location:', report.location);
      return {
        lat: report.location.coordinates[1],
        lng: report.location.coordinates[0],
        department: report.department,
        severity: report.severity,
        title: report.title
      };
    });

    console.log('Processed locations:', locations.slice(0, 3));

    res.json({
      success: true,
      data: { locations }
    });
  } catch (error) {
    console.error('Error fetching report locations:', error);
    res.status(500).json({ error: 'Failed to fetch report locations' });
  }
};

module.exports = {
  login,
  getAllReports,
  updateReportAcknowledge,
  getReportLocations
};