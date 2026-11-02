"""Bounded, read-only backend client. Never trust model output as authorization."""
import os
import re
from urllib.parse import urlsplit
import requests


class ReadOnlyClient:
    def get(self, url):
        base = os.getenv('API_BASE_URL', 'http://localhost:3000/api').rstrip('/')
        token = os.getenv('RASA_ACTIONS_TOKEN', '')
        if len(token) < 32 or not url.startswith(base + '/'):
            raise ValueError('Configuración de acceso inválida')
        path = url[len(base):]
        if not re.fullmatch(r'/(orders|products|customers|payments)(/[a-fA-F0-9]{24})?', path):
            raise ValueError('Consulta inválida')
        if urlsplit(base).scheme not in ('http', 'https'):
            raise ValueError('Protocolo inválido')
        response = requests.get(url, headers={'x-service-token': token},
                                timeout=(2, 5), allow_redirects=False, stream=True)
        try:
            response.raise_for_status()
            if response.status_code != 200:
                raise ValueError('Respuesta inesperada')
            chunks, size = [], 0
            for chunk in response.iter_content(65536):
                size += len(chunk)
                if size > 2 * 1024 * 1024:
                    raise ValueError('Consulta demasiado grande; requiere paginación')
                chunks.append(chunk)
            response._content = b''.join(chunks)
            response._content_consumed = True
            return response
        finally:
            response.close()


client = ReadOnlyClient()
