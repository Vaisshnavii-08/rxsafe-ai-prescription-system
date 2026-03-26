# Prescription Error Detection API

A production-ready Node.js backend for analyzing prescription images, detecting drug interactions, and providing safer alternatives. Built with Express, MongoDB, Tesseract.js OCR, and NLP.

## Features

- 🔐 **Secure Authentication**: JWT-based auth with role-based access control (Patient, Doctor, Admin)
- 📤 **Prescription Upload**: Support for both multipart/form-data and base64 image uploads
- 🔍 **OCR Processing**: Tesseract.js (default) with Google Vision API integration
- 🧠 **NLP Extraction**: Compromise library + regex to extract drug names, doses, frequencies
- ⚠️ **Drug Interaction Detection**: RxNorm API with local fallback database
- 📊 **Severity Scoring**: Life-threatening (100), Major (75), Moderate (50), Minor (20)
- 💊 **Safer Alternatives**: Intelligent suggestions for high-risk medications
- 📍 **GeoJSON Doctor Search**: Find nearby doctors by specialty and distance
- 🗂️ **GridFS File Storage**: MongoDB-based file storage (no external S3 needed)

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB (Atlas) with Mongoose ODM
- **File Storage**: GridFS
- **Authentication**: JWT + bcryptjs
- **OCR**: Tesseract.js / Google Vision API
- **NLP**: Compromise library
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **Logging**: Winston
- **Security**: Helmet, CORS, express-rate-limit

## Quick Start

### 1. Clone and Install

\`\`\`bash
git clone <repository-url>
cd prescription-detection
npm install
\`\`\`

### 2. Set Up Replit Secrets

Click the lock icon (🔒) in the left sidebar and add these secrets:

**Required:**
- `MONGODB_URI`: Your MongoDB Atlas connection string
  - Example: `mongodb+srv://user:pass@cluster.mongodb.net/prescriptions?retryWrites=true&w=majority`
- `JWT_SECRET`: Random secret key for JWT signing
  - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**Optional:**
- `GOOGLE_API_KEY`: For Google Vision OCR (defaults to Tesseract.js)
- `RXNORM_API_KEY`: For RxNorm drug database (defaults to local fallback)
- `ENABLE_REMOTE_RXNORM`: Set to `true` to use RxNorm API

### 3. Environment Variables

See `.env.example` for all available configuration options.

### 4. Seed Sample Data

\`\`\`bash
# Seed sample doctors with geolocation
node seed/seedDoctors.js

# Or use the API endpoint (requires admin role)
curl -X POST http://localhost:5000/api/admin/seed-drugs \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
\`\`\`

### 5. Run the Server

\`\`\`bash
npm run dev
\`\`\`

Server will run on `http://localhost:5000`

## API Documentation

