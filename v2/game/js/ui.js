var data;
var save;
var game_levels;
var enemy_lib;
//0,1,2,3,4,5
var tiercolor = ["rgba(0,0,0,1)", "rgba(255,255,255,1)", "rgba(0, 255, 64, 1)", "rgba(131, 144, 255, 1)","rgba(192, 55, 209, 1)","rgba(255, 184, 0, 1)"];
$(document).ready(function(){
    //get data from json
    data = $.ajax({
        type:'GET',
        url:'json/data.json',
        dataType:'json',
        success:function(_data){
            data = data.responseJSON;
            sortArray(data.heroes);
            sortArray(data.weapons);
            sortArray(data.mods);
            updateMap();
            getSave();
        }
    });

});
//SETUP FUNCTIONS
//get save
function getSave(){
    save = $.ajax({
        type:'GET',
        url:'json/save.json',
        dataType:'json',
        success:function(data){
            save = save.responseJSON;
            hero = save.hero;
            setupItem(save.inventory);
            setupShip(hero);
            updateTraits(hero);
            loadEnemies();
        }
    });
}
//get enemies, and levels/waves
function loadEnemies(){
    loadedEnemiesJSON = $.ajax({
        type:'GET',
        url:'json/enemies.json',
        dataType:'json',
        success:function(_data){
            var loadedV = loadedEnemiesJSON.responseJSON;
            enemy_lib = loadedV.library;
            game_levels =loadedV.levels;
        }
    });
}
//turns String into JSON obj of that thing (skill,ship,weapons,mods)
function setupItem(item){
    var found = false;
    for(var i =0;i<item.length;i++){
        var id = item[i];
        found = false;
        data.skills.forEach(function(skill,j){
            if(id == skill.id) {item[i] = cloneJSON(skill); found = true;}
        });
        if(found) continue;
        data.heroes.forEach(function(ship,j){
            if(id == ship.id) {item[i] =cloneJSON(ship);setupItem(item[i].skills); found = true;}
        });
        if(found) continue;
        data.weapons.forEach(function(weapon,j){
            if(id == weapon.id) {item[i] =cloneJSON(weapon); found = true;}
        });
        if(found) continue;
        data.mods.forEach(function(mod,j){
            if(id == mod.id) {item[i] =cloneJSON(mod); found = true;}
        });
    }
}
function setupShip(ship){
    setupItem(ship.weapons);
    ship.skills.forEach(function(){
        setupItem(ship.skills);
    });
    ship.weapons.forEach(function(weapon){
        setupItem(weapon.mods);
    });
}
//CLONE json
function cloneJSON(attr){
    return JSON.parse(JSON.stringify(attr));
}

