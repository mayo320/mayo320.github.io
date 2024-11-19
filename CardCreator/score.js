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
            return [score, tag];
        }
        return [score, ''];
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
    const base_criterias = [
        // Resources
        new SC(/(\d+)VP/gi, (a, b)=> a + b * 1.2, 'resource-vp'),
        new SC(/([+-]?\d+)G/gi, (a, b)=> a + b, 'resource-gold', [
            new SC(/max (\d+)G/gi, (a, b)=> a + b * 0.5),
            new SC(/Steal.*G/gi, (a, b)=> a * 2),
            new SC(/Foe gain/gi, (a, b)=> a * -1),
            new SC(/per.*ally/gi, (a, b)=> a * 2.5),
            new SC(/-\d+G/gi, (a, b)=> a * 1.75),
        ]),
        
        // Offensive
        new SC(/ATK (\d+)/gi, (a, b)=> a + b, 'offense-hit', [
            new SC(/ADV/gi, (a, b) => a * 1.25)
        ]),
        new SC(/ATK X/gi, (a, b)=> a, 'offense-hit', [
            new SC(/X =.*allies/gi, (a, b) => a + 2.5)
        ]),
        new SC(/(\d+) True (?:dmg|damage)/gi, (a, b) => a + b * 2, 'offense-hit'),
        new SC(/poison ?(\d+)?/gi, (a, b) => a + b, 'offense-dot', [
            ...debuff_sub_criterias,
            new SC(/trigger poison/gi, (a, b) => a * 2),
        ]),
        new SC(/burn ?(\d+)?/gi, (a, b) => a + 1.1**b, 'offense-dot', [
            ...debuff_sub_criterias,
            new SC(/trigger burn/gi, (a, b) => a * 2),
            new SC(/self burn/gi, (a, b) => a * 0.2) // W/A for self burn
        ]),
        new SC(/shock ?(\d+)?/gi, (a, b) => a + b, 'offense-debuff', debuff_sub_criterias),
        new SC(/charm ?(\d+)?/gi, (a, b) => a + b * 1.5, 'offense-debuff', debuff_sub_criterias),
        new SC(/reveal ?(\d+)?/gi, (a, b) => a + b, 'offense-debuff'),
        new SC(/transfer debuffs/gi, (a, b) => a + 1.3, 'offense-debuff'),

        // Defensive
        new SC(/DEF (\d+)/gi, (a, b) => a + b, 'defense-stat'),
        new SC(/chill ?(\d+)?/gi, (a, b) => a + b, 'defense-debuff', debuff_sub_criterias),
        new SC(/stun/gi, (a, b) => a + 2, 'defense-debuff', debuff_sub_criterias),
        new SC(/nullify/gi, (a, b) => a + 3, 'defense-utility'),
        new SC(/revive.*(\d+) HP/gi, (a, b) => a + b + 1, 'defense-sustain'),
        new SC(/revive.*full HP/gi, (a, b) => a + unit['HP'], 'defense-sustain'),
        new SC(/takes (\d+) damage at most per attack.*/gi, (a, b) => a + (6 / (b + 2) * unit['HP']), 'defense-utility'),
        new SC(/all debuffs?/gi, (a, b) => a + 6, '', debuff_sub_criterias),
        new SC(/any debuffs?/gi, (a, b) => a + 4, '', debuff_sub_criterias),

        // Supports
        new SC(/heal ?(\d+)?/gi, (a, b) => a + b * 0.9, 'support-heal', [
            new SC(/(?:self.*heal)/gi, (a, b) => a, 'defense-sustain')
        ]),
        new SC(/cleanse ?(\d+)?/gi, (a, b) => a + b * 1.1, 'support-cleanse', [
            new SC(/(?:self.*cleanse)/gi, (a, b) => a, 'defense-sustain')
        ]),
        new SC(/stealth ?(\d+)?/gi, (a, b) => a + b * 3, 'support-utility', [
            new SC(/(?:self.*stealth)/gi, (a, b) => a, 'defense-utility')
        ]),
        new SC(/fog of war/gi, (a, b) => a + 5, 'support-utility', [
            new SC(/(?:self.*fog of war)/gi, (a, b) => a, 'defense-utility')
        ]),
        new SC(/empower ?(\d+)?/gi, (a, b) => a + b * 1.75, 'support-buff', [
            new SC(/self empower/gi, (a, b) => a, 'offense-buff')
        ]),
        new SC(/fortify ?(\d+)?/gi, (a, b) => a + b * 1.75, 'support-buff', [
            new SC(/self fortify/gi, (a, b) => a, 'defense-buff')
        ]),

        // Utility
        new SC(/free (\d+)?(?:self)?/gi, (a, b) => a + b * 10, 'utility-army'),
        new SC(/(spawn|summon)/gi, (a, b) => a, 'utility-summon', [
            new SC(/spawn.*(\d+) ATK/gi, (a, b) => a + b, 'offense-summon'),
            new SC(/spawn.*(\d+) HP/gi, (a, b) => a + b, 'defense-summon')
        ]),
        new SC(/draw (\d+) cards?/gi, (a, b) => a + b, 'utility-card'),
        new SC(/discard (\d+) cards?/gi, (a, b) => a - b),
        new SC(/(perform|trigger).*(act|defend)/gi, (a, b) => a + 4, 'utility-trigger', [
            new SC(/(perform|trigger).*act/gi, (a, b) => a, 'offense-utility'),
            new SC(/(perform|trigger).*defend/gi, (a, b) => a, 'defense-utility')
        ]),
    ];
    // Parts are sepreated by ','
    const part_criterias = [
        // Conditional multipliers
        new SC(/(reflect)/gi, (a, b) => a, '', [
            new SC(/against melee/gi, (a, b) => a * 0.75),
        ]),
        new SC(/(if|when).*:.*/gi, (a, b) => a * 0.65),
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
        new SC(/persistent.*/gi, (a, b) => a, 'utility', [
            new SC(/(on deploy)/gi, (a) => a * 1.9),
            new SC(/(before.*act)/gi, (a, b) => a * 2.5),
            new SC(/(after.*act)/gi, (a, b) => a * 2.5),
        ]),
        new SC(/(may).*/gi, (a, b) => a * 1.2),

        // Range & targetting multiplier
        new SC(/RNG (\d+)/gi, (a, b) => a * (1 + 0.5 * (min(b, 4) - 1)), '', [
            new SC(/RNG \d+ FAR/gi, (a, b) => a * 1.2),
            new SC(/RNG \d+ ANY/gi, (a, b) => a * 2),
        ]),

        // Multiple targets
        new SC(/AOE (\d+)/gi, (a, b) => a * (min(b, 2.5) + 1)),
        new SC(/AOE (C|R)/gi, (a, b) => a * 1.8),
        new SC(/all.*(enemies|foes|allies)/gi, (a, b) => a * 3.5),
        new SC(/(L1 )/gi, (a, b) => a * 0.5),
        new SC(/(L1\/L2 )/gi, (a, b) => a * 0.8),
    ];

    const text_scores = {};
    const lines = text.split(';');
    lines.forEach((line) => {
        const line_scores = {};
        const parts = line.split(',');

        parts.forEach((part) => {
            const part_scores = {};
            base_criterias.forEach((scorer) => {
                const [score, tag] = scorer.run(0, part);
                if (tag) {
                    if (!(tag in part_scores)) {
                        part_scores[tag] = 0;
                    }
                    part_scores[tag] += score;
                }
            })

            for (let tag in part_scores) {
                part_criterias.forEach((scorer) => {
                    const [score, _] = scorer.run(part_scores[tag], part);
                    part_scores[tag] = score;
                })
                line_scores[tag] = part_scores[tag];
            }
        });

        
        for (let tag in line_scores) {
            line_criterias.forEach((scorer) => {
                const [score, _] = scorer.run(line_scores[tag], line);
                line_scores[tag] = score;
            });
            text_scores[tag] = line_scores[tag];

            // populate
            score_types[tag] = 0;
        }
    });
    return text_scores;
}

