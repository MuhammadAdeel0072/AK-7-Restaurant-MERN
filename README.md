# AK-7 REST — Midnight Gourmet 🪙🌑

**A Premium, Full-Stack Dining Experience meticulously crafted for the digital age.**

AK-7 REST is a luxury restaurant management ecosystem built on the **MERN** stack. It combines cutting-edge performance with a bespoke "**Midnight Gourmet**" aesthetic to deliver a seamless, high-end experience across four specialized modules: Client, Admin, Chef, and Backend Server.

---

## 💎 The "Midnight Gourmet" Identity
The system is designed around a premium visual language:
- **Luxury Aesthetic**: A deep charcoal canvas accented with brushed gold and crimson highlights.
- **Glassmorphism**: UI components utilize high-end backdrop blurs and translucent borders for visual depth.
- **Micro-interactions**: Powered by `framer-motion`, every interaction—from menu selection to checkout—feels fluid and responsive.
- **Sharp Iconography**: Consistent and minimalist icons using `lucide-react`.

---

## 🚀 Core Modules

### 1. 🍽️ Premium Client App
The consumer-facing portal for ordering and discovery.
- **Dynamic Catalog**: Real-time filtering and fuzzy search for delicacies.
- **Gourmet Cart**: Seamless addition and quantity management.
- **Social Authentication**: Secure login via Clerk (Google, X, Email OTP).
- **Stripe Payments**: Integrated checkout for secure transactions.

### 2. 👨‍🍳 Professional Chef Panel
A production-grade kitchen management system.
- **Real-time Order Queue**: Instant synchronization via Socket.io for incoming orders.
- **Item-level Tracking**: Track preparation status for each individual item within an order.
- **Multilingual Support**: Simplified interface available in **English** and **Urdu** (with RTL support).
- **KPI Dashboard**: Real-time stats on preparation efficiency.

### 3. 🛡️ Enterprise Admin Panel
The centralized command center for restaurant operations.
- **User Management**: Integrated authentication and role-based access.
- **Inventory Control**: Add, edit, or remove gourmet items and categories.
- **Order Monitoring**: Live view of all active and historical orders.
- **Real-time Sync**: Stays updated with both Chef and Client modules.

### 4. 🧠 Backend Infrastructure
The robust engine powering the entire ecosystem.
- **Real-time Engine**: Built with Socket.io (v4) for zero-latency updates.
- **Auth Management**: Powered by Clerk Node SDK for enterprise-grade security.
- **Data Persistence**: MongoDB with Mongoose for structured, scalable storage.
- **Automated workflows**: Email notifications (Nodemailer) and PDF invoice generation (PDFKit).

---

## 🛠️ Technical Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Framer Motion |
| **Backend** | Node.js, Express 5, Socket.io 4 |
| **Database** | MongoDB (Mongoose 9) |
| **Auth** | Clerk (Social + OTP) |
| **Payments** | Stripe |
| **Hosting** | Vercel (Frontend), Render/Railway (Backend) |

---

## ⚙️ Installation & Setup

Ensure you have **Node.js 18+** and **npm** installed.

### 1. Clone the repository
```bash
git clone https://github.com/adeeel/AK-7-Restaurant-MERN.git
cd AK-7-Restaurant-MERN
```

### 2. Setup Environment Variables
Each module requires its own `.env` file. Refer to the `.env.example` (if available) or standard Clerk/MongoDB/Stripe keys.

### 3. Install Dependencies
```bash
# Install Server dependencies
cd server && npm install

# Install Client dependencies
cd ../client && npm install

# Install Admin dependencies
cd ../admin-panel && npm install

# Install Chef dependencies
cd ../chef-panel && npm install
```

### 4. Run the Project
Open four terminal windows/tabs:

**Terminal 1: Backend Server**
```bash
cd server && npm run dev
```

**Terminal 2: Client Application**
```bash
cd client && npm run dev
```

**Terminal 3: Admin Panel**
```bash
cd admin-panel && npm run dev
```

**Terminal 4: Chef Panel**
```bash
cd chef-panel && npm run dev
```

---

## 👨‍💻 Author
**Muhammad Adeel Khan**
- Email: madeelkhan072@gmail.com
- GitHub: https://github.com/MuhammadAdeel0072

*Built with modern "Clean Code" standards and HCI principles to redefine digital dining.*
