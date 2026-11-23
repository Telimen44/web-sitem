"""Build pose sheets, the game's hand-lettered title, and educational TL illustrations."""
from PIL import Image, ImageDraw, ImageFilter
from draw_atlases import Pen, OUT, INK, DEEP, CREAM, WHITE, GOLD, GREEN, JADE, RED, BLUE, SKIN, LIGHT, HAIR, TILES

FRAMES = ["idle","blink","talk","talk2","leftstep","stride","rightstep","reach","carry","happy","pet","front","frontstep","back","backstep","pat"]
CAST = ["child","mother","cashier","child2"]
W, H = 40, 54


def sprite(who, pose):
    p=Pen((W,H))
    child=who in ["child","child2"]
    mom=who=="mother"
    front=pose in ["front","frontstep","happy"]
    back=pose in ["back","backstep"]
    moving=pose in ["leftstep","stride","rightstep","frontstep","backstep"]
    bob=1 if pose in ["stride","rightstep","frontstep","backstep","happy","talk2"] else 0
    upper=5 if child else 0
    s=upper+bob
    coat,shade=(("#d88a36","#ad5c30") if child else ("#a64c48","#743f43") if mom else ("#77a99f","#4f817b"))
    if who=="child2": coat,shade="#b67673","#8b5358"
    # Every actor is anchored at the same baseline in all poses.
    step=-3 if pose in ["leftstep","frontstep","backstep"] else 3 if pose=="rightstep" else 0
    if mom:
        p.poly([(12,33),(24,32),(29,47),(26,49),(10,49),(8,47)],"#637b54")
        p.line([(14,36),(12,46),(16,46)],"#829164",2)
        p.line([(22,36),(25,46)],"#45634c",2)
    else:
        for x,delta in [(12,-step),(21,step)]:
            p.poly([(x,36),(x+6,36),(x+5+delta,48),(x+delta,49)],"#385a61" if child else "#454e4a")
            p.line([(x+2,39),(x+1+delta,46)],"#65807b",2)
    for x,delta in [(11,-step),(21,step)]:
        p.poly([(x+delta,47),(x+5+delta,47),(x+8+delta,49),(x+8+delta,51),(x+delta,51)],"#694633")
        p.line([(x+delta+2,48),(x+delta+5,48)],"#bb8253")
    # Shirt, collar, textile folds and apron or vest.
    p.poly([(14,24+s),(21,23+s),(26,26+s),(28,36+s),(24,39+s),(11,39+s),(8,36+s),(10,27+s)],coat)
    p.poly([(10,28+s),(14,27+s),(13,35+s),(12,38+s),(10,36+s)],shade,None)
    p.line([(15,37+s),(24,37+s)],shade)
    if child:
        p.poly([(13,26+s),(16,25+s),(18,28+s),(21,25+s),(24,26+s),(23,37+s),(13,38+s)],"#735b80" if who=="child2" else "#528879")
        p.line([(16,29+s),(16,36+s)],"#8eb396"); p.box((18,31+s,18,32+s),GOLD)
    elif mom:
        p.poly([(14,28+s),(20,28+s),(23,31+s),(23,34+s),(27,44+s),(12,45+s),(14,35+s)],"#e2c8a0")
        p.line([(15,31+s),(15,34+s),(21,34+s)],WHITE)
        for x in [15,20,24]: p.dot((x,42+s),RED)
    else:
        p.poly([(14,27+s),(16,27+s),(16,30+s),(22,30+s),(22,27+s),(24,27+s),(26,42+s),(12,42+s)],"#2e6f66")
        p.box((16,33+s,22,37+s),"#548d79",INK); p.dot((22,30+s),GOLD)
    p.box((15,22+s,21,26+s),SKIN,DEEP)
    # Head at three-quarter view, with nose silhouette and ear.
    face=[(11,10+s),(16,7+s),(22,8+s),(26,12+s),(26,16+s),(28,18+s),
          (26,20+s),(25,23+s),(21,25+s),(16,24+s),(12,21+s),(9,19+s),(8,14+s)]
    p.poly(face,LIGHT)
    p.poly([(10,15+s),(13,15+s),(14,19+s),(18,22+s),(24,22+s),(22,24+s),(16,23+s),(12,20+s),(10,20+s)],SKIN,None)
    p.oval((9,15+s,13,20+s),SKIN,DEEP); p.dot((11,17+s),DEEP)
    hair="#766253" if who=="cashier" else HAIR
    hairlight="#ad9982" if who=="cashier" else "#965c37"
    if who=="child2":
        hair,hairlight="#443431","#795249"
        p.oval((3,3+s,13,14+s),hair,INK)
        p.line([(5,7+s),(8,5+s),(11,6+s)],hairlight,2)
        p.box((8,10+s,11,12+s),RED,DEEP)
    p.poly([(8,18+s),(6,15+s),(6,10+s),(8,9+s),(8,6+s),(12,6+s),(14,3+s),(21,3+s),(23,5+s),
            (26,5+s),(28,9+s),(27,12+s),(24,13+s),(22,10+s),(19,13+s),(16,14+s),(15,12+s),
            (12,16+s),(12,18+s),(10,16+s)],hair)
    p.line([(9,10+s),(12,7+s),(17,5+s),(21,5+s)],hairlight,2)
    p.line([(17,10+s),(20,7+s),(24,7+s)],hairlight)
    if mom:
        p.oval((3,12+s,11,22+s),HAIR)
        p.poly([(5,16+s),(5,9+s),(8,4+s),(15,2+s),(22,3+s),(26,6+s),(24,8+s),(20,6+s),(15,6+s),(9,11+s),(8,17+s)],"#ead6ab")
        p.line([(7,10+s),(11,6+s),(17,4+s)],WHITE)
        for xy in [(8,8+s),(14,5+s),(20,5+s)]: p.dot(xy,RED)
    if back:
        p.poly([(8,12+s),(11,8+s),(23,8+s),(27,13+s),(25,20+s),(21,23+s),(14,22+s),(9,20+s)],hair)
        p.line([(11,16+s),(15,19+s),(22,19+s)],hairlight,2)
    else:
        for x in ([15,22] if front else [18,24]):
            if pose in ["blink","happy","pet","pat"]:
                p.line([(x-1,16+s),(x,15+s),(x+1,16+s)],INK)
            else:
                p.box((x,15+s,x+1,17+s),INK); p.dot((x,15+s),WHITE)
        p.line([(14,19+s),(16,19+s)],"#df8b70",2)
        if who=="cashier":
            p.line([(19,20+s),(22,19+s),(25,20+s)],hair,2)
        if pose in ["happy","pet","pat"]:
            p.line([(18,20+s),(20,22+s),(22,22+s),(25,19+s)],DEEP,2)
            p.line([(20,21+s),(22,21+s)],WHITE)
        elif pose in ["talk","talk2"]:
            p.box((20,20+s,23,22+s),DEEP); p.line([(21,22+s),(23,22+s)],"#e48d78")
        else: p.line([(20,21+s),(22,22+s),(24,21+s)],DEEP)
    # Sleeve, forearm and open hand move as a unit.
    forward=pose in ["reach","pet","talk2","carry"]
    armY=28+s
    if pose in ["pet","pat"]:
        hand=(34,19+s) if pose=="pet" else (35,17+s); elbow=(29,27+s)
    elif forward:
        hand=(34,32+s); elbow=(29,34+s)
    elif moving:
        hand=(24+step,38+s); elbow=(24+step,33+s)
    elif pose=="happy":
        hand=(32,22+s); elbow=(29,29+s)
    else:
        hand=(26,37+s); elbow=(26,33+s)
    p.line([(23,armY),elbow,hand],INK,5)
    p.line([elbow,hand],SKIN,3); p.oval((hand[0]-2,hand[1]-2,hand[0]+2,hand[1]+1),LIGHT,DEEP)
    p.line([(23,armY),elbow],coat,4); p.line([(22,armY),(24,armY+2)],"#f1bb83",1)
    if moving or pose=="happy":
        lx=8-step if moving else 6
        ly=37+s if moving else 23+s
        p.line([(12,28+s),(9,32+s),(lx,ly)],INK,4)
        p.line([(9,32+s),(lx,ly)],SKIN,2); p.line([(12,28+s),(9,32+s)],coat,3)
    return p.im


