var PAGE_URL = 'http://localhost:3000/examples/';
var PAGE_READY_WAIT = 3000;

var page = require('webpage').create();

page.viewportSize = {
	width: 1280,
	height: 720
};

page.open(PAGE_URL, function () {
	console.log('Opened ' + PAGE_URL);

	//Wait a bit for Scrollmeister to become ready.
	setTimeout(function() {
		console.log('Waited ' + PAGE_READY_WAIT);

		page.injectJs('TweenLite.min.js');

		console.log('Included TweenLite.min.js');

		page.injectJs('ScrollToPlugin.min.js');

		console.log('ScrollToPlugin.min.js');

		page.evaluate(function() {
			TweenLite.to(document.body, 1000, {scrollTop: 1000});
		});

		setTimeout(pageReadyAndWarmedUp, 2000);

	}, PAGE_READY_WAIT);
});

var pageReadyAndWarmedUp = function() {
	console.log('Ready to record');

	page.clipRect = {
		top: 1000,
		left: 0,
		width: 1280,
		height: 720
	};

	page.render('frames/dragon.png', {
		format: 'png'
	});

	phantom.exit();
};