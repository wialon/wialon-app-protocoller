/// Callbacks array
var callbacks = {};

/// current retranslator
var curRetranslator = null;
/// pause image
var PAUSE_IMG = "img/pause.png";
/// play image
var PLAY_IMG = "img/play.png";
/// stopped state image
var STOPPED_IMG = "img/stopped.png";
/// active state image
var ACTIVE_IMG = "img/active.png";
/// delete image
var DEL_IMG = "img/del.png";
/// flag that indicates wether retranslator units need to be updated
var needUpdateRetrUnits = false;
/// flag that indicates wether cancel button was pressed
var cancelPressed = false;
/// flag that indicates wether deleting action was happend before
var wasDeleted = false;
/// flag that indicates wether creating action was happend before
var wasCreated = false;
/// id for search timeout
var timeoutId = 0;

/// indicate default port
function defaultPort(protocol) {
	switch (protocol) {
 		case "wialon": return 20163;
		case "granit3": return 20121;
		case "skaut": return document.getElementById("retr_scoutOpen").checked ? 20654 : 20117;
		case "cyber_glx": return 20185;
		case "wialon_ips": return 20332;
		case "vt300": return 20180;
		case "egts": return 20629;
		case "soap": return 80;
		case "trn": return 4880;
		case "nvg": return 8416;
		default: return 0;
	}
};

/// Execute callback
function execCallback(id) {
	if (!callbacks[id])
		return;
	callbacks[id].call();
}
/// Wrap callback
function wrapCallback(callback) {
	var id = (new Date()).getTime();
	callbacks[id] = callback;
	return id;
}

/// IE check
function ie() {
	return (navigator.appVersion.indexOf("MSIE 6") != -1 || navigator.appVersion.indexOf("MSIE 7") != -1 || navigator.appVersion.indexOf("MSIE 8") != -1);
}

/// Fetch varable from 'GET' request
function getUrlParameter(name) {
	if (!name)
		return null;
	var pairs = decodeURIComponent(document.location.search.substr(1)).split("&");
	for (var i = 0; i < pairs.length; i++) {
		var pair = pairs[i].split("=");
		if (pair[0] == name) {
			pair.splice(0, 1);
			return pair.join("=");
		}
	}
	return null;
}

/// Load scripts
function loadScript(src, callback) {
	var script = document.createElement("script");
	script.setAttribute("type","text/javascript");
	script.setAttribute("charset","UTF-8");
	script.setAttribute("src", src);
	if (callback && typeof callback === "function") {
		var id = wrapCallback(callback);
		if (ie()) {
			script.onreadystatechange = function () {
				if (this.readyState === 'complete' || this.readyState == 'loaded') {
					callback();
				}
			};
		} else {
			script.setAttribute("onLoad", "execCallback(" + wrapCallback(callback) + ")");
		}
	}
	document.getElementsByTagName("head")[0].appendChild(script);
}

/// Init SDK
function initSdk () {
	var url = getUrlParameter("baseUrl");
	if (!url) {
		url = getUrlParameter("hostUrl");
	}
	if (!url) {
		return null;
	}
	var user = getUrlParameter("user");
	if(!user)
		return null;
	wialon.core.Session.getInstance().initSession(url);
	wialon.core.Session.getInstance().duplicate(getUrlParameter("sid"), user, true, login);
}

/// Initialize
$(document).ready(function () {	
	var url = getUrlParameter("baseUrl");
	if (!url) 
		url = getUrlParameter("hostUrl");
	if (!url)
		return null;
	url += "/wsdk/script/wialon.js";
	
	LANG = getUrlParameter("lang");
	if ((!LANG) || ($.inArray(LANG, ["en", "ru"]) == -1))
		LANG = "en";
	$.localise('lang/', {language: LANG});
	
	initControls();
	loadScript(url, initSdk);
});

/// Login 
function login(code) {
	if (code) {
		alert("Login error.");
		return;
	}	
	wialon.core.Session.getInstance().getAccountData(true, function (code, data) {
			if (code === 0 && data.settings && data.settings.combined &&
				data.settings.combined.services && data.settings.combined.services.avl_retranslator && data.settings.combined.services.avl_retranslator.cost!=-1)
				initEnvironment();
			else 
				alert($.localise.tr("Retranslation service is not activated in your account. Please, contact your service administrator for details."));			
	});
}

