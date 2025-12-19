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
API_FOOTBALL_KEY = "1df3d58221mshab1989b46146df0p194f53jsne69db977b9bc"
# ==========================================

HEADERS_FOOTBALL = {
    'x-rapidapi-host': "v3.football.api-sports.io",
    'x-rapidapi-key': API_FOOTBALL_KEY
}

# --- MEMORIA ELO ---
elo_database = {}

def load_elo():
    global elo_database
    print("🌍 Descargando base de datos ELO...")
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get("http://api.clubelo.com/All", headers=headers)
        content = r.content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        for row in reader:
            elo_database[row['Club']] = float(row['Elo'])
        print(f"✅ {len(elo_database)} equipos cargados.")
    except Exception as e:
        print(f"❌ Error ClubElo: {e}")

load_elo() 

# --- MOTORES MATEMÁTICOS ---

def get_elo_from_odds(odd):
    if odd <= 1.01: return 2000 
    prob_implicita = 1 / float(odd)
    elo_estimado = 1500 + ((prob_implicita - 0.33) * 600) 
    return elo_estimado

def find_elo(team, current_odd):
    """
    Retorna: (ELO, es_estimado)
    es_estimado = True si no se encontró en la base de datos y se calculó.
    """
    # 1. Búsqueda Difusa
    matches = difflib.get_close_matches(team, elo_database.keys(), n=1, cutoff=0.6) # Subimos cutoff para ser más estrictos
    
    if matches:
        # Encontrado en Base de Datos (ELO REAL)
        return elo_database[matches[0]], False 
    else:
        # No encontrado (ELO ESTIMADO)
        return get_elo_from_odds(current_odd), True

def check_surebet(home, away, draw=None):
    inv = (1/home) + (1/away) + ((1/draw) if draw else 0)
    if inv < 1.0:
        return (1 - inv) * 100 
    return 0

def check_value(elo_h, elo_a, odd_h):
    dr = elo_h - elo_a + 100 
    prob_real = 1 / (1 + 10 ** (-dr / 400))
    fair_odd = 1 / prob_real
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
                    if out['name'] == home and price > best_h: best_h = price; bk_h = bookie['title']
                    elif out['name'] == away and price > best_a: best_a = price; bk_a = bookie['title']
                    elif out['name'] == 'Draw' and price > best_d: best_d = price; bk_d = bookie['title']
            
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
                continue 

            # 3. DETECTAR VALOR (Fútbol)
            if "soccer" in league:
                # Obtenemos ELO y si es estimado o no
                elo_h, est_h = find_elo(home, best_h)
                elo_a, est_a = find_elo(away, best_a)
                
                edge, fair = check_value(elo_h, elo_a, best_h)
                
                if edge > 1.0: 
                    opportunities.append({
                        "type": "VALUE",
                        "match": f"{home} vs {away}",
                        "date": m['commence_time'],
                        "profit": edge,
                        "details": {
                            "home": home, "away": away,
                            "elo_h": int(elo_h), "elo_a": int(elo_a),
                            "est_h": est_h, "est_a": est_a, # <--- Enviamos la bandera al frontend
                            "market_odd": best_h, "fair_odd": fair,
                            "logo_h": None, "logo_a": None
                        }
                    })

        opportunities.sort(key=lambda x: (x['type'] == 'SUREBET', x['profit']), reverse=True)
        return jsonify(opportunities)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def home(): return "CAPITAL SHIELD v2.0", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
