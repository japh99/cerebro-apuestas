from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# --- MOTORES MATEMÁTICOS POR DEPORTE ---

def calculate_expected_margin(elo_home, elo_away, sport):
    """
    Calcula la ventaja esperada según la física de cada deporte.
    """
    diff_raw = int(elo_home) - int(elo_away)
    
    if sport == 'nba':
        # NBA: +100pts localía estándar.
        # FÓRMULA NBA: Diferencia / 28 = Puntos de ventaja
        # Ej: 280 puntos diferencia = 10 puntos de ventaja en el partido
        diff_adjusted = diff_raw + 100
        margin = round(diff_adjusted / 28.0, 1)
        unit = "puntos"
        
    elif sport == 'mlb':
        # MLB: +25pts localía. / 200 para carreras
        diff_adjusted = diff_raw + 25
        margin = round(diff_adjusted / 200.0, 2)
        unit = "carreras"
        
    else:
        # FÚTBOL (Default): +100pts localía. / 140 para goles
        diff_adjusted = diff_raw + 100
        margin = round(diff_adjusted / 140.0, 2)
        unit = "goles"

    return margin, diff_adjusted, unit

# --- RUTA PRINCIPAL ---
@app.route('/analizar_manual', methods=['POST'])
def analizar_manual():
    try:
        data = request.json
        elo_h = data.get('elo_home')
        elo_a = data.get('elo_away')
        # El frontend nos enviará 'soccer', 'nba' o 'mlb'
        sport = data.get('sport', 'soccer') 
        
        if not elo_h or not elo_a:
            return jsonify({"error": "Faltan datos de Rating"}), 400
        
        # Cálculo matemático dinámico
        margin, diff_adjusted, unit = calculate_expected_margin(elo_h, elo_a, sport)
        
        favorito = "LOCAL" if margin > 0 else "VISITA"
        
        return jsonify({
            "status": "success",
            "math": {
                "elo_diff_adjusted": diff_adjusted,
                "expected_margin": margin,
                "unit": unit,
                "favorito": favorito
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sincronizar-cache', methods=['POST'])
def sync(): return jsonify({"status": "ok"})

@app.route('/', methods=['GET'])
def home(): return "CAPITAL SHIELD MULTI-SPORT v4.0", 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
