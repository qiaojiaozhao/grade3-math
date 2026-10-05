"""三年级上册浅奥：六张图口诀。给家长辅导用的八页 PPT。"""

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

W, H = 13.333, 7.5
FONT = "PingFang SC"
CREAM = RGBColor(0xFF, 0xF8, 0xEE)
INK = RGBColor(0x1C, 0x24, 0x30)
MUTED = RGBColor(0x5C, 0x67, 0x72)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
AMBER = RGBColor(0xE0, 0x8A, 0x14)
RED = RGBColor(0xD1, 0x45, 0x45)

UNITS = {
    "seg": (RGBColor(0x2F, 0x7A, 0x5B), RGBColor(0xE5, 0xF4, 0xEC)),
    "rev": (RGBColor(0xBE, 0x18, 0x5D), RGBColor(0xFD, 0xE7, 0xF0)),
    "count": (RGBColor(0xB4, 0x53, 0x09), RGBColor(0xFF, 0xF1, 0xE4)),
    "calc": (RGBColor(0x0F, 0x76, 0x6E), RGBColor(0xD9, 0xF5, 0xF0)),
    "shape": (RGBColor(0x43, 0x38, 0xCA), RGBColor(0xE8, 0xE7, 0xFB)),
    "logic": (RGBColor(0x6D, 0x28, 0xD9), RGBColor(0xED, 0xE9, 0xFE)),
}


def rgb_of(shape_fill):
    return shape_fill


def font_run(run, size, color, bold=False):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = FONT
    rpr = run._r.get_or_add_rPr()
    for tag in ("latin", "ea", "cs"):
        el = rpr.find(qn(f"a:{tag}"))
        if el is None:
            el = rpr.makeelement(qn(f"a:{tag}"))
            rpr.append(el)
        el.set("typeface", FONT)


def anchor(tf, where):
    tf.word_wrap = True
    tf.auto_size = None
    tf.margin_left = Inches(0.08)
    tf.margin_right = Inches(0.08)
    tf.margin_top = Inches(0.04)
    tf.margin_bottom = Inches(0.04)
    body = tf._txBody.find(qn("a:bodyPr"))
    body.set("anchor", {"top": "t", "middle": "ctr", "bottom": "b"}[where])


def box(slide, x, y, w, h, lines, size, color, bold=False, align="left", where="top"):
    shape = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = shape.text_frame
    anchor(tf, where)
    align_enum = {"left": PP_ALIGN.LEFT, "center": PP_ALIGN.CENTER, "right": PP_ALIGN.RIGHT}[align]
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align_enum
        p.space_before = Pt(0)
        p.space_after = Pt(0)
        run = p.add_run()
        run.text = line
        font_run(run, size, color, bold)
    return shape


def rect(slide, x, y, w, h, fill, line=None, radius=None, shape=MSO_SHAPE.ROUNDED_RECTANGLE):
    s = slide.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(1.5)
    if radius is not None and shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        s.adjustments[0] = radius
    return s


def oval(slide, x, y, w, h, fill, line=None, sw=1.5):
    s = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y), Inches(w), Inches(h))
    if fill is None:
        s.fill.background()
    else:
        s.fill.solid()
        s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(sw)
    return s


def blank(prs):
    return prs.slides.add_slide(prs.slide_layouts[6])


def paint(slide):
    rect(slide, 0, 0, W, H, CREAM, shape=MSO_SHAPE.RECTANGLE)


def footer(slide, page):
    box(slide, 0.45, 7.12, 10, 0.28, ["三年级上册浅奥 · 先对图，再念口诀"], 11, MUTED)
    box(slide, 11.4, 7.12, 1.5, 0.28, [f"{page} / 8"], 11, MUTED, align="right")


def header(slide, index, title, ink, lead):
    rect(slide, 0, 0, W, 1.18, ink, shape=MSO_SHAPE.RECTANGLE)
    box(slide, 0.45, 0.12, 3, 0.32, [f"第 {index} 张图"], 13, WHITE, bold=True)
    box(slide, 0.45, 0.38, 8, 0.42, [title], 28, WHITE, bold=True)
    box(slide, 0.45, 0.82, 10, 0.28, [lead], 13, WHITE)


