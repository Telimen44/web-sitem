"""Rebuild the original inventory, interface, character and title sprites. Requires Pillow."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[1] / "art"
OUT.mkdir(exist_ok=True)
INK = "#263a34"
DEEP = "#68412c"
CREAM = "#fff1bc"
WHITE = "#fffae3"
GOLD = "#f4b644"
GREEN = "#4d8b55"
JADE = "#2d6e62"
RED = "#be5041"
BLUE = "#559eaf"
SKIN = "#edaa70"
LIGHT = "#ffd09a"
HAIR = "#5e3729"
TILES = {}


class Pen:
    def __init__(self, size=(32, 32)):
        self.im = Image.new("RGBA", size)
        self.d = ImageDraw.Draw(self.im)

    def box(self, xy, fill, edge=None):
        self.d.rectangle(xy, fill, edge)

    def poly(self, pts, fill, edge=INK):
        self.d.polygon(pts, fill, edge)

    def oval(self, xy, fill, edge=INK):
        self.d.ellipse(xy, fill, edge)

    def line(self, pts, color, width=1):
        self.d.line(pts, color, width)

    def dot(self, xy, color):
        self.d.point(xy, color)


def tile(name):
    p = Pen()
    TILES[name] = p.im
    return p


def bread(p):
    p.poly([(1,20),(4,14),(13,10),(22,6),(27,7),(30,11),(29,16),(23,20),(10,26),(5,26),(2,24)], "#c37a38")
    p.poly([(3,19),(7,15),(22,8),(26,8),(28,11),(24,15),(10,22),(5,23)], "#eeb960", None)
    for x,y in [(8,16),(14,13),(21,10)]:
        p.line([(x,y),(x+3,y+1),(x+4,y+4)], "#a36332", 2)
        p.line([(x,y-1),(x+3,y)], CREAM)
    p.line([(5,24),(10,24),(23,18)], "#965231")


def carton(p):
    p.poly([(7,9),(11,4),(22,4),(26,10),(26,26),(21,29),(6,27),(6,11)], WHITE)
    p.poly([(7,10),(12,5),(21,5),(18,11)], "#91c9d5")
    p.poly([(19,10),(22,5),(25,10),(25,26),(20,28)], "#6fabb7")
    p.box((11,3,22,5), BLUE, INK)
    p.box((7,16,19,23), BLUE)
    p.oval((10,17,16,22), WHITE, None)
    p.line([(8,25),(17,26)], "#9ebcb5")


def sack(p, fill, label, mark):
    p.poly([(7,4),(24,4),(23,8),(25,12),(27,25),(25,28),(6,28),(4,25),(6,12),(9,8)], fill)
    p.box((8,5,23,7), "#c09c73")
    p.line([(7,12),(6,24),(8,26)], WHITE)
    p.line([(22,11),(24,24),(22,26)], "#bf9873")
    p.box((8,14,23,23), label)
    if mark == "wheat":
        p.line([(12,22),(19,15)], CREAM, 2)
        for a,b in [(13,19),(16,16)]: p.line([(a-1,b-2),(a,b+1),(a+3,b+1)], GOLD)
    elif mark == "grain":
        for a,b in [(11,17),(15,20),(18,16),(20,20)]: p.line([(a,b+1),(a+2,b)], WHITE)
    else:
        for a,b in [(10,17),(15,15),(17,19)]: p.box((a,b,a+3,b+3), WHITE, "#d0b9c0")


bread(tile("bread"))
carton(tile("milk"))
sack(tile("flour"), "#e5c798", "#9e6940", "wheat")
p=tile("eggs")
p.poly([(2,15),(7,12),(25,12),(30,16),(28,25),(23,28),(7,26),(2,23)], "#8c9c83")
for x,y in [(5,7),(12,5),(19,6),(8,11),(16,11),(23,10)]:
    p.oval((x,y,x+6,y+10), "#f8dcb0", DEEP)
    p.line([(x+2,y+3),(x+3,y+2)], WHITE)
p.poly([(2,17),(7,18),(11,21),(14,18),(19,21),(23,18),(28,18),(27,24),(22,27),(6,25),(2,23)], "#aebba0")
p.line([(4,21),(10,23),(16,24),(22,25)], "#d9ddba")
p=tile("yogurt")
p.poly([(5,10),(27,10),(24,26),(20,28),(9,27)], "#dce8d7")
p.poly([(7,15),(25,15),(24,22),(8,22)], "#4b8d94", None)
p.oval((12,16,20,21), WHITE, None); p.line([(15,18),(17,19)], BLUE)
p.oval((3,6,28,13), "#62adae"); p.oval((6,7,25,10), "#e0efe2", None)
p=tile("cheese")
p.poly([(3,17),(17,6),(28,11),(29,22),(14,28),(3,24)], "#dfa83d")
p.poly([(3,17),(17,6),(28,11),(14,20)], "#ffe18a")
p.poly([(14,20),(28,12),(28,22),(14,27)], "#edb94e")
for xy in [(10,14,13,15),(18,10,21,12),(18,20,20,22),(24,17,26,19),(6,20,8,22)]:
    p.oval(xy,"#b68239",None)
p=tile("pasta")
p.poly([(5,4),(26,4),(25,9),(27,23),(25,28),(5,28),(6,22),(5,10)], "#bd4d3f")
p.box((8,10,23,23), "#f7d16c", DEEP)
for x in [10,14,18]: p.line([(x,20),(x+3,13)], "#cd8d37",2)
p.line([(7,6),(24,6)], "#e48d58"); p.box((7,24,24,26), RED)
sack(tile("rice"), "#e2ddbc", JADE, "grain")
sack(tile("sugar"), "#eed6cd", "#c46c82", "cube")
p=tile("salt")
p.poly([(11,8),(21,8),(23,20),(24,26),(22,28),(9,28),(8,25),(10,16)], "#dae5dc")
p.box((10,5,22,9), "#758f93", INK); p.box((12,4,20,5), "#a7c1bb", INK)
for x in [13,16,19]: p.dot((x,6), INK)
p.box((10,17,22,23), "#677ca5"); p.box((14,18,17,21), WHITE)
p=tile("apple")
p.poly([(15,10),(19,8),(24,8),(28,12),(28,19),(24,26),(20,28),(16,26),(12,28),(8,26),(4,19),(4,13),(8,9),(12,8)], "#d35440")
p.poly([(5,14),(9,10),(14,10),(10,14),(8,20),(6,19)], "#ef8661", None)
p.line([(17,10),(16,6),(19,2)], DEEP,2)
p.poly([(17,7),(20,3),(27,3),(23,7)], "#70a251")
p=tile("banana")
p.poly([(3,15),(6,19),(12,21),(18,19),(23,14),(25,6),(28,5),(29,11),(26,19),(21,24),(13,27),(7,25),(3,21)], "#efb738")
p.line([(6,20),(12,23),(18,22),(24,17),(27,10)], "#ffe890",2)
p.poly([(4,12),(7,16),(13,17),(19,14),(23,8),(23,5),(25,4),(26,8),(23,14),(18,19),(12,20),(7,18),(3,15)], "#ffd865")
p.box((24,3,27,5),DEEP); p.dot((3,15),DEEP)
p=tile("tomato")
p.oval((3,10,29,28), "#d35339"); p.oval((6,12,11,18), "#ed8b5b", None)
p.poly([(15,11),(9,8),(15,9),(14,4),(18,7),(23,6),(20,10),(25,12),(19,12),(16,16)], "#579355")
p=tile("cucumber")
p.poly([(2,21),(7,16),(14,12),(21,6),(26,5),(29,8),(28,13),(22,18),(14,23),(8,27),(4,26)], "#4d9258")
p.line([(5,21),(12,16),(19,12),(24,8)], "#a0bf6b",2)
for xy in [(8,22),(12,19),(18,16),(23,13),(25,9)]: p.dot(xy,"#2a704a")
p=tile("butter")
p.poly([(2,21),(14,13),(29,17),(30,23),(18,28),(3,25)], "#c0d7ca")
p.poly([(5,16),(14,10),(26,12),(26,20),(16,25),(5,22)], "#f3c05a")
p.poly([(5,16),(14,10),(26,12),(16,18)], "#ffe69a"); p.line([(7,21),(15,23)], "#ffd77e")
p=tile("olives")
p.poly([(8,7),(23,7),(26,11),(26,25),(23,28),(8,28),(6,25),(6,12)], "#91aa6a")
for x,y in [(9,12),(16,10),(19,16),(9,21),(17,22),(11,16)]: p.oval((x,y,x+5,y+4), "#4d553c", INK)
p.line([(8,12),(8,21)], "#c4d69d"); p.box((7,4,24,8), "#9e7643", INK); p.line([(9,5),(22,5)], GOLD)
p=tile("tea")
p.poly([(5,7),(9,4),(25,5),(27,9),(26,27),(7,28),(5,25)], "#9c473a")
p.box((7,6,24,9), "#c57646"); p.box((8,12,24,23), "#3e6850", DEEP)
p.line([(12,20),(20,15)], "#d6bf75",2); p.poly([(14,19),(13,15),(19,14),(18,18)], "#92ab63")
p=tile("biscuit")
p.poly([(3,8),(6,6),(24,7),(29,10),(28,24),(24,26),(5,24),(2,22)], "#589aaa")
p.box((4,10,6,22), "#94c9c6"); p.box((24,10,26,23), "#337681")
for x,y in [(14,10),(8,13)]:
    p.oval((x,y,x+10,y+10), "#dcaa61", DEEP)
    for a,b in [(3,3),(6,5),(4,7)]: p.dot((x+a,y+b),DEEP)


def ui_icons():
    p=tile("store")
    p.box((4,13,27,28), "#d5a866", INK); p.box((6,15,14,23), "#77b8b1", INK)
    p.box((18,15,24,28), "#724d38", INK); p.box((19,16,23,21),"#87b2a1")
    p.poly([(3,12),(6,5),(25,5),(29,12),(28,15),(4,15)], "#d76a4c")
    for x in [8,16,24]: p.poly([(x,6),(x+3,6),(x+3,14),(x-1,14)], CREAM, None)
    p.line([(6,5),(25,5)], DEEP,2); p.box((3,27,28,29), DEEP)
    p=tile("map")
    p.poly([(2,8),(10,5),(20,8),(28,5),(29,23),(20,27),(11,24),(3,27)], "#e8c981")
    p.poly([(11,7),(18,9),(19,24),(12,22)], "#f6df9a", None)
    p.line([(5,20),(8,16),(14,18),(21,12),(24,14)], "#91845a",2)
    p.line([(20,11),(24,15)], RED,2); p.line([(24,11),(20,15)], RED,2)
    p=tile("teacher")
    p.box((3,4,27,22), "#a67a47", INK); p.box((5,6,25,19), JADE, INK)
    p.line([(8,15),(12,11),(15,13),(20,9)], CREAM,2)
    p.box((2,21,29,24), "#e4b772", INK); p.box((10,25,12,28),DEEP); p.box((20,25,22,28),DEEP)
    p=tile("music")
    p.poly([(11,6),(26,3),(26,23),(23,26),(18,26),(16,24),(17,21),(22,20),(22,9),(13,11),(13,25),(10,28),(5,28),(3,25),(4,22),(9,21),(9,7)], "#c37643")
    p.line([(11,8),(24,5)], "#ffe09a",2)
    p=tile("basket")
    p.line([(7,16),(12,6),(15,6)], INK,3); p.line([(24,16),(19,6),(16,6)], INK,3)
    p.line([(8,14),(13,6)], GOLD,1); p.line([(23,14),(18,6)], GOLD,1)
    p.poly([(2,14),(29,14),(25,27),(7,27)], "#c07841"); p.box((2,13,29,17), "#e7ad61", INK)
    for x in [8,13,18,23]: p.line([(x,19),(x+1,24)], "#f1c883",2)
    p=tile("bag")
    p.line([(11,12),(11,7),(14,4),(18,4),(21,7),(21,13)], DEEP,3)
    p.poly([(6,11),(25,11),(28,28),(25,30),(5,29)], "#d59b55")
    p.poly([(22,13),(25,13),(27,27),(23,28)], "#b27843",None)
    p.line([(9,14),(8,26),(20,27)], "#efc480",2)
    p.poly([(11,20),(14,17),(19,18),(16,22),(13,23)], GREEN)
    p=tile("wallet")
    p.poly([(3,10),(23,4),(27,7),(27,12),(29,13),(28,26),(24,28),(4,27),(2,24)], "#a15a3b")
    p.poly([(5,10),(22,6),(25,8),(24,12),(5,14)], "#e2bd82")
    p.box((3,12,27,25), "#bd794a", DEEP); p.line([(5,14),(24,14)], "#f2bd77")
    p.box((19,16,29,22), "#8b4f34", DEEP); p.box((22,18,24,20),GOLD)
    p=tile("list")
    p.box((6,5,26,28), "#b9864d", INK); p.box((8,7,24,26), CREAM)
    p.box((12,3,20,8), "#799b82", INK)
    for y in [12,17,22]:
        p.line([(10,y),(11,y+1),(13,y-1)], GREEN); p.line([(15,y),(22,y)], "#ad9467")
    p=tile("star")
    p.poly([(15,2),(19,10),(29,11),(22,18),(24,28),(15,23),(6,28),(8,18),(1,11),(12,10)], "#e8a740")
    p.line([(5,12),(13,12),(15,6)], "#ffe58d",2); p.line([(9,23),(15,20),(21,23)], "#c07c31",2)
    p=tile("heart")
    p.poly([(3,7),(7,4),(12,4),(16,8),(20,4),(25,4),(29,8),(29,14),(25,20),(16,28),(7,20),(3,14)], "#df755b")
    p.line([(6,11),(7,8),(11,7)], "#ffd1a6",2)
    p=tile("till")
    p.box((12,3,25,10),JADE,INK); p.box((14,5,23,8),"#a6ce8f")
    p.poly([(8,12),(24,12),(28,20),(28,27),(3,27),(3,20)], "#7ba79a")
    for x in [9,13,17,21]:
        p.box((x,15,x+2,17),CREAM)
    p.box((6,22,25,25), JADE,INK)
    p=tile("house")
    p.box((6,15,25,28), "#e7bd79", INK); p.poly([(2,16),(15,3),(29,15),(27,18),(15,8),(4,18)], RED)
    p.box((9,18,13,23),BLUE,INK); p.box((17,18,22,28),DEEP)
    p=tile("hint")
    p.oval((6,2,25,21),"#f4c24f"); p.box((11,18,21,23),GOLD,INK)
    p.box((12,23,20,26),"#7ca699",INK); p.box((14,27,18,28),INK)
    p.line([(9,12),(10,8),(13,6)],CREAM,2)
    p=tile("coin")
    p.oval((3,3,28,28),"#c78834"); p.oval((5,4,26,25),"#f1be56",DEEP)
    p.oval((8,7,23,22),"#e9a93f","#ffdd79"); p.line([(14,11),(16,9),(16,19)],CREAM,2)
    for name in ["play","right","check","pause","expand","sound","mute","close","back","hand","plus","minus"]:
        p=tile(name)
        c=INK
        if name=="play": p.poly([(8,4),(26,15),(8,27)],CREAM,DEEP); p.line([(10,8),(10,22)],WHITE,2)
        if name=="right": p.line([(10,7),(19,15),(10,23)],c,3)
        if name=="back": p.line([(21,7),(12,15),(21,23)],c,3)
        if name=="check": p.line([(5,16),(12,23),(26,8)],"#286649",4)
        if name=="pause": p.box((7,6,12,26),c); p.box((19,6,24,26),c)
        if name=="expand":
            for x,y,dx,dy in [(5,5,1,1),(26,5,-1,1),(5,26,1,-1),(26,26,-1,-1)]:
                p.line([(x,y+dy*7),(x,y),(x+dx*7,y)],c,3)
        if name in ["sound","mute"]:
            p.poly([(3,12),(9,12),(16,5),(16,26),(9,20),(3,20)],c)
            if name=="sound":
                p.line([(20,11),(23,14),(23,18),(20,21)],c,2)
                p.line([(24,7),(28,12),(28,20),(24,25)],c,2)
            else:
                p.line([(21,11),(28,20)],c,2); p.line([(28,11),(21,20)],c,2)
        if name=="close":
            p.line([(7,7),(24,24)],c,3); p.line([(24,7),(7,24)],c,3)
        if name=="hand":
            p.poly([(6,19),(8,16),(13,19),(13,6),(15,4),(17,6),(17,13),(20,12),(22,14),(26,14),(28,17),(26,25),(21,28),(13,27)],LIGHT)
        if name in ["plus","minus"]:
            p.box((6,14,25,17),c)
            if name=="plus": p.box((14,6,17,25),c)


ui_icons()
cols = 8
rows = (len(TILES) + cols - 1) // cols
atlas = Image.new("RGBA", (cols*32, rows*32))
for i, im in enumerate(TILES.values()):
    atlas.paste(im, (i % cols * 32, i // cols * 32))
atlas.save(OUT/"objects.png", optimize=True)
(OUT/"objects.json").write_text(json.dumps({"cols":cols,"rows":rows,"ids":list(TILES)}, ensure_ascii=False),encoding="utf-8")
