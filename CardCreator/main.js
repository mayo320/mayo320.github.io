var data = [];
var current_index = 0;
var outfile_name = '';
var unit_names_regex = '';

function init() {
	data = parseCsv();
	createUnitList();
	loadUnit(data.length-1);
	setChitButtons();
	setChit('Poison');
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

	var html = element.innerHTML.trim();

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

			document.getElementById('a4').appendChild(destCanvas);
		}
	});
}

function exportCard(element) {
	// Draw element on canvas
	var html = element.innerHTML.trim();

	html2canvas(element, {
		useCORS: true,
		width: element.clientWidth,
		height: element.clientHeight,
		scale: 1
	}).then(function (canvas) {
		document.body.appendChild(canvas);

		var img = canvas.toDataURL('image/png');
		var link = document.createElement('a');
		link.href = img;
		link.download = outfile_name;
		link.style.display = 'none';
		link.click();
	});
}

function parseCsv() {
	var lines = CSV_DATA.split('\n')
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
		return `${st} ?(\\d+|\\+)?`
	}

	// Regex, class, icon?
	var matches = [
		['(tactic|act|defend|defeat)', 'action'],
		['((?:\\d+/)?\\d* ?HP)', 'HP'],
		['melee()', 'melee'],
		['any rng (\\d+)', 'rng', 'any.png'],
		['far rng (\\d+)', 'rng', 'far.png'],
		['rng (\\d+)', 'rng', 'overhead.png'],
		['aoe ([RC\\d+])?', 'aoe', 'platform.png'],
		['ATK (\\d+|X\\+R|X|R)?', 'atk', 'a_t_k_.png'],
		['\\+?(?:\\d+ )?def (\\d+)', 'def', 'shield.png'],
		['(\\d+ )?true (?:damage|dmg)', 'true-dmg', 'open-wound.png'],
		['(ADV)', 'adv', 'dice.png'],
		['(\\+?SPD ?\\d+)', 'spd'],
		['IMM( .*)(?:;|\n<br>)?', 'immunity'], // imm should be above statuses
		['resist( .*);?', 'resist'], // imm should be above statuses
		['heal (\\d+)?', 'heal', 'heart-plus.png'],
		['cleanse (\\d+)?', 'cleanse', 'sparkles.png'],
		[status_re('empower(?:ed)?'), 'empower buff', 'sword-brandish.png'],
		[status_re('fortif(?:y|ied)'), 'fortify buff', 'armor-upgrade.png'],
		['((?:all|any) debuffs?)', 'all-debuffs'],
		[status_re('poison(?:ed)?'), 'poison debuff'],
		[status_re('burnt?'), 'burn debuff'],
		[status_re('stun(?:ned)?'), 'stun debuff'],
		[status_re('chill(?:ed)?'), 'chill debuff'],
		[status_re('shock(?:ed)?'), 'shock debuff'],
		['(revives?)', 'revive'],
		['(persistent)', 'persistent', 'infinity.png'],
		['(once):?', 'once'],
		[status_re('stealth(?:ed)?'), 'stealth', 'hood.png'],
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
		['draw (\\d+X?) cards?', 'draw-card', 'card-draw.png'],
		['discard (\\d+|X)(?: cards?)?', 'discard-card', 'card-discard.png'],
		['(trash)', 'trash', 'card-trash.png'],
		['(spawn|summon)', 'action'],
		['(\\d+|R)(?:VP)', 'vp'],
		['(\\d+ap)', 'ap'],
		['(-\\d+G)', 'no-g'], // above G
		['(\\d+)(?:G)', 'g'],
		['gold( )', 'g'],
		[' (RP |AP )', 'rp'],
		['(\\w+ Phase)', 'phase'],
		['(free(?: \\d+| self)?)', 'free'],
		['(self)', 'target', 'human-target.png'],
		['reflect()', 'reflect', 'shield-reflect.png'],
		['(R1)', 'unit-rank', 'rank-1.png'],
		['(R2)', 'unit-rank', 'rank-2.png'],
		['(R3)', 'unit-rank', 'rank-3.png'],
		['trigger()', 'trigger', 'orb-direction.png'],
		['rounded down()', 'round-down', 'save-arrow.png'],
		['(move)', 'move', 'move.png'],
		['\\[(\\w+)\\]', 'skill'],
		['(swap)', 'swap', 'card-exchange.png'],
		[unit_names_regex, 'unit-name', 'ace.png']
	];
	text = text.replaceAll(';', '\n<br>');

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

	text += `<span class="score-tooltip">
		<span class="subtext" style="color: white">Note: values are estimated</span> <br>
		${base_score_ui}</span>`;
	return text;
}

function createUnitList() {
	unit_names_regex = `(${data.map((u)=>u['Name']).join('|')})`;
	console.log(unit_names_regex);

	var cont = document.querySelector('#card-list');
	var html = ''
	for (let i in data) {
		calculateUnitScores(i);
		var unit = data[i];
		html += `
			<button class="c${unit['Level']} c${unit['Faction']} c${unit['Rank']}" onclick="loadUnit(${i})">
				<span class="subtext">${i}:</span>
				${unit['Name']}
				<span class="subtext">(${unit['score-Total']})</span>
			</button>
		`;
	}
	cont.innerHTML = html;
}

