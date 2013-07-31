var server = {}; 

var j = require("jquery"); 
var common = require("../widgets_common");
var menu_html = ""; 


exports.init = function(x){
	server = x; 
	var db = server.db; 
	common.GenerateCategoryMenu(server, function(){
		var catmenu = ""; 
		function create_children(cat_tree, url, first_level){
			if(Object.keys(cat_tree) == 0) return ""; 
			var str = "";
/*<ul class="nav nav-list">
	<li class="nav-header">List header</li>
	<li><a href="#">Library</a></li>
	<li>
		<div class="dropdown">
			<a class="dropdown-toggle" data-toggle="dropdown" href="#" >Home</a>
			<div class="dropdown-menu">
				<ul>
					<li>Test</li>
				</ul>
			</div>
		</div>
	</li>
</ul>
			*/
			str += '<ul>';
			var keys = Object.keys(cat_tree); 
			for(var child in keys){
				child = keys[child]; 
				var path = url+"/"+child; 
				
				str += "<li data-path='/"+path+"'>"; 
				str += '<a href="/'+path+'">'+common.categories[path].title+"</a>";
				
				if(Object.keys(cat_tree[child]).length){
					create_children(cat_tree[child], path); 
				}
				
				str += "</li>";
				
			}
			
			str += '</ul>'; 
				
			return str; 
		}
		
		
		for(var toplevel in common.category_tree){
			catmenu += "<li class='nav-header' data-path='/"+toplevel+"'>"+common.categories[toplevel].title+'</li>';
			
			var cat_tree = common.category_tree[toplevel];
			var keys = Object.keys(cat_tree).sort()
			for(var child in keys){
				child = keys[child]; 
				var path = toplevel+"/"+child; 
				
				if(Object.keys(cat_tree[child]).length){
					catmenu += '<li class="dropdown">'; 
					catmenu += '<a class="dropdown-toggle" data-toggle="dropdown" href="#">'+common.categories[path].title+' <b class="caret"></b></a> ';
					catmenu += '<ul class="dropdown-menu">'; 
					catmenu += create_children(cat_tree[child], path, false);
				} else{
					catmenu += '<li><a href="/'+path+'">'+common.categories[path].title+"</a>"; 
				}
				
				if(Object.keys(cat_tree[child]).length > 0){
					create_children(cat_tree[child], path);
					catmenu += '</ul></li>'; 
				}
				
				catmenu += "</li>";
				
			}
		}
		menu_html = '<ul class="nav nav-list">'+catmenu+'</ul>'; 
	}); 
}

exports.render = function(path, args, session, done){
	var html = session.render("widget", {
		title: "Produkter",
		content: menu_html, //session.render("storejs_category_menu", menu_html)
	}); 
	done(html); 
}

