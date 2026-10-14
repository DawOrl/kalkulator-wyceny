"""
Makieta "placu budowy" dla kalkulatora wyceny Pracowni Kreska.

Każda odpowiedź w kalkulatorze dokłada element makiety: budynek główny
(typ strony), skrzydła (podstrony), falującą ścianę (projekt indywidualny),
tablicę z tekstem (copywriting), sześć dodatków i żuraw (tryb ekspres).

Scena jest budowana proceduralnie (bez zewnętrznych modeli) i renderowana
warstwami: każdy element osobno, z tej samej kamery ortograficznej,
z przezroczystym tłem i cieniem rzucanym na matę (shadow catcher).
Warstwy nakładane w UI w stałej kolejności (od tyłu do przodu) składają
się w jedną spójną makietę. Krawędzie rysuje Freestyle tuszem, więc
render wygląda jak aksonometria z rysunku technicznego.

Uruchomienie (z katalogu repo):
  blender --background --factory-startup --python-exit-code 1 \
    --python scripts/blender/makieta.py -- \
    --out public/makieta --json src/data/makieta.json --tmp /ścieżka/tmp

Opcje:
  --scale 0.5     rozdzielczość podglądu (procent szerokości 1800 px)
  --samples 64    próbki Cycles
  --preview       jeden render całej przykładowej makiety (do oceny sceny)
  --only a,b      renderuj tylko wybrane warstwy
"""

import json
import math
import os
import subprocess
import sys

import bmesh
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Vector

# ------------------------------------------------------------------ args

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def arg(name, default=None):
    if name in argv:
        i = argv.index(name)
        if i + 1 < len(argv) and not argv[i + 1].startswith("--"):
            return argv[i + 1]
        return True
    return default


OUT_DIR = os.path.abspath(arg("--out", "public/makieta"))
JSON_PATH = os.path.abspath(arg("--json", "src/data/makieta.json"))
TMP_DIR = os.path.abspath(arg("--tmp", "/tmp/makieta"))
SCALE = float(arg("--scale", "1"))
SAMPLES = int(arg("--samples", "64"))
PREVIEW = bool(arg("--preview", False))
ONLY = [s for s in str(arg("--only", "")).split(",") if s]

BASE_WIDTH = 1800

# ------------------------------------------------------------------ paleta


def srgb(hex_color, alpha=1.0):
    h = hex_color.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i : i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, alpha)


PAPER_WHITE = "#f3efe6"  # biała tektura makietowa
ORANGE = "#e4571b"  # akcent marki
INK = "#1e2936"  # granatowy tusz
GLASS = "#7f8c9b"  # przeszklenia: rozbielony tusz
MAT = "#1c2733"  # mata do cięcia
MAT_LINE = "#34465a"
MAT_LINE_MAJOR = "#4d6177"

# ------------------------------------------------------------------ scena


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type == "METAL"
    scene.cycles.device = "GPU"
    scene.cycles.samples = SAMPLES
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    scene.cycles.max_bounces = 6
    scene.render.film_transparent = True
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0.0
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    return scene


scene = reset_scene()

# ------------------------------------------------------------------ materiały


