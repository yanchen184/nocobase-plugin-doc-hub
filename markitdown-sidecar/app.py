"""
Markitdown sidecar for DocHub.

POST /convert
  multipart form:
    file: <binary>
  response:
    { "ok": true, "markdown": "...", "filename": "report.docx", "bytes": 12345 }
    or
    { "ok": false, "error": "unsupported format" }

GET /health
  { "ok": true }
"""
from __future__ import annotations

import io
import logging
import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from markitdown import MarkItDown

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("markitdown-sidecar")

app = FastAPI(title="DocHub Markitdown Sidecar", version="1.0.0")

# 支援的副檔名（白名單；圖片/音訊先不做）
ALLOWED_EXTS = {
    ".docx", ".doc",
    ".xlsx", ".xls",
    ".pptx", ".ppt",
    ".pdf",
    ".html", ".htm",
    ".csv",
    ".json", ".xml",
    ".txt", ".md",
    ".msg",  # Outlook email
    ".epub",
    ".zip",
}

# 上限：20 MB
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "20")) * 1024 * 1024

# 關閉 LLM 相關功能（圖片/音訊辨識）
md_converter = MarkItDown(enable_plugins=False)


@app.get("/health")
async def health() -> dict:
    return {"ok": True, "service": "markitdown-sidecar", "max_mb": MAX_UPLOAD_BYTES // 1024 // 1024}


@app.post("/convert")
async def convert(file: UploadFile = File(...)) -> JSONResponse:
    filename = file.filename or "unknown"
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_EXTS:
        return JSONResponse(
            status_code=415,
            content={"ok": False, "error": f"unsupported extension: {ext}", "filename": filename},
        )

    body = await file.read()
    size = len(body)
    if size > MAX_UPLOAD_BYTES:
        return JSONResponse(
            status_code=413,
            content={
                "ok": False,
                "error": f"file too large: {size} bytes (limit {MAX_UPLOAD_BYTES})",
                "filename": filename,
            },
        )
    if size == 0:
        return JSONResponse(
            status_code=400,
            content={"ok": False, "error": "empty file", "filename": filename},
        )

    # markitdown 有些 loader 需要真實路徑，寫到 tmp 最穩
    tmpdir = tempfile.mkdtemp(prefix="mkd_")
    tmp_path = Path(tmpdir) / f"upload{ext}"
    try:
        tmp_path.write_bytes(body)
        log.info("convert %s (%d bytes)", filename, size)

        try:
            result = md_converter.convert(str(tmp_path))
        except Exception as err:  # noqa: BLE001
            log.exception("conversion failed for %s", filename)
            return JSONResponse(
                status_code=500,
                content={"ok": False, "error": f"conversion failed: {err}", "filename": filename},
            )

        text = (result.text_content or "").strip()
        return JSONResponse(
            content={
                "ok": True,
                "filename": filename,
                "bytes": size,
                "markdown": text,
                "title": getattr(result, "title", None) or Path(filename).stem,
            }
        )
    finally:
        try:
            tmp_path.unlink(missing_ok=True)
            Path(tmpdir).rmdir()
        except OSError:
            pass
