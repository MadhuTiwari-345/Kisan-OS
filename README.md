# 🌾 Smart Agri Supply Chain Platform

> AI-powered digital marketplace and logistics platform connecting **farmers, mandis, buyers, and transporters** to create a transparent and efficient agricultural supply chain.

<p align="center">

<img src="https://img.shields.io/badge/Framework-Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/Backend-Python-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
<img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
<img src="https://img.shields.io/badge/AI-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
<img src="https://img.shields.io/badge/Style-TailwindCSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
<img src="https://img.shields.io/badge/State-Zustand-FF6B6B?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Deployment-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white"/>
<img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge&logo=open-source-initiative&logoColor=white"/>

</p>

---

# 🚀 Overview

Agriculture supply chains in many regions suffer from **price manipulation, inefficient logistics, lack of transparency, and unpredictable crop demand**.

Farmers often rely on intermediaries, resulting in **reduced profits and delayed payments**.

This project introduces an **AI-powered agricultural supply chain platform** that connects:

- Farmers  
- Buyers  
- Mandis  
- Logistics providers  

The system enables:

✔ Transparent crop marketplaces  
✔ AI-powered price prediction  
✔ Demand forecasting  
✔ Logistics route optimization  
✔ Real-time analytics  

The goal is to **increase farmer profits, reduce wastage, and optimize agricultural supply chains**.

---

# 🎥 Demo & Pitch Video & ppt

```

https://drive.google.com/drive/folders/1d6ZiSBFIIHAMjjDXJ_Ye3EEsGqFvTbsU?usp=sharing

```

The videos demonstrate:

1️⃣ Farmer registration  
2️⃣ Crop listing marketplace  
3️⃣ Buyer purchasing crops  
4️⃣ Logistics optimization  
5️⃣ AI price prediction  
6️⃣ Analytics dashboard  

---

# 🎯 Problem Statement

Current agricultural systems face multiple challenges:

### 1️⃣ Lack of Price Transparency
Farmers often do not know the **true market price of crops**.

### 2️⃣ Middlemen Exploitation
Intermediaries take large commissions, reducing farmer earnings.

### 3️⃣ Inefficient Logistics
Crop transportation is poorly optimized causing:

- Higher fuel costs  
- Delivery delays  
- Food wastage  

### 4️⃣ Lack of Demand Prediction
Farmers do not know which crops will have higher demand next season.

### 5️⃣ Fragmented Data
Agricultural data exists across multiple systems and is difficult to analyze.

---

# 💡 Solution

This platform provides a **digital ecosystem for agricultural trade and logistics powered by AI**.

Key capabilities:

- Crop marketplace for farmers and buyers  
- AI-based mandi price prediction  
- Smart logistics route optimization  
- Crop demand forecasting  
- Real-time analytics dashboard  
- Transparent digital transactions  

This ensures **fair pricing, efficient supply chains, and data-driven farming decisions**.

---

# ✨ Core Features

## 🌱 Farmer Management

Farmers can:

- Register and verify their profiles  
- Add farm details  
- List crops for sale  
- Track orders and payments  

---

## 🏪 Smart Crop Marketplace

Buyers can:

- Browse crop listings  
- View real-time mandi prices  
- Place bids or purchase crops  

Marketplace features:

- Crop listings  
- Bidding system  
- Price comparison  
- Transparent transactions  

---

## 🚚 Logistics Optimization

The platform uses route optimization algorithms to reduce transportation costs.

Features:

- Pickup scheduling  
- Transport tracking  
- Optimized routes (Milk Run logistics)

Benefits:

- Lower transportation cost  
- Faster delivery  
- Reduced crop wastage  

---

## 🤖 AI Price Prediction

Machine learning models predict mandi prices using:

- Crop type  
- Location  
- Seasonal demand  
- Historical prices  
- Weather data  

Farmers receive **recommended selling prices**.

---

## 📊 Demand Forecasting

AI predicts upcoming crop demand using historical agricultural data.

Farmers can decide:

- What crop to grow  
- When to sell  
- Which mandi offers better prices  

---

## 📈 Analytics Dashboard

Admins can monitor:

- Crop sales  
- Farmer registrations  
- Market trends  
- Logistics performance  
- Revenue analytics  

---

# 🔄 Platform Workflow

```mermaid
flowchart LR

Farmer[Farmer Registers] --> FarmProfile[Create Farm Profile]
FarmProfile --> CropListing[Add Crop Listing]
CropListing --> Marketplace[Marketplace Listing]

Buyer[Buyer Browses Marketplace] --> Marketplace

Marketplace --> OrderPlaced[Buyer Places Order]
OrderPlaced --> Payment[Payment Processing]

Payment --> Logistics[Logistics Scheduling]
Logistics --> Transport[Transport Pickup]

Transport --> Delivery[Crop Delivered to Buyer]
Delivery --> Analytics[Update Analytics Dashboard]
```

---

# 🧰 Tech Stack

## Frontend

- Next.js  
- TypeScript  
- Tailwind CSS  
- Zustand  
- Chart.js  
- Framer Motion  

---

## Backend

- Node.js  
- NestJS / Express  
- REST APIs  
- JWT Authentication  

---

## AI / ML Services

- FastAPI  
- Scikit-learn  
- Pandas  
- NumPy  

---

## Database

- PostgreSQL  
- Prisma ORM  

---

## DevOps

- Docker  
- GitHub Actions  
- Vercel / AWS / Render  

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/agri-supply-chain-platform.git
cd agri-supply-chain-platform
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/agri
JWT_SECRET=your_secret_key
REDIS_URL=redis://localhost:6379
```

---

## Run Database Migrations

```bash
npx prisma migrate dev
```

---

## Start Development Server

```bash
npm run dev
```

Application runs at:

```
http://localhost:3000
```

---

# 🚀 Deployment

## Frontend

- Vercel

## Backend

- AWS EC2  
- Render  
- Railway  

## Database

- PostgreSQL  

---

# 📊 Future Enhancements

Planned features:

- Blockchain crop traceability  
- Satellite crop monitoring  
- IoT farm sensors  
- Voice assistant for farmers  
- WhatsApp chatbot for crop price queries  

---

# 🤝 Contributing

Steps:

```
Fork the repository
Create a new branch
Commit your changes
Submit a pull request
```

Please ensure:

- Clean code  
- Proper documentation  
- Passing tests  

---

# 📜 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Contributors

- Madhu Tiwari  
- Team Loner  

---

# ⭐ Support

If you find this project helpful:

⭐ Star the repository  
🐛 Report issues  
💡 Suggest improvements  

---

# 🌍 Impact

This platform aims to build **a fair, transparent, and efficient agricultural marketplace**, empowering farmers with technology and data-driven insights.

---