def principled(name, hex_color, rough=0.65, spec=0.25):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except AttributeError:
        pass
    nt = m.node_tree
    bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf is None:
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        out = next((n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"), None) or nt.nodes.new(
            "ShaderNodeOutputMaterial"
        )
        nt.links.new(bsdf.outputs[0], out.inputs[0])
    bsdf.inputs["Base Color"].default_value = srgb(hex_color)
    bsdf.inputs["Roughness"].default_value = rough
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = spec
    m.diffuse_color = srgb(hex_color)
    return m


M_CARD = principled("tektura", PAPER_WHITE, rough=0.8, spec=0.15)
M_ORANGE = principled("pomarancz", ORANGE, rough=0.6, spec=0.2)
M_INK = principled("tusz", INK, rough=0.55)
M_GLASS = principled("szklo", GLASS, rough=0.25, spec=0.5)


def mat_material():
    """Mata do cięcia: granat z siatką co 1 cm i mocniejszą linią co 5 cm."""
    m = principled("mata", MAT, rough=0.85, spec=0.1)
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs[0])

    def line(axis_out, period, width):
        div = nt.nodes.new("ShaderNodeMath")
        div.operation = "DIVIDE"
        nt.links.new(axis_out, div.inputs[0])
        div.inputs[1].default_value = period
        add = nt.nodes.new("ShaderNodeMath")
        add.operation = "ADD"
        nt.links.new(div.outputs[0], add.inputs[0])
        add.inputs[1].default_value = width / 2
        fr = nt.nodes.new("ShaderNodeMath")
        fr.operation = "FRACT"
        nt.links.new(add.outputs[0], fr.inputs[0])
        lt = nt.nodes.new("ShaderNodeMath")
        lt.operation = "LESS_THAN"
        nt.links.new(fr.outputs[0], lt.inputs[0])
        lt.inputs[1].default_value = width
        return lt.outputs[0]

    def maximum(a, b):
        mx = nt.nodes.new("ShaderNodeMath")
        mx.operation = "MAXIMUM"
        nt.links.new(a, mx.inputs[0])
        nt.links.new(b, mx.inputs[1])
        return mx.outputs[0]

    minor = maximum(line(sep.outputs[0], 1.0, 0.035), line(sep.outputs[1], 1.0, 0.035))
    major = maximum(line(sep.outputs[0], 5.0, 0.012), line(sep.outputs[1], 5.0, 0.012))
    half = nt.nodes.new("ShaderNodeMath")
    half.operation = "MULTIPLY"
    nt.links.new(minor, half.inputs[0])
    half.inputs[1].default_value = 0.5
    fac = maximum(half.outputs[0], major)

    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    els = ramp.color_ramp.elements
    els[0].position = 0.0
    els[0].color = srgb(MAT)
    els[1].position = 0.4
    els[1].color = srgb(MAT_LINE)
    e = els.new(0.9)
    e.color = srgb(MAT_LINE_MAJOR)
    nt.links.new(fac, ramp.inputs[0])
    nt.links.new(ramp.outputs[0], bsdf.inputs["Base Color"])
    return m


M_MAT = mat_material()

# ------------------------------------------------------------------ kolekcje

LAYERS = {}  # nazwa -> kolekcja
ANCHORS = {}  # nazwa -> Vector (punkt odnośnika w świecie)


def layer(name):
    coll = bpy.data.collections.new(name)
    scene.collection.children.link(coll)
    LAYERS[name] = coll
    return coll


def link(obj, coll):
    coll.objects.link(obj)
    return obj


# ------------------------------------------------------------------ bryły


def mesh_obj(name, bm, coll, mat, loc=(0, 0, 0), rot_z=0.0):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    obj.data.materials.append(mat)
    obj.location = loc
    obj.rotation_euler = (0, 0, rot_z)
    return link(obj, coll)


def box(coll, name, size, pos, mat=None, rot_z=0.0):
    """Prostopadłościan; pos = środek podstawy (x, y, z_dołu)."""
    sx, sy, sz = size
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=bm.verts)
    bmesh.ops.translate(bm, vec=(0, 0, sz / 2), verts=bm.verts)
    return mesh_obj(name, bm, coll, mat or M_CARD, loc=pos, rot_z=rot_z)


def cylinder(coll, name, r, h, pos, mat=None, segments=48):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False, segments=segments, radius1=r, radius2=r, depth=h
    )
    bmesh.ops.translate(bm, vec=(0, 0, h / 2), verts=bm.verts)
    return mesh_obj(name, bm, coll, mat or M_CARD, loc=pos)


def strut(coll, name, p1, p2, t, mat):
    """Cienki pręt kratownicy między dwoma punktami."""
    p1, p2 = Vector(p1), Vector(p2)
    d = p2 - p1
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(t, t, d.length), verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    obj.data.materials.append(mat)
    obj.matrix_world = Matrix.Translation((p1 + p2) / 2) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4()
    return link(obj, coll)


def ribbon(coll, name, inner, outer, thickness, mat):
    """Wstęga między dwiema krzywymi 3D, pogrubiona modyfikatorem Solidify."""
    bm = bmesh.new()
    vi = [bm.verts.new(p) for p in inner]
    vo = [bm.verts.new(p) for p in outer]
    for i in range(len(inner) - 1):
        bm.faces.new((vi[i], vo[i], vo[i + 1], vi[i + 1]))
    obj = mesh_obj(name, bm, coll, mat)
    mod = obj.modifiers.new("grubosc", "SOLIDIFY")
    mod.thickness = thickness
    mod.offset = 0
    return obj


def tube(coll, name, points, r, mat):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 4
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for p, co in zip(sp.points, points):
        p.co = (*co, 1.0)
    obj = bpy.data.objects.new(name, cu)
    obj.data.materials.append(mat)
    return link(obj, coll)


def glass_band_front(coll, name, x0, x1, y_face, z0, z1):
    """Przeszklenie na ścianie frontowej (normalna -y)."""
    return box(coll, name, (x1 - x0, 0.03, z1 - z0), ((x0 + x1) / 2, y_face - 0.015, z0), M_GLASS)


