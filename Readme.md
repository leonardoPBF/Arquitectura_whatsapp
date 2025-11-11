seed bd . npx ts-node src/scripts/seed.ts


python -m venv venv
.\venv\Scripts\activate
pip install rasa
python --version -> 3.10.11

cd apps/rasa-chatbot
rasa train 
//correr servidordel bot_
rasa run --enable-api
//correr acciones personalizadas:
rasa run actions

rasa run --enable-api --cors "*" --debug
