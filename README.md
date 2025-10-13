# Photography Portfolio Backend

A Node.js/Express backend API for managing a photography portfolio website with admin authentication, gallery management, and contact form functionality.

## 🚀 Features

- **Gallery Management**: CRUD operations for photo gallery
- **Admin Authentication**: JWT-based admin login system
- **File Upload**: Image upload with multer
- **Contact Form**: Handle contact form submissions
- **CORS Support**: Cross-origin resource sharing enabled
- **Static File Serving**: Serve uploaded images

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Password Hashing**: bcryptjs
- **CORS**: cors middleware

## 📁 Project Structure

```
backend/
├── server.js          # Main server file
├── models/
│   ├── Gallery.js     # Gallery mongoose model
│   └── Contact.js     # Contact mongoose model
├── public/
│   └── uploads/       # Uploaded images directory
├── .env               # Environment variables
└── README.md
```

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd portfolio-app/backend
   ```

2. **Install dependencies**
   ```bash
   npm install express cors multer bcryptjs jsonwebtoken mongoose dotenv
   ```

3. **Create required directories**
   ```bash
   mkdir -p models public/uploads
   ```

4. **Setup environment variables**
   Create a `.env` file:
   ```
   MONGO_URI=mongodb://localhost:27017/photography-portfolio
   PORT=5000
   JWT_SECRET=your-secret-key
   ```

5. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

6. **Start the server**
   ```bash
   node server.js
   ```

## 🌐 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gallery` | Get all gallery photos |
| GET | `/api/gallery/:id` | Get specific photo by ID |
| POST | `/api/contact` | Submit contact form |

### Admin Endpoints (Requires Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/gallery` | Add new photo |
| DELETE | `/api/admin/gallery/:id` | Delete photo |
| GET | `/api/admin/contacts` | Get all contacts |
| PUT | `/api/admin/contacts/:id/read` | Mark contact as read |
| DELETE | `/api/admin/contacts/:id` | Delete contact |

## 🔐 Authentication

The API uses JWT tokens for admin authentication:

- **Default Admin Password**: `admin123`
- **JWT Secret**: `your-secret-key`
- **Token Expiry**: 24 hours

### Login Request
```json
POST /api/admin/login
{
  "password": "admin123"
}
```

### Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 📸 Gallery Management

### Add Photo
```json
POST /api/admin/gallery
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "title": "Photo Title",
  "category": "portrait",
  "description": "Photo description",
  "image": <file>
}
```

### Gallery Data Structure
```json
{
  "id": 1,
  "title": "Beautiful Sunset",
  "category": "landscape",
  "imageUrl": "/uploads/1234567890-sunset.jpg",
  "description": "A stunning sunset photograph"
}
```

## 📧 Contact Form

### Submit Contact
```json
POST /api/contact
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "Hello, I'm interested in your photography services."
}
```

## ⚙️ Configuration

### Environment Variables
- `MONGO_URI`: MongoDB connection string
- `PORT`: Server port (default: 5000)
- `JWT_SECRET`: JWT signing secret
- `NODE_ENV`: Environment mode

### CORS Origins
Currently configured for:
- `http://localhost:3000`
- `https://flat-renting-frontend.onrender.com`
- `https://backend-code-1-nctw.onrender.com`

## 🚀 Deployment

The server is configured for production deployment with:
- Static file serving for uploaded images
- CORS configuration for multiple origins
- Environment-based port configuration

## 📝 Data Storage

- **Gallery Data**: MongoDB collection with Mongoose
- **Contact Data**: MongoDB collection with Mongoose
- **Images**: Stored in `public/uploads/` directory

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcryptjs
- File upload validation
- CORS protection
- Admin-only protected routes

## 🐛 Error Handling

The API includes comprehensive error handling for:
- Invalid authentication
- File not found errors
- Database operation failures
- Invalid request data

## 📞 Support

For any issues or questions, please contact the development team or submit an issue in the repository.

---

**Note**: Remember to change the default admin password and JWT secret in production environment for security purposes.