def glass_band_side(coll, name, y0, y1, x_face, z0, z1):
    """Przeszklenie na ścianie bocznej (normalna +x)."""
    return box(coll, name, (0.03, y1 - y0, z1 - z0), (x_face + 0.015, (y0 + y1) / 2, z0), M_GLASS)


# ------------------------------------------------------------------ plan
#
# Mata 18 x 12, środek w (0, 0). Kamera patrzy od przodu z prawej (+x, -y).
# Budynek główny ma zawsze prawy-przedni narożnik w (2.3, -0.1), więc rura
# integracji i ściana projektu pasują do każdego wariantu.

RIGHT_X = 2.3
FRONT_Y = -0.1

# --- podstawa: mata + podłoże na cień maty
base = layer("base")
mat_obj = box(base, "mata", (18.0, 12.0, 0.22), (0, 0, -0.22), M_MAT)
ground = box(base, "podloze", (60, 60, 0.01), (0, 0, -0.24), M_CARD)
ground.is_shadow_catcher = True
# w warstwach elementów mata jest ukryta, a cień łapie płaszczyzna jej blatu
# (bez bocznych ścianek, które dawały jasne smugi na krawędzi)
bm_plane = bmesh.new()
bmesh.ops.create_grid(bm_plane, x_segments=1, y_segments=1, size=0.5)
bmesh.ops.scale(bm_plane, vec=(18.0, 12.0, 1.0), verts=bm_plane.verts)
catcher = mesh_obj("blat", bm_plane, base, M_MAT, loc=(0, 0, 0.0))
catcher.is_shadow_catcher = True

# --- typ strony: pięć wariantów budynku głównego


def core_wizytowka():
    c = layer("type-wizytowka")
    w, d, h = 3.8, 2.8, 1.25
    x0 = RIGHT_X - w
    box(c, "pawilon", (w, d, h), (x0 + w / 2, FRONT_Y + d / 2, 0))
    box(c, "dach", (w + 0.5, d + 0.5, 0.12), (x0 + w / 2, FRONT_Y + d / 2, h))
    glass_band_front(c, "witryna", x0 + 0.35, RIGHT_X - 0.35, FRONT_Y, 0.15, h - 0.2)
    glass_band_side(c, "okno", FRONT_Y + 0.5, FRONT_Y + d - 0.5, RIGHT_X, 0.45, h - 0.3)
    ANCHORS[c.name] = Vector((x0 + w / 2, FRONT_Y + d / 2, h + 0.12))


def core_landing():
    c = layer("type-landing")
    w, d, h = 2.4, 2.4, 5.4
    x0 = RIGHT_X - w
    box(c, "wieza", (w, d, h), (x0 + w / 2, FRONT_Y + d / 2, 0))
    for i in range(8):
        z = 0.35 + i * 0.62
        glass_band_front(c, f"pas-f{i}", x0 + 0.25, RIGHT_X - 0.25, FRONT_Y, z, z + 0.3)
        glass_band_side(c, f"pas-b{i}", FRONT_Y + 0.25, FRONT_Y + d - 0.25, RIGHT_X, z, z + 0.3)
    box(c, "nadbudowka", (1.0, 1.0, 0.45), (x0 + w / 2 - 0.3, FRONT_Y + d / 2 + 0.3, h))
    ANCHORS[c.name] = Vector((x0 + w / 2, FRONT_Y + d / 2, h + 0.45))


def core_firmowa():
    c = layer("type-firmowa")
    w, d, h = 4.6, 3.0, 2.2
    x0 = RIGHT_X - w
    box(c, "korpus", (w, d, h), (x0 + w / 2, FRONT_Y + d / 2, 0))
    for i, z in enumerate((0.3, 1.25)):
        glass_band_front(c, f"pas-f{i}", x0 + 0.3, RIGHT_X - 0.3, FRONT_Y, z, z + 0.5)
        glass_band_side(c, f"pas-b{i}", FRONT_Y + 0.3, FRONT_Y + d - 0.3, RIGHT_X, z, z + 0.5)
    uw, ud, uh = 3.0, 2.0, 1.3
    box(c, "pietro", (uw, ud, uh), (RIGHT_X - 0.35 - uw / 2, FRONT_Y + d - 0.3 - ud / 2, h))
    y_front_upper = FRONT_Y + d - 0.3 - ud
    glass_band_front(c, "pas-g", RIGHT_X - 0.35 - uw + 0.3, RIGHT_X - 0.65, y_front_upper, h + 0.35, h + 0.95)
    glass_band_side(c, "pas-gb", y_front_upper + 0.3, FRONT_Y + d - 0.6, RIGHT_X - 0.35, h + 0.35, h + 0.95)
    ANCHORS[c.name] = Vector((RIGHT_X - 0.35 - uw / 2, FRONT_Y + d - 0.3 - ud / 2, h + uh))