function loadUnit(index) {
	if (index >= data.length) {
		index = 0;
	} else if (index < 0) {
		index = data.length - 1;
	}

	current_index = index;
	var unit = data[index];
	constructScoreUi(unit);
	outfile_name = unit['Name'] + '[face,'+unit['Count']+']'
	for (let k in unit) {
		// Mutate images
		var imgs = document.querySelectorAll('.img-' + k);
		imgs.forEach((ele) => {
			ele.src = unit[k];
		});

		// Mutate texts
		var texts = document.querySelectorAll('.text-' + k);
		texts.forEach((ele) => {
			if (ele.classList.contains('process')) {
				ele.innerHTML = processAct(unit, k);
			} else {
				ele.innerHTML = unit[k];
			}
		});

		// Mutate classes
		var classes = document.querySelectorAll('.class-' + k);
		classes.forEach((ele) => {
			original = ele.attributes['_class']
			if (original === undefined) {
				original = ele.classList.toString()
				ele.attributes['_class'] = original
			}
			ele.classList = original + ` c${unit[k]} ${unit[k]}`
		});

		// If exists
		var ifs = document.querySelectorAll('.if-' + k);
		ifs.forEach((ele) => {
			if (unit[k] !== undefined && unit[k].length > 0) {
				ele.classList.remove('hidden');
			} else {
				ele.classList.add('hidden');
			}
		});

	}
}

window.onload = function(){
	init();

	const data = getUriParam('csv');
	if (data) {
		loadCsvFromData(getUriParam('csv'));	
	}
	else {
		loadCsvFromData(CSV_ENCODED_DATA);
	}

	// Arrow keys to navigate
	document.onkeydown = (e) => {
	  e = e || window.event;
	  if (e.keyCode === 38) {
	    loadUnit(current_index - 1);
	  } else if (e.keyCode === 40) {
	    loadUnit(current_index + 1);
	  } else if (e.keyCode === 37) {
	    loadUnit(current_index - 1);
	  } else if (e.keyCode === 39) {
	    loadUnit(current_index + 1);
	  }
	}
}

function download() {
	document.querySelector('#card-cont').classList.remove('compress');
	document.querySelector('#overlay').classList.add('hidden');
	exportCard(document.getElementById('card-cont'))
	document.querySelector('#overlay').classList.remove('hidden');
}

function bulkExport() {
	document.querySelector('#card-cont').classList.remove('compress');
	current_index = -1;

	function exportUnit() {
		current_index += 1;
		console.log('Exporting ' + current_index);
		loadUnit(current_index);
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
	current_index -= 1;

	function exportUnitA4() {
		current_index += 1;
		loadUnit(current_index);

		var unit = data[current_index];
		var count = Number(unit['Count']);

		if (a4_count + count > 9) {
			// export paper
			outfile_name = `a4-${current_index - 1}`;
			exportCard(document.getElementById('a4'));

			current_index -= 1;
			setTimeout(() => {
				a4_count = 0;
				document.getElementById('a4').innerHTML = '';
				exportUnitA4();
			}, 1300);
		} else {
			setTimeout(() => {
				document.querySelector('#overlay').classList.add('hidden');
				exportCardAddA4(document.getElementById('card-cont'), count);
			}, 300);

			a4_count += count;

			if (current_index < data.length - 1) {
				setTimeout(() => {
					exportUnitA4();
				}, 1300);
			} else {
				// export last paper
				setTimeout(() => {
					// Instructions front
					document.querySelector('#instructions').classList.remove('hidden');
					exportCardAddA4(document.getElementById('card-cont'), 2);

					// Instructions back
					setTimeout(() => {
						document.querySelector('#instructions2').classList.remove('hidden');
						exportCardAddA4(document.getElementById('card-cont'), 2);
					}, 300);

					setTimeout(() => {
						outfile_name = `a4-${current_index}`;
						exportCard(document.getElementById('a4'));
					}, 1300);
				}, 1300);
			}
		}

	}

	exportUnitA4();
}


// CHIT
var current_chit = '';
function setChit(name) {
	var data = CHIT_DATA[name];
	var chit = document.querySelector('.chit');
	var html = `<span class="${name.toLowerCase()}"><span class="emoji">&#x${data[1]};</span>`;
	html += `<div class="text">${name}</div>`;
	if (data[2]) {
		html += `<div class="subtext">${data[2]}</div>`;
	}
	// html += `<div class="icons">`
	// for (let i in data[3]) {
	// 	html += `<i class="material-icons">${data[3][i]}</i><br>`;
	// }
	// html += `</div>`
	html += '</span>';
	chit.innerHTML = html;
	current_chit = name;
}
function setChitButtons() {
	var cont = document.querySelector('#chit-btns');
	var html = '';
	for (k in CHIT_DATA) {
		html += `<button onclick="setChit('${k}')">${k} (${CHIT_DATA[k][0]})</button><br>`;
	}
	cont.innerHTML = html;
}

var CHIT_SIZE = 300
function exportChit(element) {
	var overlay = document.querySelector('#chit-overlay');
	overlay.classList.add('hidden');

	// Draw element on canvas
	var html = element.innerHTML.trim();

	html2canvas(element, {
		useCORS: true,
		width: CHIT_SIZE,
		height: CHIT_SIZE,
		scale: 1
	}).then(function (canvas) {
		// document.body.appendChild(canvas);

		var img = canvas.toDataURL('image/png');
		var link = document.createElement('a');
		link.href = img;
		link.style.display = 'none';
		link.download = current_chit + '[all,'+CHIT_DATA[current_chit][0]+']';
		link.click();

		overlay.classList.remove('hidden');
	});
}

function toggleCreator(pg) {
	document.querySelectorAll('.creator').forEach((x) => x.classList.add('hidden'));
	document.querySelector(pg).classList.remove('hidden');
	init();
}

function hideViews() {
	document.querySelectorAll('.view').forEach((x) => x.classList.add('hidden'));
}

// Potential list of emojis https://www.unicode.org/emoji/charts/full-emoji-list.html
// U+1F5E3
// U+1F464
// U+1F465