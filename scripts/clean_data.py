from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/raw/exportaciones_anuales.csv"
OUT = ROOT / "data/processed/exportaciones_anuales_limpias.csv"
REQUIRED = ["anio", "exportaciones_totales_usd_millones", "petroleras_usd_millones", "no_petroleras_usd_millones"]

if not RAW.exists():
    raise FileNotFoundError(f"Falta {RAW}. Consulte docs/diccionario_datos.md.")

df = pd.read_csv(RAW)
missing = set(REQUIRED) - set(df.columns)
if missing:
    raise ValueError(f"Columnas obligatorias ausentes: {sorted(missing)}")
df.columns = df.columns.str.strip().str.lower()
for col in REQUIRED:
    df[col] = pd.to_numeric(df[col], errors="coerce")
df = df.dropna(subset=REQUIRED).drop_duplicates(subset="anio").sort_values("anio")
OUT.parent.mkdir(parents=True, exist_ok=True)
df.to_csv(OUT, index=False)
print(f"Datos limpios: {OUT}")
