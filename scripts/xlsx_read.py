"""Lector XLSX sin openpyxl (zipfile + XML). Reutilizable.

Uso:
    from xlsx_read import leer_hoja, listar_hojas
    filas = leer_hoja(path, "DIM_ESPECIES")   # -> list[dict] con _fila
"""
import zipfile
import xml.etree.ElementTree as ET

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
RNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"


def _col_index(ref):
    """'BC12' -> 54 (0-based)."""
    letras = "".join(c for c in ref if c.isalpha())
    n = 0
    for c in letras:
        n = n * 26 + (ord(c.upper()) - 64)
    return n - 1


def _col_name(idx):
    """0 -> 'A', 26 -> 'AA'."""
    s = ""
    idx += 1
    while idx:
        idx, r = divmod(idx - 1, 26)
        s = chr(65 + r) + s
    return s


class Libro:
    def __init__(self, path):
        self.z = zipfile.ZipFile(path)
        wb = ET.fromstring(self.z.read("xl/workbook.xml"))
        rels = ET.fromstring(self.z.read("xl/_rels/workbook.xml.rels"))
        relmap = {r.get("Id"): r.get("Target") for r in rels}
        self.hojas = {}
        for sh in wb.find("m:sheets", NS):
            nombre = sh.get("name")
            rid = sh.get(RNS + "id")
            t = relmap.get(rid, "")
            if not t.startswith("xl/"):
                t = "xl/" + t.lstrip("/")
            self.hojas[nombre] = t
        self._cache = {}

    def nombres(self):
        return list(self.hojas)

    def _shared(self):
        if "_ss" not in self._cache:
            try:
                root = ET.fromstring(self.z.read("xl/sharedStrings.xml"))
            except KeyError:
                self._cache["_ss"] = []
                return []
            out = []
            for si in root:
                out.append("".join(t.text or "" for t in si.iter(
                    "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")))
            self._cache["_ss"] = out
        return self._cache["_ss"]

    def celdas(self, hoja):
        """-> list[list[str|None]] filas crudas."""
        if hoja in self._cache:
            return self._cache[hoja]
        ss = self._shared()
        sx = ET.fromstring(self.z.read(self.hojas[hoja]))
        filas = []
        formulas = {}
        for row in sx.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row"):
            celdas = {}
            for c in row:
                ref = c.get("r") or ""
                idx = _col_index(ref) if ref else len(celdas)
                t = c.get("t")
                v = c.find("m:v", NS)
                f = c.find("m:f", NS)
                isel = c.find("m:is", NS)
                if isel is not None:
                    val = "".join(x.text or "" for x in isel.iter(
                        "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"))
                elif v is None or v.text is None:
                    val = None
                elif t == "s":
                    val = ss[int(v.text)]
                else:
                    val = v.text
                if f is not None:
                    formulas[ref] = f.text or ""
                celdas[idx] = val
            ancho = (max(celdas) + 1) if celdas else 0
            filas.append([celdas.get(i) for i in range(ancho)])
        self._cache[hoja] = filas
        self._cache["f_" + hoja] = formulas
        return filas

    def formulas(self, hoja):
        """-> dict ref -> texto de formula. La celda guarda el valor en cache."""
        self.celdas(hoja)
        return self._cache.get("f_" + hoja, {})

    def dicts(self, hoja, encabezado=1):
        """-> list[dict]. La fila `encabezado` (1-based) da los nombres de columna."""
        filas = self.celdas(hoja)
        if not filas:
            return []
        idx = encabezado - 1
        while idx < len(filas) and not any((c or "").strip() for c in filas[idx]):
            idx += 1
        cab = [((c or "").strip()) for c in filas[idx]]
        out = []
        for f in filas[idx + 1:]:
            if not any((c or "").strip() for c in f):
                continue
            d = {cab[i]: f[i] if i < len(f) else None for i in range(len(cab)) if cab[i]}
            d["_fila"] = out.__len__() + 2  # fila real del Excel
            out.append(d)
        return out

    def headers(self, hoja):
        filas = self.celdas(hoja)
        for f in filas:
            if any((c or "").strip() for c in f):
                return [((c or "").strip()) for c in f]
        return []