const Report = require('../models/Report');
const mlService = require('../services/mlService');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY
});

// Create new report with location
const createReport = async (req, res) => {
  try {
    console.log('🚀 CREATE REPORT ENDPOINT HIT');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    const { description, latitude, longitude, address } = req.body || {};
    const userId = req.user.userId;

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    const reportData = {
      title: 'Processing...', // Temporary title, will be updated by ML
      description: description || '',
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)] // [lng, lat]
      },
      address,
      department: 'Processing', // Will be classified by ML
      severity: 'MEDIUM', // Will be classified by ML
      userId,
      reportStatus: 'SUBMITTED'
    };

    // Upload files to Cloudinary if files were uploaded
    if (req.files) {
      // Upload image if provided
      if (req.files.image && req.files.image[0]) {
        try {
          const imageResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'civic_reports/images',
                transformation: [{ width: 800, height: 600, crop: 'limit' }]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(req.files.image[0].buffer);
          });

          reportData.image_url = imageResult.secure_url;
          console.log('Image uploaded to Cloudinary:', imageResult.secure_url);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }

      // Upload audio if provided
      if (req.files.voice && req.files.voice[0]) {
        try {
          const audioResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'civic_reports/audio',
                resource_type: 'video' // Cloudinary uses 'video' for audio files
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(req.files.voice[0].buffer);
          });

          reportData.voice_url = audioResult.secure_url;
          console.log('Audio uploaded to Cloudinary:', audioResult.secure_url);
        } catch (uploadError) {
          console.error('Audio upload error:', uploadError);
        }
      }
    }

    const report = await Report.create(reportData);
    console.log('📝 Report created in DB:', report._id);

    // Record on blockchain (truly non-blocking with timeout)
    setImmediate(async () => {
      console.log('🔗 Attempting blockchain submission...');
      try {
        const aptosService = require('../services/aptosService');

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Blockchain timeout')), 10000)
        );

        const blockchainPromise = (async () => {
          if (!aptosService.initialized) {
            await aptosService.initialize();
          }
          return await aptosService.submitReport(report._id.toString(), userId);
        })();

        const txHash = await Promise.race([blockchainPromise, timeoutPromise]);
        console.log('✅ Blockchain TX:', txHash);
        console.log('🔗 View at: https://explorer.aptoslabs.com/txn/' + txHash + '?network=testnet');
      } catch (error) {
        console.error('❌ Blockchain submission failed:', error.message);
      }
    });

    // Queue ML classification job (truly non-blocking)
    if (process.env.DISABLE_ML_PROCESSING !== 'true') {
      setImmediate(async () => {
        try {
          await mlService.queueClassificationJob(report);
          console.log(`ML classification queued for report ${report._id}`);
        } catch (error) {
          console.error('Failed to queue ML classification:', error);
        }
      });
    } else {
      console.log('ML processing disabled - skipping classification');
    }

    // Emit socket event for real-time updates
    if (global.io) {
      global.io.emit('newReport', report);
      console.log('📡 Emitted newReport socket event:', report._id);
    }

    res.status(201).json({
      success: true,
      message: "Report created successfully",
      data: {
        report
      }
    });
  } catch (error) {
    console.error("Create report error:", error);
    res.status(500).json({ error: "Failed to create report" });
  }
};

// Get nearby reports within specified radius
const getNearbyReports = async (req, res) => {
  try {
    const { lat, lng, radius = 500 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const maxDistance = parseInt(radius);

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    const reports = await Report.find({
      reportStatus: { $ne: 'DELETED' },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance // in meters
        }
      }
    })
      .populate('userId', 'name')
      .limit(50) // Limit results for performance
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Nearby reports retrieved successfully",
      count: reports.length,
      radius: maxDistance,
      userLocation: { latitude, longitude },
      reports
    });
  } catch (error) {
    console.error("Get nearby reports error:", error);
    res.status(500).json({ error: "Failed to get nearby reports" });
  }
};

// Get reports within a bounding box (for map view)
const getReportsInBounds = async (req, res) => {
  try {
    const { swLat, swLng, neLat, neLng } = req.query;

    if (!swLat || !swLng || !neLat || !neLng) {
      return res.status(400).json({
        error: "Bounding box coordinates required: swLat, swLng, neLat, neLng"
      });
    }

    const reports = await Report.find({
      reportStatus: { $ne: 'DELETED' },
      location: {
        $geoWithin: {
          $box: [
            [parseFloat(swLng), parseFloat(swLat)], // Southwest corner
            [parseFloat(neLng), parseFloat(neLat)]  // Northeast corner
          ]
        }
      }
    })
      .populate('userId', 'name')
      .limit(100)
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Reports in bounds retrieved successfully",
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error("Get reports in bounds error:", error);
    res.status(500).json({ error: "Failed to get reports in bounds" });
  }
};

