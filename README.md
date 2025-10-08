# Photography Portfolio Backend

Node.js/Express backend API for photography portfolio website.

## Features

- Gallery API endpoints
- Contact form submission
- Admin authentication
- Admin inbox for contact messages
- Image upload functionality
- JWT-based authentication

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-jwt-key
ADMIN_PASSWORD=admin123
```

3. Start server:
```bash
npm start
```

## API Endpoints

### Gallery
- `GET /api/gallery` - Get all photos
- `GET /api/gallery/:id` - Get single photo
- `POST /api/admin/gallery` - Add new photo (admin only)
- `DELETE /api/admin/gallery/:id` - Delete photo (admin only)

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/admin/contacts` - Get all contacts (admin only)
- `PUT /api/admin/contacts/:id/read` - Mark as read (admin only)
- `DELETE /api/admin/contacts/:id` - Delete contact (admin only)

### Admin
- `POST /api/admin/login` - Admin login

## Tech Stack

- Node.js
- Express.js
- JWT for authentication
- Multer for file uploads
- CORS for cross-origin requests