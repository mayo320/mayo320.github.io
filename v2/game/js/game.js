//these setups are required
var bullets = [];
var beams = [];
var rockets = [];
var dots = [];
var special_effects = [];
var texts = [];
var enemies = [];
var hero;
var buffs = [];
var playercontrol = true;

//random min(inclusive) max(exclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
var i=0;
var $hpBar;
var player_speed;
$(document).ready(function(){

    //keyfunctions uses keymaster.js : https://raw.githubusercontent.com/madrobby/keymaster/master/keymaster.js

    $hpBar = $(".hp-bar .HP");
    $(window).keypress(function(e){
        if((e.charCode == 112 || e.keyCode==112  || e.charCode==27 || e.keyCode==27) && !$(".game_page").hasClass("hide"))
        {
            if($(".pause_menu").css("display") == "none"){
                pauseGame(true);
            }else{
                pauseGame(false);
            }
        }else if(e.charCode == 122 || e.keyCode==122){
            playerSkill(0,hero,[hero.x+hero.width/2,hero.y],newtime);
        }else if(e.charCode == 120 || e.keyCode==120){
            playerSkill(1,hero,[hero.x+hero.width/2,hero.y],newtime);
        }else if(e.charCode == 99 || e.keyCode==99){
            playerSkill(2,hero,[hero.x+hero.width/2,hero.y],newtime);
        }
    });
});

//DETECTING COLLISIONS, obj1 is point, obj2 is rect
function collision(obj1,obj2){
    if(obj1.x >= obj2.x && obj1.x <= obj2.x + obj2.width && obj1.y >= obj2.y && obj1.y <= obj2.y+obj2.height){
        return true;
    }
    return false;
}
function damageEnemy(obj,enemy){
    //console.log("enemy: ",enemy,"bullet: ",obj);
    var color = "255,255,255";
    var size = 20;
    var damage = obj.attr.damage;
    if (obj.attr.critChance && Math.random() <= obj.attr.critChance) {
        enemy.hp -= obj.attr.critMult * obj.attr.damage;
        color = "242, 113, 113";
        size = 30;
        damage*= obj.attr.critMult;
    }else{
        enemy.hp -= obj.attr.damage;
    }

    texts.push({"x":enemy.x+enemy.width/2-30,"y":enemy.y+enemy.height/2,"color":color, "frame":fading_frame,"val":Math.round(damage*10)/10, "size":size});
    if(obj.attr.vampire) healPlayer(hero,obj.attr.vampire * damage);
    if(obj.attr.splash) splashShot(obj,enemy,8,obj.special_attr);
    if(obj.attr.blast){
        aoeDmg(enemies, {"x":obj.x,"y":obj.y, "aoe":obj.attr.blast, "damage":damage/2});
        var aoe = cloneJSON(data.SFX.generalAOE);
        aoe.x = obj.x; aoe.y = obj.y; aoe.radius = obj.attr.blast.radius;
        aoe.color = "198, 125, 57";
        special_effects.push(aoe);
    }
    if(obj.missile) {
        var ex = cloneJSON(data.SFX.explosion);
        ex.x = enemy.x+enemy.width/2; ex.y = enemy.y+enemy.height/2;
        special_effects.push(ex);
    }
}
function collideEnemy(obj,arr){
    if(obj.target >= 0) return false;
    for(var j = 0;j<arr.length;j++){
        if(collision(obj,arr[j])) {
            if(obj.attr.pierce){
                if($.inArray(arr[j],obj.attr.pierced) == -1){
                    obj.attr.pierce--;
                    obj.attr.pierced.push(arr[j]);
                    damageEnemy(obj,arr[j]);
                    return false;
                }
            }else{
                damageEnemy(obj,arr[j]);
                return true;
            }
        }
    }
    return false;
}
function BeamEnemy(beam,arr){
        for(var j = 0;j<arr.length;j++){
            if(collideBeam(beam,arr[j])){
                damageEnemy(beam,arr[j]);
            }
        }
}
function collideBeam(beam,obj){
    x1 = Math.round(beam.x); y1 = Math.round(beam.y); x2 = Math.round(beam.x2); y2 = Math.round(beam.y2);
    x3 = Math.round(obj.x); y3 = Math.round(obj.y);
    //lineintersect doesn't work well with decimals.. o-o
    //checks if beam intersects any of that line that compose the obj (rect)
    if( lineIntersect(x1,y1,x2,y2,x3,obj.y,x3+obj.width,y3) || lineIntersect(x1,y1,x2,y2,x3+obj.width,y3,x3+obj.width,y3+obj.height) || lineIntersect(x1,y1,x2,y2,x3,y3+obj.height,x3+obj.width,y3+obj.height) || lineIntersect(x1,y1,x2,y2,x3,y3,x3,y3+obj.height)){
        return true;
    }
    return false;
}
function lineIntersect(x1,y1,x2,y2, x3,y3,x4,y4) {
    var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    if (isNaN(x)||isNaN(y)) {
        return false;
    } else {
        if (x1>=x2) {
            if (!(x2<=x&&x<=x1)) {return false;}
        } else {
            if (!(x1<=x&&x<=x2)) {return false;}
        }
        if (y1>=y2) {
            if (!(y2<=y&&y<=y1)) {return false;}
        } else {
            if (!(y1<=y&&y<=y2)) {return false;}
        }
        if (x3>=x4) {
            if (!(x4<=x&&x<=x3)) {return false;}
        } else {
            if (!(x3<=x&&x<=x4)) {return false;}
        }
        if (y3>=y4) {
            if (!(y4<=y&&y<=y3)) {return false;}
        } else {
            if (!(y3<=y&&y<=y4)) {return false;}
        }
    }
    return true;
}
function collidePlayer(obj,obj2){
    // target -1 means fired by player
    if(obj.target < 0) return false;
        if(collision(obj,obj2)) {
            hero.hp -= obj.attr.damage;
            console.log(hero.name + " took " + obj.attr.damage + " damage, has " + hero.hp + " HP left");
            updateHP(hero);
            return true;
        }

    return false;
}

