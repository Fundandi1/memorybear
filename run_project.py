#!/usr/bin/env python3
import os
import sys
import subprocess
import platform
import signal
import time
import shutil

# Colors for terminal output
class Colors:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'

# Project directories
BACKEND_DIR = "backend"
FRONTEND_DIR = "frontend"
VENV_DIR = "venv"

# Global variables to store process objects
backend_process = None
frontend_process = None
use_system_python = False  # Flag to indicate if we should use system Python

def print_status(message):
    print(f"{Colors.BLUE}[INFO]{Colors.ENDC} {message}")

def print_success(message):
    print(f"{Colors.GREEN}[SUCCESS]{Colors.ENDC} {message}")

def print_warning(message):
    print(f"{Colors.YELLOW}[WARNING]{Colors.ENDC} {message}")

def print_error(message):
    print(f"{Colors.RED}[ERROR]{Colors.ENDC} {message}")

def check_requirements():
    """Check if required software is installed"""
    # Check Python version
    if sys.version_info < (3, 6):
        print_error("Python 3.6 or higher is required.")
        return False
    
    # Check if Node.js is installed
    try:
        subprocess.run(["node", "--version"], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except (subprocess.SubprocessError, FileNotFoundError):
        print_error("Node.js is required but not installed.")
        return False
    
    # Check if npm is installed
    try:
        subprocess.run(["npm", "--version"], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except (subprocess.SubprocessError, FileNotFoundError):
        print_error("npm is required but not installed.")
        return False
    
    return True

def get_system_python():
    """Get the system Python path"""
    if platform.system() == "Darwin":  # macOS
        paths = [
            "/opt/homebrew/bin/python3",
            "/usr/local/bin/python3",
            "/usr/bin/python3",
            sys.executable
        ]
    else:
        paths = [
            "/usr/bin/python3",
            sys.executable
        ]
    
    for path in paths:
        if os.path.exists(path):
            return path
    
    return "python3"  # Fallback to PATH-based lookup

def setup_venv():
    """Set up virtual environment if not exists"""
    global use_system_python
    
    # If venv exists but is broken, remove it
    if os.path.exists(VENV_DIR):
        print_status("Checking existing virtual environment...")
        if not os.path.exists(os.path.join(VENV_DIR, "bin", "python3")):
            print_warning("Existing virtual environment appears to be broken. Removing it...")
            shutil.rmtree(VENV_DIR)
    
    if not os.path.exists(VENV_DIR):
        print_status("Creating Python virtual environment...")
        try:
            # Use system Python to create venv
            system_python = get_system_python()
            print_status(f"Using {system_python} to create virtual environment...")
            subprocess.run([system_python, "-m", "venv", VENV_DIR, "--clear"], check=True)
            
            # Verify the venv was created correctly
            venv_python = os.path.join(VENV_DIR, "bin", "python3")
            if not os.path.exists(venv_python):
                raise RuntimeError("Virtual environment creation failed")
                
            print_success("Virtual environment created successfully.")
        except Exception as e:
            print_error(f"Failed to create virtual environment: {str(e)}")
            print_warning("Falling back to system Python...")
            use_system_python = True
    else:
        print_status("Using existing virtual environment.")

def get_python_executable():
    """Get the appropriate Python executable path"""
    if use_system_python:
        return get_system_python()
    
    # Try to find Python in the virtual environment
    if platform.system() == "Windows":
        venv_python = os.path.abspath(os.path.join(VENV_DIR, "Scripts", "python.exe"))
    else:
        venv_python = os.path.abspath(os.path.join(VENV_DIR, "bin", "python3"))
    
    if os.path.exists(venv_python):
        return venv_python
    
    print_warning("Virtual environment Python not found, falling back to system Python")
    return get_system_python()

def install_backend_deps():
    """Install backend dependencies"""
    print_status("Installing backend dependencies...")
    python_exe = get_python_executable()
    print_status(f"Using Python: {python_exe}")
    
    try:
        # Use absolute paths, pointing to the backend requirements file
        requirements_path = os.path.abspath(os.path.join(BACKEND_DIR, "requirements.txt"))
        subprocess.run(
            [python_exe, "-m", "pip", "install", "-r", requirements_path],
            check=True,
            cwd=os.path.abspath(BACKEND_DIR) # Ensure pip runs in the backend directory context if needed
        )
        print_success("Backend dependencies installed.")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to install backend dependencies: {str(e)}")
        sys.exit(1)

def run_migrations():
    """Run Django migrations"""
    print_status("Running Django migrations...")
    python_exe = get_python_executable()
    print_status(f"Using Python: {python_exe}")
    
    try:
        # Use absolute paths
        manage_py_path = os.path.abspath(os.path.join(BACKEND_DIR, "manage.py"))
        subprocess.run(
            [python_exe, manage_py_path, "migrate"],
            check=True,
            cwd=os.path.abspath(BACKEND_DIR)
        )
        print_success("Migrations complete.")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to run migrations: {str(e)}")
        sys.exit(1)

def install_frontend_deps():
    """Install frontend dependencies"""
    if not os.path.exists(os.path.join(FRONTEND_DIR, "node_modules")):
        print_status("Installing frontend dependencies...")
        current_dir = os.getcwd()
        try:
            os.chdir(FRONTEND_DIR)
            subprocess.run(["npm", "install"], check=True)
            print_success("Frontend dependencies installed.")
        except subprocess.CalledProcessError as e:
            print_error(f"Failed to install frontend dependencies: {str(e)}")
            sys.exit(1)
        finally:
            os.chdir(current_dir)
    else:
        print_status("Frontend dependencies already installed.")

def start_backend():
    """Start the Django backend server"""
    global backend_process
    print_status("Starting Django backend server on http://127.0.0.1:8000...")
    python_exe = get_python_executable()
    print_status(f"Using Python: {python_exe}")
    
    try:
        # Use absolute paths
        manage_py_path = os.path.abspath(os.path.join(BACKEND_DIR, "manage.py"))
        backend_process = subprocess.Popen(
            [python_exe, manage_py_path, "runserver"],
            cwd=os.path.abspath(BACKEND_DIR)
        )
        print_success(f"Backend server started with PID {backend_process.pid}.")
    except Exception as e:
        print_error(f"Failed to start backend server: {str(e)}")
        sys.exit(1)

def start_frontend():
    """Start the Next.js frontend server"""
    global frontend_process
    print_status("Starting Next.js frontend server on http://localhost:3001...")
    
    # Create an environment variable to specify the port
    env = os.environ.copy()
    env["PORT"] = "3001"
    
    current_dir = os.getcwd()
    os.chdir(FRONTEND_DIR)
    frontend_process = subprocess.Popen(["npm", "run", "dev"], env=env)
    os.chdir(current_dir)
    print_success(f"Frontend server started with PID {frontend_process.pid}.")

def cleanup(signum=None, frame=None):
    """Clean up processes when exiting"""
    print_status("Shutting down servers...")
    
    global backend_process, frontend_process
    
    if backend_process:
        try:
            backend_process.terminate()
            print_status("Backend server stopped.")
        except:
            print_warning("Could not terminate backend server cleanly.")
    
    if frontend_process:
        try:
            frontend_process.terminate()
            print_status("Frontend server stopped.")
        except:
            print_warning("Could not terminate frontend server cleanly.")
    
    print_success("All servers shut down.")
    sys.exit(0)

def is_first_run():
    """Check if this is the first run"""
    return not os.path.exists(VENV_DIR) or not os.path.exists(os.path.join(FRONTEND_DIR, "node_modules"))

def main():
    # Register signal handlers for clean shutdown
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    first_run = is_first_run()
    
    # Setup venv if first run
    if first_run:
        print_status("First time setup detected. Running initial environment setup...")
        setup_venv()
        # Frontend deps only need install on first run or if node_modules missing
        install_frontend_deps()
    else:
        print_status("Existing setup detected.")

    # Always ensure backend dependencies and migrations are up-to-date
    print_status("Ensuring backend environment is up-to-date...")
    install_backend_deps()
    run_migrations()
    
    # Start servers
    start_backend()
    start_frontend()
    
    print_status("--------------------------------------------------------")
    print_success("🚀 Project is running!")
    print_success("📱 Frontend: http://localhost:3001")
    print_success("🖥️ Backend: http://127.0.0.1:8000")
    print_status("--------------------------------------------------------")
    print_warning("Press Ctrl+C to stop both servers.")
    
    # Keep script running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main() 