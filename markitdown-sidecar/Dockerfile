FROM python:3.12-slim

WORKDIR /app

# System deps for markitdown:
#   - ffmpeg: not used (no audio) but cheap to include if future-proof; skip to keep image small
#   - libreoffice / antiword: only needed for .doc (legacy). .docx/.xlsx/.pptx 都純 python 處理，不需要
#   - poppler-utils: pdftotext fallback for older pdfs (optional; markitdown 內建 pdfminer)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8080

# 單 worker 對應 sidecar 使用情境（不會高併發），簡單穩定
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