def motto_card(slide, x, y, w, h, name, kind, line, ink, paper):
    rect(slide, x, y, w, h, paper, radius=0.15)
    rect(slide, x, y, 0.08, h, ink, shape=MSO_SHAPE.RECTANGLE)
    box(slide, x + 0.18, y + 0.06, w - 0.3, 0.28, [f"{name}  ·  {kind}"], 12, ink, bold=True)
    box(slide, x + 0.18, y + 0.32, w - 0.32, h - 0.38, [line], 15, INK, bold=True, where="top")


def cover(prs):
    s = blank(prs)
    paint(s)
    rect(s, 0, 0, 0.18, H, RGBColor(0x2F, 0x7A, 0x5B), shape=MSO_SHAPE.RECTANGLE)
    box(s, 0.55, 0.32, 8, 0.3, ["三年级上册浅奥"], 14, MUTED, bold=True)
    box(s, 0.55, 0.62, 12, 0.7, ["六张图，一句口诀走一题"], 36, INK, bold=True)
    box(s, 0.55, 1.38, 11, 0.4, ["孩子卡住，先看题目给了什么，对上这张图，再把口诀讲出来。"], 16, MUTED)

    tiles = [
        ("一", "画线段图", "两根条子，比高矮", "seg"),
        ("二", "倒推与假设", "倒着走，或先假设", "rev"),
        ("三", "数清楚", "不漏，也不多数一遍", "count"),
        ("四", "巧算", "先圈凑整的一对", "calc"),
        ("五", "图形", "长的也要数", "shape"),
        ("六", "推理", "一样多的划掉", "logic"),
    ]
    for i, (n, name, lead, key) in enumerate(tiles):
        ink, paper = UNITS[key]
        col, row = i % 3, i // 3
        x = 0.55 + col * 4.15
        y = 2.15 + row * 2.35
        rect(s, x, y, 3.95, 2.15, paper, radius=0.12)
        rect(s, x, y, 3.95, 0.1, ink, shape=MSO_SHAPE.RECTANGLE)
        oval(s, x + 0.22, y + 0.32, 0.48, 0.48, ink)
        box(s, x + 0.22, y + 0.38, 0.48, 0.4, [n], 16, WHITE, bold=True, align="center")
        box(s, x + 0.82, y + 0.36, 2.9, 0.42, [name], 20, INK, bold=True)
        box(s, x + 0.22, y + 1.05, 3.5, 0.7, [lead], 16, ink, bold=True)
    box(s, 0.55, 7.05, 12, 0.3, ["前三张按顺序学。后三张穿插：巧算每天几道，图形跟着线和角，推理放学期末。"], 13, MUTED)