/// Insert interface translations and bind handlers
function initControls() {
	
	// IE style fix
	if(navigator.appVersion.indexOf("MSIE 10") == -1 && navigator.appVersion.indexOf("MSIE") != -1) {
		$("#retr_col_content").width(parseInt($("#retr_col").width())+16);
		$("#prop_col_content").width(parseInt($("#prop_col").width())+15);
	}
	
	$(window).resize( function() {searchUnits();});
	
	$("#retr_col_header").html($.localise.tr("Retranslator"));
	$("#prop_col_header").html($.localise.tr("Retranslator properties"));
	$("#units_col_header").html($.localise.tr("All units"));
	$("#new_retr span").append($.localise.tr("New retranslator"));
	$("#retr_cancel").html($.localise.tr("Cancel"));
	$("#retr_ok").val($.localise.tr("OK"));
	
	jQuery("#retr_name").attr("title", "X").Tooltip({showURL: false, track_children: true, bodyHandler: function(e) {return $.localise.tr("Name");}});
	jQuery("#retr_type").attr("title", "X").Tooltip({showURL: false, track_children: true, bodyHandler: function(e) {return $.localise.tr("Retranslation protocol");}});
	jQuery("#retr_server").attr("title", "X").Tooltip({showURL: false, track_children: true, bodyHandler: function(e) {return $.localise.tr("Server");}});
	jQuery("#retr_port").attr("title", "X").Tooltip({showURL: false, track_children: true, bodyHandler: function(e) {return $.localise.tr("Port");}});
	jQuery("#retr_auth").attr("title", "X").Tooltip({showURL: false, track_children: true, bodyHandler: function(e) {return $.localise.tr("Auth");}});
	jQuery("#retr_login").attr("title", "X").Tooltip({showURL: false, track_children: true, bodyHandler: function(e) {return $.localise.tr("Login");}});
	jQuery("#retr_pass").attr("title", "X").Tooltip({showURL: false, track_children: true, bodyHandler: function(e) {return $.localise.tr("Password");}});	
	$("[for=retr_ssl]").html($.localise.tr("Secure connection"));
	$("[for=retr_v6type]").html($.localise.tr("Protocol v.6"));
	$("[for=retr_notauth]").html($.localise.tr("Disable authorization"));
	$("#retr_scoutOpen_block").find("label[for=retr_scoutOpen]").html($.localise.tr("ScoutOpen protocol"));
	$("#retr_binauth_block").find("label[for=retr_binauth]").html($.localise.tr("Binary auth"));
	
	$("#retr_scoutOpen").change(function(){
		$("#retr_port").val(
			defaultPort( $("#retr_type").val() )
		);
	});

	$("#retr_type").change(function (e){
		$("#retr_props input[type=text]:gt(0)").val("");
		$("#retr_props input[type=checkbox]").attr("checked", false);
		
		var retrType = e.currentTarget.value;
		if (retrType == "wialon" || retrType == "cyber_glx" || retrType == "vt300" || retrType == "nvg") {
			$("#retr_server").attr("class","input retr-server");
			$("#retr_port").css("display","inline-block").val();
			$("#retr_binauth_block, #retr_auth, #retr_login, #retr_pass, #retr_ssl_block, #retr_v6type_block, #retr_notauth_block, #retr_scoutOpen_block").css("display","none");
		} else if (retrType == "skaut") {
			$("#retr_server").attr("class","input retr-server");
			$("#retr_port").css("display","inline-block").val();
			$("#retr_scoutOpen_block").css("display","inline-block");
			$("#retr_binauth_block, #retr_auth, #retr_login, #retr_pass, #retr_ssl_block, #retr_v6type_block, #retr_notauth_block").css("display","none");
		} else if (retrType == "nis") {
			$("#retr_server").attr("class","input retr-server-long");
			$("#retr_auth, #retr_ssl_block").css("display","inline-block");
			$("#retr_binauth_block, #retr_port, #retr_login, #retr_pass, #retr_v6type_block, #retr_notauth_block, #retr_scoutOpen_block").css("display","none");
		} else if (retrType == "rtti") {
			$("#retr_server").attr("class","input retr-server-long");
			$("#retr_auth").css("display","inline-block");
			$("#retr_binauth_block, #retr_port, #retr_login, #retr_pass, #retr_v6type_block, #retr_notauth_block, #retr_scoutOpen_block").css("display","none");
		} else if (retrType == "granit3") {
			$("#retr_server").attr("class","input retr-server");
			$("#retr_port, #retr_v6type_block").css("display","inline-block");
			$("#retr_binauth_block, #retr_auth, #retr_login, #retr_pass, #retr_ssl_block, #retr_notauth_block, #retr_scoutOpen_block").css("display","none");
		} else if (retrType == "wialon_ips") {
			$("#retr_server").attr("class","input retr-server");
			$("#retr_port, #retr_auth").css("display","inline-block");
			$("#retr_binauth_block, #retr_login, #retr_pass, #retr_ssl_block, #retr_v6type_block, #retr_notauth_block, #retr_scoutOpen_block").css("display","none");
		} else if (retrType == "egts") {
			$("#retr_server").attr("class","input retr-server");
			$("#retr_port, #retr_notauth_block").css("display","inline-block");
			$("#retr_binauth_block, #retr_auth, #retr_login, #retr_pass, #retr_ssl_block, #retr_v6type_block, #retr_scoutOpen_block").css("display","none");
			$("#prop_col_content").attr("class","grey prop-col-content2");
		} else if (retrType == "soap") {
			$("#retr_server").attr("class","input retr-server-long");
			$("#retr_login, #retr_pass").css("display","inline-block");
			$("#retr_binauth_block, #retr_port, #retr_auth, #retr_ssl_block, #retr_v6type_block, #retr_notauth_block, #retr_scoutOpen_block").css("display","none");
		} else if (retrType == "trn") {
			$("#retr_server").attr("class","input retr-server");
			$("#retr_port, #retr_auth, #retr_binauth_block").css("display","inline-block");
			$("#retr_login, #retr_pass, #retr_ssl_block, #retr_v6type_block, #retr_notauth_block, #retr_scoutOpen_block").css("display","none");
		}
		
		$("#retr_port").val(defaultPort(retrType));
		
		$("#prop_col_content").css("top",$("#prop_col_header").height()+$("#retr_props").height()+15);
	}).change();	
	
	$("#new_retr").click(function() {
		saveOrNot();
		
		$(this).attr("new","new");
		clearRetrProperties();
		curRetranslator = null;
		$("#retr_name").val($.localise.tr("New retranslator")).select().focus();
		
		var selRow = $("tr[id^=retr_][class=grey]")[0];	
		var cells = $(selRow).children();
		if(cells.length == 4) {
			$(cells[1]).attr("colspan",2);
			$(cells[2]).remove();
		}	
		$(selRow).removeClass();
		
		return false;
	});
	$("#retr_name").keyup(function() {
		var regexp = /([\"\{\}\\])/i;
		if(this.value && this.value.length>=4 && this.value.length<=50 && this.value[0]!=" " && this.value[this.value.length-1]!=" " && !regexp.test(this.value))
			$("#retr_ok").attr("disabled",false);
		else
			$("#retr_ok").attr("disabled",true);
	});
	$("#retr_ok").click(updateRetranslator);
 	$("#retr_cancel").click(function() {
		cancelPressed = true;
		if (curRetranslator)
			$("tr[id=retr_"+curRetranslator.getId()+"]").click();
		else {
			clearRetrProperties();
			$("#retr_name").val($.localise.tr("New retranslator")).select().focus();
			cancelPressed = false;
		}
		return false;
	});	
}


/// Init wialon event system 
function initEnvironment() {
	/// retranslator data flags
	RETR_FLAGS = wialon.item.Item.dataFlag.base|wialon.item.Retranslator.dataFlag.state|wialon.item.Retranslator.dataFlag.units;
	/// unit data flags
	UNIT_FLAGS = wialon.item.Item.dataFlag.base|wialon.item.Unit.dataFlag.restricted|wialon.item.Item.dataFlag.image;
	// load library for working with unit icons
	wialon.core.Session.getInstance().loadLibrary("itemIcon");
	// init wialon event system
	var spec = [{type: "type", 
			data: "avl_retranslator", 
			flags: RETR_FLAGS, 
			mode: 0}];
	wialon.core.Session.getInstance().updateDataFlags(spec, function(code) {
		if(code) {
			alert("Error ["+ code +"]: " + wialon.core.Errors.getErrorText(code));
			return;
		}
		showRetranslators();
	});	
	
	var spec = [{type: "type", 
			data: "avl_unit", 
			flags: UNIT_FLAGS, 
			mode: 0}];
	wialon.core.Session.getInstance().updateDataFlags(spec, function(code) {
		if(code) {
			alert("Error ["+ code +"]: " + wialon.core.Errors.getErrorText(code));
			return;
		}
		searchUnits();
		$("#unit_search").keyup(function(e) {
			// ignore keys
			if (e.which == 37 || e.which == 38 || e.which == 39 || e.which == 40)
				return;	
			clearTimeout(timeoutId);
			timeoutId = window.setTimeout(searchUnits, 500);
		});
		$("#retr_list tr:eq(0)").click();
	});
}

/// Draw retranslators table
function showRetranslators() {	
	retranslators = wialon.core.Session.getInstance().getItems("avl_retranslator");	
	if (!retranslators || !retranslators.length)
		return;
	//sort by name in ascending order
	retranslators.sort(function(retr1, retr2){
		var name1 = retr1.getName().toLowerCase();
		var name2 = retr2.getName().toLowerCase();
		if(name1>name2)
			return 1;
		else
			return -1;
	});
	
	// populate table
	for(var i=0;i<retranslators.length;i++) 
		addRetrRow(retranslators[i]);
}

/// On retranslator click event handler
function onRetrClick(e) {
	var targetRow = this;
	var prevRow = $("tr[id^=retr_][class=grey]")[0];
		
	if(!(cancelPressed || wasDeleted || wasCreated)) {
		if(targetRow == prevRow) 
				return;	
		saveOrNot();
	}
	cancelPressed = wasDeleted = wasCreated = false;
	$("#retr_ok").attr("disabled",false);
	
	var preCells = $(prevRow).children();
	if(preCells.length == 4) {
		$(preCells[1]).attr("colspan",2);
		$(preCells[2]).remove();
	}
	$(prevRow).removeClass();
	if(navigator.appVersion.indexOf("MSIE 10") == -1 && navigator.appVersion.indexOf("MSIE") != -1)
		$(".retr-col2 div",prevRow).width(parseInt($(".retr-col2",prevRow).css("max-width"))+22)
	
	$(targetRow).addClass("grey");
	clearRetrProperties();
	var cells = $(targetRow).children();
	
	var retrId = targetRow.id.substring(5);	
	wialon.core.Session.getInstance().searchItem(retrId, RETR_FLAGS, function(code, item) {
		if (code)
			return;
		
		curRetranslator = item;	
				
		if (curRetranslator.getUserAccess() & wialon.item.Item.accessFlag.deleteItem) {
			$(cells[1]).attr("colspan",1);
			$(cells[2]).clone().appendTo(targetRow);
			$("td:eq(3) img",targetRow).click(onOperateRetranslator);
			$(cells[2]).html("<img src='"+DEL_IMG+"'/>").addClass("retr-col3");
			$("img[src*='del']",targetRow).click(onDeleteRetranslator);
			if(navigator.appVersion.indexOf("MSIE 10") == -1 && navigator.appVersion.indexOf("MSIE") != -1)
				$(".retr-col2 div",targetRow).width(parseInt($(".retr-col2",targetRow).css("max-width"))-2);
		}
		
		var config = curRetranslator.getConfig();
		$("#retr_name").val(curRetranslator.getName());
		$("#retr_type").val(config.protocol).change();
		$("#retr_server").val(config.server);
		$("#retr_port").val(config.port);
		$("#retr_auth").val(config.auth);
		$("#retr_login").val(config.login);
		$("#retr_pass").val(config.password);
		document.getElementById("retr_ssl").checked = parseInt(config.ssl);
		document.getElementById("retr_v6type").checked = parseInt(config.v6type);
		document.getElementById("retr_notauth").checked = parseInt(config.notauth);
		document.getElementById("retr_scoutOpen").checked = parseInt(config.scoutOpen);
		document.getElementById("retr_binauth").checked = parseInt(config.binauth);
		
		if (curRetranslator.getUserAccess() & wialon.item.Retranslator.accessFlag.editSettings)  {
			var retrUnits = curRetranslator.getUnits();
			var retrUnitsFull = [];
			for( var i=0; i<retrUnits.length; i++) {
				var unit = wialon.core.Session.getInstance().getItem(retrUnits[i].i);
				if (unit) {
					unit.a = retrUnits[i].a;
					unit.st = retrUnits[i].st;
					retrUnitsFull.push(unit);
				}
			}
			wialon.util.Helper.sortItems(retrUnitsFull);
			for( var i=0; i<retrUnitsFull.length; i++) {
				var retrUnit = retrUnitsFull[i];
				var id = retrUnit.getId();
				var unitCheckbox = $("#unit_check_"+id)[0];
				if (unitCheckbox)
					unitCheckbox.checked = true;
				$("#unit_name_"+id).addClass("grey-text");
				addRetrUnitRow(retrUnit);
			}
			
			if (!(curRetranslator.getUserAccess() & wialon.item.Retranslator.accessFlag.editUnits)) 
				$(".uniqueid-textfield, #units_list input").attr("disabled",true);
		}
		else {
			$("#retr_props input, #retr_props select").attr("disabled",true);
			$(".uniqueid-textfield, #units_list input").attr("disabled",true);
			$("#retr_buttons").css("display","none");
			$("#prop_col_content").addClass("zero-bottom");
		}
	});
	
}

/// Save changes in retranslator
function updateRetranslator() {
	if (typeof UNIT_FLAGS === 'undefined') {
		alert($.localise.tr("Retranslation service is not activated in your account. Please, contact your service administrator for details."));
		return;
	}
	
	var name = $("#retr_name").val();
	var config = getRetrConfig();
	var units = getRetrUnits();
			
	if(curRetranslator) {
		if(name != curRetranslator.getName()) 
			curRetranslator.updateName(name, function(code) {
				if (code)
					alert(sprintf($.localise.tr("Error editing name of retranslator '%s': %s."),name,wialon.core.Errors.getErrorText(code)));
			});	
		
		var oldConfig = curRetranslator.getConfig();
		config.debug = oldConfig.debug=="1"?"1":"0";
		if(!wialon.util.Helper.objectsEqual(oldConfig,config)) {
			curRetranslator.updateConfig(config, function(code) {
				if (code)
					alert(sprintf($.localise.tr("Error editing configuration of retranslator '%s': %s."),name,wialon.core.Errors.getErrorText(code)));
			});
		}
				
		if(needUpdateRetrUnits)
			curRetranslator.updateUnits(units, function(code) {
				if (code)
					alert(sprintf($.localise.tr("Error adding units to retranslator '%s': %s."),name,wialon.core.Errors.getErrorText(code)));
			});
		needUpdateRetrUnits = false;
		//var top = $("#retr_"+curRetranslator.getId()).position().top;
		//$("#retr_col_content").animate({scrollTop:top},"slow");
	}
	else {
		var user = wialon.core.Session.getInstance().getCurrUser();
		if (!user || !(user.getUserFlags() & wialon.item.User.userFlag.canCreateItems))
			return false;
			
		config.debug = "0";
		wialon.core.Session.getInstance().createRetranslator(user, name, config, RETR_FLAGS, function(code, retr) {
			if (code) {
				alert(sprintf($.localise.tr("Error creating retranslator '%s': %s."),name,wialon.core.Errors.getErrorText(code)));
				return;
			}
			needUpdateRetrUnits = false;
			wasCreated = true;
			var spec = [{type: "id", 
					data: retr.getId(), 
					flags: 0xffffff, 
					mode: 1}];
			wialon.core.Session.getInstance().updateDataFlags(spec, function(code) {
				if (code)
					return;
				var newRetr = wialon.core.Session.getInstance().getItem(retr.getId());
				newRetr.updateUnits(units, function(code) {
					if (code)
						alert(sprintf($.localise.tr("Error adding units to retranslator '%s': %s."),name,wialon.core.Errors.getErrorText(code)));	
					curRetranslator = newRetr;
					addRetrRow(newRetr);
					$("#retr_"+newRetr.getId()).click();
					//$("#retr_col_content").animate({scrollTop:$(document).height()},"slow");
				});
			});
		});
	}
	
	return false;
}

/// Get configuration of retranslator opened in middle column
function getRetrConfig() {
	var config = {};
	config["protocol"] = $("#retr_type").val();
	jQuery("#retr_props input[id!=retr_name]:visible").each( function() {
		var pName = jQuery(this).attr("name");
		if (jQuery(this).attr("type") == "text")
			config[pName] = jQuery(this).val();
		else
			config[pName] = (this.checked ? "1" : "0");
	});
	return config;
}

/// Get list of retraqnslator units from middle column
function getRetrUnits() {
	var units = [];
	$("#retr_units_list tr").each(function() {
		units.push({
			i: parseInt(this.id.substring(10)),
			a:  $("input",this).val(),
			st: parseInt($(this).attr("st"))
		});
	});
	return units;
}


/// Check if changes needed to be applied
function saveOrNot() {
	var needUpdate = false;
	
	if(!curRetranslator)  {
		if($("#new_retr").attr("new"))
			needUpdate = true;
	}
	else {
		var name = $("#retr_name").val();
		var config = getRetrConfig();
		var oldConfig = curRetranslator.getConfig();
		oldConfig.debug = oldConfig.debug=="1"?"1":"0";
		config.debug = oldConfig.debug;
		var configs_equal = true;
		for (var i in config)
			if (config[i] != oldConfig[i]) {
				configs_equal = false;
				break;
			}
		
		if(name != curRetranslator.getName() || !configs_equal || needUpdateRetrUnits)
			needUpdate =  true;
	}
	
	if (needUpdate) {
		if(curRetranslator) {
			if(confirm(sprintf($.localise.tr("Do you want to save changes in retranslator '%s'?"),curRetranslator.getName()))) {
				if ($("#retr_ok")[0].disabled == true)
					alert($.localise.tr("Changes cannot be applied: invalid name."));
				else
					$("#retr_ok").click();
			}
		}
		else {
			if(confirm(sprintf($.localise.tr("Do you want to save retranslator '%s'?"),$("#retr_name").val()))) {
				if ($("#retr_ok")[0].disabled == true)
					alert($.localise.tr("Changes cannot be applied: invalid name."));
				else
					$("#retr_ok").click();
			}
		}
	}
	needUpdateRetrUnits = false;
}

/// On delete retranslator event handler
function onDeleteRetranslator(e) {
	var id = this.parentNode.parentNode.id.substring(5);
	var retr = wialon.core.Session.getInstance().getItem(id);
	var retrName = retr.getName();
	
	if (confirm(sprintf($.localise.tr("Do you really want to delete retranslator '%s'?"),retrName))) {
		wialon.core.Session.getInstance().deleteItem(retr, function(code) {
			if (code)
				alert(sprinf($.localise.tr("Error deleting retranslator '%s': %s."),retrName,wialon.core.Errors.getErrorText(code)));
		});
	}	
	e.stopPropagation();
}

/// On operate icon click event handler
function onOperateRetranslator(e) {
	var row = e.currentTarget.parentNode.parentNode;
	var retranslator = wialon.core.Session.getInstance().getItem(row.id.substring(5));
	
	retranslator.updateOperating($(this).attr("src").search("pause")!=-1?false:true, function(code) {
		if(code)
			alert(sprintf($.localise.tr("Retranslator '%s' can't be started or stopped."),retranslator.getName()));
	});
	e.stopPropagation();
}

/// Search units
function searchUnits() {
	if (typeof UNIT_FLAGS === 'undefined') {
		return;
	}
	
	var phrase = $("#unit_search").val();
	phrase = (phrase == "") ? "*": "*" + phrase + "*";
	
	var spec = { itemsType: "avl_unit", 
			propName: "sys_name", 
			propValueMask: phrase, 
			sortType: "sys_name"};
	
	wialon.core.Session.getInstance().searchItems(spec, 0, UNIT_FLAGS, 0, 0, function(code, data) {
		$("#units_list").html("");
		if (code || !data)
			return;
		
		var width =  $(window).outerWidth()-$("#retr_col").outerWidth()-$("#prop_col").outerWidth()-35;
		var unitsInARow = Math.floor(width/250);
		if (!unitsInARow || unitsInARow < 0)
			unitsInARow = 1;
		
		var units = data.items;
		for(var i=0;i<units.length;i=i+unitsInARow) {
			var unit = data.items[i];
			// check access
			if (!wialon.util.Number.and(unit.getUserAccess(), wialon.item.Unit.accessFlag.monitorState))
				continue;
			addUnitRow(units, i, unitsInARow);
		}
		
		$("tr[id^=retr_unit_]").each(function() {
			var id = this.id.substring(10);
			var unitCheckbox = $("#unit_check_"+id)[0];
			if (unitCheckbox)
				unitCheckbox.checked = true;
			$("#unit_name_"+id).addClass("grey-text");
		});
	});
}

/// Draw units of current retranslator
function addRetrUnitRow(retrUnit) {
	if(!retrUnit)
		return;
	
	var id = retrUnit.getId();
	
	if($("#retr_unit_"+id)[0])
		return;
	
	if(!retrUnit.a)
		retrUnit.a = retrUnit.getUniqueId();
	if(!retrUnit.st)
		retrUnit.st = 0;
	
	var html = "<tr id='retr_unit_"+id+"' st='"+retrUnit.st+"'><td class='unit-col1'><img src='"+retrUnit.getIconUrl(24)+"'/>"
		+"</td><td colspan=2 class='unit-col2'><div style='text-overflow:ellipsis'>"+retrUnit.getName()+"</div><input type='text' class='uniqueid-textfield' value='"+retrUnit.a+"'/></td></tr>";
	var row = $(html);
	
	
	
	$("input",row).change(function() {needUpdateRetrUnits = true;});
	$("input",row).attr("title", "X").Tooltip({showURL: false, track_children: true, bodyHandler: function(e) {return $.localise.tr("Unique ID");}});
	
	$("#retr_units_list").append(row);
	
	if(!curRetranslator || (curRetranslator.getUserAccess() & wialon.item.Retranslator.accessFlag.editUnits)) {	
		var showDelButton = function() {
			$("td:eq(1)",this).attr("colspan",1);
			$(this).append("<td><img src='"+DEL_IMG+"'/></td>");
			$("td:eq(2)",this).addClass("unit-col3");
			$(".unit-col2 div",this).width(parseInt($(".unit-col2",this).css("max-width"))-2);
			$("img[src*='del']",this).click(function() {
				var id = this.parentNode.parentNode.id.substring(10);
				var check = $("#unit_check_"+id)[0];
				check.checked = check.checked ? true : false;
				check.click();
			});
		};		
		var hideDelButton = function() {
			$("td:eq(2)",this).remove();
			$("td:eq(1)",this).attr("colspan",2);
			$(".unit-col2 div",this).width(parseInt($(".unit-col2",this).css("max-width"))+22);
			$("img[src*='del']",this).click(function() {return false;});
		};			
		row.hover(showDelButton,hideDelButton);
		
		if(navigator.appVersion.indexOf("MSIE 10") == -1 && navigator.appVersion.indexOf("MSIE") != -1)
			row.mouseleave(hideDelButton);
	}	
	
	if(navigator.appVersion.indexOf("MSIE 10") == -1 && navigator.appVersion.indexOf("MSIE") != -1)	
		$(".unit-col2 div",row).width(parseInt($(".unit-col2",row).css("max-width"))+22);
}

/// Clear properties in middle column
function clearRetrProperties() {
	$("#retr_type").val("wialon").change();
	$("#retr_props input[type=text]").val("");
	$("#retr_props input[type=checkbox]").attr("checked", false);
	$("#retr_props input, #retr_props select").attr("disabled",false);
	$(".uniqueid-textfield, #units_list input").attr("disabled",false);
	$("#retr_port").val(defaultPort("wialon"));
	if($("#retr_buttons").css("display") == "none") {
		$("#retr_buttons").css("display","block");
		$("#prop_col_content").removeClass("zero-bottom");
	}
	
	$("input[id^=unit_check_]:checked").attr("checked", false);
	$(".grey-text").removeClass("grey-text");
	$("#retr_units_list").html("");
}

/// Add row to the table of retranslators 
function addRetrRow(retr) {
	if (!retr)
		return;	
	
	var id = retr.getId();
	
	var operating = retr.getOperating();
	var stateImg = operating ? "<img src='"+ACTIVE_IMG+"'/>" : "<img src='"+STOPPED_IMG+"'/>";
	operating = operating ? "<img src='"+PAUSE_IMG+"'/>" : "<img src='"+PLAY_IMG+"'/>";

	var canOperate = retr.getUserAccess() & wialon.item.Retranslator.accessFlag.editSettings;
		
	var html = "<tr id='retr_"+id+"'><td class='retr-col1'> "+stateImg
			+"</td><td colspan=2 class='retr-col2'><div>"+retr.getName()+"</div></td>"
			+"<td>"+(canOperate?operating:"")+"</td></tr>";
			
	var row = $(html);
		
	row.click(onRetrClick);
	$("img[src*=play], img[src*=pause]",row).click(onOperateRetranslator);
	
	$("#retr_list").append(row);
	if(navigator.appVersion.indexOf("MSIE 10") == -1 && navigator.appVersion.indexOf("MSIE") != -1) 
		$(".retr-col2 div",row).width(parseInt($(".retr-col2",row).css("max-width"))+22);
	
	addRetrListener(retr);
}

/// Add row to the table of units 
function addUnitRow(units, from, unitsInARow) {	
	if (!units)
		return;
	
	var html = "<tr>";
	for (var i=from;i<from+unitsInARow; i++) {
		if (!units[i])
			break;
		var id = units[i].getId();
		html += "<td><input type='checkbox' id='unit_check_"+id+"'/></td>"
		+ "<td><img src='" + units[i].getIconUrl(24) + "'/></td>"
		+ "<td class='units-column' id='unit_name_"+id+"'><div>" + units[i].getName() + "</div></td>";	
	}
	html += "</tr>";
	var row = $(html);
	
	$("input",row).click(function(e) {
		needUpdateRetrUnits = true;
		var unitId = this.id.substring(11);
		if (this.checked) {
			var unit = wialon.core.Session.getInstance().getItem(unitId);
			addRetrUnitRow(unit);
			$("#unit_name_"+unitId).addClass("grey-text");
		}
		else {
			$("#retr_unit_"+unitId).remove();
			$("#unit_name_"+unitId).removeClass("grey-text");
		}
	});
	
	$("td[id^=unit_name_]",row).click(function() {
		var check = $("#unit_check_"+this.id.substring(10))[0];
		if (!check)
			return;
		check.checked = check.checked ? true : false;
		check.click();
	});	
	
	$("#units_list").append(row);
}

// Add listener to the current retranslator
function addRetrListener(retr) {	
	if(!retr.hasListener("changeName"))
		retr.addListener("changeName", redrawRetr);
	if(!retr.hasListener("changeOperating"))
		retr.addListener("changeOperating", redrawRetr);
	if(!retr.hasListener("itemDeleted")) 
		retr.addListener("itemDeleted", redrawRetr);
}

/// Redraw retranslator info according to event catched
function redrawRetr(e) {
	var retr = e.getTarget();
	var type = e.getType();
	var id = retr.getId();
	var row = $("#retr_" + id);
	if (type == "changeName") {
		$("td:eq(1) div",row).html(retr.getName());
	} else if (type == "changeOperating") {
		var operating = retr.getOperating();
		var state = operating ? ACTIVE_IMG : STOPPED_IMG;
		operating = operating ? PAUSE_IMG : PLAY_IMG;
		$("td:last img",row).attr("src",operating);
		$("td:first img",row).attr("src",state);
	} else if (type == "itemDeleted") {
		wasDeleted = true;
		var nextRow = $("+ tr",row)[0];	
		if(nextRow)
			$(nextRow).click();
		else
			$("#retr_list tr:eq(0)").click();
		$(row).remove();
	}
}

/**
*
*  Javascript sprintf
*  http://www.webtoolkit.info/
*
*
**/
var sprintfWrapper = {
	init : function () {

		if (typeof arguments == "undefined") { return null; }
		if (arguments.length < 1) { return null; }
		if (typeof arguments[0] != "string") { return null; }
		if (typeof RegExp == "undefined") { return null; }

		var string = arguments[0];
		var exp = new RegExp(/(%([%]|(\-)?(\+|\x20)?(0)?(\d+)?(\.(\d)?)?([bcdfosxX])))/g);
		var matches = new Array();
		var strings = new Array();
		var convCount = 0;
		var stringPosStart = 0;
		var stringPosEnd = 0;
		var matchPosEnd = 0;
		var newString = '';
		var match = null;

		while (match = exp.exec(string)) {
			if (match[9]) { convCount += 1; }

			stringPosStart = matchPosEnd;
			stringPosEnd = exp.lastIndex - match[0].length;
			strings[strings.length] = string.substring(stringPosStart, stringPosEnd);

			matchPosEnd = exp.lastIndex;
			matches[matches.length] = {
				match: match[0],
				left: match[3] ? true : false,
				sign: match[4] || '',
				pad: match[5] || ' ',
				min: match[6] || 0,
				precision: match[8],
				code: match[9] || '%',
				negative: parseFloat(arguments[convCount]) < 0 ? true : false,
				argument: String(arguments[convCount])
			};
		}
		strings[strings.length] = string.substring(matchPosEnd);

		if (matches.length == 0) { return string; }
		if ((arguments.length - 1) < convCount) { return null; }

		var code = null;
		var match = null;
		var i = null;

		for (i=0; i<matches.length; i++) {

			if (matches[i].code == '%') { substitution = '%' }
			else if (matches[i].code == 'b') {
				matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(2));
				substitution = sprintfWrapper.convert(matches[i], true);
			}
			else if (matches[i].code == 'c') {
				matches[i].argument = String(String.fromCharCode(parseInt(Math.abs(parseInt(matches[i].argument)))));
				substitution = sprintfWrapper.convert(matches[i], true);
			}
			else if (matches[i].code == 'd') {
				matches[i].argument = String(Math.abs(parseInt(matches[i].argument)));
				substitution = sprintfWrapper.convert(matches[i]);
			}
			else if (matches[i].code == 'f') {
				matches[i].argument = String(Math.abs(parseFloat(matches[i].argument)).toFixed(matches[i].precision ? matches[i].precision : 6));
				substitution = sprintfWrapper.convert(matches[i]);
			}
			else if (matches[i].code == 'o') {
				matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(8));
				substitution = sprintfWrapper.convert(matches[i]);
			}
			else if (matches[i].code == 's') {
				matches[i].argument = matches[i].argument.substring(0, matches[i].precision ? matches[i].precision : matches[i].argument.length)
				substitution = sprintfWrapper.convert(matches[i], true);
			}
			else if (matches[i].code == 'x') {
				matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(16));
				substitution = sprintfWrapper.convert(matches[i]);
			}
			else if (matches[i].code == 'X') {
				matches[i].argument = String(Math.abs(parseInt(matches[i].argument)).toString(16));
				substitution = sprintfWrapper.convert(matches[i]).toUpperCase();
			}
			else {
				substitution = matches[i].match;
			}

			newString += strings[i];
			newString += substitution;

		}
		newString += strings[i];

		return newString;

	},

	convert : function(match, nosign){
		if (nosign) {
			match.sign = '';
		} else {
			match.sign = match.negative ? '-' : match.sign;
		}
		var l = match.min - match.argument.length + 1 - match.sign.length;
		var pad = new Array(l < 0 ? 0 : l).join(match.pad);
		if (!match.left) {
			if (match.pad == "0" || nosign) {
				return match.sign + pad + match.argument;
			} else {
				return pad + match.sign + match.argument;
			}
		} else {
			if (match.pad == "0" || nosign) {
				return match.sign + match.argument + pad.replace(/0/g, ' ');
			} else {
				return match.sign + match.argument + pad;
			}
		}
	}
}
sprintf = sprintfWrapper.init;
