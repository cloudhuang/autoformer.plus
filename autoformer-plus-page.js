//console.log("=== autoformer_content_script_start: "+document.location.href);		
////////////////////////////////////////////////////////////////////////
var g_AutoFormerPrefix = "AF1";
var g_AutoFormerLock   = "AutoFormerLock";
var g_ElementsFilledCount = 0;
var g_MutationObserver = null;
////////////////////////////////////////////////////////////////////////
function setLock(){
	var key_old = window.sessionStorage.getItem(g_AutoFormerLock);
	var key_new = Date.now();
	if(key_old == null || key_new > key_old + 5000)
		window.sessionStorage.setItem(g_AutoFormerLock, key_new);
} 

function isLockCurrent(){
	var key_old = window.sessionStorage.getItem(g_AutoFormerLock);
	var key_new = Date.now();
	var key_delta = key_new - key_old;
	if(key_delta > 100)
		return false;
	return true;		
} 
////////////////////////////////////////////////////////////////////////
function isFormElement(et){ 
	if(et == null || et.nodeName == null)
		return false;
		
	var tag = et.nodeName.toString().toLowerCase();
	if(tag == "input" || tag == "textarea" || tag == "select")
		return true;
	
	return false;	
}

function canElementSave(et) 
{
	if(et.offsetWidth < 1) // We don`t save hiddent inputs
		return false;

	var result = true;
	var type = et.getAttribute("type");
	if (type != null){
		type = type.toString().toLowerCase();
		if (type == "button" || type == "file" || type == "hidden" || type == "image" || type == "reset" || type == "submit")
			result = false;
	}
	return result;
}

function getElementName(et){
	var element_name = et.name;
	if(element_name.length == 0)
		element_name = et.id;
	element_name = element_name.toString().toLowerCase();
	return element_name;
}

function getElementFormName(et){
	var name = "";
	if(et.form != null)
		name = getElementName(et.form);
	return name;
}

function getElementValue(et){
	var value="";
	var nodeName = et.nodeName.toString().toLowerCase();
	
	if(nodeName == "textarea")
		value = et.value;
		
	if(nodeName == "input"){
		var type = et.getAttribute("type");
		if(type != null)
			type = type.toString().toLowerCase();
		if(type == "checkbox")
			value = et.checked;
		else
		if(type == "radio"){
			if(et.checked)
				value = et.value;
			else
				value = ""; //???
		}
		else
			value = et.value;
	}
	
	if(nodeName == "select"){
		for(var i=0; i<et.options.length; i++){
			if(et.options.item(i).selected)
				value += et.options.item(i).value + "@";
		}
	}
	
	return value;
}

function setElementValue(et, value){
	 var nodeName = et.nodeName.toString().toLowerCase();

     if(nodeName == "textarea")
		et.value = value;

     if(nodeName == "input"){
		var type = et.getAttribute("type");
		if(type != null)
			type = type.toString().toLowerCase();
		if(type == "checkbox")
			et.checked = (value == "true");
		else
		if(type == "radio")
			et.checked = (et.value == value);
		else
			et.value = value;
     }

     if(nodeName == "select")
     {
		for(var i=0; i<et.options.length; i++)
			et.options.item(i).selected = value.indexOf(et.options.item(i).value + "@") != -1;
     }
	 
	if(isLockCurrent()){
		var event_change = new Event("change");
		et.dispatchEvent(event_change);
	}
}

////////////////////////////////////////////////////////////////////////

function saveElement(et){
	if(canElementSave(et)){
		var key = g_AutoFormerPrefix + "@" + getElementFormName(et) + "@" + getElementName (et);
		var value = getElementValue(et);
		window.localStorage.setItem(escape(key), escape(value));
	}
}

function loadElement(et){
	var is_loaded = 0;
	var key = g_AutoFormerPrefix + "@" + getElementFormName(et) + "@" + getElementName(et);
	var value = window.localStorage.getItem(escape(key));
	if(value != null && value.length){
		setElementValue(et, unescape(value));
		is_loaded = 1;
	}
	return is_loaded;
}

function clearElement(et){
	var key = g_AutoFormerPrefix + "@" + getElementFormName(et) + "@" + getElementName(et);
	window.localStorage.removeItem(escape(key));
}

function saveAll(){
	var elements = document.getElementsByTagName("textarea");
	for(var i=0; i<elements.length; i++)
		saveElement(elements.item(i));
	elements = document.getElementsByTagName("input");
	for(var i=0; i<elements.length; i++)
		saveElement(elements.item(i));
	elements = document.getElementsByTagName("select");
	for(var i=0; i<elements.length; i++)
		saveElement(elements.item(i));
}

function loadAll(){
	g_ElementsFilledCount = 0;
	
	var elements = document.getElementsByTagName("textarea");
	for(var i=0; i<elements.length; i++)
		g_ElementsFilledCount += loadElement(elements.item(i));
	elements = document.getElementsByTagName("input");
	for(var i=0; i<elements.length; i++)
		g_ElementsFilledCount += loadElement(elements.item(i));
	elements = document.getElementsByTagName("select");
	for(var i=0; i<elements.length; i++)
		g_ElementsFilledCount += loadElement(elements.item(i));
		
	if(g_ElementsFilledCount)
		chrome.runtime.sendMessage({msg:"autoload-count", count:g_ElementsFilledCount});
}

function clearAll(){
	var ls = window.localStorage;
	var ls_length = ls.length;
	var whanted_prefix = g_AutoFormerPrefix + "@";

	for(var i=ls_length-1; i>=0; i--)
	{
		var key = ls.key(i);
		if(key.indexOf(whanted_prefix) != -1)
			ls.removeItem(key);
	}
}

////////////////////////////////////////////////////////////////////////
function runMutationObserver(){
	if(g_MutationObserver != null)
		return;

	g_MutationObserver = new MutationObserver(function(mutationsList){
		for(var mutation of mutationsList){
			for(var i=0; i<mutation.addedNodes.length; i++){
				var node = mutation.addedNodes.item(i);	
				if(node.nodeName == "FORM")
					loadAll();
			}
		}
	});
	g_MutationObserver.observe(document.body, {subtree:true, childList:true});
}
////////////////////////////////////////////////////////////////////////
function doAutoload(){
	setLock();
	loadAll();
	runMutationObserver();
}

function stopAutoload(){
	if(g_MutationObserver){
		g_MutationObserver.disconnect();
		g_MutationObserver = null;
	}
}
////////////////////////////////////////////////////////////////////////
function on_messages_content(request, sender, sendResponse) {
//console.log("=== on_messages_content::request.msg:"+request.msg);		

	if(request.msg === "save_field")
		saveElement(document.activeElement);
		
	if(request.msg === "load_field"){
		g_ElementsFilledCount = loadElement(document.activeElement);
		if(g_ElementsFilledCount)
			chrome.runtime.sendMessage({msg:"autoload-count", count:g_ElementsFilledCount});
	}

	if(request.msg === "clear_field")
		clearElement(document.activeElement);
	
	if(request.msg === "save_all")
		saveAll();
	
	if(request.msg === "load_all")
		loadAll();
	
	if(request.msg === "clear_all")
		clearAll();
		
	if(request.msg === "do-autoload")
		doAutoload();
		
	if(request.msg === "stop-autoload")
		stopAutoload();
}
chrome.runtime.onMessage.addListener(on_messages_content);
chrome.runtime.sendMessage({msg:"can-autoload"});
//console.log("=== autoformer_content_script_end: "+document.location.href);		
////////////////////////////////////////////////////////////////////////
