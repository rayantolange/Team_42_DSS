FROM python:3.12-slim
# build-essential + libpq-dev: psycopg2, sentence-transformers, and pymupdf
# all need to compile C extensions at install time.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ARG REQUIREMENTS_FILE=requirements-api.txt
# Copy both files under their real names — requirements-worker.txt starts
# with "-r requirements-api.txt", which only resolves if requirements-api.txt
# is actually present in the build context under that exact name.
COPY requirements-api.txt requirements-worker.txt ./
RUN pip install --no-cache-dir -r ${REQUIREMENTS_FILE}
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh
# Render injects $PORT at runtime — not fixed here, entrypoint.sh reads it.
EXPOSE 8000
CMD ["./entrypoint.sh"]