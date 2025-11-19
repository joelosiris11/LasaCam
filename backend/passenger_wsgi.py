import sys
import os

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(__file__))

# Importar la función application desde application.py
from application import application

# Passenger buscará esta variable 'application'
# Ya está importada arriba
