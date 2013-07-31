$('input[name="payment_url"]').attr("value", "/pay/payson");
$(".expander_tip").css("display","none");
$('#payment_method_payson').attr("checked", "checked");
$("#payment_method_payson").parent().find(".expander_tip").show("fast"); //Slide Down Effect

$(".expander_tip").each(function(){
	$(this).parent().find(".input-radio").click(function(){
		$(".expander_tip").slideUp("fast");
		$(this).parent().find(".expander_tip").slideDown("fast");
	});
});

$(document).ready(function(){
	$(".storejs_cancel_order").click(function(){
		
	}); 
	$(".storejs_checkout_form").submit(function(){
		// we first submit order info through ajax and then reload the page if successful.
		var data = {};
		$(this).serializeArray().map(function(x){data[x.name] = x.value;}); 
		
		var form = $(this); 
		var valid = true; 
		
		$(".inline-help").css("display", "none"); 
		
		function ih(name){
			return form.find("input[name='"+name+"']").parent().find(".inline-help");
		}
		
		if(!/.{2,}/.test(data.first_name)){
			ih("first_name").css("display", "block");
			valid = false; 
		}
		if(!/.{2,}/.test(data.last_name)){
			ih("last_name").css("display", "block");
			valid = false; 
		}
		if(!/.+/.test(data.address1)){
			ih("address1").css("display", "block"); 
			valid = false; 
		}
		if(!/.{3,}/.test(data.zip)){
			ih("zip").css("display", "block"); 
			valid = false; 
		}
		if(!/.+/.test(data.city)){
			ih("city").css("display", "block");
			valid = false; 
		}
		if(!/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(data.email)){
			ih("email").css("display", "block");
			valid = false; 
		}
		if(!/[0-9\-\s\+\(\)\.]+/.test(data.phone)){
			ih("phone").css("display", "block");
			valid = false; 
		}
		if($("input[name='payment_method']").val() === "klarna"){
			if(!/[0-9]{0,2}[0-9]{6}[\-]{0,1}[0-9]{4}/.test(data.billing_pno)){
				ih("billing_pno").css("display", "block");
				valid = false; 
			}
		}
		if(valid){
			$.ajax({
				type: $(this).attr("method"),
				url: $(this).attr("action"),
				data: $(this).serialize(),
				success: function(data){
					window.location.reload(); 
				}
			}); 
		}
		return false; 
	});
	$(".add_to_cart_form").submit(function(){
		$.ajax({
			type: $(this).attr('method'),
			url: $(this).attr('action'),
			data: $(this).serialize(),
			success: function (data) {
				// retreive the cart from server and update the cart widget(s)
				window.location.reload(); 
				return false; 
				$.ajax({
					type: "post",
					url: "/service/checkout",
					data: {
						"get_cart": 1
					},
					success: function (data) {
						try{
							var cart = JSON.parse(data); 
							window.location.reload(); 
						} catch(e){
							alert("A server error occured: "+e+". Please reload the page or contact support if the item does not appear to be in the cart!"); 
						}
					}
				});
			}
		});
		return false; 
	});
}); 
function storejs_add_to_cart_ajax(){
	
}
