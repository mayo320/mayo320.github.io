var enemySpeed = 2;
var speedfactor = 1.3;
//typesof enemies: fodder, cluster, spread, quick_cluster, spread2, auto, boss1
function addEnemy(enemy,hpmod,dmgmod){
    var hpmod = hpmod || 1;
    var dmgmod = dmgmod || 1;
    var enemy_attr;
    //ENEMY SPEED IS PIXELS PER SECOND -> p/s
    enemy_attr = cloneJSON(enemy_lib[enemy]);
    enemy_attr.name = enemy;
    enemy_attr.hp *= hpmod;
    enemy_attr.damage *= dmgmod;
    return enemy_attr;
}
function updateEnemy(enemy,time){
    var cur_move = enemy.currentmove;
    if(!enemy.moveset[cur_move].applied && (enemy.forcemove || collision(enemy.moveset[cur_move],enemy))){
        if(!enemy.moveset[cur_move+1]) {enemy.dx = 0; enemy.dy = 0; enemy.moveset[cur_move].applied = true; enemy.currentmove--;}
        else{
            objMoveto(enemy, enemy.moveset[cur_move+1].x - enemy.width/2, enemy.moveset[cur_move+1].y - enemy.height/2);
            enemy.moveset[cur_move].applied = true;}
        enemy.currentmove++;

        enemy.forcemove = false;
    }



    enemy.x += enemy.dx;
    enemy.y += enemy.dy;
}
function objMoveto(obj,x,y,speedmod){
    var speedmod = speedmod || obj.speedmod || 1;

    obj.dx = x - obj.x;
    obj.dy = y - obj.y;

    var d = length(obj.x,obj.y,x,y);
    obj.dx *= speedmod*obj.speed/d;
    obj.dy *= speedmod*obj.speed/d;
}
