class ScoreCritera {
    constructor(regex, evaluator, type = '', custom_scorers = []) {
        this.regex = regex;
        this.type = type;
        this.evaluator = evaluator;
        this.custom_scorers = custom_scorers;
    }
    run(score, text) {
        this.regex.lastIndex = 0;
        var tag = this.type;
        var regex = this.regex.exec(text);
        if (regex) {
            var v = Number(regex[1] || 1);
            score = this.evaluator(score, v);
            for (let scorer of this.custom_scorers) {
                const res = scorer.run(score, text);
                score = res[0];
                if (res[1].length > 0) {
                    tag = res[1];
                }
            }
            console.log(regex[0], this.regex, tag, score);
            return [score, tag, regex[0]];
        }
        return [score, '', ''];
    }
}

var score_types = {};
function constructScoreUi(unit) {
    const dom = document.querySelector('.unit-scores .detail-scores');
    var html = '';
    var score_total = 0;
    const scores = unit['scores'];
    const keys = Object.keys(scores).sort((a, b) => scores[b].total - scores[a].total);

    for (let k of keys) {
        score_total += scores[k].total;
        html += `<div class="score-category ${k}">
            <div class="score-type">${k}: ${scores[k].total.toFixed(2)}</div>`;
        for (let d in scores[k].details) {
            html += `<div class="score-detail">${d}: ${scores[k].details[d].toFixed(2)}</div>`
        }
        html += `</div>`
    }

    html = `<div class="score-total">Total: ${score_total.toFixed(2)}</div>` + html;

    dom.innerHTML = html;
}

