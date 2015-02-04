/*
 * jQuery Tooltip plugin 1.1
 *
 * http://bassistance.de/jquery-plugins/jquery-plugin-tooltip/
 *
 * Copyright (c) 2006 J�rn Zaefferer, Stefan Petre
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Revision: $Id: jquery.tooltip.js 2237 2007-07-04 19:11:15Z joern.zaefferer $
 *
 */

/**
 * Display a customized tooltip instead of the default one
 * for every selected element. The tooltip behaviour mimics
 * the default one, but lets you style the tooltip and
 * specify the delay before displaying it. In addition, it displays the
 * href value, if it is available.
 *
 * Requires dimensions plugin.
 *
 * When used on a page with select elements, include the bgiframe plugin. It is used if present.
 *
 * To style the tooltip, use these selectors in your stylesheet:
 *
 * #tooltip - The tooltip container
 *
 * #tooltip h3 - The tooltip title
 *
 * #tooltip div.body - The tooltip body, shown when using showBody
 *
 * #tooltip div.url - The tooltip url, shown when using showURL
 *
 *
 * @example $('a, input, img').Tooltip();
 * @desc Shows tooltips for anchors, inputs and images, if they have a title
 *
 * @example $('label').Tooltip({
 *   delay: 0,
 *   track: true,
 *   event: "click"
 * });
 * @desc Shows tooltips for labels with no delay, tracking mousemovement, displaying the tooltip when the label is clicked.
 *
 * @example // modify global settings
 * $.extend($.fn.Tooltip.defaults, {
 * 	track: true,
 * 	delay: 0,
 * 	showURL: false,
 * 	showBody: " - ",
 *  fixPNG: true
 * });
 * // setup fancy tooltips
 * $('a.pretty').Tooltip({
 * 	 extraClass: "fancy"
 * });
 $('img.pretty').Tooltip({
 * 	 extraClass: "fancy-img",
 * });
 * @desc This example starts with modifying the global settings, applying them to all following Tooltips; Afterwards, Tooltips for anchors with class pretty are created with an extra class for the Tooltip: "fancy" for anchors, "fancy-img" for images
 *
 * @param Object settings (optional) Customize your Tooltips
 * @option Number delay The number of milliseconds before a tooltip is display. Default: 250
 * @option Boolean track If true, let the tooltip track the mousemovement. Default: false
 * @option Boolean showURL If true, shows the href or src attribute within p.url. Defaul: true
 * @option String showBody If specified, uses the String to split the title, displaying the first part in the h3 tag, all following in the p.body tag, separated with <br/>s. Default: null
 * @option String extraClass If specified, adds the class to the tooltip helper. Default: null
 * @option Boolean fixPNG If true, fixes transparent PNGs in IE. Default: false
 * @option Function bodyHandler If specified its called to format the tooltip-body, hiding the title-part. Default: none
 * @option Number top The top-offset for the tooltip position. Default: 15
 * @option Number left The left-offset for the tooltip position. Default: 15
 *
 * @name Tooltip
 * @type jQuery
 * @cat Plugins/Tooltip
 * @author J�rn Zaefferer (http://bassistance.de)
 */

/**
 * A global flag to disable all tooltips.
 *
 * @example $("button.openModal").click(function() {
 *   $.Tooltip.blocked = true;
 *   // do some other stuff, eg. showing a modal dialog
 *   $.Tooltip.blocked = false;
 * });
 *
 * @property
 * @name $.Tooltip.blocked
 * @type Boolean
 * @cat Plugins/Tooltip
 */

/**
 * Global defaults for tooltips. Apply to all calls to the Tooltip plugin after modifying  the defaults.
 *
 * @example $.extend($.Tooltip.defaults, {
 *   track: true,
 *   delay: 0
 * });
 *
 * @property
 * @name $.Tooltip.defaults
 * @type Map
 * @cat Plugins/Tooltip
 */
