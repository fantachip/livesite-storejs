var server = {};

exports.init = function(ctx){
	server = ctx; 
}

exports.render = function(path, args, session, done){
	var parts = path.split("/"); 
	if(parts.length < 2) done(""); 
	var id = parseInt(parts[parts.length-1]); 
	
	server.storejs.products.get({id: id, load_children: true}, function(error, prod){
		var html = session.render("root",
		{
			title: prod.name,
			head: "",
			content: session.render("main_page", {
				content: session.render("storejs_product_details",  {
					title: prod.name,
					description: prod.description,
					image: prod.images[0], 
					alternatives: (prod.children)?[prod].concat(prod.children):[prod]
				})
			})
		}); 
		done(html);
	}); 
}
