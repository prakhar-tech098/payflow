# PayFlow 💸
> A modern, full-stack SaaS platform for generating invoices and securely processing payments.

![PayFlow Logo](https://img.shields.io/badge/Status-Production_Ready-success)
![MERN Stack](https://img.shields.io/badge/Stack-MongoDB%20|%20Express%20|%20React%20|%20Node-blue)
![Payment](https://img.shields.io/badge/Payment-Razorpay-blueviolet)

PayFlow is a robust invoicing and payment gateway solution designed for merchants. It allows users to manage customers, generate dynamic PDF invoices, send automated email reminders, and process payments via a secure, unauthenticated public checkout link.

## ✨ Key Features
- **Merchant Dashboard:** Beautiful, glassmorphic UI to manage customers and track revenue analytics via Recharts.
- **Dynamic PDF Invoices:** Automatically generate and download professional PDF invoices.
- **Email Notifications:** Send invoices and payment reminders directly to customers via Nodemailer.
- **Public Checkout Links:** Secure, shareable links (`/pay/:id`) that allow customers to view and pay their invoices without creating an account.
- **Secure Payment Gateway:** Full Razorpay integration with backend HMAC SHA-256 cryptographic signature verification.
- **Authentication:** JWT-based authentication with bcrypt password hashing.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Axios, Recharts
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), JSON Web Tokens (JWT), Nodemailer
- **Payments:** Razorpay API

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account
- Razorpay Test Account
- Gmail App Password (for Nodemailer)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/prakhar-tech098/payflow.git
   cd payflow
   ```

2. **Install Dependencies**
   *Install both frontend and backend dependencies concurrently.*
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_gmail_app_password
   FRONTEND_URL=http://localhost:5173
   ```
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

4. **Run the Application**
   *Start both servers concurrently from the root directory.*
   ```bash
   npm run dev
   ```
   - Frontend will run on `http://localhost:5173`
   - Backend will run on `http://localhost:5000`

## 🔒 Security Practices
- **Never Store Cards:** All payment details are handled entirely by Razorpay.
- **Webhook Verification:** Payments are cryptographically verified server-side.
- **Environment Isolation:** Secrets are kept strictly in `.env` and never pushed to source control.

## 📝 License
This project is open-source and available under the MIT License.
