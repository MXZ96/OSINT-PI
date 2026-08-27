FROM python:3.12-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NODE_ENV=production \
    PYTHON_BIN=python3 \
    PORT=5001

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs npm \
    && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY TOOLS/blackbird/requirements.txt /tmp/blackbird-requirements.txt
RUN pip install --no-cache-dir -r /tmp/blackbird-requirements.txt

COPY TOOLS/theHarvester/pyproject.toml /tmp/theHarvester/pyproject.toml
COPY TOOLS/theHarvester/README.md /tmp/theHarvester/README.md
COPY TOOLS/theHarvester/theHarvester /tmp/theHarvester/theHarvester
RUN pip install --no-cache-dir /tmp/theHarvester
RUN playwright install --with-deps chromium

COPY backend ./backend
COPY TOOLS ./TOOLS

WORKDIR /app/backend
EXPOSE 5001
CMD ["npm", "start"]