//MAIN MENU FUNCTIONS
function showMap(){
    $(".page").addClass("hide");
    $(".map_page").removeClass("hide");
    var y = 0;
    for(var i = 0;i<data.mapnodes.length;i++){
        if(data.mapnodes[i].unlocked) y = data.mapnodes[i].y;
    }
    $(".map_select").scrollTop($(".map_nodes").height()-y-200);
}
var skillbut;
function showGame(level){
    //update hero
    updateTraits(hero);
    maplevel = level;
    bossBattle = false;
    resetTimeVariables();
    //clicking map node
    $(".page").addClass("hide");
    $(".game_page").removeClass("hide");
    $(".pause_menu").hide();
    $("#playership").attr("src",hero.sprite);
    hero.x = 300;hero.y=600;
    hero.hp = hero.fullhp * hero.hpmod;
    skillbut = $(".skills_bar li .cooldown");
    for(var i =0;i<hero.skills.length;i++){
        $(skillbut[i]).parent().find("img").attr("src",hero.skills[i].image);
    }
    hero.weapons.forEach(function(wep,i){
            if(wep){wep.modAPS = 1;
            wep.mods.forEach(function(mod,j){
                if(mod && mod.APSmod) wep.modAPS *= mod.APSmod;
            });}
    });
    //set up hero image stuff
    hero.totalFrames = Math.round(playership.width/50);
    hero.frameOffset = Math.floor(hero.totalFrames/2);
    hero.frame = hero.frameOffset;
    //setup level
    maplevelcontent = cloneJSON(game_levels[level]);
    //startGamein game.js
    startGame();
}
function mainmenuPopup(key){
    if(key=="close"){
        $(".mainmenu_popup").slideUp();
        $(".mainmenu_popup div div").removeClass("show");
    }else{
        $(".mainmenu_popup").slideDown();
        $("." + key).addClass("show");
    }
}
//id is string
function newGame(){
    var id = $("input[name=newid]")[0].value;
    var data = {"id":id};
    //NO BACKEND ATM, so straight to the game
    showMap();
}
function loadGame(){
    var id = $("input[name=loadid]")[0].value;
}
//MAP PAGE FUNCTIONS
function updateMap(){
    //setting up map nodes
    var $map = $(".map_nodes");
    var nodes = data.mapnodes;
    for(var i =0 ; i<nodes.length ;i++){
        $map.append("<div class='map_node disabled' onclick='showGame("+ i+")'>"+nodes[i].name+"</div>");
        var $node = $(".map_node:last");
        $node.css({"left":nodes[i].x+"px","bottom":nodes[i].y+"px"});
        if(nodes[i].unlocked){
            $node.addClass("unlocked");
            $node.removeClass("disabled");
        }
    }
    $map.height(nodes[nodes.length-1].y + 200 + "px");
}
//CHARACTER PAGE FUNCTIONS
function changeHero(){
    $($(".char_contents .tabs li")[3]).trigger("click");
    cancelButton(true);
    var inventory = $(".char_contents .inventory li");
    for(var i = 0; i<save.inventory.length ; i++){
        if(save.inventory[i].type != "ship") $(inventory[i]).addClass("disabled");
    }
}
function showCharPage(){
    //update hero info
    updateTraits(hero);
    //checks if newly leveled
    levelShip();
    //updates everything in character page
    $(".page").addClass("hide");
    $(".character_page").removeClass("hide");
    //update header
    var header = $(".header");
    headerimg = header.find("img:first");
    headerimg.attr("src",hero.image).css("margin-left",-headerimg[0].width/2 + 50 + "px");
    //changing opacity of color
    var color = "";
    for(var i =0;i<tiercolor[hero.tier].length-2;i++){
        color += tiercolor[hero.tier][i];
    }
    color += "0.5)";
    header.find("img:first").css("background",color);
    //changing header info
    //checks if newly leveled
    levelShip();
    header.find("p:first").html(hero.name);
    var level = header.find(".char_level");
    level.find(".level").html(hero.level);
    level.find(".exp_values").html(Math.round(hero.exp) + "/" +Math.round(hero.levelexp));
    level.find(".exp").animate({"width":hero.exp/hero.levelexp*100 + "%"},500);
    header.find(".gold span").html(Math.round(save.credit));

    updateInv();
    updateStats();
    updateWeps();
    updateSkills();
}
//changing character tabs
function showCharTab(key,_this){
    $(".char_contents .content").addClass("hide");
    $(".char_contents ." + key).removeClass("hide");

    $(".char_contents .tabs li").removeClass("current");
    $(_this).addClass("current");

    showItemInfo("close");
}
//Inventory functions
var $inventory;
function updateInv(){
    $inventory = $(".inventory ul");
    $inventory.html("");
    for(var i =0; i<save.inventory.length;i++){
        $inventory.append("<li onclick='showItemInfo("+i+")'><img src='' alt='' /></li>");
        $inventory.find("img:last").attr("src",save.inventory[i].image);
    }
}
function sellItem(key){
    save.credit += save.inventory[key].price/4;
    $(".header .gold span").html(Math.round(save.credit));
    deleteItem(key);
    showItemInfo("close");
}
function addItem(item){
    save.inventory.push(item);
    updateInv();
}
function deleteItem(key){
    save.inventory.splice(key,1);
    $(".inventory ul li")[key].remove();
    updateInv();
}
var equiping = false;
function equipItem(key,weapon,mod){
    if(save.inventory[key].type == "ship"){
        //if changing ship(hero)
        if(hero.weapons.length){
            for(var i = 0; i < hero.weapons.length; i++){
                if(hero.weapons[i]) unequipItem(i,-1);
            }
        }
        addItem(cloneJSON(hero));
        hero = cloneJSON(save.inventory[key]);
        deleteItem(key);
        showCharPage();
        showItemInfo("close");
        cancelButton(false);
    }
    else{
        if(!weapon){
            //if equiping from inventory page first
            cancelButton(true);
            $(".char_contents .inventory li").addClass("disabled");
            $($(".char_contents .tabs li")[1]).trigger("click");
            showItemInfo("close");
            equiping = key+1;
            if(save.inventory[key].type == "weapon"){
                $(".character_page .char_contents .mods .mod").addClass("disabled");
            }else if(save.inventory[key].type == "mod"){
                $(".character_page .char_contents .weapon").addClass("disabled");
            }
        }else{
            //if triggered from weapon page
            weapon--;
            if(mod < 0){
                hero.weapons[weapon] = cloneJSON(save.inventory[key]);
            }else{
                hero.weapons[weapon].mods[mod] = cloneJSON(save.inventory[key]);
            }
            equiping = false;
            deleteItem(key);
            cancelButton(false);
            showCharPage() //updates everything in char page;
        }
    }
}
var swap = [];
function swapItems(weapon, mod){
    if(equiping){
        unequipItem(weapon, mod);
        equipItem(equiping-1,weapon+1,mod);
        swap = [];
        cancelButton(false);
    }else{
        $(".char_contents .weps li").addClass("disabled");
        showItemInfo("close");
        $($(".char_contents .tabs li")[3]).trigger("click");
        var type;
        if(mod < 0) type = "weapon";
        else type = "mod";
        var inventory = $(".char_contents .inventory li");
        for(var i = 0;i<save.inventory.length;i++){
            if(save.inventory[i].type != type) $(inventory[i]).addClass("disabled");
        }
        swap = [weapon,mod];
        cancelButton(true);
    }
}
//popup for inv and wep page
var openedID;
var openedWep;
var tabindex;
function showItemInfo(key, weaponpage){
    var item_popup = $(".character_page .char_contents .popup");
    tabindex = item_popup.find("li");
    if(key=="close") item_popup.hide(); //if closing the popup
    else{
        var item;
        //what page did u initiate popup at (if clicked weapon, key is wep index),(if clicked mod, key is mod index, weapon index is weaponpage-2)
        if(weaponpage == 1){
            item=hero.weapons[key];
            openedWep = [key,-1];
        }else if(weaponpage > 1){
            item = hero.weapons[weaponpage-2].mods[key];
            openedWep = [weaponpage-2,key];
        }else{
            item = save.inventory[key];
            openedID = key;
        }

        if(item){
            //if clicked on item
            item_popup.show();
            var name = item_popup.find("h3").html(item.name);
            var type = item.type;
            var desc = item_popup.find("p:last")[0];
            desc.innerHTML = "";
            //Use, Equip, Unequip, Swap, Sell, Close
            tabindex.removeClass("hide");
            $(tabindex[0]).addClass("hide");
            $(tabindex[2]).addClass("hide");
            $(tabindex[3]).addClass("hide");
            if(type == "weapon"){
                var weapontype = " Gun";
                if(item.bulletTypes.beam) weapontype = " Laser";
                else if(item.bulletTypes.rocket) weapontype = " Rocket";
                else if(item.bulletTypes.tesla) weapontype = " Tesla";
                name[0].innerHTML += " - Tier " + item.tier + weapontype;
                item_popup.find("p:first").html("Damage: "+ Math.round(item.damagemod*100) + "% / " + " APS: " + Math.round(item.APSmod*100) + "% /  Mod Slots: " + item.modslots);
                desc.innerHTML = "Equipped mods: ";
                for(var i =0;i<item.mods.length;i++) if(item.mods[i]){desc.innerHTML += item.mods[i].name + ", "}
                desc.innerHTML += "</br></br>";
            }else if(type == "mod"){
                name[0].innerHTML += " - Tier " + item.tier + " mod";
                item_popup.find("p:first").html("Damage: "+ Math.round(item.damagemod*100) + "%");
            }else if(type == "ship"){
                name[0].innerHTML += " - Tier " + item.tier + " ship";
                item_popup.find("p:first").html("HP: "+ item.fullhp + " / Damage: "+ (item.damage) + " / APS: " + (item.APS) + " / Movement: " + item.movementspeed + " / Weapon Slots: " + item.wepslots + " / Growth: " + item.growth.hp + " HP, " + item.growth.damage + " Dmg, " + item.growth.APS + " APS");
            }else{
                item_popup.find("p:first").html("");
                $(tabindex[1]).addClass("hide");
            }
            desc.innerHTML += item.description;
            tabindex[4].innerHTML = "Sell ("+ Math.round(item.price/4) + ")";
            if(weaponpage) {
                $(tabindex[3]).removeClass("hide"); $(tabindex[2]).removeClass("hide"); $(tabindex[1]).addClass("hide"); $(tabindex[4]).addClass("hide");
            }
            if(equiping) {
                //this swaps with current item
                $(tabindex[2]).addClass("hide");
            }
            if(swap.length){
                tabindex.addClass("hide");
                $(tabindex[3]).removeClass("hide");
                $(tabindex[5]).removeClass("hide");
                equiping = openedID +1;
            }

            //positioning the popup
            var clicked;
            if(weaponpage==1){
                clicked = $($(".character_page .char_contents .weps li")[key]);
            }else if(weaponpage > 1){
                clicked = $($(".character_page .char_contents .weps li")[weaponpage-2]);
            }else{
                clicked = $($inventory.find("li")[key]);
            }
            item_popup.css("top",clicked.offset().top + clicked.height() + 30);
            if(parseInt(item_popup.css("bottom")) < 0) item_popup.css("top",clicked.offset().top - item_popup.height() -30);

            //changing border/name color based on tier
            if(item.tier){
                item_popup.css("border","1px solid " + tiercolor[item.tier]);
                name.css("color",tiercolor[item.tier]);
            }else{
                item_popup.css("border","1px solid " + tiercolor[3]);
                name.css("color",tiercolor[3]);}


        }else if(equiping){
            //if clicked on add icon at weaponpage, and equiping an item
            //executes final step of equiping
            if(weaponpage == 1){
                hero.weapons[key] = cloneJSON(save.inventory[equiping-1]);
            }else if(weaponpage > 1){
                hero.weapons[weaponpage-2].mods[key] = cloneJSON(save.inventory[equiping-1]);
            }
            deleteItem(equiping-1);
            cancelButton(false);
            equiping = false;
            showCharPage(); //this updates everything in character page (removing "disabled" on items)
        }else{
            //if clicked on add icon at weaponpage, but not equiping item already
            swapItems(openedWep[0],openedWep[1]);
        }
    }
}
function cancelButton(show){
    if(show)$(".char_contents .tabs .cancel").addClass("show");
    else{
        $(".char_contents .tabs .cancel").removeClass("show");
        equiping = false;
        swap = [];
        showCharPage();
    }
}
function updateStats(){
    var cols = $(".stats .col");
    //updating stats column
    var stats = "<h3>Stats</h3><hr>";
    stats += "after modifiers<hr>";
    stats += "Tier: " + hero.tier;
    stats += "</br>HP: " + Math.round(hero.fullhp*hero.hpmod*10)/10;
    stats += "</br>Damage: " + Math.round(hero.damage*hero.damagemod*10)/10;
    stats += "</br>APS: " + Math.round(hero.APS*hero.APSmod*10)/10;
    stats += "</br>Movement: " + hero.movementspeed;
    stats += "</br>Weapon Slots: " + hero.wepslots;
    if(hero.hpregen) stats += "</br>HP Regen: " + Math.round(hero.hpregen*hero.fullhp*hero.hpmod*10)/10 + "/s";
    cols[0].innerHTML = stats;
    //modifiers column
    var mod = "<h3>Modifiers</h3><hr>";
    mod += "-100%<hr>"
    mod += "</br>HP: " + Math.round(hero.hpmod*100) + "%";
    mod += "</br>Damage: " + Math.round(hero.damagemod*100) + "%";
    mod += "</br>APS: " + Math.round(hero.APSmod*100) + "%";
    mod += "</br>Bullet speed: " + Math.round(hero.bulletspeedmod*100) + "%";
    cols[1].innerHTML = mod;
    //traits column
    var traits = "<h3>Traits</h3><hr>&nbsp<hr>";
    for(var i =0; i<hero.traits.length;i++){
        traits += "</br>" +hero.traits[i];
    }
    cols[2].innerHTML = traits;
}
//weapon page
function unequipItem(weapon,mod){
    if(mod<0 && hero.weapons[weapon]){
        if(hero.weapons[weapon].mods.length){
            for(var i = 0;i<hero.weapons[weapon].mods.length;i++){
                if(hero.weapons[weapon].mods[i]) unequipItem(weapon,i);
            }
        }
        addItem(cloneJSON(hero.weapons[weapon]));
        hero.weapons[weapon] = null;
    }else if(hero.weapons[weapon] && hero.weapons[weapon].mods[mod]){
        addItem(cloneJSON(hero.weapons[weapon].mods[mod]));
        hero.weapons[weapon].mods[mod] = null;
    }
    updateWeps();
    showItemInfo("close");
}
var $weaponpage;
function updateWeps(){
    $weaponpage = $(".weps ul");
    $weaponpage.html("");
    for(var i =0;i<hero.wepslots;i++){
        //setting up weapon
        $weaponpage.append("<li><div class='weapon' onclick='showItemInfo("+i+",1)'><img src='img/weps/add.png' alt='' /></div><div class='mods'></div></li>");
        var wep = $weaponpage.find("li:last");
        if(hero.weapons[i]) {
            wep.find("img:first").attr("src",hero.weapons[i].image);
            //setting up mods
            var mods = wep.find(".mods");
            for(var j =0; j<hero.weapons[i].modslots;j++){
                mods.append("<div class='mod' onclick='showItemInfo("+j+","+(2+i)+")'><img src='img/weps/add.png' alt='' /></div>");
                if(hero.weapons[i].mods[j]) mods.find("img:last").attr("src", hero.weapons[i].mods[j].image);
            }
        }

    }
}
function updateSkills(){
    var skills = $(".char_contents .skills ul");
    skills.html("");
    for(var i = 0; i<hero.skills.length;i++){
        skills.append("<li class=''><div class='skill'><img src='img/player.png' alt='' /></div> <div class='skill_desc'> <span>Skill name</span> / Cooldown: <span>10</span>s<hr><p>Skill description</p></div></li>")
        var skill = skills.find("li:last");
        skill.find("img").attr("src",hero.skills[i].image);
        skill.find("span:first").html(hero.skills[i].name);
        skill.find("span:last").html(Math.round(hero.skills[i].cooldown/1000));
        skill.find("p").html(hero.skills[i].description);
    }
}
//SHOP PAGE FUNCTIONS
function showShop(tab){
    tab = tab || "ship";
    var content = $(".shop_page .content ul")[0];
    content.innerHTML = "";
    $(".shop_page span:first").html(Math.round(save.credit));
    $(".page").addClass("hide");
    $(".shop_page").removeClass("hide");
    var tabs = $(".shop_page .tabs li").removeClass("current");
    if(tab == "ship"){
        $(tabs[0]).addClass("current");
        data.heroes.forEach(function(ship,index){
            var color = tiercolor[ship.tier];
            content.innerHTML += '<li><div class="image"><img src="' +ship.image + '" alt="" /><a href="javascript:void(0)" onclick="buyItem(data.heroes,'+ index +')"> Buy </a></div><div class="description"><h4 style="color:'+color+'">' + ship.name+ ' - Tier '+ship.tier + ' - Price: '+ship.price+' credit</h4><hr> <p>HP: ' + ship.hp + ' / Damage: '+ ship.damage + ' / APS: '+ship.APS +' / Weapon Slots: '+ ship.wepslots + ' / Growth: ' +ship.growth.hp+' HP, '+ ship.growth.damage +' Damage, ' + ship.growth.APS + ' APS<hr>' +ship.description+'</p></div></li>';
        });
    }else if(tab == "wep"){
        $(tabs[1]).addClass("current");
        data.weapons.forEach(function(weapon,index){
            var color = tiercolor[weapon.tier];
            content.innerHTML += '<li><div class="image"><img src="' +weapon.image + '" alt="" /><a href="javascript:void(0)" onclick="buyItem(data.weapons,'+ index +')"> Buy </a></div><div class="description"><h4 style="color:'+color+'">' + weapon.name+ ' - Tier '+weapon.tier + ' - Price: '+weapon.price+' credit</h4><hr> <p>Damage: '+ Math.round(weapon.damagemod*100) + '% / APS: '+ Math.round(100*weapon.APSmod) +'% / Mod Slots: '+ weapon.modslots +'<hr>'+ weapon.description+'</p></div></li>';
        });
    }else if(tab == "mod"){
        $(tabs[2]).addClass("current");
        data.mods.forEach(function(mod,index){
            var color = tiercolor[mod.tier];
            content.innerHTML += '<li><div class="image"><img src="' +mod.image + '" alt="" /><a href="javascript:void(0)" onclick="buyItem(data.mods,'+ index +')"> Buy </a></div><div class="description"><h4 style="color:'+color+'">' + mod.name+ ' - Tier '+mod.tier + ' - Price: '+mod.price+' credit</h4><hr> <p>Damage: '+ Math.round(mod.damagemod*100) +'%<hr>'+mod.description+'</p></div></li>';
        });
    }else if(tab == "misc"){
        $(tabs[3]).addClass("current");
    }
}
function buyItem(arr,index){
    if(save.credit >= arr[index].price && confirm('Buy "'+arr[index].name + '" for ' + arr[index].price + ' credit?')){
        addItem(cloneJSON(arr[index]));
        save.credit -= arr[index].price;
        $(".shop_page span:first").html(save.credit);
    }
}
function sortArray(arr){
    sortJsonArrayByProperty(arr, 'price');
}
function sortJsonArrayByProperty(objArray, prop, direction){
    if (arguments.length<2) throw new Error("sortJsonArrayByProp requires 2 arguments");
    var direct = arguments.length>2 ? arguments[2] : 1; //Default to ascending

    if (objArray && objArray.constructor===Array){
        var propPath = (prop.constructor===Array) ? prop : prop.split(".");
        objArray.sort(function(a,b){
            for (var p in propPath){
                if (a[propPath[p]] && b[propPath[p]]){
                    a = a[propPath[p]];
                    b = b[propPath[p]];
                }
            }
            return ( (a < b) ? -1*direct : ((a > b) ? 1*direct : 0) );
        });
    }
}