def slide_bars(prs):
    s = blank(prs)
    paint(s)
    ink, paper = UNITS["seg"]
    header(s, "一", "画线段图", ink, "先不看数字。多出来的那一截，到底是什么？")
    # two bars
    box(s, 0.45, 1.45, 2, 0.3, ["小的"], 14, MUTED, bold=True)
    rect(s, 0.45, 1.8, 3.15, 0.62, ink, radius=0.2)
    box(s, 0.45, 2.55, 2, 0.3, ["大的"], 14, MUTED, bold=True)
    rect(s, 0.45, 2.9, 3.15, 0.62, ink, radius=0.08)
    rect(s, 3.6, 2.9, 1.7, 0.62, AMBER, radius=0.2)
    box(s, 3.6, 3.02, 1.7, 0.4, ["多出来"], 14, WHITE, bold=True, align="center")
    box(s, 0.45, 3.6, 3.15, 0.3, ["一样长"], 13, MUTED, align="center")
    box(s, 3.55, 3.6, 1.8, 0.3, ["这一截"], 13, AMBER, bold=True, align="center")
    notes = [
        ("是一段长度", "切掉它，剩下两份一样长"),
        ("是几份", "数一共几份，或多出来几份"),
        ("在倒来倒去", "看这一截怎么变"),
        ("过了几年", "这一截根本不变"),
    ]
    for i, (a, b) in enumerate(notes):
        y = 4.15 + i * 0.62
        rect(s, 0.45, y, 4.85, 0.54, paper, radius=0.15)
        box(s, 0.6, y, 1.7, 0.54, [a], 14, ink, bold=True, where="middle")
        box(s, 2.3, y, 2.85, 0.54, [b], 14, INK, where="middle")

    cards = [
        ("和差", "口诀", "（和 + 差）÷ 2 = 大数；（和 − 差）÷ 2 = 小数。"),
        ("和倍", "口诀", "和 ÷ (倍数 + 1) = 1 份。"),
        ("差倍", "口诀", "差 ÷ (倍数 − 1) = 1 份。"),
        ("移多补少", "口诀", "倒过去 1 份，差距缩小 2 份。"),
        ("年龄", "口诀", "两个人一起长一岁，高出的那一截不变。"),
    ]
    for i, (name, kind, line) in enumerate(cards):
        motto_card(s, 5.6, 1.42 + i * 1.08, 7.25, 1.0, name, kind, line, ink, paper)
    footer(s, 2)


def slide_reverse(prs):
    s = blank(prs)
    paint(s)
    ink, paper = UNITS["rev"]
    header(s, "二", "倒推与假设", ink, "线段图画不出时：倒着走，或先假设全是一种。")

    def station(x, y, label, fill, fg):
        rect(s, x, y, 1.35, 0.58, fill, radius=0.2)
        box(s, x, y, 1.35, 0.58, [label], 14, fg, bold=True, align="center", where="middle")

    box(s, 0.45, 1.45, 5, 0.28, ["顺着做完了，问原来有多少"], 13, MUTED, bold=True)
    station(0.45, 1.85, "原来", paper, ink)
    rect(s, 1.9, 2.02, 0.7, 0.22, ink, shape=MSO_SHAPE.RIGHT_ARROW)
    station(2.7, 1.85, "剩下", paper, ink)
    rect(s, 4.15, 2.02, 0.7, 0.22, ink, shape=MSO_SHAPE.RIGHT_ARROW)
    station(4.95, 1.85, "最后", ink, WHITE)

    box(s, 0.45, 2.6, 5, 0.28, ["倒回去：顺序反过来，运算也反过来"], 13, ink, bold=True)
    station(4.95, 3.0, "最后", ink, WHITE)
    rect(s, 4.15, 3.16, 0.7, 0.22, AMBER, shape=MSO_SHAPE.LEFT_ARROW)
    station(2.7, 3.0, "还 1", paper, ink)
    rect(s, 1.9, 3.16, 0.7, 0.22, AMBER, shape=MSO_SHAPE.LEFT_ARROW)
    station(0.45, 3.0, "原来", AMBER, WHITE)
    box(s, 0.45, 3.68, 5.5, 0.4, ["多的先还，再翻倍。最后一步最先撤回。"], 14, INK)

    box(s, 0.45, 4.25, 5.2, 0.28, ["两种混在一起，先当全是少的那种"], 13, MUTED, bold=True)
    for i in range(6):
        oval(s, 0.5 + i * 0.72, 4.7, 0.58, 0.58, paper, ink, 2)
        box(s, 0.5 + i * 0.72, 4.78, 0.58, 0.46, ["鸡"], 13, ink, bold=True, align="center")
    box(s, 0.45, 5.4, 5.3, 0.35, ["脚不够。每换一只兔，多 2 只脚。"], 14, INK)
    for i in range(4):
        oval(s, 0.5 + i * 0.72, 5.9, 0.58, 0.58, paper, ink, 2)
        box(s, 0.5 + i * 0.72, 5.98, 0.58, 0.46, ["鸡"], 13, ink, bold=True, align="center")
    for i in range(2):
        oval(s, 0.5 + (4 + i) * 0.72, 5.9, 0.58, 0.58, ink)
        box(s, 0.5 + (4 + i) * 0.72, 5.98, 0.58, 0.46, ["兔"], 13, WHITE, bold=True, align="center")

    cards = [
        ("还原", "口诀", "从剩下的倒回去：多的先还，再翻倍。"),
        ("鸡兔同笼", "口诀", "先当全是鸡，少的脚两只两只添，添几次就有几只兔。"),
        ("盈亏", "口诀", "多了加少了，除以两次分的差，先求人再求总数。"),
    ]
    for i, item in enumerate(cards):
        motto_card(s, 6.35, 1.5 + i * 1.7, 6.5, 1.55, *item, ink, paper)
    footer(s, 3)


