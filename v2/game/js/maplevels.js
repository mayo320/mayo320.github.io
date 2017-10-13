//LEVEL DESIGN IS HERE
var deg45 = Math.PI/4;
var maplevel;
var levelprogress = 0;
var maplevelcontent;
var bossBattle = false; //also a varaible to decide stop spawning
var lastenemyspawntime=0;
var enemyspawnrate = 2000;
//typesof enemies: fodder, cluster, spread, quick_cluster, spread2, auto, boss1
function playLevel(level,progress,newtime){
    //a if statement for each level
    if(!bossBattle){
        var curlvl = maplevelcontent;//remember to refresh curlvl at startgame or quitgame to data values
        curlvl.waves.forEach(function(item,i){
            //item is wave
            if(newtime > item.time){
                //if spawn current wave
                if (item.amount > 0 && newtime - item.interval >= item.lastspawn) {
                    item.amount--;
                    item.lastspawn = newtime;
                    var e = addEnemy(item.enemy,item.hpmod,item.dmgmod);
                    if(item.bulletSets){
                        e.bulletSets = cloneJSON(item.bulletSets);
                        e.setIndex = 0;
                    }
                    else e.bullets = cloneJSON(item.bullets);
                    e.moveset = cloneJSON(item.moveset);
                    e.currentmove = 0;
                    e.spawntime = newtime;
                    e.x = e.moveset[0].x; e.y = e.moveset[0].y;
                    e.speed /= gameFrameDuration;
                    bossBattle = item.bossbattle;
                    enemies.push(e);
                }
            }
        });
    }
}

//TYPES OF SPAWNING
var spawning;
function spawnCross(e,dir){
    e.moveset = [{"applied":false,"x":-50,"y":100},{"applied":false,"x":canvas.width+50,"y":400}];
    if(dir == -1) {
        e.moveset[0].x = canvas.width + 10;
        e.moveset[1].x = -50;
    }
    e.spawntime = newtime;
    e.x = e.moveset[0].x; e.y = e.moveset[0].y;
    e.speed /= gameFrameDuration;
}
function spawnFall(e,stop){
    if(stop) e.stopframe = Math.round(stop/gameFrameDuration);
    e.moveset = [{"applied":false,"x":canvas.width/2,"y":-50},{"applied":false,"x":canvas.width/2,"y":300}];
    e.spawntime = newtime;
    e.x = e.moveset[0].x; e.y = e.moveset[0].y;
    e.speed /= gameFrameDuration;
}
function spawnArrow(e,dir){
    e.moveset = [{"applied":false,"x":-50,"y":100},{"applied":false,"x":canvas.width/2+20,"y":400},{"applied":false,"x":canvas.width+50,"y":100}];
    if(dir == -1) {
        e.moveset[0].x = canvas.width + 10;
        e.moveset[2].x = -50;
    }
    e.spawntime = newtime;
    e.x = e.moveset[0].x; e.y = e.moveset[0].y;
    e.speed /= gameFrameDuration;
}