function scoreUnitText(unit, text) {
	const min = Math.min;
    const SC = ScoreCritera;
    // A is accumulated value, B is extracted value from Regex
    const debuff_sub_criterias = [
        new SC(/(immune|IMM)/gi, (a, b) => a * 1.2, 'defense-immune'),
        new SC(/resist/gi, (a, b) => a * 0.85, 'defense-resist', [
            new SC(/all.*allies gain/, (a, b) => a, 'support-resist')
        ]),
        new SC(/per (poison|burn|chill|shock|charm|empower|fortify)/gi, (a, b) => a - 1),
    ]
    // Parts are sepreated by ','
    const part_criterias = [
        // Conditional multipliers
        new SC(/(reflect)/gi, (a, b) => a, '', [
            new SC(/against melee/gi, (a, b) => a * 0.75),
        ]),
        new SC(/(if|when|on) .*:.*/gi, (a, b) => a * 0.65),
        new SC(/per.*ally/gi, (a, b) => a * 1.5),
        new SC(/per (poison|burn|chill|shock|charm|empower|fortify)/gi, (a, b) => a * 1.5),
        new SC(/(X = current HP|per current HP)/gi, (a, b) => a * (unit['HP'] * 0.5)),
        new SC(/(chaos|celestial|nature|construct|order|vanguard)/gi, (a, b) => a * 0.7, '', [
            new SC(/ or /gi, (a, b) => a * 2),
        ]),
    ];
    // Lines are separated by ';'
    const line_criterias = [
        // Conditional
        new SC(/once.*/gi, (a, b) => a * 0.75),
        new SC(/persistent.*/gi, (a, b) => a, '', [
            new SC(/(on deploy)/gi, (a) => a * 2.2),
            new SC(/(before.*act)/gi, (a, b) => a * 2.5),
            new SC(/(after.*act)/gi, (a, b) => a * 2.5),
        ]),
        new SC(/(may).*/gi, (a, b) => a * 1.2),

        // Range & targetting multiplier
        new SC(/RNG (\d+)/gi, (a, b) => a * (1 + 0.5 * (min(b, 4) - 1)), '', [
            new SC(/RNG \d+ FAR/gi, (a, b) => a * 1.3),
            new SC(/RNG \d+ ANY/gi, (a, b) => a * 1.5),
        ]),

        // Multiple targets
        new SC(/AOE (\d+)/gi, (a, b) => a * (min(b, 2.5) + 1)),
        new SC(/AOE (C|R)/gi, (a, b) => a * 1.8),
        new SC(/all.*(enemies|foes|allies)/gi, (a, b) => a * 3.5),
        new SC(/(L1 )/gi, (a, b) => a * 0.5),
        new SC(/(L1\/L2 )/gi, (a, b) => a * 0.8),
    ];
    const BSC = (r, o, t, s = []) => {
        return new SC(r, o, t, [
            ...s,
            ...part_criterias,
        ]);
    };
    // Base criteras
    const base_criterias = [
        // Resources
        BSC(/(\d+)VP/gi, (a, b)=> a + b * 1.2, 'resource-vp'),
        BSC(/([+-]?\d+)G/gi, (a, b)=> a + b, 'resource-gold', [
            BSC(/max (\d+)G/gi, (a, b)=> a + b * 0.5),
            BSC(/Steal.*G/gi, (a, b)=> a * 1.5),
            BSC(/Foe gain/gi, (a, b)=> a * -1),
            BSC(/per.*ally/gi, (a, b)=> a * 2.5),
            BSC(/-\d+G/gi, (a, b)=> a * 1.75),
        ]),
        
        // Offensive
        BSC(/ATK (\d+)/gi, (a, b)=> a + b, 'offense-hit', [
            BSC(/ADV/gi, (a, b) => a * 1.25),
        ]),
        BSC(/ATK X/gi, (a, b)=> a, 'offense-hit', [
            BSC(/X =.*allies/gi, (a, b) => a + 2.5)
        ]),
        BSC(/(\d+) True (?:dmg|damage)/gi, (a, b) => a + b * 2, 'offense-hit'),
        BSC(/poison ?(\d+)?/gi, (a, b) => a + b, 'offense-dot', [
            ...debuff_sub_criterias,
            BSC(/trigger poison/gi, (a, b) => a * 2),
        ]),
        BSC(/burn ?(\d+)?/gi, (a, b) => a + b*1.2**b, 'offense-dot', [
            ...debuff_sub_criterias,
            BSC(/trigger burn/gi, (a, b) => a * 2),
            BSC(/self.*burn/gi, (a, b) => a * 0.2) // W/A for self burn
        ]),
        BSC(/shock ?(\d+)?/gi, (a, b) => a + b, 'offense-debuff', debuff_sub_criterias),
        BSC(/charm ?(\d+)?/gi, (a, b) => a + b * 1.5, 'offense-debuff', debuff_sub_criterias),
        BSC(/reveal ?(\d+)?/gi, (a, b) => a + b, 'offense-debuff'),
        BSC(/transfer debuffs/gi, (a, b) => a + 1.3, 'offense-debuff'),

        // Defensive
        BSC(/DEF (\d+)/gi, (a, b) => a + b, 'defense-stat'),
        BSC(/chill ?(\d+)?/gi, (a, b) => a + b, 'defense-debuff', debuff_sub_criterias),
        BSC(/stun/gi, (a, b) => a + 2, 'defense-debuff', debuff_sub_criterias),
        BSC(/nullify/gi, (a, b) => a + 3, 'defense-utility'),
        BSC(/revive.*(\d+) HP/gi, (a, b) => a + b + 1, 'defense-sustain'),
        BSC(/revive.*full HP/gi, (a, b) => a + unit['HP'], 'defense-sustain'),
        BSC(/takes (\d+) damage at most per attack.*/gi, (a, b) => a + (6 / (b + 2) * unit['HP']), 'defense-utility'),
        BSC(/all debuffs?/gi, (a, b) => a + 6, '', debuff_sub_criterias),
        BSC(/any debuffs?/gi, (a, b) => a + 4, '', debuff_sub_criterias),

        // Supports
        BSC(/heal ?(\d+)?/gi, (a, b) => a + b * 0.9, 'support-heal', [
            BSC(/(?:self.*heal)/gi, (a, b) => a, 'defense-sustain')
        ]),
        BSC(/cleanse ?(\d+)?/gi, (a, b) => a + b * 1.1, 'support-cleanse', [
            BSC(/(?:self.*cleanse)/gi, (a, b) => a, 'defense-sustain')
        ]),
        BSC(/stealth ?(\d+)?/gi, (a, b) => a + b * 3, 'support-utility', [
            BSC(/(?:self.*stealth)/gi, (a, b) => a, 'defense-utility'),
            BSC(/if self stealth/gi, (a, b) => a - 3, ''),
        ]),
        BSC(/fog of war/gi, (a, b) => a + 5, 'support-utility', [
            BSC(/(?:self.*fog of war)/gi, (a, b) => a, 'defense-utility'),
        ]),
        BSC(/empower ?(\d+)?/gi, (a, b) => a + b * 1.75, 'support-buff', [
            BSC(/self.*empower/gi, (a, b) => a, 'offense-buff'),
            BSC(/if self empower/gi, (a, b) => a - 1.75, ''),
            BSC(/remove/gi, (a, b) => a * 0.7, 'offense-remove'),
        ]),
        BSC(/fortify ?(\d+)?/gi, (a, b) => a + b * 1.75, 'support-buff', [
            BSC(/self.*fortify/gi, (a, b) => a, 'defense-buff'),
            BSC(/if self fortify/gi, (a, b) => a - 1.75, ''),
            BSC(/remove/gi, (a, b) => a * 0.7, 'offense-remove'),
        ]),

        // Utility
        BSC(/free (\d+)?(?:self)?/gi, (a, b) => a + b * 10, 'utility-army'),
        BSC(/(spawn|summon)/gi, (a, b) => a, 'utility-summon', [
            BSC(/spawn.*(\d+) ATK/gi, (a, b) => a + b, 'offense-summon'),
            BSC(/spawn.*(\d+) HP/gi, (a, b) => a + b, 'defense-summon')
        ]),
        BSC(/draw (\d+) cards?/gi, (a, b) => a + b, 'utility-card'),
        BSC(/discard (\d+) cards?/gi, (a, b) => a - b),
        BSC(/(perform|trigger).*(tactic|act|defend)/gi, (a, b) => a + 4, 'utility-trigger', [
            BSC(/(perform|trigger).*(act)/gi, (a, b) => a, 'offense-trigger'),
            BSC(/(perform|trigger).*(tactic)/gi, (a, b) => a * 1.25, 'utility-trigger'),
            BSC(/(perform|trigger).*defend/gi, (a, b) => a, 'defense-trigger')
        ]),
    ];

    const text_scores = {};
    const base_scores = [];
    const lines = text.split(';');
    lines.forEach((line) => {
        const part_scores = {};
        const parts = line.split(',');

        // Base scores
        parts.forEach((part) => {
            base_criterias.forEach((scorer) => {
                const [score, tag, matched] = scorer.run(0, part);
                if (tag) {
                    if (!(tag in part_scores)) {
                        part_scores[tag] = 0;
                    }
                    part_scores[tag] += score;
                    base_scores.push([matched.trim(), score]);
                }
            });
        });

        // Line multipliers
        var multiplier = 1;
        line_criterias.forEach((scorer) => {
            const [m, _, __] = scorer.run(multiplier, line);
            multiplier = m;
        });
        for (let tag in part_scores) {
            text_scores[tag] = Number(part_scores[tag]) * multiplier;
            score_types[tag] = 0;
        }
        for (let i in base_scores) {
            base_scores[i][1] = base_scores[i][1] * multiplier;
        }
    });
    return [text_scores, base_scores];
}

