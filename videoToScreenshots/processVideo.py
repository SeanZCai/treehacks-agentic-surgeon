import os
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv
from videoToImages import extract_frames
from analyzeImages import analyze_frames

class VideoProcessor:
    def __init__(self):
        load_dotenv()
        self.supabase = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_KEY')
        )

    def process_video(self, video_path):
        """Process video through frame extraction and analysis"""
        print("Starting video processing...")
        
        # Step 1: Extract frames
        print("Extracting frames...")
        frames_dir = "frames"
        extract_frames(video_path, frames_dir)
        
        # Get the latest frame folder
        folders = [d for d in os.listdir(frames_dir) 
                  if os.path.isdir(os.path.join(frames_dir, d)) 
                  and d.isdigit()]
        latest_folder = max(folders, key=int)
        folder_path = os.path.join(frames_dir, latest_folder)
        
        # Step 2: Analyze frames
        print("Analyzing frames...")
        insights = analyze_frames(folder_path, "checklist.pdf", batch_size=10)
        
        # Step 3: Clear table and upload to Supabase
        print("Clearing previous data...")
        self.supabase.table('surgery_data').delete().neq('id', 0).execute()
        
        print("Uploading new analysis to Supabase...")
        self.upload_to_supabase(insights)
        
        print("Processing complete!")
        return insights

    def upload_to_supabase(self, insights):
        """Upload insights to Supabase"""
        try:
            data = {
                'created_at': datetime.now().isoformat(),
                'visual_insight': insights
            }
            
            result = self.supabase.table('surgery_data').insert(data).execute()
            print("Successfully uploaded to Supabase")
            return result
        except Exception as e:
            print(f"Error uploading to Supabase: {e}")
            return None

if __name__ == "__main__":
    # Check command line arguments
    import sys
    if len(sys.argv) != 2:
        print("Usage: python processVideo.py <video_path>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    processor = VideoProcessor()
    processor.process_video(video_path) 