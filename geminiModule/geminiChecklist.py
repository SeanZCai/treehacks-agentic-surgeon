import google.generativeai as genai
import os
from pathlib import Path
import PyPDF2
import time
from typing import List, Dict, Tuple

class ChecklistVerifier:
    def __init__(self):
        # Configure Gemini
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        self.model = genai.GenerativeModel("gemini-1.5-pro")
        self.checklist_items = []
        self.current_index = 0

    def load_checklist_from_pdf(self, pdf_path: str) -> List[str]:
        """Extract checklist items from PDF"""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text()
                
                # Assuming each line is a checklist item
                self.checklist_items = [line.strip() for line in text.split('\n') 
                                      if line.strip() and not line.strip().startswith('#')]
                return self.checklist_items
        except Exception as e:
            print(f"Error loading PDF: {e}")
            return []

    def analyze_evidence(self, image_paths: List[str], audio_paths: List[str], task_index: int) -> Tuple[bool, str]:
        """Analyze evidence for a specific task"""
        if task_index >= len(self.checklist_items):
            return False, "Task index out of range"

        current_task = self.checklist_items[task_index]
        evidence_prompt = f"""
        Task to verify: {current_task}
        
        Please analyze the provided evidence and determine if this specific task has been completed.
        Respond with either 'COMPLETED' or 'NOT_COMPLETED' followed by a brief explanation.
        
        Consider:
        1. Does the evidence directly show the task being performed?
        2. Are all required elements of the task present?
        3. Is the task fully completed according to the evidence?
        """

        evidence_data = []
        
        # Add images to evidence
        for img_path in image_paths:
            try:
                image_data = Path(img_path).read_bytes()
                evidence_data.append({
                    "mime_type": "image/jpeg",  # Adjust based on actual image type
                    "data": image_data
                })
            except Exception as e:
                print(f"Error loading image {img_path}: {e}")

        # Add audio to evidence (if supported by your Gemini API version)
        for audio_path in audio_paths:
            try:
                audio_data = Path(audio_path).read_bytes()
                evidence_data.append({
                    "mime_type": "audio/mp3",  # Adjust based on actual audio type
                    "data": audio_data
                })
            except Exception as e:
                print(f"Error loading audio {audio_path}: {e}")

        try:
            response = self.model.generate_content([evidence_prompt] + evidence_data)
            is_completed = "COMPLETED" in response.text.upper()
            return is_completed, response.text
        except Exception as e:
            return False, f"Error analyzing evidence: {e}"

    def verify_task_order(self, task_index: int, evidence_images: List[str], evidence_audio: List[str]) -> str:
        """Verify if tasks are being completed in order"""
        if task_index > self.current_index:
            # Check if any previous tasks were skipped
            for i in range(self.current_index, task_index):
                is_completed, explanation = self.analyze_evidence(evidence_images, evidence_audio, i)
                if not is_completed:
                    return f"Raising flag: '{self.checklist_items[i]}' was not completed"
            
        is_current_completed, explanation = self.analyze_evidence(evidence_images, evidence_audio, task_index)
        if is_current_completed:
            self.current_index = task_index + 1
            return f"Task completed successfully: {self.checklist_items[task_index]}"
        else:
            return f"Current task not completed: {explanation}"

def main():
    verifier = ChecklistVerifier()
    
    # Load checklist
    checklist = verifier.load_checklist_from_pdf("path/to/your/checklist.pdf")
    if not checklist:
        print("Failed to load checklist")
        return

    # Example usage
    task_index = 0  # The task you want to verify
    evidence_images = ["path/to/image1.jpg", "path/to/image2.jpg"]
    evidence_audio = ["path/to/audio1.mp3"]
    
    result = verifier.verify_task_order(task_index, evidence_images, evidence_audio)
    print(result)

if __name__ == "__main__":
    main()