def core_sklep():
    c = layer("type-sklep")
    w, d, h = 4.4, 3.0, 1.9
    x0 = RIGHT_X - w
    box(c, "sklep", (w, d, h), (x0 + w / 2, FRONT_Y + d / 2, 0))
    glass_band_front(c, "witryna", x0 + 0.4, RIGHT_X - 0.4, FRONT_Y, 0.15, 1.15)
    glass_band_side(c, "okno", FRONT_Y + 0.4, FRONT_Y + d - 0.4, RIGHT_X, 0.4, 1.15)
    # markiza w pasy: biały / pomarańczowy, pochylona do przodu
    n = 8
    sw = (w - 0.5) / n
    for i in range(n):
        x = x0 + 0.25 + sw * (i + 0.5)
        s = box(c, f"markiza{i}", (sw, 0.85, 0.05), (0, 0, 0), M_ORANGE if i % 2 == 0 else M_CARD)
        s.matrix_world = (
            Matrix.Translation((x, FRONT_Y - 0.38, 1.38))
            @ Matrix.Rotation(math.radians(-24), 4, "X")
            @ Matrix.Translation((0, 0, -0.025))
        )
    box(c, "szyld", (w - 0.8, 0.06, 0.32), (x0 + w / 2, FRONT_Y - 0.03, 1.5))
    ANCHORS[c.name] = Vector((x0 + w / 2, FRONT_Y + d / 2, h))


def core_webapp():
    c = layer("type-webapp")
    w, d, h = 4.4, 3.2, 1.6
    x0 = RIGHT_X - w
    box(c, "baza", (w, d, h), (x0 + w / 2, FRONT_Y + d / 2, 0))
    glass_band_front(c, "pas", x0 + 0.3, RIGHT_X - 0.3, FRONT_Y, 0.35, 1.05)
    glass_band_side(c, "pas-b", FRONT_Y + 0.3, FRONT_Y + d - 0.3, RIGHT_X, 0.35, 1.05)
    # dach jak panel aplikacji: siatka modułów
    for ix in range(4):
        for iy in range(3):
            px = x0 + 0.65 + ix * 0.85
            py = FRONT_Y + 0.55 + iy * 0.7
            if ix == 0 and iy == 2:
                continue
            box(c, f"modul{ix}{iy}", (0.7, 0.52, 0.14), (px, py, h), M_GLASS if (ix + iy) % 3 else M_CARD)
    box(c, "wiezyczka", (1.0, 0.9, 1.1), (x0 + 0.65, FRONT_Y + 0.55 + 2 * 0.7, h))
    glass_band_front(c, "okno-w", x0 + 0.3, x0 + 1.0, FRONT_Y + 0.55 + 2 * 0.7 - 0.45, h + 0.45, h + 0.8)
    ANCHORS[c.name] = Vector((x0 + w / 2, FRONT_Y + d / 2, h + 0.14))


for build in (core_wizytowka, core_landing, core_firmowa, core_sklep, core_webapp):
    build()

# --- podstrony: osiedle skrzydeł po lewej stronie
WINGS = [
    (-4.2, 0.6, 1.4),
    (-4.2, 2.5, 1.9),
    (-6.1, 0.6, 1.1),
    (-6.1, 2.5, 1.6),
    (-4.2, 4.4, 1.2),
    (-6.1, 4.4, 2.2),
    (-8.0, 0.6, 1.5),
    (-8.0, 2.5, 1.0),
    (-8.0, 4.4, 1.8),
]


def wings(name, count):
    c = layer(name)
    top = None
    for i, (x, y, h) in enumerate(WINGS[:count]):
        box(c, f"skrzydlo{i}", (1.5, 1.5, h), (x, y, 0))
        glass_band_front(c, f"drzwi{i}", x - 0.45, x - 0.05, y - 0.75, 0.0, 0.7)
        glass_band_side(c, f"okno{i}", y - 0.4, y + 0.4, x + 0.75, h - 0.65, h - 0.3)
        if top is None or h > top.z:
            top = Vector((x, y, h))
    ANCHORS[name] = top


wings("pages-p2_5", 3)
wings("pages-p6_10", 6)
wings("pages-p10plus", 9)

