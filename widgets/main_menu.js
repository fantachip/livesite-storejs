
var server = {}; 

var common = require("../widgets_common");
var menu_html = ""; 

exports.init = function(x){
	server = x; 
	common.GenerateCategoryMenu(server, function(html){
		var catmenu = ""; 
		function create_children(cat_tree, url){
			if(Object.keys(cat_tree) == 0) return ""; 
			var str = "<ul>";
			for(var child in cat_tree){
				var path = url+"/"+child; 
				str += "<li data-path='/"+path+"'><a href='/"+path+"'>"+common.categories[path].title+"</a>"+
					create_children(cat_tree[child], path)+"</li>";
			}
			str+= "</ul>";
			return str; 
		}
		for(var toplevel in common.category_tree){
			catmenu += "<li data-path='/"+toplevel+"'><a href='/"+toplevel+"'>"+common.categories[toplevel].title+"</a></li>"; 
		}
		menu_html = "<ul class='nav'>"+catmenu+"</ul>";
	}); 
}

exports.render = function(path, args, session, done){
	var html = '<ul style="float: right; margin: 2px; background-color: transparent" class="breadcrumb">'
  var parts = path.substr(1).split("/"); 
  for(var c = 0; c < parts.length; c++){
		var url = (c > 0)?(parts.slice(0, c+1).join("/")):parts[0]; 
		if(!(url in common.categories)) continue; 
		if(c == parts.length - 1)
			html += '<li class="active"><span class="divider">/</span>'+common.categories[url].title+'</li>'; 
		else
			html += '<li class="active"><span class="divider">/</span><a href="/'+url+'">'+common.categories[url].title+'</a></li>'; 
	}
	html += "</ul>"+menu_html; 
	done(html); 
}

