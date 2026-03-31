# 🏗️ THREE COMPOSITE BARS — Intelligent Structural Analyzer (IntelliStruct)

[![Author: SENAPATHI YASWANTH (RA17)](https://img.shields.io/badge/Author-SENAPATHI%20YASWANTH%20(RA17)-blue.svg)](https://github.com/yaswanth-senapathi)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Stack: FastAPI | React | NumPy](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20NumPy-orange.svg)](#-technology-stack)

**IntelliStruct** is a full-stack engineering project that helps you solve **three composite bar problems** easily.

It uses a **React frontend** and a **FastAPI + NumPy backend** to give:
- Accurate results  
- Step-by-step calculations  
- Easy-to-understand visual outputs  

---

## 📖 Project Story

This project was developed as part of my **Mechanics of Solids and Fluids** course.
To convert theoretical calculations into a computational solution.
What started as a simple idea to reduce calculation time gradually turned into a complete full-stack application. The goal was not just to get answers, but to clearly understand the steps, visualize the results, and make learning more interactive.

This project reflects my effort to connect **engineering concepts with real-world software development**.

---

![Dashboard Preview](https://github.com/senapathiyaswanth/Three-Composite-Bars/blob/main/refer/Dashboard.png)

---

## 🚀 Key Features

### 🔹 Advanced Structural Solver (NumPy Engine)
- **Indeterminate Systems**: Solves for parallel composite bars with multiple materials and variable areas.
- **High-Precision Logic**: Internal load distribution computed via Gaussian elimination on $n \times n$ stiffness matrices.
- **Common Deformation ($\delta_L$)**: Unified displacement result for rigid-plate connected systems.

### 🔹 Premium Engineering Analytics
- **Parametric Sensitivity**: Interactive visualizations showing how stress distribution varies with rod geometry.
- **Mass Estimation**: Calculates individual rod mass and total system weight using material density.
- **Critical Path Identification**: Detects the rod under maximum stress and evaluates system safety margins.

### 🔹 Professional Report Generation
- **Automated Exports**: Generate structured **PDF/DOCX reports** with complete mathematical derivations, results, and charts.
- **History Tracking**: Stores simulations using **MongoDB** for later review and comparative analysis.

---

## 🛠️ Technology Stack

### **Frontend**
- React 18 + Vite (TypeScript)
- Framer Motion, GSAP
- [Recharts](https://recharts.org/) (Data Visualization)
- [KaTeX](https://katex.org/) (Math Rendering)
- Tailwind CSS + Custom CSS

### **Backend**
- Python 3.10+ + FastAPI
- [NumPy](https://numpy.org/) (Numerical Computation)
- [Pydantic v2](https://docs.pydantic.dev/) (Validation)
- JWT + bcrypt (Auth Ready)

### **Data & DevOps**
- [MongoDB](https://www.mongodb.com/) (Motor)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- python-dotenv

---

## 📐 Mathematical Foundation

The platform solves the system by satisfying fundamental mechanics of materials principles:

1.  **Compatibility Condition**:
    $$\delta_1 = \delta_2 = \dots = \delta_n = \delta_{common}$$

2.  **Equilibrium Equation**:
    $$\sum_{i=1}^{n} P_i = P_{total}$$

3.  **Constitutive Relationship (Hooke's Law)**:
    $$P_i = \delta \cdot \frac{A_i E_i}{L}$$

---

## 📂 Project Architecture

```text
Three-Composite-Bars/
├── backend/
│   ├── app/
│   │   ├── routes/     # API endpoints (Solve, History, Materials)
│   │   ├── models/     # Data schemas & DB logic
│   │   └── solver.py   # Core Numerical Engine (NumPy)
│   ├── main.py         # Entry point
│   └── requirements.txt
├── frontend/
│   ├── src/            # Components, hooks, context
│   └── public/         # Static assets
├── reports/            # Outputs and documentation
├── scripts/
│   ├── setup.bat       # Setup script
│   └── start.bat       # Run script
├── tests/              # Automated Test Suite
├── docker-compose.yml  # Multi-container orchestration
└── README.md           # This file
```

---

## 🏁 Getting Started

### **1. Prerequisites**
- **Node.js**: v18 or later ([Download](https://nodejs.org/))
- **Python**: v3.10 or later ([Download](https://www.python.org/))
- **MongoDB**: Local instance running or MongoDB Atlas URI.

### **2. Setup Instructions**

#### **📍 Windows (Recommended)**
Run the automated launcher from the project root:
```powershell
.\scripts\start.bat
```

#### **📍 Linux & macOS**
Open two terminal instances:

**Terminal 1 (Backend):**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

### **3. Docker Deployment**
For a containerized environment (Database + Backend + Frontend):
```bash
docker-compose up --build
```

---

## 👤 Author & Development
**Developed by:** [SENAPATHI YASWANTH (RA17)](https://github.com/yaswanth-senapathi)
**Focus:** Computational Mechanics, Advanced Full-Stack Systems, and Numerical Simulation.

### 🛡️ Reliability
- Robust error handling (e.g., 503 responses)
- Stable numerical computations via NumPy
- Consistent data serialization across the stack

### ⭐ Support
If you found this project useful:
- **Star** the repository on GitHub
- **Share** with colleagues and engineers

---

## 📄 License
This project is licensed under the **MIT License**.

*Created with precision as part of the Mechanics of Solids Fluids subject.*
