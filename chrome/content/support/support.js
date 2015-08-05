// Support code (c) 2011 All Rights Reserved.
// If you want to review the code please contact me at aproject180@gmail.com
// If you don't wish to support me you may disable it in the settings. 
(function(window){

//if (typeof Firebug != "undefined") console = Firebug.Console;

var project180 = "project180_9ef957a5a0c6f5c0c7fe83adfd8b0d92";
var ext_pref   = "abduction";
var ext_path   = "abduction";
var ext_name   = "Abduction";
var global     = window;

var prefs = Components.classes["@mozilla.org/preferences-service;1"]
           .getService(Components.interfaces.nsIPrefService)
           .getBranch("extensions." + ext_pref + ".");

var healthy = false;
var user_blacklist = {};
var whitelist = {};
var blacklist = {};

function load_script(path) {
    Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
            .getService(Components.interfaces.mozIJSSubScriptLoader)
            .loadSubScript("chrome://"+ ext_path +"/content/" + path);
}

function load_json(path, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    callback(JSON.parse(xhr.responseText));
  };
  xhr.open('GET', "chrome://"+ ext_path +"/content/" + path, true);
  xhr.send(null);
}

var health_check = function() {
  if (prefs.getBoolPref("dontsupport")) return;
  var img = new Image();
  img.onerror = function() { healthy = false; };
  img.onload  = function() { healthy = true;  };
  img.src = "http://www.qcksrv.com/health_check.gif?ts=" + (+new Date);
}


function get_domain(host) {
  var parts = host.split('.');
  var domain = parts[parts.length-2] + "." + parts[parts.length-1];
  if (/^com?$/.test(parts[parts.length-2])) // .co.<TLD> / .com.<TLD>
    domain = parts[parts.length-3] + "."  + domain;
  return domain;
}

function blacklist_add(e) {
    var doc = e.target.ownerDocument;
    var el = doc.getElementById('p180-root');
    el.parentNode.removeChild(el);
    user_blacklist[doc.URL] = 1;
    prefs.setCharPref("user_blacklist", JSON.stringify(user_blacklist));
    e.preventDefault();
}

function open_tab(e) {
    var path = e.target.dataset.url;
    var tab = gBrowser.addTab("chrome://"+ ext_path +"/content/" + path);
    gBrowser.selectedTab = tab;
    e.preventDefault();
}

// content script

function content_script(window) {

  if (window.self != window.top) return;

  var document = window.document;
  var url = document.URL || window.location.href;
  var host = window.location.host;

  var enabled = !prefs.getBoolPref("dontsupport");
  var not_too_young = true; // +new Date - prefs.getCharPref("install_date") > 48*60*60*1000;
  var on_whitelist = whitelist[get_domain(host)];
  var not_blacklisted = !user_blacklist[url] && !blacklist[get_domain(host)];
  var chance = Math.random() < 0.5;
  
  if ( !(enabled && healthy && not_too_young && not_blacklisted && on_whitelist && chance) ) 
    return;

  var base_url = "http://www.qcksrv.com/support/www/delivery";
  var delivery_url = base_url + "/afr.php";
  var refresh = 110; // [sec]
  var ad728 = generate_ad(135, 728,  90, 'a0acec74', 'a6b442d8');
  var body = document.body;

  // SLAVE
  if (body.classList.contains("p180"))
    return;

  // exclude home pages
  if (window.location.pathname === '/')
    return;

  // exclude image previews
  if (/jpg|png|gif/i.test(url.slice(-3)))
    return;

  // MASTER
  body.classList.add("p180");
  
  var base;
  var wrapper = body.children[0];

  if (body.clientHeight > 200) {
    base = body;
  }
  if (wrapper && wrapper.clientHeight > 200 &&
      window.getComputedStyle(wrapper, null).getPropertyValue('position') == 'absolute') {
    base = wrapper;
  }
  if (base) {
    base.appendChild(ad728);
    document.getElementById("p180-hide").addEventListener("click", blacklist_add, false);
    document.getElementById("p180-info").addEventListener("click", open_tab, false);
    document.getElementById("p180-privacy").addEventListener("click", open_tab, false);
  }

  function generate_ad(zoneid, width, height, beacon, n) {
    var info    = "support/pages/adoptions.html";
    var privacy = "support/pages/privacy_policy.html";
    var rand  = +new Date;

    var dummy = document.createElement("div");
    dummy.id = 'p180-root';
    dummy.style.cssText = 'margin:10px auto 20px; width:728px;';

    var iframe = document.createElement('iframe');
    iframe.className = 'p180';
    iframe.id = iframe.name = beacon;
    iframe.style.cssText = 'margin:0; display:block;';
    iframe.scrolling = "no";
    iframe.style.width = width + "px";
    iframe.style.height = height + "px";
    iframe.src = delivery_url +"?zoneid="+ zoneid +"&amp;refresh="+ refresh +"&amp;cb="+ rand +"&amp;beacon="+ beacon +"&amp;n="+ n;

    var div = document.createElement('div');
    div.style.cssText = 'font:11px arial !important; background:#f9f9f9; color:#444; padding:4px; text-align:center; border-radius:0 0 5px 5px; border: 1px solid #ddd; border-top:0;';
    div.appendChild(document.createTextNode(' This ad is supporting your extension ' + ext_name + ':  '));

    var link = document.createElement('a');
    link.href = '#';
    link.id = 'p180-info';
    link.setAttribute('data-url', info);
    link.style.cssText = 'color:#005790';
    link.textContent = 'More info';
    div.appendChild(link);
    div.appendChild(document.createTextNode(' | '));

    link = document.createElement('a');
    link.href = '#';
    link.id = 'p180-privacy';
    link.setAttribute('data-url', privacy);
    link.style.cssText = 'color:#005790';
    link.textContent = 'Privacy Policy';
    div.appendChild(link);
    div.appendChild(document.createTextNode(' | '));

    link = document.createElement('a');
    link.href = '#';
    link.id = 'p180-hide';
    link.style.cssText = 'color:#005790';
    link.textContent = 'Hide on this page';
    div.appendChild(link);
    div.appendChild(document.createTextNode(' | '));

    dummy.appendChild(iframe);
    dummy.appendChild(div);

    return dummy;
  }
}

function init() {
  if (typeof global[project180] == "undefined") {
    global[project180] = {};

    health_check();
    setInterval(function() { health_check() }, 5*60*1000); // 5*60*1000

    user_blacklist = JSON.parse(prefs.getCharPref("user_blacklist"));

    if (!prefs.getCharPref("install_date")) {
      prefs.setCharPref("install_date",  ""+Date.now());
    }

    if (!prefs.getBoolPref("dontsupport")) {
      load_json("support/lists/whitelist.json", function(object) {
        whitelist = object;
      });
      load_json("support/lists/blacklist.json", function(object) {
        blacklist = object;
      });
    }

    if (!prefs.getBoolPref("opt_in_page_shown")) {
      prefs.setBoolPref("opt_in_page_shown", true);
      var tab = gBrowser.addTab("chrome://"+ ext_path +"/content/support/pages/optin.html");
      gBrowser.selectedTab = tab;
    }

    var appcontent = document.getElementById("appcontent"); // browser  
    if (!appcontent) return;
    appcontent.addEventListener("DOMContentLoaded", function(aEvent) {
        if (prefs.getBoolPref("dontsupport")) return;
        content_script(aEvent.originalTarget.defaultView); 
    }, true);
  }
}

window.addEventListener("load", init, false);

})(window);