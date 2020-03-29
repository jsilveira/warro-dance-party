window.realtimeChatUri = "https://warro-dance-party.herokuapp.com/ui/";
var uiServer = "https://warro-dance-party.herokuapp.com/ui/";

$("body").append($('<div id="app"></div>'))

$('<link/>', {rel: 'stylesheet', type: 'text/css', href: 'https://fonts.googleapis.com/css?family=Roboto&display=swap'}).appendTo('head');
$('<link/>', {rel: 'stylesheet', type: 'text/css', href: 'https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css'}).appendTo('head');
$('<link/>', {rel: 'stylesheet', type: 'text/css', href: uiServer+'party.5b5cc299.css'}).appendTo('head');

$.getScript(uiServer+"src.7ed060e2.js", function(data, textStatus, jqxhr) {
  console.log('Loaded src.js.', jqxhr.status, textStatus);
})
