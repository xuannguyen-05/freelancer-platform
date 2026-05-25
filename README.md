# 🎯 Freelancer Marketplace 

**Freelancer Marketplace** là một REST API backend cho nền tảng freelance tương tự Fiverr, giúp freelancer bán dịch vụ, buyer tìm dịch vụ, và quản lý dự án/hợp đồng.

Được xây dựng với **Node.js + Express.js + MongoDB (Mongoose) + JWT**.

---

## 📋 Tính Năng Chính

### 🎓 Cho Freelancer
- ✅ **Tạo Gig** - Dịch vụ với nhiều package (Basic, Standard, Premium)
- ✅ **Quản Lý Profile** - Kỹ năng, level, rating, bio
- ✅ **Nhận Đơn Hàng** - Từ buyer đặt gig hoặc project
- ✅ **Lịch Sử Đơn Hàng** - Theo dõi tất cả đơn hàng
- ✅ **Chat với Buyer** - Real-time messaging qua conversation
- ✅ **Quản Lý Contract** - Hợp đồng, status, payment

### 👨‍💼 Cho Buyer
- ✅ **Duyệt Gig** - Tìm kiếm freelancer theo danh mục, kỹ năng
- ✅ **Đặt Hàng** - Chọn package, trả tiền
- ✅ **Tạo Project** - Post dự án, tạo task, chỉ định freelancer
- ✅ **Chat & Collab** - Tương tác qua conversation, đàm phán
- ✅ **Đánh Giá** - Review freelancer, để rating, comment
- ✅ **Hợp Đồng** - Quản lý hợp đồng, deadline, payment

### 🎯 Chung
- ✅ **Xác Thực** - JWT token, đăng ký/đăng nhập
- ✅ **Phân Quyền** - Buyer, Freelancer, Admin roles
- ✅ **Danh Mục** - Categories cho Gigs
- ✅ **Kỹ Năng** - Skills management
- ✅ **Swagger API Docs** - Auto-generated documentation

---

## 💻 Tech Stack

| Công Nghệ | Phiên Bản | Mục Đích |
|-----------|----------|---------|
| **Node.js** | - | JavaScript Runtime |
| **Express.js** | 4.22.1 | Web Framework |
| **MongoDB** | - | NoSQL Database |
| **Mongoose** | 9.3.1 | ODM (Object Data Modeling) |
| **JWT** | 9.0.3 | Authentication |
| **Bcrypt** | 6.0.0 | Password Hashing |
| **Zod** | 4.3.6 | Schema Validation |
| **Multer** | 2.1.1 | File Upload |
| **Swagger** | 6.2.8 | API Documentation |
| **api-query-params** | 6.1.0 | Filtering, Sorting, Pagination |

---

## 🏗️ Kiến Trúc Backend

```
┌──────────────────────────────┐
│   CLIENT (Web/Mobile App)    │
└─────────────┬────────────────┘
              │ HTTP/REST
              ▼
┌──────────────────────────────────────┐
│    EXPRESS API GATEWAY (8888)        │
├──────────────────────────────────────┤
│ Middlewares:                         │
│  ├─ auth.middleware      (JWT)       │
│  ├─ role.middleware      (Permission)│
│  ├─ validate.middleware  (Zod)       │
│  ├─ upload.middleware    (Multer)    │
│  └─ normalizeUploadField (Parse)     │
└────────────┬──────────────────────────┘
             │
   ┌─────────┴──────────┐
   │                    │
┌──▼────────────┐  ┌───▼──────────┐
│ API Routes    │  │  API Docs    │
├───────────────┤  ├──────────────┤
│ /api/auth     │  │ /api-docs    │
│ /api/users    │  │ (Swagger UI) │
│ /api/gigs     │  └──────────────┘
│ /api/orders   │
│ /api/projects │
│ /api/messages │
└──┬────────────┘
   │
┌──▼──────────────────────────┐
│  CONTROLLERS/SERVICES       │
├─────────────────────────────┤
│ • Auth Service              │
│ • Gig Service               │
│ • Order Service             │
│ • Project Service           │
│ • Message Service           │
│ • Review Service            │
│ • Contract Service          │
└──┬──────────────────────────┘
   │
┌──▼──────────────────────────┐
│  MONGOOSE ODM               │
├─────────────────────────────┤
│ • Query Builder             │
│ • Document Validation       │
│ • Relationship Management   │
└──┬──────────────────────────┘
   │
┌──▼──────────────────────────┐
│   MongoDB Database          │
├─────────────────────────────┤
│ • users                     │
│ • gigs                      │
│ • orders                    │
│ • projects                  │
│ • tasks                     │
│ • contracts                 │
│ • reviews                   │
│ • conversations             │
│ • messages                  │
│ • categories                │
│ • skills                    │
└─────────────────────────────┘

┌─────────────────┐
│  File Storage   │
│ /public/uploads │
└─────────────────┘
```

