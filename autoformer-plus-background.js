////////////////////////////////////////////////////////////////////////
var g_autoload = 1;
var new_value = window.localStorage.getItem("AF1_autoload");
if(new_value == null)
	window.localStorage.setItem("AF1_autoload", 1);
else
	g_autoload = parseInt(new_value);
////////////////////////////////////////////////////////////////////////
function check_toolbar_icon(){
	if(g_autoload)
		chrome.browserAction.setIcon({path: "img/autoformer-plus-16.png"});
	else	
		chrome.browserAction.setIcon({path: "img/autoformer-plus-16-gray.png"});
}	
check_toolbar_icon();
////////////////////////////////////////////////////////////////////////
var menu_list = ["save_field", "load_field", "clear_field", "separator", "save_all", "load_all", "clear_all"];

var context_list = ["editable"];
if(navigator.userAgent.indexOf("Gecko/") != -1) // Chrome does not support "password"
	context_list[1] = "password";

for(var menu_id of menu_list){

	var menu_item = {
			id: menu_id,
			title: "",
			type: "normal",
			contexts: context_list
		};
		
	if(menu_id.indexOf("separator") != -1)
		menu_item.type = "separator";
	else
		menu_item.title = chrome.i18n.getMessage(menu_id);
		
	chrome.contextMenus.create(menu_item);	
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
	chrome.tabs.sendMessage(tab.id, { msg: info.menuItemId });
});
////////////////////////////////////////////////////////////////////////
function on_messages_background(request, sender) {
	if(request.msg === "get-popup-autoload" && g_autoload)
		chrome.runtime.sendMessage({msg:"set-popup-autoload"});
		
	if(request.msg === "change-option-autoload"){
		if(g_autoload)
			g_autoload = 0;
		else
			g_autoload = 1;
		window.localStorage.setItem("AF1_autoload", g_autoload);		
		check_toolbar_icon();
	}
	
	if(request.msg === "can-autoload" && g_autoload)
		chrome.tabs.sendMessage(sender.tab.id, {msg:"do-autoload"});
		
	if(request.msg === "autoload-count")
		chrome.browserAction.setBadgeText({text:request.count.toString(), tabId:sender.tab.id});	
}
chrome.runtime.onMessage.addListener(on_messages_background); 
////////////////////////////////////////////////////////////////////////
	