(function($) {

	// the tooltip element
	var helper = {},
		// the current tooltipped element
		current,
		// the title of the current element, used for restoring
		title,
		// timeout id for delayed tooltips
		tID,
		// flag for mouse tracking
		track = false;
		// IE 5.5 or 6
		IE = /MSIE\s(5\.5|6\.)/.test(navigator.userAgent),

	$.Tooltip = {
		defaults: {
			delay: 200,
			top: 15,
			left: 15
		}
	};

	$.fn.extend({
		Tooltip: function(settings) {
			settings = $.extend({}, $.Tooltip.defaults, settings);
			createHelper();
				return this.each(function() {
					this.tSettings = settings;
					// copy tooltip into its own expando and remove the title
					this.tooltipText = this.title;
					$(this).removeAttr("title");
					// also remove alt attribute to prevent default tooltip in IE
					this.alt = "";
					//$(this).hover(save, hide);

					//$(this).trigger('mouseleave');
					
					$(this).hover(save, function() {
						if ($.Tooltip.timeout)
							clearTimeout($.Tooltip.timeout);
						$.Tooltip.timeout = null;
						if (helper.parent.css("overflow-y") == "auto")
							$.Tooltip.timeout = setTimeout(hide, 300);
						else
							hide();
					});
				});
				
		},
		fixPNG: IE ? function() {
			return this.each(function () {
				var image = $(this).css('backgroundImage');
				if (image.match(/^url\(["']?(.*\.png)["']?\)$/i)) {
					image = RegExp.$1;
					$(this).css({
						'backgroundImage': 'none',
						'filter': "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true, sizingMethod=crop, src='" + image + "')"
					}).each(function () {
						var position = $(this).css('position');
						if (position != 'absolute' && position != 'relative')
							$(this).css('position', 'relative');
					});
				}
			});
		} : function() { return this; },
		unfixPNG: IE ? function() {
			return this.each(function () {
				$(this).css({'filter': '', backgroundImage: ''});
			});
		} : function() { return this; },
		hideWhenEmpty: function() {
			return this.each(function() {
				$(this)[ $(this).html() ? "show" : "hide" ]();
			});
		},
		url: function() {
			return this.attr('href') || this.attr('src');
		}
	});

	function createHelper() {
		// there can be only one tooltip helper
		if( helper.parent )
			return;
		// create the helper, h3 for title, div for url
		helper.parent = $('<div id="tooltip"><h3></h3><div class="body"></div><div class="url"></div></div>')
			// hide it at first
			.hide()
			// add to document
			.appendTo('body');

		// save references to title and url elements
		helper.title = $('h3', helper.parent);
		helper.body = $('div.body', helper.parent);
		helper.url = $('div.url', helper.parent);
	}

	// main event handler to start showing tooltips
	function handle(event) {
		// show helper, either with timeout or on instant
		if( this.tSettings.delay )
			tID = setTimeout(show, this.tSettings.delay);
		else
			show();

		// if selected, update the helper position when the mouse moves
		track = this.tSettings.track;
		// if selected, update the helper position when the mouse moves
		track_children = this.tSettings.track_children;
		scrollable = this.tSettings.scrollable;
		$('body').bind('mousemove', update);
		// update at least once
		update(event);
	}

	// save elements title before the tooltip is displayed
	function save(event, x, y) {
		// if this is the current source, or it has no title (occurs with click event), stop
		if ( $.Tooltip.blocked || this == current || !this.tooltipText )
			return;
		if ($.Tooltip.timeout)
			clearTimeout($.Tooltip.timeout);
		
		if (typeof x != "undefined" && typeof y != "undefined") {
			event.pageX = x;
			event.pageY = y;
		}
		
		var left = event.pageX + $.Tooltip.defaults.left;
		var top = event.pageY + $.Tooltip.defaults.top;
		$.Tooltip.left = left;
		$.Tooltip.top = top;
			
		$.Tooltip.timeout = null;
		helper.parent.hide();
		// save current
		current = this;
		title = this.tooltipText;
		$.Tooltip.skipped = false;
		if ( this.tSettings.bodyHandler ) {
			helper.title.hide();
			var html = this.tSettings.bodyHandler.call(this);
			
			if (typeof html  == "object")
				html = html.html;
			
			if (!html.length)
				$.Tooltip.skipped = true;
			if (typeof html == "object")
				helper.body.html( html.html );
			else
				helper.body.html( html );
			
			if (typeof this.tSettings.oddColor != "undefined") {
				jQuery("tr:odd", helper.body).css("background-color", this.tSettings.oddColor);
			}
			helper.body.show();
		} else if ( this.tSettings.showBody ) {
			var parts = title.split(this.tSettings.showBody);
			helper.title.html(parts.shift()).show();
			helper.body.empty();
			for(var i = 0, part; part = parts[i]; i++) {
				if(i > 0)
					helper.body.append("<br/>");
				helper.body.append(part);
			}
			helper.body.hideWhenEmpty();
			if (typeof this.tSettings.oddColor != "undefined")
				jQuery("tr:odd", helper.body).css("background-color", this.tSettings.oddColor);
		} else {
			helper.title.html(title).show();
			helper.body.hide();
		}
		// if element has href or src, add and show it, otherwise hide it
		if( this.tSettings.showURL && $(this).url() )
			helper.url.html( $(this).url().replace('http://', '') ).show();
		else
			helper.url.hide();

		handle.apply(this, arguments);
	}

	// delete timeout and show helper
	function show() {
		if (!current)
			return;
		tID = null;
		if ($.Tooltip.timeout)
			clearTimeout($.Tooltip.timeout);
		$.Tooltip.timeout = null;
		if (!$.Tooltip.skipped) {
			if (!track_children) {
				helper.parent.hide();
				var top = $.Tooltip.top;
				var left = $.Tooltip.left;
				var wheight =  jQuery(window).height();
				if (jQuery.browser.opera) {
					wheight = window.innerHeight;
				}
				var wwidth =  jQuery(window).width();
				helper.parent.css("overflow", "hidden");
				helper.parent.css("height", "auto");
				helper.parent.css("width", "auto");
				helper.parent.css("left", 0);
				helper.parent.css("top", 0);
				var height = parseInt(helper.parent.height());
				var width = parseInt(helper.parent.width());
				helper.parent.css("left", $.Tooltip.left);
				helper.parent.css("top", $.Tooltip.top);
				// set top position
				if (top + height > wheight - 10) {
					var delta_top = top - height - $.Tooltip.defaults.top - 10;
					var delta_bottom = wheight - top - height - $.Tooltip.defaults.top - 10;
					if (delta_bottom > delta_top) {
						helper.parent.height(wheight - top - $.Tooltip.defaults.top - 10);
						helper.parent.css("overflow-y", "auto");
						helper.parent.css("width", (width + 10) + "px");
					} else {
						var new_top = delta_top < 10 ? 10 : delta_top;
						helper.parent.css("top", new_top);
						helper.parent.height(top - new_top - $.Tooltip.defaults.top - 10);
						if (delta_top < 10) {
							helper.parent.css("overflow-y", "auto");
							helper.parent.css("width", (width + 10) + "px");
						}
					}
				}
				if (scrollable)
					helper.parent.css("overflow-y", "auto");
				
				// set left position
				if (left + width + $.Tooltip.defaults.left > wwidth - 10)
					helper.parent.css("left", wwidth - width - $.Tooltip.defaults.left);
				// bind scrollable event
				if (helper.parent.css("overflow-y") == "auto") {
					$(helper.parent).hover( function() {
						if ($.Tooltip.timeout)
							clearTimeout($.Tooltip.timeout);
						$.Tooltip.timeout = null;
					}, hide);
				}
			}
			helper.parent.show();
		}
		//update();
	}
	/**
	 * callback for mousemove
	 * updates the helper position
	 * removes itself when no current element
	 */
	function update(event) {
		function tracking_enter() {
			if ($.Tooltip.timeout_tracking)
				clearTimeout($.Tooltip.timeout_tracking);
			$.Tooltip.timeout_tracking = null;
			if ($.Tooltip.timeout)
				clearTimeout($.Tooltip.timeout);
			$.Tooltip.timeout = null;
			jQuery(this).unbind("mouseenter");
			jQuery(this).bind("mouseleave", tracking_leave);
		}
		function tracking_leave(event) {
			if ($.Tooltip.timeout_tracking)
				clearTimeout($.Tooltip.timeout_tracking);
			$.Tooltip.timeout_tracking = setTimeout(function() {
				$.Tooltip.timeout_tracking = null;
				helper.parent.hide();
				$('body').bind('mousemove', update);
			}, 300);
			jQuery(this).unbind("mouseleave");
			
		}
		// stop updating when tracking is disabled and the tooltip is visible
		if (!track_children && !track && helper.parent.is(":visible")) {
			$('body').unbind('mousemove', update);
		}
		// if no current element is available, remove this listener
		if (current == null) {
			$('body').unbind('mousemove', update);
			return;
		}
		if (event) {
			$.Tooltip.left = event.pageX + current.tSettings.left;
			$.Tooltip.top = event.pageY + current.tSettings.top;
		}
		if (event && track_children) {
			var tip_parent = event.target;
			while (tip_parent) {
				if (tip_parent && tip_parent.tSettings)
					break;
				tip_parent = jQuery(tip_parent).parent();
				if (!jQuery(tip_parent).size() || !tip_parent)
					tip_parent = null;
				else
					tip_parent = jQuery(tip_parent).get(0);
			}
			if (!tip_parent || !tip_parent.tSettings.bodyHandler) {
				hide();
				$('body').unbind('mousemove', update);
				return;
			}
			var last_target = jQuery(tip_parent).attr("target_tip");
			var curr_target = null;
			var id_parent = event.target;
			while (!curr_target && jQuery(id_parent).size()) {
				curr_target = jQuery(id_parent).attr("id");
				id_parent = jQuery(id_parent).parent();
			}
			if (last_target != curr_target) {
				jQuery(tip_parent).attr("target_tip", curr_target);
				var html = tip_parent.tSettings.bodyHandler.call(jQuery(tip_parent), curr_target);
				
				if (typeof html  == "object")
					html = html.html;
				
				if (!html || !html.length || html == "<b><table></table></b>" || html == "<b>&nbsp;</b>") {
					$.Tooltip.skipped = true;
					helper.body.empty();
					helper.parent.hide();
					return;
				} else {
					$.Tooltip.skipped = false;
					helper.parent.show();
				}
				
				helper.parent.hide();
				
				helper.body.html( html );
				
				var top = $.Tooltip.top;
				var left = $.Tooltip.left;
				var wheight =  jQuery(window).height();
				var wwidth =  jQuery(window).width();
				helper.parent.css("overflow", "hidden");
				helper.parent.css("height", "auto");
				helper.parent.css("width", "auto");
				helper.parent.css("left", 0);
				helper.parent.css("top", 0);
				var height = parseInt(helper.parent.height());
				var width = parseInt(helper.parent.width());
				helper.parent.css("left", $.Tooltip.left);
				var need_hide = false;
				helper.parent.css("top", $.Tooltip.top);
				// set top position
				if (top + height > wheight - 10) {
					var delta_top = top - height - $.Tooltip.defaults.top - 10;
					var delta_bottom = wheight - top - height - $.Tooltip.defaults.top - 10;
					if (delta_bottom > delta_top) {
						helper.parent.height(wheight - top - $.Tooltip.defaults.top - 10);
						helper.parent.css("overflow-y", "auto");
						helper.parent.css("width", (width + 10) + "px");
					} else {
						var new_top = delta_top < 10 ? 10 : delta_top;
						helper.parent.css("top", new_top);
						helper.parent.height(top - new_top - $.Tooltip.defaults.top - 10);
						if (delta_top < 10) {
							helper.parent.css("overflow-y", "auto");
							helper.parent.css("width", (width + 10) + "px");
						}
					}
				}
				if (scrollable)
					helper.parent.css("overflow-y", "auto");
				// set left position
				if (left + width + $.Tooltip.defaults.left > wwidth - 10)
					helper.parent.css("left", wwidth - width - $.Tooltip.defaults.left);
				// bind scrollable event
				if (helper.parent.css("overflow-y") == "auto") {
					jQuery(event.target).bind("mouseleave", tracking_leave);
					$('body').unbind("mousemove", update);
					helper.parent.bind("mouseenter", tracking_enter);
					need_hide = true;
				}
				helper.parent.show();
				if (typeof jQuery("#" + curr_target).attr("oddColor") != "undefined") {
					jQuery("tr:odd", helper.body).css("background-color", jQuery("#" + curr_target).attr("oddColor"));
				}
				if (need_hide)
					return;
			} else if (helper.parent.css("overflow-y") == "auto") 
				return;
		}
		if (!helper.body.html().length || helper.parent.css("overflow-y") == "auto" || !track_children)
			return;
		if (event) {
			// position the helper 15 pixel to bottom right, starting from mouse position
			left = event.pageX + current.tSettings.left;
			top = event.pageY + current.tSettings.top;
			helper.parent.css({
				left: left + 'px',
				top: top + 'px'
			});
			
		}
		var v = viewport(),
 			h = helper.parent[0];
		// check horizontal position
 		if (v.x + v.cx < h.offsetLeft + h.offsetWidth) {
 			left -= h.offsetWidth + 20 + current.tSettings.left;
 			helper.parent.css({left: left + 'px'});
 		}
		
 		// check vertical position
 		if (v.y + v.cy < h.offsetTop + h.offsetHeight) {
			top -= h.offsetHeight + 20 + current.tSettings.top;
			helper.parent.css({top: top + 'px'});
 		}
	}
	

	function viewport() {
		return {
			x: $(window).scrollLeft(),
			y: $(window).scrollTop(),
			cx: $(window).width(),
			cy: $(window).height()
		};
	}

	// hide helper and restore added classes and the title
	function hide(event) {
		if ($.Tooltip.timeout_tracking)
			return;
		$.Tooltip.timeout = null;
		if($.Tooltip.blocked)
			return;
		// clear timeout if possible
		if(tID)
			clearTimeout(tID);
		// no more current element
		current = null;

		helper.parent.hide();
	}

})(jQuery);
