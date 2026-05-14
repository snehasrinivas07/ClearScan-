import sys
import os
sys.path.insert(0, '.')

import warnings
warnings.filterwarnings('ignore')

import torch
import torchxrayvision as xrv
import numpy as np

print("Loading model...")
model = xrv.models.DenseNet(weights="densenet121-res224-all")
model.eval()

print("Exporting to ONNX using legacy exporter...")
dummy_input = torch.randn(1, 1, 224, 224) * 1024

try:
    torch.onnx.export(
        model,
        dummy_input,
        "ml/model.onnx",
        opset_version=14,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input": {0: "batch_size"},
            "output": {0: "batch_size"},
        },
        export_params=True,
        verbose=False,
        dynamo=False
    )
    size = os.path.getsize("ml/model.onnx") / (1024*1024)
    print(f"Export successful. Size: {size:.1f} MB")
except Exception as e:
    print(f"Export failed: {e}")
