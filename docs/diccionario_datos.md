# Diccionario de datos

Archivo de entrada: `data/raw/exportaciones_anuales.csv`.

| Campo | Tipo | Descripción |
|---|---|---|
| `anio` | entero | Año calendario, 2014--2025. |
| `exportaciones_totales_usd_millones` | decimal | Total de exportaciones FOB. |
| `petroleras_usd_millones` | decimal | Crudo más derivados. |
| `no_petroleras_usd_millones` | decimal | Exportaciones no petroleras. |
| `tradicionales_usd_millones` | decimal/opcional | Subgrupo no petrolero tradicional. |
| `no_tradicionales_usd_millones` | decimal/opcional | Subgrupo no petrolero no tradicional. |
| `fuente` | texto | Referencia o URL específica del BCE. |

Las columnas opcionales pueden quedar vacías, pero las tres categorías principales y el año son obligatorios.

Archivo complementario: `data/raw/exportaciones_no_petroleras_2024_2025.csv`. Contiene los principales productos no petroleros comparables para 2024 y 2025, con su clasificación y participación en el total no petrolero de 2025.
