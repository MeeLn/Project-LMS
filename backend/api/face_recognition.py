from facenet_pytorch import InceptionResnetV1, MTCNN
import torch
import numpy as np
from PIL import Image
import requests
import base64
from io import BytesIO

# Initialize MTCNN and FaceNet (InceptionResnetV1)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
mtcnn = MTCNN(image_size=160, margin=0, min_face_size=20, device=device)
resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)

def load_image_from_url(url):
    response = requests.get(url)
    return Image.open(BytesIO(response.content)).convert('RGB')

def load_image_from_base64(base64_string):
    # Strip the base64 header if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]

    image_data = base64.b64decode(base64_string)
    return Image.open(BytesIO(image_data)).convert('RGB')

def get_face_embedding(image):
    """
    Detects face, aligns it, and returns the 512-dim embedding using FaceNet.
    """
    face = mtcnn(image)
    if face is None:
        return None, "No face detected or multiple faces found"

    with torch.no_grad():
        face_embedding = resnet(face.unsqueeze(0).to(device))
    return face_embedding.squeeze(0).cpu().numpy(), None

def compare_faces_from_urls(image_data_base64, profile_image_url):
    debug_info = {}

    # Load and embed profile image
    profile_image = load_image_from_url(profile_image_url)
    known_embedding, error = get_face_embedding(profile_image)
    if known_embedding is None:
        debug_info['error'] = error or "Failed to embed profile image"
        return False, debug_info

    # Load and embed captured image
    captured_image = load_image_from_base64(image_data_base64)
    unknown_embedding, error = get_face_embedding(captured_image)
    if unknown_embedding is None:
        debug_info['error'] = error or "Failed to embed captured image"
        return False, debug_info

    # Calculate Euclidean distance
    distance = np.linalg.norm(known_embedding - unknown_embedding)
    tolerance = 1.0  # Can be tuned

    match_result = distance < tolerance
    debug_info['face_distance'] = float(distance)
    debug_info['match_result'] = match_result
    debug_info['tolerance'] = tolerance

    return match_result, debug_info