def slide_count(prs):
    s = blank(prs)
    paint(s)
    ink, paper = UNITS["count"]
    header(s, "三", "数清楚", ink, "这一单元不考算。考有没有漏，有没有多数一遍。")

    box(s, 0.45, 1.42, 5, 0.28, ["点和段：头和尾都要点"], 14, ink, bold=True)
    xs = [0.55, 1.55, 2.55, 3.55, 4.55]
    for i in range(4):
        rect(s, xs[i] + 0.42, 2.05, 0.7, 0.1, ink, shape=MSO_SHAPE.RECTANGLE)
        box(s, xs[i] + 0.35, 2.22, 0.85, 0.28, [str(i + 1)], 12, MUTED, align="center")
    for x in xs:
        oval(s, x, 1.85, 0.48, 0.48, ink)
    box(s, 0.45, 2.52, 5, 0.3, ["4 段，5 个点。点比段多 1。"], 14, INK)

    box(s, 0.45, 3.05, 5.2, 0.28, ["几个一组：先圈一组，再数有几组"], 14, ink, bold=True)
    for g in range(3):
        gx = 0.45 + g * 1.85
        rect(s, gx, 3.45, 1.72, 0.72, paper, ink, radius=0.15)
        for k in range(5):
            oval(s, gx + 0.1 + k * 0.26, 3.62, 0.22, 0.38, ink)
        oval(s, gx + 0.1 + 5 * 0.26, 3.62, 0.22, 0.38, AMBER)
    # fix the oval call - I passed a bad kw. I'll rewrite this function more carefully below.
    box(s, 0.45, 4.25, 5.4, 0.55, ["买五送一：5 加 1 才是一组。", "送的那一瓶，也在圈里。"], 14, INK)

    cards = [
        ("植树", "口诀", "点过去，头和尾都要点。"),
        ("买赠", "口诀", "送的那瓶也要喝，5 加 1 才是一组。"),
        ("过火车", "口诀", "车头进、车尾出，两段路加在一起。"),
        ("周期", "口诀", "一组一组圈起来。多出来几个，从头数几个；一个不多，就是最后一个。"),
        ("重叠", "口诀", "两圈加起来，比全班多几个，中间就有几个人。"),
    ]
    for i, item in enumerate(cards):
        motto_card(s, 6.15, 1.4 + i * 1.08, 6.75, 1.02, *item, ink, paper)
    footer(s, 4)


