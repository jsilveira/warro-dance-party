window.realtimeChatUri = "https://warro-dance-party.herokuapp.com";
var uiServer = "https://warro-dance-party.herokuapp.com/ui/";

var lt = String.fromCharCode(60)
var gt = String.fromCharCode(62)

$("body").append($(lt+'div id="app"'+gt+lt+'/div'+gt));

$(lt+'link/'+gt, {rel: 'stylesheet', type: 'text/css', href: 'https://fonts.googleapis.com/css?family=Roboto&display=swap'}).appendTo('head');
$(lt+'link/'+gt, {rel: 'stylesheet', type: 'text/css', href: 'https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css'}).appendTo('head');
$(lt+'link/'+gt, {rel: 'stylesheet', type: 'text/css', href: uiServer+'party.5b5cc299.css'}).appendTo('head');

$.getScript(uiServer+"src.7ed060e2.js", function(data, textStatus, jqxhr) {
  console.log('Loaded src.js.', jqxhr.status, textStatus);
})
