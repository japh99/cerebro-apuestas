from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- MOTORES MATEMÁTICOS ---
def calculate_expected_margin(elo_home, elo_away, sport):
    diff_raw = int(elo_home) - int(elo_away)
    
    if sport == 'nba':
        # NBA: /28
        diff_adjusted = diff_raw + 100
        margin = round(diff_adjusted / 28.0, 1)
        unit = "puntos"
    elif sport == 'mlb':
        # MLB: /200
        diff_adjusted = diff_raw + 25
        margin = round(diff_adjusted / 200.0, 2)
        unit = "carreras"
    else:
        # FÚTBOL: /140
        diff_adjusted = diff_raw + 100
        margin = round(diff_adjusted / 140.0, 2)
        unit = "goles"

    return margin, diff_adjusted, unit

# --- RUTAS DE LA API ---

@app.route('/api/analizar_manual', methods=['POST'])
def analizar_manual():
    try:
        data = request.json
        elo_h = data.get('elo_home')
        elo_a = data.get('elo_away')
        sport = data.get('sport', 'soccer')
        
        if not elo_h or not elo_a:
            return jsonify({"error": "Faltan datos de ELO"}), 400
        
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

@app.route('/api/sincronizar-cache', methods=['POST'])
def sync():
    return jsonify({"status": "ok"})

@app.route('/api/', methods=['GET'])
def home():
    return "CAPITAL SHIELD SERVERLESS: ONLINE", 200

# Vercel maneja el servidor, pero esto ayuda en local
if __name__ == '__main__':
    app.run()
