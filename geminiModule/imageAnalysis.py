import google.generativeai as genai
import os
from pathlib import Path
import time

def analyze_image(image_path):
    start_time = time.time()
    
    # Configure the API with your key
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

    # Initialize the model - using Gemini 1.5 Pro
    model = genai.GenerativeModel("gemini-1.5-pro")

    # Read the image file
    image_data = Path(image_path).read_bytes()

    # Create a detailed prompt for comprehensive image analysis
    prompt = """Please provide a detailed analysis of this image. Include:
    1. Main subjects and objects
    2. Actions or activities taking place
    3. Setting and environment
    4. Colors, lighting, and mood
    5. Any text or signage visible
    6. Notable details or unusual elements
    Please be as specific and descriptive as possible."""

    # Generate content from the image
    response = model.generate_content([
        prompt,
        {
            "mime_type": "image/jpeg",  # Adjust mime type based on your image format (jpeg, png, etc.)
            "data": image_data
        }
    ])

    # Print the response and timing separately to ensure both are visible
    print("\n=== Analysis Results ===")
    print(response.text)
    
    end_time = time.time()
    execution_time = end_time - start_time
    print("\n=== Performance Metrics ===")
    print(f"Execution time: {execution_time:.2f} seconds")
    return response.text  # Optional: return the response if needed

if __name__ == "__main__":
    # Make sure to set your API key as an environment variable
    if not os.getenv("GOOGLE_API_KEY"):
        print("Please set your GOOGLE_API_KEY environment variable")
        exit(1)

    # Replace with your image file path
    image_path = "path/to/your/image.jpg"
    
    try:
        analyze_image(image_path)
    except Exception as e:
        print(f"An error occurred: {e}")
