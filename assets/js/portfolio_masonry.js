$(window).on('load', function() {
	var grid = $('.grid__item');
	var container = document.querySelector('.archive');
	// Get reference to loading screen
	var loading_screen = document.getElementById('loading');
	imagesLoaded(container, function() {
		hideLoading(loading_screen);
		grid.fadeIn();

		var msnry = new Masonry(document.querySelector('.archive'), {
		   columnWidth: 100,
		   itemSelector: '.grid__item',
		   percentPosition: true,
		   horizontalOrder: true,
		});
	});
});

function hideLoading(loading_screen) {
    loading_screen.classList.add('hidden');
}