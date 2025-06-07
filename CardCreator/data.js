var CHIT_DATA = {
	'Poison': [18, '1F480', '<i class="material-icons">electric_bolt</i>: DMG',
		['layers']
	],
	'Burn': [18, '1F525', '<i class="material-icons">electric_bolt</i>: True DMG',
		['layers', 'exposure_neg_1']
	],
	'Chill': [18, '2744', '- ATK',
		['layers']
	],
	'Shock': [18, '26A1', '- DEF',
		['layers']
	],
	'Fortify': [18, '1F6E1', '+ DEF',
		['layers']
	],
	'Empower': [18, '2694', '+ ATK',
		['layers']
	],
	'Stealth': [8, '1F300', 'Untargetable',
		['layers', 'exposure_neg_1']
	],
	'Stun': [8, '1F4AB', 'Skip <i class="material-icons">electric_bolt</i>/<i class="material-icons">security</i>',
		['layers_clear', 'exposure_neg_1']
	],
};

const INSTRUCTIONS = {
'Instructions': `
	ATK X Attack, by default target nearest unit in the row;
<div class="section">
	<div>DEF X Defence</div>
	<div>ADV may reroll a die</div>
</div>
	X True damage Damage that bypasses defence;

<div class="hr"></div>
	RNG X Target nearest unit up to X tiles;
<div class="section">
	<div>FAR RNG X Target furthest</div>
	<div>ANY RNG X Target any unit in range</div>
</div>
	AOE X Area of effect spanning X tiles from origin;
<div class="section">
	<div>AOE C Column area</div>
	<div>AOE R Row area</div>
</div>

<div class="hr"></div>

<div class="section">
	<div>Heal X Recover X HP</div>
	<div>Cleanse X -X debuff tokens</div>
</div>
	Revive unit to some HP, clear all status tokens;
	Empower Grant ATK 1 (max 2) (Act:-1);
	Fortify Grant DEF 1 (max 2) (Act:-1);
	Stealth X Cannot be targeted (Act:-1 or Damaged:-1);
	IMM some_debuff; Immunity to status;
	Resist some_debuff; Resistance to status (Act:-1 of that status);
<div class="hr"></div>
<div class="section">
	<div>Poison Deal ATK 1/token</div>
	<div>Chill Reduce ATK 1/token</div>
</div>
<div class="section">
	<div>Burn Deal 1 true damage/token (Act:-1)</div>
	<div>Shock Reduce DEF 1/token</div>
</div>
	Stun Skip unit's turn (Act:-1);
<div class="hr"></div>
	Once Effect that is triggered one time per round;
	Persistent Ongoing effect for the round;
	Nullify Ignore ATK X, bypassed by True Dmg;
	Trigger Triggers the effect that follows it;
	Move a unit to an adjacent tile;
	`
};

