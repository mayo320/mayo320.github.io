function updateTraits(hero) {
    if(!hero.traitsapplied){
        var traits = hero.traits;
        hero.traitsapplied = true;
        //modify stats based on skills
        for (var i = 0; i < traits.length; i++) {
            applyTrait(hero, i);
        }
    }
}
//list of available traits
var traits = ["Thick Skinned", "Small","Light","Fast","Hulk","Clueless","Echo","Homing", "Pierce", "Ricochet", "Divine", "Vampire", "Splash", "Slow&Steady","Laser"];

function applyTrait(hero, index) {
    if (hero.traits[index] == "Thick Skinned") {
        hero.width *= 1.2;
        hero.height *= 1.2;
        hero.fullhp *= 1.2;
        hero.hp *= 1.2;
    } else if (hero.traits[index] == "Small") {
        hero.width *= 0.8;
        hero.height *= 0.8;
    } else if (hero.traits[index] == "Fast") {
        hero.APS *= 1.2;
        hero.damagemod -= 0.2;
        hero.movementspeed += 2;
    } else if (hero.traits[index] == "Hulk") {
        hero.damage *= 1.4;
        hero.APSmod -= 0.2;
    } else if (hero.traits[index] == "Clueless") {
        hero.damagemod -= 0.2;
        hero.APSmod -= 0.2;
        hero.hpmod -= 0.2;
        hero.bulletTypes.spread += 4;
        hero.bulletTypes.cluster += 2;
    } else if (hero.traits[index] == "Divine"){
        //heals 5% of max health every second
        hero.hpregen = 0.05;
    } else if (hero.traits[index] == "Slow&Steady"){
        hero.movementspeed -= 2;
        hero.damage *= 1.4;
        hero.bulletspeedmod *= 0.5;
    }
}