# --- projekt indywidualny: pomarańczowe lamele ułożone w falę przed wejściem
design = layer("design")
N = 22
for i in range(N):
    t = i / (N - 1)
    x = -2.0 + 4.0 * t
    y = -1.55 + 0.38 * math.sin(t * math.tau)
    slope = 0.38 * math.tau / 4.0 * math.cos(t * math.tau)
    hgt = 0.5 + 0.85 * math.sin(math.pi * t) ** 1.4
    box(design, f"lamela{i}", (0.07, 0.42, hgt), (x, y, 0), M_ORANGE, rot_z=math.atan2(slope, 1.0))
ANCHORS["design"] = Vector((0.0, -1.55, 1.35))

# --- copywriting: tablica z tekstem
content = layer("content")
bx, by, rot = -5.0, -3.3, math.radians(22)
R = Matrix.Rotation(rot, 4, "Z")


def place(obj, local):
    obj.matrix_world = Matrix.Translation((bx, by, 0)) @ R @ Matrix.Translation(local)


for side in (-1, 1):
    place(box(content, f"slupek{side}", (0.12, 0.12, 1.0), (0, 0, 0)), (side * 1.0, 0.0, 0))
place(box(content, "tablica", (2.7, 0.12, 1.5), (0, 0, 0)), (0, 0, 0.95))
for i, ln in enumerate((1.7, 2.2, 1.9, 2.1, 1.3, 1.8)):
    hgt = 0.16 if i == 0 else 0.07
    z = 2.2 - i * 0.2 - (0.05 if i else 0)
    mat = M_INK if i else M_ORANGE
    place(box(content, f"wiersz{i}", (ln, 0.02, hgt), (0, 0, 0), mat), (-1.15 + ln / 2, -0.07, z))
ANCHORS["content"] = Vector((bx, by, 2.45))

# --- dodatki: prawa strona maty

# blog: kiosk z gazetami
blog = layer("extra-blog")
kx, ky = 4.6, 3.9
box(blog, "kiosk", (1.4, 1.0, 1.05), (kx, ky, 0))
box(blog, "daszek", (1.75, 1.35, 0.1), (kx, ky, 1.05))
glass_band_front(blog, "okienko", kx - 0.5, kx + 0.5, ky - 0.5, 0.45, 0.85)
for i in range(7):
    s = box(blog, f"gazeta{i}", (0.62, 0.46, 0.045), (kx + 1.25, ky - 0.35, i * 0.05), rot_z=math.radians((i * 37) % 21 - 10))
box(blog, "lada", (0.5, 0.16, 0.06), (kx, ky - 0.6, 0.4))
ANCHORS["extra-blog"] = Vector((kx, ky, 1.15))

# wersje językowe: dwa maszty z flagami
langs = layer("extra-jezyki")
box(langs, "cokol", (1.5, 0.6, 0.12), (6.6, 4.0, 0))


def flag(coll, name, px, py, pole_h, mat):
    cylinder(coll, f"maszt-{name}", 0.035, pole_h, (px, py, 0.12), M_CARD, segments=16)
    bm = bmesh.new()
    cols, rows = 14, 3
    fw, fh = 0.95, 0.58
    vs = []
    for j in range(rows + 1):
        row = []
        for i in range(cols + 1):
            u = i / cols
            x = u * fw
            y = 0.07 * math.sin(u * math.tau * 1.1) * u
            z = pole_h + 0.12 - 0.02 - (j / rows) * fh
            row.append(bm.verts.new((px + 0.03 + x, py + y, z)))
        vs.append(row)
    for j in range(rows):
        for i in range(cols):
            bm.faces.new((vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]))
    obj = mesh_obj(f"flaga-{name}", bm, coll, mat)
    sol = obj.modifiers.new("grubosc", "SOLIDIFY")
    sol.thickness = 0.02


flag(langs, "a", 6.05, 4.0, 2.35, M_CARD)
flag(langs, "b", 6.95, 4.05, 2.0, M_GLASS)
ANCHORS["extra-jezyki"] = Vector((6.5, 4.0, 2.47))

# rezerwacje: kalendarz z zajętym terminem
cal = layer("extra-rezerwacje")
cx, cy = 4.8, 1.4
box(cal, "kalendarz", (1.45, 1.45, 0.34), (cx, cy, 0))
box(cal, "grzbiet", (1.45, 0.22, 0.2), (cx, cy + 0.6, 0.34))
for ix in range(4):
    for iy in range(3):
        mat = M_ORANGE if (ix, iy) == (2, 1) else M_CARD
        box(cal, f"dzien{ix}{iy}", (0.24, 0.24, 0.07), (cx - 0.48 + ix * 0.32, cy - 0.5 + iy * 0.32, 0.34), mat)