---

## 📦 Cấu Trúc Project

```
backend/
├── src/
│   ├── server.js                       # Entry point, DB connection
│   ├── app.js                          # Express app setup
│   ├── config/
│   │   ├── database.js                 # MongoDB connection
│   │   └── swagger.js                  # Swagger/OpenAPI config
│   ├── constants/
│   │   ├── orderStatus.js              # Order statuses (pending, completed, cancelled)
│   │   ├── projectStatus.js            # Project statuses (planning, in_progress...)
│   │   ├── contractStatus.js           # Contract statuses
│   │   └── taskStatus.js               # Task statuses
│   ├── middlewares/
│   │   ├── auth.middleware.js          # JWT verification
│   │   ├── role.middleware.js          # Role-based access control
│   │   ├── validate.middleware.js      # Zod schema validation
│   │   ├── upload.middleware.js        # Multer file upload
│   │   ├── normalizeUploadField.middleware.js # Parse upload field
│   │   └── parsePackages.middleware.js # Parse package JSON
│   ├── models/                         # Mongoose schemas
│   │   ├── user.js                     # User model (buyer, freelancer, admin)
│   │   ├── gig.js                      # Gig model (dịch vụ freelancer)
│   │   ├── package.js                  # Package model (gói trong gig)
│   │   ├── order.js                    # Order model (đơn hàng từ gig)
│   │   ├── project.js                  # Project model (dự án)
│   │   ├── task.js                     # Task model (nhiệm vụ trong project)
│   │   ├── contract.js                 # Contract model (hợp đồng)
│   │   ├── review.js                   # Review model (đánh giá)
│   │   ├── conversation.js             # Conversation model (chat)
│   │   ├── message.js                  # Message model (tin nhắn)
│   │   ├── category.js                 # Category model (danh mục)
│   │   └── skill.js                    # Skill model (kỹ năng)
│   ├── controllers/                    # Business logic
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── freelancer.controller.js
│   │   ├── gig.controller.js
│   │   ├── package.controller.js
│   │   ├── order.controller.js
│   │   ├── project.controller.js
│   │   ├── task.controller.js
│   │   ├── contract.controller.js
│   │   ├── review.controller.js
│   │   ├── conversation.controller.js
│   │   ├── message.controller.js
│   │   ├── category.controller.js
│   │   └── skill.controller.js
│   ├── services/                       # Data access & business logic
│   │   ├── auth.service.js
│   │   ├── gig.service.js
│   │   ├── order.service.js
│   │   ├── project.service.js
│   │   ├── message.service.js
│   │   └── ... (tương tự cho mỗi controller)
│   ├── schemas/                        # Zod validation schemas
│   │   ├── auth.schema.js              # Register, Login validation
│   │   ├── gig.schema.js               # Create/Update Gig
│   │   ├── order.schema.js             # Create Order
│   │   ├── project.schema.js           # Create Project
│   │   ├── message.schema.js           # Send Message
│   │   └── ... (tương tự)
│   ├── routes/
│   │   ├── index.js                    # API routes aggregator
│   │   ├── auth.routes.js              # /api/auth
│   │   ├── user.routes.js              # /api/users
│   │   ├── freelancer.routes.js        # /api/freelancers
│   │   ├── gig.routes.js               # /api/gigs
│   │   ├── package.routes.js           # /api/packages
│   │   ├── order.routes.js             # /api/orders
│   │   ├── project.routes.js           # /api/projects
│   │   ├── task.routes.js              # /api/tasks
│   │   ├── contract.routes.js          # /api/contracts
│   │   ├── review.routes.js            # /api/reviews
│   │   ├── conversation.routes.js      # /api/conversations
│   │   ├── message.routes.js           # /api/messages
│   │   ├── category.routes.js          # /api/categories
│   │   └── skill.routes.js             # /api/skills
│   ├── utils/
│   │   ├── AppError.js                 # Custom error class
│   │   ├── objectIdSchema.js           # ObjectId validation
│   │   ├── formatUser.js               # Format user data
│   │   ├── formatGig.js                # Format gig response
│   │   ├── formatOrder.js              # Format order response
│   │   ├── formatProject.js            # Format project response
│   │   ├── formatFreelancer.js         # Format freelancer profile
│   │   ├── formatContract.js           # Format contract
│   │   ├── formatConversation.js       # Format conversation
│   │   ├── formatMessage.js            # Format message
│   │   ├── formatReview.js             # Format review
│   │   ├── formatTask.js               # Format task
│   │   └── formatPackage.js            # Format package
│   └── constants/
│
├── public/
│   └── uploads/                        # Directory for uploaded files
│
├── .env                                # Environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## 🔌 API Endpoints

### 🔐 Auth (Xác Thực)
```
POST   /api/auth/register              - Đăng ký tài khoản
POST   /api/auth/login                 - Đăng nhập
GET    /api/auth/me                    - Lấy thông tin user hiện tại (auth)
```

### 👤 Users (Người Dùng)
```
GET    /api/users/:id                  - Lấy thông tin user
```

### 💼 Freelancers (Hồ Sơ Freelancer)
```
POST   /api/freelancers/               - Tạo hồ sơ freelancer (auth, role: freelancer)
GET    /api/freelancers/:id            - Xem hồ sơ freelancer (công khai)
GET    /api/freelancers/me             - Lấy hồ sơ của tôi (auth, role: freelancer)
PATCH  /api/freelancers/me             - Cập nhật hồ sơ (auth, role: freelancer)
```

### 🎯 Gigs (Dịch Vụ Freelancer)
```
GET    /api/gigs/                      - Danh sách gigs (filter, sort, page)
GET    /api/gigs/:id                   - Chi tiết gig

