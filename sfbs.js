$(document).ready(function() {
	var page = 0;

	var photoUrl = function(photo, size) {
		if (size == 0 || size == null) size = ""; 
		
		size = size.toLowerCase();
		
		var sizes = {"square":"_s",
			"thumbnail":"_t",
			"small":"_m",
			"medium":"",
			"large":"_b"
		}
		
		var b = ["http://farm", photo.farm, ".static.flickr.com/", 
			photo.server, "/", photo.id, "_", photo.secret, sizes[size], ".jpg"]
		return b.join("");
	}
	
	var showPhoto = function(photo, size) {
		$("#photo").remove();
		$("#content")
			.prepend(
				$("<img>")
					.attr("id", "photo")
					.attr("src", photoUrl(photo, size))
					.click(function() {
						$(this).remove();
					})
			)		
	}
	
	var search = function() {
		page++;
		var size = new Size($("#size").val());
	
		$.getJSON(
			"http://api.flickr.com/services/rest/?jsoncallback=?",
			{ method : "flickr.photos.search",
				api_key : "b89c532ba8e26c1150bbdc2f0bc1f717",
				format : "json",
				//sort : "relevance",
				text : $("#search").val(),
				per_page: 100,
				page: page
			},
			function(data) {
				if (page == 1) $("#content").empty();

				$.each(data.photos.photo, function() {
					var photo = this;
						
					$("#content").append(
						$("<div>")
							.addClass("photo")
							.attr("id", photo.id)
							.append(
								$("<img>")
								.attr("src", photoUrl(photo, "thumbnail"))
								// When img is loaded, get the size
								.load(function() {
									if (size.isValid()) {
										$.getJSON("http://api.flickr.com/services/rest/?jsoncallback=?",
											{ method : "flickr.photos.getSizes",
												api_key : "b89c532ba8e26c1150bbdc2f0bc1f717",
												format : "json",
												photo_id: photo.id
											},
											function(data) {
												if (size.match(data.sizes.size)) {
													$.each(data.sizes.size, function() {
														$("#"+photo.id)
															.append(
																$("<a>")
																	.addClass("size")
																	.attr("href", "javascript:void(0);")
																	.attr("title", this.label)
																	.text([this.height, this.width].join("x"))
																	.click(function() {
																		showPhoto(photo, $(this).attr("title"));
																	})
															)
													})
												} else {
													$("#"+photo.id).fadeOut().addClass("wrongSize");
												} // if size match
											}
										)
									}
								})
								.click(function() {
									showPhoto(photo);
								})
							)
							.append(
								$("<a>").text("link")
									.addClass("link")
									.attr("href", "http://www.flickr.com/photos/"+this.owner+"/"+this.id)
									.attr("target", "_blank")
							)							
					);
				});
			}
		);
	}
	
	// Creates a new search
	var new_search = function() {
		page = 0;
		search();
	}
	
	$("#more").click(function() {
		search();
	});
	
	$("#search, #size").keypress(function(e) {
		if (e.which == 13) new_search();
	});
	
	$("#go").click(function() {
		new_search();
	});
	
	new_search();
});

////// SIZE
function Size(txt) {
	this.text = txt;
	this.init();
}

Size.prototype.isValid = function() {
	return this.height > 0 && this.width > 0
}

Size.prototype.init = function() {
	var re = /(\<|\>)?(\d+)(\*|x|\s)+(\<|\>)?(\d+)/
	var splitted = re.exec(this.text);
	
	
	// If size is parsable
	if (splitted && splitted.length == 6) {
		this.heightOperator = splitted[1];
		this.height = parseInt(splitted[2]);
		this.widthOperator = splitted[4];
		this.width = parseInt(splitted[5]);
	}
}

Size.prototype.match = function(sizes) {
	var m = false;
	var i = 0;
	while (m == false && i < sizes.length) {
		var size = sizes[i];
		var to_eval = [
			size.height, 
			this.heightOperator ? this.heightOperator : "=",
			"=",
			this.height,
			" && ",
			size.width, 
			this.widthOperator ? this.widthOperator : "=",
			"=",
			this.width]
		m = eval(to_eval.join(""));
		i++;
	}
	
	return m;
}


