"""OCR service using RapidOCR for text extraction from images."""
from rapidocr_onnxruntime import RapidOCR

_ocr_engine: RapidOCR | None = None


def _get_ocr() -> RapidOCR:
    global _ocr_engine
    if _ocr_engine is None:
        _ocr_engine = RapidOCR()
    return _ocr_engine


def extract_text_from_image(image_bytes: bytes) -> str:
    """Extract text from image bytes using RapidOCR.

    Returns concatenated text string, or empty string on failure.
    """
    import numpy as np

    try:
        ocr = _get_ocr()
        img_array = np.frombuffer(image_bytes, dtype=np.uint8)
        result, _ = ocr(img_array)
        if result:
            # result is list of [bbox, text, confidence]
            texts = [item[1] for item in result]
            return " ".join(texts)
        return ""
    except Exception:
        return ""