def slide_calc(prs):
    s = blank(prs)
    paint(s)
    ink, paper = UNITS["calc"]
    header(s, "四", "巧算", ink, "先看数，再动笔。能凑成整十、整百的，是一对好朋友。")

    def num(x, y, text, fill, fg):
        rect(s, x, y, 1.7, 0.85, fill, radius=0.18)
        box(s, x, y, 1.7, 0.85, [text], 26, fg, bold=True, align="center", where="middle")

    num(0.5, 2.0, "347", ink, WHITE)
    box(s, 2.25, 2.15, 0.5, 0.6, ["+"], 28, INK, bold=True, align="center", where="middle")
    num(2.75, 2.0, "253", ink, WHITE)
    box(s, 4.55, 2.15, 0.7, 0.6, ["="], 28, INK, bold=True, align="center", where="middle")
    num(5.15, 2.0, "600", AMBER, WHITE)
    rect(s, 0.5, 3.0, 3.95, 0.08, ink, shape=MSO_SHAPE.RECTANGLE)
    box(s, 0.5, 3.12, 3.95, 0.35, ["先圈这一对，凑成 600"], 14, ink, bold=True, align="center")

    box(s, 0.5, 3.7, 5.5, 0.4, ["再算剩下的"], 14, MUTED, bold=True)
    num(0.5, 4.15, "600", AMBER, WHITE)
    box(s, 2.25, 4.3, 0.5, 0.6, ["+"], 28, INK, bold=True, align="center", where="middle")
    num(2.75, 4.15, "158", RGBColor(0xE7, 0xE2, 0xD6), INK)
    box(s, 4.55, 4.3, 0.7, 0.6, ["="], 28, INK, bold=True, align="center", where="middle")
    num(5.15, 4.15, "758", ink, WHITE)

    friends = [("3 和 7", "个位凑 10"), ("25 和 4", "25 × 4 = 100"), ("125 和 8", "125 × 8 = 1000")]
    for i, (a, b) in enumerate(friends):
        x = 0.5 + i * 2.15
        rect(s, x, 5.3, 2.0, 1.15, paper, radius=0.15)
        box(s, x, 5.4, 2.0, 0.45, [a], 16, ink, bold=True, align="center")
        box(s, x, 5.85, 2.0, 0.4, [b], 13, INK, align="center")

    cards = [
        ("巧算", "口诀", "先把凑成整十、整百的两个圈在一起，再算剩下的。"),
        ("巧填算符", "要领", "先看结果大小，决定要乘还是要减。课还在写。"),
        ("数字谜", "要领", "竖式里挖空，从个位看进位。课还在写。"),
        ("定义新运算", "要领", "★、△ 被规定成一种新算法，照着规矩算。先挂在巧算上。"),
    ]
    for i, item in enumerate(cards):
        motto_card(s, 7.15, 1.45 + i * 1.35, 5.75, 1.25, *item, ink, paper)
    footer(s, 5)


def arch(slide, x, y_base, w, h, color):
    """拱的圆心落在 y_base 上，下半圆用底色挡住。h 是整圆高度。"""
    oval(slide, x, y_base - h / 2, w, h, None, color, 3.5)
    rect(slide, x - 0.03, y_base - 0.02, w + 0.06, h / 2 + 0.08, CREAM, shape=MSO_SHAPE.RECTANGLE)


