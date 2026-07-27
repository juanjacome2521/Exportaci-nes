"""Genera gráficos SVG sin dependencias adicionales."""
from csv import DictReader
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "data/processed/indicadores_exportaciones.csv"
OUT = ROOT / "reports/charts"
W, H, LEFT, RIGHT, TOP, BOTTOM = 960, 520, 90, 40, 55, 75
COLORS = {"Petroleras": "#b45309", "No petroleras": "#047857", "Total": "#1d4ed8"}


def svg_start(title, subtitle):
    return [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
        '<style>text{font-family:Arial,sans-serif;fill:#172033}.title{font-size:22px;font-weight:bold}.sub{font-size:13px;fill:#526174}.axis{font-size:12px;fill:#526174}.legend{font-size:13px}</style>',
        '<rect width="100%" height="100%" fill="white"/>',
        f'<text x="{LEFT}" y="30" class="title">{title}</text>',
        f'<text x="{LEFT}" y="49" class="sub">{subtitle}</text>',
    ]


def point(value, low, high, horizontal=False):
    plot = (W - LEFT - RIGHT) if horizontal else (H - TOP - BOTTOM)
    return (LEFT + (value - low) / (high - low) * plot) if horizontal else (H - BOTTOM - (value - low) / (high - low) * plot)


def axis(parts, years, low, high, unit, percentage=False):
    x0, y0, x1, y1 = LEFT, TOP, W - RIGHT, H - BOTTOM
    parts.extend([f'<line x1="{x0}" y1="{y0}" x2="{x0}" y2="{y1}" stroke="#94a3b8"/>', f'<line x1="{x0}" y1="{y1}" x2="{x1}" y2="{y1}" stroke="#94a3b8"/>'])
    for i in range(6):
        val = low + (high - low) * i / 5
        y = point(val, low, high)
        label = f"{val:.0f}%" if percentage else f"{val:,.0f}"
        parts.extend([f'<line x1="{x0}" y1="{y:.1f}" x2="{x1}" y2="{y:.1f}" stroke="#e2e8f0"/>', f'<text x="{x0 - 12}" y="{y + 4:.1f}" text-anchor="end" class="axis">{label}</text>'])
    step = (x1 - x0) / (len(years) - 1)
    for i, year in enumerate(years):
        x = x0 + step * i
        parts.append(f'<text x="{x:.1f}" y="{y1 + 24}" text-anchor="middle" class="axis">{year}</text>')
    parts.append(f'<text x="{x0}" y="{H - 15}" class="axis">{unit}</text>')


def line_chart(rows):
    years = [int(r["anio"]) for r in rows]
    series = {"Petroleras": [float(r["petroleras_usd_millones"]) for r in rows], "No petroleras": [float(r["no_petroleras_usd_millones"]) for r in rows], "Total": [float(r["exportaciones_totales_usd_millones"]) for r in rows]}
    low, high = 0, 40000
    parts = svg_start("Exportaciones del Ecuador por tipo", "2014–2025 · millones de USD FOB")
    axis(parts, years, low, high, "Millones de USD FOB")
    xstep = (W - LEFT - RIGHT) / (len(years) - 1)
    for n, values in series.items():
        pts = " ".join(f"{LEFT + i*xstep:.1f},{point(v, low, high):.1f}" for i, v in enumerate(values))
        parts.append(f'<polyline points="{pts}" fill="none" stroke="{COLORS[n]}" stroke-width="3"/>')
        for i, v in enumerate(values):
            parts.append(f'<circle cx="{LEFT+i*xstep:.1f}" cy="{point(v, low, high):.1f}" r="3.5" fill="{COLORS[n]}"/>')
    for i, n in enumerate(series):
        x = 600 + i * 110
        parts.append(f'<rect x="{x}" y="68" width="12" height="12" fill="{COLORS[n]}"/><text x="{x+18}" y="79" class="legend">{n}</text>')
    return "\n".join(parts + ["</svg>"])


def share_chart(rows):
    years = [int(r["anio"]) for r in rows]
    petroleum = [float(r["participacion_petrolera_pct"]) for r in rows]
    non_petroleum = [float(r["participacion_no_petrolera_pct"]) for r in rows]
    parts = svg_start("Cambio en la composición exportadora", "Participación en las exportaciones totales · 2014–2025")
    axis(parts, years, 0, 100, "Porcentaje", percentage=True)
    step = (W - LEFT - RIGHT) / (len(years) - 1)
    for values, name in [(petroleum, "Petroleras"), (non_petroleum, "No petroleras")]:
        pts = " ".join(f"{LEFT+i*step:.1f},{point(v,0,100):.1f}" for i, v in enumerate(values))
        parts.append(f'<polyline points="{pts}" fill="none" stroke="{COLORS[name]}" stroke-width="3"/>')
    parts.append('<text x="100" y="92" class="legend" fill="#b45309">Petroleras</text><text x="220" y="92" class="legend" fill="#047857">No petroleras</text>')
    return "\n".join(parts + ["</svg>"])


def growth_chart(rows):
    data = rows[1:]
    years = [int(r["anio"]) for r in data]
    values = [float(r["variacion_no_petrolera_interanual_pct"]) for r in data]
    low, high = -10, 25
    parts = svg_start("Variación anual de exportaciones no petroleras", "2015–2025 · porcentaje frente al año anterior")
    axis(parts, years, low, high, "Variación interanual", percentage=True)
    width = (W - LEFT - RIGHT) / len(years) * 0.62
    step = (W - LEFT - RIGHT) / (len(years) - 1)
    zero = point(0, low, high)
    for i, value in enumerate(values):
        x = LEFT + i * step - width / 2
        y = point(value, low, high)
        fill = "#047857" if value >= 0 else "#b91c1c"
        parts.append(f'<rect x="{x:.1f}" y="{min(y, zero):.1f}" width="{width:.1f}" height="{abs(zero-y):.1f}" fill="{fill}"/>')
        parts.append(f'<text x="{x+width/2:.1f}" y="{y-7 if value>=0 else y+17:.1f}" text-anchor="middle" class="axis">{value:.1f}%</text>')
    return "\n".join(parts + ["</svg>"])


rows = list(DictReader(INPUT.open(encoding="utf-8")))
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "01_tendencia_exportaciones.svg").write_text(line_chart(rows), encoding="utf-8")
(OUT / "02_participacion_exportaciones.svg").write_text(share_chart(rows), encoding="utf-8")
(OUT / "03_variacion_no_petroleras.svg").write_text(growth_chart(rows), encoding="utf-8")
print(f"Gráficos creados en {OUT}")
