from flask import Blueprint
routes = Blueprint('routes', __name__)

from .uploads import *
from .torders import *
from .results import *
from .metrical_tree import *