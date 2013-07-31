var crypto = require("crypto");

function MailOrder(cart){
	var path         = require('path')
	, templatesDir   = path.resolve(__dirname, '..', 'templates')
	, emailTemplates = require('email-templates')
	, nodemailer     = require('nodemailer');

	emailTemplates(__dirname+"/../templates", function(err, template) {
		if (err) {
			console.log(err);
			throw err; 
		} else {

			var transportBatch = nodemailer.createTransport("SMTP", {
				service: "Gmail",
				auth: {
					user: "noreply@sakradorren.se",
					pass: "d3YeCRU4ukUw4"
				}
			});
			
			// An example users object
			var rcpt = 
			[
				{
					email: 'info@sakradorren.se',
					extra_info: "SSN: "+cart.ssn,
					order: cart
				},
				{
					email: cart.contact.email,
					extra_info: "",
					order: cart
				}
			];

			var Render = function(data) {
				this.data = data;
				this.send = function(err, html, text) {
					if (err) {
						console.log(err);
					} else {
						transportBatch.sendMail({
							from: 'Säkra Dörren <noreply@sakradorren.se>',
							to: data.email,
							subject: 'Order #'+data.order.order_number,
							html: html,
							// generateTextFromHTML: true,
							text: text
						}, function(err, responseStatus) {
							if (err) {
								console.log(err);
							} else {
								console.log(responseStatus.message);
							}
						});
					}
				};
				this.batch = function(batch) {
					batch(this.data, "templates", this.send);
				};
			};

			// Load the template and send the emails
			template('confirmation', true, function(err, batch) {
				for(var rc in rcpt) {
					var render = new Render(rcpt[rc]);
					render.batch(batch);
				}
			});
		}
	});
}

function ProcessArgs(args, session, next){
	
}

var server = {}
exports.init = function(x){
	server = x; 
}

