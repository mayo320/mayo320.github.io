$(document).ready(function(){
    //Repositioning on window too small
    var mobile = false;
    var responsive_width = 850;
    var $sidebar = $(".sidebar");
    var $content = $(".content");
    var $item_details = $(".item_details");
    function onresize(){
        //changing details width
        if($item_details.width() <= responsive_width){$(".item_details .box .subbox").css("width","94%");}
        else{$(".item_details .box .subbox").css("width","48%");}

        //changing sidebar and item/details position
        if(($(window).width() <= responsive_width && !$sidebar.hasClass("responsive_sidebar") || mobile)){
            $sidebar.addClass("responsive_sidebar");
            $content.addClass("responsive_item");
            $item_details.addClass("responsive_item");
        }else if(($(window).width() > responsive_width && $sidebar.hasClass("responsive_sidebar") && !mobile)){
            $sidebar.removeClass("responsive_sidebar");
            $content.removeClass("responsive_item");
            $item_details.removeClass("responsive_item");
        }
        if(typeof(learn_y) != "undefined") learn_y = $('.learning_history').offset().top;

        //increase fontsize on mobile
        if(mobile) $("body").css("font-size","130%");
    }
    $(window).resize(function(){onresize();});
    var ua = navigator.userAgent.toLowerCase();
    if(ua.indexOf("android") != -1 || ua.indexOf("ios") != -1 || ua.indexOf("mobile") != -1) mobile = true;
    onresize();

    $(".sidebar .description .circle").hover(function(){
        this.innerHTML = $(this).attr("data");
    },function(){
        $(this).html($(this).attr("data")[0]);
    });

});