// Get reports by department within radius
const getNearbyReportsByDepartment = async (req, res) => {
  try {
    const { lat, lng, department, radius = 500 } = req.query;

    if (!lat || !lng || !department) {
      return res.status(400).json({
        error: "Latitude, longitude, and department are required"
      });
    }

    const reports = await Report.find({
      reportStatus: { $ne: 'DELETED' },
      department: department,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    })
      .populate('userId', 'name')
      .limit(50)
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: `Nearby ${department} reports retrieved successfully`,
      count: reports.length,
      department,
      reports
    });
  } catch (error) {
    console.error("Get nearby reports by department error:", error);
    res.status(500).json({ error: "Failed to get nearby reports by department" });
  }
};

// Acknowledge report (Admin only)
const acknowledgeReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (report.reportStatus !== 'SUBMITTED') {
      return res.status(400).json({ error: "Report cannot be acknowledged" });
    }

    report.reportStatus = 'ACKNOWLEDGED';
    await report.save();

    // Emit socket event
    if (global.io) {
      global.io.emit('reportStatusUpdated', report);
    }

    res.status(200).json({
      message: "Report acknowledged successfully",
      report
    });
  } catch (error) {
    console.error("Acknowledge report error:", error);
    res.status(500).json({ error: "Failed to acknowledge report" });
  }
};

// Resolve report (User or Admin)
const resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (!['SUBMITTED', 'ACKNOWLEDGED'].includes(report.reportStatus)) {
      return res.status(400).json({ error: "Report cannot be resolved" });
    }

    report.reportStatus = 'RESOLVED';
    await report.save();

    // Record on blockchain (non-blocking)
    console.log('🔗 Attempting blockchain resolution...');
    try {
      const aptosService = require('../services/aptosService');

      // Force initialization if not done
      if (!aptosService.initialized) {
        await aptosService.initialize();
      }

      console.log('📋 Service initialized:', aptosService.initialized);
      const txHash = await aptosService.resolveReport(reportId, report.userId.toString());
      console.log('✅ Blockchain resolution TX:', txHash);
      console.log('🔗 View at: https://explorer.aptoslabs.com/txn/' + txHash + '?network=testnet');
    } catch (error) {
      console.error('❌ Blockchain resolution failed:', error.message);
    }

    // Emit socket event
    if (global.io) {
      global.io.emit('reportStatusUpdated', report);
    }

    res.status(200).json({
      message: "Report resolved successfully",
      report
    });
  } catch (error) {
    console.error("Resolve report error:", error);
    res.status(500).json({ error: "Failed to resolve report" });
  }
};

// Delete report (Admin only)
const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    report.reportStatus = 'DELETED';
    await report.save();

    res.status(200).json({
      message: "Report deleted successfully"
    });
  } catch (error) {
    console.error("Delete report error:", error);
    res.status(500).json({ error: "Failed to delete report" });
  }
};

// Get user reports
const getUserReports = async (req, res) => {
  try {
    const userId = req.user.userId;
    const reports = await Report.find({ userId, reportStatus: { $ne: 'DELETED' } })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Reports retrieved successfully",
      reports
    });
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({ error: "Failed to get reports" });
  }
};

