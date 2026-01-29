const express = require('express');
const multer = require('multer');
const {
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
} = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateReportSubmission } = require('../middlewares/validation');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for audio files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and audio files are allowed'), false);
    }
  }
});

const router = express.Router();

// Public geolocation routes (no auth required for viewing nearby reports)
router.get('/test', (req, res) => res.json({ message: 'Public route working!' }));
router.get('/nearby', getNearbyReports);
router.get('/bounds', getReportsInBounds);
router.get('/nearby/department', getNearbyReportsByDepartment);
router.get('/get-all-reports', getAllReportsForMobile);

// ML Webhook (no auth required)
router.post('/ml-webhook', mlWebhook);

// Protected routes (require valid token)
// Note: Middleware is applied per-route to support both User and Admin access where needed

// Mobile client routes
// Mobile client routes (User only)
router.post('/create-report', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'voice', maxCount: 1 }]), validateReportSubmission, createReport);
router.post('/:reportId/upvote-report', authMiddleware, upvoteReport);
router.get('/fetch-user-reports', authMiddleware, getUserReportsForMobile);
router.patch('/:reportId/update-report-status-resolve', authMiddleware, updateReportStatusResolve);

// Legacy routes (keep for backward compatibility)
// Legacy routes (keep for backward compatibility)
router.post('/', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'voice', maxCount: 1 }]), validateReportSubmission, createReport);
router.get('/my-reports', authMiddleware, getUserReports);
router.patch('/:reportId/resolve', authMiddleware, resolveReport);

// Admin routes (Admin only)
router.get('/all', adminMiddleware, getAllReports);
router.get('/stats', adminMiddleware, getReportStats);
router.get('/traffic', adminMiddleware, getReportTraffic);
router.patch('/:reportId/acknowledge', adminMiddleware, acknowledgeReport);
router.delete('/:reportId', adminMiddleware, deleteReport);

module.exports = router;