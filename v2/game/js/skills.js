var skillbeamcolor = "28, 213, 96";
var skillcolor = "rgb(" + skillbeamcolor + ")";
function playerSkill(num,player,pos,newtime){

    bullet_attr = {"color":skillcolor, "damage": player.damage*player.damagemod, "speed": 5*player.bulletspeedmod,"APS":player.APS*player.APSmod, "homing":0,"pierce":0, "acceleration":5, "pierced":[]};

    var skill;
    if(newtime - player.skills[num].lastused > player.skills[num].cooldown) {
        skill = player.skills[num].id;
        player.skills[num].lastused = newtime;
        $(skillbut[num]).height("100%");
    }
    if(skill==201){
        //spray & pray
        bullet_attr.damage*=2;
        spraySkill(-1,pos,bullet_attr,80);
    }else if(skill==204){
        //seeking dragon
        bullet_attr.homing = 1;
        bullet_attr.damage *= 0.4;
        seekingDragon(-1,pos,bullet_attr);
    }else if(skill==205){
        //umbrella
        bullet_attr.umbrella = 1;
        bullet_attr.speed *= 2;
        bullet_attr.pierce = 5;
        bullet_attr.damage = 0;
        umbrella(-1,pos,bullet_attr,2);
    }else if(skill==206){
        //homing sphere
        chainReaction(-1,pos,bullet_attr);
    }else if(skill==207){
        //machine gun
        bullet_attr.speed = 10;
        bullet_attr.damage *= 1.5;
        machineGun(-1,pos,bullet_attr,50);
    }else if(skill == 203){
        //laser frenzy
        bullet_attr.color = skillbeamcolor;
        bullet_attr.frame = fading_frame;
        bullet_attr.ricochet = 1;
        bullet_attr.damage *= 2;
        bullet_attr.pierce = 5;
        beamFrenzy(-1,pos,bullet_attr,50);
    }else if(skill == 202){
        //foshan clap
        bullet_attr.color = skillbeamcolor;
        bullet_attr.frame = fading_frame;
        bullet_attr.damage *= 1.5;
        bullet_attr.pierce = 5;
        foshanClap(-1,pos,bullet_attr,25);
    }else if(skill == 208){
        //Barrage
        bullet_attr.color = skillbeamcolor;
        bullet_attr.frame = fading_frame;
        barrage(-1,pos,bullet_attr,30);
    }else if(skill == 209){
        //thunder Storm
        bullet_attr.color = skillbeamcolor;
        bullet_attr.frame = fading_frame;
        bullet_attr.damage *= 0.15;
        bullet_attr.APS *= 6;
        thunderStorm(-1,pos,bullet_attr,0);
    }else if(skill == 210){
        //blackhole
        bullet_attr.damage *= 0.1;
        bullet_attr.APS *= 5;
        blackhole(-1,pos,bullet_attr,0);
    }else if(skill == 211){
        //sacred space
        bullet_attr.damage *= 0;
        bullet_attr.APS *= 5;
        sacredSpace(-1,pos,bullet_attr,0);
    }else if(skill == 212){
        //death parade
        bullet_attr.damage *= 2;
        bullet_attr.homing = 1;
        bullet_attr.acceleration = 2;
        deathParade(-1,pos,bullet_attr,5);
    }
}

function spraySkill(dir,pos,attr,at){
    if(at > 0){
        var angle = at/20 * Math.PI/2;
        var dy = Math.abs(attr.speed*Math.cos(angle));
        var dx = Math.abs(attr.speed*Math.sin(angle));
        bullets.push({"x":pos[0],"y":pos[1],"dy":dir*dy,"dx":dx,"attr":CloneAttr(attr), "target":dir });
        bullets.push({"x":pos[0],"y":pos[1],"dy":dir*dy,"dx":-dx,"attr":CloneAttr(attr), "target":dir });
        setTimeout(function(){
            spraySkill(dir,[hero.x+hero.width/2,hero.y],attr,at-2);
        },50);
    }
}

function seekingDragon(dir,pos,attr){
    autoShot(-1,pos,attr,20);
}

