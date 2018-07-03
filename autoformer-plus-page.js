////////////////////////////////////////////////////////////////////////
var g_AutoFormerPrefix = "AF1";

////////////////////////////////////////////////////////////////////////
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
	 
	var event_change = new Event("change");
	et.dispatchEvent(event_change);
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
	var key = g_AutoFormerPrefix + "@" + getElementFormName(et) + "@" + getElementName(et);
	var value = window.localStorage.getItem(escape(key));
	if(value != null && value.length)
		setElementValue(et, unescape(value));
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
	var elements = document.getElementsByTagName("textarea");
	for(var i=0; i<elements.length; i++)
		loadElement(elements.item(i));
	elements = document.getElementsByTagName("input");
	for(var i=0; i<elements.length; i++)
		loadElement(elements.item(i));
	elements = document.getElementsByTagName("select");
	for(var i=0; i<elements.length; i++)
		loadElement(elements.item(i));
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
function msg_from_background(request, sender, sendResponse) {
	if(request.type === "save_field")
		saveElement(document.activeElement);
	
	if(request.type === "save_all")
		saveAll()
	
	if(request.type === "load_all")
		loadAll()
	
	if(request.type === "clear_all")
		clearAll()
}
chrome.runtime.onMessage.addListener(msg_from_background);
loadAll();
////////////////////////////////////////////////////////////////////////
//console.log("=== load 1 field ==="+getElementName(document.activeElement));