const CSV_COMM_SKILL_ENCODED_DATA = decodeURIComponent(`H4sIAAAAAAAA%2F%2B1Y3W%2FiOBD%2FV%2BZtu7qqXXq9fWh1DxQKW21pOegW3QnpNCQGvE3srO3Qy%2F71N3Y%2BKQH2TrBP0ahqTOz5nt%2BM84Ahm5oeeoZLMTV34WJqOjIWZmrGLzwIWn8%2FuB3pwr4LQ1a8vai%2Bvai8nRKvdWors4zVKXxiSsJnLkjOo%2FKZmpqlMZG%2BOj%2FnZzxcxOrMk%2BH5JFwm3y6Ts68Ro40kd8S4mEvlsZR%2Fl0WBTGC4RM2u4FF4DM5Bkd7%2BFSgWSc2tPYDgu43MBwyCZGr6TDCFgeUn1QIF%2F852M3tSqJfEx0Plg5HgK3yFlltWuB3c3Akq%2BCSVSJ%2BcZqANKnMFt2EkX5myBoFjaZ8404UAe%2BIGhbDPjwK%2BiEB6L1fwS2s0vIYR81TMTW5sq39MK8ZGMbEwS%2BACHuJwxpReU%2BliNKyIL3bfCWirMKnYXkTFxEqULpCCvY3rwW14WrK1o6X2KnPlhgA4GV1CLLh5PzVfBP8Ws5TNyKYUPOEsYDYBK4HIY5v%2FSHnLdRSgTdxRC6SC0UUZ7ASoEmCuGDuDuzkI5wZFfyvkgeVOnu0XVh7eIxYsPAxIW4oY7q1Gt8nFaq0YXTVx7QrrZIGUIsb6aAixZn7Fc5QWaNiCe9D2V0i8%2F3%2F15yw3XTLg3hJZYH2CKyZIu7aacWN90mEB04bb5Kpzz1%2FReGAeP59FIvVOj5T14Zl7RqpqCgOz2rWeh6QqBnzFoGBstSOJJyH%2BA5fv1ySm6rzTMETDmTP%2BDccL4rgz%2Fw9nWqnwjfSTGmjqBAwFLVsOnNbscwBVkXdLCgh61QtcA6mU1Q2VOGUL5TjTlNsQSLGgvLehZIb9nCCO0OcoqDgV02%2B9XgPDOy29p4ZxW%2B1dO1mN0Fmb80mXxzX2BiPj%2BuA2uC3CWsmzjoo1%2BjsOuTCicJWXr2xMf1Ku2sgZvtisl44UK6YMxJEFIPLvCxVQ9tQ%2FI%2BiG38GLFbUi436rINGEYWCWb6A7xdodNj3QbilkyD0pTqly5AvIucO6LkMaIjpLlLreqOTlqfvh4Y%2ByAGkrQe%2BPpqVnOZcpmcp5euXaIlRbeSj2cRjgghUM7OLIBvaUDMG2yvYs0bpGOVdtFbPANQ4yKI1MJqpgM16iL1%2B3MRrJRczqGblXRzZ2HHFKGTsv3AlNo6hJdnc29H3YPGNzV0YRtVdhqE9kHbWStJyUU%2FbEOJOxrWKHkmtZqdl8vbdqD%2BiTfhAbI8UeT6RDeasYyl3sqLVWtHxiYWQwvdTUjlpdO8gjKBQ%2BJUsxZDmW%2BXh1ComMIcQkk2iWXKc76FSd1ONWv1Qqjmztpu230jP%2FlHHeM6hfkpF3g0EWv%2BtSV%2FtjjuUEsME1XOdBFvLVzrOSoFFbo3Nu7%2BDT8BRmSYRa2xzq3vboEIkjNwiI0sOV%2FbDiCOmAWKZgqfiAC39T8UwHH0MLN1ZVDe3u806%2F3pnvnkRDreJeagMTrimMVpTQRsWeqXfpc%2Bdj8vFzUri0LTxugX5AQ5tyvWUDKHpSGT5PUkDNuZegWsrLedHVRartVZbz%2B6G7y2GsfJzPHQLsm2LeWAdrgsboqTnfN33n1%2BVi8F5j6sCqy%2Bb2PlDZQ%2FiSF4WmadC13V1z3mG8MmbBnK4wUUB3mRQnag1Lo9atvfYPmZozMs1KjglvtnP5ceA6lrldRriaGbqRBkbxRTZ2rs3fZRRuAzJU8XnhrG35PV5SYedN49gxvOcri0oD%2FP72Rv22txGGt%2FppD60c2tY8i2jcW35oJ4JNe7OYjtiK2cl%2Fb5vsI8dTGEjbj%2BEBSTHan%2F%2BvvXm%2FspfLD53C2nQv6UltpC6K69evdHeBVLmgoZKG2cup5UMjta4Hhirs0UvFZXkpydbHtbFD0naXZPqqNDPJyjRt4hWTxwxtfyGIGQYU6G3Dxa5KP6alE7WeYHXYvCWYPZvw2lp2jzO5%2Fr3v1%2Bf%2F%2FLnvcDbdIxX12KBt91srJ8%2FX39w0Qv%2BwGs1S8oQHPvS4Wv9OMFkykYJV9mlA56h1CmRxSLOMtvVt51n%2FK3q2N9tOQ9MFTfk%2BnPA5DTCU%2F7OAvd8FVYfzym04U1h7bXMO2Fm3VJB0oyUmfT6v%2B4hQLdhxTJimyiklW9cZ11BDDTXUUEMNNdRQQw011FBDDTXUUEMNNdRQQw01tJ%2F%2BBZuRS6ZSMAAA`);
var CSV_COMM_SKILL_DATA = ``;

var CSV_DATA = ``;

