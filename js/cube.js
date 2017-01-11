var length;
var start_assemble = true;

$(document).ready(function(){
    $cube = $(".container3d");
    $cube.addClass("spin");
    length = parseInt($cube.attr("data-length"))/2;
    var index = 0;
    $(".threedee").each(function(){
        $(this).addClass("face"+ index);
        index++;
    });

    $("body").append("<style>.face0{transform:translate3d(0px,0px,"+length+"px);}" +
    ".face1{transform:translate3d("+length+"px,0px,0px) rotateY(90deg);}" +
    ".face2{transform:translate3d(-"+length+"px,0px,0px) rotateY(-90deg);}" +
    ".face3{transform:translate3d(0px,"+length+"px,0px) rotateX(-90deg);}"+
    ".face4{transform:translate3d(0px,-"+length+"px,0px) rotateX(90deg);}"+
    ".face5{transform:translate3d(0px,0px,-"+length+"px) rotateY(180deg);}"+
    "</style>");
    //if play assemble animation at the start when page is loaded
    if(start_assemble){
        var len = 500;
        var time = 2;
        TweenMax.from($(".face0"),time,{transform:'translate3d(0,0,'+len+'px)',opacity:0});
        TweenMax.from($(".face1"),time,{transform:'translate3d('+len+'px,0,0)',opacity:0});
        TweenMax.from($(".face2"),time,{transform:'translate3d(-'+len+'px,0,0)',opacity:0});
        TweenMax.from($(".face3"),time,{transform:'translate3d(0,'+len+'px,0)',opacity:0});
        TweenMax.from($(".face4"),time,{transform:'translate3d(0,-'+len+'px,0)',opacity:0});
        TweenMax.from($(".face5"),time,{transform:'translate3d(0,0,-'+len+'px)',opacity:0});
    }

    $(".cube").click(function(){
        var ani = getRandomInt(0,3);
        //ani = 2;
        if(ani==0){
            var time = 1;
            cubeExplode(6,time);
            setTimeout(function(){cubeResize(1);},time*1000);
        }else if(ani==1){
            cubeResize(0.1);
            setTimeout(function(){cubeResize(2);},1000);
            setTimeout(function(){cubeResize(1);},2000);
        }else if(ani==2){
            cubeResize(1.3,0.2);
            TweenMax.to($(".face"),0.5,{backgroundColor:'red'});
            setTimeout('cubeResize(0.7,0.3)',200);
            setTimeout('cubeResize(1.3,0.2)',800);
            setTimeout('cubeResize(0.7,0.3)',1000);
            setTimeout('cubeResize(1.3,0.2)',1500);
            setTimeout(function(){
                TweenMax.to($(".face"),0.3,{backgroundColor:'#f0d6c5'});
                cubeResize(1,0.3);
            },1700);
        }else if(ani==3){
            console.log("uh");
        }


    });
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
});

function cubeResize(scale,time){
    scale = scale || 1;
    time = time || 1;
    var len = length*scale;
    TweenMax.to($(".face0"),time,{transform:'translate3d(0,0,'+len+'px)'});
    TweenMax.to($(".face1"),time,{transform:'translate3d('+len+'px,0,0) rotateY(90deg)'});
    TweenMax.to($(".face2"),time,{transform:'translate3d(-'+len+'px,0,0) rotateY(-90deg)'});
    TweenMax.to($(".face3"),time,{transform:'translate3d(0,'+len+'px,0) rotateX(-90deg)'});
    TweenMax.to($(".face4"),time,{transform:'translate3d(0,-'+len+'px,0) rotateX(90deg)'});
    TweenMax.to($(".face5"),time,{transform:'translate3d(0,0,-'+len+'px) rotateY(180deg)'});
    TweenMax.to($(".face"),time,{width:len*2 + 'px',height:len*2 +'px'})
}
function cubeTranslate(x){
    TweenMax.to($(".cube"),1,{marginRight:x+'%'});
}

function cubeExplode(scale,time){
    time = time || 1;
    var len = length*scale;
    TweenMax.to($(".face0"),time,{transform:'translate3d(0,0,'+len+'px) rotateX(180deg) rotateY(180deg)'});
    TweenMax.to($(".face1"),time,{transform:'translate3d('+len+'px,0,0) rotateY(270deg) rotateX(180deg)'});
    TweenMax.to($(".face2"),time,{transform:'translate3d(-'+len+'px,0,0) rotateY(-270deg) rotateX(180deg)'});
    TweenMax.to($(".face3"),time,{transform:'translate3d(0,'+len+'px,0) rotateX(-270deg) rotateX(180deg)'});
    TweenMax.to($(".face4"),time,{transform:'translate3d(0,-'+len+'px,0) rotateX(270deg) rotateY(180deg)'});
    TweenMax.to($(".face5"),time,{transform:'translate3d(0,0,-'+len+'px) rotateY(360deg) rotateY(180deg)'});
    TweenMax.to($(".face"),time,{width:length/2 + 'px',height:length/2 +'px'})
}
