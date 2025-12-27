from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Agrega la carpeta 'engines' al path para poder importarlos
sys.path.append(os.path.join(os.path.dirname(__file__), 'engines'))

# Importa los motores específicos de cada deporte
import footballEngine as fb_engine
# import nbaEngine as nba_engine # Descomentar cuando lo crees
# import baseballEngine as bb_engine # Descomentar cuando lo crees

app = Flask(__name__)
CORS(app)

# --- RUTAS DE LA API ---

# Ruta principal para el análisis (el Front-End llama a esta)
@app.route('/analizar_manual', methods=['POST'])
def analizar_manual():
    data = request.json
    sport = data.get('sport', 'soccer') # El Front-End ahora dirá qué deporte es
    
    if sport == 'soccer':
        return jsonify(fb_engine.analyze_football_handicap(data))
    # elif sport == 'nba':
    #     return jsonify(nba_engine.analyze_nba_handicap(data)) # Activar para NBA
    # elif sport == 'mlb':
    #     return jsonify(bb_engine.analyze_baseball_handicap(data)) # Activar para MLB
    else:
        return jsonify({"error": "Deporte no soportado o módulo no activo"}), 400

# Ruta de sincronización (para que el Front-End no de error 404)
@app.route('/sincronizar-cache', methods=['POST'])
def sync():
    return jsonify({"status": "ok", "message": "Datos recibidos (modo manual)"})

# Ruta de salud (para el robot de Keep-Alive)
@app.route('/', methods=['GET'])
def home(): 
    return "CAPITAL SHIELD HUB ONLINE", 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
