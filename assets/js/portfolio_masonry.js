$(window).on('load', function() {
	var grid = $('.grid__item');
	var container = document.querySelector('.archive');
	imagesLoaded(container, function() {
		grid.fadeIn();

		var msnry = new Masonry(document.querySelector('.archive'), {
		   columnWidth: 100,
		   itemSelector: '.grid__item',
		   percentPosition: true,
		   horizontalOrder: true,
		});
	});
});