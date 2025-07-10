var current_index = 0;
var outfile_name = '';
var unit_names_regex = '';
var cur_view_index = 0;
var data = jen_data;

function switchData(d) {
	hideViews();
	data = d;
	init();
	setTimeout(() => {
		showView(document.querySelector(`button[view="${data[0].key}"]`));
	}, 200);
}

async function init() {
	var views_btn_html = '';
	for (i in data) {
		if ('encoded_data' in data[i]) {
			data[i]['decoded_data'] = parseCsv(await loadCsvFromData(data[i]['encoded_data']));
		}

		views_btn_html += `
			<button view='${data[i].key}' onclick="showView(this); createCardList('${i}');">${data[i].name}</button>
		`
	}

	document.querySelector('#views-container').innerHTML = views_btn_html;
	
	createCardList(0);
	loadCard(0);

	unit_names_regex = `(${data[0].decoded_data.map((u)=>u['Name']).join('|')})`;
}

function exportCardAddA4(element, count) {
	// Draw element on canvas
	var svgElements = element.querySelectorAll('svg');
	svgElements.forEach(function(item) {
	    item.setAttribute("width", item.getBoundingClientRect().width);
	    item.setAttribute("height", item.getBoundingClientRect().height);
	    item.style.width = null;
	    item.style.height= null;
	});

	const addCorner = function(el, dir) {
		var corner = document.createElement('div');
		corner.classList = 'corner ' + dir;
		el.appendChild(corner);
	}

	html2canvas(element, {
		useCORS: true,
		width: element.clientWidth,
		height: element.clientHeight,
		scale: 1,
		allowTaint : true,
	    useCors : true
	}).then(function (canvas) {
		for (var i = 0; i < count; i++) {
			var destCanvas = document.createElement('canvas');
			destCanvas.width = canvas.width;
			destCanvas.height = canvas.height;
			var dest = destCanvas.getContext('2d');
			dest.drawImage(canvas, 0, 0);

			var destDiv = document.createElement('div');
			destDiv.classList = 'container';
			destDiv.width = canvas.width;
			destDiv.height = canvas.height;
			addCorner(destDiv, 'top left');
			addCorner(destDiv, 'top right');
			addCorner(destDiv, 'bottom left');
			addCorner(destDiv, 'bottom right');

			destDiv.appendChild(destCanvas);
			document.getElementById('a4').appendChild(destDiv);
		}
	});
}

function exportCard(element) {
	// Draw element on canvas
	html2canvas(element, {
		useCORS: true,
		width: element.clientWidth,
		height: element.clientHeight,
		scale: 1,
		allowTaint : true,
	    useCors : true
	}).then(function (canvas) {
		document.body.appendChild(canvas);
		console.log(canvas);

		var img = canvas.toDataURL('image/png');
		var link = document.createElement('a');
		link.href = img;
		link.download = outfile_name;
		link.style.display = 'none';
		link.click();
	});
}

function parseCsv(in_data) {
	var lines = in_data.split('\n')
		.map(x => x.trim())
		.filter(x => x.length > 0);
	
	var headers = lines[0].split("\t");
	var ret = [];
	for (let i = 1; i < lines.length; ++i) {
		var cols = lines[i].split('\t');
		var d = {};
		for (let j = 0; j < headers.length; ++j) {
			d[headers[j].replace(' ', '_')] = cols[j];
		}
		ret.push(d);
	}
	return ret;
}

