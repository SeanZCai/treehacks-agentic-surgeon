import os
from openai import OpenAI
from dotenv import load_dotenv
import glob
import base64
import PyPDF2

# Load environment variables
load_dotenv()

def load_checklist_from_pdf(pdf_path):
    """Extract text from PDF checklist"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            checklist_text = ""
            for page in pdf_reader.pages:
                checklist_text += page.extract_text()
        return checklist_text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return None

def analyze_frames(folder_path, checklist_path, batch_size=10):
    """
    Analyze frames in batches using OpenAI Vision with medical checklist context
    """
    # Load checklist from PDF
    checklist_text = load_checklist_from_pdf(checklist_path)
    if not checklist_text:
        print("Failed to load checklist PDF")
        return ""
        
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    frames = sorted(glob.glob(os.path.join(folder_path, "*.jpeg")))
    all_insights = []
    
    if not frames:
        print(f"No frames found in {folder_path}")
        return ""
    
    print(f"Found {len(frames)} frames, analyzing in batches of {batch_size}...")
    
    # Process frames in batches
    for i in range(0, len(frames), batch_size):
        batch = frames[i:i+batch_size]
        batch_num = i//batch_size + 1
        frames_range = f"{i+1}-{i+len(batch)}"
        print(f"\nAnalyzing batch {batch_num} (frames {frames_range})...")
        
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"""Here is a medical checklist that should be followed:

{checklist_text}

These are sequential frames {frames_range} from a medical procedure video. 
Focus ONLY on what is clearly visible and evident in the frames. Do not mention uncertainties or lack of clarity.
Please analyze the frames, specifically noting:
1. Which checklist items are being completed (only mention those you can definitively see being performed)
2. Which checklist items are being SKIPPED or overlooked (only mention those you can definitively see being skipped)
3. The specific actions and techniques being used (describe only what you can see with certainty)
4. Any deviations from standard procedure that are clearly visible

Remember: Only describe what you can see with certainty. Do not use phrases like "it's unclear", "possibly", "might be", or "there isn't enough data". 
If something is unclear because audio data is missing, you do not need to specify that. 
Just tell us what is happening to the best of your ability."""
                    }
                ]
            }
        ]
        
        for frame in batch:
            messages[0]["content"].append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{encode_image(frame)}"}
            })
        
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=300
            )
            
            insight = response.choices[0].message.content
            all_insights.append(f"Batch {batch_num} (Frames {frames_range}):\n{insight}\n")
            
            print(f"\nAnalysis of frames {frames_range}:")
            print(insight)
            
        except Exception as e:
            print(f"Error analyzing batch: {e}")
    
    # Return all insights combined
    return "\n".join(all_insights)

def encode_image(image_path):
    """Encode image to base64"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

if __name__ == "__main__":
    # Load checklist
    pdf_path = "checklist.pdf"  # Update this path
    checklist_text = load_checklist_from_pdf(pdf_path)
    
    if not checklist_text:
        print("Failed to load checklist PDF")
        exit()
    
    # Find latest frame folder
    frames_dir = "frames"
    folders = [d for d in os.listdir(frames_dir) 
              if os.path.isdir(os.path.join(frames_dir, d)) 
              and d.isdigit()]
    
    if not folders:
        print("No frame folders found")
        exit()
    
    latest_folder = max(folders, key=int)
    folder_path = os.path.join(frames_dir, latest_folder)
    
    print(f"Analyzing frames in folder: {folder_path}")
    analyze_frames(folder_path, pdf_path, batch_size=10) 