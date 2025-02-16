import time
from supabase import create_client
from datetime import datetime
import requests
import os
from dotenv import load_dotenv
import random

# Load environment variables from .env file
load_dotenv()

class VitalsMonitor:
    def __init__(self):
        # Get credentials from .env file
        self.supabase = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_KEY')
        )
        self.terra_api_key = os.getenv('TERRA_API_KEY')
        self.terra_dev_id = os.getenv('TERRA_DEV_ID')
        self.terra_api_url = "https://api.tryterra.co/v2/dashboard/generateData?type=sleep&for_provider=apple"
        
        # Verify all required environment variables are present
        self._verify_env_vars()
        
        self.vital_ranges = {
            'heart_rate': {'min': 60, 'max': 100},
            'blood_pressure_systolic': {'min': 90, 'max': 140},
            'blood_pressure_diastolic': {'min': 60, 'max': 90},
            'temperature': {'min': 36.1, 'max': 37.2},
            'oxygen_saturation': {'min': 95, 'max': 100}
        }

    def _verify_env_vars(self):
        """Verify all required environment variables are set"""
        required_vars = [
            'SUPABASE_URL',
            'SUPABASE_KEY',
            'TERRA_API_KEY',
            'TERRA_DEV_ID'
        ]
        
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        if missing_vars:
            raise EnvironmentError(
                f"Missing required environment variables: {', '.join(missing_vars)}\n"
                "Please check your .env file."
            )

    def get_terra_sample_data(self):
        """Fetch sample data from Terra API"""
        headers = {
            "accept": "application/json",
            "dev-id": self.terra_dev_id,
            "x-api-key": self.terra_api_key,
            "Content-Type": "application/json"
        }
        
        try:
            # Get sleep data
            sleep_response = requests.get(
                "https://api.tryterra.co/v2/dashboard/generateData?type=sleep&for_provider=apple",
                headers=headers,
                timeout=10
            )
            
            sleep_data = sleep_response.json()['data'][0]
            
            # Extract data from sleep response
            heart_data = sleep_data['heart_rate_data']['summary']
            respiration_data = sleep_data['respiration_data']['oxygen_saturation_data']
            temperature_delta = sleep_data['temperature_data']['delta']
            
            # Generate random blood pressure with 10% chance of anomaly
            if random.random() < 0.1:  # 10% chance of anomaly
                blood_pressure = random.choice([85, 145])  # Either too low or too high
            else:
                blood_pressure = random.randint(90, 140)  # Normal range
            
            vitals = {
                'heart_rate': heart_data.get('avg_hr_bpm', 75),
                'blood_pressure': blood_pressure,
                'temperature': 36.8 + temperature_delta,
                'oxygen_saturation': respiration_data.get('avg_saturation_percentage', 98)
            }
            
            return vitals
            
        except requests.RequestException as e:
            print(f"Error fetching Terra data: {e}")
            return {
                'heart_rate': 75,
                'blood_pressure': 120,
                'temperature': 36.8,
                'oxygen_saturation': 98
            }

    def check_vitals(self, patient_id, vitals):
        """Check if vitals are within normal range"""
        alerts = []
        timestamp = datetime.now().isoformat()
        
        for vital, value in vitals.items():
            if vital in self.vital_ranges:
                range_data = self.vital_ranges[vital]
                if value < range_data['min'] or value > range_data['max']:
                    alerts.append({
                        'vital': vital,
                        'value': value,
                        'timestamp': timestamp,
                        'patient_id': patient_id,
                        'severity': 'HIGH' if value > range_data['max'] else 'LOW'
                    })
        
        return alerts

    def upload_alert(self, alert):
        """Upload alert to Supabase bucket"""
        try:
            data = self.supabase.table('alerts').insert(alert).execute()
            print(f"Alert uploaded: {alert}")
            return data
        except Exception as e:
            print(f"Error uploading alert: {e}")
            return None

    def monitor_patient(self, patient_id):
        """Main monitoring loop using Terra sample data"""
        print(f"Starting monitoring for patient {patient_id}...")
        
        while True:
            try:
                vitals = self.get_terra_sample_data()
                alerts = self.check_vitals(patient_id, vitals)
                
                print(f"\nTimestamp: {datetime.now().isoformat()}")
                print(f"Current vitals: {vitals}")
                
                for alert in alerts:
                    self.upload_alert(alert)
                    print(f"⚠️ ALERT: {alert['vital']} is {alert['severity']}")
                
                time.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                print(f"Error in monitoring loop: {e}")
                time.sleep(5)

if __name__ == "__main__":
    try:
        monitor = VitalsMonitor()
        monitor.monitor_patient("sample_patient_001")
    except Exception as e:
        print(f"Failed to start monitoring: {e}")
