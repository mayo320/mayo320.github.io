//FIRE BULLETS
//player: which player is firing
//pos [x,y]
var fading_frame = 30;
function playerFire(newtime,player,pos,wepindex){
    // if(typeof(wepindex)!="number") wepindex = player.weapons.length;
    // if(wepindex > 0){
    //     if(player.weapons[wepindex-1]){//not null
    //         weaponFire(player.weapons[wepindex-1],pos);
    //     }
    //     setTimeout(function(){playerFire(player,pos,wepindex-1);},100);
    // }
    for(var i =0; i<player.weapons.length;i++){
        if(player.weapons[i] && newtime - player.weapons[i].lastFired > 1000/(hero.APS*hero.APSmod*player.weapons[i].APSmod*player.weapons[i].modAPS)){
            player.weapons[i].lastFired = newtime;
            pos = [hero.x + hero.width/2,hero.y + hero.height/2];
            weaponFire(player.weapons[i],pos);
        }
    }
}

function weaponFire(weapon,pos){
    var echo = 0;
    if(weapon.bulletTypes.beam){
        //firing lasers
        var beam_attr = {"color":"89, 126, 255", "damage": hero.damage*hero.damagemod*weapon.damagemod, "frame":fading_frame, "aim":false, "critChance":0, "critMult": 1};

        if(weapon.critChance){beam_attr.critChance = weapon.critChance; beam_attr.critMult = weapon.critMult;}

        for(var i = 0;i<weapon.mods.length;i++){
            if(weapon.mods[i]){
                if(weapon.mods[i].name == "Homing") beam_attr.aim = true;
                if(weapon.mods[i].name == "Pierce") beam_attr.pierce = 2;
                if(weapon.mods[i].name == "Ricochet") beam_attr.ricochet = 2;
                if(weapon.mods[i].name == "Vampire") beam_attr.vampire = 0.4;              if(weapon.mods[i].name == "Echo") echo = 1;

                beam_attr.damage *= weapon.mods[i].damagemod;
                if(weapon.mods[i].critChance) beam_attr.critChance += weapon.mods[i].critChance;
                if(weapon.mods[i].critMult) beam_attr.critMult += weapon.mods[i].critMult;
            }
        }


        singleBeam(pos, beam_attr);
        if( echo ){
            setTimeout(function(){
                singleBeam(pos, beam_attr);
            },150);
        }

    }else if(weapon.bulletTypes.tesla){
        //tesla value represents radius of detection
        var beam_attr = {"color":"89, 126, 255", "damage": hero.damage*hero.damagemod*weapon.damagemod, "frame":fading_frame, "aim":false, "critChance":0, "critMult": 1};

        if(weapon.critChance){beam_attr.critChance = weapon.critChance; beam_attr.critMult = weapon.critMult;}

        for(var i = 0;i<weapon.mods.length;i++){
            if(weapon.mods[i]){
                if(weapon.mods[i].name == "Vampire") beam_attr.vampire = 0.4;               if(weapon.mods[i].name == "Echo") echo = 1;

                beam_attr.damage *= weapon.mods[i].damagemod;
                if(weapon.mods[i].critChance) beam_attr.critChance += weapon.mods[i].critChance;
                if(weapon.mods[i].critMult) beam_attr.critMult += weapon.mods[i].critMult;
            }
        }
        zapEnemies([hero.x+hero.width/2,hero.y+hero.height/2], enemies, weapon.bulletTypes.tesla, beam_attr);
    }else if(weapon.bulletTypes.rocket){
        //fires missiles
        rocket_attr = {"angle":-Math.PI/2, "damage": hero.damage*hero.damagemod*weapon.damagemod, "speed": 1*weapon.bulletspeedmod* hero.bulletspeedmod, "homing":1, "acceleration":5, "critChance":0, "critMult": 1};

        if(weapon.critChance){rocket_attr.critChance = weapon.critChance; rocket_attr.critMult = weapon.critMult;}

        for(var i = 0;i<weapon.mods.length;i++){
            if(weapon.mods[i]){
                if(weapon.mods[i].name == "Vampire") rocket_attr.vampire = 0.4;
                if(weapon.mods[i].name == "Echo") echo = 1;

                rocket_attr.damage *= weapon.mods[i].damagemod;
                if(weapon.mods[i].critChance) beam_attr.critChance += weapon.mods[i].critChance;
                if(weapon.mods[i].critMult) beam_attr.critMult += weapon.mods[i].critMult;
            }
        }
        if(weapon.bulletTypes.blast){rocket_attr.blast = weapon.bulletTypes.blast;}

        shootRocket(-1,pos,rocket_attr,weapon.bulletTypes.rocket);
        if(echo) setTimeout(function(){shootRocket(-1,pos,rocket_attr,weapon.bulletTypes.rocket);},200);

    }else{
        //if weapon doesn't fire lasers or teslas
        bullet_attr = {"color":"rgb(89, 126, 255)", "damage": hero.damage*hero.damagemod*weapon.damagemod, "speed": 5*weapon.bulletspeedmod* hero.bulletspeedmod, "homing":0,"pierce":0,"pierced":[],"ricochet":0, "critChance":0, "critMult": 1};

        if(weapon.critChance){bullet_attr.critChance = weapon.critChance; bullet_attr.critMult = weapon.critMult;}
        var types = cloneJSON(weapon.bulletTypes);
        //checks if homing/piercing
        for(var i = 0;i<weapon.mods.length;i++){
            if(weapon.mods[i]){
                //not null
                if(weapon.mods[i].name == "Homing") {bullet_attr.homing = 1;}
                else if(weapon.mods[i].name == "Pierce") bullet_attr.pierce = 2;
                else if(weapon.mods[i].name == "Ricochet") bullet_attr.ricochet = 4;
                //vampire heals 40% of damage dealt
                else if(weapon.mods[i].name == "Vampire") bullet_attr.vampire = 0.4;
                else if(weapon.mods[i].name == "Splash") bullet_attr.splash = 2;
                else if(weapon.mods[i].name == "Echo") echo = 2;
                else if(weapon.mods[i].name == "Light") bullet_attr.speed = 5* (weapon.bulletspeedmod+0.5);

                bullet_attr.damage *= weapon.mods[i].damagemod;
                if(weapon.mods[i].bulletTypes){
                    if(weapon.mods[i].bulletTypes.spread) types.spread += weapon.mods[i].bulletTypes.spread;
                    if(weapon.mods[i].bulletTypes.cluster) types.cluster += weapon.mods[i].bulletTypes.cluster;
                    if(weapon.mods[i].bulletTypes.auto) types.auto += weapon.mods[i].bulletTypes.auto;
                    if(weapon.mods[i].bulletTypes.nova) types.nova += weapon.mods[i].bulletTypes.nova;
                }
                if(weapon.mods[i].critChance) beam_attr.critChance += weapon.mods[i].critChance;
                if(weapon.mods[i].critMult) beam_attr.critMult += weapon.mods[i].critMult;
            }
        }

        shoot(-1,pos,bullet_attr,types);
        if( echo ){
            setTimeout(function(){
                shoot(-1,pos,bullet_attr,types);
            },150);
        }

    }
}
function enemyFire(enemy){
    var pos = [enemy.x + enemy.width/2, enemy.y + enemy.height];
    enemy_bullet_attr = {"damage":enemy.damage,"speed":enemy.bulletSpeed,"color":"rgb(226, 97, 61)"};
    firingbullets = [];
    if(enemy.bulletSets) {
        firingbullets = cloneJSON(enemy.bulletSets[enemy.setIndex]);
        enemy.setIndex = enemy.setIndex+1 < enemy.bulletSets.length ? enemy.setIndex+1 : 0;
    }
    else if(enemy.bullets) firingbullets = cloneJSON(enemy.bullets);

    enemyShot(pos,enemy_bullet_attr,firingbullets);
    // if(enemy.bulletTypes.spread) spreadShot(1,pos,enemy_bullet_attr, enemy.bulletTypes.num_spread);
    // if(enemy.bulletTypes.cluster) clusterShot(1,pos,enemy_bullet_attr, enemy.bulletTypes.num_cluster);
    // if(enemy.bulletTypes.auto) autoShot(1,pos,enemy_bullet_attr, enemy.bulletTypes.num_auto);
    // if(enemy.bulletTypes.nova) novaShot(1,pos,enemy_bullet_attr, enemy.bulletTypes.nova);


}
//updates bullet directions (dx,dy)
var homing_threshold = 20; //homes after certain # of frames
function updateBulletDir(bullet){
    //if skill: umbrella
    if(bullet.attr.umbrella && bullet.attr.umbrella <= homing_threshold) bullet.attr.umbrella ++;
    else if(bullet.attr.umbrella){
        bullet.attr.damage = hero.damage*hero.damagemod;
        bullet.attr.pierce = 0;
        bullet.attr.umbrella = 0;
        bullet.dy *= -1;
        bullet.dx = getRandomInt(0,20)-10;
        if(!bullet.dy) bullet.dy += 1;
        if(!bullet.dx) bullet.dx += 1;
    }

    //if Ricochet
    if(bullet.attr.ricochet){
        if(bullet.x < 0 || bullet.x > canvas.width) {bullet.dx *= -1;bullet.attr.ricochet--;}
        if(bullet.y < 5 || bullet.y > canvas.height - 5){
            bullet.dx += getRandomInt(0,3) - 1;
            bullet.dy *= -1;
            bullet.attr.ricochet--;
        }
    }
    //if HOMING
    if((bullet.attr.homing && enemies.length) || (bullet.attr.aim && enemies.length)){
        if(bullet.attr.aim) {
            bullet.attr.homing=0;
        }
        if(bullet.target == 1)targetEnemy(bullet,[hero]);
        else targetEnemy(bullet,enemies);
    }

    //if ACCELERATION
    if(bullet.attr.acceleration){
        bullet.attr.speed += bullet.attr.acceleration/gameFrameDuration;
        var angle = Math.atan2(bullet.dy,bullet.dx);
        bullet.dx = bullet.attr.speed * Math.cos(angle);
        bullet.dy = bullet.attr.speed * Math.sin(angle);
    }
}
//TARGET AN enemy
function targetEnemy(bullet,enemies){
    //enemy targeting/selecting alg, needs improvement
    if(enemies.length){
        hp = enemies[0].hp;
        index = 0;
        for(var i = 0; i < enemies.length ; i++){
            if (enemies[i].hp < hp && $.inArray(enemies[i],bullet.attr.pierced) == -1) index = i;
        }
        enemy = enemies[index];
        x = enemy.x + enemy.width/2;
        y = enemy.y + enemy.height/2;

        dx = x - bullet.x;
        dy = y - bullet.y;

        d = Math.pow((Math.pow(dx,2) + Math.pow(dy,2)),0.5);
        dx = dx * bullet.attr.speed/d;
        dy = dy * bullet.attr.speed/d;

        changeDir(bullet,dx,dy);
    }
}
function changeDir(bullet,d2x,d2y){
    if(!bullet.attr || !bullet.attr.aim){
        bullet.dx += (d2x - bullet.dx)*2/gameFrameDuration;
        bullet.dy += (d2y - bullet.dy)*2/gameFrameDuration;
        var angle = Math.atan2(bullet.dy,bullet.dx);
        if(bullet.attr){
            bullet.dx = bullet.attr.speed * Math.cos(angle);
            bullet.dy = bullet.attr.speed * Math.sin(angle);
        }else{
            bullet.dx = bullet.speed *bullet.speedmod* Math.cos(angle);
            bullet.dy = bullet.speed *bullet.speedmod* Math.sin(angle);
        }
        if(bullet.attr && typeof(bullet.attr.angle) == "number") bullet.attr.angle = angle;
    }else{bullet.dx = d2x; bullet.dy = d2y;bullet.attr.aim--;}
}
// DEEP COPY attr
function CloneAttr(attr){
    return JSON.parse(JSON.stringify(attr));
}