// ML Classification Webhook
const mlWebhook = async (req, res) => {
  try {
    const { reportId, classification, updatedReport } = req.body;

    console.log('🤖 ML Classification Complete!');
    console.log('Report ID:', reportId);
    console.log('Classification Result:', classification);

    // Update the report in database with ML results
    const updateData = {
      mlClassified: true,
      mlSeverity: classification.severity,
      mlDepartment: classification.department,
      mlConfidence: classification.confidence,
      department: classification.department,
      severity: classification.severity
    };

    // Update title if ML generated one
    if (classification.title && classification.title !== 'No title') {
      console.log(`📝 Updating title from '${updatedReport?.title || 'undefined'}' to '${classification.title}'`);
      updateData.title = classification.title;
      updateData.mlTitle = classification.title;
    } else {
      console.log(`⚠️ No valid title in classification result: '${classification.title}'`);
    }

    // Add conflicts if any
    if (classification.conflicts) {
      updateData.mlConflicts = classification.conflicts;
    }

    const updatedReportFromDB = await Report.findByIdAndUpdate(
      reportId,
      { $set: updateData },
      { new: true }
    );

    console.log('Database Updated Successfully!');
    console.log('Updated Report:', JSON.stringify(updatedReportFromDB, null, 2));
    console.log('='.repeat(50));

    // Emit socket event for ML update
    if (global.io) {
      global.io.emit('reportStatusUpdated', updatedReportFromDB);
      console.log('📡 Emitted reportStatusUpdated (ML) socket event');
    }

    res.status(200).json({
      message: 'Webhook received and database updated successfully',
      updatedReport: updatedReportFromDB
    });
  } catch (error) {
    console.error('ML Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Get all reports (Admin only)
const getAllReports = async (req, res) => {
  try {
    const { status, department, page = 1, limit = 20 } = req.query;
    const filter = { reportStatus: { $ne: 'DELETED' } };

    if (status) filter.reportStatus = status;
    if (department) filter.department = department;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await Report.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.status(200).json({
      message: "All reports retrieved successfully",
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get all reports error:", error);
    res.status(500).json({ error: "Failed to get reports" });
  }
};

// Upvote report
const upvoteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.userId;

    // Validate ObjectId format
    if (!reportId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid report ID format" });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (report.reportStatus === 'DELETED') {
      return res.status(400).json({ error: "Cannot upvote deleted report" });
    }

    // Check if user already upvoted
    if (report.upvotedBy.includes(userId)) {
      // Remove upvote (toggle functionality)
      report.upvotes -= 1;
      report.upvotedBy = report.upvotedBy.filter(id => id.toString() !== userId.toString());
      await report.save();

      return res.status(200).json({
        message: "Report upvote removed successfully",
        upvotes: report.upvotes
      });
    }

    // Add upvote
    report.upvotes += 1;
    report.upvotedBy.push(userId);
    await report.save();

    res.status(200).json({
      message: "Report upvoted successfully",
      upvotes: report.upvotes
    });
  } catch (error) {
    console.error("Upvote report error:", error);
    res.status(500).json({ error: "Failed to upvote report" });
  }
};

// Get all reports for mobile (with pagination and filters)
const getAllReportsForMobile = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, department, severity } = req.query;
    const filter = { reportStatus: { $ne: 'DELETED' } };

    if (status) filter.reportStatus = status;
    if (department) filter.department = department;
    if (severity) filter.severity = severity;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await Report.find(filter)
      .populate('userId', 'name email')
      .sort({ upvotes: -1, createdAt: -1 }) // Sort by upvotes first, then by date
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Reports retrieved successfully",
      data: {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error("Get all reports for mobile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get reports"
    });
  }
};

// Get user reports for mobile
const getUserReportsForMobile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await Report.find({
      userId,
      reportStatus: { $ne: 'DELETED' }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments({
      userId,
      reportStatus: { $ne: 'DELETED' }
    });

    res.status(200).json({
      success: true,
      message: "User reports retrieved successfully",
      data: {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("Get user reports for mobile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user reports"
    });
  }
};

// Update report status to resolve (only if acknowledged)
const updateReportStatusResolve = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.userId;

    const report = await Report.findById(reportId)
      .populate('userId', 'name email fcmToken')
      .populate('upvotedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found"
      });
    }

    // Check if user owns the report
    if (report.userId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: "You can only resolve your own reports"
      });
    }

    // Check if report is acknowledged
    if (report.reportStatus !== 'ACKNOWLEDGED') {
      return res.status(400).json({
        success: false,
        error: "Report can only be resolved after it has been acknowledged"
      });
    }

    const oldStatus = report.reportStatus;
    report.reportStatus = 'RESOLVED';
    await report.save();

    // Award points when report is resolved
    if (oldStatus !== 'RESOLVED') {
      const User = require('../models/User');

      // Award 20 points to report submitter
      const submitter = await User.findById(report.userId._id);
      if (submitter) {
        submitter.points += 20;
        submitter.monthlyPoints += 20;
        submitter.updateBadge();
        await submitter.save();
        console.log(`✅ Awarded 20 points to report submitter: ${submitter.name}`);
      }

      // Award 5 points to each user who upvoted
      if (report.upvotedBy && report.upvotedBy.length > 0) {
        for (const upvoter of report.upvotedBy) {
          const upvoterUser = await User.findById(upvoter._id);
          if (upvoterUser) {
            upvoterUser.points += 5;
            upvoterUser.monthlyPoints += 5;
            upvoterUser.updateBadge();
            await upvoterUser.save();
            console.log(`✅ Awarded 5 points to upvoter: ${upvoterUser.name}`);
          }
        }
      }
    }

    // Send notification if status changed
    if (oldStatus !== 'RESOLVED') {
      try {
        const notificationService = require('../services/notificationService');
        if (report.userId.fcmToken) {
          await notificationService.sendReportStatusUpdateNotification(
            report.userId.fcmToken,
            report.title,
            'resolved',
            reportId,
            report.userId._id
          );
          console.log('✅ Status update notification sent to user');
        }
      } catch (error) {
        console.error('❌ Failed to send status update notification:', error);
      }
    }

    // Emit socket event
    if (global.io) {
      global.io.emit('reportStatusUpdated', report);
    }

    res.status(200).json({
      success: true,
      message: "Report resolved successfully! Points awarded.",
      data: {
        report
      }
    });
  } catch (error) {
    console.error("Update report status resolve error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to resolve report"
    });
  }
};

