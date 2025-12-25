import requests
import csv
import io
import json
import os

# Archivo final que leerá tu App
OUTPUT_FILE = "data/elo_mundial.json"

# --- 1. BLOQUE LATAM & USA (ClubElo no tiene esto, lo inyectamos nosotros) ---
# Estos valores son estimados conservadores para que el sistema tenga base.
LATAM_DATABASE = {
    # BRASIL
    "Palmeiras": 1820, "Flamengo": 1810, "Atletico Mineiro": 1760, "Botafogo": 1780,
    "Sao Paulo": 1730, "Internacional": 1720, "Gremio": 1710, "Fluminense": 1700,
    "Corinthians": 1690, "Cruzeiro": 1680, "Fortaleza": 1670, "Bahia": 1650,
    # ARGENTINA
    "River Plate": 1750, "Boca Juniors": 1720, "Racing Club": 1690, "Estudiantes": 1670,
    "Talleres": 1660, "Independiente": 1650, "San Lorenzo": 1640, "Velez Sarsfield": 1680,
    # COLOMBIA
    "Atletico Nacional": 1600, "Millonarios": 1590, "Junior": 1580, "Independiente Medellin": 1570,
    "America de Cali": 1560, "Santa Fe": 1560, "Deportes Tolima": 1570,
    # MEXICO & USA
    "Club America": 1700, "Monterrey": 1690, "Tigres UANL": 1690, "Cruz Azul": 1680,
    "Pachuca": 1660, "Toluca": 1650, "Chivas": 1640,
    "Inter Miami": 1650, "Los Angeles FC": 1640, "Columbus Crew": 1630, "LA Galaxy": 1610
}

def update_elo():
    print("🌍 Iniciando actualización semanal de ELO...")
    full_database = {}

    # --- 2. DESCARGAR EUROPA (ClubElo API - Oficial) ---
    try:
        print("📥 Descargando datos de Europa...")
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get("http://api.clubelo.com/All", headers=headers, timeout=20)
        content = r.content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        
        count_eu = 0
        for row in reader:
            # Guardamos: {"Real Madrid": 2045}
            full_database[row['Club']] = float(row['Elo'])
            count_eu += 1
        print(f"✅ Europa cargada: {count_eu} equipos.")
        
    except Exception as e:
        print(f"❌ Error descargando Europa: {e}")
        # Si falla, no rompemos todo, seguimos con LatAm

    # --- 3. FUSIONAR CON LATAM ---
    print("📥 Inyectando datos de América...")
    full_database.update(LATAM_DATABASE)
    
    # --- 4. GUARDAR JSON MAESTRO ---
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(full_database, f, indent=4)
        
    print(f"🎉 ACTUALIZACIÓN COMPLETADA. Total equipos: {len(full_database)}")

if __name__ == "__main__":
    update_elo()
