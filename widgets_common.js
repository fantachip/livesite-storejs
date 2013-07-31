
var category_menu = undefined; 
var categories = {};
var category_tree = {}; 
	
exports.category_tree = category_tree; 
exports.categories = categories; 

exports.GenerateCategoryMenu = function(server, done){
	if(!category_menu){
		console.log("Rebuilding category menu..."); 
		exports.category_menu = ""; 
		server.db.query("select * from fx_category", function(error, rows){
			if(error){
				console.log("SQL ERROR in generate_category_menu: "+error); 
				return; 
			}
			// generate category tree and list
			for(var key in rows){
				var parts = rows[key].direct_path.split('/');
				if(!parts.length) continue; 
				
				categories[rows[key].direct_path] = rows[key]; 
				
				function place_key(parts, idx, tree){
					if(!(parts[idx] in tree))
						tree[parts[idx]] = {}
					
					// if the last element
					if(idx == parts.length - 1) return; 
					
					place_key(parts, idx+1, tree[parts[idx]]); 
				}
				place_key(parts, 0, category_tree); 
				
			}
			done(); 
		}); 
	}
	done();
}

