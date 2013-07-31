var fs = require("fs");

var server = {};

// load products and price lists
var products_by_id = {};
var products_by_parent = {};
var categories = {};
var category_tree = {};
var category_list = []; // sorted category list
var category_names = {};
var category_pages = {};
var product_pages = {}; 
var products = {}; 
var handlers = {}; 

exports.categories = categories; 
exports.products = products; 
exports.pages = []; 

function LoadProducts(next){
	/*server.objects.search("storejs_category", "%%", function(results){
		
	}); */
	db.query("select * from fx_category", function(error, rows){
		if(error || !rows){
			console.log(error); 
			return; 
		}
		for(var key in rows){
			categories[rows[key].direct_path] = rows[key]; 
		}
		loadProducts(); 
	}); 
	function loadProducts(){
		db.query("select * from fx_product", function(error, rows, cols){
			if(error || !rows){
				console.log("SQL ERROR in LoadProducts(): "+error); 
				return; 
			}
			for(var id in rows){
				var product = rows[id]; 
				
				product["images"] = []; 
				
				if(fs.existsSync(server.basedir+"/plugins/storejs/client/images/"+product.sku+".jpg")){
					product.images.push("/images/"+product.sku+".jpg");
				}
				
				// update product list
				products_by_id[product.id] = product; 
				if(product.parent != ""){
					if(!(product.parent in products_by_parent))
						products_by_parent[product.parent] = {}
					products_by_parent[product.parent][product.id] = product; 
				}
				
				// update the reverse category tree
				var cat = categories[product["category"]]||{}; 
				cat[product.id] = product; 
				categories[product["category"]] = cat; 
			}
			// update the parent product image to the first child image
			for(var key in products_by_parent){
				var children = products_by_parent[key]; 
				var parent = products_by_id[key]; 
				
				if(!parent){
					console.log("ERROR: "+key+" undefined in products_by_id. Maybe there are products whos parent does not exist?");
					continue; 
				}
				//console.log("kk"+JSON.stringify(parent)); 
				for(var ch_id in children){
					var child = children[ch_id]; 
					
					if(parent.images && parent.images.length == 0 && child.images.length > 0){
						parent.images.push(child.images[0]); 
					}
					
					// update price if zero
					if(parent.price == "NaN"){
						parent.price = child.price; 
					}
				}
			}
			
			// generate category tree and list
			for(var key in categories){
				var parts = key.split('/');
				if(!parts.length) continue; 
				
				// append it to the list 
				category_list.push(key); 
				
				function place_key(parts, idx, tree){
					if(!(parts[idx] in tree))
						tree[parts[idx]] = {}
					
					// if the last element
					if(idx == parts.length - 1) return; 
					
					place_key(parts, idx+1, tree[parts[idx]]); 
				}
				place_key(parts, 0, category_tree); 
			}
			
			// sort the category list to allow further search optimizations
			category_list.sort(); 
			
			console.log("DB: Loaded "+String(products_by_id.count)+" lines.");
			console.log("DB: Loaded "+Object.keys(products_by_id).length+" products and "+Object.keys(categories).length+" categories.");
			console.log("DB: Loaded "+Object.keys(category_tree).length+" top level categories."); 
			
			next();
		}); 
	}
}

exports.init = function(x, callback){
	console.log("Store.js - LiveSite web store plugin.");
	server = x;
	
	LoadProducts(function(){
		// add textual pages
		/*for(var text_id in texts) {
			pages["/"+text_id] = {
				title: "Text!",
				content: texts[text_id],
				handler: "text"
			};
		}*/
		
		// add category and product pages
		for(var key in categories){
			exports.pages.push("/"+key);
			category_pages[key] = true; 
			
			for(var pid in categories[key]){
				product_pages[key+"/"+pid] = true; 
				exports.pages.push("/"+key+"/"+pid); 
			}
		}
		exports.pages.push("/service/checkout");
		exports.pages.push("/search");
		callback(); 
	}); 
	var classes = ["category", "checkout", "product", "search"]; 
	for(c in classes){
		class_name = classes[c]; 
		try{
			var code = require("./handlers/"+class_name); 
			code.init(server); 
			handlers[class_name] = code; 
		} catch(e){
			console.log("ERROR: "+e);
		}
	}
	return {
		name: "Store JS online store plugin."
	}
}

