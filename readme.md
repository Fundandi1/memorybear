# 🧸 MemoryBear Project

## To run the project:
1. make sure the venv is removed from the project
2. run the project with python3 run_project.py

## 📝 Project Overview
MemoryBear is a full-stack web application with a Django backend and Next.js frontend. The project includes e-commerce functionality with payment processing through for now only Vipps/MobilePay.

## 🛠️ Technologies

### Backend
- **Django 5.1.x** - Python web framework
- **Django REST Framework** - API toolkit
- **SQLite database** - Data storage
- **Vipps/MobilePay integration** - Nordic payment solution

### Frontend
- **Next.js 15.2.3** - React framework
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **Three.js** and **React Three Fiber** - 3D graphics
- **Stripe.js** - Payment processing


## 🔐 Environment Variables

### Backend
The following variables are configured in settings.py:
- Django Secret Key (should be kept secret in production)
- Vipps/MobilePay integration variables:
  - `VIPPS_CLIENT_ID`
  - `VIPPS_CLIENT_SECRET`
  - `VIPPS_SUBSCRIPTION_KEY`
  - `VIPPS_MERCHANT_SERIAL_NUMBER`
  - `VIPPS_TEST_MODE`

⚠️ In production, you should move these values to environment variables.

### Frontend
No specific environment variables are required for development, but you may need to configure API endpoints for production.

## 📂 Project Structure
```
memorybear/
├── backend/
│   ├── api/                # Django app for API endpoints
│   ├── core/               # Main Django project settings
│   ├── products/           # Products app
│   ├── users/              # User management app
│   ├── manage.py           # Django management script
│   └── db.sqlite3          # SQLite database
│
└── frontend/
    ├── src/                # Next.js source files
    ├── public/             # Public assets
    ├── components/         # React components
    └── package.json        # Node.js dependencies
```

## 📝 Development Notes

### Virtual Environment
Using a virtual environment for Python projects is standard practice. It isolates project dependencies from your system Python installation and allows different projects to use different versions of the same library.

Always activate the virtual environment before working on the project:
```bash
# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Deactivate when done
deactivate
```

### CORS Configuration
The project is configured to allow cross-origin requests from localhost:3000 during development. For production, you should modify the CORS settings in `backend/core/settings.py`.

### Database
The project uses SQLite.