from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# --- MOTORES MATEMÁTICOS ---

def calculate_expected_margin(elo_home, elo_away):
    """
    Convierte la diferencia de ELO en goles de ventaja esperada.
    Fórmula estándar: Diferencia / 140 = Goles de ventaja.
    """
    # Ajuste de campo: +100 puntos al local (Estándar en apuestas)
    diff = (int(elo_home) + 100) - int(elo_away)
    return round(diff / 140.0, 2), diff

# --- RUTA PRINCIPAL (MODO MANUAL) ---
@app.route('/analizar_manual', methods=['POST'])
def analizar_manual():
    try:
        data = request.json
        # Recibimos los ELOs que tú escribiste manualmente en la web
        elo_h = data.get('elo_home')
        elo_a = data.get('elo_away')
        
        if not elo_h or not elo_a:
            return jsonify({"error": "Faltan datos de ELO"}), 400
        
        # Cálculo matemático puro
        margin, diff_adjusted = calculate_expected_margin(elo_h, elo_a)
        
        # Determinar favorito matemático para el texto
        favorito = "LOCAL" if margin > 0 else "VISITA"
        
        return jsonify({
            "status": "success",
            "math": {
                "elo_diff_adjusted": diff_adjusted,
                "expected_goals_diff": margin,
                "favorito": favorito
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- RUTA DE SINCRONIZACIÓN (Para que no de error el escaneo inicial) ---
@app.route('/sincronizar-cache', methods=['POST'])
def sync():
    # En modo manual no necesitamos guardar caché, pero respondemos OK
    # para que el frontend no se queje al cargar los partidos.
    return jsonify({"status": "ok"})

# --- RUTA DE SALUD (KEEP ALIVE) ---
@app.route('/', methods=['GET'])
def home(): 
    return "CALCULADORA MANUAL ONLINE", 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
