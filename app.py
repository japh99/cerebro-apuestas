from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Ya no necesitamos API Keys aquí ni bases de datos.
# Este backend es ahora una CALCULADORA MATEMÁTICA PURA.

def calculate_expected_margin(elo_home, elo_away):
    """
    Convierte la diferencia de ELO en goles de ventaja esperada.
    Fórmula estándar: Diferencia / 140 = Goles de ventaja.
    """
    # Ajuste de campo: +100 puntos al local
    diff = (elo_home + 100) - elo_away
    return round(diff / 140.0, 2)

@app.route('/analizar_manual', methods=['POST'])
def analizar_manual():
    try:
        data = request.json
        # Recibimos los ELOs que tú escribiste manualmente
        elo_h = int(data.get('elo_home'))
        elo_a = int(data.get('elo_away'))
        
        # Cálculo matemático
        margin = calculate_expected_margin(elo_h, elo_a)
        
        # Determinar favorito matemático
        favorito = "LOCAL" if margin > 0 else "VISITA"
        
        return jsonify({
            "status": "success",
            "math": {
                "elo_diff_adjusted": (elo_h + 100) - elo_a,
                "expected_goals_diff": margin,
                "favorito": favorito
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/', methods=['GET'])
def home(): 
    return "CALCULADORA ELO MANUAL ONLINE", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