function calculateUnitScores(index, print=false) {
    const unit = data[index];

    const hp = Number(unit['HP']);
    const def = Number(unit['DEF']);
    const spd = Number(unit['SPD']);
    const cost = Number(unit['Cost']);

    var scores = {};
    const def_stat = (hp * (1 + (def / 3))) * 1.3;
    scores['defense'] = {
        total: def_stat,
        details: {'stat': def_stat}
    };
    const res_cost = -cost;
    scores['resource'] = {
        total: res_cost,
        details: {'cost': res_cost}
    };;
    var total_score = def_stat + res_cost;

    const base_scores = {};

    const spd_multi = spd / 10;
    const def_multi = (def / 10) + (hp / 15);
    const tactic_resource_multi = 1.5;  // Tactics that grant resources are valuable
    const tactic_cost_multi = 6 / (cost + 3);  // The more it cost, the less value tactic is
    const tactic_any_multi = 1.4;

    const calcAct = (action, multiplier = 1) => {
        base_scores[action] = [];
        if (!unit[action]) {
            return;
        }
        var texts = unit[action].split(';');
        var act_score = 0;
        texts.forEach((txt) => {
            const [res, base] = scoreUnitText(unit, txt);
            for (let i in res) {
                var txt_multi = multiplier;
                var score = res[i];
                const tag_type = i.split('-')[0];
                const tag_detail = i.split('-')[1];

                // Edge cases
                if (tag_type === 'defense') {
                    txt_multi *= (1 + def_multi);
                }
                if (action === 'Tactic') {
                    if (txt.match(/RNG|Melee/gi) && !txt.match(/Melee.*AOE R/gi)) {
                        txt_multi *= tactic_any_multi;
                    }
                    // if (['support', 'utility'].find((x) => x === tag_type)) {
                    //     txt_multi *= tactic_any_multi;
                    // }
                    if (tag_type === 'resource') {
                        txt_multi *= tactic_resource_multi;
                    }
                }

                // Total multiplier
                score *= txt_multi;

                // Handle tags
                if (!(tag_type in scores)) {
                    scores[tag_type] = {total: 0, details: {}};
                }
                if (!(tag_detail in scores[tag_type].details)) {
                    scores[tag_type].details[tag_detail] = 0;
                }

                scores[tag_type].total += score;
                scores[tag_type].details[tag_detail] += score;

                total_score += score;
                act_score += score;
            }
            unit[`score-${action}`] = act_score.toFixed(2);
            base_scores[action] = base_scores[action].concat(base);
        });
        const base_total = base_scores[action].reduce((a,b) => a + b);
        base_scores[action].push(['X_', act_score / base_total]);
        base_scores[action].push(['Total_', act_score]);
    }

    calcAct('Tactic', tactic_cost_multi);
    calcAct('Deploy', 0.7);
    calcAct('Act', 1 + (spd_multi + def_multi));
    calcAct('Defend');
    calcAct('Defeat', (1 + (spd_multi * 0.3)) / (1 + def_multi));
    calcAct('Win', 1 + def_multi);

    unit['scores'] = scores;
    unit['base_scores'] = base_scores;
    unit['score-Total'] = Math.round(total_score);
}

function calculateStatScore(hp, def, spd, cost) {
    var score = 0;
    score += (Number(hp) * (1 + (Number(def) / 4))) * 1.3;
    score += (Number(spd));
    score -= Number(cost) * 1.2;
    return score;
}