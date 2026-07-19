FROM python:3.11-slim

# Timezone ve locale
ENV TZ=Europe/Istanbul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# WeasyPrint (Hunt raporu PDF export) için sistem paketleri
RUN apt-get update && apt-get install -y --no-install-recommends \
      libpango-1.0-0 libpangoft2-1.0-0 libpangocairo-1.0-0 \
      libgdk-pixbuf2.0-0 libcairo2 fonts-dejavu-core shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Bağımlılıkları önce kopyala (layer cache için)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama dosyaları
COPY . .

# Kalıcı veri dizinleri
RUN mkdir -p /data /app/static/uploads

# DB ve uploads dışarıdan mount edilecek
ENV DATABASE=/data/tracker.db
ENV UPLOAD_FOLDER=/app/static/uploads

EXPOSE 5000

# Gunicorn: 2 worker, 120s timeout (MITRE fetch uzun sürebilir)
CMD ["gunicorn", \
     "--bind", "0.0.0.0:5000", \
     "--workers", "2", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "app:app"]
