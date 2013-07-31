var server = {};

var ITEMS_PER_PAGE = 21; 

exports.init = function(ctx){
	server = ctx;
}

exports.render = function(path, args, session, done){
	var categories = server.storejs.categories; 
	
	server.storejs.categories.get(path, function(error, cat){
		if(error){
			console.log("ERROR: "+error); 
			done("");
			return; 
		}
		
		// get all products for category
		cat.get_products({recursive: true, only_top_level: true}, function(error, product_list){
			if(error){
				console.log("ERROR: "+error);
				done("");
				return; 
			}
			
			// generate pagination links
			var pagination_links = ""; 
			var total_pages = Math.floor(product_list.length / ITEMS_PER_PAGE); 
			var pp_start = parseInt(args["page"]||"0") - 5; 
			if(pp_start < 0) pp_start = 0; 
			var pp_end = (pp_start + 10 > total_pages)?total_pages:pp_start+10; 
			if(pp_start != 0){
				pagination_links += "<li><a href='/"+path+"?page=0'>1</a></li>"; 
			}
			for(var c = pp_start; c <= pp_end; c++){
				pagination_links += "<li><a href='/"+path+"?page="+c+"'>"+(c+1)+"</a></li>"; 
			}
			if(pp_end != total_pages){
				pagination_links += "<li><a href='/"+path+"?page="+total_pages+"'>"+(total_pages+1)+"</a></li>";
			}
			pagination_html = session.render("storejs_pagination", {content: pagination_links}); 
			
			// generate product list with pagination
			var start = ((parseInt(args["page"])||0)*ITEMS_PER_PAGE); 
			var last_item = start + ITEMS_PER_PAGE;
			if(product_list.length < last_item) last_item = product_list.length; 
			
			var prod_list = []; 
			function retreive_product(i, end){
				if(i < last_item){
					server.storejs.products.get({id: product_list[i].id}, function(error, prod){
						if(error || !prod){
							console.log("ERROR ("+i+"): "+error); 
							retreive_product(i+1, end); 
							return; 
						}
						prod_list.push({
							title: prod.name,
							product_id: prod.id,
							short_description: prod.description.toString().substr(0, 300)+((prod.description.length > 300)?"...":""),
							price: prod.price,
							url: "/"+prod.category+"/"+prod.id,
							image: prod.images[0]
						});
						retreive_product(i+1, end); 
					}); 
				}
				else end(); 
			}
			retreive_product(start, function(){
				var html = session.render("root", {
					title: cat.title,
					head: "",
					content: session.render("main_page", {
						content: session.render("storejs_product_list", {
							products: prod_list,
							pagination: pagination_html
						}),
					})
				}); 
				done(html);
			}); 
		}); 
	}); 
}
