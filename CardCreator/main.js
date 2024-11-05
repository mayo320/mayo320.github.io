HEIGHT = 1125;
WIDTH = 825;

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



function exportCard(element) {
	// Draw element on canvas
	var html = element.innerHTML.trim();

	html2canvas(element, {
		useCORS: true,
		width: WIDTH,
		height: HEIGHT,
		scale: 1
	}).then(function (canvas) {
		// document.body.appendChild(canvas);

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

function processAct(text) {
	var matches = [
		['(tactic|act|defend)', 'action'],
		['((?:\\d+/)?\\d* ?HP)', 'HP'],
		['(melee)', 'melee'],
		['(rng(?: \\d+)?)', 'rng'],
		['(aoe(?: [RC\\d+])?)', 'aoe'],
		['(ATK(?: [\\d+X])?)', 'atk'],
		['((?:\\d+ )?def(?: \\d+))', 'def'],
		['((?:\\d+ )?true (?:damage|dmg))', 'true-dmg'],
		['(ADV)', 'adv'],
		['(SPD ?\\d+)', 'spd'],
		['IMM( .*);?', 'immunity'], // imm should be above statuses
		['(heal(?: \\d+)?)', 'heal'],
		['(cleanse(?: \\d+)?)', 'cleanse'],
		['(empower(?: \\d+)?)', 'empower'],
		['(regen(?: \\d+)?)', 'regen'],
		['(poison(?: \\d+)?)', 'poison'],
		['(burn(?: \\d+)?)', 'burn'],
		['(stun(?: \\d+)?)', 'stun'],
		['(chill(?: \\d+)?)', 'chill'],
		['(shock(?: \\d+)?)', 'shock'],
		['(revives?)', 'revive'],
		['(persistent)', 'persistent'],
		['(once):?', 'once'],
		['(stealth(?: \\d+)?)', 'stealth'],
		['(reveal(?: \\d+)?)', 'reveal'],
		['(nullify)', 'nullify'],
		['(FOG OF WAR)', 'fog-of-war'],
		['(killing blow)', 'killing-blow'],
		['(mind control(?: \\d+)?)', 'mind-control'],
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
		['(free(?: \\d+|self)?)', 'free'],
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
			if (unit[k].length > 0) {
				ele.classList.remove('hidden');
			} else {
				ele.classList.add('hidden');
			}
		});

	}
}

window.onload = function(){
	init();
	loadCsvFromUri();
}

function download() {
	document.querySelector('#overlay').classList.add('hidden');
	exportCard(document.getElementById('card-cont'))
	document.querySelector('#overlay').classList.remove('hidden');
}

function bulkExport() {
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



// CHIT
var current_chit = '';
function setChit(name) {
	var data = CHIT_DATA[name];
	var chit = document.querySelector('.chit');
	var html = '<span class="'+name.toLowerCase()+'">&#x'+data[1]+';';
	html += `<br><span class="text">${name}</span>`;
	if (data[2]) {
		html += `<br><span class="subtext">${data[2]}</span>`;
	}
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

// Potential list of emojis https://www.unicode.org/emoji/charts/full-emoji-list.html
// U+1F5E3
// U+1F464
// U+1F465