POST   /api/gigs/                      - Tạo gig mới (auth, role: freelancer)
PATCH  /api/gigs/:id                   - Cập nhật gig (auth, role: freelancer)
DELETE /api/gigs/:id                   - Xoá gig (auth, role: freelancer)

├─ Packages (Gói dịch vụ)
└─ POST   /api/gigs/:id/packages       - Thêm package vào gig
  └─ GET    /api/gigs/:id/packages     - Danh sách packages
```

### 📦 Orders (Đơn Hàng - Từ Gig)
```
POST   /api/orders/                    - Tạo đơn hàng (auth, role: buyer)

GET    /api/orders/my                  - Danh sách đơn hàng của tôi (auth, role: buyer)
GET    /api/orders/freelancer          - Đơn hàng nhận được (auth, role: freelancer)
GET    /api/orders/:id                 - Chi tiết đơn hàng (auth)

PATCH  /api/orders/:id/cancel          - Huỷ đơn hàng (auth)
```

**Order Status:** `pending` → `completed` | `cancelled`

### 🎓 Projects (Dự Án)
```
POST   /api/projects/                  - Tạo dự án (auth, role: buyer)

GET    /api/projects/my                - Danh sách dự án của tôi (auth)
GET    /api/projects/detail/:id        - Chi tiết dự án (auth)

PATCH  /api/projects/:id               - Cập nhật dự án (auth, role: buyer)
PATCH  /api/projects/:id/complete      - Hoàn thành dự án (auth)
PATCH  /api/projects/:id/cancel        - Huỷ dự án (auth)

├─ Tasks (Nhiệm vụ)
└─ POST   /api/projects/:id/tasks      - Tạo task trong dự án
  ├─ GET    /api/projects/:id/tasks    - Danh sách tasks
  └─ PATCH  /api/tasks/:id             - Cập nhật task
```

**Project Status:** `planning` → `in_progress` → `delivered` → `completed` | `cancelled`

### 📋 Contracts (Hợp Đồng)
```
GET    /api/contracts/                 - Danh sách hợp đồng (auth)
GET    /api/contracts/:id              - Chi tiết hợp đồng (auth)

POST   /api/contracts/                 - Tạo hợp đồng (auth)
PATCH  /api/contracts/:id              - Cập nhật hợp đồng (auth)
```

### ⭐ Reviews (Đánh Giá)
```
POST   /api/reviews/                   - Tạo review (auth, role: buyer)
GET    /api/reviews/:freelancerId      - Danh sách reviews của freelancer (công khai)
```

### 💬 Messages & Conversations (Chat)
```
POST   /api/conversations/             - Tạo conversation (auth)
GET    /api/conversations/:orderId     - Lấy conversation theo orderId (auth)

