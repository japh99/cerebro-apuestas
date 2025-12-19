import os
import json
import requests
import difflib
import io
import csv
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ==========================================
# 🔐 CONFIGURACIÓN DE LLAVES
# ==========================================
# Pega tu llave de API-FOOTBALL aquí para los logos
API_FOOTBALL_KEY = "PEGA_TU_KEY_FOOTBALL_AQUI"

# Las llaves de ODDS API vienen del Frontend (React) en cada petición
# para rotarlas mejor.
# ==========================================

HEADERS_FOOTBALL = {
    'x-rapidapi-host': "v3.football.api-sports.io",
    'x-rapidapi-key': API_FOOTBALL_KEY
}

# --- MEMORIA ELO (Se carga al iniciar) ---
elo_database = {}

def load_elo():
    """Descarga ELOs de ClubElo.com al iniciar"""
    global elo_database
    print("🌍 Descargando base de datos ELO...")
    try:
        r = requests.get("http://api.clubelo.com/All")
        content = r.content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        for row in reader:
            elo_database[row['Club']] = float(row['Elo'])
        print(f"✅ {len(elo_database)} equipos cargados.")
    except Exception as e:
        print(f"❌ Error ClubElo: {e}")

load_elo() # Ejecutar al inicio

# --- UTILIDADES ---
def find_elo(team):
    matches = difflib.get_close_matches(team, elo_database.keys(), n=1, cutoff=0.6)
    return elo_database[matches[0]] if matches else 1450.0

def get_logo(team_name):
    # Función simple para buscar logo en API-Football
    try:
        url = f"https://v3.football.api-sports.io/teams?name={team_name}"
        res = requests.get(url, headers=HEADERS_FOOTBALL).json()
        if res['response']:
            return res['response'][0]['team']['logo']
    except: pass
    return None

# --- MOTORES MATEMÁTICOS ---
def check_surebet(home, away, draw=None):
    # Inversas
    inv = (1/home) + (1/away) + ((1/draw) if draw else 0)
    if inv < 1.0:
        return (1 - inv) * 100 # % Ganancia Segura
    return 0

def check_value(elo_h, elo_a, odd_h):
    # Probabilidad Real según ELO
    dr = elo_h - elo_a + 100 # +100 localía
    prob_real = 1 / (1 + 10 ** (-dr / 400))
    fair_odd = 1 / prob_real
    
    # Valor = (Cuota Mercado - Cuota Justa) / Cuota Justa
    edge = (odd_h - fair_odd) / fair_odd * 100
    return round(edge, 2), round(fair_odd, 2)

# --- RUTA PRINCIPAL ---
@app.route('/analizar_mercado', methods=['POST'])
def analizar():
    data = request.json
    api_key = data.get('api_key')
    league = data.get('league')
    
    url = f"https://api.the-odds-api.com/v4/sports/{league}/odds/?apiKey={api_key}&regions=eu&markets=h2h&oddsFormat=decimal"
    
    try:
        res = requests.get(url)
        matches_data = res.json()
        
        if not isinstance(matches_data, list):
            return jsonify({"error": "Error en API Odds"}), 400

        opportunities = []

        for m in matches_data:
            home = m['home_team']
            away = m['away_team']
            
            # 1. Buscar mejores cuotas
            best_h = 0; bk_h = ""
            best_a = 0; bk_a = ""
            best_d = 0; bk_d = ""
            
            for bookie in m['bookmakers']:
                for out in bookie['markets'][0]['outcomes']:
                    price = out['price']
                    name = out['name']
                    title = bookie['title']
                    
                    if name == home and price > best_h: best_h = price; bk_h = title
                    elif name == away and price > best_a: best_a = price; bk_a = title
                    elif name == 'Draw' and price > best_d: best_d = price; bk_d = title
            
            if best_h == 0: continue

            # 2. DETECTAR SUREBET
            arb_profit = check_surebet(best_h, best_a, best_d)
            if arb_profit > 0:
                opportunities.append({
                    "type": "SUREBET",
                    "match": f"{home} vs {away}",
                    "date": m['commence_time'],
                    "profit": round(arb_profit, 2),
                    "details": {
                        "1": {"odd": best_h, "bookie": bk_h},
                        "X": {"odd": best_d, "bookie": bk_d},
                        "2": {"odd": best_a, "bookie": bk_a}
                    }
                })
                continue # Si es surebet, no analizamos valor, ya es oro.

            # 3. DETECTAR VALOR (Solo Fútbol)
            if "soccer" in league:
                elo_h = find_elo(home)
                elo_a = find_elo(away)
                edge, fair = check_value(elo_h, elo_a, best_h)
                
                if edge > 3.0: # Solo si hay más de 3% de valor
                    # Obtenemos logos solo para las oportunidades reales (ahorro de API)
                    logo_h = get_logo(home)
                    logo_a = get_logo(away)
                    
                    opportunities.append({
                        "type": "VALUE",
                        "match": f"{home} vs {away}",
                        "date": m['commence_time'],
                        "profit": edge,
                        "details": {
                            "home": home, "away": away,
                            "elo_h": int(elo_h), "elo_a": int(elo_a),
                            "market_odd": best_h, "fair_odd": fair,
                            "logo_h": logo_h, "logo_a": logo_a
                        }
                    })

        # Ordenar: Primero Surebets, luego Valor más alto
        opportunities.sort(key=lambda x: (x['type'] == 'SUREBET', x['profit']), reverse=True)
        return jsonify(opportunities)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Keep Alive para el Robot
@app.route('/', methods=['GET'])
def home(): return "CAPITAL SHIELD ACTIVE", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
