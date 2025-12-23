import os
import json
import requests
import difflib
from flask import Flask, jsonify, request, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ==========================================================
# 🧠 BASE DE DATOS ELO MUNDIAL (ESTÁTICA & RÁPIDA)
# ==========================================================
ELO_DATABASE = {
    # --- 🇬🇧 INGLATERRA (Premier + Championship + Copas) ---
    "Man City": 2045, "Liverpool": 1990, "Arsenal": 1970, "Aston Villa": 1860,
    "Tottenham": 1830, "Newcastle": 1820, "Chelsea": 1810, "Man Utd": 1790,
    "Brighton": 1750, "West Ham": 1740, "Brentford": 1730, "Fulham": 1720,
    "Crystal Palace": 1710, "Everton": 1700, "Bournemouth": 1690, "Wolves": 1680,
    "Nottm Forest": 1670, "Leicester": 1660, "Southampton": 1640, "Ipswich": 1630,
    "Leeds": 1650, "Burnley": 1640, "Luton": 1620, "Sheffield Utd": 1610,

    # --- 🇪🇸 ESPAÑA (La Liga + Copas) ---
    "Real Madrid": 2020, "Barcelona": 1960, "Atletico Madrid": 1890, "Girona": 1830,
    "Athletic Bilbao": 1820, "Real Sociedad": 1800, "Real Betis": 1770, "Villarreal": 1760,
    "Valencia": 1730, "Sevilla": 1720, "Osasuna": 1710, "Mallorca": 1700,
    "Celta Vigo": 1690, "Rayo Vallecano": 1680, "Getafe": 1670, "Alaves": 1660,
    "Las Palmas": 1650, "Espanyol": 1640, "Valladolid": 1630, "Leganes": 1620,

    # --- 🇮🇹 ITALIA ---
    "Inter": 1950, "Milan": 1870, "Juventus": 1860, "Atalanta": 1850,
    "Napoli": 1830, "Roma": 1800, "Lazio": 1790, "Fiorentina": 1770, "Bologna": 1760,

    # --- 🇩🇪 ALEMANIA ---
    "Bayern Munich": 1970, "Leverkusen": 1930, "Dortmund": 1860, "Leipzig": 1850,
    "Stuttgart": 1810, "Frankfurt": 1780,

    # --- 🇧🇷 BRASIL (Brasileirão) ---
    "Palmeiras": 1800, "Flamengo": 1790, "Atletico Mineiro": 1750, "Botafogo": 1740,
    "Sao Paulo": 1720, "Internacional": 1710, "Gremio": 1700, "Fluminense": 1690,
    "Corinthians": 1680, "Cruzeiro": 1670, "Fortaleza": 1660, "Athletico Paranaense": 1650,
    "Bahia": 1640, "Vasco da Gama": 1630, "Santos": 1620,

    # --- 🇦🇷 ARGENTINA ---
    "River Plate": 1730, "Boca Juniors": 1700, "Racing Club": 1680, 
    "Estudiantes": 1660, "Talleres": 1650, "Independiente": 1640, "San Lorenzo": 1630,

    # --- 🌎 RESTO AMÉRICA (MLS / MX / COL) ---
    "Club America": 1680, "Monterrey": 1670, "Tigres UANL": 1670, "Cruz Azul": 1650,
    "Inter Miami": 1640, "Los Angeles FC": 1630, "Columbus Crew": 1620,
    "Atletico Nacional": 1580, "Millonarios": 1570, "Junior": 1560,

    # --- 🇪🇺 RESTO EUROPA ---
    "PSG": 1910, "Benfica": 1830, "Porto": 1820, "Sporting CP": 1840,
    "PSV": 1810, "Feyenoord": 1790, "Ajax": 1750, "Galatasaray": 1700, "Fenerbahce": 1690
}

# --- TRADUCTOR DE NOMBRES (ODDS API -> ELO DB) ---
NAME_MAPPING = {
    # Premier
    "Manchester City": "Man City", "Manchester United": "Man Utd",
    "Nottingham Forest": "Nottm Forest", "Wolverhampton Wanderers": "Wolves",
    "Brighton and Hove Albion": "Brighton", "Leicester City": "Leicester",
    "Leeds United": "Leeds", "West Ham United": "West Ham",
    "Tottenham Hotspur": "Tottenham",
    # La Liga
    "Atlético de Madrid": "Atletico Madrid", "Athletic Club": "Athletic Bilbao",
    "Real Valladolid": "Valladolid", "RCD Mallorca": "Mallorca",
    "Celta de Vigo": "Celta Vigo", "RCD Espanyol": "Espanyol",
    # Serie A
    "Internazionale": "Inter", "AC Milan": "Milan",
    # Bundesliga
    "Bayer Leverkusen": "Leverkusen", "Bayern München": "Bayern Munich",
    "Eintracht Frankfurt": "Frankfurt", "RB Leipzig": "Leipzig",
    # Francia
    "Paris Saint-Germain": "PSG", "AS Monaco": "Monaco",
    # Brasil & LatAm (A veces Odds API pone nombres largos)
    "Clube de Regatas do Flamengo": "Flamengo", "Sociedade Esportiva Palmeiras": "Palmeiras",
    "São Paulo FC": "Sao Paulo", "Sport Club Internacional": "Internacional",
    "CA River Plate": "River Plate", "CA Boca Juniors": "Boca Juniors",
    "Club América": "Club America"
}

