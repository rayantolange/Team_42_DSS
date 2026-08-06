FROM python:3.12-slim

# build-essential + libpq-dev: psycopg2, sentence-transformers, and pymupdf
# all need to compile C extensions at install time.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Create non-root user and setup home directory structure
RUN useradd -m -u 1000 appuser

# 2. Set Hugging Face cache path to appuser's home folder
ENV HF_HOME=/home/appuser/.cache/huggingface

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

# 3. Ensure permissions are set for appuser before switching users
RUN chmod +x entrypoint.sh && \
    mkdir -p /home/appuser/.cache/huggingface && \
    chown -R appuser:appuser /app /home/appuser

# 4. Switch context to the non-root user
USER appuser

# Pre-download models into HF_HOME so no network call is needed at runtime.
RUN python -c "from sentence_transformers import SentenceTransformer, CrossEncoder; \
    SentenceTransformer('nomic-ai/nomic-embed-text-v1.5', trust_remote_code=True); \
    CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')"

# Render injects $PORT at runtime — not fixed here, entrypoint.sh reads it.
EXPOSE 8000

CMD ["./entrypoint.sh"]