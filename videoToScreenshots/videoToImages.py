import cv2
import os
from datetime import datetime

def get_next_folder_number(base_folder):
    """Get the next available numbered folder"""
    if not os.path.exists(base_folder):
        os.makedirs(base_folder)
        return 1
    
    existing_folders = [d for d in os.listdir(base_folder) 
                       if os.path.isdir(os.path.join(base_folder, d)) 
                       and d.isdigit()]
    
    if not existing_folders:
        return 1
    
    return max(map(int, existing_folders)) + 1

def extract_frames(video_path, base_folder):
    """
    Extract 1 frame per second from a video file
    
    Args:
        video_path: Path to the video file
        base_folder: Base folder to create numbered output folders
    """
    # Create numbered output folder
    folder_num = get_next_folder_number(base_folder)
    output_folder = os.path.join(base_folder, str(folder_num))
    os.makedirs(output_folder)
    
    print(f"Saving frames to folder: {output_folder}")
    
    # Open the video file
    video = cv2.VideoCapture(video_path)
    
    # Get video properties
    fps = video.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps)  # Calculate interval to get 1 frame per second
    
    frame_count = 0
    saved_count = 0
    
    while True:
        success, frame = video.read()
        
        if not success:
            break
            
        # Save one frame per second
        if frame_count % frame_interval == 0:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            frame_path = os.path.join(output_folder, f"frame_{timestamp}.jpeg")
            cv2.imwrite(frame_path, frame)
            saved_count += 1
            
        frame_count += 1
    
    video.release()
    print(f"Saved {saved_count} frames to {output_folder}")

if __name__ == "__main__":
    video_path = "test.mp4"  # Put your video file here
    base_folder = "frames"
    extract_frames(video_path, base_folder)