function umbrella(dir,pos,attr,at){
    if(at > 0){
        // singleShot(1,pos,attr,-1);
        // spreadShot(1,pos,attr,20,-1);
        autoShot(-1,pos,attr,11,-1);
        autoShot(-1,pos,attr,11,-1);
        setTimeout(function(){
            umbrella(dir,[hero.x+hero.width/2,hero.y],attr,at-1);
        },50);
    }
}
function chainReaction(dir, pos, attr){
    //attr.splash = 1;
    attr.homing = 1;
    attr.damage *= 0.5;
    attr.speed *= 1.4;
    novaShot(-1,pos,attr,40);
}
function machineGun(dir,pos,attr,at){
    if(at>0){
        singleShot(dir,pos,attr);
        targetEnemy(bullets[bullets.length-1],enemies);
        bullets[bullets.length-1].dy += getRandomInt(0,3)-1;
        bullets[bullets.length-1].dx += getRandomInt(0,3)-1;
        setTimeout(function(){
            machineGun(dir,[hero.x,hero.y],attr,at-1)
        },20);
    }
}
function beamFrenzy(dir,pos,attr,at){
    //pos doesn't really matter lol
    if(at>0){
        beams.push({"x":0,"y":getRandomInt(5,canvas.height-5),"x2":canvas.width,"y2":getRandomInt(5,canvas.height-5),"damage":attr.damage,"attr":CloneAttr(attr),"hit":false});
        setTimeout(function(){
            beamFrenzy(dir,[hero.x,hero.y],attr,at-1);
        },50);
    }
}
function foshanClap(dir,pos,attr,at){
    if(at>=0){
        angle = Math.PI/2 * at/40
        var dy = Math.abs(250*Math.cos(angle));
        var dx = Math.abs(250*Math.sin(angle));
        beams.push({"x":pos[0],"y":pos[1],"x2":pos[0]+dx,"y2":pos[1]-dy,"damage":attr.damage,"attr":CloneAttr(attr),"hit":false});
        beams.push({"x":pos[0],"y":pos[1],"x2":pos[0]-dx,"y2":pos[1]-dy,"damage":attr.damage,"attr":CloneAttr(attr),"hit":false});
        setTimeout(function(){
            foshanClap(dir,[hero.x+hero.width/2,hero.y],attr,at-1);
        },20);
    }
}
function barrage(dir,pos,attr,at){
    if(at>0){
        pos[0] += getRandomInt(0,12)-6;
        singleBeam(pos,attr);
        setTimeout(function(){
            barrage(dir,[hero.x+hero.width/2,hero.y+hero.height/2],attr,at-1);
        },50);
    }
}
function thunderStorm(dir,pos,attr,at){
    var x = pos[0], y = pos[1] - 150;
    var dmgovertime = {"x":x,"y":y,"attr":cloneJSON(attr),"duration":5000, "aoe":{"radius":150,"targets":3},"lastused":0,"color":"rgba(109, 107, 190,0.2)", "type":"zap"};
    dots.push(dmgovertime);
}
function blackhole(dir,pos,attr,at){
    var x = pos[0], y = pos[1] - 150;
    var duration = 6000;
    var dmgovertime = {"x":x,"y":y,"attr":cloneJSON(attr),"duration":duration, "aoe":{"radius":190,"targets":90},"lastused":0,"color":"rgba(0, 0, 0, 0.51)", "type":"blackhole"};
    var ani = cloneJSON(data.SFX.blackhole);
    ani.x = x; ani.y = y;
    ani.animation.loop = Math.round(duration/ani.animation.frameDuration/ani.animation.totalFrames);
    special_effects.push(ani);
    dots.push(dmgovertime);
}
function sacredSpace(dir,pos,attr,at){
    var x = pos[0], y = pos[1];
    var duration = 2000;
    var dmgovertime = {"x":x,"y":y,"attr":cloneJSON(attr),"duration":duration, "aoe":{"radius":130,"targets":100},"lastused":0,"color":"rgba(212, 214, 86, 0.5)", "type":"shield"};
    dots.push(dmgovertime);
}
function deathParade(dir,pos,attr,at){
    if(at>0){
        shootRocket(dir,pos,attr,3);
        setTimeout(function(){
            deathParade(dir,[hero.x+hero.width/2,hero.y+hero.height/2],attr,at-1);
        },150);
    }
}