function processAct(unit, key) {
	var text = unit[key];
	if (text === undefined || text.length === 0) {
		return '';
	}

	var status_re = (st) => {
		return `${st} ?(\\d+|\\+|X)?`
	}

	// Regex, class, icon?
	var matches = [
		['(tactic|act|defend|defeat)', 'action'],
		['((?:\\d+ |full |current )?)HP', 'HP'],
		['melee()', 'melee'],
		['any rng (\\d+|X)', 'rng', 'any.png'],
		['far rng (\\d+|X)', 'rng', 'far.png'],
		['rng (\\d+|X)', 'rng', 'overhead.png'],
		['aoe ([XRC\\d+])?', 'aoe', 'platform.png'],
		['ATK (\\d+|X\\+R|X|R)?', 'atk', 'a_t_k_.png'],
		['\\+?(?:\\d+ )?def (\\d+|X)?', 'def', 'shield.png'],
		['(\\d+ |X )?true (?:damage|dmg)', 'true-dmg', 'open-wound.png'],
		['(ADV)', 'adv', 'dice.png'],
		['(\\+?SPD ?\\d+)', 'spd'],
		['IMM( .*)(?:;|\n<br>)?', 'immunity'], // imm should be above statuses
		['resist( .*)(?:;|\n<br>)?', 'resist'], // imm should be above statuses
		[status_re('heal'), 'heal', 'heart-plus.png'],
		[status_re('cleanse'), 'cleanse', 'sparkles.png'],
		[status_re('empower(?:ed)?'), 'empower buff', 'sword-brandish.png'],
		[status_re('fortif(?:y|ied)'), 'fortify buff', 'armor-upgrade.png'],
		['((?:all|any) debuffs?)', 'all-debuffs'],
		[status_re('poison(?:ed)?'), 'poison debuff'],
		[status_re('burnt?'), 'burn debuff'],
		[status_re('stun(?:ned)?'), 'stun debuff'],
		[status_re('chill(?:ed)?'), 'chill debuff'],
		[status_re('shock(?:ed)?'), 'shock debuff'],
		[status_re('some_debuff'), 'some_debuff debuff'],
		['(revives?)', 'revive'],
		['(persistent)', 'persistent', 'infinity.png'],
		['(once(?: / (?:round|turn))?)', 'once'],
		[status_re('stealth(?:ed)?'), 'stealth buff', 'hood.png'],
		[status_re('reveal(?:ed)?'), 'reveal', 'eye-target.png'],
		['(nullify)', 'nullify'],
		['(FOG OF WAR)', 'fog-of-war'],
		['(killing blow)', 'killing-blow', 'william-tell-skull.png'],
		[status_re('charm(?:ed)?'), 'charm debuff'],
		['(chaos)', 'chaos ctext'],
		['(order)', 'order ctext'],
		['(construct)', 'construct ctext'],
		['(celestial)', 'celestial ctext'],
		['(nature)', 'nature ctext'],
		[' (warriors?|mages?|rogues?|rangers?|supports?)', 'unit-class'],
		['(\\+\\d+ hand limit)', 'hand-limit', 'up-card.png'],
		['draw (\\d+X?|X) cards?', 'draw-card', 'card-draw.png'],
		['discard (\\d+|X)(?: cards?)?', 'discard-card', 'card-discard.png'],
		['(trash(?:ed)?)', 'trash', 'card-trash.png'],
		['(spawn|summon)', 'action'],
		['(\\d+)(?:VP)', 'vp'],
		['(R)ank(?:VP)', 'vp'],
		['(\\d+ap)', 'ap'],
		['(-\\d+G)', 'no-g'], // above G
		['(\\d+)(?:G)', 'g'],
		['(R)ank(?:G)', 'g'],
		['gold( )', 'g'],
		['(\\+?(?:\\d+)?RP)', 'rp'],
		['(\\w+ Phase(?: start| end)?)', 'phase'],
		['(on unlock)', 'phase'],
		['(free(?: \\d+| self)?)', 'free'],
		['(self)', 'target', 'human-target.png'],
		['reflect()', 'reflect', 'shield-reflect.png'],
		['(R1)', 'unit-rank', 'rank-1.png'],
		['(R2)', 'unit-rank', 'rank-2.png'],
		['(R3)', 'unit-rank', 'rank-3.png'],
		['(R4)', 'unit-rank', 'rank-4.png'],
		['trigger ()', 'trigger', 'orb-direction.png'],
		['rounded down()', 'round-down', 'save-arrow.png'],
		['(move)', 'move', 'move.png'],
		['\\[(\\w+)\\]', 'skill'],
		['(swap)', 'swap', 'card-exchange.png'],
		['(\\(max \\d+\\))', 'max-x'],
		[unit_names_regex, 'unit-name', 'ace.png']
	];
	text = text.replaceAll(';', '\n<br>');

	matches.forEach((pattern) => {
		var regex = RegExp(pattern[0], 'gi');
		icon = pattern.length > 2 ? `<img class="icon" src="assets/icons/${pattern[2]}"/>` : '';
		text = text.replace(regex, 
			`<span class="sp ${pattern[1].toLowerCase()}">` +
				icon +
				`<span class='value'>$1</span>` +
			`</span>`); 
		text = text.replace("<span class='value'></span>", "");
	});
	text = text.replaceAll("???", "");


	const should_score = 'base_scores' in unit;
	if (should_score) {
		var base_score_ui = '';
		const base_scores = unit['base_scores'][key];
		base_scores.forEach((score) => {
			if (text.match(score[0]) || score[0].match('_')) {
				base_score_ui += `<div class="score-item ${score[0].toLowerCase()}">
					<span class="score-text">${score[0]}</span>
					<span class="score-value">${score[1].toFixed(2)}</span>
				</div>`;
			}
		});
		
		text += `<span class="score-tooltip">
			<span class="subtext" style="color: white">Note: values are estimated</span> <br>
			${base_score_ui}</span>`;
	}

	return text;
}