POST   /api/conversations/:conversationId/messages      - Gửi tin nhắn (auth)
GET    /api/conversations/:conversationId/messages      - Danh sách messages (auth)
```

### 📁 Categories (Danh Mục)
```
GET    /api/categories/                - Danh sách categories (công khai)
GET    /api/categories/:id             - Chi tiết category (công khai)

POST   /api/categories/                - Tạo category (auth, role: admin)
PATCH  /api/categories/:id             - Cập nhật category (auth, role: admin)
DELETE /api/categories/:id             - Xoá category (auth, role: admin)
```

### 🏷️ Skills (Kỹ Năng)
```
GET    /api/skills/                    - Danh sách skills (công khai)
GET    /api/skills/:id                 - Chi tiết skill (công khai)

POST   /api/skills/                    - Tạo skill (auth, role: admin)
PATCH  /api/skills/:id                 - Cập nhật skill (auth, role: admin)
DELETE /api/skills/:id                 - Xoá skill (auth, role: admin)
```

### 🛍️ Packages (Gói Dịch Vụ)
```
GET    /api/packages/                  - Danh sách packages
GET    /api/packages/:id               - Chi tiết package

POST   /api/packages/:id/packages      - (Nested trong Gig)
PATCH  /api/packages/:id               - Cập nhật package (auth, role: freelancer)
DELETE /api/packages/:id               - Xoá package (auth, role: freelancer)
```

### 📊 Swagger Documentation
```
GET    /api-docs                       - Swagger UI (Interactive API docs)
```

---

## 🔐 Security & Authentication

- 🔐 **JWT Token** - Bearer token in Authorization header
- 🔑 **Bcrypt** - Password hashing with salt rounds
- ✓ **Role-Based Access Control** - buyer, freelancer, admin
- ✓ **Input Validation** - Zod schema validation
- ✓ **Error Sanitization** - No sensitive data in responses
- ✓ **CORS** - Cross-origin request handling
- ✓ **File Upload** - Multer with size limits

---

## 🧪 Design Patterns

| Pattern | Cách Dùng |
|---------|-----------|
| **Service Layer** | Tách business logic khỏi controller |
| **Middleware Chain** | Auth → Validate → Upload → Handler |
| **Formatter Utils** | Transform response data trước gửi |
| **Enum Pattern** | Order/Project/Task statuses |
| **Nested Routes** | Messages trong Conversation |
| **Role-Based Middleware** | Kiểm tra permission |

---

## 📝 Environment Variables

```env
PORT=8888
HOST_NAME=localhost

# MongoDB
MONGO_URI=mongodb://localhost:27017/freelancer

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d

# File Upload
MAX_FILE_SIZE=5242880  # 5MB
UPLOAD_DIR=public/uploads
```

---

## 🚀 Cách Chạy

### 1. Cài Đặt Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
# Tạo file .env
PORT=8888
HOST_NAME=localhost
MONGO_URI=mongodb://localhost:27017/freelancer
JWT_SECRET=your_secret_key
```

### 3. Chạy Server
```bash
# Development (với auto-reload)
npm run dev

# Production
npm start
```

Server sẽ chạy tại `http://localhost:8888`
API Docs tại `http://localhost:8888/api-docs`

---

## ✅ Key Concepts

### 🎯 Gig vs Project
- **Gig** - Dịch vụ có sẵn của freelancer (kiểu menu)
  - Buyer browse → chọn package → tạo Order
  
- **Project** - Dự án custom từ buyer
  - Buyer post yêu cầu → freelancer bid → tạo Contract
  - Có tasks, deadline, budget

### 💼 Order vs Contract
- **Order** - Từ Gig, freelancer biết ngay công việc gì
  - Status: pending, completed, cancelled
  
- **Contract** - Từ Project, cần negotiate
  - Status: pending, accepted, working, completed, cancelled

### 💬 Conversation
- Tự động tạo khi Order được tạo
- Buyer & Freelancer chat qua Messages
- Linked với Order

### ⭐ Reviews
- Chỉ Buyer có thể review Freelancer
- Sau khi Order completed
- Cập nhật rating & reviewCount của freelancer

---

