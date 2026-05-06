FROM python:3.11-slim

# Timezone ve locale
ENV TZ=Europe/Istanbul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

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
