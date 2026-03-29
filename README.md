

# 🌾 Smart Agri Supply Chain Platform - Kisan OS


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

# 🔗 Quick Links

🎥 **Demo Video**

```
https://docs.google.com/presentation/d/18rw6biLF1mfj_guoatpNuxJvU_sgDwxj/edit?usp=sharing&ouid=112780043208747336708&rtpof=true&sd=true
```

📊 **Pitch Deck**

```
https://docs.google.com/presentation/d/18rw6biLF1mfj_guoatpNuxJvU_sgDwxj/edit?usp=drive_link&ouid=112780043208747336708&rtpof=true&sd=true

```
💻 **GitHub Repository**

```
https://github.com/MadhuTiwari-345/Kisan-OS

```

#Deployment Link

```
https://kisanosprojectcheck.vercel.app
```

---

# 🚀 Overview

Agriculture supply chains in many regions suffer from **price manipulation, inefficient logistics, lack of transparency, and unpredictable crop demand**.

Farmers often rely on intermediaries, resulting in **reduced profits and delayed payments**.

This project introduces an **AI-powered agricultural supply chain platform** that connects:

• Farmers

• Buyers

• Mandis

• Logistics providers

The system enables:

✔ Transparent crop marketplaces

✔ AI-powered price prediction

✔ Demand forecasting

✔ Logistics route optimization

✔ Real-time analytics

The goal is to **increase farmer profits, reduce wastage, and optimize agricultural supply chains**.

---

# 🎯 Problem Statement

Current agricultural systems face multiple challenges.


### 1️⃣ Lack of Price Transparency

Farmers often do not know the **true market price of crops**.


### 2️⃣ Middlemen Exploitation

Intermediaries take large commissions, reducing farmer earnings.


### 3️⃣ Inefficient Logistics

Crop transportation is poorly optimized, causing:

• higher fuel costs

• delays

• food wastage


### 4️⃣ Lack of Demand Prediction

Farmers do not know which crops will have higher demand next season.


### 5️⃣ Fragmented Agricultural Data

Agricultural data exists across multiple disconnected systems.

---

# 💡 Solution

This platform provides a **digital ecosystem for agricultural trade and logistics powered by AI**.

Key capabilities include:

• Crop marketplace for farmers and buyers

• AI-based mandi price prediction

• Smart logistics route optimization

• Crop demand forecasting

• Real-time analytics dashboard

• Transparent digital transactions

This ensures **fair pricing, efficient supply chains, and data-driven farming decisions**.

---

# ✨ Core Features

## 🌱 Farmer Management

Farmers can:

• Register and verify profiles

• Add farm details

• List crops for sale

• Track orders and payments

---

## 🏪 Smart Crop Marketplace

Buyers can:

• browse crop listings

• view real-time mandi prices

• place bids or purchase crops

Marketplace features include:

• crop listings

• bidding system

• price comparison

• transparent transactions

---

## 🚚 Logistics Optimization

The platform uses route optimization algorithms to reduce transportation costs.

Features include:

• pickup scheduling

• transport tracking

• optimized routes (Milk Run logistics)

Benefits:

• lower transportation cost

• faster delivery

• reduced crop wastage

---

## 🤖 AI Price Prediction

Machine learning models predict mandi prices based on:

• crop type

• location

• seasonal demand

• historical prices

• weather data

Farmers receive **recommended selling prices**.

---

## 📊 Demand Forecasting

AI predicts upcoming crop demand using historical agricultural data.

Farmers can decide:

• what crop to grow

• when to sell

• which mandi offers better prices

---

## 📈 Analytics Dashboard

Admins and stakeholders can monitor:

• crop sales

• farmer registrations

• market trends

• logistics performance

• revenue analytics

---

## 🔐 Secure Authentication

Secure authentication using:

• JWT tokens

• encrypted passwords

• role-based access control

User roles:

• Admin

• Farmer

• Buyer

• Logistics provider

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

# 🏗 System Architecture

```
                   Users
                     │
               Next.js Frontend
                     │
                API Gateway
                     │
        ┌────────────┴────────────┐
        │                         │
    Backend Services         AI Services
      (Node.js)               (Python)
        │                         │
        └────────────┬────────────┘
                     │
                PostgreSQL
                     │
                  Redis
                     │
                Object Storage
```

---

# 🧰 Tech Stack

## Frontend

• Next.js

• TypeScript

• Tailwind CSS

• Zustand

• Chart.js

• Framer Motion

---

## Backend

• Node.js

• Express / NestJS

