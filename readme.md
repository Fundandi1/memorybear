# 🧸 MemoryBear Project

## To run the project:
1. Ensure you have Python 3.6+ and Node.js/npm installed.
2. Run the project using: `python run_project.py`
   - The script will automatically create a virtual environment (if needed), install dependencies (both Python and Node), run database migrations, and start the backend and frontend servers.

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
Sensitive configuration, including the Django Secret Key and Vipps/MobilePay API credentials, is managed via a `.env` file located at `backend/.env`.

This file is loaded by the `python-dotenv` package (listed in `backend/requirements.txt`) when the Django application starts.

The necessary variables are:
- `SECRET_KEY`: Django's secret key.
- `DEBUG`: Set to `True` for development, `False` for production.
- `VIPPS_CLIENT_ID`
- `VIPPS_CLIENT_SECRET`
- `VIPPS_SUBSCRIPTION_KEY`
- `VIPPS_MERCHANT_SERIAL_NUMBER`
- `VIPPS_TEST_MODE`: Set to `True` for Vipps test environment, `False` for production.
- `MOBILEPAY_CHECKOUT_RETURN_URL`: URL the user is redirected to after payment.
- `MOBILEPAY_CHECKOUT_CALLBACK_URL`: URL Vipps/MobilePay sends callbacks to.

**Important:** The `backend/.env` file should **not** be committed to version control. Make sure it is listed in your `.gitignore` file.

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
│   ├── requirements.txt    # Backend Python dependencies
│   ├── .env                # Backend environment variables (DO NOT COMMIT)
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
Using a virtual environment for Python projects is standard practice. The `run_project.py` script automatically creates and manages a virtual environment in the `venv/` directory.

If you need to run Django management commands manually (e.g., `makemigrations`), you should activate the environment first:
```bash
# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
. venv/bin/activate

# Example: Run makemigrations
python backend/manage.py makemigrations

# Deactivate when done
deactivate
```

### CORS Configuration
The project is configured to allow cross-origin requests from localhost:3000 during development. For production, you should modify the CORS settings in `backend/core/settings.py`.

### Database
The project uses SQLite.