import os
import requests
import difflib
import io
import csv
from flask import Flask, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- TU LLAVE YA INTEGRADA ---
API_KEY = "734f30d0866696cf90d5029ac106cfba"

# --- LIGAS A ESCANEAR ---
LIGAS = [
    "soccer_epl",               # Inglaterra
    "soccer_spain_la_liga",     # España
    "soccer_italy_serie_a",     # Italia
    "soccer_germany_bundesliga",# Alemania
    "soccer_france_ligue_one"   # Francia
]

def obtener_clubelo():
    """Descarga la lista oficial de nombres"""
    print("🌍 Descargando ClubElo...")
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get("http://api.clubelo.com/All", headers=headers, timeout=10)
        content = r.content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        # Guardamos solo nombres de equipos de nivel 1 (Primeras divisiones) para que sea mas rápido
        # o quitamos el filtro si quieres todo.
        names = [row['Club'] for row in reader] 
        return names
    except Exception as e:
        return []

def obtener_equipos_odds(league):
    """Descarga los nombres como los tiene la casa de apuestas"""
    url = f"https://api.the-odds-api.com/v4/sports/{league}/odds/?apiKey={API_KEY}&regions=eu&markets=h2h"
    try:
        res = requests.get(url)
        data = res.json()
        teams = set()
        if isinstance(data, list):
            for m in data:
                teams.add(m['home_team'])
                teams.add(m['away_team'])
        return sorted(list(teams))
    except:
        return []

@app.route('/', methods=['GET'])
def auditoria_total():
    # 1. Cargar ClubElo
    clubelo_names = obtener_clubelo()
    
    html = """
    <html>
    <head>
        <title>Auditoría de Nombres</title>
        <style>
            body { font-family: sans-serif; background: #111; color: #fff; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #222; padding: 10px; border-bottom: 2px solid #444; color: #aaa; }
            td { padding: 10px; border-bottom: 1px solid #333; }
            .match { color: #10b981; font-weight: bold; } /* Verde */
            .mismatch { color: #ef4444; font-weight: bold; } /* Rojo */
            .league-title { margin-top: 40px; color: #3b82f6; border-bottom: 1px solid #3b82f6; padding-bottom: 5px; }
        </style>
    </head>
    <body>
        <h1>🕵️‍♂️ Auditoría de Nombres de Equipos</h1>
        <p>Comparando <b>The Odds API</b> vs <b>ClubElo (Oficial)</b></p>
    """

    # 2. Recorrer Ligas
    for liga in LIGAS:
        html += f"<h2 class='league-title'>{liga.upper()}</h2>"
        html += "<table><tr><th>Nombre en ODDS API</th><th>Mejor Coincidencia en CLUBELO</th><th>Estado</th></tr>"
        
        equipos_odds = obtener_equipos_odds(liga)
        
        if not equipos_odds:
            html += "<tr><td colspan='3'>⚠️ No hay cuotas disponibles hoy para esta liga.</td></tr></table>"
            continue

        for team in equipos_odds:
            # BUSCADOR DIFUSO
            matches = difflib.get_close_matches(team, clubelo_names, n=1, cutoff=0.5)
            
            if matches:
                found = matches[0]
                # Si son idénticos o muy parecidos
                if team == found:
                    status = "<span class='match'>✅ EXACTO</span>"
                else:
                    status = "<span class='match'>⚠️ PARECIDO (OK)</span>"
                
                html += f"<tr><td>{team}</td><td>{found}</td><td>{status}</td></tr>"
            else:
                html += f"<tr><td>{team}</td><td>---</td><td><span class='mismatch'>❌ NO ENCONTRADO</span></td></tr>"
        
        html += "</table>"

    html += "</body></html>"
    return Response(html, mimetype='text/html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