function calculateUnitScores(index, print=false) {
    const unit = data[index];

    const hp = Number(unit['HP']);
    const def = Number(unit['DEF']);
    const spd = Number(unit['SPD']);

    var scores = {};
    const def_stat = (hp * (1 + (def / 3))) * 1.3;
    scores['defense'] = {
        total: def_stat,
        details: {'stat': def_stat}
    };
    const res_cost = -Number(unit['Cost'])
    scores['resource'] = {
        total: res_cost,
        details: {'cost': res_cost}
    };;
    var total_score = def_stat + res_cost;

    const spd_multi = spd / 10;
    const def_multi = (def / 10) + (hp / 15);
    const tactic_resource_multi = 1.5;

    const calcAct = (action, multiplier = 1) => {
        if (!unit[action]) {
            return;
        }
        var texts = unit[action].split(';');
        var act_score = 0;
        texts.forEach((txt) => {
            const res = scoreUnitText(unit, txt);
            for (let i in res) {
                var score = res[i] * multiplier;
                const tag_type = i.split('-')[0];
                const tag_detail = i.split('-')[1];

                // Edge cases
                if (tag_type === 'defense') {
                    score *= (1 + def_multi);
                }
                if (tag_type === 'resource' && action === 'Tactic') {
                    score *= tactic_resource_multi;
                }

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
        });
    }

    calcAct('Tactic');
    calcAct('Deploy', 0.7);
    calcAct('Act', 1 + (spd_multi + def_multi));
    calcAct('Defend');
    calcAct('Defeat', (1 + (spd_multi * 0.3)) / (1 + def_multi));
    calcAct('Win', 1 + def_multi);

    unit['scores'] = scores;
    unit['score-Total'] = Math.round(total_score);
}

function calculateStatScore(hp, def, spd, cost) {
    var score = 0;
    score += (Number(hp) * (1 + (Number(def) / 4))) * 1.3;
    score += (Number(spd));
    score -= Number(cost) * 1.2;
    return score;
}