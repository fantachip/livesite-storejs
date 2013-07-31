
var server = {}; 

exports.init = function(x){
	server = x; 
}

exports.render = function(path, args, session, done){
	var html = session.render("storejs_search_widget", {
		search_term: session.last_search_term || ""
	});
	done(html); 
}