# ==========================================
# ⚙️ MOTORES MATEMÁTICOS
# ==========================================

def get_elo_from_odds(odd):
    """
    PLAN B: Si el equipo es de 3ª división (Copa) o no está en la lista,
    calculamos su fuerza basándonos en cuánto paga la casa de apuestas.
    """
    if odd <= 1.01: return 2000
    prob = 1 / float(odd)
    # Fórmula calibrada para no sobreestimar underdogs
    return 1500 + ((prob - 0.30) * 600)

def find_elo(team_name, current_odd):
    # 1. Normalizar nombre (Quitar FC, CD, etc para mejorar búsqueda)
    clean_name = NAME_MAPPING.get(team_name, team_name)
    clean_name = clean_name.replace(" FC", "").replace(" CF", "").strip()

    # 2. Búsqueda Difusa en la Base de Datos
    matches = difflib.get_close_matches(clean_name, ELO_DATABASE.keys(), n=1, cutoff=0.6)
    
    if matches:
        return ELO_DATABASE[matches[0]], False # False = ELO Real (Verificado)
    else:
        # 3. Si es un equipo desconocido (Copa), usar la cuota
        return get_elo_from_odds(current_odd), True # True = ELO Estimado

def expected_margin(elo_diff):
    # 140 puntos de diferencia = ~1 gol de ventaja esperada
    return round(elo_diff / 140.0, 2)

@app.route('/analizar_handicap', methods=['POST'])
def analizar_handicap():
    data = request.json
    home = data.get('home_team')
    away = data.get('away_team')
    odd_home = float(data.get('odd_home', 2.0))
    odd_away = float(data.get('odd_away', 2.0))

    elo_h, est_h = find_elo(home, odd_home)
    elo_a, est_a = find_elo(away, odd_away)

    # Ajuste de Localía (+100 puntos estándar, en LatAm puede ser más pero usamos 100 base)
    elo_diff_adjusted = (elo_h + 100) - elo_a
    
    exp_margin = expected_margin(elo_diff_adjusted)

    return jsonify({
        "elo": {
            "home": int(elo_h), 
            "away": int(elo_a), 
            "diff_real": int(elo_diff_adjusted),
            "is_estimated": est_h or est_a
        },
        "math_prediction": {
            "expected_goal_diff": exp_margin, 
            "favorito": home if exp_margin > 0 else away
        }
    })

# --- INSPECTOR DE NOMBRES (Para que veas cómo los detecta) ---
@app.route('/auditar', methods=['GET'])
def auditar():
    api_key = request.args.get('key')
    league = request.args.get('league', 'soccer_epl')
    if not api_key: return "Falta ?key=TU_API_KEY"
    
    url = f"https://api.the-odds-api.com/v4/sports/{league}/odds/?apiKey={api_key}&regions=eu&markets=h2h"
    try:
        res = requests.get(url)
        data = res.json()
        html = "<body style='background:#111; color:#fff; font-family:sans-serif;'>"
        html += f"<h2>Auditoría: {league}</h2><table border='1' style='width:100%'>"
        html += "<tr><th>Odds API</th><th>Base Datos</th><th>Estado</th></tr>"
        
        for m in data:
            for team in [m['home_team'], m['away_team']]:
                clean = NAME_MAPPING.get(team, team).replace(" FC", "").replace(" CF", "")
                matches = difflib.get_close_matches(clean, ELO_DATABASE.keys(), n=1, cutoff=0.6)
                if matches:
                    html += f"<tr><td>{team}</td><td style='color:#4ade80'>{matches[0]}</td><td>✅</td></tr>"
                else:
                    html += f"<tr><td>{team}</td><td style='color:#f87171'>---</td><td>⚠️ ESTIMAR</td></tr>"
        return Response(html + "</table></body>", mimetype='text/html')
    except: return "Error API"

@app.route('/sincronizar-cache', methods=['POST'])
def sync(): return jsonify({"status": "ok"})

@app.route('/', methods=['GET'])
def home(): return "CAPITAL SHIELD WORLD EDITION", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
