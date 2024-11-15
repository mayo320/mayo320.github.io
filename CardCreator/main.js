var data = [];
var current_index = 0;
var outfile_name = '';


function init() {
	data = parseCsv();
	createUnitList();
	loadUnit(0);
	setChitButtons();
	setChit('Poison');
}

function exportCardAddA4(element, count) {
	// Draw element on canvas
	var html = element.innerHTML.trim();

	html2canvas(element, {
		useCORS: true,
		width: element.clientWidth,
		height: element.clientHeight,
		scale: 1
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

function calculateUnitScores(index) {
	var unit = data[index];
	var scores = {};
	var score_total = 0;

	const calcAct = (key) => {
		if (!unit[key]) {
			return;
		}
		var score = calculateActScore(unit[key], unit, false);
		var tag = score[1];
		if (!(tag in scores)) {
			scores[tag] = 0;
		}
		scores[tag] += score[0];
		unit[`score-${key}`] = score[0].toFixed(2);

		score_total += score[0];
	}

	calcAct('Tactic');
	calcAct('Deploy');
	calcAct('Act');
	calcAct('Defend');
	calcAct('Defeat');
	calcAct('Win');

	for (let i in scores) {
		unit[`score-${i}`] = scores[i].toFixed(2);
	}
	unit['score-BST'] = calculateStatScore(unit['HP'], unit['DEF'], unit['SPD'], unit['Cost']).toFixed(2);

	score_total += Number(unit['score-BST']);
	unit['score-Total'] = Math.round(score_total);
}

function calculateStatScore(hp, def, spd, cost) {
	var score = 0;
	score += (Number(hp) * (1 + (Number(def) / 4))) * 1.3;
	score += (Number(spd));
	score -= Number(cost) * 1.2;
	return score;
}

function calculateActScore(text, unit, print) {
	if (text === undefined || text.length === 0) {
		return 0;
	}
	var min = Math.min;
	// Order matters, top ones are calculated first
	// Format of [regex, accumulator]
	var part_matches = [
		// General
		[/(\d+)VP/gi, (v) => `+${v}`, 'resource'],
		[/([+-]?\d+)G/gi, (v) => `+${v}`, 'resource'],
		[/max (\d+)G/gi, (v) => `*${v * 0.5}`], // w/a for gaining gold as Act
		[/Steal.*G/gi, (v) => `*2`], // w/a for stealing gold
		[/Foe gain/gi, (v) => `*-1`], // w/a for giving opponent gold
		// Attacks & RNG
		[/ATK (\d+)/gi, (v) => `+${v}`, 'offense'],
		[/DEF (\d+)/gi, (v) => `+${v}`, 'defese'],
		[/(\d+) True (?:dmg|damage)/gi, (v) => `+${2 * v}`, 'offense'],
		[/Melee/gi, (v) => `*1`],
		[/RNG (\d+)/gi, (v) => `+${(min(v, 3) - 1) * 0.8}`],
		[/ADV/gi, (v) => `*1.25`],
		// Targetting
		[/RNG (\d+) FAR/gi, (v) => `+1`],
		[/RNG (\d+) ANY/gi, (v) => `+2.5`],
		// Supports
		[/heal ?(\d+)?/gi, (v) => `+${(v || 1) * 0.7}`, 'support'],
		[/cleanse ?(\d+)?/gi, (v) => `+${(v || 1) * 0.7}`, 'support'],
		// Statuses
		[/poison ?(\d+)?/gi, (v) => `+${v || 1}`, 'dot'],
		[/burn ?(\d+)?/gi, (v) => `+${v || 1}`, 'dot'],
		[/chill ?(\d+)?/gi, (v) => `+${v || 1}`, 'debuff'],
		[/shock ?(\d+)?/gi, (v) => `+${v || 1}`, 'debuff'],
		[/charm ?(\d+)?/gi, (v) => `+${(v || 1) * 1.5}`, 'debuff'],
		[/stun/gi, (v) => `+2`, 'debuff'],
		[/self (?:poison|burn|chill|shock|charm|stun)/gi, (v) => `*0.2`], // w/a for self inflicting debuffs
		[/empower ?(\d+)?/gi, (v) => `+${(v || 1) * 1.5}`, 'buff'],
		[/fortify ?(\d+)?/gi, (v) => `+${(v || 1) * 1.5}`, 'buff'],
		[/(any debuff)s?/gi, (v) => `+3`],
		[/(all debuff)s?/gi, (v) => `+6`],
		[/immune/gi, (v) => `*1`, 'defese'],
		[/resist/gi, (v) => `*0.75`, 'defese'],
		[/reveal ?(\d+)?/gi, (v) => `+${v || 1}`, 'offense'],
		[/stealth ?(\d+)?/gi, (v) => `+${(v || 1) * 1.5}`, 'defense'],
		[/fog of war/gi, (v) => `+3`, 'defense'],
		[/free (\d+)?(?:self)?/gi, (v) => `+${(v || 1) * 5}`, 'utility'],
		[/nullify/gi, (v) => `+3`, 'defense'],
		[/transfer debuffs/gi, (v) => `+1.3`, 'debuff'],
		[/spawn.*(\d+) HP/gi, (v) => `+${v}`, 'defense'],
		[/revive.*(\d+) HP/gi, (v) => `+${v + 1}`, 'defense'],
		[/revive.*full HP/gi, (v) => `+6`, 'defense'],
		// Cards
		[/draw (\d+) cards?/gi, (v) => `+${v * 2}`, 'utility'],
		[/discard (\d+) cards?/gi, (v) => `-${v}`],
		// Other
		[/takes (\d+) damage at most per attack.*/gi, (v) => `+${(6 / (v + 2) * unit['HP'])}`, 'defense'],
		[/(perform|trigger).*(act|defend)/gi, (v) => `+4`, 'utility'],
		// Conditional
		[/(on deploy)/gi, (v) => `*1.9`],
		[/(after.*act)/gi, (v) => `*2.5`],
		[/(before.*act)/gi, (v) => `*2.5`],
		[/(reflect)/gi, (v) => `*0.75`],
		[/against (?:melee) attack/gi, (v) => `*0.75`],
		[/(if|when).*:.*/gi, (v) => `*0.65`],
		[/(may).*/gi, (v) => `*1.2`],
		[/per.*ally/gi, (v) => `*1.5`],
		[/per (poison|burn|chill|shock|charm|empower|fortify)/gi, (v) => `*1.5`],
		[/once.*/gi, (v) => `*0.75`],
		[/persistent.*/gi, (v) => `*1.4`],
		[/(X = current HP|per current HP)/gi, (v) => `*${unit['HP'] / 2}`],
		// Faction/position restricted
		[/(chaos|celestial|nature|construct|order)/gi, (v) => `*0.7`],
		[/(vanguard)/gi, (v) => `*0.7`],
		[/ or /gi, (v) => `*2`],
		[/(L1 )/gi, (v) => `*0.5`],
		[/(L1\/L2 )/gi, (v) => `*0.8`],
	];
	// Things that affect the whole line
	var line_matches = [
		// Multiple targets
		[/.*/gi, (v) => `+1`], // start with 1
		[/AOE (\d+)/gi, (v) => `*${min(v, 2.5) + 1}`],
		[/AOE R/gi, (v) => `*1.8`],
		[/AOE C/gi, (v) => `*1.8`],
		[/all.*allies/gi, (v) => `*2.5`],
		[/all.*(enemies|foes)/gi, (v) => `*2.5`],
	];
	var texts = text.split(';');
	var score = 0;
	var tag = '';
	texts.forEach((line) => {
		const eval_fn = (matches, txt) => {
			var eval_score = 0;
			matches.forEach((pattern) => {
				var operator = pattern[1];
				pattern[0].lastIndex = 0;
				var regex = pattern[0].exec(txt);
				if (regex) {
					var s = '';
					if (regex.length > 1) {
						s = operator(Number(regex[1]));
					} else {
						s = operator(undefined);
					}
					var result = eval(`${eval_score} ${s}`);
					eval_score = isNaN(result) ? eval_score : result;
					if (print) {
						console.log(txt, pattern[0], '\nop:', s, ' | ', eval_score);
					}
					if (pattern.length > 2) {
						tag = pattern[2];
					}
				}
			});
			return eval_score;
		}
		var multiplier = eval_fn(line_matches, line);

		var parts = line.split(',');
		parts.forEach((part) => {
			var part_score = eval_fn(part_matches, part);
			score += (part_score * multiplier);
		});
	});
	return [score, tag];
}

function processAct(text) {
	if (text === undefined || text.length === 0) {
		return '';
	}
	var matches = [
		['(tactic|act|defend)', 'action'],
		['((?:\\d+/)?\\d* ?HP)', 'HP'],
		['(melee)', 'melee'],
		['(\\+?rng(?: \\d+))', 'rng'],
		['(aoe(?: [RC\\d+])?)', 'aoe'],
		['(\\+?ATK(?: [\\d+X])?)', 'atk'],
		['(\\+?(?:\\d+ )?def(?: \\d+))', 'def'],
		['((?:\\d+ )?true (?:damage|dmg))', 'true-dmg'],
		['(ADV)', 'adv'],
		['(\\+?SPD ?\\d+)', 'spd'],
		['IMM( .*);?', 'immunity'], // imm should be above statuses
		['resist( .*);?', 'resist'], // imm should be above statuses
		['(heal(?: \\d+)?)', 'heal'],
		['(cleanse(?: \\d+)?)', 'cleanse'],
		['(empower(?:ed)?(?: \\d+)?)', 'empower'],
		['(fortif(?:y|ied)(?: \\d+)?)', 'fortify'],
		['((?:all|any) debuffs?)', 'all-debuffs'],
		['(poison(?:ed)?(?: \\d+)?)', 'poison'],
		['(burn(?:t)?(?: \\d+)?)', 'burn'],
		['(stun(?:ed)?(?: \\d+)?)', 'stun'],
		['(chill(?:ed)?(?: \\d+)?)', 'chill'],
		['(shock(?:ed)?(?: \\d+)?)', 'shock'],
		['(revives?)', 'revive'],
		['(persistent)', 'persistent'],
		['(once):?', 'once'],
		['(stealth(?:ed)?(?: \\d+)?)', 'stealth'],
		['(reveal(?:ed)?(?: \\d+)?)', 'reveal'],
		['(nullify)', 'nullify'],
		['(FOG OF WAR)', 'fog-of-war'],
		['(killing blow)', 'killing-blow'],
		['(charm(?:ed)?(?: \\d+)?)', 'charm'],
		['(chaos)', 'chaos'],
		['(order)', 'order'],
		['(construct)', 'construct'],
		['(celestial)', 'celestial'],
		['(nature)', 'nature'],
		['(draw \\d+ cards?)', 'draw-card'],
		['(discard \\d+ cards?)', 'discard-card'],
		['(spawn|summon)', 'action'],
		['(\\d+VP)', 'vp'],
		['(\\d+ap)', 'ap'],
		['(-\\d+G)', 'no-g'], // above G
		['(\\d+G)', 'g'],
		['(\\w+ Phase)', 'phase'],
		['(free(?: \\d+| self)?)', 'free'],
	];
	text = text.replace(';', '\n<br>');
	matches.forEach((pattern) => {
		var regex = RegExp(pattern[0], 'gi');
		text = text.replace(regex, "<span class='sp " + pattern[1].toLowerCase() + "'>$1</span>"); 
	});
	return text;
}

function createUnitList() {
	var cont = document.querySelector('#card-list');
	var html = ''
	for (let i in data) {
		calculateUnitScores(i);
		var unit = data[i];
		html += '<button class="c'+unit['Level']+' c'+unit['Faction']+'" onclick="loadUnit('+i+')">'+unit['Name']+'</button>'
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
				ele.innerHTML = processAct(unit[k]);
			} else {
				ele.innerHTML = unit[k];
			}
		});

		// Mutate classes
		var classes = document.querySelectorAll('.class-' + k);
		classes.forEach((ele) => {
			ele.classList = 'class-' + k + ' c' + unit[k] + ' ' + unit[k];
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