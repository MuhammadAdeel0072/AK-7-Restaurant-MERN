# 🌑 AK-7 REST — Midnight Gourmet

**A Premium, Full-Stack Dining Experience meticulously crafted for the digital age.**

AK-7 REST is a luxury restaurant management ecosystem built on the **MERN** stack. It combines cutting-edge performance with a bespoke "**Midnight Gourmet**" aesthetic to deliver a seamless, high-end experience across four specialized front-end modules—Client, Admin, Chef, and Rider—all powered by a robust, real-time Backend Server.

---

## 💎 The "Midnight Gourmet" Identity

The system is designed around a premium visual language ensuring a spectacular user experience across all modules:
- **Luxury Aesthetic**: A deep charcoal canvas accented with brushed gold and crimson highlights.
- **Glassmorphism**: UI components utilize high-end backdrop blurs and translucent borders for deep visual immersion.
- **Dynamic Micro-interactions**: Powered by `framer-motion`, every interaction—from menu selection to checkout to drag-and-drop order management—feels fluid, responsive, and alive.
- **Sharp Iconography**: Consistent and minimalist icons using `lucide-react` for a state-of-the-art look.

---

## 🚀 Core Modules

### 1. 🍽️ Premium Client App
The consumer-facing portal for ordering and discovery, engineered for aesthetics and ease of use.
- **Dynamic Catalog**: Real-time filtering, categorical sorting, and fuzzy search for delicacies.
- **Gourmet Cart**: Seamless addition, modification, and quantity management with dynamic state updates.
- **Enterprise-Grade Authentication**: Secure user login and profile management via a custom JWT-based identity system.
- **Stripe Payments**: Integrated checkout for secure, seamless digital transactions.

### 2. 👨‍🍳 Professional Chef Panel
A production-grade, industry-standard real-time kitchen management system designed for high-octane environments.
- **Real-Time Order Queue**: Instant synchronization via Socket.IO featuring smart FIFO queues and dynamic priority sorting.
- **Item-Level Tracking**: Granular tracking for each individual food item's preparation status.
- **Robust Alert System**: Real-time visual and audio notifications for incoming priority orders and critical kitchen events.
- **Multilingual & RTL Support**: Interface is fully localized in both **English** and **Urdu**, enabling kitchen staff versatility.
- **KPI Dashboard**: A comprehensive live dashboard providing insights on preparation efficiency, active load, and fulfillment rates.

### 3. 🛡️ Enterprise Admin Panel
The centralized command center for holistic restaurant operations.
- **Role-Based Security**: Integrated authentication ensuring strict, role-based access control (RBAC).
- **Staff Management**: Full lifecycle management of restaurant staff with performance metrics and datatable exports (PDF/Excel).
- **Complete Inventory Control**: Powerful CRUD interfaces to add, edit, or remove gourmet menu items and categories.
- **Comprehensive Order Monitoring**: Live, bird's-eye view of all active, pending, and historical orders.
- **System-Wide Sync**: Maintains absolute real-time state synchronization with all connected modules.

### 4. 🛵 Dedicated Rider Panel
A streamlined delivery management interface designed exclusively for the deployment fleet.
- **Real-Time Delivery Tracking**: Live updates of order progression instantly synchronized via Socket.IO.
- **Interactive Fulfillment**: Intuitive feedback gestures and tactile UI toggle actions to mark orders as "Out for Delivery" or "Delivered".
- **Optimized Layout**: High legibility, large typography, and mobile-responsive layouts tailored for on-the-go usage.
- **Multilingual Output**: Seamless translation support (English/Urdu) for an inclusive delivery workforce.

### 5. 🧠 Backend Infrastructure
The unseen, high-performance engine powering the entire ecosystem.
- **Real-Time Gateway**: Built with Socket.IO (v4) for zero-latency, bi-directional event emission across all modular nodes.
- **Secure Auth API**: Tightly coupled with custom JWT validation and proprietary middleware to ensure endpoint safety.
- **Data Persistence**: MongoDB with Mongoose ODM for structured, scalable, and relationship-driven data storage.
- **Automated Workflows**: Configured for automated email notifications (Nodemailer) and dynamic exports.

---

## 🛠️ Technical Stack

| Area | Technologies |
| :--- | :--- |
| **Frontend Frameworks** | React 19, Vite 8 |
| **Styling & UI** | Tailwind CSS 4, Framer Motion, Lucide React, react-hot-toast |
| **Backend Frameworks** | Node.js, Express 5 |
| **Real-Time Comm.** | Socket.IO 4 |
| **Database** | MongoDB (Mongoose 9) |
| **Authentication** | Custom JWT (Email + Password), Clerk |
| **Payment Gateway** | Stripe |
| **Localization (i18n)** | react-i18next (English / Urdu RTL) |
| **Deployment** | Vercel (Frontends), Render/Railway (Backend) |

---

## ⚙️ Installation & Setup

Ensure you have **Node.js 18+** and **npm** installed on your machine.

### 1. Clone the Repository
```bash
git clone https://github.com/adeeel/AK-7-Restaurant-MERN.git
cd AK-7-Restaurant-MERN
```

### 2. Configure Environment Variables
Each of the project modules requires its own `.env` file. You must set up configuration for MongoDB, JWT secrets, and payment gateways:
- `client/.env.local`
- `admin-panel/.env.local`
- `chef-panel/.env.local`
- `rider-panel/.env.local`
- `server/.env`

*(Refer to each folder's respective `.env.example` where applicable for exact key names).*

### 3. Install Dependencies
Install dependencies for the root orchestrator and all individual system modules:
```bash
# Root
npm install

# Backend Server
cd server && npm install

# Client App
cd ../client && npm install

# Admin Panel
cd ../admin-panel && npm install

# Chef Panel
cd ../chef-panel && npm install

# Rider Panel
cd ../rider-panel && npm install
```

### 4. Run the Ecosystem Locally
You can power up the complete multi-module ecosystem (Server, Client, Admin, Chef, and Rider) concurrently using a single command from the project root:

```bash
cd .. # Return to the root directory
npm run dev
```

---

## 👨‍💻 Author

**Muhammad Adeel Khan**
- Email: madeelkhan072@gmail.com
- GitHub: [MuhammadAdeel0072](https://github.com/MuhammadAdeel0072) / [adeeel](https://github.com/adeeel)

*Built with modern "Clean Code" standards, HCI principles, and high-performance system design to redefine digital dining.*