var CSV_ENCODED_DATA = decodeURIComponent(`H4sIAAAAAAAA%2F%2B1aWXPiSBL%2BKxWxDzsd9rpBXDbEPuDb7cZmwFf3eB4KUUA1OrBUQONfv5l1SFVC4I552ZcO%2BkDoqDy%2F%2FDJLdzRkr%2BIsDkdUkKEfJ3B0SX3B4wh%2BDmia4tllJF7FgEZzPEjh%2B3X%2FVQz756%2Fi%2FOLyVXR9%2BOmcTVg0Vv9TOH7m8ISHoQ%2F%2F4PPg%2F5twCg8P6CpOXsUrnB3ON6Sb%2BDMGx9XaUQWezgKWCk4DudwUT9Tg3Kvw5B%2F4Dk%2FoDsjg7oo0SPfhlsCvN70e6cc8RZHh4ieQzTtq6G8zIRZp%2B%2FNnfsTD6TI58uPwc%2BXrbDK%2BrBwtoineYUS5jfh0JqQoniPKM00SHtuywJe6%2FNKDq5gUBH4asEnAfCEPq2TBEpI9hNAg2JA%2FQvqT1D79ophXm97I785tMXs0ERu0VuOo5Yg4XC4WcSKMiNXcXN27b9JcHrlmIId3SIYsmJCZPMgk%2BQVx7sJFdP%2FuWO0hBu8FaDXpwspRc48Lq%2FKLlAnlqWkznS4T6Te9sgwDdX7AVgwfUybMgNdflk8PtjA34QKe4UnfzWgMgTuIp0vmLl%2BXX3KvSQs4TtSWACn6LEl5KlgkSPWqXIyaPxuPf9w4kbSAEJDmkObUomyHkGdEclbHWDYWkZLU8SFDAYYQM%2BLjw2QolYvjPza%2BsF7DFuc7pDZnWVCXSlM1dnEsk%2BUUyrTQ39V5c0bbCkLxIlzEawz4DySMr8%2BewtWjLeEpokW1flTL%2FVYSN3UTN56OmzLpjBQy0msq584T6i8DirfXjuApcLyG232ajDukR%2BECnuKB%2Fo2ImFiXlGshKl%2Fp6Gzmup0nNODRlNxEKY242BA8pTUyuhQ%2FVQl6NIpiQUaMPCQ0nbEdiyaN2WTFT%2BxFv%2FIVrtij70wuFkepSJa%2B2LcgRMF%2FwG9ttRhJAQzK17sdzWZvftfJd%2B7PccFTCCp4VlP6LF90O6yyaHdjqyVjnHgdRwhMsqq0SP6ruYLu8UY0DkPWiBxBZ8toDIEwFHHEZHS1HEl7dMos6eomI1U4DWexP%2B%2BQDM4zBJUnLNSUyWnBBAQc%2FuUsJVPKI5IwPKNuK5f9oTWeH1ecjO3xEKslWKLpyOygmZen7Ku4j3zWJndLWHmyIVQI6s8PYfG8GoGYlzFTQnlgZvzb2MK4zseR3zv3Rqf10MFdHwI3FiyUdj7ZFxGeKQFVlctVcglFC4RWdj%2Bb8SDI7S4PTdjIAzR9jjn6XpKttwd3aBy%2FLJJLW%2B7zZMnHEhiPX8UdFUvkPoU66uU1K48CjTJW0YLKB1d27y%2FIgJwFjEYpA90kClV%2FwagiXH4ZLIeOcDxh5DmWaVFF2DICluZYsarVLNkceFZP2WOnC%2FYw%2BfObk%2FTDgCNHBDGq%2B8Som5KW0wtzkJkkN9g%2FSPP4bSi8oefyj5%2Fch%2FRK4jg0XjASFot%2FNUuXnC%2FmsdYvqW%2BHBD3qudVOIsnHKW%2FuKc2h2tP7zeWbrYhFPSHp75Mxhteu5CnSTuDgmm7KGy2q6X0qD4P8unIJf0ybo%2BfbqS0h%2BDDJYUlLWJotnpstfpYPOeXUMjUkWujzmp%2FWyiV6Y5Xl8ZUTlz0G5JNiZ1LfLVI1R3b1qf1j5FuPx%2FObK1uC7mKRwP3cx%2FRoYXpoIQrlpdi51HLqmdvpIeHTKXolUg7EZ%2Fw7JbK3ytm5VYfKxXyqPI6G7LstJrRcULIZTVA0r1XoszKDeVZno0TH8DcwlqOeTGn9YwbfcG9WELMry%2BQ7Bi39i74jHzxkGTFymnDF%2ByDGTj6QMcsEY8CqizJdSMtFQDfgZDJl6GLyB4%2F84EjCzSdpUqJi4cSJBUg60p9ReA50s228byFTha%2FYzm6uTM8v07vH%2BcmTrecTDeabBMm4d1xQMEv1TMGG0dFi5MBX1QH45czEkOUO7QbZrdQwHFHJXW2ot0Pwq4fj%2BstD7FQAQRMf7iyNHxXrBcdUnWCXYaTFRa5iqIotr3ysqegIqo7MAK87igK92kSp04D1IdyXjJzHvpAWbaAlio2PZyhUmZ01em%2FPFoywDSS%2BtnL74H5z85AeP94XKdM5C%2FEOr26JV7Bl3VR2lfWSAh3q9uezZkQgJngHQlzJ6ivOpGQbQlrlQv8iWdWsq0yT%2FurH4PsicMrCMhAcJ0Je0268dQNXgBTP7uAyK%2BsFFdxk7CrvJKXvjRLHR9lDTAmXyO1J5N4RJNNN5WnxsrblfubCn0mpm7usvz2syERWHbrp1TPvGzKh7jAkwgC7uSr3R91VRT%2B2TIP3yWL9%2Fcx3kxJaG3IVB0i8vRMZRSXE2w50xdKsQD8kfELGOFsgYxqC%2Bm0dM6haKr%2FtyVC9hgmicslXd9PFVeW7O8SahhRYOxBRiSd7Jc%2Bg0GU9lgtG8C0ncup3q3J5bn%2FgRFMDo%2BnjlNjtl4r3dP390iEFAy6WsGw3gLSUSL%2BjR84cUzcsXgmt4h7MWhS7nZHqYmNqolO1p9twdZyTbUWwySSJQwLkCSrcx%2BnzdP10WRNOj3oRTXnEmILXY0fBQq2uW7mkFNQh1NHQWeyXStxVaBYPtjo%2Bo%2BgJQpytaDtnKKXB%2Bb6qh99GTvXgP1WISFK51RYW0KGWE5BapsmL0uSF%2FPFC%2Fkv8ZYIkkVz3P9lU3erECmNhqYnsj8xk6oVE6mrppDYZS5e9qEPyB%2Ftp8ZrSydHz94iHziD5IlixiAwjvpCDtgpGadY5FdHbkHpUsyVjrU665092dcxRPM%2BtwiB3H2v1L%2B6m15MLZyzIqKwrJ3Z7vp09ze1JfGNX2ZYIZuoL5nruhJ0E4736El%2F5njs42NCxrB2NXDK7eNRL%2BKnJUW2nPQLaEPsLAgY%2FRpvz21t3%2BhUn0XQpWxmwn7fdUdrYWqwKhY0MKBIHhnLkD9aJtxtK1UxqPWO6neGpHkwxSMqQbgwHlCUo70c%2FSNiLk5T%2FWdk4TVia0jTFzSbA2rwP1O2%2FHcMNuwdrGF0xb4gesNsKnVitTH6%2BFB%2Ff3m9rSydEbqK3JU%2B5IqCy9d7pgfo2Aa1Joyhah4aTJaFNDjwCoMd0qYZFJoRimZKkDYvGJAaTI8R4W52A5l0ScVWZyG7ZEVd3d5eV65YDGv0NlA0KjkX5a5ZWheBvmKKmQv5UFWgpgcucOtmQUqWIOqv%2BzXPCK2L67np8VQtHx19v3UnaCkoVQHJCA8iHpmoHtjepVA1uSURRCuS9uYI8PZ505luGtSZstdUhIo0QMQ42cF8L1MGpa7WCtC8juYXrO8Tbtf1WbVa9e54c%2FVgwa%2F4%2FnYmRaZsbRdWUW2zFVLA5qJz7CBtMZ17n2QQrL127NzUzJeuFCYteCyENI26fmu8X8%2FM%2F546aFz%2BZv8QtaamlTMyy3jlTtGUSK0%2Bppor6QzIHH%2BIWxiiI122lrp9NoNSEishxS76vJJmw6axUYMoZ%2BjFmgAqQus7McErIQTU%2F%2BFww1o5Zweau%2FnDfcjcBIKu%2FxojgzWZZA2srWy%2FgR13ihw1sbaulVWPqGU2tzbq2c3WHGP6fWUDuiBgGZ7YjvdzjxeZyzBZBvGFQJyJgm0tZxeyOTvHrdB%2BsXpx3f6zux7ZV7pifI1Crae2vFkK9tc3OBipDPTKoIruukoGnJeoWUjX3vBP18lqr5ymN%2FDqylUIZNEvTwjNgwQkUQViTrDmYU4PCwY4d73nr60nScomI3tpstLZ3vbfxzGJIWXNqD%2FM%2BmyApzBTsGDDvdygDnFLRNtpJFbQ%2BuT1OsCSXjtdSWALvzqYoiiFp1vwvJ1p28Nofg6vjW%2BFCYncpIEIE8ipIHHfXrwzqaxYiqrkawp3RWSa90VxuDWJSmMmDNJ41As3g77hAhkZsgt2u27YQ6oP%2B04TCBWLGQrJ3btq8X7z1av3iWA6eO4Us6yYhgkLD27X%2Flql8LIs0BAROnDMykQOGVqfINoilvt4evXHu4MjrTLWwx7JahHY22MkMZszVQqFVhc9Ezy4%2FyLq%2Bzo4ebvN2Og2TwlsyWCyEgDRoHkuU2NpGzQzSMH%2Fy2epAoWinUCyktlqsfKzTiyH4BfLcrtp4t1PeTopDx8AHVrh4CBpWH97JNwNyIHWDx%2BwMlFlkfd6vv%2FRbTlr0ZzGL%2BE%2FQ2N0kK8mIugOchjQiQciVHrkDMHfwIA2QbBugo9DQsIua9ZqG2%2BiQ3DZNs7F6pilKucrz3jxIGxM7CL5Np9AnpxxqdrNlt7dZL29XC9UEORPIjt7%2Bc0Rrl%2BzvunucGTU0%2BWIjg%2BcVtht2TJxsDJLoY5BIPq%2B0g57f3ny7%2B%2BLOOIMxuV5GAh4KdaF2gmsXtkcLaeDSCNOM3DppEELAW8PmTl7FC3RguKYLFQBWGFtzj0OygD4QUocM%2BmTMJxOWMAiQQ5VNdraVq9y9qd1NHp0OBd8mJKccTLYAfaooRXFfsMARPOP1bb%2BqwM96033e397kdGfBhc4NDJRhX92Nh4mA1QxDiBNneUz5Nlpno0ebO0rFZvW1dyGcUICy26OpfC%2BtKdfcaZamGUrmEL69bdwh%2BdkMqzJYIitOZUkr29%2FMHwIXq5dG5fXqHSALFWtqarkFhPpW9VZpdqsKGgmitX3DTP%2FxPZg%2B9reCRhFIoAwnha7WNozqcEt3tlTK6iZB9uClO%2FINly3K0cDjAkjAGHIu205ud5Src%2FaqwM%2B0oMpsbeJuppWp%2B62yeqmJiquumC2hgEFHHENqqxPF8URVv3FXG8gv8O9fFz99GnBQ829rA%2FLlYGAIWzzJfWRH7acO%2BesmShc8YX8Td4%2BnsIWgDCdHGmq%2BqF46xm5MMqpyEQYSZWGRMxqyIBZ%2FEyufDrzBjkbzOZxt3uoblzzuMc1ZHELnMdbVsuyDNxD1iF9Z8lkhI4BzHCwFQ%2BRIhOyXKAnYFBxMkw1gLoTGIZzEoF4BBlBATbhRxGs5hiM%2Flqm6axlJFkbwDb1xHB4pla4op4dAUiA9zNAZZTXfPtaqcGupXms2r1fOVJBdyq0F%2BSKDz9EFSRyLVII6WccJlCQoI2kah%2FAbig1FD68eJdBVzA5lQYRwZmTCo3FKuEhJMtuImdFHtoBRHHIf25fTOJ5j4OHDzxlOZbM26GPNtm8u3b6dP5xX7v5Uyp3GSyVyOqPjeJ1qDeZM%2FohkPAbWCe1THEF5BQ1R%2FvWMpwt8EWEBpuFQJfQAWtJ%2B%2BBESHsVQb42a9t%2BfURZgJNIViwJ8T37EhXrpzJp9fKykBLcusLwde7rfF8OeuNcTs2uG40aUioWjeMxD9B%2FmtZqhBXQNDoJuhvrYJU4g5NYgHs6fZBiiImAGSvw4DaF5E4yFeE5yACjtSUwBIOEHiOx5BKRE%2B%2FRGvPsxFaDu1xiC%2BZmnY3yfy6Htv6Dpu2C%2BztrSMe1Zc9O81bNjfGdsOVZuQ33BL%2BApUCn3IQsRssCH4D4Sj1I%2B5jQCdHqHVI2DsbJTCuHI1J1QLcDFVGejmnmkZMMEminh%2BEyt7%2B%2FP78%2Fvz%2B%2FP78%2Fvz%2F%2Fv8z%2FZu8KX%2BzcAAA%3D%3D`);
