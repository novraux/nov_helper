FROM python:3.11-slim

WORKDIR /app

# psycopg2-binary ships as a self-contained wheel — no system packages needed
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
