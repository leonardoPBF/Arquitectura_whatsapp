# The upstream ARM manifest failed to execute /bin/bash on a native ARM runner.
# Install Rasa natively; the current default pipeline does not need the full extras.
FROM python:3.10-slim-bookworm
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 HOME=/app
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir "rasa==3.6.21"
WORKDIR /app
COPY --chown=1001:0 apps/rasa-chatbot/config.yml apps/rasa-chatbot/domain.yml ./
COPY --chown=1001:0 apps/rasa-chatbot/config.yml ./config.source.yml
COPY --chown=1001:0 apps/rasa-chatbot/data ./data
COPY --chown=1001:0 docker/rasa/endpoints.yml ./endpoints.yml
COPY --chown=1001:0 docker/rasa/credentials.yml ./credentials.yml
COPY --chown=1001:0 docker/rasa/train-if-needed.py ./train-if-needed.py
RUN mkdir -p /app/models && chown -R 1001:0 /app
USER 1001:0
ENV RASA_TELEMETRY_ENABLED=false
# Training is explicit and repeatable in a separate one-shot service.
ENTRYPOINT ["rasa"]