sheet=Image.new("RGBA",(W*len(FRAMES),H*len(CAST)))
for row,who in enumerate(CAST):
    for col,pose in enumerate(FRAMES):
        sheet.paste(sprite(who,pose),(col*W,row*H))
sheet.save(OUT/"cast.png",optimize=True)
head=sprite("child","happy").crop((4,6,33,35))
head.save(OUT/"portrait.png",optimize=True)
sprite("child2","happy").crop((2,6,31,35)).save(OUT/"portrait-berry.png",optimize=True)

letters={
"A":["01110","11011","11011","11111","11011","11011","11011"],
"M":["11011","11111","11111","11011","11011","11011","11011"],
"H":["11011","11011","11011","11111","11011","11011","11011"],
"L":["11000","11000","11000","11000","11000","11000","11111"],
"E":["11111","11000","11000","11110","11000","11000","11111"],
"R":["11110","11011","11011","11110","11100","11010","11011"],
"K":["11011","11011","11110","11100","11110","11011","11011"],
"T":["11111","11111","00100","00100","00100","00100","00100"],
"İ":["1","0","1","1","1","1","1","1","1"],
"0":["111","101","101","101","111"],"1":["010","110","010","010","111"],
"2":["111","001","111","100","111"],"5":["111","100","111","001","111"]
}


