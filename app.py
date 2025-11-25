import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import requests

app = Flask(__name__)
CORS(app)

# ==========================================
# 🔐 TU LLAVE DE FOOTBALL API
# ==========================================
API_FOOTBALL_KEY = "1df3d58221mshab1989b46146df0p194f53jsne69db977b9bc"
# ==========================================

HEADERS = {
    'x-rapidapi-host': "v3.football.api-sports.io",
    'x-rapidapi-key': API_FOOTBALL_KEY
}
CACHE_FILE = "team_stats_cache.json"

# Cargar Modelos
try:
    modelo_btts = joblib.load('btts_model.joblib')
    modelo_ou = joblib.load('ou_model.joblib')
    print("✅ Modelos cargados.")
except:
    modelo_btts = None
    modelo_ou = None

COLUMNAS_EXACTAS = ['OddHome', 'OddDraw', 'OddAway', 'Elo_Home', 'Elo_Away', 'Elo_Diff', 'Form3_Diff', 'Form5_Diff', 'Shots_Diff', 'Shots_Total', 'OddsRatio', 'Target_Diff', 'Target_Total']

def load_cache():
    if os.path.exists(CACHE_FILE):
        try: return json.load(open(CACHE_FILE))
        except: return {}
    return {}

def save_cache(data):
    with open(CACHE_FILE, 'w') as f: json.dump(data, f)

def obtener_stats_reales(equipo):
    cache = load_cache()
    if equipo in cache: return cache[equipo]
    
    try:
        # 1. Buscar Equipo (ID y LOGO)
        url = f"https://v3.football.api-sports.io/teams?name={equipo}"
        res = requests.get(url, headers=HEADERS).json()
        
        if not res['response']: 
            return {'shots': 10.0, 'corners': 5.0, 'logo': None}
        
        team_data = res['response'][0]['team']
        id_eq = team_data['id']
        logo_url = team_data['logo'] # <--- AQUÍ CAPTURAMOS EL LOGO
        
        # 2. Buscar Stats
        url_fix = f"https://v3.football.api-sports.io/fixtures?team={id_eq}&last=5&status=FT"
        matches = requests.get(url_fix, headers=HEADERS).json()['response']
        
        shots = 0; count = 0
        for m in matches:
            stats = m.get('statistics', [])
            if not stats: continue
            my_stats = next((s for s in stats if s['team']['id'] == id_eq), None)
            if my_stats:
                s = next((i['value'] for i in my_stats['statistics'] if i['type']=='Total Shots'), 0) or 0
                shots += s; count += 1
        
        final = {
            'shots': round(shots/max(1,count), 1), 
            'corners': 5.0,
            'logo': logo_url # <--- GUARDAMOS EL LOGO EN CACHÉ
        }
        cache[equipo] = final
        save_cache(cache)
        return final
    except:
        return {'shots': 10.0, 'corners': 5.0, 'logo': None}

def get_elo(odd):
    return 1500.0 + (( (1.0/max(float(odd),1.01)) - 0.5 ) * 600.0)

# --- RUTA ACTUALIZADA: DEVUELVE LOS LOGOS AL FRONTEND ---
@app.route('/sincronizar-cache', methods=['POST'])
def sync():
    data = request.json
    logos_encontrados = {}
    
    for p in data.get('partidos', []):
        try:
            # Obtenemos stats y de paso el logo
            sh = obtener_stats_reales(p['home_team'])
            sa = obtener_stats_reales(p['away_team'])
            
            # Guardamos los logos en un diccionario para enviarlos al Frontend
            logos_encontrados[p['home_team']] = sh.get('logo')
            logos_encontrados[p['away_team']] = sa.get('logo')
        except: pass
        
    return jsonify({"status": "ok", "logos": logos_encontrados})

@app.route('/analizar_completo', methods=['POST'])
def analizar_completo():
    data = request.json
    home = data.get('home_team')
    away = data.get('away_team')
    odd_home = float(data.get('odd_home', 2.0))
    odd_draw = float(data.get('odd_draw', 3.0))
    odd_away = float(data.get('odd_away', 2.0))

    s_home = obtener_stats_reales(home)
    s_away = obtener_stats_reales(away)
    elo_h = get_elo(odd_home)
    elo_a = get_elo(odd_away)
    
    # ... (Cálculos matemáticos idénticos a la v9) ...
    form_h = 15.0 if elo_h > 1550 else 10.0
    form_a = 15.0 if elo_a > 1550 else 10.0
    shots_h = float(s_home['shots'])
    shots_a = float(s_away['shots'])

    features = {
        'OddHome': odd_home, 'OddDraw': odd_draw, 'OddAway': odd_away,
        'Elo_Home': elo_h, 'Elo_Away': elo_a, 'Elo_Diff': elo_h - elo_a,
        'Form3_Diff': form_h - form_a, 'Form5_Diff': 0,
        'Shots_Diff': shots_h - shots_a, 'Shots_Total': shots_h + shots_a,
        'OddsRatio': odd_away / odd_home, 'Target_Diff': 0, 'Target_Total': 0
    }

    btts_prob = 50.0
    over_prob = 50.0
    if modelo_btts:
        try:
            df = pd.DataFrame([features])[COLUMNAS_EXACTAS]
            btts_prob = modelo_btts.predict_proba(df)[0][1] * 100
            over_prob = modelo_ou.predict_proba(df)[0][1] * 100
        except: pass

    return jsonify({
        "stats": {"home": s_home, "away": s_away},
        "elo": {"home": int(elo_h), "away": int(elo_a)},
        "model_result": {"btts_prob": round(btts_prob, 2), "over_prob": round(over_prob, 2)}
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
