"""Train once per set of source files; never reuse a model after data changes."""
import hashlib
import importlib.metadata
from pathlib import Path
import subprocess
import shutil

root = Path('/app')
# Rasa's automatic configuration rewrites config.yml. Always fingerprint the
# original input so both restarted and recreated trainers reuse the same model.
shutil.copyfile(root / 'config.source.yml', root / 'config.yml')
digest = hashlib.sha256(importlib.metadata.version('rasa').encode())
inputs = [root / 'config.yml', root / 'domain.yml', *sorted((root / 'data').rglob('*.yml'))]
for source in inputs:
    digest.update(str(source.relative_to(root)).encode())
    digest.update(source.read_bytes())
fingerprint = digest.hexdigest()
marker = root / 'models' / 'source.sha256'
model = root / 'models' / 'lumina.tar.gz'
if model.exists() and marker.exists() and marker.read_text() == fingerprint:
    print('Modelo Rasa vigente; se reutiliza el volumen.', flush=True)
else:
    subprocess.run(['rasa', 'data', 'validate'], cwd=root, check=True)
    subprocess.run(['rasa', 'train', '--out', '/app/models', '--fixed-model-name', 'lumina'], cwd=root, check=True)
    if not model.exists():
        raise RuntimeError('Rasa no generó el modelo esperado')
    marker.write_text(fingerprint)
