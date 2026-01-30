import ezdxf

# ========= CONFIG (metros) =========
LOT_W_M = 5.0
LOT_L_M = 26.0

SETBACK_LEFT_M = 0.0
SETBACK_RIGHT_M = 0.0
SETBACK_FRONT_M = 0.0
SETBACK_BACK_M = 0.0

WALL_M = 0.15
CORRIDOR_M = 1.00  # circulação lateral
DOOR_W_M = 0.80    # porta padrão (quartos/sala)
DOOR_W_BATH_M = 0.70

# Sequência frente -> fundo (profundidades em m)
modules = [
    ("CARPORT",   5.00),
    ("SALA",      3.20),
    ("COZINHA",   3.00),
    ("WC SOCIAL", 2.20),
    ("QUARTO",    3.00),
    ("SUITE",     3.20),
    ("LAVAND.",   2.00),
]

# ========= SCALE =========
S = 1000.0  # m -> mm

def mm(x_m): return x_m * S

def add_poly(msp, pts, layer):
    msp.add_lwpolyline(pts, close=True, dxfattribs={"layer": layer})

def add_rect(msp, x0, y0, w, h, layer):
    pts = [(x0,y0),(x0+w,y0),(x0+w,y0+h),(x0,y0+h),(x0,y0)]
    add_poly(msp, pts, layer)

def add_text(msp, txt, x, y, h, layer="TEXT"):
    msp.add_text(txt, height=h, dxfattribs={"layer": layer}).set_placement(
        (x, y), align=ezdxf.enums.TextEntityAlignment.MIDDLE_CENTER
    )

def add_door_gap(msp, x1, y1, x2, y2, layer="DOOR"):
    # "vão" da porta: apenas um segmento (depois você pode evoluir para arco)
    msp.add_line((x1, y1), (x2, y2), dxfattribs={"layer": layer})

def main():
    # ---- converter para mm ----
    LOT_W = mm(LOT_W_M); LOT_L = mm(LOT_L_M)
    SL = mm(SETBACK_LEFT_M); SR = mm(SETBACK_RIGHT_M)
    SF = mm(SETBACK_FRONT_M); SB = mm(SETBACK_BACK_M)
    WALL = mm(WALL_M); COR = mm(CORRIDOR_M)
    DW = mm(DOOR_W_M); DWB = mm(DOOR_W_BATH_M)

    build_w = LOT_W - (SL + SR)
    build_l = LOT_L - (SF + SB)
    if build_w <= 0 or build_l <= 0:
        raise ValueError("Recuos inviabilizaram o lote.")

    # comprimento total da casa
    house_len = sum(mm(d) for _, d in modules)
    if house_len > build_l:
        raise ValueError("Ambientes excedem o comprimento edificável.")

    # largura útil dos ambientes (tirando corredor)
    room_w = build_w - COR
    if room_w <= mm(2.6):
        raise ValueError("Corredor grande demais; sobra pouca largura pro ambiente.")

    # ---- DXF ----
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()

    for layer in ["LOT", "BUILDABLE", "WALL", "ROOM", "TEXT", "DOOR"]:
        if layer not in doc.layers:
            doc.layers.new(layer)

    # lote e área edificável
    add_rect(msp, 0, 0, LOT_W, LOT_L, "LOT")
    bx0, by0 = SL, SF
    add_rect(msp, bx0, by0, build_w, build_l, "BUILDABLE")

    # contorno do corpo da casa
    add_rect(msp, bx0, by0, build_w, house_len, "WALL")

    # linha do corredor (parede divisória longitudinal)
    x_cor = bx0 + COR
    msp.add_line((x_cor, by0), (x_cor, by0 + house_len), dxfattribs={"layer": "WALL"})
    msp.add_line((x_cor + WALL, by0), (x_cor + WALL, by0 + house_len), dxfattribs={"layer": "WALL"})

    # ambientes: retângulos do lado direito (room block)
    y = by0
    for name, depth_m in modules:
        d = mm(depth_m)
        # ambiente ocupa área "room"
        add_rect(msp, x_cor + WALL, y, room_w - WALL, d, "ROOM")

        # label
        cx = x_cor + WALL + (room_w - WALL)/2
        cy = y + d/2
        area_m2 = ( (room_w - WALL) * d ) / (S*S)
        add_text(msp, f"{name}\n{area_m2:.2f} m²", cx, cy, h=250)

        # parede transversal dupla no final do módulo
        y2 = y + d
        msp.add_line((bx0, y2), (bx0 + build_w, y2), dxfattribs={"layer": "WALL"})
        msp.add_line((bx0, y2 + WALL), (bx0 + build_w, y2 + WALL), dxfattribs={"layer": "WALL"})

        # porta: abre do corredor para o ambiente (um vão na parede do corredor)
        # posiciona no meio do módulo
        door_center = y + d/2
        door_w = DWB if "WC" in name else DW
        # "vão" na parede do corredor (linha vertical em x_cor)
        add_door_gap(msp, x_cor, door_center - door_w/2, x_cor, door_center + door_w/2)

        y = y2 + WALL  # pula a espessura

    add_text(msp, "PLANTA PARAMÉTRICA 5x26 (V2)", LOT_W/2, -600, h=350)

    out = "planta_5x26_v2.dxf"
    doc.saveas(out)
    print(f"Gerado: {out}")

if __name__ == "__main__":
    main()