exports.post = function(path, args, session, callback){
	console.log("StoreJS: POST: "+path); 
	if(path == "service/checkout"){
		handlers["checkout"].post(path, args, session, callback); 
	}
	else if(path == "search"){
		handlers["search"].post(path, args, session, callback); 
	}
	else {
		callback("Unknown path: "+path); 
	}
}

exports.render = function(path, args, session, callback){
	if(path == "service/checkout"){
		handlers["checkout"].render(path, args, session, callback); 
	}
	else if(path == "search"){
		handlers["search"].render(path, args, session, callback); 
	}
	else if(path in category_pages){
		handlers["category"].render(path, args, session, callback); 
	}
	else if(path in product_pages){
		handlers["product"].render(path, args, session, callback);
	}
	else {
		callback("Path "+path+" not found in either categories or products!");
	}
}


categories.get = function(path, next){
	db.query("select * from fx_category where direct_path = ? or direct_path = ?", [path, "/"+path], function(error, rows){
		if(error || !rows.length) {
			console.log(error);
			next();
			return; 
		}
		var row = rows[0]; 
		var obj = {
			get: function(next) {
				self = this; 
				db.query("select * from fx_category where direct_path = ?", function(error, rows){
					if(!error && rows.length){
						for(key in rows[0]){
							self[key] = rows[0][key]; 
						}
					}
					done(self, error); 
				});
			},
			update: function(value, next){
				
			},
			remove: function(next){
				
			},
			get_products: function(options, next){
				db.query("select p.id from fx_category c, fx_product p where c.direct_path like ? and p.category = c.direct_path "+((options["only_top_level"])?(" and p.parent = 0"):""),
					[
						this.direct_path+((options["recursive"])?"%":"")
					], function(error, rows, cols){
					if(error){
						console.log("SQL ERROR in get_products: "+error);
						next(error); 
						return; 
					}
					
					next(error, rows); 
				}); 
			}
		}
		for(key in rows[0]){
			obj[key] = rows[0][key]; 
		}
		next(error, obj); 
	}); 
}


products.get = function(options, next){
	var id = options["id"]; 
	
	db.query("select * from fx_product where id = ?", [id], function(error, rows){
		if(error){
			console.log("SQL ERROR in products.get: "+error); 
			next(error);
			return; 
		}
		else if(!rows.length){
			next("No such product: "+id); 
			return; 
		}
		
		var obj = {
			images: []
		};
		for(key in rows[0])
			obj[key] = rows[0][key]; 
		
		db.query("select * from fx_product_options where option_name = 'image' and product_id = ?", [obj.id], function(error, rows, cols){
			for(key in rows){
				obj.images.push(rows[key]["option_value"]); 
			}
			
			obj.children = []; 
			if(options["load_children"]){
				db.query("select * from fx_product where parent = ?", [obj.id], function(error, rows){
						function do_rows(i, end){
							if(i < rows.length){
								products.get({id: rows[i].id}, function(error, p){
									obj.children.push(p); 
									do_rows(i+1, end);
								});
							}
							else {
								end();
							}
						}
						do_rows(0, function(){
							next(error, obj);
						}); 
				}); 
			} else {
				next(error, obj); 
			}
		});
		
			
	}); 
}

products.search = function(options, next){
	var search = options["term"]; 
	if(!search) {
		next("Search term is zero!", []);
		return;
	}
	
	var results = [];
	var searches = search.split(" "); 
	var where = searches
		.map(function(x){return "(description like "+db.escape("%"+x+"%")+" or name like "+db.escape("%"+x+"%")+")";})
		.join(" and "); 
	where = "("+where+") and parent = 0"; 
	
	console.log("SEARCH: "+where); 
	
	db.query("select id from fx_product where "+where, function(error, rows){
		if(!rows){
			next(undefined, {});
			return; 
		}
		if(error){
			console.log("SQL ERROR in products.search: "+error);
			return;
		}
		function each_row(i){
			if(i < rows.length){
				products.get({id: rows[i].id}, function(error, prod){
					results.push(prod); 
					each_row(i+1); 
				}); 
			} else {
				next(undefined, results); 
			}
		}
		each_row(0); 
	}); 
}
