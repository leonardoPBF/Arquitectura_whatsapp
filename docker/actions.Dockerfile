FROM rasa/rasa-sdk:3.6.2
USER root
COPY docker/rasa/requirements-actions.txt /tmp/requirements-actions.txt
RUN pip install --no-cache-dir -r /tmp/requirements-actions.txt
WORKDIR /app
COPY --chown=1001:0 apps/rasa-chatbot/actions ./actions
USER 1001
CMD ["start", "--actions", "actions", "--port", "5055"]
