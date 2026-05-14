"""
ML Inference Service
Handles model loading, preprocessing, MC Dropout inference,
Grad-CAM heatmap generation, and ONNX export.
Supports all scan types — model is scan-agnostic.
"""

import io
import base64
import logging
import numpy as np
from typing import Optional
from PIL import Image

logger = logging.getLogger(__name__)

_model       = None
_pathologies: list[str] = []
_model_loaded = False


def load_model(model_name: str = "densenet121-res224-all") -> bool:
    global _model, _pathologies, _model_loaded
    if _model_loaded:
        return True
    try:
        import torch
        import torchxrayvision as xrv
        logger.info(f"Loading model: {model_name}")
        _model = xrv.models.DenseNet(weights=model_name)
        _model.eval()
        _pathologies = _model.pathologies
        _model_loaded = True
        logger.info(f"Model loaded. Pathologies: {_pathologies}")
        return True
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return False


def is_model_loaded() -> bool:
    return _model_loaded


def preprocess_image(image_bytes: bytes):
    """
    Convert raw image bytes to normalised tensor.
    Handles all scan types — converts to grayscale and normalises.
    CT scans may be 16-bit TIFF; we handle that too.
    """
    import torch

    try:
        img = Image.open(io.BytesIO(image_bytes))

        # Handle 16-bit CT images
        if img.mode == "I;16" or img.mode == "I":
            img_array = np.array(img).astype(np.float32)
            # Normalise 16-bit to [-1024, 1024] range
            img_array = (img_array / 65535.0) * 2048 - 1024
        else:
            img = img.convert("L")
            img = img.resize((224, 224), Image.LANCZOS)
            img_array = np.array(img).astype(np.float32)
            img_array = (img_array / 255.0) * 2048 - 1024

        # Ensure 224x224
        if img_array.shape != (224, 224):
            pil = Image.fromarray(
                ((img_array + 1024) / 2048 * 255).astype(np.uint8)
            )
            pil = pil.resize((224, 224), Image.LANCZOS)
            img_array = np.array(pil).astype(np.float32)
            img_array = (img_array / 255.0) * 2048 - 1024

        tensor = torch.from_numpy(img_array).unsqueeze(0).unsqueeze(0)
        original_pil = Image.fromarray(
            ((img_array + 1024) / 2048 * 255).clip(0, 255).astype(np.uint8)
        )
        return tensor, original_pil

    except Exception as e:
        logger.error(f"Image preprocessing failed: {e}")
        raise


def run_mc_dropout(image_bytes: bytes, n_passes: int = 10) -> list[dict]:
    import torch
    if not _model_loaded:
        raise RuntimeError("Model not loaded")

    tensor, _ = preprocess_image(image_bytes)
    all_probs = []
    _model.train()

    with torch.no_grad():
        for _ in range(n_passes):
            output = _model(tensor)
            probs  = torch.sigmoid(output[0]).cpu().numpy()
            all_probs.append(probs)

    _model.eval()
    all_probs  = np.array(all_probs)
    mean_probs = all_probs.mean(axis=0)
    std_probs  = all_probs.std(axis=0)

    results = []
    for label, mean, std in zip(_pathologies, mean_probs, std_probs):
        if std < 0.08:
            uncertainty = "Low"
        elif std < 0.15:
            uncertainty = "Medium"
        else:
            uncertainty = "High"
        results.append({
            "label":       label,
            "confidence":  float(mean),
            "std":         float(std),
            "uncertainty": uncertainty,
        })

    results.sort(key=lambda x: x["confidence"], reverse=True)
    return results[:5]


HIGH_SEVERITY_LABELS = {
    # Chest X-ray / CT
    "Pneumothorax", "Effusion", "Cardiomegaly",
    "Mass", "Nodule", "Consolidation", "Pneumonia",
    "Lung Lesion", "Lung Opacity", "Fracture",
    "Enlarged Cardiomediastinum", "Edema",
}

CRITICAL_LABELS = {
    "Pneumothorax", "Mass", "Fracture"
}


def calculate_risk_level(findings: list[dict]) -> str:
    if not findings:
        return "LOW"
    top = findings[0]
    if top["label"] in CRITICAL_LABELS and top["confidence"] > 0.70:
        return "CRITICAL"
    if top["label"] in HIGH_SEVERITY_LABELS and top["confidence"] > 0.55:
        return "HIGH"
    if top["confidence"] > 0.35:
        return "MODERATE"
    return "LOW"


def generate_gradcam_heatmap(
    image_bytes: bytes,
    target_label: Optional[str] = None,
) -> str:
    import torch
    from pytorch_grad_cam import GradCAMPlusPlus
    from pytorch_grad_cam.utils.image import show_cam_on_image

    if not _model_loaded:
        raise RuntimeError("Model not loaded")

    tensor, original_pil = preprocess_image(image_bytes)
    target_layers = [_model.features.denseblock4]

    if target_label and target_label in _pathologies:
        target_idx = _pathologies.index(target_label)
    else:
        with torch.no_grad():
            output = _model(tensor)
            probs  = torch.sigmoid(output[0]).cpu().numpy()
        target_idx = int(np.argmax(probs))

    class ClassTarget:
        def __init__(self, idx):
            self.idx = idx
        def __call__(self, output):
            if output.dim() == 1:
                return output[self.idx]
            return output[0, self.idx]

    cam = GradCAMPlusPlus(model=_model, target_layers=target_layers)
    grayscale_cam = cam(
        input_tensor=tensor,
        targets=[ClassTarget(target_idx)]
    )[0]

    original_rgb = original_pil.convert("RGB").resize((224, 224))
    original_np  = np.array(original_rgb).astype(np.float32) / 255.0
    overlaid     = show_cam_on_image(original_np, grayscale_cam, use_rgb=True)

    result_img = Image.fromarray(overlaid)
    buffer     = io.BytesIO()
    result_img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def export_to_onnx(output_path: str = "ml/model.onnx") -> bool:
    import torch
    if not _model_loaded:
        return False
    dummy_input = torch.randn(1, 1, 224, 224)
    try:
        torch.onnx.export(
            _model, dummy_input, output_path,
            opset_version=14,
            input_names=["input"],
            output_names=["output"],
            dynamic_axes={
                "input":  {0: "batch_size"},
                "output": {0: "batch_size"},
            },
            export_params=True,
            verbose=False,
            dynamo=False,
        )
        logger.info(f"ONNX exported to {output_path}")
        return True
    except Exception as e:
        logger.error(f"ONNX export failed: {e}")
        return False