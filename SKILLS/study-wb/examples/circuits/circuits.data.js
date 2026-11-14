window.STUDY_DATA = {
 "page": {
  "title": "Circuits Study Page (example)",
  "storageKey": "studywb-example-circuits",
  "heading": "DC Circuits - Ohm's Law, Series and Parallel",
  "subtitle": "Invented example content"
 },
 "timer": {
  "minutes": 50,
  "multiplier": 1,
  "note": "Example value."
 },
 "reference": [
  {
   "title": "The three equations",
   "html": "<p><strong>V = I × R</strong> · <strong>P = V × I</strong> · series: R = R1 + R2 + … · parallel: 1/R = 1/R1 + 1/R2 + … (two resistors: R1 × R2 ÷ (R1 + R2)).</p>"
  }
 ],
 "howto": {
  "ohm": {
   "title": "Ohm's law and power",
   "html": "<ol><li>Current I = V ÷ R <span class=\"star\">(*)</span>.</li><li>Power P = V × I (or I² × R).</li></ol>\n<p class=\"memory\"><strong>Say it out loud:</strong> \"Volts over ohms is amps; volts times amps is watts.\"</p>\n"
  },
  "series": {
   "title": "Series resistors",
   "html": "<ol><li>Add the resistances.</li><li>One current flows through all of them: I = V ÷ R<sub>total</sub> <span class=\"star\">(*)</span>.</li><li>Each resistor's voltage = I × its resistance; they add up to the supply.</li></ol>\n<div class=\"surprise\"><strong>Trap:</strong> the answer asks for mA. Multiply amps by 1,000.</div>\n"
  },
  "parallel": {
   "title": "Parallel resistors",
   "html": "<ol><li>Two resistors: R = R1 × R2 ÷ (R1 + R2). The result is smaller than either.</li><li>Every branch has the full supply voltage; each branch current = V ÷ its resistance.</li><li>Branch currents add up to the total.</li></ol>\n<p class=\"memory\"><strong>Say it out loud:</strong> \"Product over sum. Same voltage, currents add.\"</p>\n"
  }
 },
 "groups": [
  {
   "id": "Ohm",
   "caption": "Ohm's law and power",
   "problems": [
    {
     "name": "Lab sheet 1 Q1 Current and power (no key)",
     "label": "calculated",
     "files": [
      "sources/lab_sheet_1.html"
     ],
     "howto": "ohm",
     "steps": [
      {
       "say": "I = 12 ÷ 4 = <strong>3 A</strong> <span class=\"star\">(*)</span>",
       "fill": {
        "i": 3
       }
      },
      {
       "say": "P = 12 × 3 = <strong>36 W</strong>",
       "fill": {
        "p": 36
       }
      }
     ],
     "keys": [
      {
       "keys": [
        12,
        "÷",
        4,
        "="
       ],
       "meaning": "current",
       "value": 3
      },
      {
       "keys": [
        12,
        "×",
        3,
        "="
       ],
       "meaning": "power",
       "value": 36
      }
     ],
     "body": "<p>A 4 Ω resistor is connected to a 12 V battery.</p>\n<table class=\"answers\"><tbody><tr><td>Current</td><td>{{box:i}} A</td></tr><tr><td>Power</td><td>{{box:p}} W</td></tr></tbody></table>",
     "fields": {
      "i": {
       "answer": 3,
       "tol": 0.01,
       "cls": "mid"
      },
      "p": {
       "answer": 36,
       "tol": 0.1,
       "cls": "mid"
      }
     }
    },
    {
     "name": "[AI#1] Which unit is power?",
     "label": "generated",
     "howto": "ohm",
     "steps": [
      {
       "say": "Power is energy per second: the <strong>watt (D)</strong>.",
       "fill": {
        "unit": "D"
       }
      }
     ],
     "body": "<p>Which unit measures electrical power?</p><ol type=\"A\" style=\"padding-left:26px\"><li>Ohm</li><li>Volt</li><li>Ampere</li><li>Watt</li></ol><p>Answer: {{pick:unit}}</p>",
     "fields": {
      "unit": {
       "answer": "D",
       "options": [
        "A",
        "B",
        "C",
        "D"
       ]
      }
     }
    }
   ]
  },
  {
   "id": "Networks",
   "caption": "Series and parallel",
   "problems": [
    {
     "name": "Lab sheet 1 Q2 Series string (no key)",
     "label": "calculated",
     "files": [
      "sources/lab_sheet_1.html"
     ],
     "howto": "series",
     "steps": [
      {
       "say": "R = 100 + 220 + 330 = <strong>650 Ω</strong>",
       "fill": {
        "rt": 650
       }
      },
      {
       "say": "I = 9 ÷ 650 = 0.013846 A = <strong>13.85 mA</strong> <span class=\"star\">(*)</span>",
       "fill": {
        "ima": 13.85
       }
      },
      {
       "say": "V = 0.013846 × 220 = <strong>3.05 V</strong>",
       "fill": {
        "v2": 3.05
       }
      }
     ],
     "keys": [
      {
       "keys": [
        9,
        "÷",
        650,
        "×",
        1000,
        "="
       ],
       "meaning": "current in mA",
       "value": 13.846
      },
      {
       "keys": [
        9,
        "÷",
        650,
        "×",
        220,
        "="
       ],
       "meaning": "volts across 220 Ω",
       "value": 3.046
      }
     ],
     "body": "<p>100 Ω, 220 Ω and 330 Ω in series across 9 V.</p>\n<table class=\"answers\"><tbody><tr><td>Total resistance</td><td>{{box:rt}} Ω</td></tr><tr><td>Current</td><td>{{box:ima}} mA</td></tr><tr><td>Voltage across 220 Ω</td><td>{{box:v2}} V</td></tr></tbody></table>",
     "fields": {
      "rt": {
       "answer": 650,
       "tol": 0.5,
       "cls": "mid"
      },
      "ima": {
       "answer": 13.85,
       "tol": 0.01,
       "cls": "mid"
      },
      "v2": {
       "answer": 3.05,
       "tol": 0.01,
       "cls": "mid"
      }
     }
    },
    {
     "name": "Lab sheet 1 Q3 Two in parallel (no key)",
     "label": "calculated",
     "files": [
      "sources/lab_sheet_1.html"
     ],
     "howto": "parallel",
     "steps": [
      {
       "say": "R = 6 × 3 ÷ (6 + 3) = <strong>2 Ω</strong>",
       "fill": {
        "rp": 2
       }
      },
      {
       "say": "I = 12 ÷ 2 = <strong>6 A</strong>",
       "fill": {
        "it": 6
       }
      },
      {
       "say": "Branches: 12 ÷ 6 = <strong>2 A</strong>, 12 ÷ 3 = <strong>4 A</strong>; 2 + 4 = 6 checks.",
       "fill": {
        "i6": 2,
        "i3": 4
       }
      }
     ],
     "keys": [
      {
       "keys": [
        6,
        "×",
        3,
        "÷",
        9,
        "="
       ],
       "meaning": "product over sum (9 = 6 + 3)",
       "value": 2
      }
     ],
     "body": "<p>6 Ω and 3 Ω in parallel across 12 V.</p>\n<table class=\"given\"><thead><tr><th>Quantity</th><th>Value</th></tr></thead><tbody><tr><td>Equivalent resistance</td><td>{{box:rp}} Ω</td></tr><tr><td>Total current</td><td>{{box:it}} A</td></tr><tr><td>Current in 6 Ω</td><td>{{box:i6}} A</td></tr><tr><td>Current in 3 Ω</td><td>{{box:i3}} A</td></tr></tbody></table>",
     "fields": {
      "rp": {
       "answer": 2,
       "tol": 0.01,
       "cls": "mid"
      },
      "it": {
       "answer": 6,
       "tol": 0.01,
       "cls": "mid"
      },
      "i6": {
       "answer": 2,
       "tol": 0.01,
       "cls": "mid"
      },
      "i3": {
       "answer": 4,
       "tol": 0.01,
       "cls": "mid"
      }
     }
    },
    {
     "name": "[AI#2] TWIST: series plus parallel",
     "label": "generated",
     "howto": "parallel",
     "steps": [
      {
       "say": "Collapse the pair first: 20 × 20 ÷ 40 = 10 Ω. Total = 10 + 10 = <strong>20 Ω</strong>.",
       "fill": {
        "rt": 20
       }
      },
      {
       "say": "I = 24 ÷ 20 = <strong>1.2 A</strong> <span class=\"star\">(*)</span>",
       "fill": {
        "it": 1.2
       }
      },
      {
       "say": "The pair gets 1.2 × 10 = <strong>12 V</strong>; each 20 Ω carries 12 ÷ 20 = <strong>0.6 A</strong>.",
       "fill": {
        "vp": 12,
        "ib": 0.6
       }
      },
      {
       "say": "P = 1.2² × 10 = <strong>14.4 W</strong>",
       "fill": {
        "p10": 14.4
       }
      }
     ],
     "body": "<p>A 10 Ω resistor is in series with two 20 Ω resistors that are in parallel with each other. The supply is 24 V.</p>\n<table class=\"answers\"><tbody><tr><td>Total resistance</td><td>{{box:rt}} Ω</td></tr><tr><td>Supply current</td><td>{{box:it}} A</td></tr><tr><td>Voltage across the parallel pair</td><td>{{box:vp}} V</td></tr><tr><td>Current in one 20 Ω resistor</td><td>{{box:ib}} A</td></tr><tr><td>Power in the 10 Ω resistor</td><td>{{box:p10}} W</td></tr></tbody></table>",
     "fields": {
      "rt": {
       "answer": 20,
       "tol": 0.01,
       "cls": "mid"
      },
      "it": {
       "answer": 1.2,
       "tol": 0.01,
       "cls": "mid"
      },
      "vp": {
       "answer": 12,
       "tol": 0.01,
       "cls": "mid"
      },
      "ib": {
       "answer": 0.6,
       "tol": 0.01,
       "cls": "mid"
      },
      "p10": {
       "answer": 14.4,
       "tol": 0.05,
       "cls": "mid"
      }
     }
    }
   ]
  }
 ]
};