def slide_shape(prs):
    s = blank(prs)
    paint(s)
    ink, paper = UNITS["shape"]
    header(s, "五", "图形", ink, "从一个点出发，能连的都数完，再换下一个。数过的不再数。")

    box(s, 0.45, 1.4, 6, 0.3, ["5 个点。只数挨着的，会漏成 4 条。"], 14, RED, bold=True)
    # arches from the left dot, increasing span
    base_y = 3.55
    dot_y = base_y - 0.18
    xs = [0.7, 1.85, 3.0, 4.15, 5.3]
    spans = [
        (0, 1, 0.7, RGBColor(0x6E, 0xA8, 0xFF)),
        (0, 2, 1.15, RGBColor(0x6E, 0xA8, 0xFF)),
        (0, 3, 1.6, RGBColor(0x6E, 0xA8, 0xFF)),
        (0, 4, 2.05, RGBColor(0x6E, 0xA8, 0xFF)),
        (1, 2, 0.7, AMBER),
        (1, 3, 1.15, AMBER),
        (1, 4, 1.6, AMBER),
        (2, 3, 0.7, RGBColor(0x3D, 0xB8, 0x7A)),
        (2, 4, 1.15, RGBColor(0x3D, 0xB8, 0x7A)),
        (3, 4, 0.7, RGBColor(0xA7, 0x8B, 0xFA)),
    ]
    for a, b, lift, color in spans:
        x1 = xs[a] + 0.2
        x2 = xs[b] + 0.2
        arch(s, x1, base_y, x2 - x1, lift * 2, color)
    for i, x in enumerate(xs):
        oval(s, x, dot_y, 0.4, 0.4, WHITE, ink, 2.5)
        box(s, x, dot_y + 0.42, 0.4, 0.28, [str(i + 1)], 12, MUTED, align="center")
    box(s, 0.45, 4.35, 6.2, 0.4, ["4 + 3 + 2 + 1 = 10 条。往左的已经数过。"], 16, ink, bold=True)

    # stair to rectangle
    box(s, 0.45, 4.9, 6, 0.28, ["台阶的周长：凹进去的边推出去"], 14, ink, bold=True)
    ff = s.shapes.build_freeform(Inches(0.55), Inches(6.55))
    ff.add_line_segments(
        [
            (Inches(1.35), Inches(6.55)),
            (Inches(1.35), Inches(6.15)),
            (Inches(2.15), Inches(6.15)),
            (Inches(2.15), Inches(5.75)),
            (Inches(2.95), Inches(5.75)),
            (Inches(2.95), Inches(6.55)),
        ],
        close=True,
    )
    stair = ff.convert_to_shape()
    stair.fill.solid()
    stair.fill.fore_color.rgb = paper
    stair.line.color.rgb = ink
    stair.line.width = Pt(1.75)
    rect(s, 3.4, 5.75, 1.7, 0.8, paper, ink)
    box(s, 3.4, 5.9, 1.7, 0.5, ["长方形"], 14, ink, bold=True, align="center")
    box(s, 5.2, 5.9, 1.5, 0.5, ["周长相同"], 13, MUTED, where="middle")

    cards = [
        ("数线段、数角", "口诀", "从左边第一个点出发，能连到的都数上；数完换下一个，数过的不再数。"),
        ("巧求周长", "要领", "凹进去的边推出去，拼成长方形再算。课还在写。"),
        ("一笔画", "要领", "数单数条线的点，0 个或 2 个才能一笔画。课还在写。"),
        ("图形计数", "要领", "大方形里的小正方形，按大小一层一层数，别只数最小的。先挂在数线段上。"),
    ]
    for i, item in enumerate(cards):
        motto_card(s, 6.9, 1.42 + i * 1.35, 6.0, 1.25, *item, ink, paper)
    footer(s, 6)


def slide_logic(prs):
    s = blank(prs)
    paint(s)
    ink, paper = UNITS["logic"]
    header(s, "六", "推理", ink, "一样多的可以换、可以划掉。条件一多，就画一张表。")

    rect(s, 0.4, 1.45, 6.3, 2.55, paper, radius=0.1)
    box(s, 0.55, 1.55, 6, 0.4, ["△  +  △  +  ○   =  16"], 22, INK, bold=True, align="center")
    box(s, 0.55, 2.1, 6, 0.4, ["△  +  ○   =  10"], 22, INK, bold=True, align="center")
    rect(s, 1.15, 2.28, 2.3, 0.06, RED, shape=MSO_SHAPE.RECTANGLE)
    box(s, 0.55, 2.65, 6, 0.45, ["划掉一样的 △ 和 ○"], 14, RED, bold=True, align="center")
    box(s, 0.55, 3.15, 6, 0.55, ["剩下  △  =  6"], 26, ink, bold=True, align="center")

    labels = ["", "红", "黄", "蓝"]
    rows = [
        ["小红", "✗", "✗", "✓"],
        ["小兰", "✗", "✓", "✗"],
        ["小芳", "✓", "✗", "✗"],
    ]
    x0, y0, cw, ch = 0.55, 4.25, 1.15, 0.55
    for c, lab in enumerate(labels):
        if c == 0:
            continue
        box(s, x0 + c * cw, y0, cw, 0.35, [lab], 13, MUTED, bold=True, align="center")
    for r, row in enumerate(rows):
        for c, val in enumerate(row):
            yy = y0 + 0.38 + r * ch
            xx = x0 + c * cw
            if c == 0:
                box(s, xx, yy, cw, ch, [val], 14, INK, bold=True, align="center", where="middle")
            else:
                mark = val == "✓"
                rect(s, xx + 0.12, yy + 0.04, cw - 0.24, ch - 0.08, ink if mark else CREAM, radius=0.12)
                box(s, xx + 0.12, yy + 0.04, cw - 0.24, ch - 0.08, [val], 16, WHITE if mark else MUTED, bold=True, align="center", where="middle")
    box(s, 0.5, 6.55, 6, 0.35, ["小红确定穿蓝，蓝这一列都叉掉。"], 14, ink, bold=True)

    cards = [
        ("图形推理", "口诀", "两个算式摆一起，划掉一样多的，剩下的就露出来。"),
        ("逻辑推理", "口诀", "确定的打勾，不可能的打叉；打了勾，这一行这一列都叉掉。"),
        ("奇偶", "要领", "单 + 单 = 双；双数怎么加都是双。课还在写。"),
    ]
    for i, item in enumerate(cards):
        motto_card(s, 6.95, 1.5 + i * 1.75, 5.95, 1.6, *item, ink, paper)
    footer(s, 7)


