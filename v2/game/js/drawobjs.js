var ctx;
var canvas;
var playership;
var rocket;
var explosion;
var enemySprites = [];
$(document).ready(function(){
    playership = document.getElementById("playership");
    rocket = document.getElementById("rocket");
    explosion = document.getElementById("explosion");
    enemySprites = $(".enemySprite");
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
});
function clearCanvas(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function drawPlayer(x,y,w,h,frame) {
    ctx.drawImage(playership, frame * 50, 0, 50, 50, x + w/2 - 50/2, y + h/2 - 50/2, 50, 50);
}
function drawRocket(x,y,rot){
    //rotation is in radians
    rotobj = rotateAndCache(rocket,rot);
    ctx.drawImage(rotobj,x-rotobj.width/2,y-rotobj.height/2);
}
function drawBullet(x,y,clr){
    ctx.beginPath();
    ctx.arc(x,y,3,0,Math.PI*2);
    ctx.fillStyle = clr;
    ctx.fill();
    ctx.closePath();
}
function drawBeam(x,y,x2,y2,clr,opacity){
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x2,y2);
    ctx.strokeStyle = "rgba(" + clr + "," + opacity + ")";
    ctx.stroke();

}
function drawEnemy(x,y,w,h,enemyobj){
    enemy = $("#"+enemyobj.name)[0];
    if(enemyobj.animation){
        animate(enemy,enemyobj.animation,x,y,w,h);
    }else ctx.drawImage(enemy, x + w/2 - enemy.width/2, y + h/2 - enemy.height/2);
}
function drawBuff(x,y,clr){
    ctx.beginPath();
    ctx.arc(x,y,10,0,Math.PI*2);
    ctx.fillStyle = clr;
    ctx.fill();
    ctx.closePath();
}
function drawCircle(x,y,clr,r){
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle = clr;
    ctx.fill();
    ctx.closePath();
}
function drawText(x,y,clr,opacity,val,size){
    ctx.font = size + "px Century Gothic";

    ctx.fillStyle = "rgba(" + clr + "," + opacity + ")";
    ctx.fillText(val,x,y);
}
//ROTATION FUNCTION
rotateAndCache = function(image,angle) {
  var offscreenCanvas = document.createElement('canvas');
  var offscreenCtx = offscreenCanvas.getContext('2d');

  var size = Math.max(image.width, image.height);
  offscreenCanvas.width = size;
  offscreenCanvas.height = size;

  offscreenCtx.translate(size/2, size/2);
  offscreenCtx.rotate(angle + Math.PI/2);
  offscreenCtx.drawImage(image, -(image.width/2), -(image.height/2));

  return offscreenCanvas;
}
//ANIMATION FUNCTION
function animate(obj,animation_attr,x,y,w,h){
    w = w || 1;
    h = h || 1;

    var f = Math.round(animation_attr.frameDuration / gameFrameDuration);
    if(animation_attr.frame >= animation_attr.totalFrames*f - 1){
         if(animation_attr.loop > 0 ) {animation_attr.frame = 1; animation_attr.loop--}
         else animation_attr.end = true;
     }
    animation_attr.frame++;

    ctx.drawImage(obj, (Math.floor(animation_attr.frame/f)) * animation_attr.frameSize.width, 0, animation_attr.frameSize.width-2, animation_attr.frameSize.height, x + w/2 - animation_attr.frameSize.width/2, y + h/2 - animation_attr.frameSize.height/2, animation_attr.frameSize.width, animation_attr.frameSize.height);
}