// Get report traffic (counts based on time range)
const getReportTraffic = async (req, res) => {
  try {
    const { range = '24h' } = req.query; // '1h', '24h', '7d'
    const now = new Date();
    let matchStage = {};
    let groupStage = {};
    let sortStage = { "_id": 1 };
    let formatData = [];

    if (range === '1h') {
      // Last 60 minutes, grouped by minute
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      matchStage = { createdAt: { $gte: oneHourAgo }, reportStatus: { $ne: 'DELETED' } };
      groupStage = {
        _id: { $minute: "$createdAt" }, // 0-59
        count: { $sum: 1 },
        hour: { $hour: "$createdAt" } // Need hour to differentiate spanning across hour boundary
      };

      const traffic = await Report.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              hour: { $hour: "$createdAt" },
              minute: { $minute: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.hour": 1, "_id.minute": 1 } }
      ]);

      // Fill gaps for last 60 minutes
      for (let i = 59; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60000);
        const h = d.getHours();
        const m = d.getMinutes();
        const found = traffic.find(t => t._id.hour === h && t._id.minute === m);

        formatData.push({
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          count: found ? found.count : 0,
          raw: d
        });
      }

    } else if (range === '7d') {
      // Last 7 days, grouped by day
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchStage = { createdAt: { $gte: sevenDaysAgo }, reportStatus: { $ne: 'DELETED' } };

      const traffic = await Report.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.month": 1, "_id.day": 1 } }
      ]);

      // Fill gaps for last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const found = traffic.find(t => t._id.month === month && t._id.day === day);

        formatData.push({
          time: `${d.getDate()}/${d.getMonth() + 1}`,
          count: found ? found.count : 0,
          raw: d
        });
      }

    } else {
      // Default: Last 24 hours (or Today), grouped by hour
      // Let's do Rolling 24 Hours for better "stock ticker" feel
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      matchStage = { createdAt: { $gte: twentyFourHoursAgo }, reportStatus: { $ne: 'DELETED' } };

      const traffic = await Report.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              day: { $dayOfMonth: "$createdAt" },
              hour: { $hour: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.day": 1, "_id.hour": 1 } }
      ]);

      // Fill gaps for last 24 hours
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const day = d.getDate();
        const hour = d.getHours();
        const found = traffic.find(t => t._id.day === day && t._id.hour === hour);

        formatData.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          count: found ? found.count : 0,
          hour: hour // Used for socket updates
        });
      }
    }

    res.status(200).json({
      success: true,
      data: formatData
    });
  } catch (error) {
    console.error("Get report traffic error:", error);
    res.status(500).json({ error: "Failed to get report traffic" });
  }
};

// Get overall stats
const getReportStats = async (req, res) => {
  try {
    const total = await Report.countDocuments({ reportStatus: { $ne: 'DELETED' } });
    const resolved = await Report.countDocuments({ reportStatus: 'RESOLVED' });
    const active = await Report.countDocuments({ reportStatus: { $in: ['SUBMITTED', 'ACKNOWLEDGED'] } }); // Assuming 'SUBMITTED' is new/active

    res.status(200).json({
      success: true,
      data: {
        total,
        active, // or pending
        resolved
      }
    });
  } catch (error) {
    console.error("Get report stats error:", error);
    res.status(500).json({ error: "Failed to get report stats" });
  }
};

module.exports = {
  createReport,
  getNearbyReports,
  getReportsInBounds,
  getNearbyReportsByDepartment,
  acknowledgeReport,
  resolveReport,
  deleteReport,
  getUserReports,
  getAllReports,
  upvoteReport,
  getAllReportsForMobile,
  getUserReportsForMobile,
  updateReportStatusResolve,
  mlWebhook,
  getReportTraffic,
  getReportStats
};