//TYPES OF BULLETS
//THE ARGUMENTS ARE (dir:{-1,1} direction of bullet, pos:[x,y], attr:attribute of single bullet, num:how many bullets)
//attr : {"color": , "damage": , "speed": , "homing"}
// target -1 means fired by player, 1 means fired by enemies
function enemyShot(pos,attr,firingbullets){
    for (var i = 0; i < firingbullets.length; i++) {
        attr.speed = firingbullets[i].speed/gameFrameDuration;
        if(firingbullets[i].aim) attr.aim = 1;
        else attr.aim = 0;
        var dy,dx;
        if(firingbullets[i].angle){
            //angle is in deg
            dx = firingbullets[i].speed*Math.cos(firingbullets[i].angle*(Math.PI/180)) /gameFrameDuration;
            dy = firingbullets[i].speed*Math.sin(firingbullets[i].angle*(Math.PI/180)) /gameFrameDuration;
        }else{
            dx = firingbullets[i].dx;
            dy = firingbullets[i].dy;
        }

        bullets.push({"x":pos[0],"y":pos[1],"dy":dy,"dx":dx,"attr":CloneAttr(attr), "target":1 });
    }
}
function singleShot(dir,pos,attr,target){
    var target = target || dir;
    bullets.push({"x":pos[0],"y":pos[1],"dy":dir*attr.speed,"dx":0,"attr":CloneAttr(attr), "target":target });
}
function spreadShot(dir,pos,attr,num,target){
    var target = target || dir;
    var cos, sin;
    var factor = 5;
    factor *= 1 + num/2;
    for(var j = 1;j<=num/2;j++){
        cos = Math.cos(j*Math.PI/factor);
        sin = Math.sin(j*Math.PI/factor);
        bullets.push({"x":pos[0],"y":pos[1], "dy":dir*attr.speed*cos, "dx":-attr.speed*sin,"attr":CloneAttr(attr), "target":target});
        bullets.push({"x":pos[0],"y":pos[1], "dy":dir*attr.speed*cos, "dx": attr.speed*sin,"attr":CloneAttr(attr), "target":target });
    }
}
function clusterShot(dir,pos,attr,num,target){
    var target = target || dir;
    var x = pos[0],y = pos[1];
    var dis = 0;
    for(var j = 1; j <= num/2 ; j++){
        dis += 10;
        bullets.push({"x": x - dis/2,"y": y - dir*dis, "dy":dir*attr.speed, "dx":0,"attr":CloneAttr(attr), "target":target });
        bullets.push({"x": x + dis/2,"y": y - dir*dis, "dy":dir*attr.speed, "dx":0,"attr":CloneAttr(attr), "target":target });
    }
}
function autoShot(dir,pos,attr,num,target){
    var target = target || dir;
    if(num != 0){
        setTimeout(function(){
            singleShot(dir,pos,attr,target);
            autoShot(dir,pos,attr,num-1,target);
        },50);
    }
}
function novaShot(dir,pos,attr,num,target,splashenemy){
    //splashenemy is for the mod Splash
    var target = target || dir;
    var cos,sin;
    for(var j = 1; j<=num ;j++){
        cos = Math.cos(2* Math.PI/num * j);
        sin = Math.sin(2* Math.PI/num * j);
        var attr = CloneAttr(attr);
        if(splashenemy){attr.pierced = [splashenemy];}
        bullets.push({"x":pos[0],"y":pos[1], "dy": attr.speed*sin, "dx": attr.speed*cos,"attr":attr, "target":target });
    }
}
//due to tech difficulties.. the splashed bullets will also hit the target it triggered from, effectively multiplying bullet dmg by 1.8, because 8 more bullets with 10% dmg;
function splashShot(bullet,enemy,num, special_attr){
    dir = bullet.target;
    pos = [bullet.x,bullet.y];
    var bullet_attr = bullet.attr;
    bullet_attr.splash = 0;
    bullet_attr.pierce = 1;
    bullet_attr.damage *= 0.5;
    bullet_attr.pierced.push(enemy);
    if(special_attr) bullet_attr = special_attr;
    novaShot(dir,pos,bullet_attr,num,dir,enemy);
}
//types: {"spread":2,"cluster":0,"auto":1, etc...}
//usually just players[i].bulletTypes as arg for types is good
//echo ONCE, with the 'num' of each type
function shoot(dir,pos,attr,types,target){
    target = target || dir;
    singleShot(dir,pos,attr,target);
    if(types.spread) spreadShot(dir,pos,attr,types.spread,target);
    if(types.cluster) clusterShot(dir,pos,attr,types.cluster,target);
    if(types.auto) autoShot(dir,pos,attr,types.auto,target);
    if(types.nova) novaShot(dir,pos,attr,types.nova,target);
}

