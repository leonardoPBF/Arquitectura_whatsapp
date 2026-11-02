# The upstream 3.6.2 SDK image only publishes amd64. Install the same SDK
# on a Python base that also publishes arm64 for AWS Graviton.
FROM python:3.10-slim-bookworm
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
COPY docker/rasa/requirements-actions.txt /tmp/requirements-actions.txt
RUN pip install --no-cache-dir -r /tmp/requirements-actions.txt
WORKDIR /app
COPY --chown=1001:0 apps/rasa-chatbot/actions ./actions
USER 1001:0
EXPOSE 5055
CMD ["python", "-m", "rasa_sdk", "--actions", "actions", "--port", "5055"]
