#!/bin/bash
# Lists names used but never defined, and unused locals, across the joined source. Needs eslint on the PATH.
# Usage: tests/lint.sh   (expected: only indexedDB, sessionStorage and a few unused locals)
D="$(cd "$(dirname "$0")/.." && pwd)"; W="$(mktemp -d)"
cp "$D/tests/eslint.config.js" "$W/"
{ echo "(function(){"; cat "$D/game/2-pokemon-data.js"; for f in 3-engine-1 4-engine-2 5-engine-3 5-engine-4 6-ui-1 7-ui-2 8-ui-3; do echo "/*FILE $f.js*/"; cat "$D/game/$f.js"; echo; done; echo "})();"; } > "$W/all.js"
cd "$W" && eslint --no-warn-ignored -f json all.js 2>/dev/null | node -e '
const r=JSON.parse(require("fs").readFileSync(0,"utf8"))[0]; const src=require("fs").readFileSync("all.js","utf8").split("\n");
const marks=[]; src.forEach((l,i)=>{const m=l.match(/^\/\*FILE (.*)\*\/$/); if(m) marks.push([i+1,m[1]]);});
const loc=n=>{let f="data",b=0; for(const [i,name] of marks) if(n>i){f=name;b=i;} return f+":"+(n-b);};
const seen={}; for(const m of r.messages){ const q=(m.message.match(/\x27(.*?)\x27/)||[0,m.message])[1]; const k=(m.ruleId==="no-undef"?"UNDEF ":m.ruleId==="no-unused-vars"?"UNUSED ":"ERROR ")+q; (seen[k]=seen[k]||[]).push(loc(m.line)); }
for(const [k,v] of Object.entries(seen)) console.log(k, v.slice(0,6).join(" ")+(v.length>6?" …("+v.length+")":""));
console.log("total", r.messages.length);'
rm -rf "$W"
