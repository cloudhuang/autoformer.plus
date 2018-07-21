//console.log("=== autoformer_content_script_start: "+document.location.href);		
////////////////////////////////////////////////////////////////////////
var g_AutoFormerPrefix = "AF1";
var g_AutoFormerLock   = "AutoFormerLock";
var g_ElementsLoaded = 0;
var g_ElementsSaved = 0;
var g_ElementsCleared = 0;
var g_MutationObserver = null;
////////////////////////////////////////////////////////////////////////
function setLock(){
	var key_old = window.sessionStorage.getItem(g_AutoFormerLock);
	var key_new = Date.now();
	if(key_old == null || key_new - key_old > 5000)
		window.sessionStorage.setItem(g_AutoFormerLock, key_new);
} 

function isLockCurrent(){
	var result = true;
	var key_old = window.sessionStorage.getItem(g_AutoFormerLock);
	var key_new = Date.now();
	var key_delta = key_new - key_old;
	if(key_delta > 500)
		result = false;
	return result;		
} 
////////////////////////////////////////////////////////////////////////
function getInputsCount()
{
	var inputs_count = 0;
	
	var elements = document.getElementsByTagName("textarea");
	for(var i=0; i<elements.length; i++)
		inputs_count += canElementSave(elements.item(i));
	elements = document.getElementsByTagName("input");
	for(var i=0; i<elements.length; i++)
		inputs_count += canElementSave(elements.item(i));
	elements = document.getElementsByTagName("select");
	for(var i=0; i<elements.length; i++)
		inputs_count += canElementSave(elements.item(i));
			
	return inputs_count;
}

function getRecordsCount()
{
	var records_count = 0;
	
	var ls = window.localStorage;
	var ls_length = ls.length;
	var whanted_prefix = g_AutoFormerPrefix + "@";

	for(var i=0; i<ls_length; i++){
		var key = ls.key(i);
		if(key.indexOf(whanted_prefix) != -1)
			records_count++;
	}
	
	return records_count;
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
			
		if(type == "radio")	
			result = et.checked;
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
	//et.focus();
	et.dispatchEvent(new Event("focus"));
	
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
	var is_saved = 0;
	if(canElementSave(et)){
		var key = g_AutoFormerPrefix + "@" + getElementFormName(et) + "@" + getElementName (et);
		var value = getElementValue(et);
		if((typeof(value) == "string" && value.length) || typeof(value) == "boolean"){
			window.localStorage.setItem(escape(key), escape(value));
			is_saved = 1;
		}
	}

	return is_saved;
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
	var is_cleared = 0;
	var key = g_AutoFormerPrefix + "@" + getElementFormName(et) + "@" + getElementName(et);
	if(window.localStorage.getItem(escape(key)) != null){
		window.localStorage.removeItem(escape(key));
		is_cleared = 1;
	}
	return is_cleared;
}

function saveAll(){
	g_ElementsSaved = 0;
	
	var elements = document.getElementsByTagName("textarea");
	for(var i=0; i<elements.length; i++)
		g_ElementsSaved += saveElement(elements.item(i));
	elements = document.getElementsByTagName("input");
	for(var i=0; i<elements.length; i++)
		g_ElementsSaved += saveElement(elements.item(i));
	elements = document.getElementsByTagName("select");
	for(var i=0; i<elements.length; i++)
		g_ElementsSaved += saveElement(elements.item(i));
		
	if(g_ElementsSaved)	
		chrome.runtime.sendMessage({msg:"save-count", count:g_ElementsSaved});
}

function loadAll(blankOnly){
	setLock();
	g_ElementsLoaded = 0;
	
	var elements = document.getElementsByTagName("textarea");
	for(var i=0; i<elements.length; i++)
		if(blankOnly){
			if(elements.item(i).value.length == 0)
				g_ElementsLoaded += loadElement(elements.item(i));
		}
		else
			g_ElementsLoaded += loadElement(elements.item(i));
		
	elements = document.getElementsByTagName("input");
	for(var i=0; i<elements.length; i++)
		if(blankOnly){
			if(elements.item(i).value.length == 0)
				g_ElementsLoaded += loadElement(elements.item(i));
		}
		else
			g_ElementsLoaded += loadElement(elements.item(i));
		
	elements = document.getElementsByTagName("select");
	for(var i=0; i<elements.length; i++)
		g_ElementsLoaded += loadElement(elements.item(i));
		
	if(g_ElementsLoaded)
		chrome.runtime.sendMessage({msg:"load-count", count:g_ElementsLoaded});
}

function clearAll(){
	g_ElementsCleared = 0;
	
	var ls = window.localStorage;
	var ls_length = ls.length;
	var whanted_prefix = g_AutoFormerPrefix + "@";

	for(var i=ls_length-1; i>=0; i--)
	{
		var key = ls.key(i);
		if(key.indexOf(whanted_prefix) != -1){
			ls.removeItem(key);
			g_ElementsCleared++; 
		}
	}
	
	if(g_ElementsCleared)
		chrome.runtime.sendMessage({msg:"clear-count", count:g_ElementsCleared});
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
					loadAll(0);
			}
		}
	});
	g_MutationObserver.observe(document.body, {subtree:true, childList:true});
}
////////////////////////////////////////////////////////////////////////
function doAutoload(){
	loadAll(0);
	if(g_ElementsLoaded)
		window.scrollTo(0, 0); 
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
	if(request.msg === "save_field"){
		g_ElementsSaved = saveElement(document.activeElement);
		if(g_ElementsSaved)	
			chrome.runtime.sendMessage({msg:"save-count", count:g_ElementsSaved});
	}
		
	if(request.msg === "load_field"){
		setLock();
		g_ElementsLoaded = loadElement(document.activeElement);
		if(g_ElementsLoaded)
			chrome.runtime.sendMessage({msg:"load-count", count:g_ElementsLoaded});
	}

	if(request.msg === "clear_field"){
		g_ElementsCleared = clearElement(document.activeElement);
		if(g_ElementsCleared)
			chrome.runtime.sendMessage({msg:"clear-count", count:g_ElementsCleared});
	}
	
	if(request.msg === "save_all")
		saveAll();
	
	if(request.msg === "load_all")
		loadAll(request.mode_ext);
	
	if(request.msg === "clear_all")
		clearAll();
		
	if(request.msg === "do-autoload")
		doAutoload();
		
	if(request.msg === "stop-autoload")
		stopAutoload();
		
	if(request.msg === "get-popup-enable"){
		var inputs_count = getInputsCount();
		var records_count = getRecordsCount();
		chrome.runtime.sendMessage({msg:"set-popup-enable", inputs_count:inputs_count, records_count:records_count});
	}
}
chrome.runtime.onMessage.addListener(on_messages_content);
chrome.runtime.sendMessage({msg:"can-autoload"});
//console.log("=== autoformer_content_script_end: "+document.location.href);		
////////////////////////////////////////////////////////////////////////