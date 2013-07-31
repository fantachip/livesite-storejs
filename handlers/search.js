var server = {};
var ITEMS_PER_PAGE = 21;

exports.init = function(x){
	server = x; 
}

exports.render = function(path, args, session, done){
		var parts = path.split("/"); 
		// category page
		
		var search = args["q"]||" "; 
		
		console.log("StoreJS: sarching for "+search); 
		
		// strip slashes on the edges of the string
		path = path.replace(/\/+$/, "");
		path = path.replace(/^\/+/, "");
		var prod_list = [];
		var product_list = []; 
		
		// retreive all products that match the search
		server.storejs.products.search({term: search}, function(error, product_list){
			
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
			var end = start + ITEMS_PER_PAGE;
			if(product_list.length < end) end = product_list.length; 
			
			function each_product(i, done){
				if(i < product_list.length){
					server.storejs.products.get({id: product_list[i].id}, function(error, prod){
						product_list[i] = prod; 
						each_product(i+1, done); 
					}); 
				} else {
					done();
				}
			}
			each_product(0, function(){
				for(var key = start; key < end; key++){
					var prod = product_list[key]; 
					
					prod_list.push({
						title: prod.name,
						product_id: prod.id,
						short_description: prod.description.toString().substr(0, 300)+((prod.description.length > 300)?"...":""),
						price: prod.price,
						url: "/"+prod.category+"/"+prod.id,
						image: prod.images[0]
					});
				}
				
				var html = session.render("root", 
				{
					title: "Sökresultat: "+search,
					head: "",
					content: session.render("main_page", {
						search_term: search, 
						content: session.render("storejs_product_list", {
							products: prod_list,
							pagination: pagination_html
						}),
					})
				}); 
				done(html);
			});
		}); 
}