exports.post = function(path, args, session, next){
	var config = server.config; 
	
	if("add-to-cart" in args){
		var id = args["add-to-cart"]; 
		var cart = session.cart; 
		
		if(id in cart.items){
			console.log("Adding another copy of item "+id+" to cart"); 
			parseInt(cart.items[id].count)+1; 
		}
		server.storejs.products.get({id: id}, function(error, prod){
			if(error){
				console.log(error); 
				next("Error: "+error); 
				return; 
			}
			if(id in cart.items){
				cart.items[id].count += parseInt(args["quantity"])||1; 
			} else {
				cart.items[id] = {
					product: prod,
					count: parseInt(args["quantity"])||1
				}
			}
			next("Success"); 
		}); 
		console.log("CART: "+JSON.stringify(cart)); 
		return; 
	} else if("get_cart" in args){
		var cart = session["cart"]; 
		
		next(JSON.stringify(cart)); 
		return; 
	} else if("order_submit" in args){
		var cart = session["cart"]; 
		
		console.log("Preparing to submit order.. "); 
		
		// copy the posted data into the session
		for(var key in cart.address)
			cart.address[key] = args[key]||"";
			
		for(var key in cart.contact)
			cart.contact[key] = args[key]||"";
			
		cart.ssn = args["billing_pno"];
		cart.comment = args["order_comments"]; 
		cart.payment_method = args["payment_method"]; 
		
		cart.paid = false; 
		try {
			MailOrder(cart); 
			cart.submitted = true; 
		} catch(e){
			console.log("ERROR: could not mail order. "+e); 
			cart.submitted = false; 
		}
		
		if("payment_method" in args && args["payment_method"] == "payson"){
			console.log("Generated payment redirect form for payson!"); 
			cart.payment_redirect_form = session.render("storejs_payson", {
				payson_adr: config.payson.checkout_url,
				buyer_email: cart.contact.email,
				buyer_first_name: cart.address.first_name, 
				buyer_last_name: cart.address.last_name,
				agent_id: config.payson.agent_id,
				description: "Order nr "+cart.order_number,
				seller_email: config.payson.seller_email,
				cost: cart.total,
				extra_cost: "0",
				ok_url: config.payson.success_url,
				cancel_url: config.payson.cancel_url,
				ref_nr: cart.order_number,
				md5_hash: String(crypto.createHash("md5").update(config.payson.seller_email + ":" + String(cart.total) + ":" + "0" + ":" + config.payson.success_url + ":" + "0" + config.payson.secret_key).digest("hex")),
				guarantee_offered: 0
			});
			
			next("Success");
			return; 
		} else if("payment_method" in args && args["payment_method"] == "paypal"){
			cart.payment_redirect_form = session.render("storejs_paypal", {
					paypal_adr: config.paypal.checkout_url,
					seller_email: config.paypal.seller_email,
					buyer_email: cart.contact.email,
					buyer_first_name: cart.address.first_name, 
					buyer_last_name: cart.address.last_name,
					description: "Order nr "+cart.order_number,
					cart_subtotal: cart.subtotal,
					shipping_total: cart.shipping_total,
					ok_url: config.paypal.success_url,
					cancel_url: config.paypal.cancel_url,
					ref_nr: cart.order_number
			}); 
			
			console.log("Generated payment redirect form for paypal!"); 
			next("Success");
			return; 
		} else if("payment_method" in args && args["payment_method"] == "klarna"){
			session.render("storejs_klarna", {
			
			}); 
			cart.paid = true; 
			if(cart.submitted){
				session["cart"] = cart.New(); 
			}
			next("Success");
			return; 
			/*
			var klarna_order = {
					"merchant_reference": {
							"orderid1": "123456789",
							"orderid2": "123456789"
					},
					"purchase_country": "se",
					"purchase_currency": "sek",
					"locale": "sv-se",
					"cart": {
							"items": [
							{
									"reference": "123456789",
									"name": "Klarna t-shirt",
									"quantity": 4,
									"ean": "1234567890123",
									"uri": "http://example.com/product.php?123456789",
									"image_uri": "http://example.com/product_image.php?123456789",
									"unit_price": 12300,
									"discount_rate": 1000,
									"tax_rate": 2500
							},
							{
									"type": "shipping_fee",
									"reference": "SHIPPING",
									"name": "Shipping fee",
									"quantity": 1,
									"unit_price": 4900,
									"tax_rate": 2500
							}
							]
					},
					"shipping_address": {
							"given_name": "Testperson-se",
							"family_name": "Approved",
							"street_address": "Stårgatan 1",
							"postal_code": "12345",
							"city": "Ankeborg",
							"country": "se",
							"email": "checkout@testdrive.klarna.com",
							"phone": "0765260000"
					},
					"gui": {
							"layout": "desktop"
					},
					"merchant": {
							"id": config.klarna_eid,
							"terms_uri": "http://example.com/terms.php",
							"checkout_uri": "https://example.com/checkout.php",
							"confirmation_uri": "https://example.com/thankyou.php?sid=123&klarna_order={checkout.order.uri}",
							"push_uri": "https://example.com/push.php?sid=123&klarna_order={checkout.order.uri}"
					}
			}
			// Build the post string from an object
			var post_data = JSON.stringify(klarna_order); //querystring.stringify(klarna_order);
			
			var token = String(crypto.createHash("sha256").update(post_data+config.klarna_secret).digest("hex"));
			token = new Buffer(token).toString("base64"); 
			
			console.log("Klarna token: "+token); 
			console.log("Klrana request: "+post_data); 
			
			// An object of options to indicate where to post to
			var post_options = {
					host: 'checkout.testdrive.klarna.com',
					port: '443',
					path: '/checkout/orders',
					method: 'POST',
					headers: {
						"Accept": "application/vnd.klarna.checkout.aggregated-order-v2+json",
						"Authentication": "Klarna "+token,
						"Content-Type": "application/vnd.klarna.checkout.aggregated-order-v2+json"
					}
			};

			// Set up the request
			var post_req = https.request(post_options, function(res) {
					res.setEncoding('utf8');
					res.on('data', function (chunk) {
							console.log('Response: ' + chunk);
					});
			});

			// post the data
			post_req.write(post_data);
			post_req.end();*/
		}
		
		else if("payment_method" in args && args["payment_method"] == "bank"){
			cart.payment_redirect_form = session.render("payment_redirect", {
				content: session.render("bank", {
				}) 
			}); 
			cart.paid = true; 
			if(cart.submitted){
				session["cart"] = cart.New(); 
			}
			next("Success"); 
			return; 
		}
		//delete session["cart"]; 
		next();
		return; 
	}
	else if("update_cart" in args){
		for(key in args){
			if(key.indexOf("itemqty-") == 0){
				var id = key.substr(8); 
				var cart = session["cart"]; 
				
				console.log("CART: updateing quantity of item "+id+" to "+args[key]); 
				if(id in cart.items){
					try{
						cart.items[id].count = parseInt(Math.abs(args[key])); 
					} catch(e){
						console.log("ERROR: wrong argument for parameter "+key+" :"+e.toString()); 
					}
				}
			}
		}
		next(); return; 
	} 
	else if("remove_cart_item" in args){
		var id = args["remove_cart_item"]; 
		var cart = session["cart"]; 
				
		console.log("CART: removing item "+id+" from cart."); 
		if(id in cart.items){
			try{
				delete cart.items[id]; 
			} catch(e){
				console.log("ERROR: wrong argument for parameter "+key); 
			}
		}
		next(); return; 
	}else if("order_cancel" in args){
		session["cart"] = session["cart"].New(); 
	}else if("order_confirm" in args){
		session["cart"] = session["cart"].New(); 
	}
	next(); 
}

exports.render = function(path, args, session, done){
	exports.post(path, args, session, function(){
		var cart = session["cart"]; 
		
		var cart_items = Object.keys(cart.items).map(function (key) {
				return cart.items[key];
		});
		
		cart.subtotal = (cart_items.map(function(i){
						return i.count * i.product.price; 
					}).reduce(function(a, b){return a+b;}, 0));
		cart.shipping_total = parseFloat((cart_items.length > 0)?75.0:0.0); 
		cart.total = Math.ceil(cart.subtotal + cart.shipping_total);
		cart.tax_total = parseFloat(cart.total - cart.total / (1.25)); 
		
		function render(){
			if(!cart_items.length){
				return session.render("storejs_message", {
					message: "Varukorgen är tom!"
				});
			}
			return session.render("storejs_checkout_form", {
				cart: cart,
				cart_rows: cart_items.map(function(i){
					return {
						id: i.product.id,
						name: i.product.name,
						url: "/"+i.product.category+"/"+i.product.id,
						image_url: "/images/product/"+i.product.sku+".jpg",
						count: i.count,
						sku: i.product.sku,
						row_total: i.count * i.product.price,
						price: i.product.price
					}; // render
				}), // map
				subtotal: cart.subtotal.toFixed(2),
				shipping_total: cart.shipping_total.toFixed(2),
				tax_total: cart.tax_total.toFixed(2),
				cart_total: parseInt(cart.total),
				payment_redirect_form: cart.payment_redirect_form
			}); 
		}
		var html = session.render("root", 
		{
			title: "Varukorg",
			head: "",
			content: session.render("main_page", {
				content: render()
			})
		}); 
		done(html);
	}); 
} 
