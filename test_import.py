
import sys
import os

# Add functions directory to path
sys.path.append(os.path.join(os.getcwd(), 'functions'))

print("Attempting to import main...")
try:
    import main
    print("Import successful!")
except Exception as e:
    print(f"Import failed: {e}")