def slide_traps(prs):
    s = blank(prs)
    paint(s)
    rect(s, 0, 0, W, 1.18, RGBColor(0x9A, 0x34, 0x12), shape=MSO_SHAPE.RECTANGLE)
    box(s, 0.45, 0.16, 8, 0.35, ["辅导时盯这三处"], 14, WHITE, bold=True)
    box(s, 0.45, 0.48, 12, 0.5, ["名字会骗人，条件不会"], 28, WHITE, bold=True)

    cols = [
        (
            "一共，还多 12",
            "和差",
            "多出来的是一段长度。切掉再分两半。",
            "（和 + 差）÷ 2 = 大数",
            UNITS["seg"],
        ),
        (
            "一共，是 3 倍",
            "和倍",
            "多出来的是几份。份数要加 1。",
            "和 ÷ (倍数 + 1) = 1 份",
            UNITS["calc"],
        ),
        (
            "相差，是 3 倍",
            "差倍",
            "只数多出来的那几份。份数要减 1。",
            "差 ÷ (倍数 − 1) = 1 份",
            UNITS["rev"],
        ),
    ]
    for i, (see, name, why, kou, (ink, paper)) in enumerate(cols):
        x = 0.4 + i * 4.25
        rect(s, x, 1.5, 4.05, 4.35, paper, radius=0.1)
        box(s, x + 0.2, 1.68, 3.65, 0.7, [see], 20, INK, bold=True)
        rect(s, x + 0.2, 2.5, 1.5, 0.42, ink, radius=0.2)
        box(s, x + 0.2, 2.5, 1.5, 0.42, [name], 14, WHITE, bold=True, align="center", where="middle")
        box(s, x + 0.2, 3.15, 3.65, 1.15, [why], 16, INK)
        box(s, x + 0.2, 4.4, 3.65, 0.35, ["口诀"], 12, ink, bold=True)
        box(s, x + 0.2, 4.75, 3.65, 0.8, [kou], 16, INK, bold=True)

    rect(s, 0.4, 6.05, 12.55, 0.9, RGBColor(0xFF, 0xF1, 0xE4), radius=0.1)
    box(s, 0.6, 6.15, 12.2, 0.7, ["「多 2 倍」不是差，是倍。先改口：是 3 倍。然后看另一个数是一共，还是相差。"], 18, RGBColor(0x9A, 0x34, 0x12), bold=True, where="middle")
    footer(s, 8)


def main():
    prs = Presentation()
    prs.slide_width = Inches(W)
    prs.slide_height = Inches(H)
    prs.core_properties.title = "三年级上册浅奥：六张图口诀"
    cover(prs)
    slide_bars(prs)
    slide_reverse(prs)
    slide_count(prs)
    slide_calc(prs)
    slide_shape(prs)
    slide_logic(prs)
    slide_traps(prs)
    out = "/Users/ady.zhao/Desktop/workspace/三年级奥数/三年级上册-六张图口诀.pptx"
    prs.save(out)
    print(out)


if __name__ == "__main__":
    main()