function updateHP(player){
    $hpBar.width(player.hp/(player.fullhp*player.hpmod) * 100 + "%");
}
function healPlayer(player,hp){
    player.hp += hp;
    texts.push({"x":player.x+player.width/2,"y":player.y+player.height/2,"color":"98, 201, 114","frame":fading_frame,"val":Math.round(hp*10)/10,"size":20});
    if(player.hp > player.fullhp*player.hpmod) player.hp = player.fullhp*player.hpmod;
    updateHP(player);
}


function addBuff(){
    var type;
    var rand = getRandomInt(0,5);
    var value = 2;

    //spawns only HP Regain
    rand = 4;

    if(rand == 0){type = "spread";}
    else if(rand == 1){type = "cluster";}
    else if(rand == 2){
        type = "APS";
        value = 0.4;
    }else if(rand == 3){
        type = "damage";
        value = 0.5;
    }else if(rand == 4){
        type = "hp";
        value = 5;
    }
    buffs.push({"x":getRandomInt(0,canvas.width-30),"y":-100,"dy":2,"dx":0, "type":type,"value":value, "color":"rgb(95, 122, 25)"});
}

var score = 0;
//UPDATE GAME FRAME
var newtime;
var lastFired = 0;
var lastHealed = lastFired;
var frameElapsed = 0;
function update(){

    frameElapsed++;
    newtime = frameElapsed * gameFrameDuration;
    clearCanvas();
    //PLAYER MOVEMENT
    var deacceleration = 20/gameFrameDuration;
    if(key.isPressed("left")) {
        hero.dx = -hero.movementspeed;
        if(!hero.totalFrames) hero.frame = hero.frame- 5/gameFrameDuration <= 0 ? 0 : hero.frame- 5/gameFrameDuration;
        drawPlayer(hero.x, hero.y, hero.width, hero.height,Math.round(hero.frame));
    }
    else if(key.isPressed("right")){
        hero.dx = hero.movementspeed;
        if(!hero.totalFrames) hero.frame = hero.frame+ 5/gameFrameDuration >= hero.totalFrames-1 ? hero.totalFrames-1 : hero.frame+ 5/gameFrameDuration;
        drawPlayer(hero.x, hero.y, hero.width, hero.height,Math.round(hero.frame));
    }
    else {
        hero.dx = (hero.dx > -1 && hero.dx < 1) ? hero.dx = 0 : (hero.dx > 0 ? hero.dx -= deacceleration : hero.dx += deacceleration);

        if(!hero.totalFrames) hero.frame = (hero.dx > -1 && hero.dx < 1) ? hero.frame = hero.frameOffset : (hero.dx > 0 ? hero.frame -= 5/gameFrameDuration : hero.frame += 5/gameFrameDuration);
        drawPlayer(hero.x, hero.y, hero.width, hero.height,Math.round(hero.frame));
    }
    //PLAYER'S hitbox != what is drawn on canvas, it's smaller, and in center of that image(player ship)

    if(key.isPressed("up")) hero.dy = -hero.movementspeed;
    else if(key.isPressed("down"))  hero.dy = hero.movementspeed;
    else hero.dy = (hero.dy > -1 && hero.dy < 1) ? hero.dy = 0 : (hero.dy > 0 ? hero.dy -= deacceleration : hero.dy += deacceleration);

    if(hero.x < 0) hero.x++;
    else if(hero.x+hero.width > canvas.width) hero.x--;
    else hero.x += hero.dx;

    if(hero.y < 0) hero.y++;
    else if(hero.y+hero.height > canvas.height) hero.y--;
    else hero.y += hero.dy;

    // AUTOMATIC SHOOTING


    pos = [hero.x + hero.width/2,hero.y + hero.height/2];
    playerFire(newtime,hero,pos);

    //UPDATE DOT's
    length = dots.length;
    for(i=0;i<length;i++){
        if(dots[i].duration > 0 ){
            drawCircle(dots[i].x,dots[i].y, dots[i].color, dots[i].aoe.radius);
            dots[i].duration -= gameFrameDuration;
            if(newtime - dots[i].lastused > 1000/dots[i].attr.APS){
                dots[i].lastused = newtime;
                if(dots[i].type == "zap") {
                    zapEnemies([dots[i].x,dots[i].y], enemies, dots[i].aoe, dots[i].attr);
                }else if(dots[i].type == "blackhole"){
                    enemies.forEach(function(e,j){
                        if(inRange(e.x,e.y, dots[i].x, dots[i].y, dots[i].aoe.radius)){
                            x1 = e.x, y1 = e.y, x2 = dots[i].x, y2 = dots[i].y;
                            e.speedmod = Math.pow((Math.pow((x2-x1),2)+Math.pow((y2-y1),2)),0.5)/ (dots[i].aoe.radius + 50);
                            if(dots[i].duration-1000/dots[i].attr.APS <= 0) {
                                e.speedmod = 1;
                                e.currentmove--;
                                e.moveset[e.currentmove].applied = false;
                                e.forcemove = true;
                            }
                            changeDir(e,dots[i].x-(e.x+e.width/2),dots[i].y-(e.y+e.height/2));
                        }
                    });
                    aoeDmg(enemies, dots[i]);
                }else if(dots[i].type == "shield"){
                    var blength = bullets.length;
                    for (var j = 0; j < blength; j++) {
                        if(inRange(bullets[j].x,bullets[j].y, dots[i].x, dots[i].y, dots[i].aoe.radius)){bullets.splice(j,1);blength--;j--;}
                    }
                }

            }
        }else{
            dots.splice(i,1);
            length--;i--;
        }
    }


    //IF PLAYER HP IS DEAD BRO
    if(hero.hp <= 0) gameSuccess(false);


    //CHECKS IF PLAYER IS has HP regen
    if(hero.hpregen && newtime - lastHealed > 1000 && hero.hp<hero.fullhp*hero.hpmod){
        healPlayer(hero,hero.hpregen*hero.fullhp*hero.hpmod);
        lastHealed = newtime;
    }

    //UPDATING SKILL ICON COOLDOWN
    [skillbut[0],skillbut[1],skillbut[2]].forEach(function(item,index){
        if(newtime - hero.skills[index].lastused < hero.skills[index].cooldown)       $(item).height((hero.skills[index].cooldown-newtime+hero.skills[index].lastused)/hero.skills[index].cooldown*100 + "%");
    });
    //UPDATING BUFFS IF ANY
    var length = buffs.length;
    for(i=0;i<length;i++){

        if(collision(buffs[i],hero)){
            if(buffs[i].type == "hp"){
                healPlayer(hero,buffs[i].value);
                updateHP(hero);
            }
            buffs.splice(i,1);
            i--;length--;
        }else{
            buffs[i].x += buffs[i].dx;
            buffs[i].y += buffs[i].dy;
            drawBuff(buffs[i].x,buffs[i].y,buffs[i].color);
            if(buffs[i].y > canvas.height + 50){
                buffs.splice(i,1);
                i--;length--;
            }
        }

    }
    //UPDATING ENEMIES
    var length = enemies.length;
    var scoreBoard = $(".score");
    //adding ENEMIES
    playLevel(maplevel,levelprogress,newtime);
    //if BOSS BATTLE, ACTIVATES SUCCESS ON DEFEAT ENEMIES
    if(bossBattle){
        if(!enemies.length) gameSuccess(true);
    }

    for(i=0;i<length;i++){
        if(enemies[i].y > canvas.height || enemies[i].hp <= 0 || enemies[i].x < -100 || enemies[i].x > canvas.width + 100 || enemies.y < -200){
            if(enemies[i].hp <= 0) {
                score += enemies[i].score;
                scoreBoard.html("Score: "+ score);
            }
            var ex = cloneJSON(data.SFX.explosion);
            ex.x = enemies[i].x+enemies[i].width/2; ex.y = enemies[i].y+enemies[i].height/2;
            special_effects.push(ex);
            enemies.splice(i,1);
            length--;i--;
        }else{
            updateEnemy(enemies[i],newtime);
            drawEnemy(enemies[i].x, enemies[i].y,enemies[i].width,enemies[i].height, enemies[i]);
            if(newtime - enemies[i].lastFired > 1000/enemies[i].APS){
                enemies[i].lastFired = newtime;

                enemyFire(enemies[i]);
            }
        }
    }

    //DRAWING/UPDATING BULLETS
    length = bullets.length;
    for(i=0; i<length; i++){
        if(bullets[i].y < -50 || collideEnemy(bullets[i],enemies) || bullets[i].y > canvas.height+50 || collidePlayer(bullets[i],hero) || bullets[i].x < -50 || bullets[i].x > canvas.width+50) {
            bullets.splice(i,1);
            length--;i--;

        }else{
            updateBulletDir(bullets[i]);
            bullets[i].y += bullets[i].dy;
            bullets[i].x += bullets[i].dx;
            if(bullets[i].missile) drawRocket(bullets[i].x,bullets[i].y,bullets[i].attr.angle);
            else drawBullet(bullets[i].x,bullets[i].y,bullets[i].attr.color);
        }
    }
    //UPDATING BEAMS
    length = beams.length;
    for(i=0;i<length;i++){
        if(beams[i].attr.frame > 0){
            beams[i].attr.frame--;
            drawBeam(beams[i].x, beams[i].y, beams[i].x2, beams[i].y2, beams[i].attr.color, beams[i].attr.frame/fading_frame);

            if(!beams[i].hit){
                BeamEnemy(beams[i],enemies);
                if(fading_frame - beams[i].attr.frame > 0) beams[i].hit = true;
            }
        }else{
            beams.splice(i,1);
            length--;i--;
        }
    }

    //UPDATE SPECIAL EFFECTS
    length = special_effects.length;
    for(i=0;i<length;i++){
        if(special_effects[i].type == 1){
            animate(explosion,special_effects[i].animation, special_effects[i].x, special_effects[i].y);
        }else if(special_effects[i].type == 2){
            animate($("#blackhole")[0],special_effects[i].animation, special_effects[i].x, special_effects[i].y);
        }
        else if(special_effects[i].type == 3){
            //general AOE
            var color = "rgba(" + special_effects[i].color + "," + (special_effects[i].frame/special_effects[i].totalFrames) + ")";

            drawCircle(special_effects[i].x,special_effects[i].y, color, special_effects[i].radius);

            special_effects[i].frame--;
            if(special_effects[i].frame < 1) special_effects[i].animation.end = true;
        }

        if(special_effects[i].animation.end ){
            special_effects.splice(i,1);
            length--;i--;
        }
    }

    //UPDATE TEXTS.... :o
    length = texts.length;
    for(i=0;i<length;i++){
        if(texts[i].frame > 0){
            texts[i].frame--;
            drawText(texts[i].x, texts[i].y-(fading_frame-texts[i].frame), texts[i].color, texts[i].frame/fading_frame, texts[i].val, texts[i].size);
        }else{
            texts.splice(i,1);
            length--;i--;
        }
    }


    //CHECKING REQS FOR UPGRADES
}






var add_enemy;
function startEnemies(){
    add_enemy = setInterval(startLevels,enemy_spawnRate);
}
function stopEnemies(){
    clearInterval(add_enemy);
}

// FPS
var gameFrameDuration = 30;
var game;
var add_buff;

function startGame(){
    game = setInterval(update, gameFrameDuration);
    add_buff = setInterval(addBuff,5000);
}
function stopGame(){
    clearInterval(game);
    clearInterval(add_buff);
}
function restartGame(gameover){
    if(gameover || confirm("Do you want to restart the game?")){
        quitGame();
        showGame(maplevel);
    }
}
function resetTimeVariables(){
    newtime = 0;
    frameElapsed = 0; //game.js
    lastFired = 0; //game.js
    lastenemyspawntime = 0; //maplevels.js
    hero.skills.forEach(function(item,index){item.lastused =0;});
    hero.weapons.forEach(function(item,index){if(item)item.lastFired =0;});
}
