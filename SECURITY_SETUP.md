# 🔒 Security Configuration Guide

## ⚠️ IMPORTANT: Before GitHub Push

### **Hardcoded Data Removed:**
- ✅ Ngrok URLs sanitized
- ✅ Local IP addresses removed  
- ✅ Firebase credentials templated
- ✅ Environment variables configured

### **Files to Configure Locally:**

#### 1. **Flutter App Configuration**
File: `civic_reporter/lib/api/api_config.dart`
- Replace `YOUR_LOCAL_IP` with your actual IP address
- Update ngrok URL when running development server

#### 2. **Firebase Configuration**
File: `civic_reporter/lib/firebase_options.dart`
- Replace placeholder values with your Firebase project credentials
- Get credentials from Firebase Console

#### 3. **Backend Environment**
File: `backend-server/.env`
- Copy from `.env.example`
- Add your actual database credentials
- Configure API keys and secrets

#### 4. **Admin Dashboard Environment**
File: `admin-vite/.env`
- Copy from `.env.example`
- Set correct API endpoints

### **Development Setup:**

1. **Copy environment files:**
   ```bash
   cp backend-server/.env.example backend-server/.env
   cp admin-vite/.env.example admin-vite/.env
   ```

2. **Configure Firebase:**
   - Run `flutterfire configure` in civic_reporter/
   - This will generate proper firebase_options.dart

3. **Update API endpoints:**
   - Set your local IP in api_config.dart
   - Configure ngrok URL when needed

### **Production Deployment:**
- Use environment variables for all sensitive data
- Never commit actual credentials to version control
- Use CI/CD secrets for deployment

## ✅ **Security Checklist:**
- [ ] No hardcoded API keys
- [ ] No database credentials in code
- [ ] No private keys committed
- [ ] Environment files in .gitignore
- [ ] Placeholder values in templates