import requests
import csv
import io
import json

def obtener_nombres_oficiales():
    print("📥 Descargando base de datos maestra de ClubElo...")
    
    url = "http://api.clubelo.com/All"
    
    try:
        # 1. Descargar el CSV
        response = requests.get(url)
        response.raise_for_status() # Lanza error si falla la descarga
        
        # 2. Leer el CSV
        content = response.content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        
        equipos = []
        
        # 3. Extraer solo los nombres y el ELO actual
        for row in reader:
            # Filtramos solo equipos activos (Level 1 son primeras divisiones)
            # Puedes quitar el 'if' si quieres todos los equipos de 2da también
            if int(row['Level']) <= 2: 
                equipos.append({
                    "nombre_oficial": row['Club'],
                    "pais": row['Country'],
                    "elo": float(row['Elo'])
                })
        
        # 4. Guardar en un archivo JSON para que tú lo veas
        with open("nombres_clubelo.json", "w") as f:
            json.dump(equipos, f, indent=4)
            
        print(f"✅ ¡Listo! Se han guardado {len(equipos)} equipos en 'nombres_clubelo.json'.")
        print("Ahora puedes abrir ese archivo y ver EXACTAMENTE cómo se escriben.")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    obtener_nombres_oficiales()