function processJennifer(card, key) {
	var text = card[key];
	if (key === 'Tags') {
		var tags = text.split(',').map(tag => tag.trim());
		var collator = new Intl.Collator('zh-CN', { sensitivity: 'base' });

		tags.sort((a, b) => {
			// 1. 优先按字数排序 (从小到大)
			if (a.length !== b.length) {
				return a.length - b.length;
			}
			// 2. 如果字数相同，则按拼音排序
			return collator.compare(a, b);
		});

		var html = '';
		for (var i = 0; i < tags.length; i++) { 
			html += `<div class="tag">${tags[i]}</div><br>`;
		}
		return html
	}
	else if (key == 'Skill') {
		var parts = text.split('-');

		// parse [入场]
		let firstSpaceIndex = parts[0].indexOf(' ')
		let keyword = parts[0].substring(0, firstSpaceIndex);
		let restOfString = parts[0].substring(firstSpaceIndex + 1); 
		let newPart0  = `[${keyword}] ${restOfString}`;

		html = `
			<div class="skill-name">
				<div>${newPart0}</div>
				<div class="sep">
					<span>&#x2726;</span>
				</div>
			</div>
			<div>${parts[1]}</div>
		`;
			
		return html;
	}
	else if (key === 'Name'){
		html = text.replace(/\s*\(.*\)/, ""); 
		return html;
	}
	else if (key.includes('Combo')) {
        const match = String(text || '').trim().match(/^(.*?)\s*\((\d+)\)\s*$/);

        let word = String(text || '').trim(); 
        let count = ''; 

        if (match && match[1] && match[2]) {
            word = match[1].trim(); // Extract the word part before (count)
            count = match[2].trim(); // Extract the number part
        }

		            html = `<span class="word-text">${word}</span>` + `<span class="count">${count}</span>`;

        return html; 
    }
	else if (key === 'Studio') {
		return text[0];
	}
	return text;
}

function createCardList(item_index) {
	const item = data[item_index];
	cur_view_index = item_index;
	current_index = 0;

	var cont = document.querySelector('#card-list');
	var html = ''
	for (let i in item.decoded_data) {
		var unit = item.decoded_data[i];
		if (item.key === 'card') {calculateUnitScores(unit);}
		
		var score_html = ('score-Total' in unit) ? `<span class="subtext">(${unit['score-Total']})</span>` : ``;
		html += `
			<button class="c${unit['Level']} c${unit['Faction']} c${unit['Rank']}" onclick="loadCard(${i})">
				<span class="subtext">${i}:</span>
				${unit['Name']}
				${score_html}
			</button>
		`;
	}
	cont.innerHTML = html;

	const card_cont = document.querySelector('#card-cont');
	if (card_cont.attributes['_class'] === undefined) {
		card_cont.attributes['_class'] = card_cont.classList.toString();
	}
	card_cont.classList = card_cont.attributes['_class'];
	card_cont.classList.add(item.overlay);
	loadCard(current_index);
}


function updateIndex(index, gen_data) {
	if (index >= gen_data.length) {
		index = 0;
	} else if (index < 0) {
		index = gen_data.length - 1;
	}
	current_index = index;
	return index;
}

function loadRowGeneric(gen_data) {
	for (let k in gen_data) {
		// Mutate images
		var imgs = document.querySelectorAll('.img-' + k);
		imgs.forEach((ele) => {
			ele.src = gen_data[k];
		});

		// Mutate texts
		var texts = document.querySelectorAll('.text-' + k);
		texts.forEach((ele) => {
			if (ele.classList.contains('process')) {
				ele.innerHTML = processAct(gen_data, k);
			} if (ele.classList.contains('processJen')) {
				ele.innerHTML = processJennifer(gen_data, k);
			} else {
				ele.innerHTML = gen_data[k];
			}
		});

		// Mutate classes
		var classes = document.querySelectorAll('.class-' + k);
		classes.forEach((ele) => {
			_class = ele.attributes['_class'];
			if (_class === undefined) {
				_class = {
					'original': ele.classList.toString()
				};
			}
			_class[k] = ` c${gen_data[k]} ${gen_data[k]}`;
			ele.attributes['_class'] = _class;

			ele.classList = '';
			for (c in _class) {
				ele.classList += ' ' + _class[c];
			}
		});

		// If exists
		var ifs = document.querySelectorAll('.if-' + k);
		ifs.forEach((ele) => {
			if (gen_data[k] !== undefined && gen_data[k].length > 0) {
				show(ele);
			} else {
				hide(ele);
			}
		});

	}
}

function loadCard(index) {
	var item = data[cur_view_index];
	index = updateIndex(index, item.decoded_data);
	const data_entry = item.decoded_data[index];
	outfile_name = data_entry['Name'] + '[face,'+data_entry['Count']+']';
	loadRowGeneric(data_entry);
	return data_entry;
}