def lettering(word,scale,top,bottom):
    h=max(len(letters[c]) for c in word)
    width=sum(len(letters[c][0])+1 for c in word)-1
    text=Image.new("L",(width*scale+20,h*scale+20)); d=ImageDraw.Draw(text)
    x=9
    for char in word:
        pat=letters[char]; y=8+(h-len(pat))*scale
        for row in pat:
            for i,v in enumerate(row):
                if v=="1": d.rectangle((x+i*scale,y,x+(i+1)*scale-1,y+scale-1),fill=255)
            y+=scale
        x+=(len(pat[0])+1)*scale
    out=Image.new("RGBA",text.size)
    border=text.filter(ImageFilter.MaxFilter(7))
    for dy,color in [(5,"#332f29"),(3,"#60452e"),(1,"#3d382a"),(0,"#3a3a2c")]:
        layer=Image.new("RGBA",out.size,color); mask=Image.new("L",out.size); mask.paste(border,(0,dy)); out.paste(layer,(0,0),mask)
    layer=Image.new("RGBA",out.size,top); d=ImageDraw.Draw(layer)
    d.rectangle((0,8+h*scale*0.57,width*scale+12,out.height),fill=bottom)
    out.paste(layer,(0,0),text)
    return out.crop(out.getbbox())


letters.update({
    "M":["110000011","111000111","111101111","110111011","110010011","110000011","110000011","110000011","110000011"],
    "A":["0011100","0111110","1100011","1100011","1100011","1111111","1100011","1100011","1100011"],
    "H":["1100011","1100011","1100011","1100011","1111111","1111111","1100011","1100011","1100011"],
    "L":["110000","110000","110000","110000","110000","110000","110000","111111","111111"],
    "E":["1111111","1111111","1100000","1100000","1111110","1100000","1100000","1111111","1111111"],
    "R":["1111110","1111111","1100011","1100011","1111110","1111000","1101100","1100110","1100011"],
    "K":["1100011","1100110","1101100","1111000","1111000","1101100","1100110","1100011","1100011"],
    "T":["11111111","11111111","00011000","00011000","00011000","00011000","00011000","00011000","00011000"],
    "İ":["0110","0110","0000","1111","1111","0110","0110","0110","0110","0110","1111","1111"]
})
top=lettering("MAHALLE",4,"#fff6d4","#f7dda0")
bottom=lettering("MARKETİ",4,"#ffdb76","#f5b14c")
logo=Image.new("RGBA",(max(top.width,bottom.width)+8,top.height+bottom.height+1))
logo.alpha_composite(top,((logo.width-top.width)//2,0))
logo.alpha_composite(bottom,((logo.width-bottom.width)//2,top.height+1))
logo.save(OUT/"title.png",optimize=True)

colors={"b5":("#d7c09a","#907957"),"b10":("#efb6a2","#aa665a"),"b20":("#b4cf9b","#59865f"),
        "b50":("#eac096","#a56c49"),"b100":("#a5c9d9","#537e96"),"b200":("#d2bcdb","#836693"),
        "c1":("#d5c68b","#827956"),"c5":("#e6cb83","#8a7954")}
cash=Image.new("RGBA",(80*4,40*2))
for i,(kind,(fg,edge)) in enumerate(colors.items()):
    p=Pen((80,40)); value=kind[1:]
    if kind[0]=="b":
        p.box((2,3,77,36),edge,INK); p.box((4,5,75,34),fg)
        p.box((6,7,73,32),fg,edge); p.box((9,10,70,29),fg,edge)
        for x,y in [(7,8),(68,8),(7,27),(68,27)]: p.box((x,y,x+4,y+4),edge)
        p.oval((11,10,31,29),fg,edge); p.oval((14,12,28,27),fg,edge)
        p.line([(18,25),(25,14)],edge,2)
        for x,y in [(19,21),(21,17)]: p.line([(x-3,y-1),(x,y+1),(x+4,y)],edge,2)
        start=51-(len(value)*12-3)//2
        for c in value:
            for ry,row in enumerate(letters[c]):
                for rx,v in enumerate(row):
                    if v=="1": p.box((start+rx*3,12+ry*3,start+rx*3+2,14+ry*3),INK)
            start+=12
    else:
        p.oval((22,2,57,37),edge,INK); p.oval((24,3,55,34),fg,edge); p.oval((28,7,51,31),"#d3d5b6" if kind=="c1" else "#e0b85b",edge)
        for ry,row in enumerate(letters[value]):
            for rx,v in enumerate(row):
                if v=="1": p.box((35+rx*3,12+ry*3,37+rx*3,14+ry*3),INK)
    cash.paste(p.im,((i%4)*80,(i//4)*40))
cash.save(OUT/"money.png",optimize=True)
