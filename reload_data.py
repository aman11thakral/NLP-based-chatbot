import requests
import sys
import os

def reload_data():
    """
    Simple script to reload FAQ data in the chatbot database without restarting the server.
    This will clear the existing database and load all Excel files from the attached_assets directory.
    """
    print("Reloading FAQ data in the chatbot database...")
    
    try:
        # Get the server URL (default to localhost)
        server_url = os.environ.get("SERVER_URL", "http://localhost:5000")
        
        # Call the reload endpoint
        response = requests.get(f"{server_url}/admin/reload_data")
        data = response.json()
        
        if data.get('success'):
            print(f"Success: {data.get('message')}")
            return 0
        else:
            print(f"Error: {data.get('error')}")
            print(f"Details: {data.get('details')}")
            return 1
            
    except Exception as e:
        print(f"Error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(reload_data())