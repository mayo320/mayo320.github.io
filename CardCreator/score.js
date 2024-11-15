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
            var v = Number(regex[1] || 0);
            score = this.evaluator(score, v);
            for (let scorer of this.custom_scorers) {
                const res = scorer.run(score, text);
                score = res[0];
                if (res[1]) {
                    tag = res[1];
                }
            }
        }
        return [score, tag];
    }
}


function scoreUnitText(unit, text) {
	const min = Math.min;
    const SC = ScoreCritera;
    // A is accumulated value, B is extracted value from Regex
    const base_criterias = [
        // Resources
        new SC(/(\d+)VP/gi, (a, b)=> a + b, 'resource:vp'),
        new SC(/([+-]?\d+)G/gi, (a, b)=> a + b, 'resource:gold', [
            new SC(/max (\d+)G/gi, (a, b)=> a + b * 0.5),
            new SC(/Steal.*G/gi, (a, b)=> a * 2),
            new SC(/Foe gain/gi, (a, b)=> a * -1),
        ]),
        
        // Offensive
        new SC(/ATK (\d+)/gi, (a, b)=> a + b, 'offense:hit', [
            new SC(/ADV/gi, (a, b) => a * 1.25)
        ]),
        new SC(/(\d+) True (?:dmg|damage)/gi, (a, b) => a + b * 2, 'offense:hit'),
        new SC(/poison ?(\d+)?/gi, (a, b) => a + b, 'offense:dot'),
        new SC(/burn ?(\d+)?/gi, (a, b) => a + b, 'offense:dot', [
            new SC(/self burn/gi, (a, b) => a * 0.2) // W/A for self burn
        ]),
        new SC(/shock ?(\d+)?/gi, (a, b) => a + b, 'offense:debuff'),
        new SC(/charm ?(\d+)?/gi, (a, b) => a + b * 1.5, 'offense:debuff'),
        new SC(/reveal ?(\d+)?/gi, (a, b) => a + b, 'offense:debuff'),
        new SC(/transfer debuffs/gi, (a, b) => a + 1.3, 'offense:debuff'),

        // Defensive
        new SC(/DEF (\d+)/gi, (a, b) => a + b, 'defense'),
        new SC(/chill ?(\d+)?/gi, (a, b) => a + b, 'defense:debuff'),
        new SC(/stun/gi, (a, b) => a + 2, 'defense:debuff'),
        new SC(/(immune|IMM)/gi, (a, b) => a, 'defense:immune', [
            new SC(/all debuffs?/gi, (a, b) => a + 6)
        ]),
        new SC(/resist/gi, (a, b) => a * 0.75, 'defense:resist', [
            new SC(/any debuffs?/gi, (a, b) => a + 4)
        ]),
        new SC(/stealth ?(\d+)?/gi, (a, b) => `+${(v || 1) * 1.5}`, 'defense:utility'),
        new SC(/fog of war/gi, (a, b) => a + 3, 'defense:utility'),
        new SC(/nullify/gi, (a, b) => a + 3, 'defense'),
        new SC(/revive.*(\d+) HP/gi, (a, b) => a + b + 1, 'defense:sustain'),
        new SC(/revive.*full HP/gi, (a, b) => a + unit['HP'], 'defense:sustain'),
        new SC(/takes (\d+) damage at most per attack.*/gi, (a, b) => a + (6 / (b + 2) * unit['HP']), 'defense'),

        // Supports
        new SC(/heal ?(\d+)?/gi, (a, b) => a + b * 0.7, 'support:heal', [
            new SC(/(?:self heal|heal( \d+)? self)/, (a, b) => a, 'defense:sustain')
        ]),
        new SC(/cleanse ?(\d+)?/gi, (a, b) => a + b * 0.7, 'support:cleanse', [
            new SC(/(?:self cleanse|cleanse( \d+)? self)/, (a, b) => a, 'defense:sustain')
        ]),
        new SC(/empower ?(\d+)?/gi, (a, b) => a + b * 1.5, 'support:buff', [
            new SC(/self empower/gi, (a, b) => a, 'offense:buff')
        ]),
        new SC(/fortify ?(\d+)?/gi, (a, b) => a + b * 1.5, 'support:buff', [
            new SC(/self fortify/gi, (a, b) => a, 'defense:buff')
        ]),

        // Utility
        new SC(/free (\d+)?(?:self)?/gi, (a, b) => a + b * 5, 'utility'),
        new SC(/(spawn|summon)/gi, (a, b) => a, 'utility', [
            new SC(/spawn.*(\d+) ATK/gi, (a, b) => a + b, 'offense:summon'),
            new SC(/spawn.*(\d+) HP/gi, (a, b) => a + b, 'defense:summon')
        ]),
        new SC(/draw (\d+) cards?/gi, (a, b) => a + b * 2, 'utility:card'),
        new SC(/discard (\d+) cards?/gi, (a, b) => a - b),
        new SC(/(perform|trigger).*(act|defend)/gi, (a, b) => a + 4, 'utility', [
            new SC(/(perform|trigger).*act/gi, (a, b) => a, 'offense:utility'),
            new SC(/(perform|trigger).*defend/gi, (a, b) => a, 'defense:utility')
        ]),
    ];
    // Parts are sepreated by ','
    const part_criterias = [
        // Conditional multipliers
        new SC(/(reflect)/gi, (a, b) => a, '', [
            new SC(/against melee attack/gi, (a, b) => a * 0.75),
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
        new SC(/(may).*/gi, (v) => `*1.2`),

        // Range & targetting multiplier
        new SC(/RNG (\d+)/gi, (a, b) => a * (1 + 0.5 * (min(b, 4) - 1)), [
            new SC(/RNG \d+ FAR/gi, (a, b) => a * 1.2),
            new SC(/RNG \d+ ANY/gi, (a, b) => a * 2),
        ]),

        // Multiple targets
        new SC(/AOE (\d+)/gi, (a, b) => a * (min(v, 2.5) + 1)),
        new SC(/AOE (C|R)/gi, (a, b) => a * 1.8),
        new SC(/all.*(enemies|foes|allies)/gi, (a, b) => a * 2.5),
        new SC(/(L1 )/gi, (a, b) => a * 0.5),
        new SC(/(L1\/L2 )/gi, (a, b) => a * 0.8),
    ];

    const lines = text.split(';');
    lines.forEach((line) => {
        const line_scores = {};
        const parts = line.split(',');

        parts.forEach((part) => {
            const part_scores = {};
            base_criterias.forEach((scorer) => {
                const [score, tag] = scorer.run(0, part);
                part_scores[tag] = score;
            })

            for (let tag in part_scores) {
                part_criterias.forEach((scorer) => {
                    const [score, _] = scorer.run(part_scores[tag], part);
                    line_scores[tag] = score;
                })
            }
        });

        
        for (let tag in line_scores) {
            line_criterias.forEach((scorer) => {
                const [score, _] = scorer.run(line_scores[tag], line);
                line_scores[tag] = score;
            })
        }
        console.log(line);
        console.log(line_scores);
    });

}
