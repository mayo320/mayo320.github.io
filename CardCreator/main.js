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

function calculateStatScore(hp, def, spd, cost) {
	var score = 0;
	score += hp * (1 + (def / 4));
	score += spd;
	return score;
}

function calculateActScore(text) {
	if (text === undefined || text.length === 0) {
		return 0;
	}
	var min = Math.min;
	// Order matters, top ones are calculated first
	// Format of [regex, accumulator]
	var matches = [
		// General
		[/(\d+)VP/gi, (v) => `+${v}`],
		[/(\d+)G/gi, (v) => `+${v}`],
		// Attacks & RNG
		[/ATK (\d+)/gi, (v) => `+${v}`],
		[/DEF (\d+)/gi, (v) => `+${v}`],
		[/(\d+) True (?:dmg|damage)/gi, (v) => `+${2 * v}`],
		[/Melee/gi, (v) => `*1`],
		[/RNG (\d+)/gi, (v) => `+${min(v, 3) - 1}`],
		[/ADV/gi, (v) => `*1.25`],
		// Targetting
		[/FAR/gi, (v) => `+1`],
		// Supports
		[/heal ?(\d+)?/gi, (v) => `+${v | 1}`],
		[/cleanse ?(\d+)?/gi, (v) => `+${v | 1}`],
		// Statuses
		[/poison ?(\d+)?/gi, (v) => `+${v | 1}`],
		[/burn ?(\d+)?/gi, (v) => `+${v | 1}`],
		[/chill ?(\d+)?/gi, (v) => `+${v | 1}`],
		[/shock ?(\d+)?/gi, (v) => `+${v | 1}`],
		[/charm ?(\d+)?/gi, (v) => `+${(v | 1) * 1.5}`],
		[/empower ?(\d+)?/gi, (v) => `+${v | 1}`],
		[/fortify ?(\d+)?/gi, (v) => `+${v | 1}`],
		[/stun/gi, (v) => `+2`],
		[/immune/gi, (v) => `*1`],
		[/resist/gi, (v) => `*0.5`],
		[/reveal ?(\d+)?/gi, (v) => `+${v | 1}`],
		[/stealth ?(\d+)?/gi, (v) => `+${(v | 1) * 1.5}`],
		[/fog of war/gi, (v) => `+3`],
		[/free (\d+)?(?:self)?/gi, (v) => `${(v | 1) * 3}`],
		[/nullify/gi, (v) => `+3`],
		[/transfer debuffs/gi, (v) => `+1`],
		[/spawn.*(\d+) HP/gi, (v) => `+${v}`],
		// Cards
		[/draw (\d+) cards?/gi, (v) => `+${v * 2}`],
		[/discard (\d+) cards?/gi, (v) => `-${v}`],
		// Conditional
		[/(reflect)/gi, (v) => `*0.75`],
		[/against (?:melee) attack/gi, (v) => `*0.75`],
		[/(if|when).*:.*/gi, (v) => `*0.5`],
		[/(may).*/gi, (v) => `*1.2`],
		[/per.*ally/gi, (v) => `*1`],
		[/per.*(chaos|celestial|nature|construct|order).*ally/gi, (v) => `*0.6`],
		[/per (poison|burn|chill|shock|charm|empower|fortify)/gi, (v) => `*1.5`],
		[/once.*/gi, (v) => `*0.8`],
		// Act again
		[/(perform|trigger).*(act|defend)/gi, (v) => `+4`],
		// Multiple targets
		[/AOE (\d+)/gi, (v) => `*${min(v * 2, 5)}`],
		[/AOE R/gi, (v) => `*2`],
		[/AOE C/gi, (v) => `*2`],
		[/all allies/gi, (v) => `*2`],
		[/all (chaos|celestial|nature|construct|order) allies/gi, (v) => `*1.5`],
	];
	var texts = text.split(';');
	var score = 0;
	texts.forEach((txt) => {
		matches.forEach((pattern) => {
			var operator = pattern[1];
			var regex = pattern[0].exec(txt);
			if (regex) {
				var s = '';
				if (regex.length > 1) {
					s = operator(Number(regex[1]));
				} else {
					s = operator(undefined);
				}
				txt = txt.replace(pattern[0], s);
				var result = eval(`${score} ${s}`);
				score = isNaN(result) ? score : result;
			}
		});
	});
	return score;
}

function processAct(text) {
	if (text === undefined || text.length === 0) {
		return '';
	}
	var matches = [
		['(tactic|act|defend)', 'action'],
		['((?:\\d+/)?\\d* ?HP)', 'HP'],
		['(melee)', 'melee'],
		['(rng(?: \\d+))', 'rng'],
		['(aoe(?: [RC\\d+])?)', 'aoe'],
		['(ATK(?: [\\d+X])?)', 'atk'],
		['((?:\\d+ )?def(?: \\d+))', 'def'],
		['((?:\\d+ )?true (?:damage|dmg))', 'true-dmg'],
		['(ADV)', 'adv'],
		['(SPD ?\\d+)', 'spd'],
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
	var total_score = calculateStatScore(unit['HP'], unit['DEF'], unit['SPD'], unit['Cost']);
	document.querySelector('.text-statscore').innerHTML = total_score.toFixed(2);

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
				var score = calculateActScore(unit[k]).toFixed(2);
				ele.innerHTML += `<span class="score">${score}</score>`;
				total_score += score;
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
	document.querySelector('.text-score').innerHTML = total_score.toFixed(2);
}

window.onload = function(){
	init();
	loadCsvFromUri();

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