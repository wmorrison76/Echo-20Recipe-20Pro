import React, { useEffect, useMemo, useRef, useState } from 'react';
import RightSidebar from './RightSidebar';
import ImageEditorModal from './ImageEditorModal';
import NutritionLabel from './NutritionLabel';
import { Save, Image as ImageIcon, Settings, PlusCircle, MinusCircle, Menu, Plus, Minus, Bold, Italic, Underline, Sun, Moon, Scale, NotebookPen, ArrowLeftRight, CircleDollarSign, Share2, FileDown, Printer } from 'lucide-react';

const RecipeInputPage = () => {
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState([{ qty: '', unit: '', item: '', prep: '', yield: '', cost: '' }]);
  const historyRef = useRef<any[]>([]);
  const futureRef = useRef<any[]>([]);
  const [directions, setDirections] = useState('1. ');
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedFontSize, setSelectedFontSize] = useState('14px');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const allergenManualRef = React.useRef(false);
  const handleAllergensChange = (a: string[]) => { allergenManualRef.current = true; setSelectedAllergens(a); };
  const [selectedNationality, setSelectedNationality] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedRecipeType, setSelectedRecipeType] = useState<string[]>([]);
  const [selectedPrepMethod, setSelectedPrepMethod] = useState<string[]>([]);
  const [selectedCookingEquipment, setSelectedCookingEquipment] = useState<string[]>([]);
  const [selectedRecipeAccess, setSelectedRecipeAccess] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState('USD');
  const [currentUnits, setCurrentUnits] = useState<'Imperial'|'Metric'>('Imperial');
  const [yieldQty, setYieldQty] = useState<number>(6);
  const [yieldUnit, setYieldUnit] = useState<string>('QTS');
  const [portionCount, setPortionCount] = useState<number>(6);
  const [portionUnit, setPortionUnit] = useState<string>('OZ');
  const [nutrition, setNutrition] = useState<any | null>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionError, setNutritionError] = useState<string | null>(null);
  const [nutritionPerServing, setNutritionPerServing] = useState(true);
  const dirRef = React.useRef<HTMLDivElement | null>(null);
  const [cookTime, setCookTime] = useState<string>('');
  const [cookTemp, setCookTemp] = useState<string>('');

  const getCurrencySymbol = (c: string) => (c==='EUR')?'€':(c==='GBP')?'£':(c==='JPY')?'¥':'$';
  const calculateTotalCost = () => ingredients.reduce((s, r) => s + (parseFloat(String(r.cost).replace(/[$€£¥,\s]/g,''))||0), 0);
  const calculatePortionCost = () => { const t = calculateTotalCost(); const n = portionCount>0?portionCount:1; return t/n; };

  const detectAllergensFromIngredients = (rows: { item: string }[]) => {
    const text = rows.map(r => r.item).join(' ').toLowerCase();
    const s = new Set<string>();
    if (/milk|cream|butter|cheese|half-?and-?half|yogurt|whey/.test(text)) s.add('Dairy');
    if (/flour|wheat|barley|rye|bread|pasta|cracker/.test(text)) s.add('Gluten');
    if (/egg\b|eggs\b|egg yolk|egg white/.test(text)) s.add('Eggs');
    if (/peanut/.test(text)) s.add('Peanuts');
    if (/almond|walnut|pecan|cashew|pistachio|hazelnut|macadamia/.test(text)) s.add('Nuts');
    if (/sesame/.test(text)) s.add('Sesame');
    if (/soy\b|soybean|soy sauce|tofu|edamame/.test(text)) s.add('Soy');
    if (/clam|shrimp|crab|lobster|scallop|oyster/.test(text)) s.add('Shellfish');
    if (/cod|salmon|tuna|anchov|trout|halibut|haddock|sardine/.test(text)) s.add('Fish');
    return Array.from(s);
  };
  useEffect(()=>{ if(!allergenManualRef.current) setSelectedAllergens(detectAllergensFromIngredients(ingredients as any)); },[ingredients]);

  const inputClass = `border p-3 rounded-lg text-sm transition-all focus:shadow-md focus:ring-2 ${isDarkMode ? 'bg-black/50 border-cyan-400/50 text-cyan-300 focus:ring-cyan-400/30 shadow-none' : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-400/30 focus:border-blue-400 shadow-md'}`;

  React.useEffect(()=>{ const el = dirRef.current; if (!el) return; if (document.activeElement !== el && el.textContent !== directions) el.textContent = directions; }, [directions]);

  // Autosave + simple versions
  const serialize = () => ({ recipeName, ingredients, directions, isDarkMode, yieldQty, yieldUnit, portionCount, portionUnit, cookTime, cookTemp, selectedAllergens, selectedNationality, selectedCourses, selectedRecipeType, selectedPrepMethod, selectedCookingEquipment, selectedRecipeAccess, image });
  const restore = (s: any) => {
    if (!s) return; setRecipeName(s.recipeName||''); setIngredients(s.ingredients||[{qty:'',unit:'',item:'',prep:'',yield:'',cost:''}]); setDirections(s.directions||'1. ');
    setIsDarkMode(!!s.isDarkMode); setYieldQty(s.yieldQty||0); setYieldUnit(s.yieldUnit||'QTS'); setPortionCount(s.portionCount||1); setPortionUnit(s.portionUnit||'OZ'); setCookTime(s.cookTime||''); setCookTemp(s.cookTemp||''); setSelectedAllergens(s.selectedAllergens||[]); setSelectedNationality(s.selectedNationality||[]); setSelectedCourses(s.selectedCourses||[]); setSelectedRecipeType(s.selectedRecipeType||[]); setSelectedPrepMethod(s.selectedPrepMethod||[]); setSelectedCookingEquipment(s.selectedCookingEquipment||[]); setSelectedRecipeAccess(s.selectedRecipeAccess||[]); setImage(s.image||null);
  };
  const pushHistory = (snap: any) => { historyRef.current.push(snap); if (historyRef.current.length>50) historyRef.current.shift(); localStorage.setItem('recipe:versions', JSON.stringify(historyRef.current)); };
  useEffect(()=>{
    const saved = localStorage.getItem('recipe:draft'); if (saved) try { restore(JSON.parse(saved)); } catch {}
    const versions = localStorage.getItem('recipe:versions'); if (versions) try { historyRef.current = JSON.parse(versions)||[]; } catch {}
    // URL share restore
    if (location.hash.startsWith('#r=')) try { const data = JSON.parse(atob(decodeURIComponent(location.hash.slice(3)))); restore(data); } catch {}
  },[]);
  useEffect(()=>{ const handler = (e: any) => { if (e?.detail?.image) setImage(e.detail.image); setShowImagePopup(true); }; window.addEventListener('openImageEditor', handler as any); return ()=>window.removeEventListener('openImageEditor', handler as any); },[]);
  useEffect(()=>{ const id = setTimeout(()=>{ const s = serialize(); localStorage.setItem('recipe:draft', JSON.stringify(s)); }, 600); return ()=>clearTimeout(id); }, [recipeName, ingredients, directions, isDarkMode, yieldQty, yieldUnit, portionCount, portionUnit, cookTime, cookTemp, selectedAllergens, selectedNationality, selectedCourses, selectedRecipeType, selectedPrepMethod, selectedCookingEquipment, selectedRecipeAccess, image]);
  useEffect(()=>{ const t = setTimeout(()=> setIsRightSidebarCollapsed(true), 450); return ()=> clearTimeout(t); }, []);

  useEffect(()=>{
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); const s=serialize(); pushHistory({ ...s, ts: Date.now() }); }
      if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z'){ e.preventDefault(); const prev = historyRef.current.pop(); if (prev){ futureRef.current.push(serialize()); restore(prev); } }
      if ((e.ctrlKey||e.metaKey) && e.shiftKey && e.key.toLowerCase()==='z'){ e.preventDefault(); const next = futureRef.current.pop(); if (next){ historyRef.current.push(serialize()); restore(next); } }
    };
    window.addEventListener('keydown', onKey); return ()=>window.removeEventListener('keydown', onKey);
  },[]);

  // Keyboard nav in grid
  const onGridKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement; const row = Number(target.dataset.row); const col = Number(target.dataset.col); if (Number.isNaN(row)||Number.isNaN(col)) return;
    const move = (r:number,c:number)=>{
      const next = document.querySelector<HTMLInputElement>(`input[data-row="${r}"][data-col="${c}"]`); next?.focus(); next?.select();
    };
    if (e.key==='ArrowRight') { e.preventDefault(); move(row, col+1); }
    if (e.key==='ArrowLeft') { e.preventDefault(); move(row, col-1); }
    if (e.key==='ArrowDown' || e.key==='Enter') { e.preventDefault(); move(row+1, col); }
    if (e.key==='ArrowUp') { e.preventDefault(); move(row-1, col); }
  };

  // Unit + currency conversions
  const convertUnits = () => {
    const alias = (u:string) => {
      const k = u.toUpperCase();
      if (k.startsWith('TABLESPO')) return 'TBSP';
      if (k.startsWith('TEASPO')) return 'TSP';
      if (k==='TSP' || k==='TEASPOON' || k==='TEASPOONS') return 'TSP';
      if (k==='TBSP' || k==='TABLESPOON' || k==='TABLESPOONS') return 'TBSP';
      return k;
    };
    const map: Record<string, {unit:string, f:(n:number)=>number}> = {
      OZ: { unit: 'G', f:(n)=>n*28.3495 }, LBS:{ unit:'KG', f:(n)=>n*0.453592 }, QTS:{ unit:'L', f:(n)=>n*0.946353 }, TSP:{ unit:'ML', f:(n)=>n*4.92892 }, TBSP:{ unit:'ML', f:(n)=>n*14.7868 }
    };
    if (currentUnits==='Imperial') {
      setIngredients(ingredients.map(r=>{ const n=parseFloat(r.qty); const key=alias(r.unit); const cv=map[key]; if (!isNaN(n)&&cv){ return { ...r, qty:String(Number((cv.f(n))).toFixed(2)), unit:cv.unit }; } return r; }));
      setCurrentUnits('Metric');
    } else {
      const back: Record<string,{unit:string,f:(n:number)=>number}> = { G:{unit:'OZ',f:(n)=>n/28.3495}, KG:{unit:'LBS',f:(n)=>n/0.453592}, L:{unit:'QTS',f:(n)=>n/0.946353}, ML:{unit:'TSP',f:(n)=>n/4.92892} };
      setIngredients(ingredients.map(r=>{ const n=parseFloat(r.qty); const key=alias(r.unit); const cv=back[key]; if (!isNaN(n)&&cv){ return { ...r, qty:String(Number((cv.f(n))).toFixed(2)), unit:cv.unit }; } return r; }));
      setCurrentUnits('Imperial');
    }
  };
  const cycleCurrency = () => {
    const order = ['USD','EUR','GBP','JPY']; const rates: Record<string,number> = { USD:1, EUR:0.93, GBP:0.82, JPY:155 };
    const i = order.indexOf(currentCurrency); const next = order[(i+1)%order.length];
    const from = rates[currentCurrency]; const to = rates[next]; const fx = to/from;
    setIngredients(ingredients.map(r=>{ const n=parseFloat(String(r.cost).replace(/[$€£¥,\s]/g,'')); if (isNaN(n)) return r; return { ...r, cost: (n*fx).toFixed(2) }; }));
    setCurrentCurrency(next);
  };
  const scaleRecipe = () => {
    const target = Number(prompt('Scale to how many portions?', String(portionCount))||portionCount); if (!target || target<=0) return;
    const factor = target/(portionCount||1); setIngredients(ingredients.map(r=>{ const n=parseFloat(r.qty); return isNaN(n)? r : { ...r, qty: (n*factor).toFixed(2) }; })); setPortionCount(target);
  };

  const exportCSV = () => {
    const rows = [['qty','unit','item','prep','yield','cost'], ...ingredients.map(r=>[r.qty,r.unit,r.item,r.prep,r.yield,r.cost])];
    const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${recipeName||'recipe'}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  const shareLink = () => { const data = serialize(); const url = `${location.origin}${location.pathname}#r=${encodeURIComponent(btoa(JSON.stringify(data)))}`; navigator.clipboard.writeText(url); alert('Share link copied to clipboard'); };

  const analyzeNutrition = async () => {
    try {
      setNutritionLoading(true); setNutritionError(null);
      const ingr = ingredients.filter(r=>r.qty || r.item).map(r=>[r.qty,r.unit,r.item,r.prep].filter(Boolean).join(' '));
      const res = await fetch('/api/nutrition/analyze',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title: recipeName||'Recipe', ingr, yieldQty, yieldUnit })});
      if (!res.ok) throw new Error((await res.json().catch(()=>({})))?.error || `Request failed: ${res.status}`);
      const data = await res.json(); setNutrition(data);
    } catch(e:any){ setNutritionError(e.message || 'Unable to analyze nutrition'); } finally { setNutritionLoading(false); }
  };

  return (
    <div className={`relative w-full h-screen transition-all duration-300 ${isDarkMode ? 'bg-black text-cyan-400' : 'bg-gray-50 text-gray-900'}`}>
      <div className={`hidden ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-black to-blue-900' : 'bg-gradient-to-br from-gray-50 to-white'}`}>
        <div className="w-full px-0 py-0 flex justify-between items-center">
          <div className="p-0.5">
            <div className="h-12 w-auto flex items-center">
              <img src="https://cdn.builder.io/api/v1/image/assets%2Fc1bbdbb47a354d9ebc60f96efcabf821%2F544726159ed9468bb33ed78346c7b51b?format=webp&width=400" alt="Echo Recipe Pro" className="h-10 md:h-12 lg:h-14 w-auto select-none" draggable={false} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-3 items-center">
              <button onClick={()=>setIsRightSidebarCollapsed(v=>!v)} title="Toggle Tools" className="p-1 rounded hover:bg-black/10"><Menu className="w-5 h-5"/></button>
              <button onClick={scaleRecipe} title="Scale Recipe" className="p-1 rounded hover:bg-black/10"><Scale className="w-5 h-5"/></button>
              <button onClick={()=>{ pushHistory({ ...serialize(), ts: Date.now() }); alert('Snapshot saved'); }} title="Save Version" className="p-1 rounded hover:bg-black/10"><NotebookPen className="w-5 h-5"/></button>
              <button onClick={convertUnits} title="Convert Units" className="p-1 rounded hover:bg-black/10"><ArrowLeftRight className="w-5 h-5"/></button>
              <button onClick={cycleCurrency} title="Change Currency" className="p-1 rounded hover:bg-black/10"><CircleDollarSign className="w-5 h-5"/></button>
              <button onClick={()=>setIsRightSidebarCollapsed(!isRightSidebarCollapsed)} title="Recipe Tools" className="p-1 rounded hover:bg-black/10"><Settings className="w-5 h-5"/></button>
              <div className="flex items-center gap-1 ml-2">
                <Sun className="w-4 h-4" />
                <button onClick={()=>setIsDarkMode(!isDarkMode)} className={`w-8 h-4 rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <Moon className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="pt-24 h-full overflow-y-auto">
        <div className="w-full px-6 space-y-6 pb-8">
          <div className="flex justify-end items-center gap-3">
            <button onClick={()=>setIsRightSidebarCollapsed(v=>!v)} title="Toggle Tools" className="p-1 rounded hover:bg-black/10"><Menu className="w-5 h-5"/></button>
            <button onClick={scaleRecipe} title="Scale Recipe" className="p-1 rounded hover:bg-black/10"><Scale className="w-5 h-5"/></button>
            <button onClick={()=>{ pushHistory({ ...serialize(), ts: Date.now() }); alert('Snapshot saved'); }} title="Save Version" className="p-1 rounded hover:bg-black/10"><NotebookPen className="w-5 h-5"/></button>
            <button onClick={convertUnits} title="Convert Units" className="p-1 rounded hover:bg-black/10"><ArrowLeftRight className="w-5 h-5"/></button>
            <button onClick={cycleCurrency} title="Change Currency" className="p-1 rounded hover:bg-black/10"><CircleDollarSign className="w-5 h-5"/></button>
            <div className="flex items-center gap-1 ml-2">
              <Sun className="w-4 h-4" />
              <button onClick={()=>setIsDarkMode(!isDarkMode)} className={`w-8 h-4 rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end gap-4">
            <div className={`w-2/3 border p-4 rounded-xl shadow-lg ${isDarkMode ? 'border-cyan-400/30 bg-black/50 shadow-cyan-400/20' : 'border-gray-200 bg-white shadow-gray-200/50'} backdrop-blur-sm`}>
              <input type="text" maxLength={50} value={recipeName} onChange={(e)=>setRecipeName(e.target.value)} placeholder="RECIPE NAME" className={`w-full text-lg font-semibold uppercase bg-transparent focus:outline-none transition-colors ${isDarkMode ? 'text-cyan-400 placeholder-cyan-600' : 'text-gray-900 placeholder-gray-500'} focus:placeholder-gray-400`} />
            </div>
            <div className={`border rounded-xl w-1/3 flex flex-col justify-end shadow-lg ${isDarkMode ? 'bg-red-900/20 border-red-400/30 shadow-red-400/20' : 'bg-red-50/80 border-red-200 shadow-gray-200/50'} backdrop-blur-sm`} style={{ minHeight: '3rem' }}>
              <div className="p-3 flex flex-col">
                <div className={`font-semibold text-xs mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>ALLERGENS</div>
                {selectedAllergens.length ? (
                  <div className={`grid grid-cols-5 gap-1 text-xs ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{selectedAllergens.map(a=> <div key={a}>{a}</div>)}</div>
                ) : (
                  <div className={`text-xs italic ${isDarkMode ? 'text-red-500' : 'text-red-400'}`}>No allergens selected</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 mt-1">
            <div className="w-2/3 flex flex-col space-y-6" style={{ minHeight: '18rem' }}>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2"><span className={`font-bold ${isDarkMode ? 'text-cyan-300' : 'text-black'}`}>COOK TIME:</span><input value={cookTime} onChange={(e)=>setCookTime(e.target.value)} placeholder="2:30" className={`w-24 p-3 ${inputClass}`} /></div>
                  <div className="flex items-center gap-2"><span className={`font-bold ${isDarkMode ? 'text-cyan-300' : 'text-black'}`}>COOK TEMP:</span><input value={cookTemp} onChange={(e)=>setCookTemp(e.target.value)} placeholder="350F" className={`w-24 p-3 ${inputClass}`} /></div>
                </div>
                <div className={`text-sm space-y-2 ${isDarkMode ? 'text-cyan-300' : 'text-gray-700'}`}>
                  <div className="flex items-center gap-4">
                    <span><span className="font-bold">FULL RECIPE:</span> {getCurrencySymbol(currentCurrency)}{calculateTotalCost().toFixed(2)}</span>
                    <span className="flex items-center gap-1"><span className="font-bold">YIELD:</span><input type="number" value={yieldQty} onChange={(e)=>setYieldQty(Math.max(0, Number(e.target.value)))} className={`w-16 px-2 py-1 border rounded text-sm ${isDarkMode ? 'bg-black/50 border-cyan-400/50 text-cyan-300' : 'bg-white border-gray-300'}`} /><input value={yieldUnit} onChange={(e)=>setYieldUnit(e.target.value.toUpperCase())} className={`w-14 px-2 py-1 border rounded text-sm uppercase ${isDarkMode ? 'bg-black/50 border-cyan-400/50 text-cyan-300' : 'bg-white border-gray-300'}`} /></span>
                    <span><span className="font-bold">RECIPE ACCESS:</span> {selectedRecipeAccess.length ? selectedRecipeAccess.join(', ').toUpperCase() : 'NONE'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><span className="font-bold">PORTION:</span><input type="number" value={portionCount} onChange={(e)=>setPortionCount(Math.max(1, Number(e.target.value)))} className={`w-16 px-2 py-1 border rounded text-sm ${isDarkMode ? 'bg-black/50 border-cyan-400/50 text-cyan-300' : 'bg-white border-gray-300'}`} /></span>
                    <span className="flex items-center gap-1"><span className="font-bold">UNIT:</span><input value={portionUnit} onChange={(e)=>setPortionUnit(e.target.value.toUpperCase())} className={`w-14 px-2 py-1 border rounded text-sm uppercase ${isDarkMode ? 'bg-black/50 border-cyan-400/50 text-cyan-300' : 'bg-white border-gray-300'}`} /></span>
                    <span><span className="font-bold">PORTION COST:</span> {getCurrencySymbol(currentCurrency)}{calculatePortionCost().toFixed(2)}</span>
                    <span title="Theoretical Yield"><span className="font-bold">Ψ:</span> {yieldQty} {yieldUnit}</span>
                  </div>
                </div>
              </div>
              <div className={`border rounded-xl p-4 h-full shadow-lg ${isDarkMode ? 'bg-blue-900/20 border-blue-400/30 shadow-blue-400/20' : 'bg-blue-50/80 border-blue-200 shadow-gray-200/50'} backdrop-blur-sm`}>
                <div className={`font-semibold text-sm mb-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>MODIFIERS</div>
                {(selectedNationality.length || selectedCourses.length || selectedRecipeType.length || selectedPrepMethod.length || selectedCookingEquipment.length) ? (
                  <div className={`grid grid-cols-7 gap-1 text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    {selectedNationality.map((x)=><div key={x}>{x}</div>)}
                    {selectedCourses.map((x)=><div key={x}>{x}</div>)}
                    {selectedRecipeType.map((x)=><div key={x}>{x}</div>)}
                    {selectedPrepMethod.map((x)=><div key={x}>{x}</div>)}
                    {selectedCookingEquipment.map((x)=><div key={x}>{x}</div>)}
                  </div>
                ) : (
                  <div className={`text-xs italic ${isDarkMode ? 'text-blue-500' : 'text-blue-400'}`}>No modifiers selected</div>
                )}
              </div>
            </div>

            <div className="w-1/3">
              <div className="flex-shrink-0" style={{ width: '17rem', height: '17rem' }}>
                {image ? (
                  <img src={image} alt="Recipe" className="w-full h-full object-contain rounded-md bg-white" style={{ border: '0.5px solid #000', boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)' }} />
                ) : (
                  <div className="w-full h-full bg-gray-100 border rounded-md flex items-center justify-center"><span className="text-xs text-gray-400">Recipe Image</span></div>
                )}
              </div>
            </div>
          </div>
          <div className={`ingredients-card backdrop-blur-sm rounded-2xl p-6 border ${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-100'}`}>
            <h3 className={`font-bold text-xl mb-6 ${isDarkMode ? 'text-cyan-400' : 'text-gray-900'}`}>INGREDIENTS</h3>
            <div className="ingredients-grid mt-2 mb-1">
              {['QTY','UNIT','ITEM','PREP','YIELD %','COST'].map((h,i)=> <div key={i} className={`text-xs font-medium ${isDarkMode? 'text-cyan-400':'text-black'} ${h==='COST'?'text-right':''}`}>{h}</div>)}
            </div>
            <div className="space-y-2 ingredient-grid">
              {ingredients.map((line, index) => {
                const qtyErr = !!line.qty && isNaN(Number(String(line.qty).replace(/[^0-9.\-]/g,'')));
                const yieldErr = !!line.yield && isNaN(Number(String(line.yield).replace(/[^0-9.\-]/g,'')));
                const costNum = Number(String(line.cost).replace(/[$€£¥,\s]/g,''));
                return (
                <div key={index} className="ingredients-grid ingredient-row">
                  <input data-row={index} data-col={0} onKeyDown={onGridKeyDown} aria-invalid={qtyErr} title={qtyErr? 'Enter a number':''} className={`${inputClass} ${qtyErr? 'ring-2 ring-red-500 border-red-400':''}`} value={line.qty} onChange={(e)=>{ const v=[...ingredients]; v[index].qty=e.target.value; setIngredients(v); }} />
                  <input data-row={index} data-col={1} onKeyDown={onGridKeyDown} className={inputClass} value={line.unit} onChange={(e)=>{ const v=[...ingredients]; v[index].unit=e.target.value.toUpperCase(); setIngredients(v); }} />
                  <input data-row={index} data-col={2} onKeyDown={onGridKeyDown} className={inputClass} value={line.item} onChange={(e)=>{ const v=[...ingredients]; v[index].item=e.target.value; setIngredients(v); }} />
                  <input data-row={index} data-col={3} onKeyDown={onGridKeyDown} className={inputClass} value={line.prep} onChange={(e)=>{ const v=[...ingredients]; v[index].prep=e.target.value; setIngredients(v); }} />
                  <input data-row={index} data-col={4} onKeyDown={onGridKeyDown} aria-invalid={yieldErr} title={yieldErr? 'Enter a number':''} className={`${inputClass} ${yieldErr? 'ring-2 ring-red-500 border-red-400':''}`} value={line.yield} onChange={(e)=>{ const v=[...ingredients]; v[index].yield=e.target.value; setIngredients(v); }} />
                  <input data-row={index} data-col={5} onKeyDown={onGridKeyDown} className={`border p-3 rounded-lg text-sm text-right ${isDarkMode ? 'bg-black/50 border-cyan-400/50 text-cyan-300' : 'bg-white border-gray-200 text-black'}`} value={line.cost} title={isNaN(costNum)? 'Enter a number':''} aria-invalid={isNaN(costNum)} onChange={(e)=>{ const v=[...ingredients]; v[index].cost=e.target.value; setIngredients(v); }} />
                </div>);
              })}
              <div className="flex items-center justify-start gap-2 mt-3">
                <button onClick={()=>setIngredients([...ingredients, { qty:'', unit:'', item:'', prep:'', yield:'', cost:'' }])} className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800"><PlusCircle className="w-4 h-4"/></button>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-cyan-400' : 'text-black'}`}>INGREDIENT</span>
                <button onClick={()=>ingredients.length>1 && setIngredients(ingredients.slice(0,-1))} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"><MinusCircle className="w-4 h-4"/></button>
              </div>
            </div>
          </div>

          <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 ${isDarkMode ? 'bg-gray-800/80 border-gray-700' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold text-xl ${isDarkMode ? 'text-cyan-400' : 'text-gray-900'}`}>DIRECTIONS</h3>
              <div className="flex gap-3">
                <button title="Add Image" className={`p-2 rounded-lg transition-all hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : ''}`} onClick={()=>setShowImagePopup(true)}><ImageIcon className={`w-5 h-5 ${isDarkMode? 'text-cyan-400':'text-gray-600'}`}/></button>
                <button title="Bold" className={`p-2 rounded-lg transition-all hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : ''}`} onClick={()=>document.execCommand('bold',false)}><Bold className={`w-5 h-5 ${isDarkMode? 'text-cyan-400':'text-gray-600'}`}/></button>
                <button title="Italic" className={`p-2 rounded-lg transition-all hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : ''}`} onClick={()=>document.execCommand('italic',false)}><Italic className={`w-5 h-5 ${isDarkMode? 'text-cyan-400':'text-gray-600'}`}/></button>
                <button title="Underline" className={`p-2 rounded-lg transition-all hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : ''}`} onClick={()=>document.execCommand('underline',false)}><Underline className={`w-5 h-5 ${isDarkMode? 'text-cyan-400':'text-gray-600'}`}/></button>
                <select className={`px-3 py-2 text-sm border rounded-lg ${isDarkMode ? 'bg-black/50 border-cyan-400/50 text-cyan-300' : 'bg-white border-gray-200 text-gray-900'}`} value={selectedFont} onChange={(e)=>{ setSelectedFont(e.target.value); }}>
                  <option>Arial</option><option>Times</option><option>Helvetica</option><option>Georgia</option>
                </select>
                <select className={`px-3 py-2 text-sm border rounded-lg ${isDarkMode ? 'bg-black/50 border-cyan-400/50 text-cyan-300' : 'bg-white border-gray-200 text-gray-900'}`} value={selectedFontSize} onChange={(e)=>setSelectedFontSize(e.target.value)}>
                  {['12px','14px','16px','18px','20px'].map(s=> <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div id="directions-textarea" contentEditable suppressContentEditableWarning ref={dirRef} className={`w-full border p-4 rounded-xl shadow-sm transition-all focus:shadow-md focus:ring-2 resize-none min-h-[200px] overflow-y-auto ${isDarkMode ? 'bg-black/50 border-cyan-400/50 text-cyan-300 focus:ring-cyan-400/30' : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-400/30 focus:border-blue-400'}`} style={{ lineHeight:'1.5', whiteSpace:'pre-wrap', fontFamily:selectedFont, fontSize:selectedFontSize }} onInput={(e)=> setDirections((e.target as HTMLDivElement).textContent || '')}></div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-sm">
              <button onClick={()=>{ pushHistory({ ...serialize(), ts: Date.now() }); }} className="flex items-center gap-2 text-gray-700 hover:text-black"><Save className="w-5 h-5"/>Save Snapshot</button>
              <button onClick={exportCSV} className="flex items-center gap-1 text-gray-700 hover:text-black"><FileDown className="w-4 h-4"/>CSV</button>
              <button onClick={()=>window.print()} className="flex items-center gap-1 text-gray-700 hover:text-black"><Printer className="w-4 h-4"/>Print</button>
              <button onClick={shareLink} className="flex items-center gap-1 text-gray-700 hover:text-black"><Share2 className="w-4 h-4"/>Share</button>
            </div>
            <button onClick={analyzeNutrition} disabled={nutritionLoading} className={`text-xs px-3 py-2 rounded ${isDarkMode ? 'border border-cyan-400/50 hover:bg-cyan-900/20 text-cyan-300' : 'border border-gray-400 hover:bg-gray-100 text-gray-800'}`}>{nutritionLoading? 'Analyzing…':'Generate Nutrition Label'}</button>
          </div>

          <div className={`mt-3 rounded-2xl p-6 border ${isDarkMode ? 'bg-gray-900/50 border-cyan-400/30' : 'bg-white/80 border-gray-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-bold text-xl ${isDarkMode ? 'text-cyan-400' : 'text-gray-900'}`}>NUTRITION</h3>
              {nutrition && (
                <div className="flex gap-2 text-xs">
                  <button onClick={()=>setNutritionPerServing(true)} className={`${nutritionPerServing ? 'bg-blue-600 text-white' : ''} px-2 py-1 rounded border`}>Per Serving</button>
                  <button onClick={()=>setNutritionPerServing(false)} className={`${!nutritionPerServing ? 'bg-blue-600 text-white' : ''} px-2 py-1 rounded border`}>Whole Recipe</button>
                </div>
              )}
            </div>
            {!nutrition && !nutritionLoading && !nutritionError && (<div className={`${isDarkMode ? 'text-cyan-400/70' : 'text-gray-500'}`}>Click "Generate Nutrition Label" to analyze this recipe.</div>)}
            {nutritionError && (<div className="text-red-500 text-sm">{nutritionError}</div>)}
            {nutrition && (
              <div className="flex flex-col md:flex-row gap-4">
                <NutritionLabel data={nutrition} servings={portionCount || 1} perServing={nutritionPerServing} />
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm self-start">
                  <div><span className="font-semibold">Yield:</span> {yieldQty} {yieldUnit}</div>
                  <div><span className="font-semibold">Servings:</span> {portionCount}</div>
                  <div><span className="font-semibold">Unit:</span> {portionUnit}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <RightSidebar
        isCollapsed={isRightSidebarCollapsed}
        onToggle={()=>setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
        selectedAllergens={selectedAllergens}
        onAllergensChange={handleAllergensChange}
        selectedNationality={selectedNationality}
        onNationalityChange={setSelectedNationality}
        selectedCourses={selectedCourses}
        onCoursesChange={setSelectedCourses}
        selectedRecipeType={selectedRecipeType}
        onRecipeTypeChange={setSelectedRecipeType}
        selectedPrepMethod={selectedPrepMethod}
        onPrepMethodChange={setSelectedPrepMethod}
        selectedCookingEquipment={selectedCookingEquipment}
        onCookingEquipmentChange={setSelectedCookingEquipment}
        selectedRecipeAccess={selectedRecipeAccess}
        onRecipeAccessChange={setSelectedRecipeAccess}
        image={image}
        onImageChange={setImage}
        onRecipeImport={(data)=>{
          if (data?.title) setRecipeName(String(data.title).toUpperCase());
          if (data?.ingredients?.length){
            const rows = (data.ingredients as string[]).map((s:string)=>{
              const m = s.match(/^\s*([0-9]+(?:\.[0-9]+)?(?:\s+[0-9]+\/[0-9]+)?)?\s*([a-zA-Z]+)?\s*(.*)$/);
              const qty = m?.[1] ? m[1] : ''; const unit = m?.[2] ? m[2].toUpperCase() : ''; const rest = (m?.[3]||'').trim();
              const [item, ...prep] = rest.split(',');
              return { qty, unit, item: item.trim(), prep: prep.join(',').trim(), yield: '', cost: '' };
            });
            setIngredients(rows.length? rows : [{ qty:'', unit:'', item:'', prep:'', yield:'', cost:'' }]);
          }
          if (data?.instructions) setDirections(String(data.instructions));
        }}
      />

      <ImageEditorModal isOpen={showImagePopup} image={image} onClose={()=>setShowImagePopup(false)} onApply={(d)=>setImage(d)} isDarkMode={isDarkMode} />
    </div>
  );
};

export default RecipeInputPage;
