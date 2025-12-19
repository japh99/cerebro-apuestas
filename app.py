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
# 🔐 CONFIGURACIÓN
# ==========================================
API_FOOTBALL_KEY = "PEGA_TU_KEY_FOOTBALL_AQUI"
HEADERS_FOOTBALL = {'x-rapidapi-host': "v3.football.api-sports.io", 'x-rapidapi-key': API_FOOTBALL_KEY}
# ==========================================

elo_database = {}

def load_elo():
    global elo_database
    print("🌍 Descargando ELO...")
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get("http://api.clubelo.com/All", headers=headers)
        content = r.content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        for row in reader: elo_database[row['Club']] = float(row['Elo'])
        print(f"✅ {len(elo_database)} equipos cargados.")
    except: print("❌ Error ClubElo")

load_elo()

def get_elo_from_odds(odd):
    if odd <= 1.01: return 2000
    prob = 1 / float(odd)
    return 1500 + ((prob - 0.33) * 600)

def find_elo(team, current_odd):
    matches = difflib.get_close_matches(team, elo_database.keys(), n=1, cutoff=0.5)
    if matches: return elo_database[matches[0]], False
    return get_elo_from_odds(current_odd), True

def check_surebet(home, away, draw=None):
    inv = (1/home) + (1/away) + ((1/draw) if draw else 0)
    if inv < 1.0: return (1 - inv) * 100
    return 0

def calc_dnb_odd(win_odd, draw_odd):
    """Convierte 1X2 a DNB (Empate no Válido)"""
    if draw_odd <= 1: return win_odd
    return win_odd * (1 - (1/draw_odd))

def check_value(elo_h, elo_a, dnb_market_odd):
    """Calcula valor basado en DNB"""
    dr = elo_h - elo_a + 100 
    prob_real = 1 / (1 + 10 ** (-dr / 400))
    fair_odd = 1 / prob_real
    edge = (dnb_market_odd - fair_odd) / fair_odd * 100
    return round(edge, 2), round(fair_odd, 2)

@app.route('/analizar_mercado', methods=['POST'])
def analizar():
    data = request.json
    api_key = data.get('api_key')
    league = data.get('league')
    
    url = f"https://api.the-odds-api.com/v4/sports/{league}/odds/?apiKey={api_key}&regions=eu&markets=h2h&oddsFormat=decimal"
    
    try:
        res = requests.get(url)
        matches_data = res.json()
        if not isinstance(matches_data, list): return jsonify({"error": "Error API"}), 400

        opportunities = []

        for m in matches_data:
            home = m['home_team']
            away = m['away_team']
            
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

            # 1. SUREBETS
            arb = check_surebet(best_h, best_a, best_d)
            if arb > 0:
                opportunities.append({
                    "type": "SUREBET", "match": f"{home} vs {away}", "date": m['commence_time'], "profit": round(arb, 2),
                    "details": {"1": {"odd": best_h}, "X": {"odd": best_d}, "2": {"odd": best_a}}
                })
                continue 

            # 2. VALOR EN HÁNDICAP (DNB)
            if "soccer" in league and best_d > 0:
                elo_h, est_h = find_elo(home, best_h)
                elo_a, est_a = find_elo(away, best_a)
                
                # Calculamos DNB para ambos
                dnb_h = calc_dnb_odd(best_h, best_d)
                dnb_a = calc_dnb_odd(best_a, best_d)
                
                # Chequear valor LOCAL
                edge_h, fair_h = check_value(elo_h, elo_a, dnb_h)
                if edge_h > 2.0:
                    opportunities.append({
                        "type": "VALUE_DNB",
                        "match": f"{home} vs {away}",
                        "pick": f"{home} (DNB)", # <--- ESTO FALTABA
                        "date": m['commence_time'],
                        "profit": edge_h,
                        "details": {
                            "elo_h": int(elo_h), "elo_a": int(elo_a), "est": est_h or est_a,
                            "market_1x2": best_h, # <--- ESTO FALTABA
                            "market_dnb": round(dnb_h, 2), # <--- ESTO FALTABA
                            "fair_odd": fair_h
                        }
                    })

                # Chequear valor VISITA
                edge_a, fair_a = check_value(elo_a, elo_h - 200, dnb_a)
                if edge_a > 2.0:
                    opportunities.append({
                        "type": "VALUE_DNB",
                        "match": f"{home} vs {away}",
                        "pick": f"{away} (DNB)", # <--- ESTO FALTABA
                        "date": m['commence_time'],
                        "profit": edge_a,
                        "details": {
                            "elo_h": int(elo_h), "elo_a": int(elo_a), "est": est_h or est_a,
                            "market_1x2": best_a, # <--- ESTO FALTABA
                            "market_dnb": round(dnb_a, 2), # <--- ESTO FALTABA
                            "fair_odd": fair_a
                        }
                    })

        opportunities.sort(key=lambda x: x['profit'], reverse=True)
        return jsonify(opportunities)

    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def home(): return "CAPITAL SHIELD DNB V2", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