ANCHORS["extra-rezerwacje"] = Vector((cx, cy, 0.55))

# płatności: stosy monet
pay = layer("extra-platnosci")
for si, (px, py, n) in enumerate(((7.0, 1.7, 5), (7.8, 1.95, 8), (7.3, 2.6, 3))):
    for k in range(n):
        top = si == 1 and k == n - 1
        cylinder(pay, f"moneta{si}-{k}", 0.34, 0.085, (px, py, k * 0.092), M_ORANGE if top else M_CARD)
ANCHORS["extra-platnosci"] = Vector((7.8, 1.95, 8 * 0.092))

# integracje: zewnętrzny system połączony rurą z budynkiem
integ = layer("extra-integracje")
ix_, iy_ = 7.4, -2.6
box(integ, "system", (1.1, 1.1, 1.3), (ix_, iy_, 0))
for k in range(3):
    glass_band_front(integ, f"port{k}", ix_ - 0.35, ix_ + 0.35, iy_ - 0.55, 0.3 + k * 0.32, 0.48 + k * 0.32)
pipe_z = 0.38
path = [(ix_, iy_ + 0.55, pipe_z), (ix_, 0.4, pipe_z), (RIGHT_X, 0.4, pipe_z)]
tube(integ, "rura", path, 0.075, M_CARD)
for k, (px, py) in enumerate(((ix_, -1.2), (ix_, 0.4), (5.6, 0.4), (3.8, 0.4))):
    cylinder(integ, f"podpora{k}", 0.035, pipe_z, (px, py, 0), M_CARD, segments=12)
box(integ, "kolnierz", (0.06, 0.3, 0.3), (RIGHT_X + 0.03, 0.4, pipe_z - 0.15))
ANCHORS["extra-integracje"] = Vector((ix_, iy_, 1.3))

# animacje premium: spiralna rzeźba
anim = layer("extra-animacje")
ax, ay = 4.6, -2.6
cylinder(anim, "cokol", 0.75, 0.14, (ax, ay, 0))
cylinder(anim, "os", 0.05, 2.3, (ax, ay, 0.14), segments=16)
inner, outer = [], []
steps = 120
for i in range(steps + 1):
    t = i / steps
    a = t * math.tau * 1.75
    z = 0.3 + t * 1.85
    inner.append((ax + 0.1 * math.cos(a), ay + 0.1 * math.sin(a), z))
    outer.append((ax + 0.62 * math.cos(a), ay + 0.62 * math.sin(a), z))
ribbon(anim, "spirala", inner, outer, 0.05, M_CARD)
ANCHORS["extra-animacje"] = Vector((ax, ay, 2.44))

# tryb ekspres: żuraw wieżowy z ładunkiem
crane = layer("express")
mx, my = 8.3, 5.2
H = 6.6
half = 0.24
corners = [(-half, -half), (half, -half), (half, half), (-half, half)]
box(crane, "fundament", (0.9, 0.9, 0.18), (mx, my, 0), M_CARD)
seg = 0.55
nseg = int((H - 0.18) / seg)
for (cx_, cy_) in corners:
    strut(crane, f"slup{cx_}{cy_}", (mx + cx_, my + cy_, 0.18), (mx + cx_, my + cy_, H), 0.05, M_ORANGE)
for k in range(nseg):
    z0 = 0.18 + k * seg
    z1 = z0 + seg
    for i in range(4):
        a = corners[i]
        b = corners[(i + 1) % 4]
        strut(crane, f"rygiel{k}-{i}", (mx + a[0], my + a[1], z1), (mx + b[0], my + b[1], z1), 0.03, M_ORANGE)
        p, q = (a, b) if k % 2 == 0 else (b, a)
        strut(crane, f"krzyz{k}-{i}", (mx + p[0], my + p[1], z0), (mx + q[0], my + q[1], z1), 0.025, M_ORANGE)

dirv = Vector((0.0 - mx, 1.5 - my)).normalized()
perp = Vector((-dirv.y, dirv.x))
L, CL = 6.6, 2.1
top_z = H + 0.42
box(crane, "kabina", (0.55, 0.55, 0.42), (mx + dirv.x * 0.1, my + dirv.y * 0.1, H - 0.42), M_CARD)


