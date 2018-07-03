var menu_list = ["save_field", "separator-1", "save_all", "load_all", "separator-2", "clear_all"];

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
	chrome.tabs.sendMessage(tab.id, { type: info.menuItemId });
});
