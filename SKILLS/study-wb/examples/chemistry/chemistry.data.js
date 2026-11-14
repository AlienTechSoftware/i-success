window.STUDY_DATA = {
 "page": {
  "title": "Chemistry Study Page (example)",
  "storageKey": "studywb-example-chemistry",
  "heading": "Introductory Chemistry - Moles and the Periodic Table",
  "subtitle": "Invented example content · open the Periodic table tool in the workbench for atomic masses"
 },
 "timer": {
  "minutes": 45,
  "multiplier": 1,
  "note": "Example value; a real page states where its time limit comes from."
 },
 "reference": [
  {
   "title": "Molar mass in one line",
   "html": "<p>Molar mass (g/mol) = sum of (atoms of each element × its atomic mass). Moles = grams ÷ molar mass; grams = moles × molar mass.</p>"
  }
 ],
 "howto": {
  "molar": {
   "title": "Molar mass",
   "html": "<h3>What this is about</h3><p>The mass of one mole of a substance, from the atomic masses of its elements.</p>\n<h3>How to get there</h3><ol><li>Count each element's atoms in the formula <span class=\"star\">(*)</span>.</li><li>Multiply each count by the element's atomic mass (Periodic table tool, \"Use mass in calculator\").</li><li>Add them up.</li></ol>\n<p class=\"memory\"><strong>Say it out loud:</strong> \"Count, times mass, add.\"</p>\n<div class=\"surprise\"><strong>Trap:</strong> the subscript belongs to the element before it. In C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> there are 12 hydrogens, not 6.</div>\n"
  },
  "stoich": {
   "title": "Grams to moles to grams",
   "html": "<h3>How to get there</h3><ol><li>Grams of what you have ÷ its molar mass = moles <span class=\"star\">(*)</span>.</li><li>Use the balanced equation's ratio to convert moles.</li><li>Moles × molar mass of what you want = grams.</li></ol>\n<p class=\"memory\"><strong>Say it out loud:</strong> \"Grams to moles, ratio, moles to grams.\"</p>\n"
  },
  "classes": {
   "title": "Element categories",
   "html": "<p>Find the element on the table; its colour is its category. Group 1 (except H) = alkali metals, group 17 = halogens, group 18 = noble gases, the staircase between metals and nonmetals = metalloids.</p>"
  }
 },
 "groups": [
  {
   "id": "Moles",
   "caption": "Molar mass and stoichiometry",
   "problems": [
    {
     "name": "Worksheet 1 Q1 Molar masses (no key)",
     "label": "calculated",
     "files": [
      "sources/worksheet_1.html"
     ],
     "howto": "molar",
     "steps": [
      {
       "say": "H<sub>2</sub>O = 2 × 1.0080 + 15.999 = <strong>18.02</strong>",
       "fill": {
        "h2o": 18.02
       }
      },
      {
       "say": "CO<sub>2</sub> = 12.011 + 2 × 15.999 = <strong>44.01</strong>",
       "fill": {
        "co2": 44.01
       }
      },
      {
       "say": "NaCl = 22.9897693 + 35.45 = <strong>58.44</strong>",
       "fill": {
        "nacl": 58.44
       }
      },
      {
       "say": "C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> = 6 × 12.011 + 12 × 1.0080 + 6 × 15.999 = <strong>180.16</strong>",
       "fill": {
        "glu": 180.16
       }
      }
     ],
     "keys": [
      {
       "keys": [
        1.008,
        "×",
        2,
        "+",
        15.999,
        "="
       ],
       "meaning": "water",
       "value": 18.015
      },
      {
       "keys": [
        15.999,
        "×",
        2,
        "+",
        12.011,
        "="
       ],
       "meaning": "carbon dioxide",
       "value": 44.009
      },
      {
       "keys": [
        22.9897693,
        "+",
        35.45,
        "="
       ],
       "meaning": "sodium chloride",
       "value": 58.4398
      },
      "Glucose: 6 × 12.011 = 72.066; 12 × 1.008 = 12.096; 6 × 15.999 = 95.994; then add.",
      {
       "keys": [
        72.066,
        "+",
        12.096,
        "+",
        95.994,
        "="
       ],
       "meaning": "glucose",
       "value": 180.156
      }
     ],
     "body": "<p><strong>Molar Mass</strong></p><p>Find each molar mass in g/mol, to two decimal places.</p>\n<table class=\"answers\"><tbody><tr><td>Water, H<sub>2</sub>O</td><td>{{box:h2o}} g/mol</td></tr><tr><td>Carbon dioxide, CO<sub>2</sub></td><td>{{box:co2}} g/mol</td></tr><tr><td>Sodium chloride, NaCl</td><td>{{box:nacl}} g/mol</td></tr><tr><td>Glucose, C<sub>6</sub>H<sub>12</sub>O<sub>6</sub></td><td>{{box:glu}} g/mol</td></tr></tbody></table>",
     "fields": {
      "h2o": {
       "answer": 18.02,
       "tol": 0.01,
       "cls": "mid"
      },
      "co2": {
       "answer": 44.01,
       "tol": 0.01,
       "cls": "mid"
      },
      "nacl": {
       "answer": 58.44,
       "tol": 0.01,
       "cls": "mid"
      },
      "glu": {
       "answer": 180.16,
       "tol": 0.01,
       "cls": "mid"
      }
     }
    },
    {
     "name": "Worksheet 1 Q2 Hydrogen to water (no key)",
     "label": "calculated",
     "files": [
      "sources/worksheet_1.html"
     ],
     "howto": "stoich",
     "steps": [
      {
       "say": "Molar mass of H<sub>2</sub> = 2 × 1.0080 = 2.016. Moles = 10.0 ÷ 2.016 = <strong>4.960 mol</strong> <span class=\"star\">(*)</span>.",
       "fill": {
        "molh2": 4.96
       }
      },
      {
       "say": "The ratio H<sub>2</sub> : H<sub>2</sub>O is 2 : 2, so 4.960 mol of water. Grams = 4.960 × 18.015 = <strong>89.36 g</strong>.",
       "fill": {
        "gh2o": 89.36
       }
      }
     ],
     "keys": [
      {
       "keys": [
        10,
        "÷",
        2.016,
        "="
       ],
       "meaning": "moles of hydrogen",
       "value": 4.9603
      },
      {
       "keys": [
        4.9603,
        "×",
        18.015,
        "="
       ],
       "meaning": "grams of water",
       "value": 89.36
      }
     ],
     "body": "<p><strong>Stoichiometry</strong></p><p>2 H<sub>2</sub> + O<sub>2</sub> → 2 H<sub>2</sub>O. You have 10.0 g of H<sub>2</sub>.</p>\n<table class=\"answers\"><tbody><tr><td>Moles of H<sub>2</sub></td><td>{{box:molh2}} mol</td></tr><tr><td>Grams of water formed</td><td>{{box:gh2o}} g</td></tr></tbody></table>",
     "fields": {
      "molh2": {
       "answer": 4.96,
       "tol": 0.005,
       "cls": "mid"
      },
      "gh2o": {
       "answer": 89.36,
       "tol": 0.05,
       "cls": "mid"
      }
     }
    },
    {
     "name": "[AI#1] Limestone to carbon dioxide",
     "label": "generated",
     "howto": "stoich",
     "steps": [
      {
       "say": "CaCO<sub>3</sub> = 40.08 + 12.011 + 3 × 15.999 = <strong>100.09</strong>.",
       "fill": {
        "mmc": 100.09
       }
      },
      {
       "say": "50.0 ÷ 100.088 = <strong>0.4996 mol</strong>.",
       "fill": {
        "molc": 0.4996
       }
      },
      {
       "say": "Ratio 1 : 1, so 0.4996 mol CO<sub>2</sub> × 44.009 = <strong>21.99 g</strong>.",
       "fill": {
        "gco2": 21.99
       }
      }
     ],
     "body": "<p>CaCO<sub>3</sub> → CaO + CO<sub>2</sub>. Heating 50.0 g of CaCO<sub>3</sub>: how much CO<sub>2</sub> forms?</p>\n<table class=\"answers\"><tbody><tr><td>Molar mass of CaCO<sub>3</sub></td><td>{{box:mmc}} g/mol</td></tr><tr><td>Moles of CaCO<sub>3</sub></td><td>{{box:molc}} mol</td></tr><tr><td>Grams of CO<sub>2</sub></td><td>{{box:gco2}} g</td></tr></tbody></table>",
     "fields": {
      "mmc": {
       "answer": 100.09,
       "tol": 0.01,
       "cls": "mid"
      },
      "molc": {
       "answer": 0.4996,
       "tol": 0.0005,
       "cls": "mid"
      },
      "gco2": {
       "answer": 21.99,
       "tol": 0.02,
       "cls": "mid"
      }
     }
    }
   ]
  },
  {
   "id": "Table",
   "caption": "Reading the periodic table",
   "problems": [
    {
     "name": "[AI#2] Which category?",
     "label": "generated",
     "howto": "classes",
     "steps": [
      {
       "say": "<strong>Alkali metal:</strong><br>(a) Sodium (Na): group 1.",
       "fill": {
        "c0": "Alkali metal"
       }
      },
      {
       "say": "<strong>Halogen:</strong><br>(b) Chlorine (Cl): group 17.",
       "fill": {
        "c1": "Halogen"
       }
      },
      {
       "say": "<strong>Metalloid:</strong><br>(c) Silicon (Si): on the staircase.",
       "fill": {
        "c2": "Metalloid"
       }
      },
      {
       "say": "<strong>Transition metal:</strong><br>(d) Iron (Fe): group 8.",
       "fill": {
        "c3": "Transition metal"
       }
      },
      {
       "say": "<strong>Noble gas:</strong><br>(e) Neon (Ne): group 18.",
       "fill": {
        "c4": "Noble gas"
       }
      }
     ],
     "body": "<p>Use the Periodic table tool. Give each element's category.</p>\n<table class=\"given\"><tbody><tr><td>(a)</td><td>Sodium (Na)</td><td>{{pick:c0}}</td></tr><tr><td>(b)</td><td>Chlorine (Cl)</td><td>{{pick:c1}}</td></tr><tr><td>(c)</td><td>Silicon (Si)</td><td>{{pick:c2}}</td></tr><tr><td>(d)</td><td>Iron (Fe)</td><td>{{pick:c3}}</td></tr><tr><td>(e)</td><td>Neon (Ne)</td><td>{{pick:c4}}</td></tr></tbody></table>",
     "fields": {
      "c0": {
       "answer": "Alkali metal",
       "options": [
        "Alkali metal",
        "Halogen",
        "Metalloid",
        "Transition metal",
        "Noble gas"
       ]
      },
      "c1": {
       "answer": "Halogen",
       "options": [
        "Alkali metal",
        "Halogen",
        "Metalloid",
        "Transition metal",
        "Noble gas"
       ]
      },
      "c2": {
       "answer": "Metalloid",
       "options": [
        "Alkali metal",
        "Halogen",
        "Metalloid",
        "Transition metal",
        "Noble gas"
       ]
      },
      "c3": {
       "answer": "Transition metal",
       "options": [
        "Alkali metal",
        "Halogen",
        "Metalloid",
        "Transition metal",
        "Noble gas"
       ]
      },
      "c4": {
       "answer": "Noble gas",
       "options": [
        "Alkali metal",
        "Halogen",
        "Metalloid",
        "Transition metal",
        "Noble gas"
       ]
      }
     }
    }
   ]
  }
 ]
};