//GAMEPLAY FUNCTIONS
function pauseGame(pause){
    if(pause){
        stopGame();
        $(".pause_menu div").hide();
        $(".pause_menu").show();
        $(".pause_menu .paused").fadeIn();
    }else{
        startGame();
        $(".pause_menu").hide();
        $(".pause_menu div").hide();
    }
}
function quitGame(){
    resetTimeVariables();
    stopGame();
    levelprogress = 0;
    $(".pause_menu").hide();
    $(".gameover").hide();
    bullets = [];
    hero.hp = hero.fullhp*hero.hpmod;
    score = 0;
    $(".score").html("Score: "+ score);
    enemies = [];
    buffs = [];
    beams = [];
    rockets = [];
    dots = [];
    special_effects = [];
    texts = [];
    $(".HP").css("width","100%");
    showMap();
    if(earnedCred || earnedEXP){
        hero.exp += earnedEXP;
        save.credit += earnedCred;
        earnedCred = 0; earnedEXP = 0;
    }
}
var successSpans; //score, credit, exp
var earnedEXP = 0;
var earnedCred = 0;
function gameSuccess(success){
    stopGame();
    $(".pause_menu div").hide();
    $(".pause_menu").show();
    if(success){
        if(data.mapnodes[maplevel+1])data.mapnodes[maplevel+1].unlocked = true;
        updateMap();

        var success = $(".pause_menu .success");
        success.find("li").addClass("disabled");
        success.fadeIn();
        successSpans = success.find("span");
        $(successSpans[0]).html(score);
        $(successSpans[1]).html(0);
        $(successSpans[2]).html(0);
        var interval = score / 50;
        setTimeout(function(){scoreToCred(interval,50);},1300);
    }else{
        $(".pause_menu .failed").fadeIn();
    }
}
function scoreToCred(interval,index){
    if(index > 0){
        score -= interval;
        earnedEXP += interval * 0.5;
        earnedCred += interval *0.5;
        $(successSpans[0]).html(Math.round(score));
        $(successSpans[1]).html(Math.round(earnedCred));
        $(successSpans[2]).html(Math.round(earnedEXP));
        setTimeout(function(){scoreToCred(interval,index-1);},20);
    }else{
        $(".game_page .pause_menu .success li").removeClass("disabled");
        levelShip();
    }
}
function levelShip(){
    while(hero.exp >= hero.levelexp){
        hero.exp -= hero.levelexp;
        hero.level++;
        hero.levelexp *= 1.4;
        hero.hpmod += hero.growth.hp*0.05;
        hero.damagemod += hero.growth.damage*0.05;
        hero.APSmod += hero.growth.APS*0.05;
    }
}
