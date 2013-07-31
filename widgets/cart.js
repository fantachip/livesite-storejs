var server = {}; 

exports.init = function(x){
	server = x; 
}

exports.render = function(path, args, session, done){
	var cart = session.cart; 
	var cart_items = Object.keys(cart.items).map(function (key) {
			return cart.items[key];
	});
	var html = session.render("widget", {
		title: "Varukorgen",
		content: session.render("storejs_cart", {
			cart: cart,
			products: cart_items.map(function(i){
				return {
					product: i.product,
					count: i.count,
					url: "/"+i.product.category+"/"+i.product.id,
				}; // render
			}), // map
			total: cart_items.map(function(i){return i.product.price * i.count;}).reduce(function(a, b){return a+b;}, 0),
			count: cart_items.length
		})
	}); 
	done(html); 
}
