/* Run with:  node cas.test.js   (from this folder) */
const { CAS, CASS } = require('./cas.js');
const run=s=>{try{const r=CASS.run(s);return r.lines.map(l=>l.text+(l.approx?' ≈ '+l.approx:'')).join(' ; ')}catch(e){return 'ERR '+e.message}};
const T=[
['1/3+1/6','1/2'],['2^10','1024'],['sqrt(8)','2·√(2) ≈ 2.8284271247462'],['sqrt(18)+sqrt(2)','4·√(2) ≈ 5.6568542494924'],['(x+1)^2','(x + 1)²'],['expand((x+1)^2)','x² + 2·x + 1'],
['expand((x-2)(x+3))','x² + x − 6'],['factor(x^2-5x+6)','(x − 2)·(x − 3)'],['factor(x^3-x)','x·(x − 1)·(x + 1)'],['factor(360)','2³·3²·5'],
['diff(x^3+2x,x)','3·x² + 2'],['diff(sin(x^2),x)','2·x·cos(x²)'],['diff(x*e^x,x)','x·e^(x) + e^(x)'],['diff(ln(x),x)','1/x'],['diff(1/x,x)','-1/x²'],
['integrate(x^2,x)','x³/3'],['integrate(3x^2+2x+1,x)','x³ + x² + x'],['integrate(sin(x),x)','-cos(x)'],['integrate(x^2,x,0,3)','9'],['integrate(sin(x),x,0,π)','2'],
['integrate(1/x,x)','ln(abs(x))'],['integrate(e^(2x),x)','e^(2·x)/2'],
['solve(x^2-4=0,x)','x = -2 ; x = 2'],['solve(x^2-2=0,x)','x = -√(2) ≈ -1.4142135623731 ; x = √(2) ≈ 1.4142135623731'],['solve(2x+3=7,x)','x = 2'],['solve(x^3-6x^2+11x-6=0,x)','x = 1 ; x = 2 ; x = 3'],
['solve(x^2+1=0,x)','No real solution'],['solve(cos(x)=x,x)','x = 0.73908513321516'],
['sin(π/6)','1/2'],['cos(π/3)','1/2'],['sin(π/4)','√(2)/2 ≈ 0.70710678118655'],['tan(π/4)','1'],['sin(π/12)','√(6)/4 − √(2)/4 ≈ 0.25881904510252'],
['0.1+0.2','0.3'],['sqrt(2)','√(2) ≈ 1.4142135623731'],['π','π ≈ 3.1415926535898'],['e^2','e² ≈ 7.3890560989307'],['5!','120'],['nCr(5,2)','10'],
['a:=3','3'],['a^2+1','10'],['f(x):=x^2+1','Done'],['f(3)','10'],['f(a)','10'],['5→b','5'],['b*2','10'],
['sum(k,k,1,100)','5050'],['limit(sin(x)/x,x,0)','1'],['2x+3x','5·x'],['x*x','x²'],['(x^2-1)/(x-1)','(x² − 1)/(x − 1)'],['-x^2','-x²'],['3/4*x','3·x/4'],
['ln(e)','1'],['ln(1)','0'],['log(1000)','3'],['abs(-5)','5'],['gcd(12,18)','6'],['x+x+x','3·x'],['2(x+3)','2·x + 6'],['sqrt(1/4)','1/2'],['8^(1/3)','2'],['solve(x^2=2x,x)','x = 0 ; x = 2'],
['solve(x^4-5x^2+4=0,x)','x = -2 ; x = -1 ; x = 1 ; x = 2']
];
let bad=0; for(const [i,e] of T){const g=run(i); if(g!==e){bad++;console.log('FAIL',i,'=>',g,'| expected',e)}}
console.log((T.length-bad)+'/'+T.length+' pass');

process.exit(bad ? 1 : 0);
