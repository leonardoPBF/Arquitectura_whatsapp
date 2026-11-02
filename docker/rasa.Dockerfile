FROM rasa/rasa:3.6.21-full
USER root
WORKDIR /app
COPY --chown=1001:0 apps/rasa-chatbot/config.yml apps/rasa-chatbot/domain.yml ./
COPY --chown=1001:0 apps/rasa-chatbot/config.yml ./config.source.yml
COPY --chown=1001:0 apps/rasa-chatbot/data ./data
COPY --chown=1001:0 docker/rasa/endpoints.yml ./endpoints.yml
COPY --chown=1001:0 docker/rasa/credentials.yml ./credentials.yml
COPY --chown=1001:0 docker/rasa/train-if-needed.py ./train-if-needed.py
RUN mkdir -p /app/models && chown -R 1001:0 /app
USER 1001
ENV RASA_TELEMETRY_ENABLED=false
# Training is explicit and repeatable in a separate one-shot service.
ENTRYPOINT ["rasa"]
