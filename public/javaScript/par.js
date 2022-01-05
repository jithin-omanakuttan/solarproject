//    parallax scrolling 
$(window).scroll(function(){ 
    var scrollTop=$(this).scrollTop();
     
    $('.bg-img-service').css('top',-(scrollTop*0.4) + 'px'); 

    $('.bg-img-future').css('top',-(scrollTop*0.2) + 'px'); 
   }) 