### Base URL
\`\`\`
http://localhost:5000/api
\`\`\`

### Authentication Endpoints

#### Signup
\`\`\`bash
curl -X POST http://localhost:5000/api/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepass123",
    "role": "patient"
  }'
\`\`\`

#### Signup Doctor (with location)
\`\`\`bash
curl -X POST http://localhost:5000/api/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Dr. Jane Smith",
    "email": "jane@example.com",
    "password": "securepass123",
    "role": "doctor",
    "specialties": ["Cardiology", "Internal Medicine"],
    "location": {
      "type": "Point",
      "coordinates": [-122.4194, 37.7749]
    }
  }'
\`\`\`

#### Login
\`\`\`bash
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }'
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "patient"
    }
  }
}
\`\`\`

#### Get Current User
\`\`\`bash
curl -X GET http://localhost:5000/api/auth/me \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

### Prescription Endpoints

#### Upload Prescription (Multipart)
\`\`\`bash
curl -X POST http://localhost:5000/api/prescriptions/upload \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@/path/to/prescription.jpg" \\
  -F "notes=Patient reported headache"
\`\`\`

#### Upload Prescription (Base64)
\`\`\`bash
curl -X POST http://localhost:5000/api/prescriptions/upload \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "filename": "prescription.jpg",
    "contentType": "image/jpeg",
    "data": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "notes": "Sample prescription"
  }'
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "message": "Prescription uploaded successfully. Processing in progress.",
  "data": {
    "prescriptionId": "507f1f77bcf86cd799439011",
    "status": "processing"
  }
}
\`\`\`

#### Get Prescription by ID
\`\`\`bash
curl -X GET http://localhost:5000/api/prescriptions/507f1f77bcf86cd799439011 \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

#### List Prescriptions (with filters)
\`\`\`bash
curl -X GET "http://localhost:5000/api/prescriptions?page=1&limit=10&minSeverity=50" \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

### Doctor Search

#### Find Nearby Doctors
\`\`\`bash
curl -X GET "http://localhost:5000/api/doctors/nearby?lat=37.7749&lng=-122.4194&radiusKm=10&specialty=Cardiology" \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "id": "...",
        "name": "Dr. Jane Smith",
        "specialties": ["Cardiology", "Internal Medicine"],
        "location": {
          "type": "Point",
          "coordinates": [-122.4194, 37.7749]
        },
        "distance": 0.5,
        "availability": "Mon-Fri 9AM-5PM"
      }
    ],
    "count": 1
  }
}
\`\`\`

### User Management

#### List Users (Doctor/Admin only)
\`\`\`bash
curl -X GET "http://localhost:5000/api/users?page=1&limit=10&role=patient" \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

#### Get User by ID
\`\`\`bash
curl -X GET http://localhost:5000/api/users/USER_ID \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

### Admin Endpoints

#### Seed Drug Database
\`\`\`bash
curl -X POST http://localhost:5000/api/admin/seed-drugs \\
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
\`\`\`

### Webhooks

#### OCR Complete Callback
\`\`\`bash
curl -X POST http://localhost:5000/api/webhooks/ocr-complete \\
  -H "Content-Type: application/json" \\
  -d '{
    "prescriptionId": "507f1f77bcf86cd799439011",
    "ocrText": "Aspirin 81mg once daily...",
    "provider": "google",
    "confidence": 0.95
  }'
\`\`\`

## Prescription Processing Pipeline

1. **File Upload** → GridFS storage
2. **OCR Processing** → Tesseract.js or Google Vision
3. **NLP Extraction** → Drug names, doses, frequencies
4. **Interaction Check** → RxNorm API or local database
5. **Alert Generation** → Severity scoring and recommendations
6. **Safer Alternatives** → Suggest better options for high-risk drugs

## Data Models

### User
- `name`, `email`, `passwordHash`, `role` (patient/doctor/admin)
- `specialties[]` (for doctors)
- `location` (GeoJSON Point for doctors)

### Prescription
- `uploader`, `patient`, `fileId` (GridFS)
- `ocrText`, `ocrProvider`, `nlpResult`
- `alerts[]`, `suggestions[]`, `severityScore`
- `processingStatus` (pending/processing/completed/failed)

### DrugLexicon
- `name`, `normalizedName`, `synonyms[]`
- `rxNormId`, `commonDoses[]`, `category`

### Interaction
- `drugA`, `drugB`, `severity`, `severityLabel`
- `description`, `recommendedAction`, `references[]`

## Security

- **Authentication**: JWT tokens with configurable expiration
- **Password Hashing**: bcryptjs with salt rounds
- **Rate Limiting**: 30 requests/minute on upload endpoint (configurable)
- **Input Validation**: Joi schemas on all endpoints
- **CORS**: Configurable allowed origins
- **Helmet**: Security headers enabled
- **File Type Validation**: Only JPEG, PNG, PDF allowed

## Testing

\`\`\`bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
\`\`\`

## Provider Configuration

### Switch to Google Vision OCR

1. Add `GOOGLE_API_KEY` to Replit Secrets
2. Set `OCR_PROVIDER=google` in environment
3. Restart server

### Enable RxNorm API

1. Add `RXNORM_API_KEY` to Replit Secrets
2. Set `ENABLE_REMOTE_RXNORM=true` in environment
3. Restart server

## Postman Collection

Import `docs/postman_collection.json` into Postman for a complete API collection with:
- Pre-configured requests
- Environment variables
- Auto-token management

## Project Structure

\`\`\`
├── config/           # Database and logger configuration
├── models/           # Mongoose models
├── routes/           # Express routes
├── controllers/      # Request handlers
├── services/         # Business logic (OCR, NLP, interactions, storage)
├── utils/            # Middleware and validators
├── tests/            # Integration tests
├── seed/             # Database seeding scripts
├── docs/             # Postman collection
├── logs/             # Winston logs
├── app.js            # Express app setup
└── server.js         # Server entry point
\`\`\`

## Deployment to Replit

1. Fork this repl
2. Add secrets via Secrets pane
3. Click "Run" button
4. API available at `https://your-repl.repl.co`

## Troubleshooting

### MongoDB Connection Issues
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas network access (allow all IPs for Replit)
- Ensure database user has read/write permissions

### OCR Not Working
- Tesseract.js works out of the box (no configuration needed)
- For Google Vision, verify API key and enable Vision API in Google Cloud

### Rate Limiting Errors
- Adjust `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS` in environment
- Default: 30 requests per minute

## Support

For issues or questions:
1. Check the API documentation above
2. Review the Postman collection
3. Check server logs in `logs/` directory

## License

MIT

---

Built with ❤️ for safer prescriptions
