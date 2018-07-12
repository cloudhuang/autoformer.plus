////////////////////////////////////////////////////////////////////////
var g_current_tab_inputs = 0;
var g_current_tab_stored = 0;
////////////////////////////////////////////////////////////////////////
function on_document_click(e){
	if(e.target.classList.contains("autoload")){
		chrome.runtime.sendMessage({msg:"change-option-autoload"});
		window.close();
	}
		
	var msg_to_tab = null;
	var mode_ext = 0;
	if(e.target.classList.contains("save-all"))
		msg_to_tab = "save_all";
	if(e.target.classList.contains("load-all")){
		msg_to_tab = "load_all";
		mode_ext = e.shiftKey;
	}
	if(e.target.classList.contains("clear-all"))
		msg_to_tab = "clear_all";
		
	if(msg_to_tab != null){	
		chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {msg:msg_to_tab, mode_ext:mode_ext});
			window.close();
		});
	}
}
//
document.addEventListener("click", on_document_click); 
////////////////////////////////////////////////////////////////////////
function show_as_autoload() {
	var spacer = document.getElementById("button_autoload").firstChild;		
	spacer.innerHTML = "<img src=\"img/tick.png\" class=\"autoload\">";
}
//
function reenable_menu_item(item_id, enable){
	document.getElementById(item_id).parentNode.classList.remove("disabled");
	if(!enable)
		document.getElementById(item_id).parentNode.classList.add("disabled");
}
//
function on_messages_popup(request, sender, sendResponse) {
//console.log("=== on_messages_popup::request.msg:"+request.msg);	
	if(sender.id != chrome.runtime.id)
		return;
	
	if(request.msg === "set-popup-autoload")	
		show_as_autoload();
	if(request.msg === "set-popup-enable"){
		g_current_tab_inputs += request.inputs_count;
		g_current_tab_stored += request.records_count;
		
		reenable_menu_item("label_save_all", g_current_tab_inputs > 0);
		reenable_menu_item("label_load_all", g_current_tab_inputs > 0 && g_current_tab_stored);
		reenable_menu_item("label_clear_all", g_current_tab_inputs > 0 && g_current_tab_stored);
	}	
}
//
chrome.runtime.onMessage.addListener(on_messages_popup); 
chrome.runtime.sendMessage({msg:"get-popup-autoload"});
////////////////////////////////////////////////////////////////////////
document.getElementById("label_autoload").innerText = chrome.i18n.getMessage("popup_menu_autoload");
document.getElementById("label_save_all").innerText = chrome.i18n.getMessage("save_all");
var et_load_all = document.getElementById("label_load_all");
et_load_all.innerText = chrome.i18n.getMessage("load_all");
et_load_all.setAttribute("title", chrome.i18n.getMessage("load_all_shift"));
document.getElementById("label_clear_all").innerText = chrome.i18n.getMessage("clear_all");

chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
	var current_tab_url = tabs[0].url;
	if(current_tab_url.indexOf("http://") == -1 && current_tab_url.indexOf("https://") == -1){
		reenable_menu_item("label_save_all", 0);
		reenable_menu_item("label_load_all", 0);
		reenable_menu_item("label_clear_all", 0);
	}
	else 
		chrome.tabs.sendMessage(tabs[0].id, {msg:"get-popup-enable"});
});
 
////////////////////////////////////////////////////////////////////////
var browser_lang = chrome.i18n.getUILanguage();
if(browser_lang.indexOf("ar") == 0 || 
   browser_lang.indexOf("fa") == 0 || 
   browser_lang.indexOf("he") == 0 || 
   browser_lang.indexOf("ur") == 0 )
	document.body.style.direction = "rtl";
////////////////////////////////////////////////////////////////////////