• REST APIs

• JWT Authentication

---

## AI / ML Services

• FastAPI
• Scikit-learn
• Pandas
• NumPy

---

## Database

• PostgreSQL
• Prisma ORM

---

## Caching

• Redis

---

## DevOps

• Docker
• GitHub Actions
• Vercel / AWS / Render

---

# 📂 Project Structure

```
Kisan-OS
│
├── frontend
│
├── backend
│
├── ai-services
│
├── database
│
└── docs
```

---

# ⚙ Installation Guide

### 1️⃣ Clone the repository

```
git clone https://github.com/MadhuTiwari-345/Kisan-OS.git
cd Kisan-OS
```

---

### 2️⃣ Install dependencies

```
npm install
```

---

### 3️⃣ Configure environment variables

Create `.env`

```
DATABASE_URL=postgresql://user:password@localhost:5432/agri
JWT_SECRET=your_secret_key
REDIS_URL=redis://localhost:6379
```

---

### 4️⃣ Run database migrations

```
npx prisma migrate dev
```

---

### 5️⃣ Start development server

```
npm run dev
```

Application runs at:

```
http://localhost:3000
```

---

# 🧪 Testing

Run tests using:

```
npm run test
```

---

# 🎥 Demo Video

The demo shows:

1️⃣ Farmer registration

2️⃣ Crop marketplace

3️⃣ Buyer purchasing crops

4️⃣ Logistics optimization

5️⃣ AI price prediction

6️⃣ Analytics dashboard

<img width="1356" height="595" alt="image" src="https://github.com/user-attachments/assets/f622e17b-8562-466d-95e3-3fdcdaeed6b3" />
<img width="1356" height="529" alt="image" src="https://github.com/user-attachments/assets/5f9b9f7e-9111-4775-a138-a1d55f4f7c53" />
<img width="1356" height="590" alt="image" src="https://github.com/user-attachments/assets/128eda06-bb6d-4bd0-97b7-165c2a54cfe9" />
<img width="1355" height="536" alt="image" src="https://github.com/user-attachments/assets/a992e761-effe-4f29-8659-48df2c59953a" />
<img width="1356" height="533" alt="image" src="https://github.com/user-attachments/assets/36d53689-706f-436c-b783-1f1e25bf5256" />
<img width="674" height="501" alt="image" src="https://github.com/user-attachments/assets/4e364f5c-58e6-4791-b5e4-4cbdf1606808" />
<img width="1355" height="528" alt="image" src="https://github.com/user-attachments/assets/b3284e60-58e0-48b1-ab41-f6d77050543c" />
<img width="1356" height="521" alt="image" src="https://github.com/user-attachments/assets/2fbbad92-9617-49f3-8da8-437791490d21" />
<img width="1352" height="523" alt="image" src="https://github.com/user-attachments/assets/e05cd1cf-b6c2-4644-9c22-45e99e362d5b" />
<img width="1351" height="487" alt="image" src="https://github.com/user-attachments/assets/0c9dd72a-c0f1-4f13-b1a3-f614ea0f81c7" />
<img width="1356" height="529" alt="image" src="https://github.com/user-attachments/assets/5b7fcbc2-ac84-4610-8a64-9dfcb67fa7b0" />
<img width="1356" height="582" alt="image" src="https://github.com/user-attachments/assets/8ece1c6e-0ca4-4ea3-a979-f38e9352f8db" />


🎬 Demo Video

```
https://drive.google.com/file/d/1VL_6diwuvgJXVtzo2ry7VsN2RllnzcaD/view?usp=sharing

```
---

# 📊 Pitch Deck

Project presentation explaining:

• problem statement
• solution architecture
• AI system
• business impact

📂 Pitch Deck

```
https://docs.google.com/presentation/d/18rw6biLF1mfj_guoatpNuxJvU_sgDwxj/edit?usp=sharing&ouid=112780043208747336708&rtpof=true&sd=true

```
---

# 🚀 Deployment

Frontend can be deployed using:

• Vercel

Backend can be deployed using:

• Render

• Railway

• AWS EC2

Database:

• PostgreSQL

---

# 👨‍💻 Contributors

• Madhu Tiwari

• Team Loner

---

# 📜 License

This project is licensed under the **MIT License**.

---

# ⭐ Support

If you find this project useful:

⭐ Star the repository

🐛 Report issues

💡 Suggest improvements

---

# 🌍 Impact

This platform aims to build **a fair, transparent, and efficient agricultural marketplace**, empowering farmers with technology and data-driven insights.

---

