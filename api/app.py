import os
import logging
from flask import Flask, Blueprint
from flask_cors import CORS
from routes import *
from routes.test_errors import register_test_routes

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
logger.info("Starting Stanford Linguistics Suite API")

# Constants
RESULTS_FOLDER = '/results'
PUBLIC_FOLDER = '/public'
OUTPUT_FILE_EXTENSION = '.zip'
ALLOWED_EXTENSIONS = set(['xls', 'xlsx'])
METRICAL_TREE_ALLOWED_EXTENSIONS = set(['txt'])


app = Flask(__name__, static_url_path=PUBLIC_FOLDER, static_folder=PUBLIC_FOLDER)
CORS(app)
app.config['RESULTS_FOLDER'] = RESULTS_FOLDER
app.config['PUBLIC_FOLDER'] = PUBLIC_FOLDER
app.config['OUTPUT_FILE_EXTENSION'] = OUTPUT_FILE_EXTENSION
app.config['ALLOWED_EXTENSIONS'] = ALLOWED_EXTENSIONS
app.config['METRICAL_TREE_ALLOWED_EXTENSIONS'] = METRICAL_TREE_ALLOWED_EXTENSIONS

# Set URL scheme based on environment - this ensures correct http/https URLs
is_production = os.environ.get('API_ENVIRONMENT') == 'production'
app.config['PREFERRED_URL_SCHEME'] = 'https' if is_production else 'http'
logger.info(f"URL scheme set to: {app.config['PREFERRED_URL_SCHEME']} (API_ENVIRONMENT={os.environ.get('API_ENVIRONMENT', 'Not Set')})")
app.register_blueprint(routes)

# Register test routes
register_test_routes(app)
