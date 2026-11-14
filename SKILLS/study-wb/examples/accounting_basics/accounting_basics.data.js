window.STUDY_DATA = {
 "page": {
  "title": "Accounting Basics Study Page (example)",
  "storageKey": "studywb-example-accounting-basics",
  "heading": "Bookkeeping Basics - Equation, Entries and Adjustments",
  "subtitle": "Invented example content"
 },
 "timer": {
  "minutes": 40,
  "multiplier": 1,
  "note": "Example value."
 },
 "reference": [
  {
   "title": "Two rules",
   "html": "<p><strong>Assets = Liabilities + Equity</strong> · <strong>Debit</strong> raises assets and expenses · <strong>Credit</strong> raises liabilities, equity and revenue.</p>"
  }
 ],
 "howto": {
  "equation": {
   "title": "The accounting equation",
   "html": "<ol><li>Assets = Liabilities + Equity <span class=\"star\">(*)</span>.</li><li>Solve for the missing piece: Equity = Assets − Liabilities.</li><li>Net income adds to equity; owner withdrawals take from it.</li></ol>\n<p class=\"memory\"><strong>Say it out loud:</strong> \"What the shop has equals what it owes plus what the owner owns.\"</p>\n"
  },
  "entry": {
   "title": "Debits and credits",
   "html": "<ol><li>Name the accounts that change.</li><li>Asset or expense going up: <strong>debit</strong>. Liability, equity or revenue going up: <strong>credit</strong>.</li><li>Total debits equal total credits <span class=\"star\">(*)</span>.</li></ol>\n<div class=\"surprise\"><strong>Trap:</strong> revenue is earned when the work is done, not when the cash arrives.</div>\n"
  },
  "depreciation": {
   "title": "Straight-line depreciation",
   "html": "<ol><li>Depreciable cost = cost − salvage value.</li><li>Yearly depreciation = depreciable cost ÷ useful life <span class=\"star\">(*)</span>.</li><li>Book value = cost − accumulated depreciation.</li></ol>\n<p class=\"memory\"><strong>Say it out loud:</strong> \"Cost minus salvage, spread evenly over the life.\"</p>\n"
  }
 },
 "groups": [
  {
   "id": "Basics",
   "caption": "The equation and the accounts",
   "problems": [
    {
     "name": "[AI#1] Solve the equation",
     "label": "generated",
     "howto": "equation",
     "steps": [
      {
       "say": "Equity = 48,000 − 17,500 = <strong>$30,500</strong> <span class=\"star\">(*)</span>",
       "fill": {
        "eq": 30500
       }
      },
      {
       "say": "Net income raises equity to 32,800; assets = 17,500 + 32,800 = <strong>$50,300</strong>",
       "fill": {
        "a2": 50300
       }
      }
     ],
     "keys": [
      {
       "keys": [
        48000,
        "−",
        17500,
        "="
       ],
       "meaning": "equity",
       "value": 30500
      },
      {
       "keys": [
        48000,
        "+",
        2300,
        "="
       ],
       "meaning": "assets after net income",
       "value": 50300
      }
     ],
     "body": "<p>Juniper Lane Bike Repair has assets of $48,000 and liabilities of $17,500.</p>\n<table class=\"answers\"><tbody><tr><td>Owner's equity</td><td>$ {{box:eq}}</td></tr><tr><td>Assets after a month with $2,300 net income (liabilities unchanged)</td><td>$ {{box:a2}}</td></tr></tbody></table>",
     "fields": {
      "eq": {
       "answer": 30500,
       "cls": "mid"
      },
      "a2": {
       "answer": 50300,
       "cls": "mid"
      }
     }
    },
    {
     "name": "[AI#2] Sort the accounts",
     "label": "generated",
     "howto": "entry",
     "steps": [
      {
       "say": "<strong>Asset:</strong><br>(a) Cash: something the shop owns.<br>(b) Repair tools: owned and used for years.",
       "fill": {
        "c0": "Asset",
        "c1": "Asset"
       }
      },
      {
       "say": "<strong>Liability:</strong><br>(c) Accounts payable: owed to a parts supplier.<br>(d) Unearned revenue: work customers paid for and the shop still owes.",
       "fill": {
        "c2": "Liability",
        "c3": "Liability"
       }
      },
      {
       "say": "<strong>Equity:</strong><br>(e) Owner's capital: the owner's stake.",
       "fill": {
        "c4": "Equity"
       }
      },
      {
       "say": "<strong>Revenue:</strong><br>(f) Repair revenue: earned by doing repairs.",
       "fill": {
        "c5": "Revenue"
       }
      },
      {
       "say": "<strong>Expense:</strong><br>(g) Shop rent: used up to earn this month's revenue.",
       "fill": {
        "c6": "Expense"
       }
      }
     ],
     "body": "<p>Classify each of the shop's accounts.</p>\n<table class=\"given\"><tbody><tr><td>(a)</td><td>Cash</td><td>{{pick:c0}}</td></tr><tr><td>(b)</td><td>Repair tools</td><td>{{pick:c1}}</td></tr><tr><td>(c)</td><td>Accounts payable</td><td>{{pick:c2}}</td></tr><tr><td>(d)</td><td>Unearned revenue</td><td>{{pick:c3}}</td></tr><tr><td>(e)</td><td>Owner's capital</td><td>{{pick:c4}}</td></tr><tr><td>(f)</td><td>Repair revenue</td><td>{{pick:c5}}</td></tr><tr><td>(g)</td><td>Shop rent</td><td>{{pick:c6}}</td></tr></tbody></table>",
     "fields": {
      "c0": {
       "answer": "Asset",
       "options": [
        "Asset",
        "Liability",
        "Equity",
        "Revenue",
        "Expense"
       ]
      },
      "c1": {
       "answer": "Asset",
       "options": [
        "Asset",
        "Liability",
        "Equity",
        "Revenue",
        "Expense"
       ]
      },
      "c2": {
       "answer": "Liability",
       "options": [
        "Asset",
        "Liability",
        "Equity",
        "Revenue",
        "Expense"
       ]
      },
      "c3": {
       "answer": "Liability",
       "options": [
        "Asset",
        "Liability",
        "Equity",
        "Revenue",
        "Expense"
       ]
      },
      "c4": {
       "answer": "Equity",
       "options": [
        "Asset",
        "Liability",
        "Equity",
        "Revenue",
        "Expense"
       ]
      },
      "c5": {
       "answer": "Revenue",
       "options": [
        "Asset",
        "Liability",
        "Equity",
        "Revenue",
        "Expense"
       ]
      },
      "c6": {
       "answer": "Expense",
       "options": [
        "Asset",
        "Liability",
        "Equity",
        "Revenue",
        "Expense"
       ]
      }
     }
    },
    {
     "name": "[AI#3] Which statement?",
     "label": "generated",
     "steps": [
      {
       "say": "Revenue minus expenses over a period is the <strong>income statement (B)</strong>.",
       "fill": {
        "stmt": "B"
       }
      }
     ],
     "body": "<p>Which statement reports revenue and expenses for a period of time?</p><ol type=\"A\" style=\"padding-left:26px\"><li>Balance sheet</li><li>Income statement</li><li>Statement of cash flows</li><li>Trial balance</li></ol><p>Answer: {{pick:stmt}}</p>",
     "fields": {
      "stmt": {
       "answer": "B",
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
   "id": "Entries",
   "caption": "Journal entries and their effects",
   "problems": [
    {
     "name": "[AI#4] Repairs on account",
     "label": "generated",
     "howto": "entry",
     "steps": [
      {
       "say": "The customers owe the shop: an asset goes up, so <strong>debit Accounts receivable $850</strong>.",
       "fill": {
        "d1": "Debit",
        "a1": 850
       }
      },
      {
       "say": "The work is done, so the revenue is earned now: <strong>credit Repair revenue $850</strong> <span class=\"star\">(*)</span>.",
       "fill": {
        "d2": "Credit",
        "a2": 850
       }
      }
     ],
     "body": "<p>The shop repaired bikes for $850. The customers will pay next month.</p>\n<table class=\"given\"><thead><tr><th>Account</th><th>Debit or credit</th><th>Amount</th></tr></thead><tbody><tr><td>Accounts receivable</td><td>{{box:d1}}</td><td>$ {{box:a1}}</td></tr><tr><td>Repair revenue</td><td>{{box:d2}}</td><td>$ {{box:a2}}</td></tr></tbody></table>",
     "fields": {
      "d1": {
       "answer": "Debit",
       "options": [
        "Debit",
        "Credit"
       ],
       "style": "min-width:90px"
      },
      "a1": {
       "answer": 850,
       "cls": "mid"
      },
      "d2": {
       "answer": "Credit",
       "options": [
        "Debit",
        "Credit"
       ],
       "style": "min-width:90px"
      },
      "a2": {
       "answer": 850,
       "cls": "mid"
      }
     }
    },
    {
     "name": "[AI#5] Statement effects",
     "label": "generated",
     "howto": "entry",
     "steps": [
      {
       "say": "Rent - cash down 1,200, equity down 1,200 through a 1,200 expense, net income down 1,200.",
       "fill": {
        "sr0c0": -1200,
        "sr0a0": "Cash",
        "sr0c3": -1200,
        "sr0a3": "Ret Earn",
        "sr0c5": 1200,
        "sr0a5": "Rent Exp",
        "sr0c6": -1200
       }
      },
      {
       "say": "Tools - an asset up 900 and a liability up 900. No income statement effect.",
       "fill": {
        "sr1c1": 900,
        "sr1a1": "Tools",
        "sr1c2": 900,
        "sr1a2": "Accts Pay"
       }
      }
     ],
     "body": "<p>Record two transactions: the shop paid $1,200 rent in cash, and bought $900 of tools on account.</p>\n<table class=\"fset\"><thead><tr><th rowspan=\"2\">Transaction</th><th colspan=\"4\">BALANCE SHEET</th><th colspan=\"3\">INCOME STATEMENT</th></tr><tr><th>Cash</th><th>Noncash assets</th><th>Liabilities</th><th>Equity</th><th>Revenue</th><th>Expenses</th><th>Net income</th></tr></thead><tbody><tr><td>Paid rent</td><td class=\"input-cell\">{{box:sr0c0}}</td><td class=\"input-cell\">{{box:sr0c1}}</td><td class=\"input-cell\">{{box:sr0c2}}</td><td class=\"input-cell\">{{box:sr0c3}}</td><td class=\"input-cell\">{{box:sr0c4}}</td><td class=\"input-cell\">{{box:sr0c5}}</td><td class=\"net-cell\">{{box:sr0c6}}</td></tr><tr class=\"account-row\"><td></td><td class=\"input-cell\">{{pick:sr0a0}}</td><td class=\"input-cell\">{{pick:sr0a1}}</td><td class=\"input-cell\">{{pick:sr0a2}}</td><td class=\"input-cell\">{{pick:sr0a3}}</td><td class=\"input-cell\">{{pick:sr0a4}}</td><td class=\"input-cell\">{{pick:sr0a5}}</td><td class=\"net-cell\"></td></tr><tr><td>Tools on account</td><td class=\"input-cell\">{{box:sr1c0}}</td><td class=\"input-cell\">{{box:sr1c1}}</td><td class=\"input-cell\">{{box:sr1c2}}</td><td class=\"input-cell\">{{box:sr1c3}}</td><td class=\"input-cell\">{{box:sr1c4}}</td><td class=\"input-cell\">{{box:sr1c5}}</td><td class=\"net-cell\">{{box:sr1c6}}</td></tr><tr class=\"account-row\"><td></td><td class=\"input-cell\">{{pick:sr1a0}}</td><td class=\"input-cell\">{{pick:sr1a1}}</td><td class=\"input-cell\">{{pick:sr1a2}}</td><td class=\"input-cell\">{{pick:sr1a3}}</td><td class=\"input-cell\">{{pick:sr1a4}}</td><td class=\"input-cell\">{{pick:sr1a5}}</td><td class=\"net-cell\"></td></tr></tbody></table>",
     "fields": {
      "sr0c0": {
       "answer": -1200
      },
      "sr0a0": {
       "answer": "Cash",
       "options": [
        "N/A",
        "Cash",
        "Tools",
        "Accts Pay",
        "Ret Earn",
        "Rent Exp"
       ]
      },
      "sr0c1": {
       "answer": 0
      },
      "sr0a1": {
       "answer": "N/A",
       "options": [
        "N/A",
        "Cash",
        "Tools",
        "Accts Pay",
        "Ret Earn",
        "Rent Exp"
       ]
      },
      "sr0c2": {
       "answer": 0
      },
      "sr0a2": {
       "answer": "N/A",
       "options": [
        "N/A",
        "Cash",
        "Tools",
        "Accts Pay",
        "Ret Earn",
        "Rent Exp"
       ]
      },
      "sr0c3": {
       "answer": -1200
      },
      "sr0a3": {
       "answer": "Ret Earn",
       "options": [
        "N/A",
        "Cash",
        "Tools",
        "Accts Pay",
        "Ret Earn",
        "Rent Exp"
       ]
      },
      "sr0c4": {
       "answer": 0
      },
      "sr0a4": {
       "answer": "N/A",
       "options": [
        "N/A",
        "Cash",
        "Tools",
        "Accts Pay",
        "Ret Earn",
        "Rent Exp"
       ]
      },
      "sr0c5": {
       "answer": 1200
      },
      "sr0a5": {
       "answer": "Rent Exp",
       "options": [
        "N/A",
        "Cash",
        "Tools",
        "Accts Pay",
        "Ret Earn",
        "Rent Exp"
       ]
      },
      "sr0c6": {
       "answer": -1200
      },
      "sr1c0": {
       "answer": 0
      },
      "sr1a0": {
       "answer": "N/A",
       "options": [
        "N/A",
        "Cash",
        "Tools",
        "Accts Pay",
        "Ret Earn",
        "Rent Exp"
       ]
      },
      "sr1c1": {
       "answer": 900
      },
      "sr1a1": {
       "answer": "Tools",
       "options": [
        "N/A",
        "Cash",
        "Tools",
        "Accts Pay",
        "Ret Earn",
        "Rent Exp"
       ]
      },
      "sr1c2": {
       "answer": 900
      },
      "sr1a2": {
       "answer": "Accts Pay",
       "options": [
        "N/A",
        "Cash",
        "Tools",
        "Accts Pay",
        "Ret Earn",
        "Rent Exp"
       ]
      },
      "sr1c3": {
       "answer": 0
      },
      "sr1a3": {
       "answer": "N/A",
       "options": [
        "N/A",
        "Cash",
        "Tools",
        "Accts Pay",
        "Ret Earn",
        "Rent Exp"
       ]
      },
      "sr1c4": {
       "answer": 0
      },
      "sr1a4": {
       "answer": "N/A",
       "options": [
        "N/A",
        "Cash",
        "Tools",
        "Accts Pay",
        "Ret Earn",
        "Rent Exp"
       ]
      },
      "sr1c5": {
       "answer": 0
      },
      "sr1a5": {
       "answer": "N/A",
       "options": [
        "N/A",
        "Cash",
        "Tools",
        "Accts Pay",
        "Ret Earn",
        "Rent Exp"
       ]
      },
      "sr1c6": {
       "answer": 0
      }
     }
    }
   ]
  },
  {
   "id": "Adjusting",
   "caption": "End-of-period adjustments",
   "problems": [
    {
     "name": "[AI#6] Straight-line depreciation",
     "label": "generated",
     "howto": "depreciation",
     "steps": [
      {
       "say": "Depreciable cost = 6,400 − 400 = 6,000; 6,000 ÷ 4 = <strong>$1,500</strong> a year <span class=\"star\">(*)</span>",
       "fill": {
        "dep": 1500
       }
      },
      {
       "say": "Two years = 3,000; 6,400 − 3,000 = <strong>$3,400</strong>",
       "fill": {
        "bv": 3400
       }
      }
     ],
     "keys": [
      {
       "keys": [
        6000,
        "÷",
        4,
        "="
       ],
       "meaning": "yearly depreciation (6,000 = 6,400 − 400)",
       "value": 1500
      },
      {
       "keys": [
        6400,
        "−",
        3000,
        "="
       ],
       "meaning": "book value after 2 years",
       "value": 3400
      }
     ],
     "body": "<p>The shop bought a wheel-truing stand for $6,400. It should last 4 years and then sell for $400.</p>\n<table class=\"answers\"><tbody><tr><td>Depreciation each year</td><td>$ {{box:dep}}</td></tr><tr><td>Book value after 2 years</td><td>$ {{box:bv}}</td></tr></tbody></table>",
     "fields": {
      "dep": {
       "answer": 1500,
       "cls": "mid"
      },
      "bv": {
       "answer": 3400,
       "cls": "mid"
      }
     }
    },
    {
     "name": "[AI#7] TWIST: prepaid tune-ups",
     "label": "generated",
     "howto": "entry",
     "steps": [
      {
       "say": "Each tune-up is 1,800 ÷ 6 = 300; two are done, so <strong>$600</strong> is earned.",
       "fill": {
        "earned": 600
       }
      },
      {
       "say": "The shop still owes four tune-ups: 1,800 − 600 = <strong>$1,200</strong> stays a liability.",
       "fill": {
        "left": 1200
       }
      }
     ],
     "keys": [
      {
       "keys": [
        1800,
        "÷",
        6,
        "×",
        2,
        "="
       ],
       "meaning": "revenue earned",
       "value": 600
      }
     ],
     "body": "<p>A customer paid $1,800 in advance for six monthly tune-ups. Two tune-ups are done by month end.</p>\n<table class=\"answers\"><tbody><tr><td>Revenue earned so far</td><td>$ {{box:earned}}</td></tr><tr><td>Unearned revenue left</td><td>$ {{box:left}}</td></tr></tbody></table>",
     "fields": {
      "earned": {
       "answer": 600,
       "cls": "mid"
      },
      "left": {
       "answer": 1200,
       "cls": "mid"
      }
     }
    }
   ]
  }
 ]
};