def jib(length, sign, name):
    pts = []
    n = int(length / 0.55)
    for i in range(n + 1):
        s = sign * length * i / n
        base_pt = Vector((mx + dirv.x * s, my + dirv.y * s))
        l = base_pt + perp * 0.17
        r = base_pt - perp * 0.17
        pts.append(((l.x, l.y, H), (r.x, r.y, H), (base_pt.x, base_pt.y, top_z)))
    for i in range(n):
        a, b = pts[i], pts[i + 1]
        for k in range(3):
            strut(crane, f"{name}-pas{i}-{k}", a[k], b[k], 0.035, M_ORANGE)
        strut(crane, f"{name}-d1-{i}", a[0], b[2], 0.022, M_ORANGE)
        strut(crane, f"{name}-d2-{i}", a[1], b[2], 0.022, M_ORANGE)
        strut(crane, f"{name}-p{i}", b[0], b[1], 0.022, M_ORANGE)
    return pts[-1][2]


tip = jib(L, 1, "wysiegnik")
back = jib(CL, -1, "przeciwwysiegnik")
apex = (mx, my, H + 1.25)
for (cx_, cy_) in corners:
    strut(crane, f"wierzcholek{cx_}{cy_}", (mx + cx_ * 0.5, my + cy_ * 0.5, H), apex, 0.035, M_ORANGE)
strut(crane, "ciegno-p", apex, tip, 0.015, M_INK)
strut(crane, "ciegno-t", apex, back, 0.015, M_INK)
cw = Vector((mx - dirv.x * (CL - 0.4), my - dirv.y * (CL - 0.4)))
box(crane, "przeciwwaga", (0.55, 0.55, 0.45), (cw.x, cw.y, H - 0.45), M_INK, rot_z=math.atan2(dirv.y, dirv.x))
hk = Vector((mx + dirv.x * 4.6, my + dirv.y * 4.6))
load_top = 3.55
strut(crane, "lina", (hk.x, hk.y, H), (hk.x, hk.y, load_top + 0.25), 0.014, M_INK)
box(crane, "hak", (0.14, 0.14, 0.2), (hk.x, hk.y, load_top + 0.05), M_INK)
for side in (-1, 1):
    strut(crane, f"zawiesie{side}", (hk.x, hk.y, load_top + 0.05), (hk.x + side * 0.28, hk.y, load_top - 0.05), 0.01, M_INK)
box(crane, "ladunek", (0.62, 0.62, 0.55), (hk.x, hk.y, load_top - 0.6), M_CARD, rot_z=math.radians(12))
ANCHORS["express"] = Vector((mx, my, H + 1.25))

# kolejność nakładania: od tyłu do przodu (malarska), żuraw zawsze na wierzchu
ORDER = [
    "base",
    "pages-p2_5",
    "pages-p6_10",
    "pages-p10plus",
    "type-wizytowka",
    "type-landing",
    "type-firmowa",
    "type-sklep",
    "type-webapp",
    "extra-blog",
    "extra-jezyki",
    "extra-rezerwacje",
    "extra-platnosci",
    "extra-integracje",
    "design",
    "extra-animacje",
    "content",
    "express",
]
assert set(ORDER) == set(LAYERS), set(LAYERS) ^ set(ORDER)

# ------------------------------------------------------------------ światło

world = bpy.data.worlds.new("swiat")
scene.world = world
try:
    world.use_nodes = True
except AttributeError:
    pass
bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs["Color"].default_value = srgb("#eef0f4")
bg.inputs["Strength"].default_value = 0.78

sun_data = bpy.data.lights.new("slonce", "SUN")
sun_data.energy = 1.7
sun_data.angle = math.radians(5)
sun = bpy.data.objects.new("slonce", sun_data)
scene.collection.objects.link(sun)
light_dir = Vector((0.8, 0.9, -1.2)).normalized()  # kierunek padania światła
sun.rotation_euler = light_dir.to_track_quat("-Z", "Y").to_euler()

# ------------------------------------------------------------------ kamera

