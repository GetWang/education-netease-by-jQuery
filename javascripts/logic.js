
/* 页面逻辑设置 */
(function () {
	var coursesObj = {},	 // 保存请求课程列表时返回数据转化后的对象
		hotCourArr = [],	 // 保存请求热门课程时返回数据转化后的数组
		type = 10,		 	 // type为课程的类型
		tabChange = true, 	 // tabChange为课程tab改变时的标志
		$follow,		 	 // 关注按钮
		content, courses,    // 课程内容节点和课程列表节点
		hotList, moveCont;	 // 热门推荐列表节点和热门课程移动容器
	/* 轮播图片淡入动画 */
	function fadIn (ele, interval, fadeTime, callback) {
		var stepOpacity = 1/(fadeTime/interval);
		var step = function () {
			var opa = ele.style.opacity + stepOpacity;
			if (opa < 1) {
				ele.style.opacity = opa;
			} else {
				clearInterval(intervalId);
				ele.style.opacity = 1;
				if (callback) callback();
			}
		};
		var intervalId = setInterval(step, interval);
	}
	/* 滚动热门课程动画 */
	function moveCourse (duration, interval, moveTime, distance, callback) {
		var stepLen = Math.floor(distance/(moveTime/interval));
		var cour = moveCont.getElementsByClassName('m-hotCour')[0];
		var step = function () {
			var len = Math.abs(parseInt(moveCont.style.top)) + stepLen;
			if (len < distance) {
				moveCont.style.top = '-' + len + 'px';
			} else {
				clearInterval(intervalId);
				moveCont.removeChild(cour);
				moveCont.style.top = '0px';
				if (callback) callback();
			}
		}; 
		var intervalId = setInterval(step, interval);
	}	
	/* 关注API */
	function followAPI () {
		$.get('http://study.163.com/webDev/attention.htm')
			.done(function (data, textStatus, jqXHR) {
				if (data === '1') {
					$.cookie('followSuc', 'true');
					$follow.html('已关注' + '<a class="unfollow">取消</a>');
					$follow.addClass('followed');
					$follow[0].disabled = true; 
					var unfollowHandler = function (event) {
						// $.removeCookie('followSuc');
						$follow.html('+ 关注');
						$follow.removeClass('followed');
						var enable = function () {
							$follow[0].disabled = false;
						};
						setTimeout(enable, 300);  
					};
					$follow.find('.unfollow').click(unfollowHandler);
					console.log('follow successfully');
				}
			})
			.fail(function (jqXHR, textStatus, errorThrown) {
				alert('request was unsuccessful: ' + jqXHR.status);
			});
	}	
	/* 登录请求验证 */
	function loginValidate (response) {
		if (response === '1') {
			$('.m-logMod').remove();
			$.cookie('loginSuc', 'true');
			console.log('login successfully');			
			followAPI();
		} else if (response === '0') {
			var $error = $("<span>用户名或密码错误！</span>");
			$error.css({
				position: 'absolute',
				left: '40px',
				bottom: '88px',
				color: 'red'
			});
			var $form = $('.m-logMod #login');
			$form.append($error);
			/* 为表单添加输入事件 */				
			var inputHandler = function (event) {
					$error.remove();				
			};
			$form.one("input", inputHandler);	
		}
	}
	/* 创建登录弹窗及iframe */
	function creLoginMod (callback) {
		var $modal = $("<div class='m-modal m-logMod'></div>");
		$modal.html("<form id='login' action='http://study.163.com/webDev/login.htm' target='logIframe'>"
					 + "<h3>登录网易云课堂</h3>"
					 + "<input type='text' id='username' required placeholder='用户名'></input>"
					 + "<p><input type='password' id='password' required placeholder='密码'></input></p>"
					 + "<button>登录</button><i class='close'></i></form>"
					 + "<iframe id='logIframe' name='logIframe'></iframe>");
		$(document).find('body').append($modal);
		/* 为登录按钮添加点击事件 */
		var loginHandler = function (event) {
			var hexName = md5.hex(username.value),
				hexPsword = md5.hex(password.value);
			var inforObj = {
				userName: hexName,
				password: hexPsword
			};
			$.get('http://study.163.com/webDev/login.htm', inforObj)
				.done(function (data, textStatus, jqXHR) {
					callback(data);
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					alert('request was unsuccessful: ' + jqXHR.status);
				});
		};
		$('button', $modal).click(loginHandler);
		/* 为关闭按钮添加点击事件 */
		var closeHandler = function (event) {
			$modal.remove();
		};
		$('.close', $modal).click(closeHandler);	
		/* 为iframe添加加载事件 */
		$logIframe = $('#logIframe', $modal);
		var ifrHandler = function (event) {
			try {
				var result = JSON.parse($logIframe[0].contentWindow.document.body.contentText);
				console.log(result);
			} catch (err) {
				console.log('error');
			}
		};	
		$logIframe.load(ifrHandler);	
	}
	/* 创建视频弹窗 */
	function creVideoMod ()	{
		var $modal = $("<div class='m-modal m-videoMod'></div>");
		$modal.html("<div id='videoCont'>"
					 + "<h3>请观看下面的视频</h3>"
					 + "<video controls>"
					 + "<source src='http://mov.bn.netease.com/open-movie/nos/mp4/2014/12/30/SADQ86F5S_shd.mp4'"
					 + "type='video/mp4'></source></video>"
					 + "<i class='close'></i></div>");
		$(document).find('body').append($modal);
		/* 为关闭按钮添加点击事件 */
		var closeHandler = function (event) {
			$modal.remove();
		};
		$modal.find('.close').click(closeHandler);
	}	

	/* course对象构造函数 */
	function Course (inforObj) {
		var $course = $("<div class='m-course'></div>");
		$course.attr("title", inforObj.name);
		// $course.attr("courseObj", this);
		$course[0].courseObj = this;
		var $img = $('<img/>');
		$img.attr('src', inforObj.middlePhotoUrl);
		$course.append($img);
		var $bri_intro = $("<div class='brief_intro'></div>");
		var $name = $("<h4 class='name'></h4>");
		$name.text(inforObj.name);
		var $provider = $("<p class='provider'></p>");
		$provider.text(inforObj.provider);
		var $learner = $("<span class='learnerCount'></span>");
		$learner.text(inforObj.learnerCount);
		var $price = $("<p class='price'></p>");
		$price.html((inforObj.price === 0) ? '免费' : ('&yen; ' + inforObj.price));
		$bri_intro.append($name);
		$bri_intro.append($provider);
		$bri_intro.append($learner);
		$bri_intro.append($price);
		$course.append($bri_intro);
		courses.appendChild($course[0]);
		this.$course = $course;
		this.inforObj = inforObj;
		this.addEvent();
	}
	/* 为course对象添加增添事件方法 */
	Course.prototype.addEvent = function () {
		/* 为课程添加mouseenter事件 */
		var enterHandler = function (event) {
			// console.log(event);
			// console.log(event.target);
			// console.log(event.currentTarget);
			// console.log(this);
			this.creCard(event.currentTarget);
		}.bind(this);
		this.$course.on('mouseenter', enterHandler);
		/* 为课程添加mouseleave事件 */
		var leaveHandler = function (event) {
			// console.log(event);
			// console.log(event.target);
			// console.log(event.currentTarget);
			// console.log(this);
			this.remvCard(event.currentTarget);
		}.bind(this);
		this.$course.on('mouseleave', leaveHandler);
	};
	/* 为course对象添加创建卡片方法 */
	Course.prototype.creCard = function (target) {
		var inforObj = target.courseObj.inforObj;
		var $card = $("<div class='card'></div>");
		$card.html("<img/><div class='detail'></div>");
		var name = document.createElement('h4');
		name.className = 'name';
		name.innerText = inforObj.name;
		var learner = document.createElement('span');
		learner.className = 'learnerCount';
		learner.innerText = inforObj.learnerCount + '人在学';
		var provider = document.createElement('p');
		provider.className = 'provider';
		provider.innerText = '发布者：' + inforObj.provider;
		var category = document.createElement('p');
		category.className = 'category';
		category.innerText = '分类：' + (inforObj.categoryName ? inforObj.categoryName : '');
		var detail = $card.find('.detail')[0];
		detail.appendChild(name);
		detail.appendChild(learner);
		detail.appendChild(provider);
		detail.appendChild(category);
		var description = document.createElement('p');
		description.className = 'description';
		description.innerText = inforObj.description;
		$card[0].appendChild(description);
		target.appendChild($card[0]);
	};
	/* 为course对象添加移除卡片方法 */
	Course.prototype.remvCard = function (target) {
		$(target).find('.card').remove();
	};

	/* 处理获取课程列表时返回的数据 */
	function handleCourses (json) {		
		courses = document.createElement('div');
		courses.className = 'courses';
		coursesObj = JSON.parse(json);
		var len = coursesObj.list.length;
		for (var i = 0; i < len; i++) {
			new Course(coursesObj.list[i]);
		}
		content.appendChild(courses);
		$(content).addClass('courListed');
		if (tabChange === true) {
			new PageMod(coursesObj.totalPage, type);
			tabChange = false;
		}
	}
	/* 获取课程列表的API */
	function getCourses (pageNo, psize, type) {
		$.get("http://study.163.com/webDev/couresByCategory.htm", 
			  {
				pageNo: pageNo, 
				psize: psize, 
				type: type
			  })
			.done(function (data, textStatus, jqXHR) {
				handleCourses(data);
			})
			.fail(function (jqXHR, textStatus, errorThrown) {
				alert('request was unsuccessful: ' + jqXHR.status);
			});
	}

	/* 创建分页器的构造函数 */
	function PageMod (num, type) {
		var pageMod = document.createElement('div');
		pageMod.className = 'm-page';
		var pgUp = document.createElement('a');
		pgUp.className = 'pg_up';
		pgUp.innerHTML = '&lt;';
		pgUp.change = 'up'
		pageMod.appendChild(pgUp);
		for (var i = 1; i <= num; i++) {
			var page = document.createElement('a');
			page.className = (i === 1) ? 'page selected' : 'page';
			page.innerText = i + '';
			page.change = i;
			pageMod.appendChild(page);
		}
		var pgDown = document.createElement('a');
		pgDown.className = 'pg_down';
		pgDown.innerHTML = '&gt;';
		pgDown.change = 'down';
		pageMod.appendChild(pgDown);
		content.appendChild(pageMod);
		this.pageMod = pageMod;
		this.type = type;
		this.num = num;
		this.index = 1;
		this.addEvent();
	}
	/* 为分页器添加切换上一页方法 */
	PageMod.prototype.pgUp = function () {
		var index = this.index;
		if ((index > 1) && (index <= this.num)) {
			var page = this.pageMod.getElementsByTagName('a')[index];
			$(page).removeClass('selected');
			this.index = index - 1;
			page = this.pageMod.getElementsByTagName('a')[this.index];
			$(page).addClass('selected');
			if (courses) {
				content.removeChild(courses);
				$(content).removeClass('courListed');
			}
			getCourses(this.index, 20, this.type);
		}
	};
	/* 为分页器添加切换下一页方法 */
	PageMod.prototype.pgDown = function () {
		var index = this.index;
		if ((index >= 1) && (index < this.num)) {
			var page = this.pageMod.getElementsByTagName('a')[index];
			$(page).removeClass('selected');
			this.index = index + 1;
			page = this.pageMod.getElementsByTagName('a')[this.index];
			$(page).addClass('selected');			
			if (courses) {
				content.removeChild(courses);
				$(content).removeClass('courListed');
			}
			getCourses(this.index, 20, this.type);
		}
	};
	/* 为分页器添加切换任意一页方法 */
	PageMod.prototype.pgChange = function (target) {
		var index = this.index;
		if ((index >= 1) && (index <= this.num)) {
			var page = this.pageMod.getElementsByTagName('a')[index];
			$(page).removeClass('selected');
			$(target).addClass('selected');
			this.index = target.change;
			if (courses) {
				content.removeChild(courses);
				$(content).removeClass('courListed');
			}
			getCourses(this.index, 20, this.type);
		}
	};
	/* 为分页器添加注册事件方法 */
	PageMod.prototype.addEvent = function () {
		var clickHandler = function (event) {
			var target = event.target;
			if (target === this.pageMod) return;
			var change = target.change;
			if (change === 'up') {
				this.pgUp();
			} else if (change === 'down') {
				this.pgDown();
			} else {
				this.pgChange(target);
			}
		}.bind(this);
		$(this.pageMod).click(clickHandler);
	};

	/* hotCour对象构造函数 */
	function HotCour (inforObj) {
		var hotCour = document.createElement('a');
		hotCour.className = 'm-hotCour';
		hotCour.title = inforObj.name;
		hotCour.hotCourObj = this;
		var img = document.createElement('img');
		img.className = 'avatar';
		img.style.backgroundImage = 'url(' + inforObj.smallPhotoUrl + ')';
		hotCour.appendChild(img);
		var infor = document.createElement('div');
		infor.className = 'infor';
		var name = document.createElement('h5');
		name.className = 'name';
		name.innerText = inforObj.name;
		var learner = document.createElement('span');
		learner.className = 'learnerCount';
		learner.innerText = inforObj.learnerCount;
		infor.appendChild(name);
		infor.appendChild(learner);
		hotCour.appendChild(infor);
		moveCont.appendChild(hotCour);
		this.hotCour = hotCour;
	}
	/* 处理获取热门推荐时返回的数据 */
	function handleHot (json) {		
		moveCont = document.createElement('div');
		moveCont.className = 'moveCont';
		moveCont.style.top = '0px';
		hotCourArr = JSON.parse(json);
		var len = hotCourArr.length;
		for (var i = 0; i < 10; i++) {
			new HotCour(hotCourArr[i]);
		}
		hotList.appendChild(moveCont);
		$(hotList).addClass('hotListed');
		/* 滚动热门课程 */
		var DURATION = 5000, 	// 热门课程停留时间5s
			INTERVAL = 10,		// 热门课程移动时间间隔10ms
			MOVETIME = 700,		// 热门课程移动时长700ms
			DISTANCE = 70;		// 每次滚动的距离为70px
		/* 开始滚动热门课程的函数 */
		var goMove = function (duration, interval, moveTime, distance) {
			var addCourse = function () {
				i = i % len;
				new HotCour(hotCourArr[i++]);
				moveCourse(duration, interval, moveTime, distance, function () {
					goMove(duration, interval, moveTime, distance);
				});
			};
			setTimeout(addCourse, duration);
		};
		goMove(DURATION, INTERVAL, MOVETIME, DISTANCE);
	}

	/* 为文档加载完添加事件 */
	$(function (event) {
		/* 处理顶部通知条 */
		var $notify = $('#notify');
		if ($.cookie('noAlert') === 'true') {
			$notify.remove();
		} else {
			var noAlert = function (event) {			
				$notify.remove();
				$.cookie('noAlert', 'true');
			};
			$notify.find(".no-alert").click(noAlert);
		}	

		/* 处理关注按钮及登录表单 */		
		$follow = $('#header .follow');
		if ($.cookie('followSuc') === 'true') {
			$follow.html('已关注' + '<a class="unfollow">取消</a>');
			$follow.addClass('followed');
			$follow[0].disabled = true; 
			var unfollowHandler = function (event) {
				$.removeCookie('followSuc');
				$follow.html('+ 关注');
				$follow.removeClass('followed');
				var enable = function () {
					$follow[0].disabled = false;
				};
				setTimeout(enable, 300);    
			};
			$follow.find('.unfollow').click(unfollowHandler);
		} else {
			var followHandler = function (event) {			
				if ($.cookie('loginSuc') === 'true'){
					followAPI();
				} else {
					creLoginMod(loginValidate);
				}			
			};		
			$follow.click(followHandler);
		}

		/* 轮播图片 */
		var $mSlides = $('.m-slides'),
			$banCont = $('.bannerCont', $mSlides),
			$banList = $('.banner', $mSlides),
			$shifCont = $('.shiftCont', $mSlides),
			$shifList = $('.shift', $shifCont);
		(function () {
			var PREV = 0,			// 前一张图片索引
				CURRENT = 0, 		// 当前图片索引
				NEXT = 1,			// 下一张图片索引
				NUM = 3, 			// 轮播图片数量
				DURATION = 5000, 	// 图片停留时间5s
				INTERVAL = 100,		// 图片淡入时间间隔100ms
				FADETIME = 500;		// 图片淡入时长500ms
			var counTime, timeoutId;
			/* 为每张图片添加zIndex */
			for (var i = 0; i < NUM; i++) {
				$banList[i].style.zIndex = NUM - i;
			}
			/* 切换轮播图片的函数 */
			var shiftPic = function (duration, interval, fadeTime) {
				PREV = CURRENT;
				CURRENT = NEXT;
				NEXT = (NEXT + 1) % NUM;
				$shifList.eq(PREV).removeClass('shifted');
				$shifList.eq(CURRENT).addClass('shifted');
				/* 遍历每张图片，改变图片的zIndex */
				$banList.each(function () {
					var zIndex = parseInt(this.style.zIndex);
					if (zIndex < NUM) {
						zIndex++;
					} else {
						zIndex = zIndex - NUM + 1;
					}
					this.style.zIndex = zIndex;
					this.style.opacity = 0;
				});
				fadIn($banList[CURRENT], interval, fadeTime, function () {
					   goPlay(duration, interval, fadeTime);	
				});
			}
			/* 开始轮播的函数 */
			var goPlay = function (duration, interval, fadeTime) {
				var num = 0,
					maxNum = duration/100;
				/* 该函数用于完成图片持续时间的计时 */
				counTime = function () {
					num++;
					if (num >= maxNum) {
						shiftPic(duration, interval, fadeTime);
					} else {
						timeoutId = setTimeout(counTime, 100);
					}				
				};
				timeoutId = setTimeout(counTime, 100);
			};			
			goPlay(DURATION, INTERVAL, FADETIME);
			/* 实现鼠标悬停于某图片，暂停切换 */
			$banCont.on('mouseenter', function (event) {
				clearTimeout(timeoutId);
			});
			$banCont.on('mouseleave', function (event) {
				timeoutId = setTimeout(counTime, 100);
			});
			/* 为切换图片的按钮添加点击事件 */
			var shifHandler = function (event) {
				var target = event.target;
				if (target === $shifCont[0]) return;
				var index = parseInt(target.dataset.index);
				if (index === CURRENT) return;
				clearTimeout(timeoutId);
				PREV = CURRENT;
				CURRENT = index;
				NEXT = (CURRENT + 1) % NUM;
				$shifList.eq(PREV).removeClass('shifted');
				$(target).addClass('shifted');
				$banList.eq(CURRENT).css({ zIndex: NUM + '', opacity: '0' });
				var num = NUM;
				/* 改变剩下图片的z-index值 */
				for (var i = NEXT; i != CURRENT; i = (i + 1) % NUM) {
					num--;
					$banList.eq(i).css({ zIndex: num + '', opacity: '0' });
				}
				fadIn($banList[CURRENT], INTERVAL, FADETIME, function () {
					   goPlay(DURATION, INTERVAL, FADETIME);	
				});
			};
			$shifCont.click(shifHandler);
		})();

		/* 获取课程列表 */
		content = $('#main #content')[0];
		getCourses(1, 20, type);

		/* 获取热门推荐 */
		hotList = $('#aside .hot_list')[0];
		$.get('http://study.163.com/webDev/hotcouresByCategory.htm')
			.done(function (data, textStatus, jqXHR) {
				handleHot(data);
			})
			.fail(function (jqXHR, textStatus, errorThrown) {
				alert('request was unsuccessful: ' + jqXHR.status);
			});	
		
		/* 为课程列表tab添加点击事件 */	
		var $courseTab = $('.courses_tab', content),
		    $desBtn = $('.design', $courseTab);
		$desBtn.addClass('choosed');
		$desBtn[0].chosFlag = true;			// chosFlag为课程tab的选中属性
		var chooseHandler = function (event) {
			var target = event.target;
			if (target.chosFlag === true) return;
			tabChange = true;
			var tabList = $courseTab[0].getElementsByTagName('button');
			for (var i = 0; i < tabList.length; i++) {
				var tab = tabList[i];
				if (tab === target) continue;
				if (tab.chosFlag === true) {
					$(tab).removeClass('choosed');
					tab.chosFlag = false;
					break;
				}
			}
			$(target).addClass('choosed');
			target.chosFlag = true;	
		    type = parseInt(target.id);
			if (courses) {
				content.removeChild(courses);
				$('.m-page', content).remove();
				$(content).removeClass('courListed');
			}
			getCourses(1, 20, type);
		};
		$courseTab.click(chooseHandler);

		/* 为机构介绍视频添加点击事件 */
		var $videoPlay = $('#aside .intro_video .play');
		var playHandler = function (event) {
			creVideoMod();
		};
		$videoPlay.click(playHandler);
	});
})();