window.onload = async function(){
	await init();

	// Arrow keys to navigate
	document.onkeydown = (e) => {
	  e = e || window.event;
	  if (e.keyCode === 38) {
	    loadCard(current_index - 1);
	  } else if (e.keyCode === 40) {
	    loadCard(current_index + 1);
	  } else if (e.keyCode === 37) {
	    loadCard(current_index - 1);
	  } else if (e.keyCode === 39) {
	    loadCard(current_index + 1);
	  }
	}

	document.querySelector(`.buttons-cont button[view="${data[0].key}"]`).click();
	toggleCreator('#card-creator');
}

function download() {
	document.querySelector('#card-cont').classList.remove('compress');
	document.querySelector('.proof-overlay').classList.add('hidden');
	exportCard(document.getElementById('card-cont'))
	document.querySelector('.proof-overlay').classList.remove('hidden');
}

function bulkExport() {
	document.querySelector('#card-cont').classList.remove('compress');
	current_index = -1;

	function exportUnit() {
		current_index += 1;
		console.log('Exporting ' + current_index);
		loadCard(current_index);
		setTimeout(() => {
			download();
		}, 300);

		if (current_index < data.length - 1) {
			setTimeout(() => {
				exportUnit();
			}, 1300);
		}
	}

	exportUnit();
}

var a4_count = 0
function exportA4() {
	document.getElementById('a4').innerHTML = '';
	current_index -= 1;
	const item = data[cur_view_index];
	const cards_per_page = item.cards_per_page || 9;
	var max_index = item.decoded_data.length;

	function exportUnitA4() {
		current_index += 1;
		var card = loadCard(current_index);
		var count = Number(card['Count']);

		if (a4_count + count > cards_per_page) {
			// export paper
			outfile_name = `a4-${item.key}-${current_index - 1}`;
			exportCard(document.getElementById('a4'));

			current_index -= 1;
			setTimeout(() => {
				a4_count = 0;
				document.getElementById('a4').innerHTML = '';
				exportUnitA4();
			}, 1300);
		} else {
			setTimeout(() => {
				document.querySelector('.proof-overlay').classList.add('hidden');
				exportCardAddA4(document.getElementById('card-cont'), count);
			}, 300);

			a4_count += count;

			if (current_index < max_index - 1) {
				setTimeout(() => {
					exportUnitA4();
				}, 1300);
			} else if (item.key === 'card') {
				// export last paper
				setTimeout(() => {
					// Instructions front
					document.querySelector('button[view="instructions"]').click();
					exportCardAddA4(document.getElementById('card-cont'), 2);

					// Instructions back
					setTimeout(() => {
						document.querySelector('button[view="instructions2"]').click();
						exportCardAddA4(document.getElementById('card-cont'), 2);
					}, 500);

					setTimeout(() => {
						outfile_name = `a4-${item.key}-${current_index}`;
						exportCard(document.getElementById('a4'));
					}, 1300);
				}, 1300);
			} else {
				setTimeout(() => {
					outfile_name = `a4-${item.key}-${current_index}`;
					exportCard(document.getElementById('a4'));
				}, 1300);
			}
		}

	}

	exportUnitA4();
}


function toggleCreator(pg) {
	document.querySelectorAll('.creator').forEach((x) => hide(x));
	show(document.querySelector(pg));
	init();
}

function hideViews() {
	document.querySelectorAll('.view').forEach((x) => hide(x));
}

function showView(el) {
	view = el.attributes['view'];
	hideViews();
	show(document.querySelector('#' + view.value));

	document.querySelectorAll('.buttons-cont button').forEach((x) => x.classList.remove('selected'));
	el.classList.add('selected');
}

function hide(el) {
	if (el.attributes['_display'] === undefined) {
		el.attributes['_display'] = el.style.display;
	}
	el.style.display = 'none';
}
function show(el) {
	el.style.display = el.attributes['_display'] === 'none' ? 'block': el.attributes['_display'];
}
function toggleOverlays() {
	
}

function genCardStats() {
	const class_dis = {};
	const item = data.find((x) => x.key === 'card');
	for (k in item.decoded_data) {
		const unit = item.decoded_data[k];
		const cls = unit['Class'];
		const cnt = unit['Count'];
		const rnk = unit['Rank'] - 1;

		if (!(`cls-${cls}` in class_dis)) {
			class_dis[`cls-${cls}`] = 0;
			class_dis[`cnt-${cls}`] = 0;
			class_dis[`rnk-${cls}`] = [0,0,0,0];
		}
		
		class_dis[`cls-${cls}`]++;
		class_dis[`cnt-${cls}`] += Number(cnt);
		class_dis[`rnk-${cls}`][rnk] += Number(cnt);
	}
	loadRowGeneric({
		...class_dis
	});
}