cam_data = bpy.data.cameras.new("kamera")
cam_data.type = "ORTHO"
cam = bpy.data.objects.new("kamera", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
ROT_X, ROT_Z = math.radians(57), math.radians(40)
cam.rotation_euler = (ROT_X, 0, ROT_Z)
view = cam.rotation_euler.to_matrix() @ Vector((0, 0, -1))
cam.location = Vector((0, 0, 1.5)) - view * 60
cam_data.clip_end = 200
bpy.context.view_layer.update()

# kadr: obrys wszystkich warstw w przestrzeni kamery + margines
inv = cam.matrix_world.inverted()
xs, ys = [], []
deps = bpy.context.evaluated_depsgraph_get()
for name, coll in LAYERS.items():
    for obj in coll.objects:
        if obj.name == "podloze":
            continue
        ev = obj.evaluated_get(deps)
        for corner in ev.bound_box:
            p = inv @ (obj.matrix_world @ Vector(corner))
            xs.append(p.x)
            ys.append(p.y)
margin = 0.035
x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
w, h = x1 - x0, y1 - y0
w, h = w * (1 + 2 * margin), h * (1 + 2 * margin)
cam_data.ortho_scale = max(w, h)
cam_data.shift_x = ((x0 + x1) / 2) / cam_data.ortho_scale
cam_data.shift_y = ((y0 + y1) / 2) / cam_data.ortho_scale
res_x = BASE_WIDTH
res_y = int(round(BASE_WIDTH * h / w / 2)) * 2
scene.render.resolution_x = res_x
scene.render.resolution_y = res_y
scene.render.resolution_percentage = int(SCALE * 100)
bpy.context.view_layer.update()

# ------------------------------------------------------------------ Freestyle

scene.render.use_freestyle = True
scene.render.line_thickness_mode = "ABSOLUTE"
scene.render.line_thickness = 1.0
vl = scene.view_layers[0]
vl.use_freestyle = True
fs = vl.freestyle_settings
fs.crease_angle = math.radians(140)
fs.use_culling = False
lineset = fs.linesets[0] if len(fs.linesets) else fs.linesets.new("tusz")
lineset.select_by_visibility = True
lineset.visibility = "VISIBLE"
lineset.select_by_edge_types = True
lineset.select_silhouette = True
lineset.select_border = True
lineset.select_crease = True
lineset.select_external_contour = True
lineset.select_by_collection = True
lineset.collection_negation = "INCLUSIVE"
if lineset.linestyle is None:
    lineset.linestyle = bpy.data.linestyles.new("tusz")
ls = lineset.linestyle
ls.color = srgb(INK)[:3]
ls.alpha = 0.92
ls.thickness = 1.6 * SCALE if SCALE < 1 else 1.6
ls.caps = "ROUND"

# ------------------------------------------------------------------ render


def show_only(names, use_catcher):
    for n, coll in LAYERS.items():
        coll.hide_render = n not in names
    mat_obj.hide_render = use_catcher
    ground.hide_render = use_catcher
    catcher.hide_render = not use_catcher
    # kolekcja podstawy zostaje włączona: w warstwach elementów daje blat na cień
    LAYERS["base"].hide_render = False


def render(path, line_coll):
    lineset.collection = line_coll
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def anchor_uv(v):
    p = world_to_camera_view(scene, cam, v)
    return round(p.x, 4), round(1 - p.y, 4)


os.makedirs(TMP_DIR, exist_ok=True)

if PREVIEW:
    sample = {"base", "pages-p6_10", "type-firmowa", "design", "content", "extra-blog",
              "extra-jezyki", "extra-rezerwacje", "extra-platnosci", "extra-integracje",
              "extra-animacje", "express"}
    show_only(sample, use_catcher=False)
    lines = bpy.data.collections.new("podglad-linie")
    for n in sample:
        if n == "base":
            continue
        for o in LAYERS[n].objects:
            lines.objects.link(o)
    render(os.path.join(TMP_DIR, "podglad.png"), lines)
    print("PODGLAD", os.path.join(TMP_DIR, "podglad.png"))
    sys.exit(0)

os.makedirs(OUT_DIR, exist_ok=True)
manifest = {
    "width": res_x,
    "height": res_y,
    "order": ORDER,
    "anchors": {},
}
for name in ORDER:
    if name in ANCHORS:
        manifest["anchors"][name] = anchor_uv(ANCHORS[name])

for name in ORDER:
    if ONLY and name not in ONLY:
        continue
    if name == "base":
        show_only({"base"}, use_catcher=False)
    else:
        show_only({"base", name}, use_catcher=True)
    png = os.path.join(TMP_DIR, f"{name}.png")
    render(png, LAYERS[name])
    webp = os.path.join(OUT_DIR, f"{name}.webp")
    subprocess.run(
        ["cwebp", "-quiet", "-q", "84", "-alpha_q", "90", "-m", "6", "-exact", png, "-o", webp],
        check=True,
    )
    print("WARSTWA", name, os.path.getsize(webp) // 1024, "KB")

os.makedirs(os.path.dirname(JSON_PATH), exist_ok=True)
with open(JSON_PATH, "w") as f:
    json.dump(manifest, f, indent=2)
    f.write("\n")
print("MANIFEST", JSON_PATH)
