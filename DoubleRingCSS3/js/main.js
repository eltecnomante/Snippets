$(document).ready(function(){
    $('[data-tooltip]').addClass('tooltip');
    $('.tooltip').each(function() {
        $(this).append('<span class="tooltip-content">' + $(this).attr('data-tooltip') + '</span>');
    });

    if ($.browser.msie && $.browser.version.substr(0,1)<7)
    {
      $('.tooltip').mouseover(function(){
            $(this).children('.tooltip-content').css('visibility','visible');
          }).mouseout(function(){
            $(this).children('.tooltip-content').css('visibility','hidden');
          })
    }
});