//BEAMS/lasers
function singleBeam(pos,attr){
    x = pos[0],y=0;
    if(attr.aim && enemies.length){
        hp = enemies[0].hp;
        index = 0;
        for(var i = 0; i < enemies.length ; i++){
            if (enemies[i].hp < hp) index = i;
        }
        enemy = enemies[index];
        x = enemy.x + enemy.width/2;
        y = enemy.y + enemy.height/2;
    }else{
        for(var i = 0; i < enemies.length ; i++){
            if (x >= enemies[i].x && x <= enemies[i].x + enemies[i].width && enemies[i].y > y) y=enemies[i].y+enemies[i].height/2;
        }
    }
    if(attr.pierce){
        x = 50*(x-pos[0]) + x;
        y = 50*(y-pos[1]) + y;
    }

    beams.push({"x":pos[0],"y":pos[1],"x2":x,"y2":y,"damage":attr.damage,"attr":CloneAttr(attr),"hit":false});

    //ricochet bounces off walls
    var ptx = pos[0]; var pty = pos[1];
    var _from;
    for(var i = 0; i<=attr.ricochet;i++){
        attr.ricochet--;
        //x = m*y + b
        m = (x-ptx)/(y-pty);
        b = ptx - m*pty;
        if(lineIntersect(0,0,0,canvas.height,ptx,pty,x,y) && _from != 0){
            //left wall
            _from = 0;
            ptx = 0;
            pty = Math.round((ptx - b)/m);
        }else if(lineIntersect(0,0,canvas.width,0,ptx,pty,x,y) && _from != 1){
            //top wall
            _from = 1;
            pty = 0;
            ptx = Math.round(m*pty + b);
        }else if(lineIntersect(canvas.width,0,canvas.width,canvas.height,ptx,pty,x,y) && _from != 2){
            //right wall
            _from = 2;
            ptx = canvas.width;
            pty = Math.round((ptx - b)/m);
        }else if(lineIntersect(0,canvas.height,canvas.width,canvas.height,ptx,pty,x,y) && _from != 3){
            //bottom wall
            _from = 3;
            pty = canvas.height;
            ptx = Math.round(m*pty + b);
        }else{
            ptx = x; pty = y;
        }
        x2 = getRandomInt(5,canvas.width-5);
        y2 = getRandomInt(5,canvas.height-5);
        x2 = 50*(x2-ptx) + x2;
        y2 = 50*(y2-pty) + y2;

        beams.push({"x":ptx,"y":pty,"x2":x2,"y2":y2,"damage":attr.damage,"attr":CloneAttr(attr),"hit":false});

        x=x2;y=y2;

    }
}
//TESLAS
function length(x1,y1,x2,y2){
    return Math.pow((Math.pow((x2-x1),2)+Math.pow((y2-y1),2)),0.5);
}
function inRange(x1,y1,x2,y2,r2){
    return r2 >= length(x1,y1,x2,y2);
}
function zap(pos,enemy,attr){
    //pos1 is hero position
    var change = getRandomInt(0,5);
    var x1 = pos[0], y1 = pos[1];
    var x2 = (enemy.x+ enemy.width/2), y2 = (enemy.y + enemy.height/2);

    for(var i = 0; i < change; i++){
        var r = length(x1,y1, x2,y2);
        var angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        angle += getRandomInt(0,90) - 45;
        angle *= Math.PI/180;
        var r1 = getRandomInt(3,7)/10 * r;
        var dx = r1*Math.cos(angle);
        var dy = r1*Math.sin(angle);
        beams.push({"x":x1,"y":y1,"x2":x1+dx,"y2":y1+dy, "damage":attr.damage,"attr":CloneAttr(attr),"hit":false});

        x1 = x1+dx, y1 = y1+dy;
    }

    beams.push({"x":x1,"y":y1,"x2": (enemy.x + enemy.width/2),"y2":(enemy.y + enemy.height/2),"damage":attr.damage,"attr":CloneAttr(attr),"hit":false});
}
function zapEnemies(pos, arr, tesla, attr){
    var num_hit = 0;
    for(var i = 0;i<arr.length; i++){
        if(inRange(arr[i].x+ arr[i].width/2, arr[i].y + arr[i].height/2, pos[0], pos[1], tesla.radius)){
            num_hit++;
            zap(pos,arr[i],attr);

            if(num_hit >= tesla.targets) break;
        }
    }
}
//ROCKETS DUUUDE
function shootRocket(dir,pos,attr,num){
    attr.angle = -Math.PI/2;
    var offset = 15;
    for(var i =1; i<=num/2; i++){
        bullets.push({"attr":cloneJSON(attr),"x":pos[0]+ (i)*offset,"y":pos[1],"dx":0, "dy":dir*attr.speed, "target":dir,"missile":true});
        bullets.push({"attr":cloneJSON(attr),"x":pos[0]- (i)*offset,"y":pos[1],"dx":0, "dy":dir*attr.speed, "target":dir,"missile":true});
    }
    if(num%2 != 0)bullets.push({"attr":cloneJSON(attr),"x":pos[0],"y":pos[1]-15,"dx":0, "dy":dir*attr.speed, "target":dir,"missile":true});
}

//AOE damage
function aoeDmg(arr, obj){
    var maxtargets = obj.aoe.targets;
    //attr = {x: ,y: , radius: }
    for(var i = 0; i< arr.length ; i++){
        if(maxtargets > 0 && inRange(arr[i].x, arr[i].y, obj.x, obj.y, obj.aoe.radius)){
            if(obj.damage)obj.attr = {"damage":obj.damage};
            damageEnemy(obj,arr[i]);
            maxtargets--;
        }
    }
}
