
var server = {}; 

exports.init = function(x){
	server = x; 
}

exports.render = function(path, args, session, done){
	var html = session.render("storejs_header_minicart", {
		product_count: Object.keys(session.cart.items).length
	});
	done(html); 
}

