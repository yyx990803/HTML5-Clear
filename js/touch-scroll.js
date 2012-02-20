(function($) {
	
	// Define default scroll settings
	var defaults = {
		y: 0,
		scrollHeight: 0,
		elastic: !navigator.userAgent.match(/android/i),
		momentum: true,
		elasticDamp: 0.6,
		elasticTime: 50,
		reboundTime: 400,
		momentumDamp: 0.9,
		momentumTime: 300,
		iPadMomentumDamp: 0.95,
		iPadMomentumTime: 1200,
		touchTags: ['select', 'input', 'textarea']
	};
	
	// Define methods
	var methods = {
		
		init: function(options) {
			return this.each(function() {
				
				var o = $.extend(defaults, options);
				
				// Prevent double-init, just update instead
				if (!!this._init) {
					return this.update();
				}
				this._init = true;
				
				// Define element variables
				var $this = $(this),
					scrollY = -o.y,
					touchY = 0,
					movedY = 0,
					pollY = 0,
					height = 0,
					maxHeight = 0,
					scrollHeight = 0,
					scrolling = false,
					bouncing = false,
					moved = false,
					timeoutID,
					isiPad = !!navigator.platform.match(/ipad/i),
					hasMatrix = 'WebKitCSSMatrix' in window,
					has3d = hasMatrix && 'm11' in new WebKitCSSMatrix();
				
				// Keep bottom of scroll area at the bottom on resize
				var update = this.update = function() {
					height = $this.height();
					if (o.scrollHeight) {
						scrollHeight = o.scrollHeight;
					} else if ($this.prop) {
						scrollHeight = $this.prop('scrollHeight'); // jQuery 1.6 uses .prop(), older versions use .attr()
					} else {
						scrollHeight = $this.attr('scrollHeight');
					}
					if (scrollHeight < height) {
						scrollHeight = height;
					}
					maxHeight = height - scrollHeight;
					clearTimeout(timeoutID);
					clampScroll(false);
				};
				
				// Set up initial variables
				update();
				
				// Set up transform CSS
				$this.css({'-webkit-transition-property': '-webkit-transform',
					'-webkit-transition-timing-function': 'cubic-bezier(0,0,0.2,1)',
					'-webkit-transition-duration': '0',
					'-webkit-transform': cssTranslate(scrollY)});
				
				// Listen for screen size change event
				window.addEventListener('onorientationchange' in window ? 'orientationchange' : 'resize', update, false);
				
				// Listen for touch events
				$this.bind('touchstart.touchScroll', touchStart);
				$this.bind('touchmove.touchScroll', touchMove);
				$this.bind('touchend.touchScroll touchcancel.touchScroll', touchEnd);
				$this.bind('webkitTransitionEnd.touchScroll', transitionEnd);
				
				// Set the position of the scroll area using transform CSS
				var setPosition = this.setPosition = function(y) {
					scrollY = y;
					$this.css('-webkit-transform', cssTranslate(scrollY));
				};
				
				// Transform using a 3D translate if available
				function cssTranslate(y) {
					return 'translate' + (has3d ? '3d(0,' : '(0,') + y + 'px' + (has3d ? ',0)' : ')');
				}
				
				// Set CSS transition time
				function setTransitionTime(time) {
					time = time || '0';
					$this.css('-webkit-transition-duration', time + 'ms');
				}

				// Get the actual pixel position made by transform CSS
				function getPosition() {
					if (hasMatrix) {
						var transform = window.getComputedStyle($this[0]).webkitTransform;
						if (!!transform && transform !== 'none') {
							var matrix = new WebKitCSSMatrix(transform);
							return matrix.f;
						}
					}
					return scrollY;
				}
				
				// Expose getPosition API
				this.getPosition = function() {
					return getPosition();
				};

				// Bounce back to the bounds after momentum scrolling
				function reboundScroll() {
					if (scrollY > 0) {
						scrollTo(0, o.reboundTime);
					} else if (scrollY < maxHeight) {
						scrollTo(maxHeight, o.reboundTime);
					}
				}

				// Stop everything once the CSS transition in complete
				function transitionEnd() {
					if (bouncing) {
						bouncing = false;
						reboundScroll();
					}

					clearTimeout(timeoutID);
				}
				
				// Limit the scrolling to within the bounds
				function clampScroll(poll) {
					if (!hasMatrix || bouncing) {
						return;
					}

					var oldY = pollY;
					pollY = getPosition();
					
					if (pollY > 0) {
						if (o.elastic) {
							// Slow down outside top bound
							bouncing = true;
							scrollY = 0;
							momentumScroll(pollY - oldY, o.elasticDamp, 1, height, o.elasticTime);
						} else {
							// Stop outside top bound
							setTransitionTime(0);
							setPosition(0);
						}
					} else if (pollY < maxHeight) {
						if (o.elastic) {
							// Slow down outside bottom bound
							bouncing = true;
							scrollY = maxHeight;
							momentumScroll(pollY - oldY, o.elasticDamp, 1, height, o.elasticTime);
						} else {
							// Stop outside bottom bound
							setTransitionTime(0);
							setPosition(maxHeight);
						}
					} else if (poll) {
						// Poll the computed position to check if element is out of bounds
						timeoutID = setTimeout(clampScroll, 20, true);
					}
				}
				
				// Animate to a position using CSS
				function scrollTo(destY, time) {
					if (destY === scrollY) {
						return;
					}
					
					moved = true;
					setTransitionTime(time);
					setPosition(destY);
				}
				
				// Perform a momentum-based scroll using CSS
				function momentumScroll(d, k, minDist, maxDist, t) {
					var ad = Math.abs(d),
						dy = 0;
					
					// Calculate the total distance
					while (ad > 0.1) {
						ad *= k;
						dy += ad;
					}
					
					// Limit to within min and max distances
					if (dy > maxDist) {
						dy = maxDist;
					}
					if (dy > minDist) {
						if (d < 0) {
							dy = -dy;
						}
						
						dy += scrollY;
						
						// If outside the bounds, don't go too far
						if (height > 0) {
							if (dy > height * 2) {
								var ody = dy;
								dy = height * 2;
							} else if (dy < maxHeight - height * 2) {
								dy = maxHeight - height * 2;
							}
						}
					
						// Perform scroll
						scrollTo(Math.round(dy), t);
					}
					
					clampScroll(true);
				}
				
				// Get the touch points from this event
				function getTouches(e) {
					if (e.originalEvent) {
						if (e.originalEvent.touches && e.originalEvent.touches.length) {
							return e.originalEvent.touches;
						} else if (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
							return e.originalEvent.changedTouches;
						}
					}
					return e.touches;
				}
				
				// Dispatches a fake mouse event from a touch event
				function dispatchMouseEvent(name, touch, target) {
					var e = document.createEvent('MouseEvent');
					e.initMouseEvent(name, true, true, touch.view, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
					target.dispatchEvent(e);
				}
				
				// Find the root node of this target
				function getRootNode(target) {
					while (target.nodeType !== 1) {
						target = target.parentNode;
					}
					return target;
				}
				
				// Perform a touch start event
				function touchStart(e) {
					// Allow certain HTML tags to receive touch events
					if ($.inArray(e.target.tagName.toLowerCase(), o.touchTags) !== -1) {
						return;
					}
					
					// Stop the default touches
					e.preventDefault();
					e.stopPropagation();
					
					var touch = getTouches(e)[0];
					
					// Dispatch a fake mouse down event		
					dispatchMouseEvent('mousedown', touch, getRootNode(touch.target));
					
					scrolling = true;
					moved = false;
					movedY = 0;
					
					clearTimeout(timeoutID);
					setTransitionTime(0);
					
					// Check scroll position
					if (o.momentum) {
						var y = getPosition();
						if (y !== scrollY) {
							setPosition(y);
							moved = true;
						}
					}

					touchY = touch.pageY - scrollY;
				}
				
				// Perform a touch move event
				function touchMove(e) {
					if (!scrolling) {
						return;
					}
					
					var dy = getTouches(e)[0].pageY - touchY;
					
					// Elastic-drag or stop when moving outside of boundaries
					if (dy > 0) {
						if (o.elastic) {
							dy /= 2;
						} else {
							dy = 0;
						}
					} else if (dy < maxHeight) {
						if (o.elastic) {
							dy = (dy + maxHeight) / 2;
						} else {
							dy = maxHeight;
						}
					}
					
					movedY = dy - scrollY;
					moved = true;
					setPosition(dy);
				}
				
				// Perform a touch end event
				function touchEnd(e) {
					if (!scrolling) {
						return;
					}
					
					scrolling = false;
					
					if (moved) {
						// Ease back to within boundaries
						if (scrollY > 0 || scrollY < maxHeight) {
							reboundScroll();
						} else if (o.momentum) {
							// Free scroll with momentum
							momentumScroll(movedY, isiPad ? o.iPadMomentumDamp : o.momentumDamp, 40, 2000, isiPad ? o.iPadMomentumTime : o.momentumTime);
						}			
					} else {
						var touch = getTouches(e)[0],
							target = getRootNode(touch.target);
						
						// Dispatch fake mouse up and click events if this touch event did not move
						dispatchMouseEvent('mouseup', touch, target);
						dispatchMouseEvent('click', touch, target);
					}
				}
			
			});
		},
		
		update: function() {
			return this.each(function() {
				this.update();
			});
		},
		
		getPosition: function() {
			var a = [];
			this.each(function() {
				a.push(-this.getPosition());
			});
			return a;
		},
		
		setPosition: function(y) {
			return this.each(function() {
				this.setPosition(-y);
			});
		}
		
	};
	
	// Public method for touchScroll
	$.fn.touchScroll = function(method) {
	    if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' +  method + ' does not exist on jQuery.touchScroll');
		}
	};

})(Zepto);