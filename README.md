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


